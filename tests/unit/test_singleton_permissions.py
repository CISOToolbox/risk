"""Regression: the singleton routes of an analysis (context, settings,
risk_matrix) must enforce the same permission ladder as every other route
under /api/analyses/{analysis_id}.

They used to load the analysis and read or overwrite it with no permission
check: any Risk account, viewer included, or a user whose share was revoked,
could read the context of an analysis not shared with them and overwrite its
context or risk matrix. The matrix is also rendered by the frontend, so it is
now validated server-side.

The last test sweeps the route modules: any handler taking an `analysis_id`
must call a permission check, so a new route cannot reopen the hole.
"""
import ast
import asyncio
import os
import pathlib
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import HTTPException

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.routes import analyses, entity_routes  # noqa: E402

ROUTES_DIR = pathlib.Path(__file__).resolve().parents[2] / "src" / "routes"


class _Result:
    def scalar_one_or_none(self):
        return None


class _FakeDB:
    """Just enough of AsyncSession for the singleton handlers."""

    def __init__(self, analysis):
        self.analysis = analysis
        self.added = []
        self.committed = False

    async def get(self, _model, _id):
        return self.analysis

    async def execute(self, _stmt):
        return _Result()

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed = True


def _user(module_role=""):
    u = SimpleNamespace(id=uuid.uuid4(), email="u@medsecure.local", name="U", role="user")
    u._module_role = module_role
    return u


def _owned_by_someone_else(shared_with=None):
    return SimpleNamespace(id=uuid.uuid4(), name="MedSecure", owner_id=uuid.uuid4(),
                           shared_with=shared_with or [], updated_at=None)


def _run(coro):
    return asyncio.run(coro)


MATRIX = [{"g": 2, "levels": ["Faible", "Moyen"]}, {"g": 1, "levels": ["Faible", "Faible"]}]

READS = [
    lambda a, u, db: entity_routes.get_context(a, u, db),
    lambda a, u, db: entity_routes.get_settings(a, u, db),
    lambda a, u, db: entity_routes.get_risk_matrix(a, u, db),
]
WRITES = [
    lambda a, u, db: entity_routes.put_context(a, {"societe": "x"}, u, db),
    lambda a, u, db: entity_routes.put_settings(a, {"socle_type": "iso"}, u, db),
    lambda a, u, db: entity_routes.put_risk_matrix(a, MATRIX, u, db),
]


@pytest.mark.parametrize("call", READS + WRITES)
@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_user_without_access_is_refused(_mock, call):
    # Not the owner, not shared, no module role (e.g. a revoked share).
    db = _FakeDB(_owned_by_someone_else())
    with pytest.raises(HTTPException) as exc:
        _run(call(uuid.uuid4(), _user(""), db))
    assert exc.value.status_code == 403
    assert not db.added and not db.committed


@pytest.mark.parametrize("call", WRITES)
@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_viewer_cannot_write(_mock, call):
    db = _FakeDB(_owned_by_someone_else())
    with pytest.raises(HTTPException) as exc:
        _run(call(uuid.uuid4(), _user("viewer"), db))
    assert exc.value.status_code == 403
    assert not db.added and not db.committed


@pytest.mark.parametrize("call", READS)
@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_viewer_can_read(_mock, call):
    _run(call(uuid.uuid4(), _user("viewer"), _FakeDB(_owned_by_someone_else())))


@pytest.mark.parametrize("call", WRITES)
@patch("src.routes.analyses.auth_enabled", return_value=True)
def test_shared_editor_can_write(_mock, call):
    user = _user("")
    analysis = _owned_by_someone_else([{"user_id": str(user.id), "permissions": ["read", "edit"]}])
    db = _FakeDB(analysis)
    _run(call(uuid.uuid4(), user, db))
    assert db.committed


@pytest.mark.parametrize("call", READS + WRITES)
def test_missing_analysis_is_404(call):
    with pytest.raises(HTTPException) as exc:
        _run(call(uuid.uuid4(), None, _FakeDB(None)))
    assert exc.value.status_code == 404


