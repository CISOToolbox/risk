"""Regression: the global role must be refreshed from the JWT on every request.

Before the fix, `_sync_user_from_jwt` returned an existing user untouched, so
`user.role` was frozen at the value the row was first created with — a role
change in Pilot (or a standalone re-login) never took effect, and a demotion
never applied. These tests use a mocked async session (the models are
Postgres-specific, so no real DB is spun up) and assert the refresh behaviour.
"""
import asyncio
import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from auth_common import _sync_user_from_jwt  # noqa: E402


class _Result:
    def __init__(self, user):
        self._user = user

    def scalar_one_or_none(self):
        return self._user


def _fake_db(existing_user):
    db = AsyncMock()
    db.execute = AsyncMock(return_value=_Result(existing_user))
    db.commit = AsyncMock()
    return db


def _sync(db, payload):
    return asyncio.run(_sync_user_from_jwt(db, payload))


def test_role_promoted_is_refreshed():
    user = SimpleNamespace(email="a@medsecure.local", name="A", role="user")
    db = _fake_db(user)
    out = _sync(db, {"email": user.email, "role": "admin", "name": "A"})
    assert out is user
    assert user.role == "admin"          # refreshed from JWT
    db.commit.assert_awaited()


def test_role_demoted_is_refreshed():
    user = SimpleNamespace(email="a@medsecure.local", name="A", role="admin")
    db = _fake_db(user)
    _sync(db, {"email": user.email, "role": "user", "name": "A"})
    assert user.role == "user"           # demotion now applies
    db.commit.assert_awaited()


def test_unchanged_role_does_not_write():
    user = SimpleNamespace(email="a@medsecure.local", name="A", role="admin")
    db = _fake_db(user)
    _sync(db, {"email": user.email, "role": "admin", "name": "A"})
    assert user.role == "admin"
    db.commit.assert_not_awaited()       # nothing dirty → no DB write


def test_missing_role_in_jwt_leaves_row():
    user = SimpleNamespace(email="a@medsecure.local", name="A", role="admin")
    db = _fake_db(user)
    _sync(db, {"email": user.email, "name": "A"})  # no role claim
    assert user.role == "admin"          # untouched
    db.commit.assert_not_awaited()
