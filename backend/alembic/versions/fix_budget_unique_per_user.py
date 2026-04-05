"""fix budget unique per user

Revision ID: fix_budget_unique_per_user
Revises: add_user_ownership_to_data
Create Date: 2026-04-03
"""

from typing import Sequence, Union

from alembic import op


revision: str = "fix_budget_unique_per_user"
down_revision: Union[str, None] = "add_user_ownership_to_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("budgets_month_key", "budgets", type_="unique")
    op.create_unique_constraint(
        "uq_budgets_user_id_month",
        "budgets",
        ["user_id", "month"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_budgets_user_id_month", "budgets", type_="unique")
    op.create_unique_constraint("budgets_month_key", "budgets", ["month"])