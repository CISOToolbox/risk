# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Outbound proxy pushed by Pilot: stored, exported, restored at start-up.

Pilot pushes ``http_proxy`` / ``https_proxy`` / ``no_proxy`` to every module at
``PUT /api/internal/proxy``. The module exports them into the process
environment, which httpx honours (trust_env) for every outbound request. The
environment does not outlive the process, so the values are also stored in
``app_settings`` (rows ``proxy.<field>``, encrypted: a proxy URL may carry
``user:pass@``) and exported again when the module starts.

The environment is process-wide: every httpx client the module creates
follows it, including the calls to Pilot and the sibling modules, which carry
the service token. While a proxy is set, NO_PROXY therefore always holds the
loopback names and the host of every internal service URL (``*_URL``, except
the public ones), next to what Pilot pushed.

The route validates the URLs (``_validate_proxy_url``, ssrf_guard) before
calling ``apply_proxy``. ``restore_proxy`` does not resolve them again: they
were validated when written, and a DNS failure at boot would drop the proxy.
"""
from __future__ import annotations

import ipaddress
import logging
import os
import re
from urllib.parse import urlparse

from sqlalchemy import select

from src.models import AppSettings
from src.settings_crypto import decrypt_setting, encrypt_setting_or_plain

logger = logging.getLogger(__name__)

PROXY_FIELDS = ("http_proxy", "https_proxy", "no_proxy")
_LOOPBACK = ("localhost", "127.0.0.1", "::1")
_pushed_no_proxy = ""  # what Pilot pushed, before the internal hosts are added
# What the deployment itself set (a standalone .env): kept in every export.
_ENV_NO_PROXY = os.environ.get("NO_PROXY") or os.environ.get("no_proxy") or ""
# The deployment's own proxy is the base: a proxy Pilot pushes replaces it,
# one cleared in Pilot brings it back, never leaves the module without.
_ENV_PROXY = {f: os.environ.get(f.upper()) or os.environ.get(f) or "" for f in ("http_proxy", "https_proxy")}
_pushed = {"http_proxy": "", "https_proxy": ""}  # what Pilot pushed, stored or restored
_LABEL = re.compile(r"^(?!-)[a-z0-9_-]{1,63}(?<!-)$")  # httpx also reads an underscore
_warned: set[str] = set()  # deployment entries already reported as unreadable


def _row_key(field: str) -> str:
    return f"proxy.{field}"


def _export(field: str, value: str) -> None:
    for var in (field.upper(), field):
        if value:
            os.environ[var] = value
        else:
            os.environ.pop(var, None)


def _normalize_entry(entry: str) -> str:
    """One proxy exception, in the form httpx reads in NO_PROXY: an IP, a
    domain (which also covers its subdomains), either with an optional
    ``:port``, or ``*``. ``*.x`` and ``.x`` become ``x``; case, a trailing dot
    and IPv6 brackets go. httpx ignores ``*.x``, and an entry it cannot parse
    (an IPv6 in brackets) breaks every client of the process. A range is
    refused: httpx would accept it and never apply it."""
    e = entry.strip().lower()
    if e == "*":
        return "*"
    if e.startswith("[") and e.endswith("]"):
        e = e[1:-1]
    elif e.startswith("[") and "]:" in e:  # httpx cannot tell an IPv6 port from the address
        raise ValueError(f"no_proxy: {entry.strip()!r}: give an IPv6 address without a port")
    if "/" in e and "://" not in e:
        raise ValueError(f"no_proxy: {entry.strip()!r}: ranges are not supported, list the addresses")
    try:
        return str(ipaddress.ip_address(e))
    except ValueError:
        pass
    host, sep, port = e.rpartition(":") if e.count(":") == 1 else (e, "", "")
    if sep and not port.isdigit():
        host = ""
    host = host.rstrip(".")
    domain = host[2:] if host.startswith("*.") else host[1:] if host.startswith(".") else host
    try:
        domain = str(ipaddress.ip_address(domain))
    except ValueError:
        if not domain or not all(_LABEL.match(label) for label in domain.split(".")):
            raise ValueError(f"no_proxy: {entry.strip()!r} is not an IP or a domain") from None
    return domain + (f":{port}" if sep else "")


def normalize_no_proxy(value: str, strict: bool = True, warn: bool = False) -> str:
    """A comma-separated exception list, each entry normalized. ``strict``
    raises on the first invalid entry; otherwise it is left out, and logged
    once if ``warn``."""
    out = []
    for raw in (value or "").split(","):
        if raw.strip():
            try:
                out.append(_normalize_entry(raw))
            except ValueError as e:
                if strict:
                    raise
                if warn and raw.strip() not in _warned:
                    _warned.add(raw.strip())
                    logger.warning("NO_PROXY entry %r left out: %s", raw.strip(), e)
    return ",".join(dict.fromkeys(out))


def _internal_hosts() -> list[str]:
    """Hosts of the internal service URLs this module calls (PILOT_URL,
    ASSET_URL…); public and browser-facing ones are not internal."""
    hosts = []
    for name, value in sorted(os.environ.items()):
        if not name.endswith("_URL") or "PUBLIC" in name or "EXTERNAL" in name or name == "APP_URL":
            continue
        parsed = urlparse(value)
        if parsed.scheme in ("http", "https") and parsed.hostname:
            hosts.append(parsed.hostname)
    return hosts


def _deployment_entries() -> list[str]:
    """The deployment's own NO_PROXY, normalized. An IPv4 range it set is kept
    (normalized): httpx ignores it without breaking, and a child process (a
    browser, a scanner binary) may honour it. An IPv6 range is left out:
    httpx reads it as a host and every client of the process breaks."""
    out = []
    for raw in _ENV_NO_PROXY.split(","):
        entry = raw.strip()
        if not entry:
            continue
        try:
            if "/" in entry and ipaddress.ip_network(entry, strict=False).version == 4:
                out.append(str(ipaddress.ip_network(entry, strict=False)))
            else:
                out.append(_normalize_entry(entry))
        except ValueError:
            normalize_no_proxy(entry, strict=False, warn=True)  # left out, and logged once
    return out


def _export_no_proxy() -> None:
    """NO_PROXY = what Pilot pushed, plus the internal hosts while a proxy is
    set: the service token must never travel through an outside proxy."""
    entries = [e for e in normalize_no_proxy(_pushed_no_proxy, strict=False).split(",") if e]
    entries += _deployment_entries()
    if any(os.environ.get(v) for v in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy")):
        entries += [*_LOOPBACK, *_internal_hosts()]
    _export("no_proxy", ",".join(dict.fromkeys(entries)))  # each entry normalized already


def _check_single_url(field: str, value: str) -> None:
    """One proxy URL per field. The route validates the URL's host only, so
    ``http://public:3128/,http://127.0.0.1:8080`` would pass it, and a
    consumer that reads a list (nuclei's -proxy) would then reach the
    internal one."""
    if field != "no_proxy" and ("," in value or any(c.isspace() or ord(c) < 32 for c in value)):
        raise ValueError(f"{field}: a single proxy URL is expected")


async def apply_proxy(db, body: dict) -> dict[str, str]:
    """Store and export each proxy field present in ``body``; an empty value
    clears it. Returns the fields whose value changed, for the caller's log.
    Raises ValueError, storing nothing, when a value is not a single URL or
    an exception is not an IP or a domain (ranges are refused)."""
    for field in PROXY_FIELDS:
        if field in body:
            _check_single_url(field, str(body[field] or ""))
    if "no_proxy" in body:
        body = {**body, "no_proxy": normalize_no_proxy(str(body["no_proxy"] or ""))}
    changed: dict[str, str] = {}
    for field in PROXY_FIELDS:
        if field not in body:
            continue
        value = str(body[field] or "")
        row = (await db.execute(select(AppSettings).where(AppSettings.key == _row_key(field)))).scalar_one_or_none()
        if row is None and not value:
            continue
        if row is not None and value and decrypt_setting(row.value) == value:
            continue  # unchanged; an empty value always deletes, readable or not
        changed[field] = value
        if value and row:
            row.value = encrypt_setting_or_plain(value)
        elif value:
            db.add(AppSettings(key=_row_key(field), value=encrypt_setting_or_plain(value)))
        else:
            await db.delete(row)
    await db.commit()
    global _pushed_no_proxy
    for field in ("http_proxy", "https_proxy"):
        if field in body:
            _pushed[field] = str(body[field] or "")
            _export(field, _pushed[field] or _ENV_PROXY[field])
    if "no_proxy" in body:
        _pushed_no_proxy = str(body["no_proxy"] or "")
    _export_no_proxy()
    return changed


async def restore_proxy(session_factory) -> None:
    """Export the stored proxy into the environment. Called at start-up."""
    try:
        async with session_factory() as db:
            rows = (await db.execute(select(AppSettings).where(
                AppSettings.key.in_([_row_key(f) for f in PROXY_FIELDS])))).scalars().all()
    except Exception as e:  # no table yet, database not ready: start without a proxy
        logger.warning("stored proxy not restored: %s", e)
        _export_no_proxy()  # the deployment's NO_PROXY still made readable to httpx
        return
    global _pushed_no_proxy
    _pushed_no_proxy = ""  # the stored rows are the source of truth at start-up
    _pushed.update(http_proxy="", https_proxy="")
    restored = []
    for row in sorted(rows, key=lambda r: r.key):
        value = decrypt_setting(row.value)
        if not value:  # ENCRYPTION_KEY changed: Pilot's next push sets it again
            logger.warning("stored proxy %s could not be decrypted: left unset", row.key)
            continue
        field = row.key.removeprefix("proxy.")
        if field == "no_proxy":
            _pushed_no_proxy = value
        else:
            _pushed[field] = value
            _export(field, value)
        restored.append(row.key)
    _export_no_proxy()
    if restored:
        logger.info("stored proxy restored (%s)", ", ".join(restored))
