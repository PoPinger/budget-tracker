"""align schema with models

Revision ID: align_schema_with_models
Revises: fix_users_id_sequence
Create Date: 2026-10-20

Doprowadza bazę do zgodności z modelami (alembic check bez różnic).
Każdy krok sprawdza aktualny stan bazy, bo produkcja była częściowo
poprawiana ręcznie (np. expenses.title została już usunięta).
"""

from alembic import op
import sqlalchemy as sa


revision = "align_schema_with_models"
down_revision = "fix_users_id_sequence"
branch_labels = None
depends_on = None

TIMESTAMP_TABLES = ("budgets", "categories", "expenses")
TIMESTAMP_COLUMNS = ("created_at", "updated_at")

NEW_INDEXES = (
    ("ix_budgets_month", "budgets", ["month"]),
    ("ix_categories_month", "categories", ["month"]),
    ("ix_expenses_expense_date", "expenses", ["expense_date"]),
)

CATEGORY_UNIQUE = "uq_categories_user_id_month_name"
BUDGET_UNIQUE = "uq_budgets_user_id_month"


def _columns(inspector, table: str) -> dict:
    return {column["name"]: column for column in inspector.get_columns(table)}


def _unique_constraints(inspector, table: str) -> dict[str, set[str]]:
    return {
        constraint["name"]: set(constraint["column_names"])
        for constraint in inspector.get_unique_constraints(table)
    }


def _unique_indexes(inspector, table: str) -> dict[str, set[str]]:
    # Unikalne indeksy utworzone ręcznie (CREATE UNIQUE INDEX), bez constraintu.
    return {
        index["name"]: set(index["column_names"])
        for index in inspector.get_indexes(table)
        if index["unique"] and not index.get("duplicates_constraint")
    }


def _abort_on_duplicates(bind) -> None:
    category_duplicates = bind.execute(
        sa.text(
            """
            SELECT user_id, month, name, array_agg(id ORDER BY id) AS ids
            FROM categories
            GROUP BY user_id, month, name
            HAVING count(*) > 1
            ORDER BY user_id, month, name
            """
        )
    ).all()
    budget_duplicates = bind.execute(
        sa.text(
            """
            SELECT user_id, month, array_agg(id ORDER BY id) AS ids
            FROM budgets
            GROUP BY user_id, month
            HAVING count(*) > 1
            ORDER BY user_id, month
            """
        )
    ).all()

    if not category_duplicates and not budget_duplicates:
        return

    lines = [
        f"  categories: user_id={row.user_id}, month={row.month}, name={row.name!r}, ids={list(row.ids)}"
        for row in category_duplicates
    ] + [
        f"  budgets: user_id={row.user_id}, month={row.month}, ids={list(row.ids)}"
        for row in budget_duplicates
    ]
    raise RuntimeError(
        "Migracja przerwana, nic nie zostało zmienione. Te wiersze łamią nowe "
        "ograniczenia unikalności; zmień nazwę lub scal je ręcznie i wdroż ponownie:\n"
        + "\n".join(lines)
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Najpierw sprawdź dane: przy duplikatach przerwij, niczego nie usuwaj.
    _abort_on_duplicates(bind)

    # 2. Pozostałość po starym schemacie: expenses.title (NOT NULL blokował dodawanie wydatków).
    if "title" in _columns(inspector, "expenses"):
        op.drop_column("expenses", "title")

    # 3. Unikalność kategorii per użytkownik i miesiąc zamiast globalnie.
    for name, columns in _unique_constraints(inspector, "categories").items():
        if columns == {"month", "name"} or (
            columns == {"user_id", "month", "name"} and name != CATEGORY_UNIQUE
        ):
            op.drop_constraint(name, "categories", type_="unique")
    for name, columns in _unique_indexes(inspector, "categories").items():
        if columns in ({"month", "name"}, {"user_id", "month", "name"}):
            op.drop_index(name, table_name="categories")
    if CATEGORY_UNIQUE not in _unique_constraints(inspector, "categories"):
        op.create_unique_constraint(CATEGORY_UNIQUE, "categories", ["user_id", "month", "name"])

    # 4. Budżet: jeden na użytkownika i miesiąc (powinien już istnieć po fix_budget_unique_per_user).
    if BUDGET_UNIQUE not in _unique_constraints(inspector, "budgets"):
        op.create_unique_constraint(BUDGET_UNIQUE, "budgets", ["user_id", "month"])

    # 5. Znaczniki czasu z time zone; istniejące wartości traktujemy jako UTC.
    for table in TIMESTAMP_TABLES:
        columns = _columns(inspector, table)
        for column in TIMESTAMP_COLUMNS:
            if not getattr(columns[column]["type"], "timezone", False):
                op.alter_column(
                    table,
                    column,
                    type_=sa.DateTime(timezone=True),
                    existing_type=sa.DateTime(timezone=False),
                    existing_nullable=False,
                    existing_server_default=sa.text("now()"),
                    postgresql_using=f"{column} AT TIME ZONE 'UTC'",
                )

    # 6. categories.name: 100 -> 255 znaków.
    if getattr(_columns(inspector, "categories")["name"]["type"], "length", None) != 255:
        op.alter_column(
            "categories",
            "name",
            type_=sa.String(length=255),
            existing_nullable=False,
        )

    # 7. Brakujące indeksy z modeli.
    for index_name, table, columns in NEW_INDEXES:
        existing = {index["name"] for index in inspector.get_indexes(table)}
        if index_name not in existing:
            op.create_index(index_name, table, columns, unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for index_name, table, _columns_list in NEW_INDEXES:
        existing = {index["name"] for index in inspector.get_indexes(table)}
        if index_name in existing:
            op.drop_index(index_name, table_name=table)

    # Nie skraca danych: jeśli jakaś nazwa ma > 100 znaków, Postgres przerwie downgrade.
    op.alter_column(
        "categories",
        "name",
        type_=sa.String(length=100),
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )

    for table in TIMESTAMP_TABLES:
        for column in TIMESTAMP_COLUMNS:
            op.alter_column(
                table,
                column,
                type_=sa.DateTime(timezone=False),
                existing_type=sa.DateTime(timezone=True),
                existing_nullable=False,
                existing_server_default=sa.text("now()"),
                postgresql_using=f"{column} AT TIME ZONE 'UTC'",
            )

    # Przy kategoriach o tej samej nazwie u różnych użytkowników Postgres przerwie downgrade.
    op.drop_constraint(CATEGORY_UNIQUE, "categories", type_="unique")
    op.create_unique_constraint("uq_categories_month_name", "categories", ["month", "name"])

    # Kolumna wraca jako opcjonalna, żeby nie zablokować dodawania wydatków.
    if "title" not in _columns(inspector, "expenses"):
        op.add_column("expenses", sa.Column("title", sa.String(length=150), nullable=True))
