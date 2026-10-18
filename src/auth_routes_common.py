# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Auth routes shared by the backend modules — dual mode.

Identical copy in the ``src/`` of every module that mounts it (no runtime
shared dependency); keep the copies identical — the next release overwrites
them. A module mounts it through its ``routes/auth.py``.

- **suite mode** (``AUTH_MODE=pilot``): the module delegates the login UI to
  the central Pilot login page. The OAuth/OIDC flow happens in Pilot, which
  then issues a suite-wide JWT cookie read by this module.
- **standalone mode** (``AUTH_MODE=standalone``): the module exposes its own
  provider routes. Configuration is driven by env vars:

    * ``ENTRA_CLIENT_ID`` / ``ENTRA_CLIENT_SECRET`` / ``ENTRA_TENANT_ID``
    * ``GOOGLE_CLIENT_ID`` / ``GOOGLE_CLIENT_SECRET``
    * ``OIDC_CLIENT_ID`` / ``OIDC_CLIENT_SECRET`` / ``OIDC_ISSUER`` /
      ``OIDC_LABEL`` (optional display name)
    * ``AUTH_TOKEN`` — the module's key: it opens the module's local account

  A provider that is not configured is simply reported as unavailable by
  ``/auth/providers`` and its ``/login/<provider>`` endpoint returns 503.
