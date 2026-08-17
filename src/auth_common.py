# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/auth_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Shared auth module for CISO Toolbox backend modules.

This file is COPIED into each module's src/ directory by the deploy/sync
scripts. Do NOT edit the per-module copies — edit the original at
shared/python/auth_common.py and propagate.

Supports three modes:
  - **pilot** (AUTH_MODE=pilot, default): Suite-integrated. JWT cookie set by
    Pilot, per-module permissions in the JWT `permissions` dict.
  - **standalone** (AUTH_MODE=standalone): Own login flow via AUTH_TOKEN.
  - **none** (AUTH_MODE=none): Authentication DISABLED — every route is served
    as admin. Dev/test only, and the ONLY way to run without a credential:
    `assert_auth_posture()` refuses to boot if the mode's credential is missing
    in any other mode, so an unconfigured production can never silently open up.

THE `None` CONTRACT — read this before writing an endpoint
----------------------------------------------------------
`get_current_user()` returns `Optional[User]`, and `None` has exactly ONE
meaning: **authentication is disabled** (`auth_enabled()` is False, i.e.
AUTH_MODE=none). It NEVER means "anonymous caller" — a caller with no
valid session gets a 401 raised inside the dependency and never reaches
the handler at all. So, in a handler body:

    auth_enabled() is False  <=>  user is None  <=>  caller is admin

Two mistakes follow from forgetting this, and both are real bugs we shipped:

  * treating `None` as unauthenticated — `if user is None: raise 401` locks
    every caller out in AUTH_MODE=none (AUTH-02, 26 endpoints);
  * reading `user.<attr>` with no guard — `AttributeError` -> 500 in
    AUTH_MODE=none (AUTH-02 follow-up, 42 accesses in `watch`).

The rules, in order of preference:

  1. Test the posture, not the sentinel: `auth_enabled()` /
     `require_admin(user)` / `require_min_role(user, ...)` /
     `get_module_role(user)` all handle `None` correctly. Prefer them.
  2. Need a value off the user? Use the ownership idiom
     `user.id if user else None` (~270 sites do; see `owner_id` columns).
     Consequence, accepted: objects created in AUTH_MODE=none have NO owner.
  3. Need a real identity (a NOT NULL owner_id/user_id FK)? Call
     `require_identity(user)` — it answers a clear 503 instead of a 500.
  4. Want a 401 for an anonymous caller? You already have it: the
     dependency raised it. Do not re-check.

`tests/test_auth_sentinel.py` enforces 1 and the absence of the two
mistakes above across the 9 modules.

Configuration (env vars read at import time):
  JWT_SECRET, AUTH_MODE, AUTH_TOKEN, MODULE_COOKIE, MODULE_NAME

