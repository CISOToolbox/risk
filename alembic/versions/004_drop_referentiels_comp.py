"""drop analysis_settings.referentiels_actifs / socle_complementaires

Les référentiels complémentaires ont été ajoutés à Risk avant l'existence du
module Compliance, qui porte désormais cette fonction. Le dispositif est retiré
de Risk : chips de sélection, tableau d'exigences, persistance et calcul.

Deux colonnes disparaissent donc :

  * `referentiels_actifs`   — la liste des référentiels activés,
  * `socle_complementaires` — les réponses saisies par exigence.

Le downgrade recrée les colonnes vides. Les réponses elles-mêmes ne sont pas
récupérables : rien d'autre dans le schéma ne les enregistre, la migration est
donc à sens unique pour les données. Elle a été appliquée alors qu'aucun
déploiement ne portait une seule réponse renseignée (75 entrées présentes en
local, toutes vides — de l'échafaudage créé à l'activation d'un référentiel).
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
