"""CISO Toolbox — server-side write journal (FEAT-30 P1.6).

Propagated from the shared backend library (audit_common) — do not edit this
module's src/audit.py-equivalent (shared/python is NOT auto-synced).

Superset of the historical surface/appsec/watch ``log_action``: adds the
technical identity of the touched object (``entity_type`` / ``entity_id``)
so a journal line can be tied to the exact restorable object — the FEAT-30
point-in-time UI selects "the event", not "an hour". Modules whose
audit_log predates these columns simply don't pass them (both optional).

The audit_log table is append-only: never UPDATEd, never DELETEd (except
by the module's retention purge). Write-side contract:

- actor + timestamp are SERVER-assigned (user object + now(UTC)),
- the insert runs in a SAVEPOINT and never breaks the caller,
- callers that run after their final commit MUST pass commit=True
  (the watch incident: 12 journal writes after the last commit were
  silently discarded at session close).

Expected AuditLog columns (new modules create the full set via
Base.metadata.create_all; legacy modules lack the two entity columns):
    id, logged_at (tz, indexed), user_email, user_name, action (indexed),
    target, entity_type, entity_id (indexed), details, ip_address
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("audit")


async def log_write(
    db: Any,
    user: Any,
    request: Any,
    action: str,
    *,
    entity_type: str = "",
    entity_id: str = "",
    target: str = "",
    details: Any = "",
    actor: str = "",
    commit: bool = False,
) -> None:
    """Append one journal entry. Never raises.

    ``actor`` overrides the user identity for service-token routes
    (e.g. actor="pilot" on /internal/restore — there is no User there,
    but the write must still be attributable)."""
    from src.models import AuditLog

    try:
        email = actor or ((getattr(user, "email", "") or "") if user else "")
        name = (getattr(user, "name", "") or "") if user else ""
    except Exception:
        email, name = actor or "", ""
    ip = ""
    try:
        ip = request.client.host if request and request.client else ""
    except Exception:
        pass
    detail_str = json.dumps(details, default=str) if isinstance(details, (dict, list)) else str(details or "")

    row = dict(
        logged_at=datetime.now(timezone.utc),
        user_email=email[:255],
        user_name=name[:255],
        action=action[:100],
        target=str(target)[:500],
        details=detail_str[:5000],
        ip_address=ip[:64],
    )
    cols = {c.name for c in AuditLog.__table__.columns}
    if "entity_type" in cols:
        row["entity_type"] = str(entity_type)[:50]
    if "entity_id" in cols:
        row["entity_id"] = str(entity_id)[:64]

    try:
        async with db.begin_nested():
            db.add(AuditLog(**row))
            await db.flush()
        if commit:
            await db.commit()
    except Exception as e:
        logger.warning("audit log write failed: %s", e)


# ── Generic write-journal middleware (FEAT-30 P1.6, full coverage) ──────
# Journals EVERY successful mutating HTTP request (POST/PUT/PATCH/DELETE)
# on /api/* — granular CRUD included — without touching each route.
# Routes already journaled richly by their handler (blob PUT, restores,
# pilot ops…) are excluded per module to avoid duplicate entries.
# /api/internal/* (service token) is skipped: those writes journal
# in-handler with actor="pilot".

# NOTE: nginx strips the module prefix, so the auth router is mounted at
# /auth (NOT /api/auth) — both spellings are skipped. /api/directory is NOT
# skipped: it is a real personnel-creation route (and Pilot's directory CRUD).
_MW_SKIP_PREFIXES = ("/api/internal", "/api/auth", "/auth", "/api/ai", "/ai",
                     "/api/health", "/api/version")
_MW_VERB = {"POST": "created", "PUT": "updated", "PATCH": "updated", "DELETE": "deleted"}


def _mw_entity(path: str) -> tuple[str, str, str]:
    """Best-effort (resource, id, sub) from an /api path: the LAST non-id
    segment is the resource, the id-ish segment right after it (if any) the
    id. When TWO non-id segments are adjacent at the tail (…/si-users/
    import-csv, /sync/vendor), the leaf is a sub-action: resource is the
    previous segment and the leaf lands in the action label instead of a
    meaningless "import-csv.created". Ids: UUIDs, integers, or UPPERCASE
    prefixed keys (U-7, VM-12 — lowercase would swallow "si-users")."""
    import re as _re

    id_re = _re.compile(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,}|\d+|[A-Z]{1,4}-[A-Za-z0-9_]+")
    segs = [s for s in path.split("/") if s]
    if segs and segs[0] == "api":
        segs = segs[1:]
    resource, entity_id, sub = "", "", ""
    for i, s in enumerate(segs):
        if not id_re.fullmatch(s):
            resource = s
            entity_id = segs[i + 1] if i + 1 < len(segs) and id_re.fullmatch(segs[i + 1]) else ""
    if (len(segs) >= 2 and not id_re.fullmatch(segs[-1])
            and not id_re.fullmatch(segs[-2])):
        resource, sub = segs[-2], segs[-1]
        entity_id = ""
    return resource or (segs[-1] if segs else "?"), entity_id, sub


def install_write_journal_middleware(app: Any, exclude: tuple = ()) -> None:
    """``exclude``: tuples (METHOD or "*", path-regex) for routes whose
    handler already writes a richer journal entry."""
    import re as _re

    rules = [(m, _re.compile(p)) for m, p in exclude]

    @app.middleware("http")
    async def _write_journal(request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        try:
            if request.method not in _MW_VERB:
                return response
            path = request.url.path
            if any(path.startswith(p) for p in _MW_SKIP_PREFIXES):
                return response
            if response.status_code >= 400:
                return response
            for meth, rx in rules:
                if meth in ("*", request.method) and rx.fullmatch(path):
                    return response
            email = ""
            try:
                # Pilot keeps these in src.auth (it has no auth_common) —
                # without the fallback every Pilot entry was actor="?".
                try:
                    from src.auth_common import COOKIE_NAME, decode_jwt
                except ImportError:
                    from src.auth import COOKIE_NAME, decode_jwt  # type: ignore[no-redef]
                tok = request.cookies.get(COOKIE_NAME)
                if tok:
                    email = decode_jwt(tok).get("email") or ""
            except Exception:  # noqa: BLE001 — identity is best-effort here
                pass
            resource, entity_id, sub = _mw_entity(path)
            action = (f"{resource}.{sub}.{_MW_VERB[request.method]}" if sub
                      else f"{resource}.{_MW_VERB[request.method]}")
            from src.database import async_session
            async with async_session() as db:
                await log_write(db, None, request, action,
                                actor=email or "?",
                                entity_type=resource, entity_id=entity_id,
                                commit=True)
        except Exception as e:  # noqa: BLE001 — never break the request
            logger.warning("write-journal middleware failed: %s", e)
        return response
