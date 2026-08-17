// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/ct_modules.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
var CT_EDITION = ((window.CT_CONFIG || {}).edition) || "opensource";
// Reference catalogue — the ten modules + no scan (scan is a job kind, not a
// module). Marks keep their own colour (SPEC §5); paths are relative to app/.
var _CT_MODULE_CATALOG = [
    { id: "risk", name: "Risk", url: "/risk/", mark: "img/modules/risk.svg" },
    { id: "compliance", name: "Compliance", url: "/compliance/", mark: "img/modules/compliance.svg" },
    { id: "audit", name: "Audit", url: "/audit/", mark: "img/modules/audit.svg" },
    { id: "vendor", name: "Vendor", url: "/vendor/", mark: "img/modules/vendor.svg" },
    { id: "asset", name: "Asset", url: "/asset/", mark: "img/modules/asset.svg" },
    { id: "access", name: "Access", url: "/access/", mark: "img/modules/access.svg" },
    { id: "surface", name: "Surface", url: "/surface/", mark: "img/modules/surface.svg" },
    { id: "appsec", name: "AppSec", url: "/appsec/", mark: "img/modules/appsec.svg" },
    { id: "watch", name: "Watch", url: "/watch/", mark: "img/modules/watch.svg" },
    { id: "pilot", name: "Pilot", url: "/", mark: "img/modules/pilot.svg" },
];
function _ctCurrentModuleId() {
    return ((window.CT_CONFIG || {}).module) || "";
}
function ct_currentModule() {
    var id = _ctCurrentModuleId();
    for (var i = 0; i < _CT_MODULE_CATALOG.length; i++) {
        if (_CT_MODULE_CATALOG[i].id === id)
            return _CT_MODULE_CATALOG[i];
    }
    // Unknown / not in catalogue: synthesize a minimal entry so the appbar
    // still shows a name (standalone/opensource never browse a list anyway).
    return id ? { id: id, name: id.charAt(0).toUpperCase() + id.slice(1), url: "", mark: "img/modules/" + id + ".svg" } : null;
}
function ct_modules() {
    if (CT_EDITION === "opensource")
        return [];
    if (CT_EDITION === "standalone") {
        var c = ct_currentModule();
        return c ? [c] : [];
    }
    // suite — Pilot injects the full deployed list (with alert counts) via
    // CT_CONFIG.modules; when absent, filter the catalogue to the deployed ids
    // (CT_CONFIG.deployed). Falls back to the whole catalogue only if neither
    // is provided (dev convenience).
    var cfg = (window.CT_CONFIG || {});
    if (cfg.modules && cfg.modules.length)
        return cfg.modules;
    if (cfg.deployed && cfg.deployed.length) {
        var set = cfg.deployed;
        return _CT_MODULE_CATALOG.filter(function (m) { return set.indexOf(m.id) >= 0; });
    }
    return _CT_MODULE_CATALOG;
}
// ---- FEAT-31: menu derived from the Pilot registry -------------------------
// In the suite the deployed list lives in Pilot's ModuleRegistry. Each module
// proxies it same-origin at GET api/modules-menu (Pilot itself serves
// api/modules/menu). The menu popup is rebuilt at every open, so filling
// CT_CONFIG.modules asynchronously needs no re-render. localStorage caches the
// last payload to cover the first-open-before-fetch window; on any failure the
// static CT_CONFIG.deployed fallback in ct_modules() applies unchanged.
function _ctMenuFromRegistry(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e || !e.id)
            continue;
        var cat = null;
        for (var j = 0; j < _CT_MODULE_CATALOG.length; j++) {
            if (_CT_MODULE_CATALOG[j].id === e.id) {
                cat = _CT_MODULE_CATALOG[j];
                break;
            }
        }
        // Catalogue wins for the short product name and the mark; the
        // registry wins for the URL (env-configurable per deployment).
        out.push({
            id: e.id,
            name: cat ? cat.name : (e.name || e.id),
            url: e.url || (cat ? cat.url : "#"),
            mark: cat ? cat.mark : "img/modules/" + e.id + ".svg",
        });
    }
    return out;
}
function ct_fetchModulesMenu() {
    if (CT_EDITION !== "suite")
        return;
    var cfg0 = window.CT_CONFIG;
    if (!cfg0 || typeof fetch !== "function")
        return;
    var cfg = cfg0;
    try {
        var cached = localStorage.getItem("ct_modules_menu");
        if (cached && !cfg.modules)
            cfg.modules = _ctMenuFromRegistry(JSON.parse(cached));
    }
    catch (e) { /* corrupt cache — static fallback applies */ }
    var url = _ctCurrentModuleId() === "pilot" ? "api/modules/menu" : "api/modules-menu";
    fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (list) {
        if (!list || !list.length)
            return;
        cfg.modules = _ctMenuFromRegistry(list);
        try {
            localStorage.setItem("ct_modules_menu", JSON.stringify(list));
        }
        catch (e) { /* quota */ }
    }).catch(function () { });
}
window.ct_fetchModulesMenu = ct_fetchModulesMenu;
// CT_EDITION is frozen at script-load; but window.CT_CONFIG is set later by the
// app bundle. Re-sync it once the app config is available (called from boot).
function _ctSyncEdition() {
    CT_EDITION = ((window.CT_CONFIG || {}).edition) || "opensource";
    window.CT_EDITION = CT_EDITION;
}
window._ctSyncEdition = _ctSyncEdition;
window.CT_EDITION = CT_EDITION;
window.ct_modules = ct_modules;
window.ct_currentModule = ct_currentModule;
