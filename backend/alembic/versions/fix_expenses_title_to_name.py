"""fix expenses title to name

Revision ID: fix_expenses_title_to_name
Revises: fix_expenses_missing_columns
Create Date: 2026-04-05
"""

from alembic import op
import sqlalchemy as sa


revision = "fix_expenses_title_to_name"
down_revision = "fix_expenses_missing_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # bezpieczna migracja zastępcza
    pass


def downgrade() -> None:
    pass