# ── Risk matrix validation ───────────────────────────────────────

def test_matrix_levels_are_stored_canonical():
    rows = analyses.validate_risk_matrix(
        [{"g": "3", "levels": ["Low", "Medium", "High", ""]},
         {"g": 1, "levels": ["Elevé", " élevé ", "eleve"]},
         {"g": 2, "levels": ["FAIBLE", "Élevé"]}])
    assert rows == [{"g": 3, "levels": ["Faible", "Moyen", "Élevé", ""]},
                    {"g": 1, "levels": ["Élevé", "Élevé", "Élevé"]},
                    {"g": 2, "levels": ["Faible", "Élevé"]}]


def test_matrix_levels_ignore_normalisation_form():
    nfd = "E\u0301leve\u0301"  # "Élevé" in decomposed form
    assert analyses.validate_risk_matrix([{"g": 1, "levels": [nfd]}]) == [{"g": 1, "levels": ["Élevé"]}]


@pytest.mark.parametrize("bad", [
    {"g": 1},
    [{"g": 0, "levels": []}],
    [{"g": 6, "levels": []}],
    [{"g": True, "levels": []}],
    [{"g": "x", "levels": []}],
    [{"g": "\u00b2", "levels": []}],
    [{"g": 4.0, "levels": []}],
    [{"g": 1, "levels": "Faible"}],
    [{"g": 1, "levels": ["<img src=x onerror=alert(1)>"]}],
    [{"g": 1, "levels": [1]}],
    [{"g": 1, "levels": ["Faible"] * 6}],
    [{"g": 1, "levels": []}] * 6,
    ["row"],
])
def test_invalid_matrix_is_rejected(bad):
    with pytest.raises(HTTPException) as exc:
        analyses.validate_risk_matrix(bad)
    assert exc.value.status_code == 422


def test_whole_analysis_writes_clean_a_legacy_matrix_instead_of_failing():
    # Matrices stored before the check may hold anything: saving, duplicating
    # or restoring such an analysis must still work, without keeping markup.
    legacy = [{"g": 2, "levels": ["Faible", "<img src=x onerror=alert(1)>", 7]},
              {"g": 9, "levels": ["Moyen"]}, "row", {"g": 1, "levels": None}]
    assert analyses.validate_risk_matrix(legacy, strict=False) == [
        {"g": 2, "levels": ["Faible", "", ""]}, {"g": 1, "levels": []}]
    assert analyses.validate_risk_matrix("x", strict=False) == []
    assert analyses.validate_risk_matrix([{"g": 1, "levels": []}] * 7, strict=False) == [
        {"g": 1, "levels": []}] * 5


def test_decompose_data_does_not_reject_a_legacy_matrix():
    db = _FakeDB(None)
    _run(analyses._decompose_data(db, uuid.uuid4(), {"risk_matrix": [{"g": 1, "levels": ["<b>x</b>"]}]}))
    matrices = [o for o in db.added if type(o).__name__ == "AnalysisRiskMatrix"]
    assert [m.matrix for m in matrices] == [[{"g": 1, "levels": [""]}]]


def test_residual_levels_are_computed_from_the_cleaned_matrix():
    data = {"risk_matrix": [{"g": 2, "levels": ["<img src=x onerror=alert(1)>", "Moyen"]}],
            "er": [{"id": "ER-01", "gravite": 2}],
            "ss": [{"id": "SS-01", "er": "ER-01"}, {"id": "SS-02", "er": "ER-01"}],
            "residuals": [{"v_resid": 1}, {"v_resid": 2}]}
    out = analyses._recalculate(data)
    assert [r["risk_level"] for r in out["residuals"]] == ["", "Moyen"]
    assert "<img" not in repr(out)
    assert data["risk_matrix"][0]["levels"][0].startswith("<img")  # input untouched


