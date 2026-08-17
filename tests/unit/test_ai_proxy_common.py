"""Design regression (H4 phase 2): risk migrated to the shared AI proxy.

routes/ai.py dropped from 507 to ~89 lines (provider plumbing now in
src/ai_proxy_common.py). risk keeps a DOMAIN-SPECIFIC _parse_lax_or_refuse: its
SROV/SOP panels return objects carrying `pairs`/`phases`, which must pass
through even though they may contain an "error"-ish field — unlike the shared
refusal parser. These tests lock both the wiring and that divergence.
"""
import os
import sys

import pytest

os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "test-secret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import HTTPException  # noqa: E402

from src.routes.ai import _parse_lax_or_refuse, router  # noqa: E402


def test_router_exposes_common_and_domain_endpoints():
    paths = {r.path for r in router.routes}
    for p in (
        "/api/ai/complete", "/api/ai/runtime", "/api/ai/config",
        "/api/ai/keys", "/api/ai/validate-key",   # common (make_ai_router)
        "/api/ai/risk/suggest",                    # risk métier
    ):
        assert p in paths, f"missing endpoint: {p}"


def test_srov_sop_objects_pass_through():
    # Objects carrying pairs/phases are legitimate results, not refusals —
    # even if an "error" key is present.
    assert _parse_lax_or_refuse('{"pairs": [1, 2], "error": "x"}') == {"pairs": [1, 2], "error": "x"}
    assert _parse_lax_or_refuse('{"phases": [{"a": 1}]}') == {"phases": [{"a": 1}]}


def test_plain_refusal_is_422():
    with pytest.raises(HTTPException) as exc:
        _parse_lax_or_refuse('{"error": "outside EBIOS RM"}')
    assert exc.value.status_code == 422


def test_arrays_pass_through():
    assert _parse_lax_or_refuse('[{"name": "VM1"}]') == [{"name": "VM1"}]
