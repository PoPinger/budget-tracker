"""fix users id sequence

Revision ID: fix_users_id_sequence
Revises: fix_expenses_title_to_name
Create Date: 2026-04-05
"""

from alembic import op
import sqlalchemy as sa


revision = "fix_users_id_sequence"
down_revision = "fix_expenses_title_to_name"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            SELECT setval(
                pg_get_serial_sequence('users', 'id'),
                COALESCE((SELECT MAX(id) FROM users), 1),
                true
            );
            """
        )
    )


def downgrade() -> None:
    pass