JWT_SECRET is never used as a signing key directly: every key is derived
per module with HKDF (see below), so a module only ever holds the key of
its own trust domain.
"""
from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request
import jwt
from jwt.exceptions import InvalidTokenError as JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import User

# ── Configuration (read once at import) ──────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "")
# Minimum length for the root session secret, checked in
# assert_auth_posture(). Mirrors crypto.py's _MIN_KEY_LEN so the two
# credentials cannot drift apart in strength.
_MIN_JWT_SECRET_LEN = 32
JWT_ALGORITHM = "HS256"


def _session_ttl_hours() -> int:
    """Session lifetime in hours, from JWT_EXPIRY_HOURS (default 24).

    A stateless JWT cannot be revoked before it expires, so this is the upper
    bound on how long a deleted or downgraded account keeps module access.
    Tighten it (e.g. 4–8h) to shrink that window at the cost of more frequent
    re-authentication; the default preserves the historical 24h. Clamped to a
    sane 1h–7d range, and falls back to 24 on a non-numeric value rather than
    refusing to boot over a typo."""
    try:
        return min(168, max(1, int(os.getenv("JWT_EXPIRY_HOURS", "24"))))
    except ValueError:
        return 24


JWT_EXPIRY_HOURS = _session_ttl_hours()
AUTH_MODE = os.getenv("AUTH_MODE", "pilot")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "")
MODULE_COOKIE = os.getenv("MODULE_COOKIE", "module_token")
MODULE_NAME = os.getenv("MODULE_NAME", "")


# ── Per-module key derivation (HKDF) + issuer / audience ─────────
# AUTH-01. Two layers, and BOTH are needed:
#
#  1. iss/aud claims scope a token to one trust domain (a standalone
#     `watch` token replayed on `risk` fails audience verification).
#  2. The SIGNING KEY itself is derived per module — HKDF-SHA256 over
#     JWT_SECRET with info = the token audience. Claims alone were not
#     enough: all 9 modules held the same raw JWT_SECRET, so compromising
#     the least sensitive module handed the attacker the key to forge a
#     token with ANY iss/aud for the eight others. With derivation, a
#     module only ever holds `HKDF(JWT_SECRET, "ciso-module:<its name>")`
#     and HKDF is one-way: that key yields nothing about JWT_SECRET nor
#     about any sibling's key.
#
# Trust domains:
#   - pilot mode:      Pilot is the only issuer (iss="ciso-pilot") but it
#     mints ONE TOKEN PER MODULE, each signed with that module's derived
#     key and scoped to it (aud="ciso-module:<module>"), dropped in that
#     module's own cookie (see module_cookie_name / path=/<module>/ in
#     pilot/src/routes/auth.py). SSO is preserved — a single login still
#     opens every module — without any module holding a suite-wide key.
#   - standalone/none: the module issues for itself only
#     (iss="ciso-<module>", aud="ciso-module:<module>"), same derived key.
#
# The suite-wide audience "ciso-suite" now exists ONLY for Pilot's own
# session cookie, which no module accepts.
# Tokens minted before this change do not verify (different key) —
# existing sessions must log in again (cookies max out at 24h anyway).
JWT_ISSUER_PILOT = "ciso-pilot"
JWT_HKDF_SALT = b"ciso-suite/jwt-key/v1"


def _hkdf_sha256(secret: bytes, salt: bytes, info: bytes, length: int = 32) -> bytes:
    """HKDF-SHA256 (RFC 5869 extract-then-expand), stdlib only.

    Kept dependency-free on purpose: this file is copied verbatim into
    every module image, and key derivation must not hinge on an optional
    transitive package. Cross-checked against
    cryptography.hazmat.primitives.kdf.hkdf.HKDF in the test suite.
    """
    prk = hmac.new(salt, secret, hashlib.sha256).digest()
    out = b""
    block = b""
    counter = 1
    while len(out) < length:
        block = hmac.new(prk, block + info + bytes([counter]), hashlib.sha256).digest()
        out += block
        counter += 1
    return out[:length]


def derive_jwt_key(secret: str, info: str) -> bytes:
    """Signing key for one trust domain. `info` is the token audience."""
    if not secret:
        return b""
    return _hkdf_sha256(secret.encode(), JWT_HKDF_SALT, info.encode())


def module_audience(module: str) -> str:
    """Audience claim of a token addressed to `module`. Also the HKDF info
    string — the rule is: the signing key is derived with info = audience."""
    return f"ciso-module:{module or 'module'}"


def module_cookie_name(module: str) -> str:
    """Cookie carrying `module`'s session in pilot mode. Convention shared
    with Pilot (pilot/src/auth.py) — Pilot sets it, the module reads it.
    Keep the two in sync or the module 401s on every request."""
    return f"{module}_token"


TOKEN_AUDIENCE = module_audience(MODULE_NAME)
TOKEN_ISSUER = JWT_ISSUER_PILOT if AUTH_MODE == "pilot" else f"ciso-{MODULE_NAME or 'module'}"
JWT_KEY = derive_jwt_key(JWT_SECRET, TOKEN_AUDIENCE)

# In pilot mode the cookie is the per-module one Pilot sets (scoped to
# /<module>/ at the edge); MODULE_COOKIE only names the standalone cookie.
COOKIE_NAME = module_cookie_name(MODULE_NAME) if AUTH_MODE == "pilot" else MODULE_COOKIE


# ── Auth state ───────────────────────────────────────────────────

def auth_enabled() -> bool:
    """Is any identity actually being verified?

    THE authoritative predicate for the auth posture, and the one to branch
    on. False means AUTH_MODE=none (dev/test) — every route is served as
    admin and `get_current_user()` yields `None`. See "THE `None` CONTRACT"
    at the top of this module: `not auth_enabled()` is the *cause*,
    `user is None` is only its visible effect. Branch on the cause.
    """
    if AUTH_MODE == "none":
        return False
    if AUTH_MODE == "standalone":
        return bool(AUTH_TOKEN)
    return bool(JWT_SECRET)


def assert_auth_posture() -> None:
    """Fail closed unless no-auth is explicitly opted into. Call once at
    application startup.

    Running with authentication disabled is a deliberate dev/test convenience
    and MUST be requested explicitly via AUTH_MODE=none. In any other mode an
    empty credential (JWT_SECRET in pilot mode, AUTH_TOKEN in standalone) would
    make `auth_enabled()` False and serve every route as admin — a silent
    production footgun. Refuse to boot in that grey area instead of opening up.
    """
    if AUTH_MODE == "none":
        return
    if not auth_enabled():
        cred = "AUTH_TOKEN" if AUTH_MODE == "standalone" else "JWT_SECRET"
        raise RuntimeError(
            f"{cred} is empty but AUTH_MODE is '{AUTH_MODE}', not 'none'. "
            f"Set {cred} to enable authentication (production), or set "
            "AUTH_MODE=none to run without authentication (test only). "
            "Refusing to start."
        )
    # Non-empty was the only bar, so "admin123" booted happily. HS256 module
    # cookies are offline-crackable against a weak secret — and the HKDF `info`
    # strings that derive each module's key are public in this very file, so
    # recovering the root secret forges admin tokens for all nine modules at
    # once. Same floor crypto.py already enforces on ENCRYPTION_KEY.
    if JWT_SECRET and len(JWT_SECRET) < _MIN_JWT_SECRET_LEN:
        raise RuntimeError(
            f"JWT_SECRET is too short ({len(JWT_SECRET)} chars): minimum "
            f"{_MIN_JWT_SECRET_LEN}. It is the root secret every module's "
            "session key is derived from — generate one with "
            "`openssl rand -hex 32`. Refusing to start."
        )
    if AUTH_MODE == "pilot" and not MODULE_NAME:
        # Without MODULE_NAME the module cannot know which derived key and
        # which cookie Pilot minted for it: every request would 401 with no
        # usable diagnostic. Fail at boot with the real cause instead.
        raise RuntimeError(
            "MODULE_NAME is empty but AUTH_MODE is 'pilot'. It selects the "
            "per-module JWT key and session cookie Pilot issues for this "
            "module — set it to the module's short name (e.g. 'risk'). "
            "Refusing to start."
        )


# ── JWT ──────────────────────────────────────────────────────────

def create_jwt(user_id: str, email: str, role: str, permissions: dict | None = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "permissions": permissions or {},
        "iss": TOKEN_ISSUER,
        "aud": TOKEN_AUDIENCE,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_KEY, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    # JWT_KEY (not JWT_SECRET) is what enforces the compartmentalization:
    # a token signed for another module — or with the raw shared secret —
    # fails signature verification here. The audience/issuer check on top
    # keeps pilot and standalone tokens from crossing over. Any failure
    # raises an InvalidTokenError subclass → mapped to 401 by callers.
    return jwt.decode(
        token,
        JWT_KEY,
        algorithms=[JWT_ALGORITHM],
        audience=TOKEN_AUDIENCE,
        issuer=TOKEN_ISSUER,
    )



# ── Upstream revocation check (pilot mode) ───────────────────────
#
# Module sessions are stateless JWTs good for 24h, and nothing used to consult
# Pilot about them: _sync_user_from_jwt below rebuilt the local row from the
# token's claims alone. Deleting or demoting an account in Pilot therefore
# changed nothing until the cookie expired — up to a day of retained access,
# with the permissions frozen at mint time. Pilot's own _resolve_user has
# always refused a token whose user row is gone; this gives the modules the
# same check, over the service-token channel that already exists for the
# other direction.
#
# Cached, because this sits on the request path: one lookup per identity per
# _REVOCATION_TTL, not one per request.
#
# Failure policy is deliberately fail-OPEN, and that is a trade-off worth
# stating. Failing closed would make every module unusable whenever Pilot is
# briefly unavailable — turning a Pilot restart into a suite-wide outage. An
# unreachable Pilot leaves us exactly where we were before this check existed,
# so the transient degradation is "as bad as yesterday", never worse. The
# negative answer, the one that matters, is only ever produced by Pilot itself.
_PILOT_URL = os.getenv("PILOT_URL", "")
_SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")
_REVOCATION_TTL = int(os.getenv("REVOCATION_CHECK_TTL_SECONDS", "300"))
_revocation_cache: dict[str, tuple[float, bool]] = {}


def _revocation_check_enabled() -> bool:
    """Only in pilot mode, and only when the channel is actually configured.

    In standalone mode the module owns its user table — there is no upstream to
    ask. With AUTH_MODE=none there is no identity at all.
    """
    return AUTH_MODE == "pilot" and bool(_PILOT_URL) and bool(_SERVICE_TOKEN)


async def _is_active_upstream(email: str) -> bool:
    """Does Pilot still consider `email` an active account?"""
    if not _revocation_check_enabled() or not email:
        return True

    import time

    now = time.time()
    hit = _revocation_cache.get(email)
    if hit and now - hit[0] < _REVOCATION_TTL:
        return hit[1]

    import httpx

    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=False) as client:
            resp = await client.get(
                f"{_PILOT_URL.rstrip('/')}/api/internal/users/status",
                params={"email": email},
                headers={"X-Service-Token": _SERVICE_TOKEN},
            )
        if resp.status_code != 200:
            # Pilot answered, but not with a verdict (misconfigured token,
            # endpoint absent on an older Pilot). Not a revocation.
            return True
        allowed = bool(resp.json().get("active"))
    except Exception:
        # Unreachable: keep serving, and retry on the next request rather than
        # caching a verdict we did not actually get.
        return True

    _revocation_cache[email] = (now, allowed)
    return allowed


# ── User sync ────────────────────────────────────────────────────

async def _sync_user_from_jwt(db: AsyncSession, payload: dict) -> User:
    """Find or create a local user record from JWT claims.

    The JWT is the source of truth for the display name AND the global role
    (Pilot puts both in the payload). If either is present and differs from
    the stored value, refresh it — otherwise the row is frozen at the value
    it was first created with, so a role change in Pilot (or a standalone
    re-login) would never take effect and a demotion would never apply.
    """
    email = payload.get("email", "")
    jwt_name = (payload.get("name") or "").strip()
    jwt_role = payload.get("role")
    fallback_name = email.split("@")[0] if email else ""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        dirty = False
        if jwt_name and user.name != jwt_name:
            user.name = jwt_name
            dirty = True
        if jwt_role and user.role != jwt_role:
            user.role = jwt_role
            dirty = True
        if dirty:
            await db.commit()
        return user
    user = User(
        email=email,
        name=jwt_name or fallback_name,
        provider="pilot" if AUTH_MODE == "pilot" else "token",
        provider_id=payload.get("sub", ""),
        role=payload.get("role", "user"),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Module-role resolution ───────────────────────────────────────

def _get_module_role(payload: dict) -> str:
    """Extract the role for this module from the JWT permissions dict.

    A per-module role always wins. Otherwise a global role maps through:
    a suite admin is admin everywhere, and a suite "viewer" is read-only
    everywhere (instead of being blocked at get_current_user with no role)."""
    perms = payload.get("permissions") or {}
    if MODULE_NAME and MODULE_NAME in perms:
        return perms[MODULE_NAME]
    role = payload.get("role")
    if role == "admin":
        return "admin"
    if role == "viewer":
        return "viewer"
    return ""


async def _resolve_user_from_cookie(
    request: Request,
    db: AsyncSession,
) -> tuple[Optional[User], str]:
    """Decode the JWT cookie, sync the user row and return (user, module_role).
    Raises 401 if unauthenticated, but does NOT check module permissions
    — callers decide what to enforce."""
    if not auth_enabled():
        return None, "admin"
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_jwt(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    module_role = _get_module_role(payload)
    if not module_role and payload.get("role") == "admin":
        module_role = "admin"
    if not await _is_active_upstream(payload.get("email", "")):
        raise HTTPException(
            status_code=401,
            detail="Account no longer active. Sign in again.",
        )
    user = await _sync_user_from_jwt(db, payload)
    user._module_role = module_role or ""  # type: ignore
    return user, module_role or ""


# ── FastAPI dependencies ─────────────────────────────────────────

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Standard dependency for business routes — rejects users without
    a module role with 403.

    Returns `None` **only** when `auth_enabled()` is False (AUTH_MODE=none):
    the caller is admin and there is no identity to attribute anything to.
    An unauthenticated caller never gets here — this raises 401 first. Do
    not re-interpret the `None`; see "THE `None` CONTRACT" above.
    """
    user, module_role = await _resolve_user_from_cookie(request, db)
    if user is not None and not module_role:
        raise HTTPException(status_code=403, detail="No access to this module")
    return user


