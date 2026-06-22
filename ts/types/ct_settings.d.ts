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
interface Window {
    openSettings?: () => void;
    /** Allowlist de fournisseurs — posée par ai_backend.js (déploiements backend). */
    _AI_PROVIDER_ALLOWLIST?: string[];
    /** Flush provider/model/creds côté serveur — posé par ai_backend.js. */
    _aiPersistConfig?: () => void;
}
