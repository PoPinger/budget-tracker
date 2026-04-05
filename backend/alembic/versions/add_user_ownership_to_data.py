"""add user ownership to data

Revision ID: add_user_ownership_to_data
Revises: 33b2ad1d74a6
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_user_ownership_to_data"
down_revision = "33b2ad1d74a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    # 1. dodaj kolumny user_id jeśli jeszcze nie istnieją
    op.add_column("categories", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("budgets", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("expenses", sa.Column("user_id", sa.Integer(), nullable=True))

    # 2. utwórz domyślnego użytkownika jeśli nie istnieje
    connection.execute(
        sa.text(
            """
            INSERT INTO users (id, email, hashed_password, full_name)
            VALUES (1, 'legacy-user@example.com', 'legacy_password_hash', 'Legacy User')
            ON CONFLICT (id) DO NOTHING
            """
        )
    )

    # 3. przypisz stare dane do user_id = 1 tam gdzie brakuje user_id
    connection.execute(sa.text("UPDATE categories SET user_id = 1 WHERE user_id IS NULL"))
    connection.execute(sa.text("UPDATE budgets SET user_id = 1 WHERE user_id IS NULL"))
    connection.execute(sa.text("UPDATE expenses SET user_id = 1 WHERE user_id IS NULL"))

    # 4. ustaw NOT NULL
    op.alter_column("categories", "user_id", nullable=False)
    op.alter_column("budgets", "user_id", nullable=False)
    op.alter_column("expenses", "user_id", nullable=False)

    # 5. dodaj foreign keys
    op.create_foreign_key(
        "fk_categories_user_id_users",
        "categories",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_budgets_user_id_users",
        "budgets",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_expenses_user_id_users",
        "expenses",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 6. indeksy
    op.create_index("ix_categories_user_id", "categories", ["user_id"])
    op.create_index("ix_budgets_user_id", "budgets", ["user_id"])
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_index("ix_budgets_user_id", table_name="budgets")
    op.drop_index("ix_categories_user_id", table_name="categories")

    op.drop_constraint("fk_expenses_user_id_users", "expenses", type_="foreignkey")
    op.drop_constraint("fk_budgets_user_id_users", "budgets", type_="foreignkey")
    op.drop_constraint("fk_categories_user_id_users", "categories", type_="foreignkey")

    op.drop_column("expenses", "user_id")
    op.drop_column("budgets", "user_id")
    op.drop_column("categories", "user_id")