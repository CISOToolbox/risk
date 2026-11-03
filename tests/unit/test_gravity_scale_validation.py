"""Regression: the severity scale is stored as numbers and plain text.

The frontend renders the scale's `niveau` and `label` (context page, risk
matrix rows, feared-event selects). They were stored as received, so a
co-editor, a shared import or a direct API call could store markup there.
Every write path now goes through `validate_gravity_level`: the
gravity_scale route rejects a bad row with 422; the whole-analysis writes
(save, import, duplicate, restore) blank the bad value. Reads clean what was
stored before, and the risk matrix read is cleaned the same way.
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

from src.models import AnalysisGravityScale  # noqa: E402
from src.routes import analyses, entity_routes  # noqa: E402

PAYLOAD = '1" data-click="_apiFetch'
FIELDS = ("niveau", "label", "description", "impact_financier", "impact_reputation",
          "impact_reglementaire", "impact_donnees_perso", "impact_operationnel")


def _row(**kw):
    row = {"niveau": 3, "label": "Grave", "description": "Impact\nlong"}
    row.update(kw)
    return row


@pytest.mark.parametrize("niveau,stored", [(3, "3"), ("4", "4"), (" 2 ", "2"), ("", ""), (None, "")])
def test_numeric_levels_are_stored_as_their_number(niveau, stored):
    assert analyses.validate_gravity_level(_row(niveau=niveau))["niveau"] == stored


@pytest.mark.parametrize("niveau", [PAYLOAD, "<img src=x>", 0, 6, 2.5, True, [3], {"x": 1}])
def test_route_rejects_a_level_that_is_not_1_to_5(niveau):
    with pytest.raises(HTTPException) as exc:
        analyses.validate_gravity_level(_row(niveau=niveau))
    assert exc.value.status_code == 422


@pytest.mark.parametrize("field", ["label", "description", "impact_operationnel"])
def test_route_rejects_a_text_field_that_is_not_a_string(field):
    with pytest.raises(HTTPException) as exc:
        analyses.validate_gravity_level(_row(**{field: {"html": "<b>"}}))
    assert exc.value.status_code == 422


def test_label_is_one_line_and_bounded():
    assert analyses.validate_gravity_level(_row(label="  Très\r\ngrave  "))["label"] == "Très grave"
    with pytest.raises(HTTPException):
        analyses.validate_gravity_level(_row(label="x" * 101))


def test_lenient_mode_blanks_instead_of_refusing():
    out = analyses.validate_gravity_level(_row(niveau=PAYLOAD, label=["x"], description=5), strict=False)
    assert out["niveau"] == "" and out["label"] == "" and out["description"] == "5"
    assert analyses.validate_gravity_level("not a row", strict=False)["niveau"] == ""


def test_granular_route_validates_each_row():
    obj = entity_routes._gs_from_dict(uuid.uuid4(), 0, _row(niveau="2"))
    assert obj.niveau == "2" and obj.label == "Grave"
    with pytest.raises(HTTPException) as exc:
        entity_routes._gs_from_dict(uuid.uuid4(), 0, _row(niveau=PAYLOAD))
    assert exc.value.status_code == 422


class _CollectDB:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)


def test_whole_analysis_writes_blank_a_bad_level():
    # Save, import, duplicate and restore all decompose the blob here.
    db = _CollectDB()
    data = {"gravity_scale": [_row(niveau=PAYLOAD, label="<b>G</b>"), _row(niveau=1)]}
    asyncio.run(analyses._decompose_data(db, uuid.uuid4(), data))
    rows = [o for o in db.added if isinstance(o, AnalysisGravityScale)]
    assert [r.niveau for r in rows] == ["", "1"]
    assert rows[0].label == "<b>G</b>"     # text stays text: the frontend escapes it


def test_read_cleans_a_row_stored_before_the_check():
    stored = SimpleNamespace(**{f: "" for f in FIELDS})
    stored.niveau, stored.label = PAYLOAD, "Critique"
    out = entity_routes._gs_to_dict(stored)
    assert out["niveau"] == "" and out["label"] == "Critique"


class _Rows:
    def __init__(self, rows):
        self.rows = rows

    def scalar_one_or_none(self):
        return self.rows[0] if self.rows else None

    def scalars(self):
        return SimpleNamespace(all=lambda: list(self.rows))


class _StoredDB:
    """Serves a poisoned severity scale and matrix, nothing else."""

    def __init__(self, by_model):
        self.by_model = by_model

    async def execute(self, stmt):
        return _Rows(self.by_model.get(stmt.column_descriptions[0]["entity"], []))


def test_analysis_read_cleans_the_stored_scale_and_matrix():
    # GET /api/analyses/<id> serves _reconstruct_data: what the frontend renders.
    from src.models import AnalysisRiskMatrix
    stored = SimpleNamespace(**{f: "" for f in FIELDS})
    stored.niveau, stored.label = PAYLOAD, "Critique"
    matrix = SimpleNamespace(matrix=[{"g": PAYLOAD, "levels": ["Faible"]},
                                     {"g": 2, "levels": ["<svg>", "Low"]}])
    db = _StoredDB({AnalysisGravityScale: [stored], AnalysisRiskMatrix: [matrix]})
    data = asyncio.run(analyses._reconstruct_data(db, uuid.uuid4()))
    assert data["gravity_scale"][0]["niveau"] == "" and data["gravity_scale"][0]["label"] == "Critique"
    assert data["risk_matrix"] == [{"g": 2, "levels": ["", "Faible"]}]


class _Matrix:
    def scalar_one_or_none(self):
        return SimpleNamespace(matrix=[{"g": PAYLOAD, "levels": ["Faible"]},
                                       {"g": 2, "levels": ["<svg>", "Low"]}])


class _MatrixDB:
    async def execute(self, _stmt):
        return _Matrix()


def test_risk_matrix_read_is_cleaned(monkeypatch):
    async def allowed(*_a, **_k):
        return SimpleNamespace()
    monkeypatch.setattr(entity_routes, "_analysis_for", allowed)
    out = asyncio.run(entity_routes.get_risk_matrix(uuid.uuid4(), None, _MatrixDB()))
    assert out == [{"g": 2, "levels": ["", "Faible"]}]
