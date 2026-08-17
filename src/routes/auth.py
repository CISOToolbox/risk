"""Auth routes — dual mode:
- pilot mode: delegates OIDC to Pilot
- standalone mode: local token-based login via AUTH_TOKEN
"""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import AUTH_MODE, AUTH_TOKEN, COOKIE_NAME, MODULE_NAME, auth_enabled, create_jwt, get_current_user_permissive, get_module_role
from src.database import get_db
from src.models import User
from src.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

APP_URL = os.getenv("APP_URL", "")


def _cookie_secure() -> bool:
    """Secure cookie flag, fail-secure (AUTH-05).

    Default is Secure. The ONLY opt-out is an APP_URL that explicitly
    declares plain HTTP (local dev behind no TLS). An empty or malformed
    APP_URL must not silently downgrade the session cookie."""
    return not APP_URL.startswith("http://")


@router.get("/providers")
async def get_providers():
    if AUTH_MODE == "standalone":
        return {
            "auth_enabled": auth_enabled(),
            "standalone": True,
        }
    return {
        "auth_enabled": auth_enabled(),
        "central": True,
        "pilot_login": "/login.html",
    }


# Synthetic identity served by /auth/me when AUTH_MODE=none: no user row
# exists and every route is admin by contract, so the SPA bootstrap must get
# a 200 with an admin-shaped payload instead of a 401 (AUTH-02b).
_NO_AUTH_ME = {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "admin@local",
    "name": "Admin (auth disabled)",
    "picture": None,
    "provider": "none",
    "role": "admin",
    "ai_enabled": "true",
    "created_at": None,
    "last_login": None,
}


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user_permissive)):
    if user is None:
        # `None` is the "auth disabled" sentinel — a real missing/invalid
        # token already raised 401 inside the dependency.
        return JSONResponse(_NO_AUTH_ME)
    return user


@router.get("/role")
async def get_role(user: User = Depends(get_current_user_permissive)):
    """Return the user's role for this module (used by frontend to show/hide UI)."""
    role = get_module_role(user)
    return {"module": MODULE_NAME, "role": role, "email": user.email if user else ""}


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"ok": True})
    response.delete_cookie(COOKIE_NAME, samesite="lax", path="/")
    return response


@router.post("/login/token")
async def login_token(body: dict, db: AsyncSession = Depends(get_db)):
    """Standalone mode: login with AUTH_TOKEN secret."""
    if AUTH_MODE != "standalone":
        raise HTTPException(status_code=503, detail="Token login only in standalone mode")
    if not AUTH_TOKEN:
        raise HTTPException(status_code=503, detail="AUTH_TOKEN not configured")

    token = body.get("token", "")
    import secrets as _secrets
    if not _secrets.compare_digest(token, AUTH_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid token")

    email = (body.get("email") or "admin@local").strip().lower()

    # Upsert user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        count_result = await db.execute(select(func.count()).select_from(User))
        role = "admin" if count_result.scalar() == 0 else "user"
        user = User(
            email=email,
            name=email.split("@")[0],
            provider="token",
            provider_id="token",
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # In standalone, first user gets admin on this module
    perms = {MODULE_NAME: "admin"} if user.role == "admin" and MODULE_NAME else {}
    jwt_token = create_jwt(str(user.id), user.email, user.role, perms)
    response = JSONResponse(content={"ok": True, "email": user.email, "role": user.role})
    response.set_cookie(COOKIE_NAME, jwt_token, httponly=True, samesite="lax", max_age=86400, secure=_cookie_secure())
    return response
