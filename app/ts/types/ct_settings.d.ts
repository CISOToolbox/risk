// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
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
/** A settings section saved by the panel's single Save button. */
interface CtSettingsSection {
    id: string;
    /** Element id of the section's content: an edit inside it marks the section modified. */
    holder: string;
    /** Saves the section; resolves to null when saved, or the error to show in it. */
    save: () => Promise<string | null>;
}
interface Window {
    openSettings?: () => void;
    _ctSettingsBegin?: () => void;
    _ctSettingsRegister?: (section: CtSettingsSection) => void;
    _ctSettingsAccordion?: (body: HTMLElement) => void;
    _ctSettingsSaveAll?: (legacy?: () => Promise<boolean> | boolean) => Promise<boolean>;
    _ctSettingsMark?: (id: string, dirty?: boolean) => void;
    _ctSettingsEnd?: () => void;
    _ctSettingsDirty?: () => boolean;
    _ctSettingsClose?: () => void;
    _ctSettingsGuard?: (then: () => void) => void;
    /** Provider allowlist — set by ai_backend.js (backend deployments). */
    _AI_PROVIDER_ALLOWLIST?: string[];
    /** Flushes provider/model/creds server-side — set by ai_backend.js. */
    _aiPersistConfig?: () => void;
}
