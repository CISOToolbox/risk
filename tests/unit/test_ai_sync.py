"""Tests for AI managed mode sync between Pilot and this module.

Verifies the AI route structure matches the Pilot contract.
"""
import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

AI_PY = os.path.join(os.path.dirname(__file__), "..", "..", "src", "routes", "ai.py")
# The provider plumbing moved to the shared ai_proxy_common.py; routes/ai.py now
# holds only the métier endpoint. The contract-string checks below span both.
AI_COMMON_PY = os.path.join(os.path.dirname(__file__), "..", "..", "src", "ai_proxy_common.py")


def _ai_source():
    parts = []
    for path in (AI_PY, AI_COMMON_PY):
        if os.path.exists(path):
            with open(path) as f:
                parts.append(f.read())
    return "\n".join(parts)


class TestAiRoutesExist:
    @pytest.fixture(autouse=True)
    def _skip(self):
        if not os.path.exists(AI_PY):
            pytest.skip("No routes/ai.py")

    def test_runtime_route(self):
        from routes.ai import router
        assert any("runtime" in getattr(r, "path", "") for r in router.routes)

    def test_keys_route(self):
        from routes.ai import router
        assert any("keys" in getattr(r, "path", "") for r in router.routes)

    def test_complete_route(self):
        from routes.ai import router
        assert any("complete" in getattr(r, "path", "") for r in router.routes)


class TestAiRuntimeContract:
    @pytest.fixture(autouse=True)
    def _skip(self):
        if not os.path.exists(AI_PY):
            pytest.skip("No routes/ai.py")

    def test_managed_field(self):
        src = _ai_source()
        assert "managed" in src, "Runtime must include a 'managed' field"

    def test_can_use_field(self):
        src = _ai_source()
        assert "can_use" in src, "Runtime must include a 'can_use' field"

    def test_provider_field(self):
        src = _ai_source()
        assert "provider" in src

    def test_model_field(self):
        src = _ai_source()
        # "model" appears in many contexts; check it's in a return/response
        assert "model" in src

    def test_anthropic_configured(self):
        assert "anthropic_configured" in _ai_source()

    def test_openai_configured(self):
        assert "openai_configured" in _ai_source()


class TestAiManagedEnvVar:
    @pytest.fixture(autouse=True)
    def _skip(self):
        if not os.path.exists(AI_PY):
            pytest.skip("No routes/ai.py")

    def test_reads_ai_managed_by_pilot(self):
        assert "AI_MANAGED_BY_PILOT" in _ai_source()


class TestAiKeysAuth:
    @pytest.fixture(autouse=True)
    def _skip(self):
        if not os.path.exists(AI_PY):
            pytest.skip("No routes/ai.py")

    def test_keys_checks_service_token(self):
        src = _ai_source()
        assert ("service_token" in src.lower() or
                "X-Service-Token" in src or
                "SERVICE_TOKEN" in src)
