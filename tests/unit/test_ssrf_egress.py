"""Regression (H4): outbound-URL SSRF guards must cover every module.

Two egress vectors were validated in only some modules:
  * the admin/Pilot-configured custom-LLM endpoint (POSTed with the user's
    prompt) — guarded in surface/watch/appsec, unguarded in
    access/asset/compliance/risk/vendor;
  * the proxy URL (_validate_proxy_url) — only vendor resolved the hostname,
    so the others accepted a public name that resolves to an internal IP
    (DNS rebinding).

The fix adds a shared ssrf_guard.resolve_safe_target to the custom-LLM branch
of all five modules and a DNS-resolution step to their _validate_proxy_url.
"""
import os
import socket
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import HTTPException  # noqa: E402

from src.routes.internal import _validate_proxy_url  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
MODULES = ["access", "asset", "compliance", "risk", "vendor"]


def _addrinfo(ip):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, 0))]


# ── Behavioural: DNS-rebinding is blocked ────────────────────────────

def test_proxy_url_blocks_hostname_resolving_to_private_ip():
    with patch("socket.getaddrinfo", return_value=_addrinfo("10.0.0.5")):
        with pytest.raises(HTTPException) as exc:
            _validate_proxy_url("https://sneaky.example.com")
    assert exc.value.status_code == 400


def test_proxy_url_blocks_metadata_via_dns():
    with patch("socket.getaddrinfo", return_value=_addrinfo("169.254.169.254")):
        with pytest.raises(HTTPException):
            _validate_proxy_url("http://rebind.example.com")


def test_proxy_url_allows_public_hostname():
    with patch("socket.getaddrinfo", return_value=_addrinfo("93.184.216.34")):
        _validate_proxy_url("https://example.com")  # must not raise


# ── Source guards: every module carries both guards ──────────────────

def test_every_custom_llm_branch_has_ssrf_guard():
    for m in MODULES:
        # After the AI-proxy factorization the custom-LLM branch (and its SSRF
        # guard) moved to src/ai_proxy_common.py for migrated modules; look in
        # both routes/ai.py and the shared proxy.
        src = (REPO / m / "src" / "routes" / "ai.py").read_text()
        common = REPO / m / "src" / "ai_proxy_common.py"
        if common.exists():
            src += common.read_text()
        assert "resolve_safe_target" in src, f"{m} custom-LLM SSRF guard missing"


def test_every_proxy_validator_resolves_dns():
    for m in MODULES:
        src = (REPO / m / "src" / "routes" / "internal.py").read_text()
        assert "getaddrinfo" in src, f"{m}/internal.py _validate_proxy_url has no DNS guard"
