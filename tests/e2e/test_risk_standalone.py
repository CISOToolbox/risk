"""End-to-end tests for the Risk standalone deployment.

Deliberately narrow: the things that must hold for *any* Risk instance a user
has just started, and that break first when the packaging drifts.

  1. the stack boots and reports healthy
  2. the SPA is served and every asset it references resolves
  3. the assets replicated from the shared repository still carry their banner
  4. the authentication posture is the standalone one, and it fails closed
  5. the standalone login journey works end to end

Run:  bash tests/e2e/run-e2e.sh
"""
from __future__ import annotations

import re

import pytest

from conftest import AUTH_TOKEN, MODULE, auth_disabled


# -- 1. Boot and health ------------------------------------------------------

def test_health_endpoint(client):
    """/api/health answers 200 with a JSON body.

    This is what the container HEALTHCHECK and any orchestrator probe rely on.
    """
    r = client.get("/api/health")
    assert r.status == 200, r.text[:300]
    body = r.json()
    assert isinstance(body, dict) and body, "health payload should be a non-empty object"


def test_openapi_schema_is_served(client):
    """FastAPI is really wired up, and not degraded to a static-only fallback."""
    r = client.get("/openapi.json")
    assert r.status == 200
    schema = r.json()
    assert schema.get("paths"), "empty OpenAPI schema"


# -- 2. The SPA and its assets ----------------------------------------------

def test_index_is_served(client):
    r = client.get("/")
    assert r.status == 200, "index -> %s" % r.status
    assert "<html" in r.text.lower()


def test_every_referenced_asset_resolves(client):
    """Every local <script src> / <link href> in index.html returns 200.

    This catches a missing generated asset - the most common breakage when the
    shared frontend is re-published into the module.
    """
    html = client.get("/").text
    refs = re.findall(r'<script[^>]+src="([^"]+)"', html)
    refs += re.findall(r'<link[^>]+href="([^"]+\.css[^"]*)"', html)
    local = [a for a in refs if not a.startswith(("http://", "https://", "//", "data:"))]
    assert local, "index.html references no local asset - is the frontend built?"

    missing = [a.split("?")[0] for a in local
               if client.get(a.split("?")[0]).status != 200]
    assert not missing, "assets missing (404): %s" % missing


def test_replicated_frontend_assets_keep_their_generated_header(client):
    """Shared JS distributed by `shared/ts-build.sh` keeps its GENERATED banner.

    Losing the banner means a generated file was hand-edited in the module -
    the edit will be silently overwritten by the next build. See CONTRIBUTING.md.
    """
    html = client.get("/").text
    scripts = [s.split("?")[0]
               for s in re.findall(r'<script[^>]+src="([^"]+)"', html)
               if not s.startswith(("http://", "https://", "//"))]
    shared = [s for s in scripts
              if "cisotoolbox" in s or s.rsplit("/", 1)[-1] in ("i18n.js", "ct_modal.js",
                                                                "ct_table.js")]
    if not shared:
        pytest.skip("this module serves no shared frontend asset")
    for path in shared:
        head = client.get(path).text[:400]
        assert "GENERATED from shared/" in head, (
            "%s lost its GENERATED header - it was probably hand-edited" % path
        )


# -- 3. Authentication posture ----------------------------------------------

def test_auth_providers_reports_the_expected_posture(client):
    """/auth/providers describes how this deployment authenticates."""
    r = client.get("/auth/providers")
    assert r.status == 200, r.text[:300]
    providers = r.json()
    assert "auth_enabled" in providers
    assert providers.get("standalone") is True, (
        "this deployment is not in standalone mode - check AUTH_MODE"
    )

def test_protected_api_refuses_anonymous_calls(anon):
    """An unauthenticated call is refused - the module fails closed.

    Skipped when the instance runs with AUTH_MODE=none, which disables
    authentication by contract (development only).
    """
    if auth_disabled(anon):
        pytest.skip("instance runs with AUTH_MODE=none - nothing to enforce")
    r = anon.get("/auth/me")
    assert r.status in (401, 403), "/auth/me answered %s without a session" % r.status


def test_login_rejects_a_wrong_token(anon):
    """The standalone login refuses a bad AUTH_TOKEN and sets no cookie."""
    if auth_disabled(anon):
        pytest.skip("instance runs with AUTH_MODE=none")
    r = anon.post("/auth/login/token",
                  {"token": "definitely-not-the-token", "email": "e2e@example.com"})
    assert r.status in (401, 503), "a wrong token was accepted with %s" % r.status
    assert not anon.cookie(MODULE + "_token"), "a session cookie was set for a bad token"


def test_login_then_authenticated_call(client):
    """The full standalone journey: log in with AUTH_TOKEN, receive the module
    session cookie, then read the identity behind it."""
    if not AUTH_TOKEN:
        pytest.skip("set E2E_AUTH_TOKEN (or AUTH_TOKEN in .env) to run the login journey")
    if auth_disabled(client):
        pytest.skip("instance runs with AUTH_MODE=none")

    r = client.post("/auth/login/token",
                    {"token": AUTH_TOKEN, "email": "e2e@example.com"})
    assert r.status == 200, "login failed: %s %s" % (r.status, r.text[:300])

    assert client.cookie(MODULE + "_token"), "login set no %s_token cookie" % MODULE

    me = client.get("/auth/me")
    assert me.status == 200, "/auth/me -> %s right after login" % me.status
    assert me.json().get("email") == "e2e@example.com"

    role = client.get("/auth/role")
    assert role.status == 200
    assert role.json().get("module") == MODULE, (
        "the session is not scoped to this module - check MODULE_NAME"
    )


def test_session_cookie_is_scoped_to_this_module(client):
    """The cookie name is module-specific, so two standalone modules served from
    localhost cannot overwrite each other's session (cookies are not
    port-scoped)."""
    if not AUTH_TOKEN:
        pytest.skip("set E2E_AUTH_TOKEN to run the login journey")
    if auth_disabled(client):
        pytest.skip("instance runs with AUTH_MODE=none")
    client.post("/auth/login/token", {"token": AUTH_TOKEN, "email": "e2e@example.com"})
    assert client.cookie("module_token") == "", (
        "the generic 'module_token' cookie is in use - MODULE_COOKIE is unset"
    )
    assert client.cookie(MODULE + "_token"), "expected a %s_token cookie" % MODULE

