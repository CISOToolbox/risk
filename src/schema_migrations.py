# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""FEAT-36 — versioned exports + migration-on-import (backend twin).

The frontend twin is ``ct_schema.ts``. The CONTRACT is shared:

* every blob app has an integer schema revision (below, ``MODULE_REVS``);
* a file without ``meta.schema_rev`` is rev 0 (every pre-FEAT-36 export);
* a file whose rev is NEWER than the app is REFUSED (``FutureRevError`` →
  422 at the HTTP layer) — never a silent downgrade;
* migrating = normalize (additive defaults) + replay the declared chain
  from the file's rev to the current one + stamp ``meta.schema_rev``.

Correspondence table (KEEP IN SYNC — the fixture test enforces it):

    module      rev   TS chain (ct_schema)            python chain (here)
    risk        1     —                               —
    compliance  1     —                               —
    audit       1     —                               —
    asset       1     —                               —
    access      1     —                               —
    vendor      3     1→2 _migrateAssessmentToV2,     1→2 no-op passthrough*,
                      2→3 classification 0→null       2→3 classification 0→null

    * The V1→V2 assessment conversion needs the default questionnaire template,
      which lives frontend-side, so the python 1→2 stays a documented
      passthrough (legacy V1 assessments are accepted by assessment_validation
      R9 and converted at first frontend load). The V2→V3 classification
      coercion (FEAT-54: a stored 0 now means "assessed: no impact"; old 0s →
      null) must run on EVERY import path, including the server-side
      import/restore that persists the blob — so it runs in python
      (_vendor_2_to_3) AND in the frontend chain, reshaping the ``vendors`` key
      (declared in RESHAPED_KEYS, which the fixture test honours). The live DB
      is migrated by alembic 018.

Bumping a module's rev requires, in the SAME commit: the TS migration,
the python migration (or documented passthrough), and an archived
fixture ``tests/fixtures/exports/<module>/rev<N>.json``.
"""
from __future__ import annotations

from typing import Any, Callable

MODULE_REVS: dict[str, int] = {
    "risk": 1,
    "compliance": 1,
    "audit": 1,
    "asset": 1,
    "access": 1,
    "vendor": 3,
}

# Top-level collections guaranteed to exist after normalization — additive
# only, mirrors the frontend init-template fill (kept minimal: the arrays
# the decompose/validation code iterates over).
_BASELINE_KEYS: dict[str, list[str]] = {
    "risk": ["vm", "bs", "ss", "srov", "er", "eco", "pp", "sr", "ov",
             "measures", "residuals", "referentiels_actifs"],
    "compliance": ["controls", "measures", "proofs", "referentiels_actifs"],
    "audit": ["findings", "actions"],
    "asset": ["assets", "groups", "measures"],
    "access": ["users_rows", "applications", "reviews", "measures"],
    "vendor": ["vendors", "risks", "measures", "documents", "assessments",
               "questionnaire_templates"],
}


class FutureRevError(ValueError):
    def __init__(self, module: str, file_rev: int, app_rev: int):
        super().__init__(
            f"File was produced by a newer {module} (schema {file_rev} > {app_rev}). "
            f"Update the application before importing this file.")
        self.file_rev = file_rev
        self.app_rev = app_rev


def _vendor_1_to_2(data: dict) -> None:
    """Documented passthrough — see the correspondence table above."""


_V54_CLS_KEYS = ("ops_impact", "processes", "replace_difficulty",
                 "data_sensitivity", "integration", "regulatory_impact")
_V54_DEP = ("ops_impact", "processes", "replace_difficulty")
_V54_PEN = ("data_sensitivity", "integration", "regulatory_impact")


def _v54_axis_mean(cls: dict, keys) -> float | None:
    vals = []
    for k in keys:
        v = cls.get(k)
        if v is None:
            return None
        vals.append(float(v))
    return round(sum(vals) / len(vals), 1)


def _vendor_2_to_3(data: dict) -> None:
    """FEAT-54. A classification indicator at 0 used to mean "unset"; it now
    means "assessed: no impact". Every stored 0 is coerced to null (not
    assessed) and the derived exposure axes are recomputed all-or-nothing —
    the same transform as alembic 018 and the frontend SCHEMA_MIGRATIONS[2], so
    importing/restoring a rev<=2 blob never silently promotes an unset vendor to
    "low". This reshapes the ``vendors`` key (declared in RESHAPED_KEYS)."""
    for v in data.get("vendors") or []:
        if not isinstance(v, dict):
            continue
        cls = v.get("classification")
        if isinstance(cls, dict):
            for k in _V54_CLS_KEYS:
                if cls.get(k) == 0:
                    cls[k] = None
            exp = v.get("exposure")
            if isinstance(exp, dict):
                exp["dependance"] = _v54_axis_mean(cls, _V54_DEP)
                exp["penetration"] = _v54_axis_mean(cls, _V54_PEN)


MODULE_MIGRATIONS: dict[str, dict[int, Callable[[dict], None]]] = {
    "vendor": {1: _vendor_1_to_2, 2: _vendor_2_to_3},
}

# Keys a module's migration chain is allowed to RESHAPE in place. The fixture
# test checks these survive (stay present), not that they are byte-identical;
# every other business key must be preserved verbatim.
RESHAPED_KEYS: dict[str, set[str]] = {
    "vendor": {"vendors"},  # FEAT-54 2→3 coerces classification 0 -> null
}


def migrate_blob(module: str, data: Any) -> Any:
    """Normalize + migrate an imported/restored blob in place. Raises
    ``FutureRevError`` for files newer than the app; returns ``data``
    unchanged when it isn't a dict (defensive: callers already validate)."""
    if not isinstance(data, dict):
        return data
    app_rev = MODULE_REVS.get(module, 1)
    meta = data.get("meta")
    file_rev = meta.get("schema_rev", 0) if isinstance(meta, dict) else 0
    if not isinstance(file_rev, int):
        file_rev = 0
    if file_rev > app_rev:
        raise FutureRevError(module, file_rev, app_rev)

    for key in _BASELINE_KEYS.get(module, []):
        if data.get(key) is None:
            data[key] = []
    if not isinstance(data.get("meta"), dict):
        data["meta"] = {}

    chain = MODULE_MIGRATIONS.get(module, {})
    for rev in range(max(file_rev, 1), app_rev):
        fn = chain.get(rev)
        if fn is not None:
            fn(data)

    data["meta"]["schema_rev"] = app_rev
    return data
