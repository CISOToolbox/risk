// ─────────────────────────────────────────────────────────────
// GENERATED from shared/ts/ — do NOT edit here.
// Edit the shared TypeScript source and run shared/ts-build.sh.
// ─────────────────────────────────────────────────────────────
/**
 * CISO Toolbox — Settings drawer
 *
 * The settings drawer (window.openSettings): Language section, AI section,
 * and per-module extra settings. Extracted from ai_common.js so the AI
 * file stays a pure AI engine.
 *
 * Load AFTER i18n.js, cisotoolbox.js and ai_common.js:
 *   <script src="js/ai_common.js"></script>
 *   <script src="js/ct_settings.js"></script>
 *
 * Depends on ai_common.js (via window): _AI_PROVIDERS, _aiK,
 * _aiValidateKey, the _aiGet/_aiSet storage accessors, _aiIsEnabled,
 * _aiEnsurePanel, _aiOpenPanel, _aiClosePanel.
 *
 * Per-module hooks via window.AI_APP_CONFIG:
 *   hideAI, settingsExtraHTML(), onSettingsRendered(), onSettingsSaved()
 */
(function () {
    "use strict";
    function _k(suffix) { return window._aiK(suffix); }
    function _buildModelOptions(providerId) {
        var providers = window._AI_PROVIDERS || {};
        var p = providers[providerId] || providers.anthropic || { models: [] };
        var cur = window._aiGetModel();
        var h = "";
        (p.models || []).forEach(function (m) {
            h += '<option value="' + m.id + '"' + (m.id === cur ? ' selected' : '') + '>' + m.label + '</option>';
        });
        return h;
    }
    window.openSettings = function () {
        if (typeof toggleMenu === "function")
            toggleMenu();
        var AI_PROVIDERS = window._AI_PROVIDERS || {};
        var cfg = window.AI_APP_CONFIG || {};
        // BUG-11: ai_common.js may be absent (e.g. Pilot uses pilot_ai_panel.js
        // and only needs the language drawer). Degrade to a language-only panel.
        var _hasAI = typeof window._aiGetApiKey === "function";
        var key = _hasAI ? window._aiGetApiKey() : "";
        var curProvider = _hasAI ? window._aiGetProvider() : "";
        var aiEnabled = localStorage.getItem(_k("enabled")) === "true";
        // Optional provider allowlist — set by ai_backend.js on backend
        // deployments (e.g. ["anthropic","openai"]); absent on opensource.
        var _allow = (window._AI_PROVIDER_ALLOWLIST instanceof Array && window._AI_PROVIDER_ALLOWLIST.length)
            ? window._AI_PROVIDER_ALLOWLIST : null;
        if (_allow && _allow.indexOf(curProvider) < 0)
            curProvider = _allow[0];
        var providerConf = AI_PROVIDERS[curProvider] || AI_PROVIDERS.anthropic || {};
        var provOpts = "";
        for (var pid in AI_PROVIDERS) {
            if (_allow && _allow.indexOf(pid) < 0)
                continue;
            provOpts += '<option value="' + pid + '"' + (pid === curProvider ? ' selected' : '') + '>' + AI_PROVIDERS[pid].label + '</option>';
        }
        var panel = window._aiEnsurePanel();
        panel.title.textContent = t("settings.title");
        var _hideAI = cfg.hideAI || !_hasAI;
        var _settingsHTML = 
        // Language
        '<div class="settings-section">' +
            '<div class="settings-label">' + t("settings.language") + '</div>' +
            '<div style="display:flex;gap:8px">' +
            '<button class="settings-lang-btn' + (_locale === "fr" ? " active" : "") + '" id="settings-lang-fr">Français</button>' +
            '<button class="settings-lang-btn' + (_locale === "en" ? " active" : "") + '" id="settings-lang-en">English</button>' +
            '</div>' +
            '</div>';
        // Build provider-specific fields — only the selected provider's
        // fields are shown. This keeps the panel clean for operators who
        // only need one provider (the common case).
        // NB: assigned to a `var` (function-scoped), NOT declared as a
        // block-scoped `function` — the provider-change handler below
        // lives outside the `if (!_hideAI)` block and must be able to call it.
        var _providerFields = function (p) {
            var pConf = AI_PROVIDERS[p] || {};
            var h = '';
            // Model dropdown (for providers that define a model list)
            if (pConf.models && pConf.models.length) {
                h += '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.model") + '</div>';
                h += '<select class="settings-input" id="settings-model" style="width:100%;margin-bottom:12px">' + _buildModelOptions(p) + '</select>';
            }
            else {
                // Custom: free-text model input
                h += '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.model") + '</div>';
                h += '<input type="text" class="settings-input" id="settings-model" value="' + esc(localStorage.getItem(_k("model")) || "") + '" placeholder="model-name" style="width:100%;margin-bottom:12px">';
            }
            // API key (all providers except custom-without-key)
            if (p !== "custom" || true) {
                h += '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.api_key") + (p === "custom" ? ' <span class="text-muted">(optionnel)</span>' : '') + '</div>';
                h += '<div style="display:flex;gap:6px;align-items:center">';
                h += '<input type="password" class="settings-input" id="settings-api-key" value="' + esc(key) + '" placeholder="' + esc((pConf.placeholder || "sk-...")) + '" style="flex:1">';
                h += '<button class="settings-btn-eye" id="settings-toggle-key" title="' + t("settings.show_key") + '">👁</button>';
                h += '</div>';
                if (p !== "bedrock" && p !== "custom") {
                    h += '<p class="fs-xs text-muted" style="margin-top:6px">' + t("settings.api_key_note") + '</p>';
                }
            }
            // Bedrock-specific: secret key + region
            if (p === "bedrock") {
                h += '<div class="settings-label fs-sm" style="margin-top:12px;margin-bottom:4px">' + t("settings.secret_key") + '</div>';
                h += '<input type="password" class="settings-input" id="settings-secret-key" value="' + esc(window._aiGetSecretKey()) + '" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" style="width:100%">';
                h += '<div class="settings-label fs-sm" style="margin-top:8px;margin-bottom:4px">' + t("settings.region") + '</div>';
                h += '<input type="text" class="settings-input" id="settings-region" value="' + esc(window._aiGetRegion()) + '" placeholder="eu-west-3" style="width:100%">';
            }
            // Custom: endpoint is required. Other providers: optional.
            if (p === "custom") {
                h += '<div class="settings-label fs-sm" style="margin-top:12px;margin-bottom:4px">' + t("settings.endpoint") + ' <span style="color:var(--red)">*</span></div>';
                h += '<input type="url" class="settings-input" id="settings-endpoint" value="' + esc(window._aiGetEndpoint()) + '" placeholder="https://my-llm.example.com/v1/chat/completions" style="width:100%">';
                h += '<p class="fs-xs text-muted" style="margin-top:4px">' + (t("settings.custom_endpoint_note") || "URL complète du endpoint compatible OpenAI (POST, JSON, messages[]).") + '</p>';
            }
            else {
                h += '<div class="settings-label fs-sm" style="margin-top:12px;margin-bottom:4px">' + t("settings.endpoint") + ' <span class="text-muted">(optionnel)</span></div>';
                h += '<input type="url" class="settings-input" id="settings-endpoint" value="' + esc(window._aiGetEndpoint()) + '" placeholder="' + esc((pConf.endpoint || "")) + '" style="width:100%">';
                h += '<p class="fs-xs text-muted" style="margin-top:4px">' + t("settings.endpoint_note") + '</p>';
            }
            return h;
        };
        if (!_hideAI) {
            // Add "custom" to provider options if not already defined
            var allProviderOpts = provOpts;
            if (!AI_PROVIDERS.custom && (!_allow || _allow.indexOf("custom") >= 0)) {
                allProviderOpts += '<option value="custom"' + (curProvider === "custom" ? ' selected' : '') + '>' + (t("settings.provider_custom") || "Custom LLM") + '</option>';
            }
            _settingsHTML +=
                '<div class="settings-section">' +
                    '<div class="settings-label">' + t("settings.ai_section") + '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
                    '<label class="settings-toggle"><input type="checkbox" id="settings-ai-toggle"' + (aiEnabled ? " checked" : "") + '><span class="settings-toggle-slider"></span></label>' +
                    '<span class="fs-sm">' + t("settings.ai_enable") + '</span>' +
                    '</div>' +
                    '<div class="settings-label fs-sm" style="margin-bottom:4px">' + t("settings.provider") + '</div>' +
                    '<select class="settings-input" id="settings-provider" style="width:100%;margin-bottom:12px">' + allProviderOpts + '</select>' +
                    // Provider-specific fields container — rebuilt on provider change
                    '<div id="settings-provider-fields">' + _providerFields(curProvider) + '</div>' +
                    // Context file (always visible, not provider-specific)
                    '<div class="settings-label fs-sm" style="margin-top:12px;margin-bottom:4px">' + t("settings.context_file") + '</div>' +
                    '<div style="display:flex;gap:6px;align-items:center">' +
                    '<input type="file" class="settings-input" id="settings-context-file" accept=".md,.txt,.markdown" style="flex:1;font-family:inherit">' +
                    (window._aiGetContextName() ? '<button class="ai-btn-ignore" id="settings-context-clear" style="white-space:nowrap">' + t("settings.context_clear") + '</button>' : '') +
                    '</div>' +
                    (window._aiGetContextName() ? '<p class="fs-xs" style="margin-top:4px;color:var(--green)">&#10003; ' + esc(window._aiGetContextName()) + ' (' + Math.round(window._aiGetContext().length / 1024) + ' Ko)</p>' : '<p class="fs-xs text-muted" style="margin-top:4px">' + t("settings.context_note") + '</p>') +
                    '</div>';
        }
        else {
            // Hidden AI toggle for save handler compatibility
            _settingsHTML += '<input type="checkbox" id="settings-ai-toggle" style="display:none">';
            _settingsHTML += '<input type="hidden" id="settings-api-key" value="' + esc(key) + '">';
            _settingsHTML += '<input type="hidden" id="settings-provider" value="' + esc(curProvider) + '">';
            _settingsHTML += '<input type="hidden" id="settings-model" value="">';
        }
        // App-specific extra settings (injected via AI_APP_CONFIG.settingsExtraHTML)
        _settingsHTML += (cfg.settingsExtraHTML ? cfg.settingsExtraHTML() : '');
        // Buttons
        _settingsHTML +=
            '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">' +
                '<button class="ai-btn-close" id="settings-cancel">' + t("ai.close") + '</button>' +
                '<button class="ai-btn-accept" id="settings-save">' + t("settings.save") + '</button>' +
                '</div>';
        panel.body.innerHTML = _settingsHTML;
        panel.footer.innerHTML = "";
        window._aiOpenPanel();
        // ai-close-btn already wired in _aiEnsurePanel
        document.getElementById("settings-cancel").onclick = window._aiClosePanel;
        document.getElementById("settings-lang-fr").onclick = function () { switchLang("fr", window.openSettings); };
        document.getElementById("settings-lang-en").onclick = function () { switchLang("en", window.openSettings); };
        var toggleKeyBtn = document.getElementById("settings-toggle-key");
        if (toggleKeyBtn)
            toggleKeyBtn.onclick = function () {
                var inp = document.getElementById("settings-api-key");
                inp.type = inp.type === "password" ? "text" : "password";
            };
        // Context file upload
        var _pendingContext = null;
        var _pendingContextName = null;
        var ctxFile = document.getElementById("settings-context-file");
        if (ctxFile)
            ctxFile.onchange = function (e) {
                var file = e.target.files[0];
                if (!file)
                    return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    _pendingContext = ev.target.result;
                    _pendingContextName = file.name;
                    showStatus(t("settings.context_loaded", { name: file.name }));
                };
                reader.readAsText(file);
            };
        var clearBtn = document.getElementById("settings-context-clear");
        if (clearBtn)
            clearBtn.onclick = function () {
                window._aiSetContext("");
                window._aiSetContextName("");
                _pendingContext = null;
                _pendingContextName = null;
                window.openSettings(); // re-render to update UI
            };
        var provSelect = document.getElementById("settings-provider");
        if (provSelect)
            provSelect.onchange = function () {
                var p = provSelect.value;
                // Rebuild the provider-specific fields section entirely —
                // cleaner than show/hide, and ensures only relevant fields exist.
                var container = document.getElementById("settings-provider-fields");
                if (container) {
                    container.innerHTML = _providerFields(p);
                    // Re-wire eye toggle on the new API key input
                    var btn = document.getElementById("settings-toggle-key");
                    if (btn)
                        btn.onclick = function () {
                            var inp = document.getElementById("settings-api-key");
                            if (inp)
                                inp.type = inp.type === "password" ? "text" : "password";
                        };
                }
            };
        document.getElementById("settings-save").onclick = async function () {
            if (!_hasAI) {
                window._aiClosePanel();
                return;
            } // language-only drawer (no ai_common)
            var aiToggle = document.getElementById("settings-ai-toggle").checked;
            var newKey = document.getElementById("settings-api-key").value.trim();
            var newProvider = document.getElementById("settings-provider").value;
            var newModel = document.getElementById("settings-model").value;
            // Cannot enable without a key — except for the custom provider
            // (key optional) or a backend deployment where a key is already
            // stored server-side (an empty field then means "keep current").
            var _beHasKey = !!(window._aiRuntime && window._aiRuntime[newProvider + "_configured"]);
            if (aiToggle && !newKey && newProvider !== "custom" && !_beHasKey) {
                alert(t("settings.ai_needs_key"));
                return;
            }
            // Custom provider requires an endpoint
            if (aiToggle && newProvider === "custom") {
                var epVal = (document.getElementById("settings-endpoint") || {}).value || "";
                if (!epVal.trim()) {
                    alert(t("settings.custom_needs_endpoint") || "L'endpoint est requis pour un LLM personnalisé.");
                    return;
                }
            }
            // Persist provider + model + provider-specific creds (custom
            // endpoint / Bedrock secret + region) BEFORE validation, so the
            // backend _pushConfig override and the opensource validators
            // read fresh values. The API key itself is persisted only after
            // a successful validation, below.
            window._aiSetProvider(newProvider);
            window._aiSetModel(newModel);
            var endpointEl = document.getElementById("settings-endpoint");
            window._aiSetEndpoint(endpointEl ? endpointEl.value.trim() : "");
            var secretEl = document.getElementById("settings-secret-key");
            window._aiSetSecretKey(secretEl ? secretEl.value.trim() : "");
            var regionEl = document.getElementById("settings-region");
            window._aiSetRegion(regionEl ? regionEl.value.trim() : "");
            // Validate key if it changed and AI is being enabled
            if (aiToggle && newKey && newKey !== window._aiGetApiKey()) {
                var saveBtn = document.getElementById("settings-save");
                var origText = saveBtn.textContent;
                saveBtn.textContent = t("settings.validating_key");
                saveBtn.disabled = true;
                var valid = await window._aiValidateKey(newProvider, newKey, newModel);
                saveBtn.textContent = origText;
                saveBtn.disabled = false;
                if (!valid) {
                    alert(t("settings.invalid_key"));
                    return;
                }
            }
            // Privacy warning when enabling AI. The wording depends on where the
            // API key lives. window._aiRuntime is set only by ai_backend.js
            // (backend builds, never opensource):
            //   - managed (keys pushed by Pilot)      -> no key in the browser
            //   - backend non-managed (user-entered)  -> key stored server-side,
            //       calls proxied; never sent to the provider from the browser
            //   - opensource (no _aiRuntime)          -> key in the browser, sent
            //       directly to the provider on every call (full exposure)
            if (aiToggle && !window._aiIsEnabled()) {
                var _aiWarnKey = "settings.ai_privacy_warning";
                if (window._aiRuntime) {
                    _aiWarnKey = window._aiRuntime.managed
                        ? "settings.ai_privacy_warning_managed"
                        : "settings.ai_privacy_warning_backend";
                }
                if (!confirm(t(_aiWarnKey)))
                    return;
            }
            if (newKey !== window._aiGetApiKey())
                window._aiSetApiKey(newKey);
            if (_pendingContext !== null) {
                window._aiSetContext(_pendingContext);
                window._aiSetContextName(_pendingContextName || "");
            }
            window._aiSetEnabled(aiToggle);
            // Backend deployments: flush provider / model / region / endpoint
            // to the server even when no key changed — covers a custom LLM
            // with no key and toggle-only saves. No-op in opensource builds.
            if (typeof window._aiPersistConfig === "function")
                window._aiPersistConfig();
            window._aiClosePanel();
            if (cfg.onSettingsSaved)
                cfg.onSettingsSaved();
            else if (typeof renderAll === "function")
                renderAll();
            showStatus(t("settings.saved"));
        };
        // App-specific post-render hook
        if (cfg.onSettingsRendered)
            cfg.onSettingsRendered();
    };
    // ── I18N — settings keys ─────────────────────────────────────────
    _registerTranslations("fr", {
        "ai.close": "Fermer", // settings close button — registered here so ct_settings is self-sufficient (also defined in ai_common)
        "settings.title": "Réglages",
        "settings.language": "Langue",
        "settings.ai_section": "Assistant IA",
        "settings.ai_enable": "Activer l'assistant IA",
        "settings.provider": "Fournisseur IA",
        "settings.model": "Modèle",
        "settings.api_key": "Clé API",
        "settings.show_key": "Afficher / masquer la clé",
        "settings.api_key_note": "La clé est stockée dans votre navigateur (localStorage) et n'est jamais incluse dans les fichiers sauvegardés. Elle est transmise directement à l'API du fournisseur depuis votre navigateur — elle peut être visible dans les DevTools et par les extensions installées.",
        "settings.endpoint": "Endpoint API (optionnel)",
        "settings.endpoint_note": "Laissez vide pour utiliser l'API officielle du fournisseur. Renseignez une URL custom pour utiliser un proxy ou un endpoint compatible (ex: Azure OpenAI, Ollama, LiteLLM).",
        "settings.secret_key": "Secret Access Key (AWS)",
        "settings.region": "Region AWS",
        "settings.provider_custom": "LLM personnalisé",
        "settings.custom_endpoint_note": "URL complète du endpoint compatible OpenAI (POST, JSON, messages[]).",
        "settings.custom_needs_endpoint": "L'endpoint est requis pour un LLM personnalisé.",
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
        "settings.ai_privacy_warning_managed": "En activant l'assistant IA :\n\n1. PARTAGE DE DONNÉES — Les données de votre analyse (contexte, exigences, mesures) seront envoyées au fournisseur IA configuré par votre administrateur. Assurez-vous que votre politique de confidentialité et vos engagements contractuels autorisent ce partage.\n\n2. RÉSEAU — Les requêtes transitent par le backend de la suite (votre clé API n'est jamais exposée au navigateur) et sont chiffrées (HTTPS).\n\nVoulez-vous continuer ?",
        "settings.ai_privacy_warning_backend": "En activant l'assistant IA :\n\n1. PARTAGE DE DONNÉES — Les données de votre analyse (contexte, exigences, mesures) seront envoyées au fournisseur IA sélectionné via le backend. Assurez-vous que votre politique de confidentialité et vos engagements contractuels autorisent ce partage.\n\n2. CLÉ API — La clé est stockée côté serveur et utilisée par le backend pour appeler le fournisseur IA ; elle n'est pas transmise au fournisseur depuis votre navigateur. Elle ne transite par votre navigateur qu'une seule fois (en HTTPS, vers ce serveur) lors de l'enregistrement.\n\n3. RÉSEAU — Les échanges sont chiffrés (HTTPS) mais peuvent être journalisés par un proxy d'entreprise.\n\nVoulez-vous continuer ?",
    });
    _registerTranslations("en", {
        "ai.close": "Close", // settings close button — registered here so ct_settings is self-sufficient (also defined in ai_common)
        "settings.title": "Settings",
        "settings.language": "Language",
        "settings.ai_section": "AI Assistant",
        "settings.ai_enable": "Enable AI assistant",
        "settings.provider": "AI Provider",
        "settings.model": "Model",
        "settings.api_key": "API Key",
        "settings.show_key": "Show / hide key",
        "settings.api_key_note": "The key is stored in your browser (localStorage) and never included in saved files. It is transmitted directly to the provider's API from your browser — it may be visible in DevTools and to installed browser extensions.",
        "settings.endpoint": "API Endpoint (optional)",
        "settings.endpoint_note": "Leave empty to use the official provider API. Enter a custom URL for a proxy or compatible endpoint (e.g.: Azure OpenAI, Ollama, LiteLLM).",
        "settings.secret_key": "Secret Access Key (AWS)",
        "settings.region": "AWS Region",
        "settings.provider_custom": "Custom LLM",
        "settings.custom_endpoint_note": "Full URL of the OpenAI-compatible endpoint (POST, JSON, messages[]).",
        "settings.custom_needs_endpoint": "An endpoint is required for a custom LLM.",
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
        "settings.ai_privacy_warning_managed": "By enabling the AI assistant:\n\n1. DATA SHARING — Your analysis data (context, requirements, controls) will be sent to the AI provider configured by your administrator. Make sure your privacy policy and contractual obligations allow this.\n\n2. NETWORK — Requests go through the suite backend (your API key is never exposed to the browser) and are encrypted (HTTPS).\n\nDo you want to continue?",
        "settings.ai_privacy_warning_backend": "By enabling the AI assistant:\n\n1. DATA SHARING — Your analysis data (context, requirements, controls) will be sent to the selected AI provider through the backend. Make sure your privacy policy and contractual obligations allow this.\n\n2. API KEY — The key is stored server-side and used by the backend to call the AI provider; it is not sent to the provider from your browser. It only passes through your browser once (over HTTPS, to this server) when you save it.\n\n3. NETWORK — Communications are encrypted (HTTPS) but may be logged by corporate proxies.\n\nDo you want to continue?",
    });
    // ── CSS — settings drawer controls ───────────────────────────────
    var style = document.createElement("style");
    style.textContent = [
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