"""
from __future__ import annotations

import logging
import os
import secrets

from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth_common import (
    IDENTITY_PROVIDERS,
    local_account,
    standalone_local_sign_in,
    standalone_permissions,
    standalone_sign_in,
)
from src.auth import (
    AUTH_MODE,
    AUTH_TOKEN,
    COOKIE_NAME,
    MODULE_NAME,
    auth_enabled,
    create_jwt,
    get_current_user_permissive,
    get_module_role,
)
from src.database import get_db
from src.models import User
from src.schemas import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

APP_URL = os.getenv("APP_URL", "")

# ── Provider configuration (standalone mode only) ──────────────────────
ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID", "")
ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET", "")
ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID", "common")

ENTRA_AUTH_URL = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/oauth2/v2.0/authorize"
ENTRA_TOKEN_URL = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/oauth2/v2.0/token"

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

OIDC_CLIENT_ID = os.getenv("OIDC_CLIENT_ID", "")
OIDC_CLIENT_SECRET = os.getenv("OIDC_CLIENT_SECRET", "")
OIDC_ISSUER = os.getenv("OIDC_ISSUER", "")
OIDC_LABEL = os.getenv("OIDC_LABEL", "SSO")

SCOPES = "openid profile email"

_oidc_endpoints: dict | None = None


def _entra_configured() -> bool:
    """Entra is usable only with an EXPLICIT tenant id.

    The default was "common", which builds an issuer of .../common/v2.0 — a
    value no real token ever carries, since Entra stamps the tenant GUID.
    Verification therefore failed for everyone, and the obvious way out of a
    login that "just doesn't work" is to switch verify_iss off, which is
    precisely the check that keeps another tenant's token from being accepted.
    """
    if AUTH_MODE != "standalone" or not (ENTRA_CLIENT_ID and ENTRA_CLIENT_SECRET):
        return False
    if ENTRA_TENANT_ID in ("", "common", "organizations", "consumers"):
        logger.warning(
            "Entra ID is configured but ENTRA_TENANT_ID is %r: set it to your "
            "tenant GUID. Issuer verification cannot succeed against a "
            "multi-tenant placeholder, so the provider is disabled.",
            ENTRA_TENANT_ID or "(empty)",
        )
        return False
    return True


def _google_configured() -> bool:
    return AUTH_MODE == "standalone" and bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def _oidc_configured() -> bool:
    return AUTH_MODE == "standalone" and bool(OIDC_CLIENT_ID and OIDC_CLIENT_SECRET and OIDC_ISSUER)


async def _get_oidc_endpoints() -> dict:
    global _oidc_endpoints
    if _oidc_endpoints:
        return _oidc_endpoints
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(OIDC_ISSUER.rstrip("/") + "/.well-known/openid-configuration", timeout=10)
        resp.raise_for_status()
        _oidc_endpoints = resp.json()
    return _oidc_endpoints


def _identity_provider_configured() -> bool:
    return _entra_configured() or _google_configured() or _oidc_configured()


async def _token_sign_in_open(db: AsyncSession) -> bool:
    """Is the module's key (AUTH_TOKEN) accepted? It opens the module's local
    account, its admin. With an identity provider configured, it is accepted
    while no admin comes from a provider, then refused: the provider's admins
    run the module. Until then, an instance first set up with the key keeps a
    way in to approve its admin; if no admin comes from a provider any more
    (demoted, disabled), it opens again — the way back in. Without a
    provider, it is the only way in (see the .env.example)."""
    if not AUTH_TOKEN:
        return False
    if not _identity_provider_configured():
        return True
    provider_admins = (await db.execute(select(func.count()).select_from(User).where(
        User.role == "admin", User.provider.in_(IDENTITY_PROVIDERS)))).scalar()
    return provider_admins == 0


@router.get("/providers")
async def get_providers(db: AsyncSession = Depends(get_db)):
    if AUTH_MODE == "standalone":
        token_open = await _token_sign_in_open(db)
        return {
            "auth_enabled": auth_enabled(),
            "standalone": True,
            "token": token_open,
            # The key has no local account yet: its first sign-in names one.
            "token_setup": token_open and await local_account(db) is None,
            "entra": _entra_configured(),
            "google": _google_configured(),
            "oidc": _oidc_configured(),
            "oidc_label": OIDC_LABEL if _oidc_configured() else None,
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


# ── The module's key ───────────────────────────────────────────────────
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
    if not await _token_sign_in_open(db):
        raise HTTPException(status_code=403, detail=(
            "Token sign-in is closed once an admin signs in with the identity provider: use your identity provider"))

    # The key is the module's local account: one account, whatever address.
    user = await standalone_local_sign_in(db, body.get("email") or "")
    jwt_token = _issue_jwt(user)
    response = JSONResponse(content={"ok": True, "email": user.email, "role": user.role})
    response.set_cookie(COOKIE_NAME, jwt_token, httponly=True, samesite="lax", max_age=86400, secure=_cookie_secure(), path="/")
    return response


# ── Microsoft Entra / M365 ─────────────────────────────────────────────

# ── OIDC nonce + PKCE ────────────────────────────────────────────
#
# `state` was the only per-flow secret: it stops login CSRF, but says nothing
# about the token that comes back. Two gaps followed, both required by OIDC
# Core §3.1.2.1 / RFC 7636:
#
#  * no `nonce` — an id_token obtained elsewhere for the same client could be
#    replayed into our callback; the nonce binds a token to the exact browser
#    flow that asked for it;
#  * no PKCE — an authorization code intercepted before the exchange is
#    redeemable on its own; with PKCE it is worthless without the verifier,
#    which never leaves this server.

def _new_pkce() -> tuple[str, str]:
    """Return `(code_verifier, code_challenge)` for the S256 method."""
    import hashlib
    from base64 import urlsafe_b64encode

    verifier = secrets.token_urlsafe(64)[:128]
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return verifier, urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def _begin_oauth(response, redirect_after: str, state: str,
                 verifier: str, nonce: str = "") -> None:
    """Attach the per-flow cookies to the redirect that starts the flow."""
    common = dict(httponly=True, samesite="lax", max_age=600,
                  secure=_cookie_secure())
    response.set_cookie("oauth_state", state, **common)
    response.set_cookie("oauth_redirect", redirect_after, **common)
    response.set_cookie("oauth_pkce", verifier, **common)
    if nonce:
        response.set_cookie("oauth_nonce", nonce, **common)


def _verify_nonce(request: Request, claims: dict) -> None:
    """The id_token must echo the nonce minted for THIS browser flow."""
    expected = request.cookies.get("oauth_nonce", "")
    returned = str(claims.get("nonce") or "")
    if not expected or not returned or not secrets.compare_digest(returned, expected):
        raise HTTPException(status_code=400, detail="Invalid OAuth nonce")


def _clear_oauth_cookies(response):
    for name in ("oauth_state", "oauth_redirect", "oauth_pkce", "oauth_nonce"):
        response.delete_cookie(name)
    return response


@router.get("/login/entra")
async def login_entra(request: Request):
    if not _entra_configured():
        raise HTTPException(status_code=503, detail="Entra ID not configured")
    redirect_uri = APP_URL + "/auth/callback/entra"
    redirect_after = _sanitize_redirect(request.query_params.get("redirect", "/"))
    client = AsyncOAuth2Client(client_id=ENTRA_CLIENT_ID, client_secret=ENTRA_CLIENT_SECRET, redirect_uri=redirect_uri, scope=SCOPES)
    verifier, challenge = _new_pkce()
    nonce = secrets.token_urlsafe(32)
    uri, state = client.create_authorization_url(
        ENTRA_AUTH_URL, code_challenge=challenge,
        code_challenge_method="S256", nonce=nonce,
    )
    response = RedirectResponse(url=uri)
    _begin_oauth(response, redirect_after, state, verifier, nonce)
    return response


def _verify_oauth_state(request: Request) -> None:
    """CSRF guard: the `state` the IdP echoes back MUST equal the one we
    set at login (the oauth_state cookie). Without it an attacker can feed
    a victim their own authorization code and silently log the victim into
    the attacker's account (login CSRF)."""
    expected = request.cookies.get("oauth_state")
    returned = request.query_params.get("state")
    # compare_digest, not !=: exploitability is nil here (the state is a
    # short-lived random value and an attacker cannot replay guesses
    # against the same one), but every other secret comparison in the
    # suite is constant-time, and an inconsistent habit is what ends up
    # copied into a place where it does matter.
    if not expected or not returned or not secrets.compare_digest(returned, expected):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")


