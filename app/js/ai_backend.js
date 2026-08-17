// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/backend/ai_backend.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — AI Backend Overrides
 *
 * Pilot-managed AI mode: runtime probe, proxy calls, managed settings UI.
 * Load AFTER ai_common.js. Used by backend apps only (never in opensource).
 *
 * Source canonique du portage TS : demo-docker/risk/app/js/ai_backend.js
 * (identique ×9 modules ; le master shared/js était une refonte non
 * déployée — voir STATUS.md).
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
    // NOTHING here fires when the probe says managed:false — a standalone
    // backend deployment keeps its server-side key flow, and the opensource /
    // pure-frontend builds never load this file at all, so their localStorage
    // key store (the only one they have) is untouched.
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
            '</div>' +
            '<div class="settings-section">' +
            '<div class="settings-label">' + t("settings.ai_section") + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-ai-toggle"' + (aiEnabled && canUse ? " checked" : "") + (canUse ? "" : " disabled") + '><span class="settings-toggle-slider"></span></label>' +
            '<span class="fs-sm">' + t("settings.ai_enable") + '</span>' +
            '</div>' +
            (canUse
                ? '<p class="fs-xs text-muted" style="margin:4px 0 0">' + esc(t("settings.ai_managed_note") || "Provider, model and API key are managed centrally by your administrator.") + '</p>'
                : '<p class="fs-xs" style="margin:4px 0 0;color:var(--ct-critical)">' + esc(t("settings.ai_no_access") || "AI access has not been granted to your account. Contact your administrator.") + '</p>') +
            '</div>';
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
            var toggle = document.getElementById("settings-ai-toggle").checked;
            if (toggle && !canUse)
                return;
            if (toggle && !aiEnabled) {
                if (!confirm(t("settings.ai_privacy_warning")))
                    return;
            }
            localStorage.setItem(pfx + "enabled", toggle ? "true" : "false");
            window._aiClosePanel();
            if (cfg.onSettingsSaved)
                cfg.onSettingsSaved();
            else if (typeof renderAll === "function")
                renderAll();
            showStatus(t("settings.saved"));
        };
        if (cfg.onSettingsRendered)
            cfg.onSettingsRendered();
    };
    // ═══════════════════════════════════════════════════════════════════
    // I18N — backend-only keys
    // ═══════════════════════════════════════════════════════════════════
    if (typeof _registerTranslations === "function") {
        _registerTranslations("fr", {
            "settings.ai_managed_note": "Le fournisseur, le modèle et la clé API sont configurés de manière centralisée par votre administrateur.",
            "settings.ai_no_access": "L'accès à l'assistant IA n'a pas été accordé à votre compte. Contactez votre administrateur.",
            "settings.ai_keys_purged": "Clés API IA effacées de ce navigateur : elles sont gérées par le serveur."
        });
        _registerTranslations("en", {
            "settings.ai_managed_note": "Provider, model and API key are managed centrally by your administrator.",
            "settings.ai_no_access": "AI access has not been granted to your account. Contact your administrator.",
            "settings.ai_keys_purged": "AI API keys cleared from this browser — they are managed by the server."
        });
    }
})();
