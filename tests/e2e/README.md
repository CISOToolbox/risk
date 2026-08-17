# End-to-end tests - Risk (standalone)

These tests drive a **real running Risk stack** over HTTP. Nothing is mocked.
They use only the Python standard library plus `pytest` - no browser, no
Playwright, no Node toolchain.

## What they cover

| Test | What it catches |
|------|-----------------|
| `test_health_endpoint` | the container never became healthy - bad migration, bad env |
| `test_openapi_schema_is_served` | the API is not wired up (degraded to static-only) |
| `test_index_is_served` | the SPA is not being served |
| `test_every_referenced_asset_resolves` | a JS/CSS asset referenced by `index.html` 404s - the classic breakage after a frontend re-publish |
| `test_replicated_frontend_assets_keep_their_generated_header` | a generated shared asset was hand-edited in this repository (the edit will be overwritten) |
| `test_auth_providers_reports_the_expected_posture` | the deployment is not in the mode it claims |
| `test_protected_api_refuses_anonymous_calls` | the module answers without a session - it fails **open** |
| `test_login_rejects_a_wrong_token` | `AUTH_TOKEN` is not actually verified |
| `test_login_then_authenticated_call` | the standalone login journey is broken |
| `test_session_cookie_is_scoped_to_this_module` | `MODULE_COOKIE` / `MODULE_NAME` unset - sessions can collide between modules on localhost |

## Run everything

```bash
cp .env.example .env        # once, at the repository root
bash tests/e2e/run-e2e.sh
```

`run-e2e.sh` brings the Compose stack up, waits for `/api/health`, runs the
tests, and tears the stack down (volumes included).

| Flag | Effect |
|------|--------|
| `--keep` | leave the stack running after the tests |
| `--no-up` | start nothing; test an instance that is already up |

## Run against an instance you already started

```bash
docker compose up -d
E2E_BASE_URL=http://localhost:8085 python3 -m pytest -v tests/e2e
```

`pytest` is the only dependency:

```bash
python3 -m pip install pytest
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://localhost:8085` | where the module answers |
| `E2E_AUTH_TOKEN` | read from `./.env` | `AUTH_TOKEN`, needed for the login journey |
| `E2E_TIMEOUT` | `20` | per-request timeout, seconds |
| `E2E_BOOT_TIMEOUT` | `60` | how long to wait for the first healthy response |
| `COMPOSE` | auto-detected | `docker compose` or `podman-compose` |

## Behaviour when the stack is down

The whole suite **skips** rather than fails when nothing answers on
`E2E_BASE_URL`: "you did not start the stack" is not a test failure. Tests that
need a credential skip when it is absent, and tests that assert authentication
skip when the instance runs with `AUTH_MODE=none`.

## Adding a test

One user journey per file, named `test_<feature>.py`. Use the `client` fixture
(session-scoped, cookie-aware) for authenticated journeys and `anon` for
unauthenticated assertions. Clean up any data you create - these tests are meant
to be runnable against a long-lived development instance.

## Why there are no browser tests here

The browser-level journeys (Playwright) live in the private monorepo and target
the **integrated suite**: they authenticate by forging the suite-wide
`pilot_token` cookie and navigate module path prefixes behind the nginx proxy
(`/risk/`). A standalone deployment has none of that - it serves the module at
`/`, mints a `risk_token` cookie signed with a key derived per module, and logs
in through `AUTH_TOKEN` instead of Pilot's OAuth. Those tests therefore cannot
run here, and copying them over would only produce a suite that always skips.
This suite is HTTP-level and self-contained on purpose.
