// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/ct_modules.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct_modules — edition awareness + module catalogue (SPEC §0 / §5).
 *
 * This is ONE of the only three places edition branching is allowed to live
 * (with ct_renderAppbar and ct_crossRefs). Everything else reads `CT_EDITION`
 * and `ct_modules()` and never tests the edition itself.
 *
 *   CT_EDITION      "opensource" | "standalone" | "suite"
 *   ct_modules()    []            (opensource — no list to browse)
 *                   [current]     (standalone — marque + name only)
 *                   deployed list (suite — from Pilot, window.CT_CONFIG.modules)
 *
 * The edition and current-module id come from the app's window.CT_CONFIG
 * (browser-only apps default to opensource). Module NAMES are product names
 * and are never translated (SPEC §11).
 */
type CtEdition = "opensource" | "standalone" | "suite";
interface CtModuleEntry {
    id: string;
    name: string;
    url: string;
    mark: string;
    alerts?: number;
}
declare var CT_EDITION: CtEdition;
declare var _CT_MODULE_CATALOG: CtModuleEntry[];
declare function _ctCurrentModuleId(): string;
declare function ct_currentModule(): CtModuleEntry | null;
declare function ct_modules(): CtModuleEntry[];
declare function _ctMenuFromRegistry(list: Array<{
    id: string;
    name: string;
    url: string;
}>): CtModuleEntry[];
declare function ct_fetchModulesMenu(): void;
declare function _ctSyncEdition(): void;
