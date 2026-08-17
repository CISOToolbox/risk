"""Regression: per-module role must grant rights in Risk too.

Before the fix, risk's `_user_permissions` had no module-role fallback: a user
who was admin/editor/viewer for the RISK module (via Pilot permissions) but was
neither the owner nor listed in shared_with got an empty permission set — a
coherence gap vs vendor/compliance. The fix routes all three through the shared
`perms_for_module_role` ladder in auth_common.
"""
import os
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from auth_common import _get_module_role, perms_for_module_role  # noqa: E402
from routes.analyses import _user_permissions  # noqa: E402

FULL = ["read", "edit", "delete", "share"]


def _user(module_role, role="user"):
    u = SimpleNamespace(id=uuid.uuid4(), email="c@medsecure.local", name="C", role=role)
    u._module_role = module_role
    return u


def _analysis():
    # owned by someone else, no shares → only the module-role fallback applies
    return SimpleNamespace(id=uuid.uuid4(), name="A", owner_id=uuid.uuid4(), shared_with=[])


def test_ladder_mapping():
    assert perms_for_module_role("admin") == FULL
    assert perms_for_module_role("control") == FULL
    assert perms_for_module_role("editor") == ["read", "edit"]
    assert perms_for_module_role("contributor") == ["read", "edit"]
    assert perms_for_module_role("viewer") == ["read"]
    assert perms_for_module_role("triager") == ["read"]
    assert perms_for_module_role("") == []
    assert perms_for_module_role("bogus") == []


@patch("routes.analyses.auth_enabled", return_value=True)
def test_module_admin_gets_full_on_foreign_analysis(_m):
    # per-module admin, NOT global admin, not owner, not shared → used to get []
    assert _user_permissions(_analysis(), _user("admin")) == FULL


@patch("routes.analyses.auth_enabled", return_value=True)
def test_module_editor_gets_edit(_m):
    assert _user_permissions(_analysis(), _user("editor")) == ["read", "edit"]


@patch("routes.analyses.auth_enabled", return_value=True)
def test_module_viewer_gets_read_only(_m):
    assert _user_permissions(_analysis(), _user("viewer")) == ["read"]


@patch("routes.analyses.auth_enabled", return_value=True)
def test_no_module_role_gets_nothing(_m):
    assert _user_permissions(_analysis(), _user("")) == []


def test_global_role_maps_to_module_role():
    # a per-module role always wins
    assert _get_module_role({"permissions": {"risk": "editor"}, "role": "viewer"}) == "editor"
    # global admin → admin everywhere
    assert _get_module_role({"role": "admin"}) == "admin"
    # global viewer → read-only everywhere (was previously "" → blocked)
    assert _get_module_role({"role": "viewer"}) == "viewer"
    # plain global user → no module role (blocked unless granted per-module)
    assert _get_module_role({"role": "user"}) == ""
