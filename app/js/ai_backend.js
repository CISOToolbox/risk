// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — AI Backend Overrides
 *
 * Pilot-managed AI mode: runtime probe, proxy calls, managed settings UI.
 * Load AFTER ai_common.js. Used by backend apps only (never in opensource).
 *
 * Ported from the module's original JavaScript implementation.
 * (identical across 9 modules).
 */
(function () {
    "use strict";
    var cfg = window.AI_APP_CONFIG || {};
    // ═══════════════════════════════════════════════════════════════════
    // MANAGED MODE — no LLM credential ever lives in the browser (STO-01)
    // ═══════════════════════════════════════════════════════════════════
    //
    // In a suite (managed) deployment the backend owns the provider keys and
    // proxies every call through api/ai/complete, so the browser has no
    // reason to hold — or to keep — an API key. Three consequences, all of
    // them gated on `_aiRuntime.managed`:
    //   1. keys written by an earlier non-managed run are purged from
    //      localStorage as soon as the runtime probe answers "managed";
    //   2. the key setters become no-ops, so no code path can write one back;
    //   3. the settings drawer never falls back to the key-entry variant
    //      while the probe is still in flight.
    //
    // The probe says managed:true in the suite (Pilot's settings) and in a
    // standalone backend deployment (the module admin's, on its server):
    // keys never live in the browser there. NOTHING here fires when it says
    // managed:false, and the opensource / pure-frontend builds never load this
    // file at all, so their localStorage key store (the only one they have) is
    // untouched.
    /** `<prefix>_ai_apikey` and `<prefix>_ai_secretkey` — the two secret
     *  entries written by ai_common.js. Provider / model / region / endpoint
     *  are configuration, not credentials, and are left alone. */
    var _SECRET_KEY_RE = /_ai_(apikey|secretkey)$/;
    function _isManaged() {
        return !!(window._aiRuntime && window._aiRuntime.managed);
    }
    /** Delete every stored LLM credential for this origin. The suite serves
     *  all modules from one origin, so localStorage is shared: sweep every
     *  prefix, not just this module's. Returns the number of entries removed. */
    function _purgeStoredKeys() {
        var doomed = [];
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && _SECRET_KEY_RE.test(k))
                    doomed.push(k);
            }
            doomed.forEach(function (k) { localStorage.removeItem(k); });
        }
        catch (e) {
            return 0; // storage disabled / quota-partitioned — nothing to do
        }
        return doomed.length;
    }
    /** Purge + discreet one-off notice, only when something was actually
     *  removed (a clean browser stays silent). */
    function _purgeLegacyKeys() {
        if (!_purgeStoredKeys())
            return;
        if (typeof showStatus === "function") {
            showStatus(t("settings.ai_keys_purged")
                || "Locally stored AI API keys removed — they are managed by the server.");
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // RUNTIME PROBE
    // ═══════════════════════════════════════════════════════════════════
    window._aiRuntime = { managed: false, can_use: false, provider: "anthropic", model: "", loaded: false };
    window._aiFetchRuntime = async function () {
        try {
            var r = await fetch("api/ai/runtime", { credentials: "same-origin" });
            if (r.status === 401)
                return window._aiRuntime;
            if (!r.ok) {
                window._aiRuntime.loaded = true;
                return window._aiRuntime;
            }
            var j = await r.json();
            window._aiRuntime = Object.assign(window._aiRuntime, j, { loaded: true });
            // First point in the page lifecycle where "managed" is known.
            if (window._aiRuntime.managed)
                _purgeLegacyKeys();
        }
        catch (e) {
            window._aiRuntime.loaded = true;
        }
        // Re-render current view so AI buttons appear after probe completes
        if (window._aiRuntime.managed && window._aiRuntime.can_use) {
            if (typeof renderAll === "function")
                setTimeout(renderAll, 100);
            else if (typeof renderPanel === "function")
                setTimeout(renderPanel, 100);
        }
        return window._aiRuntime;
    };
    window._aiFetchRuntime();
    // ═══════════════════════════════════════════════════════════════════
    // OVERRIDE: _aiIsEnabled — managed mode checks can_use
    // ═══════════════════════════════════════════════════════════════════
    // Override _aiGetApiKey: in managed mode, return a placeholder
    // so that guards like `if (!_aiGetApiKey()) return` don't block.
    var _origGetApiKey = window._aiGetApiKey;
    window._aiGetApiKey = function () {
        if (window._aiRuntime && window._aiRuntime.managed && window._aiRuntime.can_use) {
            return "managed-by-pilot";
        }
        return _origGetApiKey();
    };
    // Managed mode never persists a credential in the browser. Kept as a
    // no-op rather than removed so that any caller (module code, a stale
    // settings drawer) stays harmless instead of throwing.
    var _origSetApiKey = window._aiSetApiKey;
    window._aiSetApiKey = function (key) {
        if (_isManaged())
            return;
        _origSetApiKey(key);
    };
    var _origSetSecretKey = window._aiSetSecretKey;
    window._aiSetSecretKey = function (key) {
        if (_isManaged())
            return;
        _origSetSecretKey(key);
    };
    var _origIsEnabled = window._aiIsEnabled;
    window._aiIsEnabled = function () {
        if (window._aiRuntime && window._aiRuntime.managed) {
            var pfx = (cfg.storagePrefix || "ct") + "_ai_";
            return localStorage.getItem(pfx + "enabled") === "true" && !!window._aiRuntime.can_use;
        }
        return _origIsEnabled();
    };
    // ═══════════════════════════════════════════════════════════════════
    // OVERRIDE: _aiCallAPI — managed mode routes through backend proxy
    // ═══════════════════════════════════════════════════════════════════
    var _origCallAPI = window._aiCallAPI;
    window._aiCallAPI = async function (systemPrompt, userPrompt) {
        if (!(window._aiRuntime && window._aiRuntime.managed)) {
            return _origCallAPI(systemPrompt, userPrompt);
        }
        var ctx = window._aiGetContext ? window._aiGetContext() : "";
        if (ctx) {
            systemPrompt += "\n\n--- METHODOLOGY INSTRUCTIONS (provided by the user) ---\n" + ctx;
        }
        if (!window._aiRuntime.can_use)
            throw new Error(t("ai.invalid_key") || "AI access not granted");
        var r;
        try {
            r = await fetch("api/ai/complete", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system: systemPrompt,
                    user: userPrompt,
                    provider: window._aiRuntime.provider || "anthropic",
                    model: window._aiRuntime.model || "claude-sonnet-4-6"
                })
            });
        }
        catch (e) {
            throw new Error("Network: " + e.message);
        }
        if (r.status === 403)
            throw new Error(t("ai.invalid_key") || "AI access not granted");
        if (!r.ok) {
            var errTxt = await r.text();
            throw new Error("API " + r.status + ": " + errTxt.substring(0, 200));
        }
        var jr = await r.json();
        return jr.text || "";
    };
    // ═══════════════════════════════════════════════════════════════════
    // OVERRIDE: openSettings — managed mode shows toggle only
    // ═══════════════════════════════════════════════════════════════════
    var _origOpenSettings = window.openSettings;
    var _settingsAwaitingProbe = false;
    window.openSettings = function () {
        // The runtime probe decides WHICH drawer to show. Until it has
        // answered we must not fall through to the local one: on a managed
        // suite that would put the API-key fields back on screen (and let a
        // user type a key the browser has no business holding). Wait for the
        // probe once — if it cannot answer (offline, 401), degrade to the
        // local drawer, which is the correct UI for a non-managed backend.
        if (window._aiRuntime && !window._aiRuntime.loaded && !_settingsAwaitingProbe) {
            _settingsAwaitingProbe = true;
            window._aiFetchRuntime().then(function () { window.openSettings(); });
            return;
        }
        if (!(window._aiRuntime && window._aiRuntime.managed)) {
            return _origOpenSettings();
        }
        // Managed: a legacy key may still be sitting in storage if the probe
        // ran before this module's prefix was written. Cheap, idempotent.
        _purgeLegacyKeys();
        // Close the Fichier dropdown if open (never toggle — a toggle would OPEN
        // it when openSettings is re-invoked after a language switch). Mirrors
        // the same guard in ct_settings.ts openSettings.
        var _io = document.getElementById("io-menu");
        if (_io)
            _io.classList.remove("open");
        var pfx = (cfg.storagePrefix || "ct") + "_ai_";
        var aiEnabled = localStorage.getItem(pfx + "enabled") === "true";
        var canUse = !!window._aiRuntime.can_use;
        var panel = window._aiEnsurePanel();
        panel.title.textContent = t("settings.title");
        var h = '<div class="settings-section">' +
            '<div class="settings-label">' + t("settings.language") + '</div>' +
            '<div style="display:flex;gap:8px">' +
            '<button class="settings-lang-btn' + (typeof _locale !== "undefined" && _locale === "fr" ? " active" : "") + '" id="settings-lang-fr">Français</button>' +
            '<button class="settings-lang-btn' + (typeof _locale !== "undefined" && _locale === "en" ? " active" : "") + '" id="settings-lang-en">English</button>' +
            '</div>' +
            '</div>';
        // hideAI: a module without browser-side AI (its AI, if any, runs on the
        // server) shows no AI toggle — the same rule as the non-managed drawer.
        if (!cfg.hideAI) {
            h +=
                '<div class="settings-section">' +
                    '<div class="settings-label">' + t("settings.ai_section") + '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
                    '<label class="settings-toggle"><input type="checkbox" id="settings-ai-toggle"' + (aiEnabled && canUse ? " checked" : "") + (canUse ? "" : " disabled") + '><span class="settings-toggle-slider"></span></label>' +
                    '<span class="fs-sm">' + t("settings.ai_enable") + '</span>' +
                    '</div>' +
                    (canUse
                        ? '<p class="fs-xs text-muted" style="margin:4px 0 0">' + esc(t(window._aiRuntime.managed_by === "module"
                            ? (window._aiRuntime.editable ? "settings.ai_server.note_admin" : "settings.ai_server.note")
                            : "settings.ai_managed_note")) + '</p>'
                        : '<p class="fs-xs" style="margin:4px 0 0;color:var(--ct-critical)">' + esc(t("settings.ai_no_access") || "AI access has not been granted to your account. Contact your administrator.") + '</p>') +
                    '</div>';
        }
        // Standalone: the module's server runs the AI and its admin sets it
        // here — shown even with hideAI, whose AI runs on the server too.
        if (window._aiRuntime.managed_by === "module" && window._aiRuntime.editable) {
            h += '<div class="settings-section"><div class="settings-label">' + esc(t("settings.ai_server.title")) + '</div>' +
                '<div id="ct-ai-server"><p class="ct-muted fs-sm">' + esc(t("settings.ai_server.loading")) + '</p></div></div>';
        }
        h += (cfg.settingsExtraHTML ? cfg.settingsExtraHTML() : '');
        h += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">' +
            '<button class="ai-btn-close" id="settings-cancel">' + t("ai.close") + '</button>' +
            '<button class="ai-btn-accept" id="settings-save">' + t("settings.save") + '</button>' +
            '</div>';
        panel.body.innerHTML = h;
        panel.footer.innerHTML = "";
        window._aiOpenPanel();
        document.getElementById("settings-cancel").onclick = window._aiClosePanel;
        document.getElementById("settings-lang-fr").onclick = function () { switchLang("fr", window.openSettings); };
        document.getElementById("settings-lang-en").onclick = function () { switchLang("en", window.openSettings); };
        document.getElementById("settings-save").onclick = function () {
            if (!cfg.hideAI) {
                var toggle = document.getElementById("settings-ai-toggle").checked;
                if (toggle && !canUse)
                    return;
                if (toggle && !aiEnabled) {
                    if (!confirm(t("settings.ai_privacy_warning")))
                        return;
                }
                localStorage.setItem(pfx + "enabled", toggle ? "true" : "false");
            }
            window._aiClosePanel();
            if (cfg.onSettingsSaved)
                cfg.onSettingsSaved();
            else if (typeof renderAll === "function")
                renderAll();
            showStatus(t("settings.saved"));
        };
        if (cfg.onSettingsRendered)
            cfg.onSettingsRendered();
        if (document.getElementById("ct-ai-server"))
            _aiServerLoad();
    };
    var _aiServer = { keys: {}, providers: {}, provider: "anthropic" };
    // Providers whose key the module can test (validate-key).
    var _AI_TESTABLE = ["anthropic", "openai", "gemini"];
    function _aiField(id, labelKey, input) {
        return '<div class="ct-field ct-col-span-2"><label class="ct-label" for="' + id + '">' + esc(t(labelKey)) + '</label>' + input + '</div>';
    }
    function _aiSecret(id, labelKey, isSet) {
        return _aiField(id, labelKey, '<input type="password" class="ct-input" id="' + id + '" autocomplete="new-password"' +
            ' placeholder="' + esc(isSet ? t("settings.ai_server.secret_set") : "") + '">');
    }
    function _aiText(id, labelKey, value, placeholder) {
        return _aiField(id, labelKey, '<input type="text" class="ct-input" id="' + id + '" autocomplete="off" spellcheck="false"' +
            ' value="' + esc(value) + '" placeholder="' + esc(placeholder) + '">');
    }
    function _aiServerRender() {
        var holder = document.getElementById("ct-ai-server");
        if (!holder)
            return;
        var k = _aiServer.keys, p = _aiServer.provider, info = _aiServer.providers[p] || { label: p };
        var options = Object.keys(_aiServer.providers).concat(_aiServer.providers.custom ? [] : ["custom"]).map(function (id) {
            var label = id === "custom" ? t("settings.ai_server.custom") : (_aiServer.providers[id] || { label: id }).label;
            return '<option value="' + esc(id) + '"' + (id === p ? " selected" : "") + '>' + esc(label) + '</option>';
        }).join("");
        var models = (info.models || []).map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.label) + '</option>'; }).join("");
        var model = k.provider === p && k.model ? k.model : (info.defaultModel || "");
        var fields = "";
        if (p === "bedrock") {
            fields = _aiSecret("ct-ai-key", "settings.ai_server.access_key", !!k.bedrock) +
                _aiSecret("ct-ai-secret", "settings.ai_server.secret_key", !!k.ai_secret_bedrock) +
                _aiText("ct-ai-region", "settings.ai_server.region", k.ai_region_bedrock || "", "eu-west-3");
        }
        else if (p === "custom") {
            fields = _aiText("ct-ai-endpoint", "settings.ai_server.endpoint", k.ai_custom_endpoint || "", "https://llm.example.com/v1") +
                _aiSecret("ct-ai-key", "settings.ai_server.api_key", !!k.ai_custom_key) +
                _aiText("ct-ai-label", "settings.ai_server.label", k.ai_custom_label || "", "Custom LLM");
        }
        else {
            fields = _aiSecret("ct-ai-key", "settings.ai_server.api_key", !!k[p]);
        }
        holder.innerHTML = '<p class="ct-muted fs-xs">' + esc(t("settings.ai_server.help")) + '</p>' +
            '<div class="ct-form-grid">' +
            _aiField("ct-ai-provider", "settings.ai_server.provider", '<select class="ct-select" id="ct-ai-provider" data-change="_ctAiServerProvider" data-pass-value>' + options + '</select>') +
            _aiField("ct-ai-model", "settings.ai_server.model", '<input type="text" class="ct-input" id="ct-ai-model" list="ct-ai-models" autocomplete="off" value="' + esc(model) + '">' +
                '<datalist id="ct-ai-models">' + models + '</datalist>') +
            fields +
            '</div>' +
            '<label class="ct-check"><input type="checkbox" id="ct-ai-clear">' +
            '<span class="ct-check-box">' + _icon("check", 12) + '</span>' + esc(t("settings.ai_server.clear")) + '</label>' +
            '<div class="ct-actions mt-8">' +
            '<button class="ct-btn" data-write data-variant="primary" data-click="_ctAiServerSave">' + esc(t("settings.ai_server.save")) + '</button>' +
            (_AI_TESTABLE.indexOf(p) >= 0 ? '<button class="ct-btn" data-click="_ctAiServerTest">' + esc(t("settings.ai_server.test")) + '</button>' : '') +
            '</div>';
    }
    async function _aiServerLoad() {
        try {
            var keys = await fetch("api/ai/keys", { credentials: "same-origin" });
            var conf = await fetch("api/ai/config", { credentials: "same-origin" });
            if (!keys.ok || !conf.ok)
                throw new Error(String(keys.status));
            _aiServer.keys = await keys.json();
            _aiServer.providers = (await conf.json()).providers || {};
            _aiServer.provider = _aiServer.keys.provider || window._aiRuntime.provider || "anthropic";
            _aiServerRender();
        }
        catch (e) {
            var holder = document.getElementById("ct-ai-server");
            if (holder)
                holder.innerHTML = '<p class="ct-muted fs-sm">' + esc(t("settings.ai_server.load_error")) + '</p>';
        }
    }
    function _aiVal(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }
    window._ctAiServerProvider = function (value) {
        _aiServer.provider = value;
        _aiServerRender();
    };
    window._ctAiServerSave = async function () {
        var p = _aiServer.provider;
        var body = { provider: p, model: _aiVal("ct-ai-model") };
        // A secret left blank keeps the stored one: only typed values go —
        // unless "remove" is ticked, which clears this provider's secrets.
        var clear = !!document.getElementById("ct-ai-clear")?.checked;
        if (clear) {
            if (p === "bedrock") {
                body.bedrock = "";
                body.ai_secret_bedrock = "";
            }
            else if (p === "custom") {
                body.ai_custom_key = "";
            }
            else {
                body[p] = "";
            }
        }
        var key = clear ? "" : _aiVal("ct-ai-key");
        if (p === "bedrock") {
            if (key)
                body.bedrock = key;
            var secret = clear ? "" : _aiVal("ct-ai-secret");
            if (secret)
                body.ai_secret_bedrock = secret;
            body.ai_region_bedrock = _aiVal("ct-ai-region");
        }
        else if (p === "custom") {
            body.ai_custom_endpoint = _aiVal("ct-ai-endpoint");
            body.ai_custom_model = body.model;
            body.ai_custom_label = _aiVal("ct-ai-label");
            if (key)
                body.ai_custom_key = key;
        }
        else if (key) {
            body[p] = key;
        }
        try {
            var r = await fetch("api/ai/keys", {
                method: "PUT", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (r.ok) {
                showStatus(t("settings.ai_server.saved"));
                await window._aiFetchRuntime();
                _aiServerLoad();
            }
            else {
                var detail = "";
                try {
                    detail = (await r.json()).detail || "";
                }
                catch (e) { /* not JSON */ }
                showStatus(detail || t("settings.ai_server.save_error"), true);
            }
        }
        catch (e) {
            showStatus(t("settings.ai_server.save_error"), true);
        }
    };
    window._ctAiServerTest = async function () {
        try {
            var r = await fetch("api/ai/validate-key?provider=" + encodeURIComponent(_aiServer.provider), {
                method: "POST", credentials: "same-origin"
            });
            var j = r.ok ? await r.json() : { valid: false };
            if (j.valid)
                showStatus(t("settings.ai_server.test_ok"));
            else
                showStatus(t("settings.ai_server.test_failed") + (j.error ? " — " + j.error : ""), true);
        }
        catch (e) {
            showStatus(t("settings.ai_server.test_failed"), true);
        }
    };
    // ═══════════════════════════════════════════════════════════════════
    // I18N — backend-only keys
    // ═══════════════════════════════════════════════════════════════════
    if (typeof _registerTranslations === "function") {
        _registerTranslations("fr", {
            "settings.ai_managed_note": "Le fournisseur, le modèle et la clé API sont configurés de manière centralisée par votre administrateur.",
            "settings.ai_no_access": "L'accès à l'assistant IA n'a pas été accordé à votre compte. Contactez votre administrateur.",
            "settings.ai_keys_purged": "Clés API IA effacées de ce navigateur : elles sont gérées par le serveur.",
            "settings.ai_server.title": "Fournisseur IA du module",
            "settings.ai_server.loading": "Chargement…",
            "settings.ai_server.load_error": "Impossible de charger les réglages IA du module.",
            "settings.ai_server.help": "Le serveur du module appelle le fournisseur : la clé n'est jamais envoyée au navigateur, et tous les fournisseurs sont possibles. Les utilisateurs autorisés (Utilisateurs → Assistant IA autorisé) s'en servent. Les variables d'environnement *_API_KEY restent la valeur par défaut. Une clé laissée vide est conservée.",
            "settings.ai_server.note": "Le fournisseur, le modèle et la clé sont réglés par l'administrateur du module.",
            "settings.ai_server.note_admin": "Le fournisseur, le modèle et la clé se règlent ci-dessous, sur le serveur du module.",
            "settings.ai_server.provider": "Fournisseur",
            "settings.ai_server.model": "Modèle",
            "settings.ai_server.api_key": "Clé API",
            "settings.ai_server.access_key": "Clé d'accès AWS",
            "settings.ai_server.secret_key": "Clé secrète AWS",
            "settings.ai_server.region": "Région AWS",
            "settings.ai_server.endpoint": "Adresse (https) du LLM",
            "settings.ai_server.label": "Nom affiché",
            "settings.ai_server.custom": "LLM personnalisé",
            "settings.ai_server.secret_set": "Déjà définie — laisser vide pour la conserver",
            "settings.ai_server.save": "Enregistrer",
            "settings.ai_server.clear": "Retirer les clés enregistrées pour ce fournisseur",
            "settings.ai_server.test": "Tester la clé",
            "settings.ai_server.saved": "Réglages IA du module enregistrés",
            "settings.ai_server.save_error": "Échec de l'enregistrement des réglages IA",
            "settings.ai_server.test_ok": "Clé valide",
            "settings.ai_server.test_failed": "La clé n'a pas été acceptée"
        });
        _registerTranslations("en", {
            "settings.ai_managed_note": "Provider, model and API key are managed centrally by your administrator.",
            "settings.ai_no_access": "AI access has not been granted to your account. Contact your administrator.",
            "settings.ai_keys_purged": "AI API keys cleared from this browser — they are managed by the server.",
            "settings.ai_server.title": "Module AI provider",
            "settings.ai_server.loading": "Loading…",
            "settings.ai_server.load_error": "Could not load the module's AI settings.",
            "settings.ai_server.help": "The module's server calls the provider: the key never reaches the browser, and every provider works. Users allowed to (Users → AI assistant allowed) use it. The *_API_KEY environment variables remain the default. A key left blank is kept.",
            "settings.ai_server.note": "Provider, model and key are set by the module's administrator.",
            "settings.ai_server.note_admin": "Provider, model and key are set below, on the module's server.",
            "settings.ai_server.provider": "Provider",
            "settings.ai_server.model": "Model",
            "settings.ai_server.api_key": "API key",
            "settings.ai_server.access_key": "AWS access key",
            "settings.ai_server.secret_key": "AWS secret key",
            "settings.ai_server.region": "AWS region",
            "settings.ai_server.endpoint": "LLM address (https)",
            "settings.ai_server.label": "Display name",
            "settings.ai_server.custom": "Custom LLM",
            "settings.ai_server.secret_set": "Already set — leave blank to keep it",
            "settings.ai_server.save": "Save",
            "settings.ai_server.clear": "Remove the keys saved for this provider",
            "settings.ai_server.test": "Test the key",
            "settings.ai_server.saved": "Module AI settings saved",
            "settings.ai_server.save_error": "Could not save the AI settings",
            "settings.ai_server.test_ok": "Key accepted",
            "settings.ai_server.test_failed": "The key was not accepted"
        });
    }
})();
