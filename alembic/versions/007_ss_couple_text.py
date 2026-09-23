"""A strategic scenario carries every RO/TO pair it serves (FEAT-48)

Revision ID: 007_ss_couple_text
Revises: 006_owner_set_null
Create Date: 2026-09-22

`analysis_ss.couple_id` was the only reference column of its row capped at 50
characters, while `pp`, `bs` and `er` are `Text`. The stored form is
"id - label", so a single pair with a long label already reached the cap; a
scenario serving several pairs never fitted. Widening it is what lets the
screen hold the list, and it loses nothing.
"""
from alembic import op
import sqlalchemy as sa

revision = "007_ss_couple_text"
down_revision = "006_owner_set_null"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("analysis_ss", "couple_id",
                    existing_type=sa.String(50), type_=sa.Text(),
                    existing_nullable=True)


def downgrade() -> None:
    # Truncating back to 50 would lose data: the column keeps its content and
    # only its declared type narrows, which PostgreSQL refuses when a value is
    # longer. Downgrade is therefore only safe on an unused column.
    op.alter_column("analysis_ss", "couple_id",
                    existing_type=sa.Text(), type_=sa.String(50),
                    existing_nullable=True)