async def get_current_user_permissive(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Permissive dependency for /auth/me and /auth/role — always returns
    the user regardless of module permissions.

    Same `None` contract as `get_current_user`: `None` = auth disabled,
    not anonymous.
    """
    user, _ = await _resolve_user_from_cookie(request, db)
    return user


def require_identity(user: Optional[User]) -> User:
    """Narrow the sentinel to a real user, or refuse the request explicitly.

    For the few endpoints whose data model is keyed on *who* you are — a
    NOT NULL `owner_id` / `user_id` foreign key (Watch scopes, per-user
    alert triage). With auth disabled there is no identity to key the row
    on and no row can be written, so answer 503 with the actual cause
    rather than letting `user.id` raise AttributeError -> 500.

    Use this ONLY when an identity is structurally required. For plain
    ownership stamping prefer `user.id if user else None`, which leaves
    the object unowned in AUTH_MODE=none — the accepted trade-off.
    """
    if user is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "This endpoint records a per-user row and cannot be served "
                "while authentication is disabled (AUTH_MODE=none)."
            ),
        )
    return user


# ── Role helpers ─────────────────────────────────────────────────

def get_module_role(user: Optional[User]) -> str:
    """Module role of `user`, or "admin" when auth is disabled (`user is
    None`). Safe to call with the sentinel — that is the point."""
    if user is None:
        return "admin"  # no auth = full access
    # A real user with no role for THIS module has no role — not admin.
    # Business routes never reach this branch (get_current_user 403s on an
    # empty module role first), but the permissive dependencies do, and
    # GET /auth/role was answering "admin" for a role-less account.
    return getattr(user, "_module_role", "") or ""


# Canonical module-role vocabulary for the owner-model modules. Centralised so
# the role strings live in ONE place (a typo can't silently create a role that
# maps to nothing) and the ladder below reads as intent. "control" = internal
# controls team, admin-equivalent at the module level.
ADMIN_MODULE_ROLES = ("admin", "control")
EDITOR_MODULE_ROLES = ("editor", "contributor", "manager")
VIEWER_MODULE_ROLES = ("viewer", "reader", "triager")


# Canonical module-role → permission ladder. Single source of truth for the
# owner-model modules (risk, vendor, compliance) so a given role grants the
# SAME rights everywhere instead of each module rolling its own ladder (or, as
# risk did, having none). An unknown/empty role grants nothing.
def perms_for_module_role(role: str) -> list[str]:
    if role in ADMIN_MODULE_ROLES:
        return ["read", "edit", "delete", "share"]
    if role in EDITOR_MODULE_ROLES:
        return ["read", "edit"]
    if role in VIEWER_MODULE_ROLES:
        return ["read"]
    return []


def require_min_role(user: Optional[User], min_role: str, hierarchy: list[str]) -> None:
    """Check the user has at least min_role in the given hierarchy."""
    role = get_module_role(user)
    if role == "admin":
        return
    if not role:
        raise HTTPException(status_code=403, detail="No access to this module")
    if role not in hierarchy or min_role not in hierarchy:
        raise HTTPException(status_code=403, detail=f"Requires {min_role} role")
    if hierarchy.index(role) < hierarchy.index(min_role):
        raise HTTPException(status_code=403, detail=f"Requires {min_role} role, you have {role}")


def require_admin(user: Optional[User]) -> None:
    """Admin gate. `user is None` = auth disabled = admin: pass through."""
    if user is None:
        return
    role = get_module_role(user)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
