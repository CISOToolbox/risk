"""analyses.server_rev — stale-tab guard (FEAT-33)

Revision ID: 005_server_rev
Revises: 004_drop_referentiels_comp
Create Date: 2026-08-15

Bumped only by server-initiated writers; the blob PUT is refused (409)
when a stale tab tries to overwrite them.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "005_server_rev"
down_revision = "004_drop_referentiels_comp"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("analyses", sa.Column("server_rev", sa.Integer(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("analyses", "server_rev")
