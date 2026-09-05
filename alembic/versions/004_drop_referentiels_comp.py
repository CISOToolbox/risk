"""drop analysis_settings.referentiels_actifs / socle_complementaires

The complementary frameworks were added to Risk before the Compliance module
existed; Compliance now carries that function. The mechanism is removed from
Risk: selection chips, requirements table, persistence and computation.

Two columns therefore disappear:

  * `referentiels_actifs`   — the list of activated frameworks,
  * `socle_complementaires` — the answers entered per requirement.

The downgrade recreates the columns empty. The answers themselves are not
recoverable: nothing else in the schema records them, so the migration is
one-way for the data. It was applied while no deployment carried a single
filled-in answer (75 entries present locally, all empty — scaffolding
created when a framework was activated).
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "004_drop_referentiels_comp"
down_revision = "003_measure_progress_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("analysis_settings", "socle_complementaires")
    op.drop_column("analysis_settings", "referentiels_actifs")


def downgrade() -> None:
    op.add_column(
        "analysis_settings",
        sa.Column(
            "referentiels_actifs",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "analysis_settings",
        sa.Column(
            "socle_complementaires",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
