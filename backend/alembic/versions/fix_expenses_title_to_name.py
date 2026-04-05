"""fix expenses title to name

Revision ID: fix_expenses_title_to_name
Revises: fix_expenses_missing_columns
Create Date: 2026-04-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fix_expenses_title_to_name"
down_revision: Union[str, None] = "fix_expenses_missing_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE expenses SET name = title WHERE name IS NULL AND title IS NOT NULL")
    op.drop_column("expenses", "title")


def downgrade() -> None:
    op.add_column(
        "expenses",
        sa.Column("title", sa.String(length=255), nullable=True),
    )
    op.execute("UPDATE expenses SET title = name WHERE title IS NULL AND name IS NOT NULL")
    op.alter_column("expenses", "title", nullable=False)