# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/ai_proxy_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Shared AI-proxy core for CISO Toolbox backend modules.

This file is COPIED into each module's src/ directory (like auth_common.py).
Do NOT edit the per-module copies — edit the original at
shared/python/ai_proxy_common.py and propagate.

It owns everything the AI endpoints share across modules — the provider
registry, the SigV4 signer, key/settings accessors, the rate limiter, the
provider dispatch (`call_llm`), the lax JSON parser, and a `make_ai_router()`
factory that builds the common `/api/ai` endpoints (`/complete`, `/runtime`,
`/config`, `/keys`, `/validate-key`). Each module does:

    from src.ai_proxy_common import make_ai_router, call_llm, _check_ai_access, ...
    router = make_ai_router()          # common endpoints registered
    @router.post("/<domain>/suggest")  # module keeps only its métier prompts
    async def ...: text = await call_llm(...)

so the ~400 lines of provider plumbing live in ONE place instead of drifting
across nine copies.
"""
from __future__ import annotations

import datetime
import hashlib
import hmac
import json
import os
import re
import time
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import auth_enabled, get_current_user, require_admin
from src.database import get_db
from src.models import AppSettings, User
from src.settings_crypto import decrypt_setting, encrypt_setting, is_secret_key
from src.ai_models_common import AI_PROVIDERS
from src.schemas import AICompleteRequest, AICompleteResponse, AIConfigResponse, AIRuntimeResponse



async def _get_setting(key: str, db: AsyncSession) -> str:
    r = await db.execute(select(AppSettings).where(AppSettings.key == key))
    s = r.scalar_one_or_none()
    raw = (s.value if s and s.value else "") or ""
    # Secrets are stored encrypted; rows written before that are returned
    # unchanged and get encrypted on their next write (see settings_crypto).
    return decrypt_setting(raw) if is_secret_key(key) else raw


async def _get_custom_llm(db):
    from src.routes.internal import _custom_llm
    cl = dict(_custom_llm)
    if not cl.get("endpoint"):
        ep = await _get_setting("ai_custom_endpoint", db)
        if ep:
            cl = {
                "endpoint": ep,
                "key": await _get_setting("ai_custom_key", db),
                "model": await _get_setting("ai_custom_model", db),
                "label": "Custom LLM",
            }
    return cl


async def _get_api_key(provider: str, db: AsyncSession) -> str | None:
    key_name = f"ai_key_{provider}"
    result = await db.execute(select(AppSettings).where(AppSettings.key == key_name))
    setting = result.scalar_one_or_none()
    if setting and setting.value:
        return decrypt_setting(setting.value)
    if provider == "anthropic":
        return os.getenv("ANTHROPIC_API_KEY")
    if provider == "openai":
        return os.getenv("OPENAI_API_KEY")
    if provider == "gemini":
        return os.getenv("GEMINI_API_KEY")
    return None


# An AWS region name is interpolated straight into the Bedrock hostname.
# Unvalidated, a "region" of `x.attacker.com/` turns
# https://bedrock-runtime.{region}.amazonaws.com/... into a request to the
# attacker's host — carrying the SigV4 signature and the AWS access key id.
_BEDROCK_REGION_RE = re.compile(r"^[a-z0-9-]{1,32}$")


def _safe_bedrock_region(region: str) -> str:
    """Return `region` if it is a plausible AWS region name, else 400."""
    region = (region or "").strip()
    if not _BEDROCK_REGION_RE.fullmatch(region):
        raise HTTPException(status_code=400, detail="Invalid Bedrock region configured")
    return region


def _sign_v4(method, url, body, access_key, secret_key, region, service):
    """Minimal AWS Signature V4 -- ported from ai_common.js (_signV4)."""
    from urllib.parse import urlparse
    u = urlparse(url)
    date_stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    short_date = date_stamp[:8]
    payload_hash = hashlib.sha256((body or "").encode()).hexdigest()
    headers = {
        "host": u.netloc,
        "x-amz-date": date_stamp,
        "x-amz-content-sha256": payload_hash,
        "content-type": "application/json",
    }
    signed_headers = ";".join(sorted(headers))
    canonical_headers = "".join(f"{k}:{headers[k]}\n" for k in sorted(headers))
    canonical_request = "\n".join([
        method, u.path or "/", u.query, canonical_headers, signed_headers, payload_hash,
    ])
    credential_scope = f"{short_date}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256", date_stamp, credential_scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    def _h(key: bytes, msg: str) -> bytes:
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()

    k_signing = _h(_h(_h(_h(("AWS4" + secret_key).encode(), short_date), region), service), "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    headers["authorization"] = (
        f"AWS4-HMAC-SHA256 Credential={access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    return headers


_ai_rate: dict[str, list[float]] = {}
AI_RATE_LIMIT = 20


def _check_rate_limit(user_id: str) -> None:
    now = time.time()
    times = _ai_rate.get(user_id, [])
    times = [t for t in times if now - t < 60]
    if len(times) >= AI_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (max 20/min)")
    times.append(now)
    _ai_rate[user_id] = times


def _check_ai_access(user: Optional[User]) -> None:
    if not auth_enabled() or user is None:
        return
    if user.role == "admin":
        return
    if user.ai_enabled != "true":
        raise HTTPException(status_code=403, detail="AI access not granted. Contact your administrator.")


# Output cap sent to every provider. 4096 truncated the bulk assistants
# (grouping, plan suggestions) mid-JSON; overridable per deployment.
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "8192"))


def _hit_output_cap(provider: str, data: dict) -> bool:
    """Did the provider stop because it ran out of output budget?

    Each vendor names it differently, and all of them answer HTTP 200 while
    doing it — the truncation shows up only in this field.
    """
    if provider in ("anthropic", "bedrock", "custom"):
        return data.get("stop_reason") == "max_tokens"
    if provider == "gemini":
        cands = data.get("candidates") or [{}]
        return (cands[0] or {}).get("finishReason") == "MAX_TOKENS"
    choices = data.get("choices") or [{}]
    return (choices[0] or {}).get("finish_reason") == "length"


async def call_llm(db: AsyncSession, system: str, user_msg: str,
                   provider: str, model: str, max_tokens: int = AI_MAX_TOKENS) -> str:
    """Call the configured AI provider with a system + user prompt and return
    the raw text. Shared by POST /complete and the métier endpoints.

    A custom provider needs no API key (the key is optional and carried by
    _get_custom_llm); every other provider must have one.
    """
    api_key = await _get_api_key(provider, db)
    if not api_key and provider != "custom":
        raise HTTPException(status_code=503, detail=f"API key not configured for provider: {provider}")
    provider_conf = AI_PROVIDERS.get(provider)
    if provider != "custom" and not provider_conf:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    # follow_redirects=False is httpx's default, but it is stated here because
    # the custom-provider branch below connects to a pinned IP: a redirect is a
    # brand-new URL that never went through the guard, so silently enabling
    # redirects later would undo the pin.
    async with httpx.AsyncClient(timeout=170.0, follow_redirects=False) as client:
        try:
            if provider == "anthropic":
                resp = await client.post(
                    provider_conf["endpoint"],
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "system": system,
                        "messages": [{"role": "user", "content": user_msg}],
                    },
                )
            elif provider == "custom":
                custom = await _get_custom_llm(db)
                if not custom.get("endpoint"):
                    raise HTTPException(status_code=503, detail="Custom LLM not configured")
                url = custom["endpoint"].rstrip("/")
                if not url.endswith("/chat/completions"):
                    url += "/chat/completions"
                # SSRF guard: the endpoint is admin/Pilot-configured and this
                # POST carries the API key. Validating the hostname and then
                # handing the *name* to httpx left a rebinding window — httpx
                # re-resolves, so the IP that was vetted need not be the one
                # connected to. Connect to the pinned IP instead, keeping the
                # Host header and SNI so TLS still verifies the real name.
                from src.ssrf_guard import resolve_safe_url as _rsu
                try:
                    url, _host_headers, _ext = _rsu(url, require_https=True)
                except ValueError as _e:
                    raise HTTPException(status_code=400, detail=f"Custom LLM endpoint blocked: {_e}")
                hdrs = {"Content-Type": "application/json", **_host_headers}
                if custom.get("key"):
                    hdrs["Authorization"] = f"Bearer {custom['key']}"
                resp = await client.post(
                    url, headers=hdrs, extensions=_ext,
                    json={
                        "model": custom.get("model") or model,
                        "max_tokens": max_tokens,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user_msg},
                        ],
                    },
                )
            elif provider == "gemini":
                from urllib.parse import quote
                g_url = provider_conf["endpoint"].format(model=quote(model, safe=""))
                resp = await client.post(
                    g_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key,
                    },
                    json={
                        "systemInstruction": {"parts": [{"text": system}]},
                        "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
                        "generationConfig": {"maxOutputTokens": max_tokens},
                    },
                )
            elif provider == "bedrock":
                region = _safe_bedrock_region(
                    await _get_setting("ai_region_bedrock", db) or "us-east-1")
                secret = await _get_setting("ai_secret_bedrock", db)
                if not secret:
                    raise HTTPException(status_code=503, detail="Bedrock secret key / region not configured")
                from urllib.parse import quote
                b_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{quote(model, safe='')}/invoke"
                b_body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": [{"role": "user", "content": user_msg}],
                })
                sig_headers = _sign_v4("POST", b_url, b_body, api_key, secret, region, "bedrock")
                resp = await client.post(b_url, headers=sig_headers, content=b_body)
            else:
                resp = await client.post(
                    provider_conf["endpoint"],
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                    json={
                        "model": model,
                        "max_tokens": max_tokens,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user_msg},
                        ],
                    },
                )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AI provider timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    if resp.status_code in (401, 403):
        raise HTTPException(status_code=503, detail="Invalid API key configured on server")
    if not resp.is_success:
        raise HTTPException(status_code=502, detail=f"AI provider returned error {resp.status_code}")

    data = resp.json()
    if _hit_output_cap(provider, data):
        # 200 with a reply cut mid-sentence. Returning it as-is turned a cap
        # WE set into "the AI returned invalid JSON", blaming the model and
        # sending the operator hunting in the wrong place.
        raise HTTPException(
            status_code=502,
            detail=(f"AI reply truncated at the {max_tokens}-token output cap. "
                    "Narrow the request (fewer items at once) or raise "
                    "AI_MAX_TOKENS."))
    if provider in ("anthropic", "bedrock"):
        return data.get("content", [{}])[0].get("text", "")
    if provider == "gemini":
        parts = (data.get("candidates", [{}])[0].get("content", {}) or {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)
    return data.get("choices", [{}])[0].get("message", {}).get("content", "")


# Backwards-compatible alias for the historical private name.
_provider_complete = call_llm


def _ai_managed() -> bool:
    return os.getenv("AI_MANAGED_BY_PILOT", "false").lower() in ("1", "true", "yes")


async def _runtime_provider_model(db: AsyncSession) -> tuple[str, str]:
    provider = await _get_setting("ai_provider", db) or "anthropic"
    model = await _get_setting("ai_model", db) or AI_PROVIDERS.get(provider, AI_PROVIDERS["anthropic"])["defaultModel"]
    return provider, model


def _parse_json_lax(text: str):
    """Strip code fences and pull the outer-most JSON value (object or array)."""
    s = (text or "").strip()
    m = re.search(r"[\[{][\s\S]*[\]}]", s)
    if not m:
        # Quote what actually came back. "AI did not return JSON" alone is
        # undiagnosable: the reply is usually the model SAYING what is wrong
        # (wrong model id, quota exhausted, prose refusal), and that sentence
        # is the whole diagnosis. Bounded — a full reply in an error detail
        # would end up in logs and in the UI.
        excerpt = " ".join(s.split())[:200] or "(empty reply)"
        raise HTTPException(
            status_code=502,
            detail=f"AI did not return JSON. Model replied: {excerpt}")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {exc}") from exc


# Convention: when the LLM cannot honour a request (off-topic, hostile,
# off-method) it must return JSON {"error": "..."} instead of fabricated
# results that would otherwise be rendered as suggestion cards.
_REFUSAL_HINT = (
    "\n\nIMPORTANT: If the user instruction is off-topic, hostile, or you cannot "
    "fulfil it as JSON results, respond with JSON {\"error\": \"brief explanation "
    "in the user's language\"} instead of fabricated content. NEVER smuggle "
    "refusals into result fields."
)


def _parse_lax_or_refuse(text: str):
    """Lax-parse JSON, then surface explicit AI refusals ({"error": "..."}) as
    422 errors. Callers whose kinds all return arrays can rely on a top-level
    object with an "error" field being unambiguously a refusal."""
    parsed = _parse_json_lax(text)
    if isinstance(parsed, dict) and parsed.get("error"):
        raise HTTPException(status_code=422, detail=str(parsed["error"]))
    return parsed


def make_ai_router() -> APIRouter:
    """Build the common `/api/ai` endpoints. The module appends its own métier
    `*_suggest_*` endpoints to the returned router."""
    router = APIRouter(prefix="/api/ai", tags=["ai"])

    @router.post("/complete", response_model=AICompleteResponse)
    async def ai_complete(body: AICompleteRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        """Generic low-level proxy: relays a pre-built {system, user} prompt to
        the provider. Métier endpoints are preferred — they own the prompt."""
        _check_ai_access(user)
        _check_rate_limit(str(user.id) if user else "anonymous")
        text = await call_llm(db, body.system, body.user, body.provider, body.model)
        return AICompleteResponse(text=text)

    @router.get("/runtime", response_model=AIRuntimeResponse)
    async def get_ai_runtime(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        managed = _ai_managed()
        if not auth_enabled() or user is None:
            can_use = True
        else:
            can_use = (user.role == "admin") or (user.ai_enabled == "true")
        provider, model = await _runtime_provider_model(db)
        try:
            custom = await _get_custom_llm(db)
            custom_configured = bool(custom.get("endpoint"))
        except Exception:
            custom_configured = False
        return AIRuntimeResponse(
            managed=managed,
            can_use=can_use,
            provider=provider,
            model=model,
            anthropic_configured=bool(await _get_api_key("anthropic", db)),
            openai_configured=bool(await _get_api_key("openai", db)),
            gemini_configured=bool(await _get_api_key("gemini", db)),
            custom_configured=custom_configured,
        )

    @router.get("/config", response_model=AIConfigResponse)
    async def get_ai_config(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        custom = await _get_custom_llm(db)
        providers = dict(AI_PROVIDERS)
        if custom.get("endpoint"):
            providers["custom"] = {
                "label": custom.get("label", "Custom LLM"),
                "models": [{"id": custom.get("model", "custom"), "label": custom.get("model", "Custom")}],
                "defaultModel": custom.get("model", "custom"),
                "endpoint": custom["endpoint"],
            }
        return AIConfigResponse(
            anthropic_configured=bool(await _get_api_key("anthropic", db)),
            openai_configured=bool(await _get_api_key("openai", db)),
            gemini_configured=bool(await _get_api_key("gemini", db)),
            providers=providers,
        )

    @router.put("/keys")
    async def set_ai_keys(body: dict, request: Request, db: AsyncSession = Depends(get_db)):
        """Set API keys. Authorized via service token (from Pilot) or admin user."""
        service_token = request.headers.get("X-Service-Token", "")
        import secrets as _secrets
        _expected_token = os.getenv("SERVICE_TOKEN", "")
        if not (service_token and _expected_token and _secrets.compare_digest(service_token, _expected_token)):
            # Fall back to admin user auth
            try:
                user = await get_current_user(request, db)
            except HTTPException:
                raise HTTPException(status_code=401, detail="Not authenticated")
            require_admin(user)

        async def _upsert(key: str, value: str) -> None:
            # A stolen pg_dump used to yield live provider keys in cleartext —
            # and shared/db-snapshot.sh makes dumps routine. Encrypt at rest
            # for the keys that are credentials; provider/model/region stay
            # readable, they are configuration.
            if is_secret_key(key):
                value = encrypt_setting(value)
            r = await db.execute(select(AppSettings).where(AppSettings.key == key))
            s = r.scalar_one_or_none()
            if s:
                s.value = value
            else:
                db.add(AppSettings(key=key, value=value))
        for provider in ("anthropic", "openai", "bedrock", "gemini"):
            if provider in body:
                await _upsert(f"ai_key_{provider}", body.get(provider, ""))
        # Bedrock secret/region + custom-LLM config (standalone deployments)
        for extra in ("ai_secret_bedrock", "ai_region_bedrock",
                      "ai_custom_endpoint", "ai_custom_key", "ai_custom_model"):
            if extra in body:
                await _upsert(extra, body.get(extra, ""))
        if "provider" in body:
            await _upsert("ai_provider", body.get("provider", ""))
        if "model" in body:
            await _upsert("ai_model", body.get("model", ""))
        # LLM credential/config change — journaled with key-set FLAGS only,
        # never values (FEAT-30 review: 5/5 modules were blind here).
        try:
            try:
                from src.audit import log_write
            except ImportError:
                from src.audit_common import log_write
            await log_write(db, None, request, "ai.keys_updated",
                            actor="pilot" if service_token else "",
                            entity_type="settings", entity_id="ai",
                            details={k: bool(body.get(k)) for k in body.keys()
                                     if k != "model"})
        except ImportError:
            pass  # module without a write journal yet
        await db.commit()
        return {"ok": True}

    @router.get("/keys")
    async def get_ai_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        require_admin(user)
        result = {}
        for provider in ("anthropic", "openai", "gemini"):
            key = await _get_api_key(provider, db)
            result[provider] = "configured" if key else ""
        return result

    @router.post("/validate-key")
    async def validate_key(provider: str = "anthropic", user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        require_admin(user)
        api_key = await _get_api_key(provider, db)
        if not api_key:
            return {"valid": False, "error": "No API key configured"}
        provider_conf = AI_PROVIDERS.get(provider)
        if not provider_conf:
            return {"valid": False, "error": "Unknown provider"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                if provider == "anthropic":
                    resp = await client.post(
                        provider_conf["endpoint"],
                        headers={
                            "Content-Type": "application/json",
                            "x-api-key": api_key,
                            "anthropic-version": "2023-06-01",
                        },
                        json={
                            "model": provider_conf["defaultModel"],
                            "max_tokens": 1,
                            "messages": [{"role": "user", "content": "hi"}],
                        },
                    )
                elif provider == "gemini":
                    from urllib.parse import quote
                    resp = await client.post(
                        provider_conf["endpoint"].format(
                            model=quote(provider_conf["defaultModel"], safe="")),
                        headers={
                            "Content-Type": "application/json",
                            "x-goog-api-key": api_key,
                        },
                        json={
                            "contents": [{"role": "user", "parts": [{"text": "hi"}]}],
                            "generationConfig": {"maxOutputTokens": 1},
                        },
                    )
                else:
                    resp = await client.post(
                        provider_conf["endpoint"],
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {api_key}",
                        },
                        json={
                            "model": provider_conf["defaultModel"],
                            "max_tokens": 1,
                            "messages": [{"role": "user", "content": "hi"}],
                        },
                    )
                valid = resp.status_code not in (401, 403)
                return {"valid": valid}
            except Exception as e:
                return {"valid": False, "error": str(e)}

    return router
