"""BUG-92 — the outbound proxy Pilot pushes reaches Risk, and stays.

Pilot pushes the proxy from its settings to every module at
``PUT /api/internal/proxy``; the module exports it into the process
environment, which httpx honours for every outbound request. The
environment does not outlive the process: a restart lost the proxy until
someone re-synced. Locks, through the route against SQLite:
  - a push with the service token sets the proxy variables;
  - a proxy on a private or metadata address is refused and changes nothing;
  - a push without the right token is refused and changes nothing;
  - the pushed proxy is stored and restored at start-up;
  - an empty value clears the variable and the stored row.
"""
from __future__ import annotations

import logging
import os
import socket
import sys
import urllib.request

import httpx
import pytest
import pytest_asyncio
from fastapi import FastAPI

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@127.0.0.1:5999/risk_test")
os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-long-enough-1234")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from src.database import get_db  # noqa: E402
from src.models import AppSettings, AuditLog  # noqa: E402

_TOKEN = "svc-token-for-tests-0123456789abcdef"
_VARS = ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy")
_ADDRESSES = {"proxy.medsecure.example": "93.184.216.34", "proxy.internal.example": "10.0.0.8"}
_PROXY = "http://ops:s3cret@proxy.medsecure.example:3128"
_ALL = {"HTTP_PROXY": _PROXY, "http_proxy": _PROXY, "HTTPS_PROXY": _PROXY, "https_proxy": _PROXY,
        "NO_PROXY": "localhost,pilot-app,127.0.0.1,::1", "no_proxy": "localhost,pilot-app,127.0.0.1,::1"}


