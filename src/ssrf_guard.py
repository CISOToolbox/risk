# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Tiny SSRF guard used by the custom-LLM endpoint validation.

Resolves a hostname and refuses any address that points at a private
range, loopback, link-local, or cloud-instance-metadata IP. Keeps the
custom LLM provider feature from being abused to scan the internal
Docker network or hit AWS/GCP metadata services.

Three entry points:

- ``resolve_safe_target(host)`` — validate a bare hostname/IP and return
  the resolved IP the caller MUST connect to. Returning the address
  (instead of ``None``) closes the TOCTOU window: the caller no longer
  hands the *name* to httpx, which would re-resolve it and can be flipped
  to an internal IP by a TTL-0 DNS-rebinding record.
- ``resolve_safe_url(url)`` — same check on a full URL, returning the
  pieces needed to issue a *pinned* request: a URL whose host is the
  validated IP, a ``Host`` header carrying the original name, and the
  ``sni_hostname`` extension so TLS SNI and certificate verification
  still happen against the real hostname.
- ``resolve_safe_request(url)`` — the same, unless an outbound proxy applies
  to the URL (``proxy_for``, httpx's own NO_PROXY rules): then the request
  goes to the *name* through the proxy, which resolves it. A proxy asked to
  CONNECT an IP is refused by proxies that filter by name, and the network
  behind one often has no public DNS. The name and a literal are still
  checked; a name that resolves here must resolve to safe addresses.

stdlib only — this module is imported at request time by every module.
"""
from __future__ import annotations

import ipaddress
import re
import socket
import urllib.request
from urllib.parse import urlparse, urlsplit, urlunparse


_BLOCKED_HOSTS = {
    "localhost",
    "metadata",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
}

# Compose service names of the suite's own containers. RFC1918 is allowed for
# some callers on purpose (self-hosted GitLab/Keycloak, on-prem LDAP, LAN
# scanning), and that allowance also opened the door to the siblings sitting on
# the same bridge network: `http://pilot-app:8080/api/internal/...` passed with
# the caller's PAT attached. access/src/plugins/base.py already claimed in a
# comment that "Docker siblings' own addresses stay blocked either way" — this
# is the list that makes the claim true. Ported from surface/src/scan_common.py,
# which had it and was the only module protected.
_DOCKER_SIBLING_NAMES = frozenset({
    "pilot-app", "pilot-db",
    "risk-app", "risk-db",
    "vendor-app", "vendor-db",
    "compliance-app", "compliance-db",
    "asset-app", "asset-db",
    "audit-app", "audit-db",
    "access-app", "access-db",
    "appsec-app", "appsec-db",
    "watch-app", "watch-db",
    # Legacy names kept defensively (pre-rename scan -> appsec)
    "scan-app", "scan-db",
    "surface-app", "surface-db",
    "proxy",
    # Bare service names without suffix (compose resolves both)
    "pilot", "risk", "vendor", "compliance", "asset", "access",
    "appsec", "scan", "surface", "watch", "audit",
})

# Cloud instance-metadata addresses. 169.254.0.0/16 is already caught by
# `is_link_local`, but Alibaba (100.100.100.200) and Oracle (192.0.0.192)
# sit outside every `ipaddress` category on some Python versions and would
# otherwise pass the generic checks.
_BLOCKED_IPS = frozenset({
    "169.254.169.254",   # AWS / GCP / Azure / OpenStack
    "fd00:ec2::254",     # AWS IPv6
    "100.100.100.200",   # Alibaba Cloud
    "192.0.0.192",       # Oracle Cloud
})

# Networks that are neither RFC1918 nor flagged `is_private` on every
# supported Python, yet are never a legitimate outbound target:
#   - 100.64.0.0/10 : RFC 6598 carrier-grade NAT (hosts Alibaba metadata)
#   - 192.0.0.0/24  : IETF protocol assignments (hosts Oracle metadata)
_BLOCKED_NETWORKS = (
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("192.0.0.0/24"),
)


def _check_ip(ip, hostname: str, allow_private: bool = False) -> None:
    """Raise ValueError if `ip` is not a safe outbound destination.

    `allow_private=True` keeps RFC1918 reachable — for on-prem connectors
    that legitimately target a LAN address. Loopback, link-local,
    multicast, reserved and every metadata address stay blocked either way.
    """
    if str(ip) in _BLOCKED_IPS:
        raise ValueError(f"Blocked cloud-metadata address for {hostname}")
    if (
        ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        raise ValueError(f"Blocked address {ip} for {hostname}")
    if ip.is_private and not allow_private:
        raise ValueError(f"Blocked address {ip} for {hostname}")
    for net in _BLOCKED_NETWORKS:
        if ip.version == net.version and ip in net:
            raise ValueError(f"Blocked address {ip} for {hostname}")
    # IPv4-mapped / 6to4 IPv6 spellings of an internal IPv4 address.
    if ip.version == 6:
        mapped = getattr(ip, "ipv4_mapped", None) or getattr(ip, "sixtofour", None)
        if mapped is not None:
            _check_ip(mapped, hostname, allow_private)


def _check_name(hostname: str) -> str:
    """The host, without brackets; raises ValueError on an empty, blocked or
    sibling name."""
    if not hostname:
        raise ValueError("Empty hostname")
    host = hostname.strip().strip("[]").rstrip(".")  # "pilot-app." is pilot-app
    if host.lower() in _BLOCKED_HOSTS:
        raise ValueError(f"Blocked hostname: {hostname}")
    # Checked before allow_private: a sibling is refused even for the callers
    # that legitimately reach RFC1918, which is exactly the case that was open.
    if host.lower() in _DOCKER_SIBLING_NAMES:
        raise ValueError(f"Blocked internal service: {hostname}")
    return host


def resolve_safe_target(hostname: str, *, allow_private: bool = False) -> str:
    """Validate `hostname` and return the IP address to connect to.

    Every address the name resolves to is checked (a name with both a
    public and a private A record is refused) and the first one is
    returned so the caller can pin its connection to it. Raises
    ValueError on an unsafe *or unresolvable* host — fail-closed.
    """
    host = _check_name(hostname)

    # Literal IP: no DNS round-trip, the literal is the pinned address.
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None
    if literal is not None:
        _check_ip(literal, hostname, allow_private)
        return str(literal)

    try:
        addrs = socket.getaddrinfo(host, None)
    except (socket.gaierror, UnicodeError) as e:
        raise ValueError(f"Cannot resolve {hostname}: {e}") from e

    pinned: str | None = None
    for _fam, _type, _proto, _canon, sockaddr in addrs:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        _check_ip(ip, hostname, allow_private)
        if pinned is None:
            pinned = ip_str
    if pinned is None:
        raise ValueError(f"Cannot resolve {hostname}: no usable address")
    return pinned


def _parse_target(url: str, require_https: bool):
    """``(parsed, hostname, port)`` of an http(s) URL, or ValueError."""
    parsed = urlparse(url)
    scheme = (parsed.scheme or "").lower()
    if require_https:
        if scheme != "https":
            raise ValueError("Only https:// URLs are allowed")
    elif scheme not in ("http", "https"):
        raise ValueError("Only http(s):// URLs are allowed")

    hostname = parsed.hostname or ""
    if not hostname:
        raise ValueError("Missing host in URL")
    try:
        port = parsed.port
    except ValueError as e:  # malformed port
        raise ValueError(f"Invalid port in URL: {e}") from e
    return parsed, hostname, port


def resolve_safe_url(
    url: str,
    *,
    require_https: bool = False,
    allow_private: bool = False,
) -> tuple[str, dict[str, str], dict[str, str]]:
    """Validate a full URL and return `(pinned_url, headers, extensions)`.

    `pinned_url` targets the IP resolved at validation time, `headers`
    carries the original `Host`, and `extensions` sets `sni_hostname` so
    httpx/httpcore still performs TLS SNI and certificate hostname
    verification against the real name. Pass all three to the request:

        pinned, headers, ext = resolve_safe_url(url)
        await client.head(pinned, headers=headers, extensions=ext)

    Always pair this with `follow_redirects=False`: a redirect target is
    a brand-new URL that has not been through the guard.
    """
    parsed, hostname, port = _parse_target(url, require_https)
    ip = resolve_safe_target(hostname, allow_private=allow_private)

    host_literal = f"[{ip}]" if ":" in ip else ip
    netloc = f"{host_literal}:{port}" if port else host_literal
    pinned_url = urlunparse((
        parsed.scheme, netloc, parsed.path, parsed.params,
        parsed.query, parsed.fragment,
    ))
    host_header = f"{hostname}:{port}" if port else hostname
    return pinned_url, {"Host": host_header}, {"sni_hostname": hostname}


def validate_public_url(
    url: str, *, require_https: bool = False, allow_private: bool = False,
) -> None:
    """Raise ValueError if `url` is not a safe public http(s) target.

    Convenience wrapper for call sites that only need the check (config
    validation), not a pinned request.
    """
    resolve_safe_url(url, require_https=require_https, allow_private=allow_private)


# ── Outbound proxy: which requests go through one ───────────────────────

_DEFAULT_PORTS = {"http": 80, "https": 443}


def _url_parts(url: str) -> tuple[str, str, int | None]:
    """Scheme, host and port of a URL as httpx compares them: lower case,
    no brackets, a default port read as no port."""
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    try:
        port = parts.port
    except ValueError:
        port = None
    return scheme, (parts.hostname or "").lower(), None if port == _DEFAULT_PORTS.get(scheme) else port


def _is_ip(value: str, version: int) -> bool:
    try:
        return ipaddress.ip_address(value.split("/")[0]).version == version
    except ValueError:
        return False


def _exception_covers(entry: str, url: str) -> bool:
    """Whether one NO_PROXY entry covers ``url``, as httpx reads it: the
    pattern it mounts for the entry, matched as its URLPattern does."""
    if "://" in entry:
        pattern = entry
    elif _is_ip(entry, 4) or entry.lower() == "localhost":
        pattern = f"all://{entry}"
    elif _is_ip(entry, 6):
        pattern = f"all://[{entry}]"
    else:
        pattern = f"all://*{entry}"
    p_scheme, p_host, p_port = _url_parts(pattern)
    scheme, host, port = _url_parts(url)
    if p_scheme not in ("all", scheme):
        return False
    if p_port is not None and p_port != port:
        return False
    if p_host.startswith("*."):
        return bool(re.fullmatch(r".+\." + re.escape(p_host[2:]), host))
    if p_host.startswith("*"):
        return bool(re.fullmatch(r"(.+\.)?" + re.escape(p_host[1:]), host))
    return not p_host or p_host == host


def proxy_for(url: str, proxies: dict[str, str] | None = None) -> str | None:
    """The proxy a request to ``url`` goes through, None when it goes
    directly. ``proxies`` maps ``http`` / ``https`` / ``all`` / ``no`` like
    ``urllib.request.getproxies()``; by default the process environment,
    which is what httpx reads. Follows httpx's rules, so a caller that pins
    its own transport routes as every other client of the process."""
    proxies = urllib.request.getproxies_environment() if proxies is None else proxies
    exceptions = [e.strip() for e in (proxies.get("no") or "").split(",")]
    if "*" in exceptions or any(e and _exception_covers(e, url) for e in exceptions):
        return None
    proxy = proxies.get(_url_parts(url)[0]) or proxies.get("all")
    if not proxy:
        return None
    return proxy if "://" in proxy else f"http://{proxy}"


def resolve_safe_request(
    url: str,
    *,
    require_https: bool = False,
    allow_private: bool = False,
    proxies: dict[str, str] | None = None,
) -> tuple[str, dict[str, str], dict[str, str], str | None]:
    """``(url, headers, extensions, proxy)`` for a guarded request.

    Directly: ``resolve_safe_url``'s pinned request, and ``proxy`` None.
    Through a proxy (``proxy_for``): the URL unchanged, so the proxy is asked
    for the name and resolves it. Checked here: blocked and sibling names
    (a final dot ignored), a name without a domain (internal), a literal,
    and every address the name resolves to here; a name this host cannot
    resolve is the proxy's to resolve. Pass ``proxy`` to
    the transport of the request, never leave it to the environment."""
    proxy = proxy_for(url, proxies)
    if proxy is None:
        return (*resolve_safe_url(url, require_https=require_https, allow_private=allow_private), None)
    _parsed, hostname, _port = _parse_target(url, require_https)
    host = _check_name(hostname)
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None
    if literal is not None:
        _check_ip(literal, hostname, allow_private)
        return url, {}, {}, proxy
    if "." not in host:  # a name without a domain only means something inside
        raise ValueError(f"Blocked internal name: {hostname}")
    try:
        addrs = socket.getaddrinfo(host, None)
    except (socket.gaierror, UnicodeError):
        addrs = []  # not resolvable here: the proxy resolves it
    for *_rest, sockaddr in addrs:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            continue
        _check_ip(ip, hostname, allow_private)
    return url, {}, {}, proxy