@router.get("/callback/entra")
async def callback_entra(request: Request, db: AsyncSession = Depends(get_db)):
    if not _entra_configured():
        raise HTTPException(status_code=503, detail="Entra ID not configured")
    redirect_uri = APP_URL + "/auth/callback/entra"
    _verify_oauth_state(request)
    client = AsyncOAuth2Client(client_id=ENTRA_CLIENT_ID, client_secret=ENTRA_CLIENT_SECRET, redirect_uri=redirect_uri)
    try:
        token = await client.fetch_token(
            ENTRA_TOKEN_URL, authorization_response=str(request.url),
            code_verifier=request.cookies.get("oauth_pkce", ""),
        )
    except Exception:
        return RedirectResponse(url="/login.html?error=auth_failed")
    id_token = token.get("id_token", "")
    if not id_token:
        return RedirectResponse(url="/login.html?error=userinfo_failed")
    jwks_url = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/discovery/v2.0/keys"
    issuer = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/v2.0"
    try:
        claims = await _verify_id_token_jwks(id_token, jwks_url, audience=ENTRA_CLIENT_ID, issuer=issuer)
    except Exception:
        return RedirectResponse(url="/login.html?error=token_verify_failed")
    # Signature and audience hold for ANY id_token minted for this client;
    # the nonce is what ties this one to this browser flow.
    _verify_nonce(request, claims)
    email = claims.get("email") or claims.get("preferred_username", "")
    name = claims.get("name", "")
    provider_id = claims.get("oid") or claims.get("sub", "")
    if not email:
        return RedirectResponse(url="/login.html?error=userinfo_failed")
    try:
        user = await _upsert_user(db, email=email, name=name, picture="", provider="entra", provider_id=provider_id)
    except HTTPException as e:
        return _refused_sign_in(e)
    redirect_after = request.cookies.get("oauth_redirect", "/")
    return _login_response(user, redirect_after)


# ── Google ─────────────────────────────────────────────────────────────
@router.get("/login/google")
async def login_google(request: Request):
    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    redirect_uri = APP_URL + "/auth/callback/google"
    redirect_after = _sanitize_redirect(request.query_params.get("redirect", "/"))
    client = AsyncOAuth2Client(client_id=GOOGLE_CLIENT_ID, client_secret=GOOGLE_CLIENT_SECRET, redirect_uri=redirect_uri, scope=SCOPES)
    # Google is read through userinfo, not the id_token: no nonce to
    # bind, but PKCE still protects the code exchange.
    verifier, challenge = _new_pkce()
    uri, state = client.create_authorization_url(
        GOOGLE_AUTH_URL, code_challenge=challenge, code_challenge_method="S256",
    )
    response = RedirectResponse(url=uri)
    _begin_oauth(response, redirect_after, state, verifier)
    return response