@pytest_asyncio.fixture
async def sessions():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(AppSettings.__table__.create)
        await c.run_sync(AuditLog.__table__.create)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(monkeypatch, sessions):
    import src.routes.internal as internal
    monkeypatch.setattr(internal, "SERVICE_TOKEN", _TOKEN)
    for var in _VARS:  # set then removed, so monkeypatch also undoes what the route exports
        monkeypatch.setenv(var, "")
        monkeypatch.delenv(var)
    for var in [v for v in os.environ if v.endswith("_URL")]:  # the internal services, set per test
        monkeypatch.delenv(var)
    from src import proxy_common
    monkeypatch.setattr(proxy_common, "_pushed_no_proxy", "")  # a fresh process
    monkeypatch.setattr(proxy_common, "_ENV_NO_PROXY", "", raising=False)  # absent before it was introduced
    # Nor the proxy of the shell running the tests, read at import.
    monkeypatch.setattr(proxy_common, "_ENV_PROXY", {"http_proxy": "", "https_proxy": ""}, raising=False)
    monkeypatch.setattr(proxy_common, "_pushed", {"http_proxy": "", "https_proxy": ""}, raising=False)
    monkeypatch.setattr(socket, "getaddrinfo", lambda host, *a, **k: [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", (_ADDRESSES.get(host, host), 0))])

    async def _db():
        async with sessions() as s:
            yield s

    app = FastAPI()
    app.include_router(internal.router)
    app.dependency_overrides[get_db] = _db
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://risk") as c:
        yield c


async def _push(client, body, token=_TOKEN):
    return await client.put("/api/internal/proxy", json=body, headers={"X-Service-Token": token})


def _proxy_env() -> dict:
    return {v: os.environ[v] for v in _VARS if v in os.environ}


async def _rows(sessions) -> dict:
    async with sessions() as s:
        rows = (await s.execute(select(AppSettings).where(AppSettings.key.like("proxy.%")))).scalars().all()
        return {r.key: r.value for r in rows}


@pytest.mark.asyncio
async def test_a_pushed_proxy_is_exported_to_the_process(client):
    resp = await _push(client, {"http_proxy": _PROXY, "https_proxy": _PROXY, "no_proxy": "localhost,pilot-app"})
    assert resp.status_code == 200
    assert _proxy_env() == _ALL


@pytest.mark.asyncio
@pytest.mark.parametrize("value", ["http://1.1.1.1:3128/,http://127.0.0.1:8080",
                                   "http://1.1.1.1:3128/\nhttp://127.0.0.1:8080",
                                   "http://1.1.1.1:3128 http://10.0.0.8"])
async def test_a_proxy_value_with_more_than_one_url_is_refused(client, sessions, value):
    resp = await _push(client, {"http_proxy": _PROXY, "https_proxy": value})
    assert resp.status_code == 400
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_one_refused_field_sets_nothing(client, sessions):
    resp = await _push(client, {"http_proxy": _PROXY, "https_proxy": "http://169.254.169.254"})
    assert resp.status_code == 400
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
@pytest.mark.parametrize("field", ["http_proxy", "https_proxy"])
@pytest.mark.parametrize("url", ["http://proxy.internal.example:3128", "http://169.254.169.254"])
async def test_a_proxy_on_an_internal_address_is_refused(client, sessions, field, url):
    resp = await _push(client, {field: url})
    assert resp.status_code == 400
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_a_push_without_the_service_token_changes_nothing(client, sessions):
    resp = await _push(client, {"https_proxy": _PROXY}, token="wrong")
    assert resp.status_code == 403
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_a_pushed_proxy_is_restored_after_a_restart(client, sessions, monkeypatch):
    await _push(client, {"http_proxy": _PROXY, "https_proxy": _PROXY, "no_proxy": "localhost,pilot-app"})
    assert "s3cret" not in str(await _rows(sessions))  # the URL may carry credentials
    for var in _VARS:  # what a restart leaves in the environment
        monkeypatch.delenv(var, raising=False)
    from src import proxy_common
    monkeypatch.setattr(proxy_common, "_pushed_no_proxy", "")  # and in the module
    from src.proxy_common import restore_proxy
    await restore_proxy(sessions)
    assert _proxy_env() == _ALL


@pytest.mark.asyncio
async def test_an_empty_value_clears_the_proxy(client, sessions):
    await _push(client, {"http_proxy": _PROXY, "https_proxy": _PROXY, "no_proxy": "localhost"})
    resp = await _push(client, {"http_proxy": "", "https_proxy": "", "no_proxy": ""})
    assert resp.status_code == 200
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_a_stored_proxy_that_cannot_be_decrypted_is_not_announced(client, sessions, caplog):
    async with sessions() as s:
        s.add(AppSettings(key="proxy.https_proxy", value="enc:v1:" + "QUJD" * 16))
        await s.commit()
    from src.proxy_common import restore_proxy
    with caplog.at_level("INFO"):
        await restore_proxy(sessions)
    assert _proxy_env() == {}
    messages = [r.getMessage() for r in caplog.records]
    assert not [m for m in messages if "restored" in m]
    assert [m for m in messages if "proxy.https_proxy" in m and "decrypt" in m]


@pytest.mark.asyncio
@pytest.mark.parametrize("field", ["http_proxy", "https_proxy"])
async def test_internal_services_never_go_through_the_proxy(client, sessions, monkeypatch, field):
    monkeypatch.setenv("PILOT_URL", "http://pilot-app:8080")
    monkeypatch.setenv("ASSET_URL", "http://asset-app:8080")
    monkeypatch.setenv("PUBLIC_BASE_URL", "https://ciso.medsecure.example")
    monkeypatch.setenv("APP_URL", "https://suite.medsecure.example")  # the browser-facing URL
    monkeypatch.setenv("SURFACE_EXTERNAL_URL", "https://ext.medsecure.example/surface/")
    resp = await _push(client, {field: _PROXY, "no_proxy": "intranet.medsecure.example"})
    assert resp.status_code == 200
    for _ in range(2):  # pushed, then restored after a restart
        for host in ("pilot-app", "asset-app", "localhost", "127.0.0.1", "intranet.medsecure.example"):
            assert urllib.request.proxy_bypass_environment(host), host
        assert not urllib.request.proxy_bypass_environment("ciso.medsecure.example")
        assert not urllib.request.proxy_bypass_environment("suite.medsecure.example")
        assert not urllib.request.proxy_bypass_environment("ext.medsecure.example")
        assert os.environ[field.upper()] == _PROXY
        for var in _VARS:
            monkeypatch.delenv(var, raising=False)
        from src import proxy_common
        monkeypatch.setattr(proxy_common, "_pushed_no_proxy", "")
        await proxy_common.restore_proxy(sessions)


@pytest.mark.asyncio
async def test_an_empty_push_clears_a_stored_proxy_that_cannot_be_decrypted(client, sessions):
    async with sessions() as s:
        s.add(AppSettings(key="proxy.https_proxy", value="enc:v1:" + "QUJD" * 16))
        await s.commit()
    resp = await _push(client, {"http_proxy": "", "https_proxy": "", "no_proxy": ""})
    assert resp.status_code == 200
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_the_log_names_the_proxy_host_only_and_only_on_change(client, caplog):
    with caplog.at_level(logging.INFO):
        await _push(client, {"http_proxy": _PROXY, "https_proxy": _PROXY, "no_proxy": "localhost"})
    logged = [r.getMessage() for r in caplog.records]
    assert [m for m in logged if "proxy.medsecure.example" in m]
    assert not [m for m in logged if "s3cret" in m]
    caplog.clear()
    with caplog.at_level(logging.INFO):
        await _push(client, {"http_proxy": _PROXY, "https_proxy": _PROXY, "no_proxy": "localhost"})
    assert not [r for r in caplog.records if r.name != "httpx" and "proxy" in r.getMessage()]


@pytest.mark.asyncio
@pytest.mark.parametrize("value", ["localhost,bad entry", "localhost,http://x", "a..b", "10.0.0.0/8",
                                   "[::2]:443"])
async def test_an_invalid_exception_is_refused(client, sessions, value):
    resp = await _push(client, {"https_proxy": _PROXY, "no_proxy": value})
    assert resp.status_code == 400
    assert _proxy_env() == {}
    assert await _rows(sessions) == {}


@pytest.mark.asyncio
async def test_every_exception_form_is_exported_as_httpx_reads_it(client):
    resp = await _push(client, {"https_proxy": _PROXY,
                                "no_proxy": "*.medsecure.local, .lab.example ,[::2],LDAP.MedSecure.example.,"
                                            "intranet.medsecure.example:8443,pacs_01.medsecure.example"})
    assert resp.status_code == 200
    entries = os.environ["NO_PROXY"].split(",")
    assert entries[:6] == ["medsecure.local", "lab.example", "::2", "ldap.medsecure.example",
                           "intranet.medsecure.example:8443", "pacs_01.medsecure.example"]


@pytest.mark.asyncio
@pytest.mark.parametrize("entry,url,direct", [
    ("medsecure.local", "https://medsecure.local/", True),
    ("medsecure.local", "https://pacs.medsecure.local/", True),
    ("medsecure.local", "https://notmedsecure.local/", False),
    ("*.medsecure.local", "https://pacs.medsecure.local/", True),
    (".MedSecure.Local.", "https://pacs.medsecure.local/", True),
    ("192.168.1.10", "https://192.168.1.10/", True),
    ("192.168.1.10", "https://192.168.1.11/", False),
    ("[::1]", "https://[::1]/", True),
    ("intranet.medsecure.example:8443", "https://intranet.medsecure.example:8443/", True),
    ("pacs_01.medsecure.example", "https://pacs_01.medsecure.example/", True),
    ("*", "https://portal.medsecure.example/", True),
])
async def test_an_exception_is_honoured_by_the_modules_http_clients(client, entry, url, direct):
    assert (await _push(client, {"https_proxy": _PROXY, "no_proxy": entry})).status_code == 200
    with httpx.Client() as c:  # an entry httpx cannot parse would break every client of the process
        assert (c._transport_for_url(httpx.URL(url)) is c._transport) is direct


@pytest.mark.asyncio
async def test_the_deployments_own_no_proxy_is_kept(client, sessions, monkeypatch):
    import importlib
    from src import proxy_common
    monkeypatch.setenv("NO_PROXY", "ldap.medsecure.local,intranet.medsecure.example:8443,pacs_01.medsecure.example")
    importlib.reload(proxy_common)  # the deployment's .env, read at start-up
    try:
        await proxy_common.restore_proxy(sessions)  # nothing stored, nothing pushed
        assert os.environ["NO_PROXY"] == "ldap.medsecure.local,intranet.medsecure.example:8443,pacs_01.medsecure.example"
        await _push(client, {"https_proxy": _PROXY, "no_proxy": "pacs.medsecure.local"})
        assert {"ldap.medsecure.local", "pacs.medsecure.local"} <= set(os.environ["NO_PROXY"].split(","))
    finally:
        monkeypatch.delenv("NO_PROXY", raising=False)
        importlib.reload(proxy_common)


@pytest.mark.asyncio
async def test_a_deployment_entry_httpx_cannot_read_is_dropped_and_logged(sessions, monkeypatch, caplog):
    import importlib
    from src import proxy_common
    for var in _VARS:  # not the proxy of the shell running the tests
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("NO_PROXY", "ldap.medsecure.local,[::2")
    importlib.reload(proxy_common)
    try:
        with caplog.at_level(logging.WARNING):
            await proxy_common.restore_proxy(sessions)
        assert os.environ["NO_PROXY"] == "ldap.medsecure.local"
        assert [r for r in caplog.records if "[::2" in r.getMessage()]
    finally:
        monkeypatch.delenv("NO_PROXY", raising=False)
        importlib.reload(proxy_common)


@pytest.mark.asyncio
async def test_the_deployments_own_proxy_is_the_base_pilot_overrides(client, sessions, monkeypatch):
    import importlib
    from src import proxy_common
    corp = "http://corp-proxy.medsecure.example:3128"
    monkeypatch.setenv("HTTPS_PROXY", corp)  # the deployment's .env, read at start-up
    importlib.reload(proxy_common)
    try:
        await _push(client, {"http_proxy": "", "https_proxy": "", "no_proxy": ""})  # Pilot has none
        assert os.environ["HTTPS_PROXY"] == corp and not proxy_common.pushed_proxy()
        await _push(client, {"https_proxy": _PROXY})
        assert os.environ["HTTPS_PROXY"] == _PROXY and proxy_common.pushed_proxy()
        await _push(client, {"https_proxy": ""})  # cleared in Pilot: back to the deployment's
        assert os.environ["HTTPS_PROXY"] == corp and not proxy_common.pushed_proxy()
    finally:
        for var in _VARS:
            monkeypatch.delenv(var, raising=False)
        importlib.reload(proxy_common)


@pytest.mark.asyncio
async def test_a_range_the_deployment_set_is_kept(sessions, monkeypatch, caplog):
    import importlib
    from src import proxy_common
    for var in _VARS:  # not the proxy of the shell running the tests
        monkeypatch.delenv(var, raising=False)
    # httpx ignores an IPv4 range, a child process may not; an IPv6 range breaks every httpx client.
    monkeypatch.setenv("NO_PROXY", "10.0.0.0/8,fd00::/8,ldap.medsecure.local")
    monkeypatch.setenv("HTTPS_PROXY", "http://corp-proxy.medsecure.example:3128")
    importlib.reload(proxy_common)
    try:
        with caplog.at_level(logging.WARNING):
            await proxy_common.restore_proxy(sessions)
        assert os.environ["NO_PROXY"].split(",")[:2] == ["10.0.0.0/8", "ldap.medsecure.local"]
        assert [r for r in caplog.records if "fd00::/8" in r.getMessage()]
        httpx.Client().close()
    finally:
        for var in _VARS:
            monkeypatch.delenv(var, raising=False)
        importlib.reload(proxy_common)


@pytest.mark.asyncio
async def test_a_restart_starts_from_the_stored_rows_not_from_memory(client, sessions, monkeypatch):
    from sqlalchemy import delete
    from src import proxy_common
    await _push(client, {"https_proxy": _PROXY, "no_proxy": "stale.medsecure.local"})
    async with sessions() as s:  # what the database holds now: no proxy at all
        await s.execute(delete(AppSettings))
        await s.commit()
    for var in _VARS:
        monkeypatch.delenv(var, raising=False)
    await proxy_common.restore_proxy(sessions)  # memory still holds the push
    assert "stale.medsecure.local" not in os.environ.get("NO_PROXY", "")
    assert not proxy_common.pushed_proxy()


@pytest.mark.asyncio
async def test_a_lowercase_deployment_proxy_keeps_internal_services_off_it(sessions, monkeypatch):
    import importlib
    from src import proxy_common
    for var in _VARS:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("http_proxy", "http://corp-proxy.medsecure.example:3128")  # lowercase only
    monkeypatch.setenv("PILOT_URL", "http://pilot-app:8080")
    importlib.reload(proxy_common)
    try:
        await proxy_common.restore_proxy(sessions)
        assert urllib.request.proxy_bypass_environment("pilot-app")
    finally:
        for var in _VARS:
            monkeypatch.delenv(var, raising=False)
        importlib.reload(proxy_common)


@pytest.mark.asyncio
async def test_a_database_not_ready_at_start_up_still_leaves_a_readable_no_proxy(monkeypatch, caplog):
    import importlib
    from src import proxy_common
    for var in _VARS:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("NO_PROXY", "fd00::/8,localhost")  # an IPv6 range breaks every httpx client
    importlib.reload(proxy_common)

    def no_table_yet():  # a fresh database: the schema is built after start-up
        raise RuntimeError("relation app_settings does not exist")

    try:
        with caplog.at_level(logging.WARNING):
            await proxy_common.restore_proxy(no_table_yet)  # starts, without a proxy
        assert [r for r in caplog.records if "stored proxy not restored" in r.getMessage()]
        assert os.environ["NO_PROXY"] == "localhost"
        httpx.Client().close()
        assert not proxy_common.pushed_proxy()
    finally:
        for var in _VARS:
            monkeypatch.delenv(var, raising=False)
        importlib.reload(proxy_common)
