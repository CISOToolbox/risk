# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/ai_models_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""The suite's single catalogue of AI providers and models.

Why it lives alone, with no framework import
--------------------------------------------
This catalogue used to exist twice: in ``ai_proxy_common.py`` for the eight
consumer modules, and again in ``pilot/src/routes/ai.py``, because Pilot is the
AI hub and deliberately keeps its own routes (see that module's docstring).
The two drifted: Pilot offered Claude Opus 4.6 and defaulted to Sonnet 4.6
while the modules offered Sonnet 5 and defaulted to it. An operator picking a
model in Pilot and an operator reading a module's settings saw two different
worlds, and a model selected in one place could be absent from the other.

The catalogue is pure data, so it is extracted here with **no FastAPI, no
SQLAlchemy, no schema import** — that is precisely what let Pilot stay off
``ai_proxy_common`` while still sharing this. Both import it:

    from src.ai_models_common import AI_PROVIDERS

Keeping the frontend in step
----------------------------
``shared/ts/ai_common.ts`` carries the same catalogue for standalone mode,
where the browser talks to the provider directly and cannot import Python.
That copy is unavoidable, so it is *verified* instead: the suite contract test
fails if the two lists diverge. Change this file, run the test, fix the TS.

Adding a provider means adding a branch to BOTH call paths
(``ai_proxy_common.call_llm`` and ``pilot/src/routes/ai.py``); the same test
refuses a provider that appears here without one.
"""
from __future__ import annotations

AI_PROVIDERS: dict[str, dict] = {
    "anthropic": {
        "label": "Anthropic (Claude)",
        "models": [
            {"id": "claude-sonnet-5", "label": "Claude Sonnet 5"},
            {"id": "claude-opus-5", "label": "Claude Opus 5"},
            {"id": "claude-fable-5", "label": "Claude Fable 5"},
            {"id": "claude-haiku-4-5-20251001", "label": "Claude Haiku 4.5"},
            {"id": "claude-opus-4-8", "label": "Claude Opus 4.8"},
            {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"},
        ],
        # Newest by default. A deployment whose key has no access to it picks
        # another in Pilot › Settings; since the truncation/auth errors are now
        # reported verbatim, that case is diagnosable instead of silent.
        "defaultModel": "claude-sonnet-5",
        "endpoint": "https://api.anthropic.com/v1/messages",
    },
    "openai": {
        "label": "OpenAI (GPT)",
        "models": [
            {"id": "gpt-5.6", "label": "GPT-5.6"},
            {"id": "gpt-5.6-terra", "label": "GPT-5.6 terra"},
            {"id": "gpt-5.5", "label": "GPT-5.5"},
            {"id": "gpt-5.4-mini", "label": "GPT-5.4 mini"},
            {"id": "gpt-4o", "label": "GPT-4o"},
        ],
        "defaultModel": "gpt-5.6",
        "endpoint": "https://api.openai.com/v1/chat/completions",
    },
    "gemini": {
        "label": "Google (Gemini)",
        "models": [
            {"id": "gemini-3.6-flash", "label": "Gemini 3.6 Flash"},
            {"id": "gemini-3.5-flash-lite", "label": "Gemini 3.5 Flash-Lite"},
        ],
        "defaultModel": "gemini-3.6-flash",
        # {model} is interpolated (URL-quoted) by the caller.
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    },
    "bedrock": {
        "label": "AWS Bedrock",
        "models": [
            {"id": "anthropic.claude-sonnet-5", "label": "Claude Sonnet 5 (Bedrock)"},
            {"id": "anthropic.claude-opus-5", "label": "Claude Opus 5 (Bedrock)"},
            {"id": "anthropic.claude-sonnet-4-6-20250514-v1:0", "label": "Claude Sonnet 4.6 (Bedrock)"},
            {"id": "anthropic.claude-haiku-4-5-20251001-v1:0", "label": "Claude Haiku 4.5 (Bedrock)"},
        ],
        "defaultModel": "anthropic.claude-sonnet-5",
        "endpoint": "https://bedrock-runtime.{region}.amazonaws.com",
    },
}


def default_model(provider: str) -> str:
    """Default model id for `provider`, falling back to Anthropic's."""
    conf = AI_PROVIDERS.get(provider) or AI_PROVIDERS["anthropic"]
    return conf["defaultModel"]
