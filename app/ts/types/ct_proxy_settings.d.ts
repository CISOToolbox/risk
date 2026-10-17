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
interface CtProxyConfig {
    http_proxy: string;
    https_proxy: string;
    no_proxy: string;
    env: {
        http_proxy: string;
        https_proxy: string;
        no_proxy: string;
    };
    managed: boolean;
}
interface Window {
    _ctProxySettingsHTML?: () => string;
    _ctProxySettingsBody?: () => string;
    _ctProxySettingsLoad?: () => void;
    _ctProxySave?: () => void;
}
