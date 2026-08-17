"""owner_id -> ON DELETE SET NULL, so deleting a user is never blocked.

Revision ID: 006_owner_set_null
Revises: 005_server_rev
Create Date: 2026-08-19

`analyses.owner_id` referenced `users.id` with PostgreSQL's default NO ACTION,
so removing a user failed as soon as they owned anything:

    ERROR: update or delete on table "users" violates foreign key constraint
           "analyses_owner_id_fkey" on table "analyses"

Four modules (pilot, surface, appsec, watch) already cascaded their user rows
while six refused the delete — same suite, two behaviours, and no way to
de-provision someone cleanly. SET NULL matches the ownership idiom already in
use everywhere (`owner_id = user.id if user else None`): a null owner is an
expected, handled state. The owned objects are kept — only the link goes.
"""
from alembic import op

revision = "006_owner_set_null"
down_revision = "005_server_rev"
branch_labels = None
depends_on = None

_FK = "analyses_owner_id_fkey"


def upgrade() -> None:
    op.drop_constraint(_FK, "analyses", type_="foreignkey")
    op.create_foreign_key(_FK, "analyses", "users", ["owner_id"], ["id"],
                          ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint(_FK, "analyses", type_="foreignkey")
    op.create_foreign_key(_FK, "analyses", "users", ["owner_id"], ["id"])
