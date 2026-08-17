"""Proxy to Pilot's central personnel directory.

Supports two modes (stored in app_settings, key='directory_source'):
- 'local'  : module returns its own user list (default)
- 'pilot'  : module proxies to Pilot's central directory
Admin can toggle via PUT /api/settings/directory-source.
"""

from __future__ import annotations

import os
import time
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import auth_enabled, get_current_user, require_admin
from src.database import get_db
from src.directory_common import create_local_personnel, list_local_personnel
from src.models import AppSettings, User

router = APIRouter(prefix="/api", tags=["directory"])

PILOT_URL = os.getenv("PILOT_URL", "")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")


async def _get_directory_source(db: AsyncSession) -> str:
    """Resolve the effective directory source.

    Precedence:
      1. Explicit admin choice stored in app_settings (if set)
      2. Auto-default: "pilot" when PILOT_URL + SERVICE_TOKEN are both
         configured (suite deployment), otherwise "local"

    This lets the suite pick up the Pilot directory out-of-the-box
    without requiring the admin to toggle the setting explicitly.
    """
    result = await db.execute(select(AppSettings).where(AppSettings.key == "directory_source"))
    setting = result.scalar_one_or_none()
    if setting and setting.value:
        return setting.value
    return "pilot" if (PILOT_URL and SERVICE_TOKEN) else "local"


async def _fetch_pilot_directory() -> list[dict]:
    if not PILOT_URL or not SERVICE_TOKEN:
        return []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                PILOT_URL.rstrip("/") + "/api/internal/directory",
                headers={"X-Service-Token": SERVICE_TOKEN},
            )
            if resp.is_success:
                return resp.json()
    except Exception:
        pass
    return []


async def _create_pilot_personnel(body: dict) -> tuple[int, dict]:
    """Forward a create-personnel request to Pilot's internal endpoint.

    Returns (status_code, response_body). status >= 400 signals an error
    to surface back to the caller with the Pilot's detail message.
    """
    if not PILOT_URL or not SERVICE_TOKEN:
        return 503, {"detail": "Pilot directory not configured"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                PILOT_URL.rstrip("/") + "/api/internal/directory",
                headers={"X-Service-Token": SERVICE_TOKEN, "Content-Type": "application/json"},
                json=body,
            )
            try:
                payload = resp.json()
            except Exception:
                payload = {"detail": resp.text or "Unknown error"}
            return resp.status_code, payload
    except Exception as e:
        return 503, {"detail": f"Pilot unreachable: {e}"}


@router.get("/directory")
async def get_directory(user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return user list based on configured source (local or pilot)."""
    # `user is None` means "auth disabled" (AUTH_MODE=none serves every
    # route as admin) — an actual unauthenticated request already received
    # its 401 from the get_current_user dependency. Only reject when auth
    # is enabled, so AUTH_MODE=none answers 200 (AUTH-02).
    if auth_enabled() and user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    source = await _get_directory_source(db)
    if source == "pilot":
        return await _fetch_pilot_directory()
    # Local mode: serve the module's own local personnel base (app_settings JSON)
    return await list_local_personnel(db)


@router.post("/directory", status_code=201)
async def create_directory_entry(body: dict, user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Forward personnel creation to Pilot's internal endpoint.

    Works only when directory_source == 'pilot'. In local mode the module
    has no writable directory and rejects the request with 400 — the UI
    should not offer the "create user" action in that case.
    """
    # `user is None` means "auth disabled" (AUTH_MODE=none serves every
    # route as admin) — an actual unauthenticated request already received
    # its 401 from the get_current_user dependency. Only reject when auth
    # is enabled, so AUTH_MODE=none answers 200 (AUTH-02).
    if auth_enabled() and user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    # Creating a central personnel entry is an admin action: it forwards
    # an arbitrary body to Pilot's directory (mass-assignment). Any lower
    # module role must not be able to write the shared directory.
    require_admin(user)
    source = await _get_directory_source(db)
    if source == "pilot":
        status, payload = await _create_pilot_personnel(body)
    else:
        status, payload = await create_local_personnel(db, body)
    if status >= 400:
        detail = payload.get("detail", payload) if isinstance(payload, dict) else payload
        raise HTTPException(status_code=status, detail=detail)
    return payload


@router.get("/settings/directory-source")
async def get_source(user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    source = await _get_directory_source(db)
    return {"source": source, "pilot_available": bool(PILOT_URL), "local_writable": True}


@router.put("/settings/directory-source")
async def set_source(body: dict, user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    source = body.get("source", "local")
    if source not in ("local", "pilot"):
        raise HTTPException(status_code=400, detail="source must be 'local' or 'pilot'")
    result = await db.execute(select(AppSettings).where(AppSettings.key == "directory_source"))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = source
    else:
        db.add(AppSettings(key="directory_source", value=source))
    await db.commit()
    return {"source": source}


# ---- FEAT-31: module-switcher menu proxied from the Pilot registry ----
# Same block in every module's directory_proxy.py — propagate fixes manually.
_menu_cache: dict = {"at": 0.0, "data": None}
_MENU_TTL = 300.0


@router.get("/modules-menu")
async def modules_menu(user: Optional[User] = Depends(get_current_user)):
    """Module-switcher entries derived from the Pilot registry (FEAT-31).

    Same-origin for the browser; Pilot is queried server-side with the
    service token and the public-safe payload cached for 5 minutes (stale
    beats empty when Pilot is momentarily down). 404 when Pilot is not
    configured (standalone) so the frontend falls back to the static
    CT_CONFIG.deployed list. No `user is None` guard: None means auth is
    disabled (sentinel contract), the 401 already happened in the dependency.
    """
    if not PILOT_URL or not SERVICE_TOKEN:
        raise HTTPException(status_code=404, detail="Pilot not configured")
    now = time.monotonic()
    if _menu_cache["data"] is not None and now - _menu_cache["at"] < _MENU_TTL:
        return _menu_cache["data"]
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                PILOT_URL.rstrip("/") + "/api/internal/modules-menu",
                headers={"X-Service-Token": SERVICE_TOKEN},
            )
            if resp.is_success:
                _menu_cache["at"] = now
                _menu_cache["data"] = resp.json()
                return _menu_cache["data"]
    except Exception:
        pass
    if _menu_cache["data"] is not None:
        return _menu_cache["data"]
    raise HTTPException(status_code=503, detail="Pilot unreachable")
