"""gravite par catégorie — per-criterion severity for feared events

Adds:
- analysis_er.gravite_cat (JSONB, nullable) — severity level per scale
  category (financier, reputation, reglementaire, donnees_perso, operationnel).
- analysis_context.gravite_par_categorie (Boolean, default false) — toggle
  that enables the per-category severity columns on the Feared events page.

The overall analysis_er.gravite (max across categories) is unchanged.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "002_gravite_par_categorie"
down_revision = "001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analysis_er",
        sa.Column("gravite_cat", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "analysis_context",
        sa.Column("gravite_par_categorie", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("analysis_context", "gravite_par_categorie")
    op.drop_column("analysis_er", "gravite_cat")
