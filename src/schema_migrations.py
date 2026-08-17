# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/schema_migrations.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""FEAT-36 — versioned exports + migration-on-import (backend twin).

The frontend twin is ``shared/ts/ct_schema.ts``. The CONTRACT is shared:

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
    vendor      2     1→2 _migrateAssessmentToV2      1→2 no-op passthrough*

    * The V1→V2 assessment conversion needs the default questionnaire
      template, which lives frontend-side. The backend keeps accepting
      legacy V1 assessments (assessment_validation exemption R9) and the
      conversion happens at first frontend load of the blob — the chain
      entry documents the rev gap without duplicating the template.

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
    "vendor": 2,
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


MODULE_MIGRATIONS: dict[str, dict[int, Callable[[dict], None]]] = {
    "vendor": {1: _vendor_1_to_2},
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
