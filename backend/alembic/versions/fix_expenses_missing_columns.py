"""fix expenses missing columns

Revision ID: fix_expenses_missing_columns
Revises: fix_budget_unique_per_user
Create Date: 2026-04-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fix_expenses_missing_columns"
down_revision: Union[str, None] = "fix_budget_unique_per_user"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "expenses",
        sa.Column("name", sa.String(length=255), nullable=True),
    )

    op.execute("UPDATE expenses SET name = 'Wydatek' WHERE name IS NULL")

    op.alter_column("expenses", "name", nullable=False)


def downgrade() -> None:
    op.drop_column("expenses", "name")