"""baseline — anchor for alembic version tracking

This migration is intentionally empty. The initial schema is created by
`Base.metadata.create_all` at container startup (in main.py). This baseline
exists so that alembic has a starting revision to track future changes via
`alembic revision --autogenerate`.

On existing deployments (with tables already created by create_all), run
`alembic stamp head` once to mark the database as being at this revision.
On fresh deployments, create_all makes the tables and alembic upgrade head
marks the baseline as applied — no-op in both cases.

Future schema changes must go through real alembic migrations generated via:
    alembic revision --autogenerate -m "<description>"
"""
from __future__ import annotations

# revision identifiers, used by Alembic.
revision = "001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