@router.get("/callback/google")
async def callback_google(request: Request, db: AsyncSession = Depends(get_db)):
    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    redirect_uri = APP_URL + "/auth/callback/google"
    _verify_oauth_state(request)
    client = AsyncOAuth2Client(client_id=GOOGLE_CLIENT_ID, client_secret=GOOGLE_CLIENT_SECRET, redirect_uri=redirect_uri)
    try:
        token = await client.fetch_token(
            GOOGLE_TOKEN_URL, authorization_response=str(request.url),
            code_verifier=request.cookies.get("oauth_pkce", ""),
        )
    except Exception:
        return RedirectResponse(url="/login.html?error=auth_failed")
    client.token = token
    resp = await client.get(GOOGLE_USERINFO_URL)
    if not resp.is_success:
        return RedirectResponse(url="/login.html?error=userinfo_failed")
    userinfo = resp.json()
    if not _email_verified(userinfo.get("email_verified")):
        return RedirectResponse(url="/login.html?error=email_not_verified")
    try:
        user = await _upsert_user(
            db,
            email=userinfo.get("email", ""),
            name=userinfo.get("name", ""),
            picture=userinfo.get("picture", ""),
            provider="google",
            provider_id=userinfo.get("sub", ""),
        )
    except HTTPException as e:
        return _refused_sign_in(e)
    redirect_after = request.cookies.get("oauth_redirect", "/")
    return _login_response(user, redirect_after)


# ── Custom OIDC ────────────────────────────────────────────────────────
@router.get("/login/oidc")
async def login_oidc(request: Request):
    if not _oidc_configured():
        raise HTTPException(status_code=503, detail="OIDC not configured")
    endpoints = await _get_oidc_endpoints()
    redirect_uri = APP_URL + "/auth/callback/oidc"
    redirect_after = _sanitize_redirect(request.query_params.get("redirect", "/"))
    client = AsyncOAuth2Client(client_id=OIDC_CLIENT_ID, client_secret=OIDC_CLIENT_SECRET, redirect_uri=redirect_uri, scope=SCOPES)
    verifier, challenge = _new_pkce()
    nonce = secrets.token_urlsafe(32)
    uri, state = client.create_authorization_url(
        endpoints["authorization_endpoint"], code_challenge=challenge,
        code_challenge_method="S256", nonce=nonce,
    )
    response = RedirectResponse(url=uri)
    _begin_oauth(response, redirect_after, state, verifier, nonce)
    return response


@router.get("/callback/oidc")
async def callback_oidc(request: Request, db: AsyncSession = Depends(get_db)):
    if not _oidc_configured():
        raise HTTPException(status_code=503, detail="OIDC not configured")
    endpoints = await _get_oidc_endpoints()
    redirect_uri = APP_URL + "/auth/callback/oidc"
    _verify_oauth_state(request)
    client = AsyncOAuth2Client(client_id=OIDC_CLIENT_ID, client_secret=OIDC_CLIENT_SECRET, redirect_uri=redirect_uri)
    try:
        token = await client.fetch_token(
            endpoints["token_endpoint"], authorization_response=str(request.url),
            code_verifier=request.cookies.get("oauth_pkce", ""),
        )
    except Exception:
        return RedirectResponse(url="/login.html?error=auth_failed")
    client.token = token
    userinfo = None
    userinfo_url = endpoints.get("userinfo_endpoint")
    if userinfo_url:
        resp = await client.get(userinfo_url)
        if resp.is_success:
            userinfo = resp.json()
    if userinfo is None:
        id_token = token.get("id_token", "")
        jwks_url = endpoints.get("jwks_uri")
        if not id_token or not jwks_url:
            return RedirectResponse(url="/login.html?error=userinfo_failed")
        try:
            userinfo = await _verify_id_token_jwks(
                id_token, jwks_url,
                audience=OIDC_CLIENT_ID,
                issuer=endpoints.get("issuer"),
            )
        except Exception:
            return RedirectResponse(url="/login.html?error=token_verify_failed")
        # Only on this branch: here the id_token IS the identity assertion, so
        # it must be bound to this flow. The userinfo branch above fetches the
        # identity server-side with a token just obtained — nothing to replay.
        _verify_nonce(request, userinfo)
    email = userinfo.get("email", "")
    if not email:
        return RedirectResponse(url="/login.html?error=userinfo_failed")
    # An address the provider says it has not verified would let anyone sign
    # in as an existing account of the same address. A provider that does not
    # say (some corporate OIDC servers) is trusted for its own users.
    if "email_verified" in userinfo and not _email_verified(userinfo["email_verified"]):
        return RedirectResponse(url="/login.html?error=email_not_verified")
    try:
        user = await _upsert_user(
            db,
            email=email,
            name=userinfo.get("name") or userinfo.get("preferred_username", ""),
            picture=userinfo.get("picture", ""),
            provider="oidc",
            provider_id=userinfo.get("sub", ""),
        )
    except HTTPException as e:
        return _refused_sign_in(e)
    redirect_after = request.cookies.get("oauth_redirect", "/")
    return _login_response(user, redirect_after)


