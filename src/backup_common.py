# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/backup_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""CISO Toolbox — shared helpers for /api/internal/export + /internal/restore.

Propagated from the shared backend library (backup_common) — do not edit this
module's src/ (shared/python is NOT auto-synced; propagate manually).

Design rules (FEAT-30 phase 0 audit):
- Timestamps ARE exported (created_at/updated_at included): a restore that
  claims to reproduce a dated state must keep the original dates. The
  restore side parses ISO strings back to datetime/date objects (asyncpg
  refuses raw strings for DateTime/Date columns).
- ``coerce`` is type-aware and COUNTS what it drops: a backup taken on a
  newer schema restores without raising, but the dropped keys are reported
  in the restore response instead of being lost silently.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Date, DateTime


def row_dict(obj: Any, skip: tuple = ()) -> dict:
    """Serialize one ORM row, JSON-safe (datetime → isoformat, UUID → str).
    No default skip: timestamps travel with the backup."""
    out: dict = {}
    for col in obj.__table__.columns:
        if col.name in skip:
            continue
        v = getattr(obj, col.name)
        if isinstance(v, datetime):
            v = v.isoformat()
        elif isinstance(v, date):
            v = v.isoformat()
        elif hasattr(v, "hex") and not isinstance(v, (bytes, bytearray)):
            v = str(v)  # UUID
        out[col.name] = v
    return out


def coerce(model: Any, payload: dict, dropped: Optional[dict] = None) -> dict:
    """Keep only columns that exist on ``model``; parse ISO strings back to
    datetime/date for temporal columns. Unknown keys are counted into
    ``dropped`` ({key: count}) when provided, never lost silently."""
    cols = {c.name: c for c in model.__table__.columns}
    out: dict = {}
    for k, v in payload.items():
        if k not in cols:
            if dropped is not None:
                dropped[k] = dropped.get(k, 0) + 1
            continue
        if isinstance(v, str):
            try:
                if isinstance(cols[k].type, DateTime):
                    v = datetime.fromisoformat(v)
                elif isinstance(cols[k].type, Date):
                    v = date.fromisoformat(v)
            except ValueError:
                v = None
        out[k] = v
    return out


async def restore_root_fields(db: Any, obj: Any, body: dict, user_model: Any) -> None:
    """Same-instance restore of ownership metadata (FEAT-30 P1.8).
    ``shared_with`` is restored verbatim; ``owner_id`` only if the referenced
    user still exists (FK guard — a vanished user must not fail the whole
    restore, the object simply stays with its current owner/NULL)."""
    if "shared_with" in body and hasattr(obj, "shared_with"):
        obj.shared_with = body.get("shared_with") or []
    owner = body.get("owner_id")
    if owner and hasattr(obj, "owner_id"):
        import uuid as _uuid

        from sqlalchemy import select as _select

        try:
            oid = _uuid.UUID(str(owner))
        except ValueError:
            return
        exists = await db.execute(_select(user_model.id).where(user_model.id == oid))
        if exists.scalar_one_or_none() is not None:
            obj.owner_id = oid


# ── Recovery reads (FEAT-30 phase 2, étage 3) ──────────────────────────
# The backup agent restores the module's database at instant T into a
# scratch instance listening on RECOVERY_DB_HOST:RECOVERY_DB_PORT
# (static env — no client-supplied DSN, no injection surface). The module
# reads that state back through its OWN export code with its OWN
# credentials (the restored cluster carries the origin's users), which
# guarantees the recovered payload has exactly the live export's shape.

import contextlib
import os as _os
import subprocess as _subprocess


def recovery_url():
    """Live DATABASE_URL with host/port swapped to the scratch instance."""
    from sqlalchemy.engine import make_url

    from src.database import DATABASE_URL

    host = _os.getenv("RECOVERY_DB_HOST", "")
    if not host:
        raise RuntimeError("recovery not configured (RECOVERY_DB_HOST unset)")
    port = int(_os.getenv("RECOVERY_DB_PORT", "5433"))
    return make_url(DATABASE_URL).set(host=host, port=port)


@contextlib.asynccontextmanager
async def recovery_session():
    """Ephemeral AsyncSession bound to the recovery instance. The engine is
    created per use and disposed — scratch instances come and go."""
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    # Pass the URL OBJECT — str(URL) masks the password as *** (SQLAlchemy 2).
    engine = create_async_engine(recovery_url(), echo=False, pool_size=2)
    try:
        maker = async_sessionmaker(engine, expire_on_commit=False)
        async with maker() as session:
            yield session
    finally:
        await engine.dispose()


def upgrade_recovery_schema() -> str:
    """Bring the scratch instance to the current schema (alembic upgrade
    head) so a state older than a since-applied migration can still be read
    by current code. Runs the module's own migrations against the recovery
    DSN — the live database is never touched. Idempotent; returns the tail
    of alembic's output for diagnostics."""
    url = recovery_url()
    # render_as_string(hide_password=False): str(URL) would hand alembic a
    # DSN whose password is literally "***" (SQLAlchemy 2 masking).
    env = dict(_os.environ, DATABASE_URL=url.render_as_string(hide_password=False))
    r = _subprocess.run(["alembic", "upgrade", "head"], capture_output=True,
                        text=True, env=env, cwd="/app", timeout=300)
    if r.returncode != 0:
        raise RuntimeError(f"alembic upgrade on recovery failed: {(r.stderr or r.stdout)[-400:]}")
    return (r.stdout or "").strip()[-200:]
