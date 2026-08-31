"""Regression (H4): the proxy URL must refuse an internal target.

_validate_proxy_url feeds the process-wide HTTP_PROXY, and httpx runs
trust_env=True, so accepting a bad value redirects every outbound request the
module makes afterwards — including ones another guard had pinned to a
resolved IP.

These three exercise risk's own implementation with DNS mocked. The
cross-module sweeps that used to live here moved to
tests/test_suite_contracts.py: they scan every module, so keeping them inside
one module meant nobody ran them when touching another.
"""
import os
import socket
import sys
from unittest.mock import patch

import pytest

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import HTTPException  # noqa: E402

from src.routes.internal import _validate_proxy_url  # noqa: E402



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
