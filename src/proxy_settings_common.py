# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Outbound proxy settings router shared by the backend modules.

Identical copy in the ``src/`` of every module that mounts it (no runtime
shared dependency); keep the copies identical — the next release overwrites
them.

In the suite, Pilot owns the outbound proxy and pushes it through
``PUT /api/internal/proxy``; this router then only reports it (``managed``)
and refuses writes with 409. In standalone (``AUTH_MODE != "pilot"``) it is
the module's own way to set it: it goes through ``proxy_common.apply_proxy``
like the Pilot push — same ``app_settings`` rows ``proxy.<field>``, encrypted
at rest, exported at once into the process environment and restored at
start-up. A proxy saved here replaces the deployment's ``HTTP_PROXY`` /
``HTTPS_PROXY`` field by field, an empty field hands it back to them; the
exceptions add to the deployment's ``NO_PROXY``.

Proxy check: ``proxy_common.check_proxy_url`` with ``allow_private=True`` —
a standalone deployment typically goes through an on-site proxy on a private
address, while loopback, link-local (cloud metadata) and the suite's
service names stay refused. The Pilot push keeps refusing private addresses.

A proxy URL may carry credentials (``user:password@``, or a token alone as
``token@``): they never go back to the browser, nor in an error message. GET
masks the password, or the whole userinfo when the user name alone may be the
secret (see ``mask_url``); a PUT that sends the masked URL back unchanged
keeps the stored one. A field left out of a PUT is left as it is; an empty
one is cleared.

Mount it as is::

    from src.proxy_settings_common import router as proxy_settings_router
    app.include_router(proxy_settings_router)
"""
from __future__ import annotations

import asyncio
import logging
import re
from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user, require_admin
from src.auth_common import AUTH_MODE
from src.database import get_db
from src.models import AppSettings, User
# Read through the module, at call time: what the deployment set is captured
# when proxy_common is (re)loaded.
from src import proxy_common
from src.settings_crypto import decrypt_setting

logger = logging.getLogger(__name__)

URL_FIELDS = ("http_proxy", "https_proxy")
MASK = "********"

router = APIRouter(prefix="/api/proxy", tags=["proxy"])


class ProxyConfigIn(BaseModel):
    http_proxy: str | None = Field(None, max_length=2048)
    https_proxy: str | None = Field(None, max_length=2048)
    no_proxy: str | None = Field(None, max_length=4096)


def mask_url(url: str) -> str:
    """``url`` with its credentials masked: the password of ``user:password@``;
    the whole userinfo when the user name alone may be the secret — no ``:``
    or an empty password (a token as the user name), or an encoded character
    in it (httpx decodes ``%3A`` into a password separator)."""
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    userinfo, at, hostport = parts.netloc.rpartition("@")
    if not at:
        return url
    user, colon, password = userinfo.partition(":")
    shown = f"{user}:{MASK}" if colon and password and "%" not in user else MASK
    return urlunsplit(parts._replace(netloc=f"{shown}@{hostport}"))


def _without_credentials(message: str, url: str) -> str:
    """``message`` with every piece of the URL's userinfo masked. A password
    holding an unencoded ``/``, ``?`` or ``#`` splits the URL early, and the
    parser's error then quotes a piece of it, in any case (the resolver
    lower-cases the host it names)."""
    userinfo = url.split("://", 1)[-1].rpartition("@")[0]
    for piece in sorted(set(re.split(r"[:@/?#]", userinfo)), key=len, reverse=True):
        if len(piece) >= 2:
            message = re.sub(re.escape(piece), MASK, message, flags=re.IGNORECASE)
    return message


def _host(url: str) -> str:
    try:
        return urlsplit(url).hostname or "(cleared)"
    except ValueError:
        return "(invalid)"


async def _stored(db: AsyncSession) -> dict[str, str]:
    rows = (await db.execute(select(AppSettings).where(
        AppSettings.key.in_([f"proxy.{f}" for f in proxy_common.PROXY_FIELDS])))).scalars()
    return {r.key.removeprefix("proxy."): decrypt_setting(r.value) or "" for r in rows}


def _clean_url(field: str, raw: str, stored: str) -> str:
    """The URL to save for ``field``: the stored one when the masked URL comes
    back unchanged, otherwise ``raw`` once checked. Raises HTTPException 400."""
    value = raw.strip()
    if MASK in value:
        if stored and mask_url(stored) == value:
            return stored
        raise HTTPException(status_code=400,
                            detail=f"{field}: the proxy URL changed, enter its password again")
    if value:
        try:
            proxy_common.check_proxy_url(value, allow_private=True)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=_without_credentials(
                f"Proxy endpoint not allowed: {e}", value))
    return value


@router.get("/config")
async def proxy_get_config(user: User = Depends(get_current_user),
                           db: AsyncSession = Depends(get_db)):
    stored = await _stored(db)
    return {
        "http_proxy": mask_url(stored.get("http_proxy", "")),
        "https_proxy": mask_url(stored.get("https_proxy", "")),
        "no_proxy": stored.get("no_proxy", ""),
        # What applies when nothing is saved: the deployment's environment.
        "env": {
            "http_proxy": mask_url(proxy_common._ENV_PROXY["http_proxy"]),
            "https_proxy": mask_url(proxy_common._ENV_PROXY["https_proxy"]),
            "no_proxy": proxy_common._ENV_NO_PROXY,
        },
        # Suite: the proxy is Pilot's; the UI shows it read-only.
        "managed": AUTH_MODE == "pilot",
    }


@router.put("/config")
async def proxy_set_config(body: ProxyConfigIn, user: User = Depends(get_current_user),
                           db: AsyncSession = Depends(get_db)):
    require_admin(user)
    if AUTH_MODE == "pilot":
        raise HTTPException(status_code=409,
                            detail="The proxy is managed in Pilot (Settings) in suite mode.")
    stored = await _stored(db)
    values = {}
    for field in URL_FIELDS:
        if getattr(body, field) is not None:
            # Resolves the name: off the event loop.
            values[field] = await asyncio.to_thread(
                _clean_url, field, getattr(body, field), stored.get(field, ""))
    if body.no_proxy is not None:
        values["no_proxy"] = body.no_proxy
    try:
        changed = await proxy_common.apply_proxy(db, values)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Proxy endpoint not allowed: {e}")
    # Host only: a proxy URL may carry credentials.
    if changed:
        logger.info("proxy config saved (%s)", " ".join(
            f"{k}={v if k == 'no_proxy' else _host(v)}" for k, v in changed.items()))
    return {"ok": True}
