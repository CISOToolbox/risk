"""Regression: fail closed unless no-auth is explicitly opted into.

Before the fix, an empty JWT_SECRET made `auth_enabled()` return False and
every route was silently served as admin — a production footgun (a client repo
forked from the demo that forgot to set JWT_SECRET booted wide open with no
error). The fix makes AUTH_MODE=none the ONLY way to run without a credential;
`assert_auth_posture()` refuses to boot when the mode's credential is missing
in any other mode.

Exercised on risk's copy of the shared master; auth_common.py is byte-identical
across all modules (md5-verified), so this guards every backend service.
"""
import importlib
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))


def _load(monkeypatch, **env):
    """Reload auth_common with a clean, explicit auth env (config is read at
    import time, so each scenario needs a fresh import)."""
    for key in ("AUTH_MODE", "JWT_SECRET", "AUTH_TOKEN"):
        monkeypatch.delenv(key, raising=False)
    for key, val in env.items():
        monkeypatch.setenv(key, val)
    import auth_common  # noqa: E402
    return importlib.reload(auth_common)


# ── Fail closed: an empty credential must refuse to boot ─────────────

def test_pilot_without_secret_refuses_to_boot(monkeypatch):
    ac = _load(monkeypatch, AUTH_MODE="pilot")
    assert ac.auth_enabled() is False
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        ac.assert_auth_posture()


def test_default_mode_without_secret_refuses_to_boot(monkeypatch):
    # No AUTH_MODE at all → defaults to pilot → still fail closed.
    ac = _load(monkeypatch)
    assert ac.AUTH_MODE == "pilot"
    with pytest.raises(RuntimeError, match="Refusing to start"):
        ac.assert_auth_posture()


def test_standalone_without_token_refuses_to_boot(monkeypatch):
    ac = _load(monkeypatch, AUTH_MODE="standalone")
    assert ac.auth_enabled() is False
    with pytest.raises(RuntimeError, match="AUTH_TOKEN"):
        ac.assert_auth_posture()


# ── Explicit no-auth opt-in: dev/test convenience is preserved ───────

def test_mode_none_boots_with_auth_disabled(monkeypatch):
    ac = _load(monkeypatch, AUTH_MODE="none")
    ac.assert_auth_posture()  # must not raise
    assert ac.auth_enabled() is False


def test_mode_none_ignores_a_leftover_secret(monkeypatch):
    # none is explicit intent: auth stays off even if a secret lingers in env.
    ac = _load(monkeypatch, AUTH_MODE="none", JWT_SECRET="x" * 64)
    ac.assert_auth_posture()
    assert ac.auth_enabled() is False


# ── Properly configured: boots with auth enabled ────────────────────

def test_pilot_with_secret_boots(monkeypatch):
    ac = _load(monkeypatch, AUTH_MODE="pilot", JWT_SECRET="x" * 64)
    ac.assert_auth_posture()
    assert ac.auth_enabled() is True


def test_standalone_with_token_boots(monkeypatch):
    ac = _load(monkeypatch, AUTH_MODE="standalone", AUTH_TOKEN="a-shared-token")
    ac.assert_auth_posture()
    assert ac.auth_enabled() is True
