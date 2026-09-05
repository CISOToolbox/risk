// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/ct-core.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct-core.d.ts — CISO Toolbox cross-cutting types, copied into every app
 * (app/ts/types/). Complements the PER-FILE declarations generated in
 * shared/types/gen/*.d.ts (one per shared lib, copied according to the
 * <script src> tags of the app's index.html).
 *
 * Does NOT declare the globals provided by the app itself: each app
 * declares/defines its own `D` (typed), `REFERENTIELS_META`,
 * `_ASSET_BASE`, `ensureKeys()`, `renderAll()`, `renderHistory()`,
 * `selectPanel()`, `toggleMenu()`…
 *
 * Generated/maintained by hand — see frontend-ts/docs/PLAN.md.
 */

/* ── Config app → libs shared ──────────────────────────────────── */

interface CtConfig {
    autosaveKey?: string;
    initDataVar?: string;
    refNamespace?: string;
    descNamespace?: string;
    label?: string;
    labelKey?: string;
    filePrefix?: string;
    getSociete?: (d: any) => string | undefined;
    getDate?: (d: any) => string | undefined;
    getScope?: (d: any) => string | undefined;
    edition?: "opensource" | "standalone" | "suite";
    module?: string;
    modules?: Array<{ id: string; name: string; url: string; mark: string; alerts?: number }>;
    deployed?: string[];
}

interface AiAppConfig {
    storagePrefix?: string;
    hideAI?: boolean;
    settingsExtraHTML?: () => string;
    onSettingsSaved?: () => void;
    onSettingsRendered?: () => void;
}

/** Flat i18n dictionary, key → translation. */
type CtI18nDict = Record<string, string>;

interface CtColor { bg: string; txt: string; vivid: string; }

interface CtAiRuntime {
    managed: boolean;
    can_use: boolean;
    provider: string;
    model: string;
    loaded: boolean;
    anthropic_configured?: boolean;
    openai_configured?: boolean;
}

/* ── File System Access API (not included in lib.dom) ──────────── */

interface FilePickerAcceptType { description?: string; accept?: Record<string, string[]>; }
interface OpenFilePickerOptions { types?: FilePickerAcceptType[]; multiple?: boolean; }
interface SaveFilePickerOptions { suggestedName?: string; types?: FilePickerAcceptType[]; }

/* ── Cross-cutting Window properties ───────────────────────────── */

interface Window {
    SCHEMA_REV?: number;
    SCHEMA_MIGRATIONS?: Record<number, (d: Record<string, any>) => void>;
    ctSchemaMigrate?: (d: Record<string, any>) => void;
    ctSchemaStamp?: (d: Record<string, any>) => void;
    CT_CONFIG?: CtConfig;
    AI_APP_CONFIG?: AiAppConfig;
    /** Creation delegate in backend-catalog mode (risk). */
    catalogCreate?: () => void;
    _aiRuntime?: CtAiRuntime;
    showOpenFilePicker?: (opts?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (opts?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}

// FEAT-36 — schema versioning runner (ct_schema.js)
declare function ctSchemaMigrate(d: Record<string, any>): void;
declare function ctSchemaStamp(d: Record<string, any>): void;
