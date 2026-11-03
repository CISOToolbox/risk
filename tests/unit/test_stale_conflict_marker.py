"""Regression: the version-conflict 409 is told apart from any other 409.

The page read every 409 of the whole-project save as "data changed
server-side" (FEAT-33) and reloaded, hiding the server's real reason. Only
the stale-tab guard now carries `X-CT-Conflict: stale`; no other 409 of the
module does.
"""
import asyncio
import os
import re
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import analyses  # noqa: E402
from src.schemas import AnalysisUpdate  # noqa: E402

SRC = Path(__file__).resolve().parents[2] / "src"


class _FakeDB:
    def __init__(self, server_rev):
        self.row = SimpleNamespace(id=uuid.uuid4(), server_rev=server_rev)

    async def get(self, _model, _id):
        return self.row


def test_stale_save_is_marked(monkeypatch):
    monkeypatch.setattr(analyses, "_require", lambda *a, **k: None, raising=False)
    db = _FakeDB(server_rev=5)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(analyses.update_analysis(db.row.id, AnalysisUpdate(data={}, expected_server_rev=4), user=None, db=db))
    assert exc.value.status_code == 409
    assert (exc.value.headers or {}).get("X-CT-Conflict") == "stale"


def test_only_the_stale_guard_carries_the_marker():
    marked = [path.name for path in SRC.rglob("*.py")
              for call in re.findall(r"HTTPException\(\s*status_code=409[^)]*", path.read_text(encoding="utf-8"))
              if "X-CT-Conflict" in call]
    # Exactly one 409 is marked (the FEAT-33 guard); every other one says its reason.
    assert marked == ["analyses.py"]