# ── Helpers ────────────────────────────────────────────────────────────
# Standalone provisioning used to accept anyone the IdP would authenticate:
# a new account was created with role "user" and handed a working session on
# the spot. With an "external" Google OAuth client that means any Gmail address
# walks in. Pilot never did this — it parks new accounts as "pending" until an
# admin promotes them. Two gates now, mirroring that:
#   ALLOWED_EMAIL_DOMAINS  optional comma-separated allow-list, checked first;
#   role "pending"         every account past the first, until approved via
#                          PATCH /api/users/{id} (users.py already accepts it).
_ALLOWED_EMAIL_DOMAINS = tuple(
    d.strip().lower().lstrip("@")
    for d in os.getenv("ALLOWED_EMAIL_DOMAINS", "").split(",")
    if d.strip()
)


async def _upsert_user(
    db: AsyncSession,
    email: str,
    name: str,
    picture: str,
    provider: str,
    provider_id: str,
) -> User:
    """Find or create a standalone user. First user gets admin role.

    Raises 403 rather than returning a user when the address is outside the
    allow-list, or when the account still awaits approval — the caller issues
    a session immediately after, so refusing here is what keeps it shut.
    """
    email = (email or "").strip().lower()
    if _ALLOWED_EMAIL_DOMAINS:
        domain = email.rpartition("@")[2]
        if domain not in _ALLOWED_EMAIL_DOMAINS:
            raise HTTPException(status_code=403, detail="Email domain not allowed")
    return await standalone_sign_in(db, email, name=name, picture=picture,
                                    provider=provider, provider_id=provider_id)


def _email_verified(value) -> bool:
    """The provider's ``email_verified`` claim: a boolean, or the string some
    servers send."""
    return value is True or value == "true"


def _refused_sign_in(e: HTTPException) -> RedirectResponse:
    """Back to the sign-in page, saying why an OAuth sign-in was refused."""
    detail = str(e.detail).lower()
    code = ("account_disabled" if "disabled" in detail else
            "awaiting_approval" if "approval" in detail else
            "domain_not_allowed" if "domain" in detail else "access_denied")
    return RedirectResponse(url=f"/login.html?error={code}")


def _issue_jwt(user: User) -> str:
    """Build the per-module JWT for a standalone user.

    A standalone module only speaks for itself, so permissions collapse to
    ``{MODULE_NAME: user.role}``. ``get_current_user`` in src/auth.py reads
    that map and enforces access."""
    return create_jwt(str(user.id), user.email, user.role, standalone_permissions(user))


def _login_response(user: User, redirect_to: str = "/") -> RedirectResponse:
    token = _issue_jwt(user)
    response = RedirectResponse(url=_sanitize_redirect(redirect_to), status_code=302)
    response.set_cookie(
        COOKIE_NAME, token,
        httponly=True, samesite="lax",
        max_age=86400, secure=_cookie_secure(), path="/",
    )
    # Clears the PKCE verifier and the nonce too — a redeemed verifier must
    # not survive into a later flow.
    _clear_oauth_cookies(response)
    return response


def _sanitize_redirect(raw: str | None) -> str:
    """Ensure the post-login redirect is a safe relative path (anti open-redirect)."""
    if not raw:
        return "/"
    if not raw.startswith("/") or raw.startswith("//") or raw.startswith("/\\"):
        return "/"
    if "://" in raw:
        return "/"
    return raw


def _cookie_secure() -> bool:
    """Secure cookie flag, fail-secure (AUTH-05).

    Default is Secure. The ONLY opt-out is an APP_URL that explicitly
    declares plain HTTP (local dev behind no TLS). An empty or malformed
    APP_URL must not silently downgrade the session cookie."""
    return not APP_URL.startswith("http://")


async def _verify_id_token_jwks(id_token: str, jwks_url: str, audience: str, issuer: str | None = None) -> dict:
    """Fetch JWKS, verify the id_token signature, and return its claims.

    Uses PyJWKClient (synchronous); wrapped via asyncio.to_thread to avoid
    blocking the event loop.
    """
    import asyncio
    import jwt as jose_jwt
    from jwt import PyJWKClient

    def _work() -> dict:
        client = PyJWKClient(jwks_url)
        signing_key = client.get_signing_key_from_jwt(id_token)
        options = {"verify_signature": True, "verify_aud": bool(audience), "verify_iss": bool(issuer)}
        return jose_jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256", "RS384", "RS512"],
            audience=audience if audience else None,
            issuer=issuer if issuer else None,
            options=options,
        )

    return await asyncio.to_thread(_work)
