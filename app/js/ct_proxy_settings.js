// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — outbound proxy section of the settings drawer (FEAT-58).
 *
 * For the backend modules. In standalone the module sets its own outbound
 * proxy through /api/proxy/config; in the suite the proxy is Pilot's and the
 * section shows it read-only. The password of a proxy URL never reaches the
 * browser: the server masks it, and the masked URL saved back unchanged keeps
 * it.
 *
 * Load after ct_settings.js:
 *   <script src="js/ct_settings.js"></script>
 *   <script src="js/ai_backend.js"></script>
 *   <script src="js/ct_proxy_settings.js"></script>
 *
 * A module opts in from its AI_APP_CONFIG:
 *   settingsExtraHTML:  … + _ctProxySettingsHTML()
 *   onSettingsRendered: … _ctProxySettingsLoad()
 * A module that lays its sections out itself puts _ctProxySettingsBody()
 * under its own title (t("settings.proxy.title")).
 */
(function () {
    "use strict";
    var HOLDER = "ct-proxy-settings";
    function _val(id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
    }
    async function _detail(r, fallbackKey) {
        try {
            var body = await r.json();
            if (body && typeof body.detail === "string")
                return body.detail;
        }
        catch (e) { /* not a JSON error body */ }
        return t(fallbackKey);
    }
    function _field(id, labelKey, value, placeholder, envValue) {
        return '<div class="ct-field ct-col-span-2">' +
            '<label class="ct-label" for="' + id + '">' + esc(t(labelKey)) + '</label>' +
            '<input type="text" class="ct-input" id="' + id + '" autocomplete="off" spellcheck="false"' +
            ' placeholder="' + esc(envValue || placeholder) + '" value="' + esc(value) + '">' +
            (envValue ? '<p class="ct-muted fs-xs">' + esc(t("settings.proxy.env", { value: envValue })) + '</p>' : '') +
            '</div>';
    }
    function _render(cfg) {
        if (cfg.managed) {
            var hosts = [cfg.https_proxy, cfg.http_proxy].filter(Boolean);
            return '<p class="ct-muted fs-sm">' + esc(t("settings.proxy.managed")) + '</p>' +
                '<p class="fs-sm">' + esc(hosts.length ? hosts.join(" · ") : t("settings.proxy.none")) + '</p>';
        }
        var env = cfg.env || { http_proxy: "", https_proxy: "", no_proxy: "" };
        return '<p class="ct-muted fs-xs">' + esc(t("settings.proxy.help")) + '</p>' +
            '<div class="ct-form-grid">' +
            _field("ct-proxy-https", "settings.proxy.https", cfg.https_proxy, "http://proxy.example.com:3128", env.https_proxy) +
            _field("ct-proxy-http", "settings.proxy.http", cfg.http_proxy, "http://proxy.example.com:3128", env.http_proxy) +
            _field("ct-proxy-no", "settings.proxy.no_proxy", cfg.no_proxy, "intranet.example.com, 10.0.0.12", env.no_proxy) +
            '</div>' +
            '<div class="ct-actions mt-8">' +
            '<button class="ct-btn" data-write data-variant="primary" data-click="_ctProxySave">' + esc(t("settings.proxy.save")) + '</button>' +
            '</div>';
    }
    window._ctProxySettingsBody = function () {
        return '<div id="' + HOLDER + '"><p class="ct-muted fs-sm">' + esc(t("settings.proxy.loading")) + '</p></div>';
    };
    window._ctProxySettingsHTML = function () {
        return '<div class="settings-section">' +
            '<div class="settings-label">' + esc(t("settings.proxy.title")) + '</div>' +
            window._ctProxySettingsBody() +
            '</div>';
    };
    window._ctProxySettingsLoad = async function () {
        var holder = document.getElementById(HOLDER);
        if (!holder)
            return;
        try {
            var r = await fetch("api/proxy/config", { credentials: "same-origin" });
            if (!r.ok)
                throw new Error(String(r.status));
            holder.innerHTML = _render(await r.json());
        }
        catch (e) {
            holder.innerHTML = '<p class="ct-muted fs-sm">' + esc(t("settings.proxy.load_error")) + '</p>';
        }
    };
    window._ctProxySave = async function () {
        var body = {
            http_proxy: _val("ct-proxy-http").trim(),
            https_proxy: _val("ct-proxy-https").trim(),
            no_proxy: _val("ct-proxy-no").trim()
        };
        try {
            var r = await fetch("api/proxy/config", {
                method: "PUT", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (r.ok) {
                showStatus(t("settings.proxy.saved"));
                window._ctProxySettingsLoad();
            }
            else if (r.status === 403) {
                showStatus(t("settings.proxy.admin_only"), true);
            }
            else {
                showStatus(await _detail(r, "settings.proxy.save_error"), true);
            }
        }
        catch (e) {
            showStatus(t("settings.proxy.save_error"), true);
        }
    };
    _registerTranslations("fr", {
        "settings.proxy.title": "Proxy sortant",
        "settings.proxy.loading": "Chargement…",
        "settings.proxy.load_error": "Impossible de charger les réglages du proxy.",
        "settings.proxy.managed": "En mode suite, le proxy se règle dans Pilot (Paramètres).",
        "settings.proxy.none": "Aucun proxy",
        "settings.proxy.help": "Proxy par lequel ce module joint l'extérieur (fournisseurs d'IA, flux, scans). Une valeur enregistrée ici remplace la variable d'environnement correspondante (HTTPS_PROXY, HTTP_PROXY) ; un champ vide la laisse s'appliquer. Les exceptions s'ajoutent à NO_PROXY : noms de domaine (sous-domaines compris) ou adresses IP, séparés par des virgules. Un mot de passe dans l'URL reste masqué : laissez ******** pour le conserver.",
        "settings.proxy.env": "Environnement du déploiement : {value}",
        "settings.proxy.https": "Proxy HTTPS",
        "settings.proxy.http": "Proxy HTTP",
        "settings.proxy.no_proxy": "Exceptions (sans proxy)",
        "settings.proxy.save": "Enregistrer",
        "settings.proxy.saved": "Réglages du proxy enregistrés",
        "settings.proxy.save_error": "Échec de l'enregistrement des réglages du proxy",
        "settings.proxy.admin_only": "Réservé aux administrateurs du module"
    });
    _registerTranslations("en", {
        "settings.proxy.title": "Outbound proxy",
        "settings.proxy.loading": "Loading…",
        "settings.proxy.load_error": "Could not load the proxy settings.",
        "settings.proxy.managed": "In the suite, the proxy is set in Pilot (Settings).",
        "settings.proxy.none": "No proxy",
        "settings.proxy.help": "Proxy this module goes through to reach the outside (AI providers, feeds, scans). A value saved here replaces the matching environment variable (HTTPS_PROXY, HTTP_PROXY); an empty field lets it apply. Exceptions add to NO_PROXY: domain names (subdomains included) or IP addresses, comma-separated. A password in the URL stays masked: leave ******** to keep it.",
        "settings.proxy.env": "Deployment environment: {value}",
        "settings.proxy.https": "HTTPS proxy",
        "settings.proxy.http": "HTTP proxy",
        "settings.proxy.no_proxy": "Exceptions (no proxy)",
        "settings.proxy.save": "Save",
        "settings.proxy.saved": "Proxy settings saved",
        "settings.proxy.save_error": "Could not save the proxy settings",
        "settings.proxy.admin_only": "Reserved to the module's administrators"
    });
})();
