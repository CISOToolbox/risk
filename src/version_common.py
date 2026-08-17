# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/version_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""CISO Toolbox — version identity (FEAT-29 phase 1).

Propagated from the shared backend library (version_common) — do not edit this
module's src/ (shared/python is NOT auto-synced; propagate manually).

Exposes the module's version identity for backup compatibility checks:

    {
      "product_version": "1.4.0",          # baked at build (PRODUCT_VERSION)
      "module": "risk",
      "schema_revision": "003_measures",   # alembic_version table (DB truth)
      "schema_fingerprint": "sha256:9f2c…",# computed from SQLAlchemy metadata
      "build_date": "2026-08-12T10:12:00Z",# baked at build (BUILD_DATE)
      "git_sha": "29de9d2"                 # baked at build (GIT_SHA)
    }

- product_version / build_date / git_sha come from env vars injected as
  Dockerfile ARG→ENV by the build (fallback "dev" / None outside images).
- schema_revision is read from the live database (source of truth for what
  the base actually is), tolerant of a missing alembic_version table
  (create_all-only base) — returns None then.
- schema_fingerprint hashes the *code-side* model (tables/columns/types) so a
  base that drifted outside migrations, or a create_all base with no Alembic
  history, is still comparable. Deterministic across processes/arches.

Wiring in a module's main.py:

    from src.version_common import version_payload
    from src.database import get_db
    from src.models import Base

    @app.get("/api/version")
    async def version(db: AsyncSession = Depends(get_db)):
        return await version_payload("risk", Base.metadata, db)

The endpoint is public by design (no secret in the payload): restore-time
compatibility checks must work before any auth context exists.
"""

from __future__ import annotations

import hashlib
import os
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_FINGERPRINT_CACHE: dict[int, str] = {}


def compute_schema_fingerprint(metadata: Any) -> str:
    """sha256 over the sorted (table, column, type, nullable, pk) tuples of a
    SQLAlchemy MetaData. Stable serialization: no repr() of Python objects
    beyond the SQL type's string form (uppercased, whitespace-collapsed)."""
    cached = _FINGERPRINT_CACHE.get(id(metadata))
    if cached:
        return cached
    lines = []
    for tname in sorted(metadata.tables):
        table = metadata.tables[tname]
        for col in sorted(table.columns, key=lambda c: c.name):
            try:
                type_str = str(col.type)
            except Exception:  # exotic type without __str__ compile
                type_str = col.type.__class__.__name__
            type_str = " ".join(type_str.upper().split())
            lines.append(
                f"{tname}.{col.name}:{type_str}:n={int(bool(col.nullable))}:pk={int(bool(col.primary_key))}"
            )
    digest = hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()
    fp = f"sha256:{digest}"
    _FINGERPRINT_CACHE[id(metadata)] = fp
    return fp


async def get_schema_revision(db: AsyncSession) -> Optional[str]:
    """Current Alembic revision from the live DB, or None if the table is
    absent (create_all-only base) or unreadable."""
    try:
        result = await db.execute(text("SELECT version_num FROM alembic_version"))
        row = result.first()
        return row[0] if row else None
    except Exception:
        return None


async def version_payload(module: str, metadata: Any, db: AsyncSession) -> dict:
    """Full version identity for GET /api/version (public, no secret)."""
    return {
        "product_version": os.getenv("PRODUCT_VERSION", "dev"),
        "module": module,
        "schema_revision": await get_schema_revision(db),
        "schema_fingerprint": compute_schema_fingerprint(metadata),
        "build_date": os.getenv("BUILD_DATE") or None,
        "git_sha": os.getenv("GIT_SHA") or None,
    }
