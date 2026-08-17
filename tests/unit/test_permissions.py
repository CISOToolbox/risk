import os
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.analyses import _user_permissions, _can

FULL_PERMS = ["read", "edit", "delete", "share"]


def _make_user(role="user"):
    return SimpleNamespace(
        id=uuid.uuid4(), email="test@example.com",
        name="Test User", role=role,
    )


def _make_analysis(owner_id=None, shared_with=None):
    return SimpleNamespace(
        id=uuid.uuid4(), name="Test Analysis",
        owner_id=owner_id, shared_with=shared_with or [],
    )


class TestUserPermissions:

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_owner_gets_full_perms(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=user.id)
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_admin_gets_full_perms(self, _mock):
        user = _make_user(role="admin")
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unowned_no_module_role_gets_read_edit(self, _mock):
        # Regression (H1): an unowned analysis is NOT a full-access free-for-all.
        # A user with no module role gets read+edit, not delete/share.
        user = _make_user()
        analysis = _make_analysis(owner_id=None)
        assert _user_permissions(analysis, user) == ["read", "edit"]

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unowned_viewer_module_role_is_read_only(self, _mock):
        user = _make_user()
        user._module_role = "viewer"
        analysis = _make_analysis(owner_id=None)
        assert _user_permissions(analysis, user) == ["read"]

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unowned_admin_module_role_gets_full(self, _mock):
        user = _make_user()
        user._module_role = "admin"
        analysis = _make_analysis(owner_id=None)
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_user_gets_shared_perms(self, _mock):
        user = _make_user()
        shared_perms = ["read", "edit"]
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id), "permissions": shared_perms}],
        )
        assert _user_permissions(analysis, user) == shared_perms

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_user_default_read(self, _mock):
        user = _make_user()
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id)}],
        )
        assert _user_permissions(analysis, user) == ["read"]

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unrelated_user_gets_nothing(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4(), shared_with=[])
        assert _user_permissions(analysis, user) == []

    @patch("routes.analyses.auth_enabled", return_value=False)
    def test_auth_disabled_grants_full_access(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_none_user_gets_full_when_auth_enabled(self, _mock):
        """When user is None and auth_enabled is True, the function
        still returns full perms (first check: user is None)."""
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, None) == FULL_PERMS


class TestCan:

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_owner_can_edit(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=user.id)
        assert _can("edit", analysis, user) is True

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_owner_can_delete(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=user.id)
        assert _can("delete", analysis, user) is True

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unrelated_user_cannot_read(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _can("read", analysis, user) is False

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_read_only_cannot_edit(self, _mock):
        user = _make_user()
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id), "permissions": ["read"]}],
        )
        assert _can("read", analysis, user) is True
        assert _can("edit", analysis, user) is False
        assert _can("delete", analysis, user) is False
