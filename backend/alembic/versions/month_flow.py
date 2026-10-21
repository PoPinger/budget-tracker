"""month flow: months, incomes, recurring categories

Revision ID: month_flow
Revises: align_schema_with_models
Create Date: 2026-10-21

Dodaje tabele months (wypłata, status miesiąca) i incomes (dodatkowe przychody)
oraz flagę is_recurring w categories i expenses. Istniejące miesiące (z budżetem,
kategoriami lub wydatkami) dostają status active, istniejące kategorie i wydatki
nie są cykliczne. Każdy krok sprawdza aktualny stan bazy; przy nieoczekiwanym
schemacie migracja przerywa się z komunikatem i niczego nie usuwa.
"""

from alembic import op
import sqlalchemy as sa


revision = "month_flow"
down_revision = "align_schema_with_models"
branch_labels = None
depends_on = None

MONTH_COLUMNS = {"id", "user_id", "month", "salary", "status", "closed_at", "created_at", "updated_at"}
INCOME_COLUMNS = {"id", "user_id", "month", "name", "amount", "income_date", "created_at", "updated_at"}
RECURRING_EXPENSE_INDEX = "uq_expenses_recurring_category_id"


def _abort(message: str) -> None:
    raise RuntimeError(f"Migracja month_flow przerwana, nic nie zostało zmienione. {message}")


def _columns(inspector, table: str) -> dict:
    return {column["name"]: column for column in inspector.get_columns(table)}


def _check_existing_table(inspector, table: str, expected: set[str]) -> bool:
    # Tabela utworzona wcześniej (np. ręcznie) musi mieć dokładnie oczekiwane kolumny.
    if not inspector.has_table(table):
        return False
    found = set(_columns(inspector, table))
    if found != expected:
        _abort(
            f"Tabela {table} już istnieje z innymi kolumnami: {sorted(found)} "
            f"(oczekiwane: {sorted(expected)}). Sprawdź ją ręcznie."
        )
    return True


def _check_existing_flag(inspector, table: str) -> bool:
    column = _columns(inspector, table).get("is_recurring")
    if column is None:
        return False
    if not isinstance(column["type"], sa.Boolean):
        _abort(f"Kolumna {table}.is_recurring już istnieje, ale ma typ {column['type']} zamiast boolean.")
    return True


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Najpierw same sprawdzenia, żeby nie zostawić bazy w połowie zmian.
    months_exists = _check_existing_table(inspector, "months", MONTH_COLUMNS)
    incomes_exists = _check_existing_table(inspector, "incomes", INCOME_COLUMNS)
    category_flag_exists = _check_existing_flag(inspector, "categories")
    expense_flag_exists = _check_existing_flag(inspector, "expenses")

    if months_exists:
        bad_status = bind.execute(
            sa.text("SELECT count(*) FROM months WHERE status NOT IN ('active', 'closed')")
        ).scalar_one()
        if bad_status:
            _abort(f"Tabela months ma {bad_status} wierszy z nieznanym statusem.")

    # 2. Miesiące użytkowników.
    if not months_exists:
        op.create_table(
            "months",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("month", sa.Date(), nullable=False),
            sa.Column("salary", sa.Numeric(12, 2), nullable=True),
            sa.Column("status", sa.String(length=16), server_default="active", nullable=False),
            sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.UniqueConstraint("user_id", "month", name="uq_months_user_id_month"),
            sa.CheckConstraint("status IN ('active', 'closed')", name="ck_months_status"),
        )
        op.create_index("ix_months_id", "months", ["id"])
        op.create_index("ix_months_user_id", "months", ["user_id"])
        op.create_index("ix_months_month", "months", ["month"])

    # 3. Istniejące miesiące (budżet, kategorie lub wydatki) stają się aktywne.
    #    Wypłata zostaje pusta, bo jej wcześniej nie zapisywaliśmy.
    bind.execute(
        sa.text(
            """
            INSERT INTO months (user_id, month, status)
            SELECT DISTINCT user_id, month, 'active'
            FROM (
                SELECT user_id, month FROM budgets
                UNION
                SELECT user_id, month FROM categories
                UNION
                SELECT user_id, date_trunc('month', expense_date)::date FROM expenses
            ) AS used_months
            ON CONFLICT (user_id, month) DO NOTHING
            """
        )
    )

    # 4. Dodatkowe przychody.
    if not incomes_exists:
        op.create_table(
            "incomes",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("month", sa.Date(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("income_date", sa.Date(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_incomes_id", "incomes", ["id"])
        op.create_index("ix_incomes_user_id_month", "incomes", ["user_id", "month"])

    # 5. Flagi cykliczności; istniejące wiersze dostają false przez server_default.
    if not category_flag_exists:
        op.add_column(
            "categories",
            sa.Column("is_recurring", sa.Boolean(), server_default=sa.false(), nullable=False),
        )
    if not expense_flag_exists:
        op.add_column(
            "expenses",
            sa.Column("is_recurring", sa.Boolean(), server_default=sa.false(), nullable=False),
        )

    # 6. Najwyżej jeden automatyczny wydatek na kategorię.
    existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("expenses")}
    if RECURRING_EXPENSE_INDEX not in existing_indexes:
        duplicates = bind.execute(
            sa.text(
                """
                SELECT category_id, array_agg(id ORDER BY id) AS ids
                FROM expenses
                WHERE is_recurring
                GROUP BY category_id
                HAVING count(*) > 1
                """
            )
        ).all()
        if duplicates:
            lines = [f"  category_id={row.category_id}, expense ids={list(row.ids)}" for row in duplicates]
            _abort("Kategorie z więcej niż jednym wydatkiem cyklicznym:\n" + "\n".join(lines))
        op.create_index(
            RECURRING_EXPENSE_INDEX,
            "expenses",
            ["category_id"],
            unique=True,
            postgresql_where=sa.text("is_recurring"),
        )


def downgrade() -> None:
    # Usuwa wypłaty, statusy miesięcy i dodatkowe przychody; budżety, kategorie i wydatki zostają.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if RECURRING_EXPENSE_INDEX in {index["name"] for index in inspector.get_indexes("expenses")}:
        op.drop_index(RECURRING_EXPENSE_INDEX, table_name="expenses")
    if "is_recurring" in _columns(inspector, "expenses"):
        op.drop_column("expenses", "is_recurring")
    if "is_recurring" in _columns(inspector, "categories"):
        op.drop_column("categories", "is_recurring")
    if inspector.has_table("incomes"):
        op.drop_table("incomes")
    if inspector.has_table("months"):
        op.drop_table("months")
