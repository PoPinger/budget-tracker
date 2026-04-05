"""add user ownership to data

Revision ID: add_user_ownership_to_data
Revises: 33b2ad1d74a6
Create Date: 2026-04-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_user_ownership_to_data"
down_revision: Union[str, None] = "33b2ad1d74a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("categories", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("budgets", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("expenses", sa.Column("user_id", sa.Integer(), nullable=True))

    op.execute("UPDATE categories SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE budgets SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE expenses SET user_id = 1 WHERE user_id IS NULL")

    op.alter_column("categories", "user_id", nullable=False)
    op.alter_column("budgets", "user_id", nullable=False)
    op.alter_column("expenses", "user_id", nullable=False)

    op.create_index(op.f("ix_categories_user_id"), "categories", ["user_id"], unique=False)
    op.create_index(op.f("ix_budgets_user_id"), "budgets", ["user_id"], unique=False)
    op.create_index(op.f("ix_expenses_user_id"), "expenses", ["user_id"], unique=False)

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


def downgrade() -> None:
    op.drop_constraint("fk_expenses_user_id_users", "expenses", type_="foreignkey")
    op.drop_constraint("fk_budgets_user_id_users", "budgets", type_="foreignkey")
    op.drop_constraint("fk_categories_user_id_users", "categories", type_="foreignkey")

    op.drop_index(op.f("ix_expenses_user_id"), table_name="expenses")
    op.drop_index(op.f("ix_budgets_user_id"), table_name="budgets")
    op.drop_index(op.f("ix_categories_user_id"), table_name="categories")

    op.drop_column("expenses", "user_id")
    op.drop_column("budgets", "user_id")
    op.drop_column("categories", "user_id")