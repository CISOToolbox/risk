"""Regression: POST /api/sync/vendor no longer hands Vendor's inventory to anyone.

The route pulls `vendor /api/export/vendors` with the service token, which
Vendor serves without any ACL: every vendor of every project, with measures
and owners. It only checked edit rights on the target analysis — which any
account can create. It now requires a Risk editor who also holds a role in
Vendor, asked to Pilot (`sibling_module_role`, fail-closed), because the
module session carries this module's role only.

`sibling_module_role` is shared code (auth_common.py, identical in every
module); it is exercised here on risk's copy.
"""
import asyncio
import importlib
import os
import sys
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "x" * 64)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

_EMAIL = "alice@medsecure.example"


class _Http:
    """Stands in for httpx.AsyncClient; records each call."""

    def __init__(self, answer=None, status=200, fail=False):
        self.answer, self.status, self.fail, self.calls = answer, status, fail, []

    def __call__(self, **_):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def get(self, url, params=None, headers=None):
        self.calls.append((url, params))
        if self.fail:
            raise OSError("unreachable")
        return SimpleNamespace(status_code=self.status, json=lambda: self.answer,
                               raise_for_status=lambda: None)


def _user(role="user", module_role="editor"):
    return SimpleNamespace(id=uuid.uuid4(), email=_EMAIL, name="Alice", role=role, _module_role=module_role)


# ── sibling_module_role ─────────────────────────────────────────────

@pytest.fixture
def ac(monkeypatch):
    """auth_common in pilot mode, with the Pilot channel configured."""
    monkeypatch.setenv("AUTH_MODE", "pilot")
    monkeypatch.setenv("MODULE_NAME", "risk")
    monkeypatch.setenv("PILOT_URL", "http://pilot:8000")
    monkeypatch.setenv("SERVICE_TOKEN", "svc-token")
    import auth_common
    mod = importlib.reload(auth_common)
    yield mod
    for key in ("AUTH_MODE", "PILOT_URL", "SERVICE_TOKEN"):
        monkeypatch.delenv(key, raising=False)
    importlib.reload(auth_common)


def _status(role="user", module_role="", active=True, with_module_role=True):
    answer = {"exists": True, "active": active, "role": role, "modules": []}
    if with_module_role:
        answer["module_role"] = module_role
    return answer


def _sibling(ac, monkeypatch, http, user, module="vendor"):
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", http)
    return asyncio.run(ac.sibling_module_role(user, module))


@pytest.mark.parametrize("answer,expected", [
    (_status("user", "manager"), "manager"),
    (_status("user", ""), ""),
    (_status("admin", ""), "admin"),
    (_status("viewer", ""), "viewer"),
    (_status("user", "superuser"), ""),            # outside vendor's ladder
    (_status("user", "manager", active=False), ""),
    (_status("user", with_module_role=False), ""),  # a Pilot that cannot say
], ids=["module-role", "none", "suite-admin", "suite-viewer", "off-ladder", "inactive", "older-pilot"])
def test_sibling_role_from_pilot(ac, monkeypatch, answer, expected):
    http = _Http(answer)
    assert _sibling(ac, monkeypatch, http, _user()) == expected
    assert http.calls[0][1] == {"email": _EMAIL, "module": "vendor"}


@pytest.mark.parametrize("http", [_Http(fail=True), _Http({}, status=403)], ids=["unreachable", "refused"])
def test_sibling_role_fails_closed(ac, monkeypatch, http):
    assert _sibling(ac, monkeypatch, http, _user(role="admin", module_role="admin")) == ""


def test_sibling_role_is_cached_per_module(ac, monkeypatch):
    http = _Http(_status("user", "manager"))
    _sibling(ac, monkeypatch, http, _user())
    _sibling(ac, monkeypatch, http, _user())
    assert len(http.calls) == 1


def test_sibling_role_auth_disabled_is_admin(ac):
    assert asyncio.run(ac.sibling_module_role(None, "vendor")) == "admin"


# ── POST /api/sync/vendor ───────────────────────────────────────────

class _DB:
    def __init__(self, owner_id):
        self.owner_id = owner_id

    async def get(self, _model, _id):
        return SimpleNamespace(id=_id, owner_id=self.owner_id, shared_with=[], updated_at=None)

    async def commit(self):
        pass


@pytest.fixture
def sync(monkeypatch):
    from src.routes import internal
    vendor = _Http({"vendors": []})
    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", vendor)

    async def _reconstruct(_db, _aid):
        return {"pp": [], "measures": []}

    async def _noop(*_a, **_k):
        return None

    monkeypatch.setattr(internal, "_reconstruct_data", _reconstruct)
    monkeypatch.setattr(internal, "_delete_children", _noop)
    monkeypatch.setattr(internal, "_decompose_data", _noop)
    monkeypatch.setattr(internal, "auth_enabled", lambda: True, raising=False)
    monkeypatch.setattr("src.routes.analyses.auth_enabled", lambda: True)

    def _run(user, vendor_role):
        async def _role(_user, module):
            assert module == "vendor"
            return vendor_role
        monkeypatch.setattr(internal, "sibling_module_role", _role, raising=False)
        asyncio.run(internal.sync_vendor("A-1", user, _DB(user.id)))
        return vendor.calls
    return _run


def test_editor_without_vendor_role_is_refused(sync):
    with pytest.raises(HTTPException) as exc:
        sync(_user(module_role="editor"), "")
    assert exc.value.status_code == 403


def test_risk_viewer_is_refused(sync):
    with pytest.raises(HTTPException) as exc:
        sync(_user(module_role="viewer"), "manager")
    assert exc.value.status_code == 403


def test_editor_with_vendor_role_pulls(sync):
    calls = sync(_user(module_role="editor"), "viewer")
    assert calls and calls[0][0].endswith("/api/export/vendors")
