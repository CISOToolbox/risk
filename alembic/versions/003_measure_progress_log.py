"""measure progress journal (FEAT-12)

Revision ID: 003_measure_progress_log
Revises: 002_gravite_par_categorie
Create Date: 2026-06-29

Adds a timestamped progress journal (progress_log JSONB, list of {at,by,text})
to measures so a responsible can document where remediation stands, distinct
from the discrete statut.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "003_measure_progress_log"
down_revision = "002_gravite_par_categorie"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analysis_measures",
        sa.Column("progress_log", postgresql.JSONB(astext_type=sa.Text()),
                  nullable=False, server_default=sa.text("'[]'::jsonb")),
    )


def downgrade() -> None:
    op.drop_column("analysis_measures", "progress_log")
