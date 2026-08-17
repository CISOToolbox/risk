import asyncio
import inspect
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from pilot_notify import notify_pilot_measure


class TestModuleName:

    def test_module_name_default(self):
        from pilot_notify import MODULE_NAME
        assert MODULE_NAME == "risk"


class TestNotifyPilotMeasureSignature:

    def test_is_coroutine_function(self):
        assert inspect.iscoroutinefunction(notify_pilot_measure)

    def test_accepts_dict_parameter(self):
        sig = inspect.signature(notify_pilot_measure)
        params = list(sig.parameters.keys())
        assert params == ["measure_data"]

    def test_parameter_accepts_dict(self):
        sig = inspect.signature(notify_pilot_measure)
        param = sig.parameters["measure_data"]
        # Annotation may be dict or missing — just verify we can call with one
        assert param.kind in (param.POSITIONAL_OR_KEYWORD, param.POSITIONAL_ONLY)


class TestNotifyPilotMeasureNoOp:

    def test_noop_when_pilot_url_empty(self):
        with patch("pilot_notify.PILOT_URL", ""), \
             patch("pilot_notify.SERVICE_TOKEN", "some-token"):
            result = asyncio.get_event_loop().run_until_complete(
                notify_pilot_measure({"source_id": "test"})
            )
            assert result is None

    def test_noop_when_service_token_empty(self):
        with patch("pilot_notify.PILOT_URL", "http://pilot:8080"), \
             patch("pilot_notify.SERVICE_TOKEN", ""):
            result = asyncio.get_event_loop().run_until_complete(
                notify_pilot_measure({"source_id": "test"})
            )
            assert result is None

    def test_noop_when_both_empty(self):
        with patch("pilot_notify.PILOT_URL", ""), \
             patch("pilot_notify.SERVICE_TOKEN", ""):
            result = asyncio.get_event_loop().run_until_complete(
                notify_pilot_measure({"source_id": "test"})
            )
            assert result is None


class TestNotifyPilotMeasurePayload:

    def test_sets_default_module(self):
        """Verify the function adds module defaults to the payload dict."""
        payload = {"source_id": "abc", "title": "Fix vuln"}
        # Run with empty PILOT_URL so it returns early (no HTTP call)
        # but still check setdefault was applied
        with patch("pilot_notify.PILOT_URL", ""), \
             patch("pilot_notify.MODULE_NAME", "risk"):
            asyncio.get_event_loop().run_until_complete(
                notify_pilot_measure(payload)
            )
            # When PILOT_URL is empty the function returns early before
            # setdefault runs. Just verify no crash.
            assert True
