"""Regression: a demotion decided in Pilot reaches the modules' sessions.

A module session is a JWT good for 24 h, minted by Pilot with the roles of the
moment. The module asked Pilot only whether the account was still active, so
an admin demoted in Pilot stayed admin in every module until the cookie
expired. Pilot now also answers the account's current global role and its role
in the asking module, and the module lowers the token's roles to them — never
raises them: a promotion still waits for the next sign-in.

Exercised on risk's copy of the shared source (auth_common.py is identical in
every module); risk's ladder is viewer < editor < admin.
"""
import asyncio
import importlib
import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

_EMAIL = "alice@medsecure.example"


def _load(monkeypatch, module):
    monkeypatch.setenv("AUTH_MODE", "pilot")
    monkeypatch.setenv("MODULE_NAME", module)
    monkeypatch.setenv("JWT_SECRET", "x" * 64)
    monkeypatch.setenv("PILOT_URL", "http://pilot:8000")
    monkeypatch.setenv("SERVICE_TOKEN", "svc-token")
    import auth_common
    return importlib.reload(auth_common)


@pytest.fixture
def ac(monkeypatch):
    """auth_common in pilot mode, with the Pilot channel configured."""
    yield _load(monkeypatch, "risk")
    # Put the environment back before reloading: the other test files of
    # this module hold functions of the same module object, which read its
    # globals (MODULE_NAME, AUTH_MODE) at call time.
    monkeypatch.undo()
    import auth_common
    importlib.reload(auth_common)


@pytest.fixture
def ac_access(monkeypatch, ac):
    """The same, as Access: its ladder (manager < control < admin) has no viewer."""
    return _load(monkeypatch, "access")


class _Pilot:
    """Stands in for httpx.AsyncClient; records the query of each call."""

    def __init__(self, answer=None, status=200, fail=False):
        self.answer, self.status, self.fail, self.calls = answer, status, fail, []

    def __call__(self, **_):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def get(self, url, params=None, headers=None):
        self.calls.append(params)
        if self.fail:
            raise OSError("pilot unreachable")
        return SimpleNamespace(status_code=self.status, json=lambda: self.answer)


def _status(role="user", module_role="", active=True, with_module_role=True):
    answer = {"exists": True, "active": active, "role": role, "modules": []}
    if with_module_role:
        answer["module_role"] = module_role
    return answer


def _resolve(ac, monkeypatch, pilot, role, permissions, token=None):
    """Run _resolve_user_from_cookie on a token minted with these claims."""
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", pilot)
    token = token or ac.create_jwt("sub-1", _EMAIL, role, permissions)
    request = SimpleNamespace(cookies={ac.COOKIE_NAME: token})
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    db = AsyncMock()
    db.add = MagicMock()
    db.execute = AsyncMock(return_value=result)
    return asyncio.run(ac._resolve_user_from_cookie(request, db))


# ── Demotions apply ─────────────────────────────────────────────────

def test_demoted_suite_admin_loses_admin(ac, monkeypatch):
    user, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "viewer")), "admin", {})
    assert role == "viewer"
    assert user.role == "user"


def test_demoted_suite_admin_without_module_role_loses_access(ac, monkeypatch):
    user, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "")), "admin", {})
    assert role == ""
    assert user.role == "user"


def test_module_editor_demoted_to_viewer(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "viewer")), "user", {"risk": "editor"})
    assert role == "viewer"


def test_module_role_removed(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "")), "user", {"risk": "editor"})
    assert role == ""


def test_global_viewer_keeps_read_only_access(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("viewer", "")), "user", {"risk": "editor"})
    assert role == "viewer"


def test_role_outside_the_ladder_grants_nothing(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "superuser")), "user", {"risk": "editor"})
    assert role == ""


def test_pending_account_is_refused(ac, monkeypatch):
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        _resolve(ac, monkeypatch, _Pilot(_status("pending", "", active=False)), "admin", {})
    assert exc.value.status_code == 401


# ── Nothing is raised ───────────────────────────────────────────────

