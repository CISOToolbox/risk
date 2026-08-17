import os
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.analyses import _user_permissions, _can

FULL_PERMS = ["read", "edit", "delete", "share"]


def _make_user(role="user", uid=None, email="test@medsecure.local"):
    return SimpleNamespace(
        id=uid or uuid.uuid4(), email=email,
        name="Test User", role=role,
    )


def _make_analysis(owner_id=None, shared_with=None):
    return SimpleNamespace(
        id=uuid.uuid4(), name="MedSecure Risk Analysis",
        owner_id=owner_id, shared_with=shared_with or [],
    )


class TestUserPermissionsRisk:

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_admin_gets_full_perms_on_any_analysis(self, _mock):
        admin = _make_user(role="admin")
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, admin) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_owner_gets_full_perms(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=user.id)
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_read_only_cannot_edit_delete_share(self, _mock):
        user = _make_user()
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id), "permissions": ["read"]}],
        )
        perms = _user_permissions(analysis, user)
        assert "read" in perms
        assert "edit" not in perms
        assert "delete" not in perms
        assert "share" not in perms

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_read_edit_cannot_delete(self, _mock):
        user = _make_user()
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id), "permissions": ["read", "edit"]}],
        )
        perms = _user_permissions(analysis, user)
        assert "read" in perms
        assert "edit" in perms
        assert "delete" not in perms
        assert "share" not in perms

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_unrelated_user_gets_empty_perms(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4(), shared_with=[])
        assert _user_permissions(analysis, user) == []

    @patch("routes.analyses.auth_enabled", return_value=False)
    def test_auth_disabled_grants_full_access(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_analysis_with_no_owner_read_edit_for_non_admin(self, _mock):
        # unowned resource: any module user may read+edit — but NOT delete/share
        # (previously it was a full-access free-for-all).
        user = _make_user()
        analysis = _make_analysis(owner_id=None)
        assert _user_permissions(analysis, user) == ["read", "edit"]

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_analysis_with_no_owner_full_for_module_admin(self, _mock):
        user = _make_user()
        user._module_role = "admin"
        analysis = _make_analysis(owner_id=None)
        assert _user_permissions(analysis, user) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_none_user_gets_full_perms(self, _mock):
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _user_permissions(analysis, None) == FULL_PERMS

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_entry_without_permissions_key_defaults_to_read(self, _mock):
        user = _make_user()
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[{"user_id": str(user.id)}],
        )
        assert _user_permissions(analysis, user) == ["read"]

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_shared_with_none_treated_as_empty(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4(), shared_with=None)
        assert _user_permissions(analysis, user) == []

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_multiple_shared_users_correct_match(self, _mock):
        user_a = _make_user(email="a@medsecure.local")
        user_b = _make_user(email="b@medsecure.local")
        analysis = _make_analysis(
            owner_id=uuid.uuid4(),
            shared_with=[
                {"user_id": str(user_a.id), "permissions": ["read"]},
                {"user_id": str(user_b.id), "permissions": ["read", "edit", "share"]},
            ],
        )
        assert _user_permissions(analysis, user_a) == ["read"]
        assert _user_permissions(analysis, user_b) == ["read", "edit", "share"]


class TestCanRisk:

    @patch("routes.analyses.auth_enabled", return_value=True)
    def test_owner_can_perform_all_actions(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=user.id)
        for perm in FULL_PERMS:
            assert _can(perm, analysis, user) is True

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
        assert _can("share", analysis, user) is False

    @patch("routes.analyses.auth_enabled", return_value=False)
    def test_auth_disabled_anyone_can_delete(self, _mock):
        user = _make_user()
        analysis = _make_analysis(owner_id=uuid.uuid4())
        assert _can("delete", analysis, user) is True