def test_put_risk_matrix_rejects_markup_before_writing():
    db = _FakeDB(_owned_by_someone_else())
    with pytest.raises(HTTPException) as exc:
        _run(entity_routes.put_risk_matrix(
            uuid.uuid4(), [{"g": 1, "levels": ["<b>x</b>"]}], None, db))
    assert exc.value.status_code == 422
    assert not db.added and not db.committed


# ── Every analysis route checks permissions ──────────────────────

_ROUTE_VERBS = {"get", "put", "post", "patch", "delete"}
_PERM_CALLS = {"_user_permissions", "_can"}


def _name(call: ast.Call) -> str:
    f = call.func
    return f.id if isinstance(f, ast.Name) else getattr(f, "attr", "")


def _router_prefixes(tree: ast.Module) -> dict[str, str]:
    """Router variable -> prefix, from `x = APIRouter(prefix=...)` (string
    constants are kept, anything computed becomes `{?}`)."""
    prefixes = {}
    for node in ast.walk(tree):
        if (isinstance(node, ast.Assign) and isinstance(node.value, ast.Call)
                and _name(node.value) == "APIRouter"):
            prefix = ""
            for kw in node.value.keywords:
                if kw.arg == "prefix":
                    prefix = "".join(
                        n.value if isinstance(n, ast.Constant) and isinstance(n.value, str) else "{?}"
                        for n in ast.walk(kw.value) if isinstance(n, (ast.Constant, ast.Name)))
            for target in node.targets:
                if isinstance(target, ast.Name):
                    prefixes[target.id] = prefix
    return prefixes


def _route_path(fn: ast.AST, prefixes: dict[str, str]) -> str | None:
    for d in fn.decorator_list:
        if (isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute)
                and d.func.attr in _ROUTE_VERBS):
            owner = d.func.value.id if isinstance(d.func.value, ast.Name) else ""
            path = d.args[0].value if d.args and isinstance(d.args[0], ast.Constant) else ""
            return prefixes.get(owner, "") + path
    return None


def _enforces_permission(fn: ast.AST) -> bool:
    """A denied permission must end the request: either `_analysis_for(...)`
    (which raises) or an `if` testing `_can` / `_user_permissions` whose body
    raises."""
    for node in ast.walk(fn):
        if isinstance(node, ast.Call) and _name(node) == "_analysis_for":
            return True
        if isinstance(node, ast.If):
            tests_perm = any(isinstance(n, ast.Call) and _name(n) in _PERM_CALLS
                             for n in ast.walk(node.test))
            raises = any(isinstance(n, ast.Raise) for b in node.body for n in ast.walk(b))
            if tests_perm and raises:
                return True
    return False


def test_every_analysis_route_checks_permissions():
    unchecked = []
    for path in sorted(ROUTES_DIR.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        prefixes = _router_prefixes(tree)
        for fn in ast.walk(tree):
            if not isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            route = _route_path(fn, prefixes)
            if route is None:
                continue
            params = {a.arg for a in fn.args.args + fn.args.kwonlyargs}
            under_analysis = route.startswith("/api/analyses/{")
            if (under_analysis or "analysis_id" in params) and not _enforces_permission(fn):
                unchecked.append(f"{path.name}:{fn.lineno} {fn.name} {route}")
    assert not unchecked, f"routes without a permission check: {unchecked}"


def test_the_sweep_sees_the_analysis_routes():
    # Guard the guard: if prefix parsing broke, the sweep would pass vacuously.
    seen = set()
    for path in sorted(ROUTES_DIR.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        prefixes = _router_prefixes(tree)
        for fn in ast.walk(tree):
            if isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)):
                route = _route_path(fn, prefixes)
                if route and route.startswith("/api/analyses/{"):
                    seen.add(f"{path.name}:{fn.name}")
    assert {"entity_routes.py:put_risk_matrix", "entity_routes.py:get_context",
            "crud_factory.py:put_entities", "analyses.py:update_analysis"} <= seen
