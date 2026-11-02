"""Regression: a read-only module role cannot create, import or duplicate an
analysis.

The creator becomes owner, with every right. A viewer could create analyses,
import any file as one, or duplicate an analysis shared with them read-only
and edit the copy. `require_edit_role` now gates the three routes.
"""
import asyncio
import os
import sys
import uuid
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.auth import require_edit_role  # noqa: E402
from src.routes import analyses  # noqa: E402


class _Result:
    def scalar_one_or_none(self):
        return None

    def scalars(self):
        return SimpleNamespace(all=lambda: [])


class _FakeDB:
    def __init__(self):
        self.added = []

    async def execute(self, _stmt):
        return _Result()

    async def get(self, _model, _id):
        return SimpleNamespace(id=uuid.uuid4(), name="MedSecure", organization="MedSecure",
                               analyst="", owner_id=uuid.uuid4(), shared_with=[], updated_at=None)

    def add(self, obj):
        self.added.append(obj)


def _user(module_role, role="user"):
    u = SimpleNamespace(id=uuid.uuid4(), email="u@medsecure.local", name="U", role=role)
    u._module_role = module_role
    return u


@pytest.mark.parametrize("module_role", ["viewer", "reader", "triager", ""])
def test_read_only_roles_are_refused(module_role):
    with pytest.raises(HTTPException) as exc:
        require_edit_role(_user(module_role))
    assert exc.value.status_code == 403


@pytest.mark.parametrize("module_role", ["editor", "contributor", "manager", "admin", "control"])
def test_editing_roles_pass(module_role):
    require_edit_role(_user(module_role))


def test_global_admin_and_auth_disabled_pass():
    require_edit_role(_user("", role="admin"))
    require_edit_role(None)


class _Upload:
    filename = "a.json"
    content_type = "application/json"

    def __init__(self):
        self._chunks = [b"{}"]

    async def read(self, *_a):
        return self._chunks.pop() if self._chunks else b""


@pytest.mark.parametrize("call", [
    lambda u, db: analyses.create_analysis(SimpleNamespace(name="x", organization="", analyst="", data=None), u, db),
    lambda u, db: analyses.duplicate_analysis(uuid.uuid4(), u, db),
    lambda u, db: analyses.import_analysis(_Upload(), u, db),
], ids=["create", "duplicate", "import"])
def test_viewer_cannot_create_an_analysis(call):
    db = _FakeDB()
    with pytest.raises(HTTPException) as exc:
        asyncio.run(call(_user("viewer"), db))
    assert exc.value.status_code == 403
    assert db.added == []
