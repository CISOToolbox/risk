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
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // STORAGE HELPERS (prefixed per app)
    // ═══════════════════════════════════════════════════════════════════

    function _k(suffix) { return pfx + "_ai_" + suffix; }

    window._aiGetApiKey = function() { return localStorage.getItem(_k("apikey")) || ""; };
    window._aiSetApiKey = function(key) { localStorage.setItem(_k("apikey"), key); };
    window._aiClearApiKey = function() { localStorage.removeItem(_k("apikey")); };

    window._aiGetProvider = function() { return localStorage.getItem(_k("provider")) || "anthropic"; };
    window._aiSetProvider = function(p) { localStorage.setItem(_k("provider"), p); };

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
            var resp;
            if (provider === "anthropic") {
                resp = await fetch(providerConf.endpoint, {
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
            } else if (provider === "openai") {
                resp = await fetch(providerConf.endpoint, {
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

    window._aiCallAPI = async function(systemPrompt, userPrompt) {
        var apiKey = _aiGetApiKey();
        if (!apiKey) return null;

        // Append user context file if present
        var ctx = _aiGetContext();
        if (ctx) {
            systemPrompt += "\n\n--- METHODOLOGY INSTRUCTIONS (provided by the user) ---\n" + ctx;
        }

        var provider = _aiGetProvider();
        var providerConf = AI_PROVIDERS[provider] || AI_PROVIDERS.anthropic;
        var model = _aiGetModel();
        var resp, data, text;

        try {
            if (provider === "anthropic") {
                // anthropic-dangerous-direct-browser-access: required by Anthropic
                // for direct browser API calls (no backend proxy). Acceptable for
                // internal/local tools. API key is exposed to browser extensions.
                resp = await fetch(providerConf.endpoint, {
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
            } else if (provider === "openai") {
                resp = await fetch(providerConf.endpoint, {
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
        if (provider === "openai") {
            text = data.choices && data.choices[0] ? data.choices[0].message.content : "";
        } else {
            text = data.content && data.content[0] ? data.content[0].text : "";
        }
        return text;
    };

    // Parse JSON from AI response (handles markdown code fences and truncated output).
    window._aiParseJSON = function(raw) {
        var s = raw.trim();
        if (s.startsWith("```")) s = s.replace(/^```json?\s*/i, "").replace(/\s*```$/, "");
        try {
            return JSON.parse(s);
        } catch(e) {
            // Attempt to fix truncated JSON: close open strings, arrays and objects
            var fixed = s;
            // If truncated mid-string, close the string
            var quotes = (fixed.match(/"/g) || []).length;
            if (quotes % 2 !== 0) fixed += '"';
            // Close any unclosed brackets/braces
            var opens = 0, closes = 0;
            for (var i = 0; i < fixed.length; i++) {
                if (fixed[i] === "[") opens++;
                if (fixed[i] === "]") closes++;
            }
            while (closes < opens) { fixed += "]"; closes++; }
            opens = 0; closes = 0;
            for (var j = 0; j < fixed.length; j++) {
                if (fixed[j] === "{") opens++;
                if (fixed[j] === "}") closes++;
            }
            while (closes < opens) { fixed += "}"; closes++; }
            // Remove trailing comma before ] or }
            fixed = fixed.replace(/,\s*([}\]])/g, "$1");
            try {
                return JSON.parse(fixed);
            } catch(e2) {
                throw new Error("Invalid JSON from AI (possibly truncated): " + e.message);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // SETTINGS PANEL
    // ═══════════════════════════════════════════════════════════════════

    function _buildModelOptions(providerId) {
        var p = AI_PROVIDERS[providerId] || AI_PROVIDERS.anthropic;
        var cur = _aiGetModel();
        var h = "";
        p.models.forEach(function(m) {
            h += '<option value="' + m.id + '"' + (m.id === cur ? ' selected' : '') + '>' + m.label + '</option>';
        });
        return h;
    }

    window.openSettings = function() {
        if (typeof toggleMenu === "function") toggleMenu();

        var key = _aiGetApiKey();
        var curProvider = _aiGetProvider();
        var aiEnabled = localStorage.getItem(_k("enabled")) === "true";
        var placeholder = (AI_PROVIDERS[curProvider] || AI_PROVIDERS.anthropic).placeholder;

        var provOpts = "";
        for (var pid in AI_PROVIDERS) {
            provOpts += '<option value="' + pid + '"' + (pid === curProvider ? ' selected' : '') + '>' + AI_PROVIDERS[pid].label + '</option>';
        }

        var panel = _aiEnsurePanel();
        panel.title.textContent = t("settings.title");
        panel.body.innerHTML =
            // Language
            '<div class="settings-section">' +
                '<div class="settings-label">' + t("settings.language") + '</div>' +
                '<div style="display:flex;gap:8px">' +
                    '<button class="settings-lang-btn' + (_locale === "fr" ? " active" : "") + '" id="settings-lang-fr">Français</button>' +
                    '<button class="settings-lang-btn' + (_locale === "en" ? " active" : "") + '" id="settings-lang-en">English</button>' +
                '</div>' +
            '</div>' +
            // AI
            '<div class="settings-section">' +
                '<div class="settings-label">' + t("settings.ai_section") + '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
                    '<label class="settings-toggle"><input type="checkbox" id="settings-ai-toggle"' + (aiEnabled ? " checked" : "") + '><span class="settings-toggle-slider"></span></label>' +
                    '<span class="fs-sm">' + t("settings.ai_enable") + '</span>' +
                '</div>' +
                '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.provider") + '</div>' +
                '<select class="settings-input" id="settings-provider" style="width:100%;margin-bottom:12px">' + provOpts + '</select>' +
                '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.model") + '</div>' +
                '<select class="settings-input" id="settings-model" style="width:100%;margin-bottom:12px">' + _buildModelOptions(curProvider) + '</select>' +
                '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.api_key") + '</div>' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<input type="password" class="settings-input" id="settings-api-key" value="' + esc(key) + '" placeholder="' + placeholder + '" style="flex:1">' +
                    '<button class="settings-btn-eye" id="settings-toggle-key" title="' + t("settings.show_key") + '">👁</button>' +
                '</div>' +
                '<p class="fs-xs text-muted" style="margin-top:6px">' + t("settings.api_key_note") + '</p>' +
                // Context file
                '<div class="settings-label fs-sm" style="margin-top:12px;margin-bottom:4px">' + t("settings.context_file") + '</div>' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<input type="file" class="settings-input" id="settings-context-file" accept=".md,.txt,.markdown" style="flex:1;font-family:inherit">' +
                    (_aiGetContextName() ? '<button class="ai-btn-ignore" id="settings-context-clear" style="white-space:nowrap">' + t("settings.context_clear") + '</button>' : '') +
                '</div>' +
                (_aiGetContextName() ? '<p class="fs-xs" style="margin-top:4px;color:var(--green)">&#10003; ' + esc(_aiGetContextName()) + ' (' + Math.round(_aiGetContext().length / 1024) + ' Ko)</p>' : '<p class="fs-xs text-muted" style="margin-top:4px">' + t("settings.context_note") + '</p>') +
            '</div>' +
            '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">' +
                '<button class="ai-btn-close" id="settings-cancel">' + t("ai.close") + '</button>' +
                '<button class="ai-btn-accept" id="settings-save">' + t("settings.save") + '</button>' +
            '</div>' +
            // Demo (at the bottom)
            '<div class="settings-section" style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px">' +
                '<div class="settings-label">' + t("settings.demo_section") + '</div>' +
                '<p class="fs-xs text-muted" style="margin-bottom:8px">' + t("settings.demo_note") + '</p>' +
                '<button class="ai-btn-close" style="width:100%;padding:8px;font-size:0.85em" id="settings-load-demo">' + t("settings.demo_load") + '</button>' +
            '</div>';
        panel.footer.innerHTML = "";
        _aiOpenPanel();

        // ai-close-btn already wired in _aiEnsurePanel
        document.getElementById("settings-cancel").onclick = _aiClosePanel;
        document.getElementById("settings-lang-fr").onclick = function() { switchLang("fr"); openSettings(); };
        document.getElementById("settings-lang-en").onclick = function() { switchLang("en"); openSettings(); };
        document.getElementById("settings-load-demo").onclick = function() {
            var demoFile = _locale === "fr" ? "demo-fr.json" : "demo-en.json";
            _aiClosePanel();
            fetch(demoFile).then(function(r) {
                if (!r.ok) throw new Error("Demo file not found: " + demoFile);
                return r.text();
            }).then(function(json) {
                D = JSON.parse(json);
                if (typeof _initDataAndRender === "function") _initDataAndRender(function() {
                    if (typeof _autoSave === "function") _autoSave();
                    showStatus(t("settings.demo_loaded"));
                });
            }).catch(function(e) {
                alert(t("settings.demo_error", {msg: e.message}));
            });
        };
        document.getElementById("settings-toggle-key").onclick = function() {
            var inp = document.getElementById("settings-api-key");
            inp.type = inp.type === "password" ? "text" : "password";
        };
        // Context file upload
        var _pendingContext = null;
        var _pendingContextName = null;
        document.getElementById("settings-context-file").onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                _pendingContext = ev.target.result;
                _pendingContextName = file.name;
                showStatus(t("settings.context_loaded", {name: file.name}));
            };
            reader.readAsText(file);
        };
        var clearBtn = document.getElementById("settings-context-clear");
        if (clearBtn) clearBtn.onclick = function() {
            _aiSetContext("");
            _aiSetContextName("");
            _pendingContext = null;
            _pendingContextName = null;
            openSettings(); // re-render to update UI
        };

        document.getElementById("settings-provider").onchange = function() {
            var p = this.value;
            document.getElementById("settings-api-key").placeholder = (AI_PROVIDERS[p] || AI_PROVIDERS.anthropic).placeholder;
            document.getElementById("settings-api-key").value = "";
            document.getElementById("settings-model").innerHTML = _buildModelOptions(p);
        };
        document.getElementById("settings-save").onclick = async function() {
            var aiToggle = document.getElementById("settings-ai-toggle").checked;
            var newKey = document.getElementById("settings-api-key").value.trim();
            var newProvider = document.getElementById("settings-provider").value;
            var newModel = document.getElementById("settings-model").value;

            // Cannot enable without a key
            if (aiToggle && !newKey) {
                alert(t("settings.ai_needs_key"));
                return;
            }

            // Validate key if it changed and AI is being enabled
            if (aiToggle && newKey && newKey !== _aiGetApiKey()) {
                var saveBtn = document.getElementById("settings-save");
                var origText = saveBtn.textContent;
                saveBtn.textContent = t("settings.validating_key");
                saveBtn.disabled = true;

                var valid = await _aiValidateKey(newProvider, newKey, newModel);
                saveBtn.textContent = origText;
                saveBtn.disabled = false;

                if (!valid) {
                    alert(t("settings.invalid_key"));
                    return;
                }
            }

            // Privacy warning when enabling AI
            if (aiToggle && !_aiIsEnabled()) {
                if (!confirm(t("settings.ai_privacy_warning"))) return;
            }

            _aiSetProvider(newProvider);
            _aiSetModel(newModel);
            if (newKey !== _aiGetApiKey()) _aiSetApiKey(newKey);
            if (_pendingContext !== null) {
                _aiSetContext(_pendingContext);
                _aiSetContextName(_pendingContextName);
            }
            _aiSetEnabled(aiToggle);
            _aiClosePanel();
            if (cfg.onSettingsSaved) cfg.onSettingsSaved();
            else if (typeof renderAll === "function") renderAll();
            showStatus(t("settings.saved"));
        };
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
        _overlayEl.onclick = function(e) { if (e.target === _overlayEl) _aiClosePanel(); };
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
        "settings.title": "Réglages",
        "settings.language": "Langue",
        "settings.ai_section": "Assistant IA",
        "settings.ai_enable": "Activer l'assistant IA",
        "settings.provider": "Fournisseur IA",
        "settings.model": "Modèle",
        "settings.api_key": "Clé API",
        "settings.show_key": "Afficher / masquer la clé",
        "settings.api_key_note": "La clé est stockée dans votre navigateur (localStorage) et n'est jamais incluse dans les fichiers sauvegardés. Elle est transmise directement à l'API du fournisseur depuis votre navigateur — elle peut être visible dans les DevTools et par les extensions installées.",
        "settings.demo_section": "Démonstration",
        "settings.demo_note": "Chargez un fichier d'exemple complet (société fictive MedSecure — IoMT) pour découvrir les fonctionnalités de l'application.",
        "settings.demo_load": "Charger la démonstration",
        "settings.demo_loaded": "Démonstration chargée",
        "settings.demo_error": "Erreur lors du chargement de la démo : {msg}",
        "settings.save": "Enregistrer",
        "settings.saved": "Réglages enregistrés",
        "settings.context_file": "Instructions méthodologiques (Markdown)",
        "settings.context_note": "Chargez un fichier .md contenant vos instructions méthodologiques, référentiels internes ou consignes de rédaction. Ces instructions guideront les suggestions de l'IA.",
        "settings.context_clear": "Supprimer",
        "settings.context_loaded": "Instructions chargées : {name}",
        "settings.ai_needs_key": "Veuillez saisir une clé API pour activer l'assistant IA.",
        "settings.validating_key": "Vérification de la clé...",
        "settings.invalid_key": "La clé API est invalide. Vérifiez la clé et le fournisseur sélectionné.",
        "settings.ai_privacy_warning": "En activant l'assistant IA :\n\n1. PARTAGE DE DONNÉES — Les données de votre analyse (contexte, exigences, mesures) seront envoyées au fournisseur IA sélectionné. Assurez-vous que votre politique de confidentialité et vos engagements contractuels autorisent ce partage.\n\n2. EXPOSITION DE LA CLÉ API — La clé API est transmise depuis votre navigateur. Elle est visible dans les outils de développement (DevTools) et peut être capturée par des extensions navigateur. Utilisez de préférence un navigateur sans extensions ou un profil dédié.\n\n3. RÉSEAU — Les échanges sont chiffrés (HTTPS) mais peuvent être journalisés par un proxy d'entreprise.\n\nVoulez-vous continuer ?",
        "ai.loading": "Génération des suggestions...",
        "ai.invalid_key": "Clé API invalide ou expirée. Vérifiez dans les Réglages.",
        "ai.api_error": "Erreur API :",
        "ai.accept": "Accepter",
        "ai.ignore": "Ignorer",
        "ai.accept_all": "Tout accepter",
        "ai.close": "Fermer",
        "ai.no_suggestions": "Aucune suggestion générée.",
        "ai.parse_error": "Erreur lors de l'analyse de la réponse IA."
    });

    _registerTranslations("en", {
        "settings.title": "Settings",
        "settings.language": "Language",
        "settings.ai_section": "AI Assistant",
        "settings.ai_enable": "Enable AI assistant",
        "settings.provider": "AI Provider",
        "settings.model": "Model",
        "settings.api_key": "API Key",
        "settings.show_key": "Show / hide key",
        "settings.api_key_note": "The key is stored in your browser (localStorage) and never included in saved files. It is transmitted directly to the provider's API from your browser — it may be visible in DevTools and to installed browser extensions.",
        "settings.demo_section": "Demonstration",
        "settings.demo_note": "Load a complete example file (fictional company MedSecure — IoMT) to explore the application features.",
        "settings.demo_load": "Load demonstration",
        "settings.demo_loaded": "Demonstration loaded",
        "settings.demo_error": "Error loading demo: {msg}",
        "settings.save": "Save",
        "settings.saved": "Settings saved",
        "settings.context_file": "Methodology instructions (Markdown)",
        "settings.context_note": "Upload a .md file with your methodology guidelines, internal frameworks, or writing instructions. These will guide the AI suggestions.",
        "settings.context_clear": "Remove",
        "settings.context_loaded": "Instructions loaded: {name}",
        "settings.ai_needs_key": "Please enter an API key to enable the AI assistant.",
        "settings.validating_key": "Validating key...",
        "settings.invalid_key": "The API key is invalid. Check the key and the selected provider.",
        "settings.ai_privacy_warning": "By enabling the AI assistant:\n\n1. DATA SHARING — Your analysis data (context, requirements, controls) will be sent to the selected AI provider. Make sure your privacy policy and contractual obligations allow this.\n\n2. API KEY EXPOSURE — The API key is transmitted directly from your browser. It is visible in browser DevTools and can be captured by browser extensions. Use a browser without extensions or a dedicated profile.\n\n3. NETWORK — Communications are encrypted (HTTPS) but may be logged by corporate proxies.\n\nDo you want to continue?",
        "ai.loading": "Generating suggestions...",
        "ai.invalid_key": "Invalid or expired API key. Check in Settings.",
        "ai.api_error": "API error:",
        "ai.accept": "Accept",
        "ai.ignore": "Ignore",
        "ai.accept_all": "Accept all",
        "ai.close": "Close",
        "ai.no_suggestions": "No suggestions generated.",
        "ai.parse_error": "Error parsing AI response."
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
        ".ai-error { padding:16px; color:#e74c3c; background:#fdf0ef; border-radius:6px; font-size:0.85em; }",
        ".btn-ai { background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-size:0.8em; font-weight:600; margin-left:auto; white-space:nowrap; }",
        ".btn-ai-sm { padding:2px 6px !important; font-size:0.75em !important; margin-left:4px; border-radius:4px; }",
        ".btn-ai:hover { opacity:0.9; }",
        ".ai-btn-suggest { background:#8b5cf6 !important; color:white !important; padding:2px 6px; margin-left:4px; }",
        ".ai-btn-suggest:hover { opacity:0.85; }",
        // Settings
        ".settings-section { margin-bottom:20px; }",
        ".settings-label { font-weight:600; font-size:0.85em; margin-bottom:8px; color:var(--text); }",
        ".settings-lang-btn { padding:6px 16px; border:1px solid var(--border); border-radius:4px; background:white; cursor:pointer; font-size:0.85em; }",
        ".settings-lang-btn.active { background:var(--blue); color:white; border-color:var(--blue); }",
        ".settings-lang-btn:hover:not(.active) { background:var(--bg); }",
        ".settings-input { padding:6px 10px; border:1px solid var(--border); border-radius:4px; font-size:0.85em; font-family:monospace; }",
        ".settings-btn-eye { background:none; border:1px solid var(--border); border-radius:4px; padding:4px 8px; cursor:pointer; font-size:1em; }",
        ".settings-toggle { position:relative; display:inline-block; width:40px; height:22px; }",
        ".settings-toggle input { opacity:0; width:0; height:0; }",
        ".settings-toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#ccc; transition:.3s; border-radius:22px; }",
        ".settings-toggle-slider:before { content:''; position:absolute; height:16px; width:16px; left:3px; bottom:3px; background:white; transition:.3s; border-radius:50%; }",
        ".settings-toggle input:checked + .settings-toggle-slider { background:var(--green); }",
        ".settings-toggle input:checked + .settings-toggle-slider:before { transform:translateX(18px); }"
    ].join("\n");
    document.head.appendChild(style);

})();
