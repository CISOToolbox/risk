"""Shared fixtures for the Risk standalone end-to-end tests.

These tests drive a REAL running stack over HTTP. Nothing is mocked and no
browser is needed - only the Python standard library plus pytest, so the suite
runs anywhere pytest runs.

Configuration (all optional; the defaults match `docker compose up`):

    E2E_BASE_URL     base URL of the running module  (default http://localhost:8085)
    E2E_AUTH_TOKEN   value of AUTH_TOKEN from .env   (default: read from ./.env)
    E2E_TIMEOUT      per-request timeout in seconds  (default 20)
    E2E_BOOT_TIMEOUT how long to wait for the first healthy response (default 60)
"""
from __future__ import annotations

import http.cookiejar
import json
import os
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest

MODULE = "risk"
DEFAULT_PORT = 8085
REPO_ROOT = Path(__file__).resolve().parents[2]


def _env_file_value(key: str) -> str:
    """Read a key from the repository's .env if present. Never raises."""
    env = REPO_ROOT / ".env"
    if not env.is_file():
        return ""
    for line in env.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:%d" % DEFAULT_PORT).rstrip("/")
AUTH_TOKEN = os.getenv("E2E_AUTH_TOKEN") or _env_file_value("AUTH_TOKEN")
TIMEOUT = float(os.getenv("E2E_TIMEOUT", "20"))

# A local standalone deployment normally carries a self-signed certificate.
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE


class Response:
    """Minimal response object: status, headers, body, decoded JSON."""

    def __init__(self, status, headers, body):
        self.status = status
        self.headers = headers
        self.body = body

    @property
    def text(self):
        return self.body.decode("utf-8", "replace")

    def json(self):
        return json.loads(self.body.decode("utf-8"))


class Client:
    """Tiny stdlib HTTP client with a cookie jar, so a login survives calls."""

    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.jar),
            urllib.request.HTTPSHandler(context=_CTX),
        )

    def url(self, path):
        return path if path.startswith("http") else self.base_url + "/" + path.lstrip("/")

    def request(self, method, path, payload=None):
        data = None
        headers = {"User-Agent": "ciso-e2e"}
        if payload is not None:
            data = json.dumps(payload).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self.url(path), data=data, headers=headers,
                                     method=method)
        try:
            with self.opener.open(req, timeout=TIMEOUT) as r:
                return Response(r.status, r.headers, r.read())
        except urllib.error.HTTPError as e:      # 4xx/5xx are results, not crashes
            return Response(e.code, e.headers, e.read())

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, payload=None):
        return self.request("POST", path, payload)

    def cookie(self, name):
        for c in self.jar:
            if c.name == name:
                return c.value or ""
        return ""


def _wait_for_health(client, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if client.get("/api/health").status == 200:
                return True
        except Exception:
            pass
        time.sleep(2)
    return False


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def client(base_url):
    """Session-wide client, guaranteed to face a reachable module.

    The suite SKIPS (rather than fails) when nothing is listening: "you did not
    start the stack" is not a test failure.
    """
    c = Client(base_url)
    if not _wait_for_health(c, float(os.getenv("E2E_BOOT_TIMEOUT", "60"))):
        pytest.skip(
            "no risk instance answering on " + base_url +
            " - start it with `docker compose up -d`, or run `bash tests/e2e/run-e2e.sh`"
        )
    return c


@pytest.fixture()
def anon(client, base_url):
    """A fresh client with no cookies, for unauthenticated assertions.

    Depends on `client` on purpose: that fixture is the one that verifies the
    stack is reachable, so an unauthenticated test skips (rather than errors
    with a connection failure) when nothing is running.
    """
    return Client(base_url)


def auth_disabled(client):
    """True when the instance runs with AUTH_MODE=none (auth off by contract)."""
    try:
        return client.get("/auth/providers").json().get("auth_enabled") is False
    except Exception:
        return False