def test_promotion_waits_for_the_next_sign_in(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "admin")), "user", {"risk": "viewer"})
    assert role == "viewer"


def test_promotion_to_suite_admin_waits_for_the_next_sign_in(ac, monkeypatch):
    user, role = _resolve(ac, monkeypatch, _Pilot(_status("admin", "")), "user", {"risk": "editor"})
    assert role == "editor"
    assert user.role == "user"


def test_unchanged_admin_stays_admin(ac, monkeypatch):
    user, role = _resolve(ac, monkeypatch, _Pilot(_status("admin", "")), "admin", {})
    assert role == "admin"
    assert user.role == "admin"


# ── No verdict: the token's claims stand ────────────────────────────

def test_pilot_unreachable_keeps_the_token_role(ac, monkeypatch):
    user, role = _resolve(ac, monkeypatch, _Pilot(fail=True), "admin", {})
    assert role == "admin"
    assert user.role == "admin"


def test_pilot_error_keeps_the_token_role(ac, monkeypatch):
    _, role = _resolve(ac, monkeypatch, _Pilot({}, status=403), "user", {"risk": "editor"})
    assert role == "editor"


def test_older_pilot_applies_only_the_global_demotion(ac, monkeypatch):
    pilot = _Pilot(_status("user", with_module_role=False))
    _, role = _resolve(ac, monkeypatch, pilot, "user", {"risk": "editor"})
    assert role == "editor"
    ac._revocation_cache.clear()
    user, role = _resolve(ac, monkeypatch, pilot, "admin", {})
    assert role == ""
    assert user.role == "user"


# ── The question asked, and its cache ───────────────────────────────

def test_asks_for_this_module_and_caches_the_verdict(ac, monkeypatch):
    pilot = _Pilot(_status("user", "viewer"))
    token = ac.create_jwt("sub-1", _EMAIL, "user", {"risk": "editor"})
    _resolve(ac, monkeypatch, pilot, "user", {}, token=token)
    _, role = _resolve(ac, monkeypatch, pilot, "user", {}, token=token)
    assert pilot.calls == [{"email": _EMAIL, "module": "risk"}]
    assert role == "viewer"


def test_a_newer_token_asks_again(ac, monkeypatch):
    """A promotion is minted into a new token at sign-in: the verdict cached
    for the previous token must not hold it down."""
    old = ac.create_jwt("sub-1", _EMAIL, "user", {"risk": "viewer"})
    _resolve(ac, monkeypatch, _Pilot(_status("user", "viewer")), "user", {}, token=old)
    payload = ac.decode_jwt(old)
    payload["exp"] = payload["exp"] + 60
    payload["permissions"] = {"risk": "editor"}
    import jwt as pyjwt
    newer = pyjwt.encode(payload, ac.JWT_KEY, algorithm=ac.JWT_ALGORITHM)
    pilot = _Pilot(_status("user", "editor"))
    _, role = _resolve(ac, monkeypatch, pilot, "user", {}, token=newer)
    assert len(pilot.calls) == 1
    assert role == "editor"


# ── A role the ladder does not list ─────────────────────────────────

def test_suite_viewer_keeps_reading_access(ac_access, monkeypatch):
    """Access's ladder starts at manager; a suite viewer read it before this
    check and must keep doing so while nothing changed in Pilot."""
    _, role = _resolve(ac_access, monkeypatch, _Pilot(_status("viewer", "")), "viewer", {})
    assert role == "viewer"


def test_access_manager_demoted_to_suite_viewer_reads(ac_access, monkeypatch):
    _, role = _resolve(ac_access, monkeypatch, _Pilot(_status("viewer", "")), "user", {"access": "manager"})
    assert role == "viewer"


def test_unchanged_role_outside_the_ladder_is_kept(ac, monkeypatch):
    """No demotion happened: the clamp must not take away what the token
    already granted (the module decides what that role may do)."""
    _, role = _resolve(ac, monkeypatch, _Pilot(_status("user", "legacy")), "user", {"risk": "legacy"})
    assert role == "legacy"
