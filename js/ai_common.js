/**
 * CISO Toolbox — AI Common Module
 *
 * Shared AI infrastructure: providers, API calls, settings panel, panel UI, CSS.
 * Each app adds its own AI assistant that uses these shared functions.
 *
 * Load AFTER i18n.js and cisotoolbox.js, BEFORE app-specific AI assistant:
 *   <script src="js/ai_common.js"></script>
 *
 * Each app must set window.AI_APP_CONFIG before loading this file:
 *   window.AI_APP_CONFIG = {
 *       storagePrefix: "ebios" | "compliance",
 *       onSettingsSaved: function() { ... } // called after settings are saved
 *   };
 */

(function() {
    "use strict";

    var cfg = window.AI_APP_CONFIG || { storagePrefix: "ct" };
    var pfx = cfg.storagePrefix || "ct";


    // ═══════════════════════════════════════════════════════════════════
    // PROVIDERS
    // ═══════════════════════════════════════════════════════════════════

    var AI_PROVIDERS = {
        anthropic: {
            label: "Anthropic (Claude)",
            models: [
                { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
                { id: "claude-opus-4-6", label: "Claude Opus 4.6" }
            ],
            defaultModel: "claude-sonnet-4-6",
            placeholder: "sk-ant-...",
            endpoint: "https://api.anthropic.com/v1/messages"
        },
        openai: {
            label: "OpenAI (GPT)",
            models: [
                { id: "gpt-4o", label: "GPT-4o" },
                { id: "gpt-4o-mini", label: "GPT-4o mini" }
            ],
            defaultModel: "gpt-4o",
            placeholder: "sk-...",
            endpoint: "https://api.openai.com/v1/chat/completions"
        },
        bedrock: {
            label: "AWS Bedrock",
            models: [
                { id: "anthropic.claude-sonnet-4-6-20250514-v1:0", label: "Claude Sonnet 4.6 (Bedrock)" },
                { id: "anthropic.claude-haiku-4-5-20251001-v1:0", label: "Claude Haiku 4.5 (Bedrock)" },
                { id: "anthropic.claude-opus-4-6-20250515-v1:0", label: "Claude Opus 4.6 (Bedrock)" }
            ],
            defaultModel: "anthropic.claude-sonnet-4-6-20250514-v1:0",
            placeholder: "AKIAIOSFODNN7EXAMPLE",
            endpoint: "https://bedrock-runtime.eu-west-3.amazonaws.com"
        }
    };

    // Exposed for ct_settings.js (the settings drawer lives there now).
    window._AI_PROVIDERS = AI_PROVIDERS;

    // ── AWS SigV4 signing (minimal, for Bedrock) ─────────────────────
    async function _hmac(key, msg) {
        var k = (typeof key === "string") ? new TextEncoder().encode(key) : key;
        var cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg)));
    }
    async function _sha256(msg) {
        var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
        return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    async function _signV4(method, url, body, accessKey, secretKey, region, service) {
        var u = new URL(url);
        var now = new Date();
        var dateStamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
        var shortDate = dateStamp.substring(0, 8);
        var payloadHash = await _sha256(body || "");
        var headers = {
            "host": u.host,
            "x-amz-date": dateStamp,
            "x-amz-content-sha256": payloadHash,
            "content-type": "application/json"
        };
        var signedHeaders = Object.keys(headers).sort().join(";");
        var canonicalHeaders = Object.keys(headers).sort().map(function(k) { return k + ":" + headers[k] + "\n"; }).join("");
        var canonicalRequest = method + "\n" + u.pathname + "\n" + (u.search ? u.search.substring(1) : "") + "\n" + canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;
        var credentialScope = shortDate + "/" + region + "/" + service + "/aws4_request";
        var stringToSign = "AWS4-HMAC-SHA256\n" + dateStamp + "\n" + credentialScope + "\n" + (await _sha256(canonicalRequest));
        var kDate = await _hmac("AWS4" + secretKey, shortDate);
        var kRegion = await _hmac(kDate, region);
        var kService = await _hmac(kRegion, service);
        var kSigning = await _hmac(kService, "aws4_request");
        var sig = Array.from(await _hmac(kSigning, stringToSign)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
        headers["authorization"] = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + credentialScope + ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;
        return headers;
    }

    // ═══════════════════════════════════════════════════════════════════
    // STORAGE HELPERS (prefixed per app)
    // ═══════════════════════════════════════════════════════════════════

    function _k(suffix) { return pfx + "_ai_" + suffix; }
    window._aiK = _k;  // exposed for ct_settings.js

    window._aiGetApiKey = function() { return localStorage.getItem(_k("apikey")) || ""; };
    window._aiSetApiKey = function(key) { localStorage.setItem(_k("apikey"), key); };
    window._aiClearApiKey = function() { localStorage.removeItem(_k("apikey")); };

    window._aiGetProvider = function() { return localStorage.getItem(_k("provider")) || "anthropic"; };
    window._aiSetProvider = function(p) { localStorage.setItem(_k("provider"), p); };

    window._aiGetEndpoint = function() { return localStorage.getItem(_k("endpoint")) || ""; };
    window._aiSetEndpoint = function(url) { if (url) localStorage.setItem(_k("endpoint"), url); else localStorage.removeItem(_k("endpoint")); };

    window._aiGetSecretKey = function() { return localStorage.getItem(_k("secretkey")) || ""; };
    window._aiSetSecretKey = function(key) { if (key) localStorage.setItem(_k("secretkey"), key); else localStorage.removeItem(_k("secretkey")); };

    window._aiGetRegion = function() { return localStorage.getItem(_k("region")) || "eu-west-3"; };
    window._aiSetRegion = function(r) { if (r) localStorage.setItem(_k("region"), r); else localStorage.removeItem(_k("region")); };

    function _resolveEndpoint(provider) {
        var custom = _aiGetEndpoint();
        if (custom) return custom;
        var p = AI_PROVIDERS[provider] || AI_PROVIDERS.anthropic;
        return p.endpoint;
    }

    window._aiGetModel = function() {
        var stored = localStorage.getItem(_k("model"));
        if (stored) return stored;
        var p = AI_PROVIDERS[_aiGetProvider()];
        return p ? p.defaultModel : "claude-sonnet-4-6";
    };
    window._aiSetModel = function(m) { localStorage.setItem(_k("model"), m); };

    window._aiIsEnabled = function() {
        return localStorage.getItem(_k("enabled")) === "true" && !!_aiGetApiKey();
    };
    window._aiSetEnabled = function(v) { localStorage.setItem(_k("enabled"), v ? "true" : "false"); };

    // Context file (markdown)
    window._aiGetContext = function() { return localStorage.getItem(_k("context")) || ""; };
    window._aiSetContext = function(text) {
        if (text) localStorage.setItem(_k("context"), text);
        else localStorage.removeItem(_k("context"));
    };
    window._aiGetContextName = function() { return localStorage.getItem(_k("context_name")) || ""; };
    window._aiSetContextName = function(name) {
        if (name) localStorage.setItem(_k("context_name"), name);
        else localStorage.removeItem(_k("context_name"));
    };

    // ═══════════════════════════════════════════════════════════════════
    // API CALL
    // ═══════════════════════════════════════════════════════════════════

    // Validate API key with a minimal request (max_tokens=1)
    async function _aiValidateKey(provider, apiKey, model) {
        var providerConf = AI_PROVIDERS[provider] || AI_PROVIDERS.anthropic;
        try {
            // Bedrock: skip validation (SigV4 makes it complex, will fail on first real call)
            if (provider === "bedrock") return true;
            var resp;
            if (provider === "anthropic") {
                resp = await fetch(_resolveEndpoint(provider), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true"
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 1,
                        messages: [{ role: "user", content: "hi" }]
                    })
                });
            } else {
                // OpenAI-compatible providers (openai, mistral)
                resp = await fetch(_resolveEndpoint(provider), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apiKey
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 1,
                        messages: [{ role: "user", content: "hi" }]
                    })
                });
            }
            if (!resp) return false;
            // 401/403 = invalid key, 200 = valid, 400/429 = valid key but bad request or rate limit
            return resp.status !== 401 && resp.status !== 403;
        } catch (e) {
            return false;
        }
    }
    window._aiValidateKey = _aiValidateKey;  // exposed for ct_settings.js

    window._aiCallAPI = async function(systemPrompt, userPrompt) {
        // Append user context file if present
        var ctx = _aiGetContext();
        if (ctx) {
            systemPrompt += "\n\n--- METHODOLOGY INSTRUCTIONS (provided by the user) ---\n" + ctx;
        }

        var apiKey = _aiGetApiKey();
        if (!apiKey) return null;

        var provider = _aiGetProvider();
        var providerConf = AI_PROVIDERS[provider] || AI_PROVIDERS.anthropic;
        var model = _aiGetModel();
        var resp, data, text;

        try {
            if (provider === "bedrock") {
                // AWS Bedrock — SigV4 signed request
                var region = _aiGetRegion();
                var secretKey = _aiGetSecretKey();
                var bedrockEndpoint = _resolveEndpoint(provider);
                var bedrockUrl = bedrockEndpoint + "/model/" + encodeURIComponent(model) + "/invoke";
                var bedrockBody = JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: "user", content: userPrompt }]
                });
                var sigHeaders = await _signV4("POST", bedrockUrl, bedrockBody, apiKey, secretKey, region, "bedrock");
                resp = await fetch(bedrockUrl, {
                    method: "POST",
                    headers: sigHeaders,
                    body: bedrockBody
                });
            } else if (provider === "anthropic") {
                // anthropic-dangerous-direct-browser-access: required by Anthropic
                // for direct browser API calls (no backend proxy). Acceptable for
                // internal/local tools. API key is exposed to browser extensions.
                resp = await fetch(_resolveEndpoint(provider), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true"
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 4096,
                        system: systemPrompt,
                        messages: [{ role: "user", content: userPrompt }]
                    })
                });
            } else {
                // OpenAI-compatible providers (openai, mistral)
                resp = await fetch(_resolveEndpoint(provider), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apiKey
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 4096,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ]
                    })
                });
            }
        } catch (e) {
            throw new Error("Network: " + e.message);
        }

        if (!resp) throw new Error("Unknown provider: " + provider);
        if (resp.status === 401 || resp.status === 403) {
            _aiClearApiKey();
            throw new Error(t("ai.invalid_key"));
        }
        if (!resp.ok) {
            var errText = await resp.text();
            throw new Error("API " + resp.status + ": " + errText.substring(0, 200));
        }

        data = await resp.json();
        if (provider === "anthropic" || provider === "bedrock") {
            text = data.content && data.content[0] ? data.content[0].text : "";
        } else {
            // OpenAI-compatible (openai, mistral)
            text = data.choices && data.choices[0] ? data.choices[0].message.content : "";
        }
        return text;
    };

    // Parse JSON from AI response (handles markdown code blocks)
    // Parse JSON from AI response (handles markdown code fences). Returns parsed result as-is.
    window._aiParseJSON = function(raw) {
        var s = raw.trim();
        if (s.startsWith("```")) s = s.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");
        return JSON.parse(s);
    };

    // ═══════════════════════════════════════════════════════════════════
    // PANEL UI (shared overlay + slide-in panel)
    // ═══════════════════════════════════════════════════════════════════

    var _overlayEl = null;
    var _panelEl = null;
    var _titleEl = null;
    var _bodyEl = null;
    var _footerEl = null;

    window._aiEnsurePanel = function() {
        if (_panelEl) return { panel: _panelEl, title: _titleEl, body: _bodyEl, footer: _footerEl };
        _overlayEl = document.createElement("div");
        _overlayEl.className = "ai-overlay";
        var _overlayMouseDown = null;
        _overlayEl.addEventListener("mousedown", function(e) { _overlayMouseDown = e.target; });
        _overlayEl.addEventListener("click", function(e) { if (e.target === _overlayEl && _overlayMouseDown === _overlayEl) _aiClosePanel(); });
        document.body.appendChild(_overlayEl);

        _panelEl = document.createElement("div");
        _panelEl.className = "ai-panel";
        _panelEl.innerHTML = '<div class="ai-panel-header"><span class="ai-panel-title" id="ai-panel-title-text"></span><button class="ai-panel-close" id="ai-close-btn">&times;</button></div><div class="ai-panel-body"></div><div class="ai-panel-footer"></div>';
        document.body.appendChild(_panelEl);

        _titleEl = _panelEl.querySelector(".ai-panel-title");
        _bodyEl = _panelEl.querySelector(".ai-panel-body");
        _footerEl = _panelEl.querySelector(".ai-panel-footer");
        _panelEl.querySelector("#ai-close-btn").onclick = _aiClosePanel;

        return { panel: _panelEl, title: _titleEl, body: _bodyEl, footer: _footerEl };
    };

    window._aiOpenPanel = function(title) {
        _aiEnsurePanel();
        if (title) _titleEl.textContent = title;
        _overlayEl.classList.add("open");
        _panelEl.classList.add("open");
    };

    window._aiClosePanel = function() {
        if (_overlayEl) _overlayEl.classList.remove("open");
        if (_panelEl) _panelEl.classList.remove("open");
    };

    window._aiShowLoading = function(title) {
        var p = _aiEnsurePanel();
        p.title.textContent = title;
        p.body.innerHTML = '<div style="text-align:center;padding:40px"><div class="ai-spinner"></div><p style="margin-top:16px;color:var(--text-muted)">' + t("ai.loading") + '</p></div>';
        p.footer.innerHTML = "";
        _aiOpenPanel();
    };

    window._aiShowError = function(title, errMsg) {
        var p = _aiEnsurePanel();
        p.title.textContent = title;
        p.body.innerHTML = '<div class="ai-error">' + esc(errMsg) + '</div>';
        p.footer.innerHTML = '';
        _aiOpenPanel();
    };

    // ═══════════════════════════════════════════════════════════════════
    // I18N — shared settings + AI keys
    // ═══════════════════════════════════════════════════════════════════

    _registerTranslations("fr", {
        "ai.loading": "Génération des suggestions...",
        "ai.invalid_key": "Clé API invalide ou expirée. Vérifiez dans les Réglages.",
        "ai.api_error": "Erreur API :",
        "ai.accept": "Accepter",
        "ai.ignore": "Ignorer",
        "ai.accept_all": "Tout accepter",
        "ai.close": "Fermer",
        "ai.no_suggestions": "Aucune suggestion générée."
    });

    _registerTranslations("en", {
        "ai.loading": "Generating suggestions...",
        "ai.invalid_key": "Invalid or expired API key. Check in Settings.",
        "ai.api_error": "API error:",
        "ai.accept": "Accept",
        "ai.ignore": "Ignore",
        "ai.accept_all": "Accept all",
        "ai.close": "Close",
        "ai.no_suggestions": "No suggestions generated."
    });

    // ═══════════════════════════════════════════════════════════════════
    // CSS — injected once
    // ═══════════════════════════════════════════════════════════════════

    var style = document.createElement("style");
    style.textContent = [
        ".ai-overlay { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.3); z-index:500; }",
        ".ai-overlay.open { display:block; }",
        ".ai-panel { display:none; position:fixed; top:0; right:-720px; width:700px; max-width:90vw; height:100vh; background:white; box-shadow:-4px 0 24px rgba(0,0,0,0.2); z-index:501; transition:right 0.3s; overflow-y:auto; }",
        ".ai-panel.open { display:block; right:0; }",
        ".ai-panel-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--blue); color:white; position:sticky; top:0; z-index:1; }",
        ".ai-panel-title { font-weight:700; font-size:0.95em; }",
        ".ai-panel-close { background:none; border:none; color:white; font-size:1.4em; cursor:pointer; padding:0 4px; }",
        ".ai-panel-body { padding:16px; }",
        ".ai-panel-footer { padding:0 16px 16px; }",
        ".ai-card { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:12px; }",
        ".ai-card-title { font-weight:600; font-size:0.9em; margin-bottom:6px; color:var(--blue); }",
        ".ai-card-details { font-size:0.82em; color:var(--text); line-height:1.5; margin-bottom:6px; }",
        ".ai-card-meta { font-size:0.75em; color:var(--text-muted); margin-bottom:8px; }",
        ".ai-card-actions { display:flex; gap:6px; }",
        ".ai-btn-accept { padding:4px 12px; border:none; border-radius:4px; background:var(--green); color:white; font-size:0.8em; font-weight:600; cursor:pointer; }",
        ".ai-btn-accept:hover { opacity:0.85; }",
        ".ai-btn-accept:disabled { opacity:0.5; cursor:default; }",
        ".ai-btn-ignore { padding:4px 12px; border:1px solid var(--border); border-radius:4px; background:white; color:var(--text-muted); font-size:0.8em; cursor:pointer; }",
        ".ai-btn-ignore:hover { background:var(--bg); }",
        ".ai-btn-accept-all, .ai-btn-all { padding:6px 16px; border:none; border-radius:4px; background:var(--green); color:white; font-weight:600; font-size:0.85em; cursor:pointer; }",
        ".ai-btn-accept-all:hover, .ai-btn-all:hover { opacity:0.85; }",
        ".ai-btn-close { padding:6px 16px; border:1px solid var(--border); border-radius:4px; background:white; color:var(--text); font-size:0.85em; cursor:pointer; }",
        ".ai-btn-close:hover { background:var(--bg); }",
        ".ai-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--light-blue); border-radius:50%; animation:ai-spin 0.8s linear infinite; margin:0 auto; }",
        "@keyframes ai-spin { to { transform:rotate(360deg); } }",
        ".ai-error { padding:16px; color:#dc2626; background:#fef2f2; border-radius:6px; font-size:0.85em; }",
        ".btn-ai { background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%); color:#fff; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-size:0.8em; font-weight:600; margin-left:auto; white-space:nowrap; }",
        ".btn-ai-sm { padding:2px 6px !important; font-size:0.75em !important; margin-left:4px; border-radius:4px; }",
        ".btn-ai:hover { opacity:0.9; }",
    ].join("\n");
    document.head.appendChild(style);

})();
