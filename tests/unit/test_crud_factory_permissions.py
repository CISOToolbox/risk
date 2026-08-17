"""Regression (H1): the child-entity CRUD routers must enforce the SAME
permission ladder as analyses.py.

`crud_factory.py` governs every `PUT /api/analyses/{id}/{section}` route — the
main write surface of the Risk module (the one the `_persist` adapter drives).
It used to carry its own copy of `_user_permissions` that had drifted: an
unowned analysis granted full write to ANY module role (viewer included) and
there was no module-role fallback. A viewer was correctly read-only on
analyses.py routes but got full write here. The fix removes the copy and imports
the canonical function; these tests lock that in.

Imports go through the `src.` package root (the same one the app uses) so
crud_factory and analyses resolve to ONE module instance — importing analyses
as top-level `routes.analyses` (as the sibling unit tests do) would create a
second copy and defeat the identity assertion.
"""
import os
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import analyses, crud_factory  # noqa: E402

FULL_PERMS = ["read", "edit", "delete", "share"]


def _user(module_role=""):
    u = SimpleNamespace(id=uuid.uuid4(), email="v@medsecure.local", name="V", role="user")
    u._module_role = module_role
    return u


def _unowned():
    return SimpleNamespace(id=uuid.uuid4(), name="A", owner_id=None, shared_with=[])


def test_crud_factory_uses_the_canonical_ladder():
    # No second copy: same function object as analyses.py. If a future edit
    # re-introduces a local _user_permissions in crud_factory, this fails.
    assert crud_factory._user_permissions is analyses._user_permissions


# auth_enabled is patched explicitly (not via env): it is captured at import
# time in the shared src.auth_common instance, so relying on JWT_SECRET makes
# these sensitive to test-collection order.
@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_viewer_cannot_write_unowned_via_crud_factory(_mock):
    perms = crud_factory._user_permissions(_unowned(), _user("viewer"))
    assert perms == ["read"]
    assert "edit" not in perms and "delete" not in perms


@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_unknown_role_gets_read_edit_not_full(_mock):
    perms = crud_factory._user_permissions(_unowned(), _user(""))
    assert perms == ["read", "edit"]
    assert "delete" not in perms and "share" not in perms


@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_module_admin_keeps_full_on_unowned(_mock):
    assert crud_factory._user_permissions(_unowned(), _user("admin")) == FULL_PERMS
