// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/ct-core.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct-core.d.ts — types transverses CISO Toolbox, copiés dans chaque app
 * (app/ts/types/). Complète les déclarations PAR FICHIER générées dans
 * shared/types/gen/*.d.ts (une par lib shared, copiées selon les
 * <script src> de l'index.html de l'app).
 *
 * NE déclare PAS les globals fournis par l'app elle-même : chaque app
 * déclare/définit son propre `D` (typé), `REFERENTIELS_META`,
 * `_ASSET_BASE`, `ensureKeys()`, `renderAll()`, `renderHistory()`,
 * `selectPanel()`, `toggleMenu()`…
 *
 * Généré/maintenu à la main — voir frontend-ts/docs/PLAN.md.
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

/** Dictionnaire i18n plat clé → traduction. */
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

/* ── File System Access API (non incluse dans lib.dom) ─────────── */

interface FilePickerAcceptType { description?: string; accept?: Record<string, string[]>; }
interface OpenFilePickerOptions { types?: FilePickerAcceptType[]; multiple?: boolean; }
interface SaveFilePickerOptions { suggestedName?: string; types?: FilePickerAcceptType[]; }

/* ── Propriétés Window transverses ─────────────────────────────── */

interface Window {
    SCHEMA_REV?: number;
    SCHEMA_MIGRATIONS?: Record<number, (d: Record<string, any>) => void>;
    ctSchemaMigrate?: (d: Record<string, any>) => void;
    ctSchemaStamp?: (d: Record<string, any>) => void;
    CT_CONFIG?: CtConfig;
    AI_APP_CONFIG?: AiAppConfig;
    /** Délégué de création en mode backend-catalogue (risk). */
    catalogCreate?: () => void;
    _aiRuntime?: CtAiRuntime;
    showOpenFilePicker?: (opts?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (opts?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}

// FEAT-36 — schema versioning runner (ct_schema.js)
declare function ctSchemaMigrate(d: Record<string, any>): void;
declare function ctSchemaStamp(d: Record<string, any>): void;
