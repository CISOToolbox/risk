// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/ct_schema.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
// ct_schema — versioned exports + migration-on-load (FEAT-36).
//
// Every blob app declares its current schema revision (and, when a data
// reshape happened, the migration that upgrades one rev to the next):
//
//     window.SCHEMA_REV = 2;
//     window.SCHEMA_MIGRATIONS = { 1: fnRev1toRev2 };   // reshapes only
//
// The runner is called on EVERY entry point that replaces D (file open,
// snapshot restore — after decryption —, session restore, Pilot-backup
// import) and:
//   1. refuses a file whose rev is NEWER than the app (hard refusal, the
//      message names both revs — never a silent downgrade);
//   2. normalizes: every top-level key of the app's init template that is
//      missing from the file is filled in (this is what keeps pre-FEAT-36
//      exports — rev 0 — loadable forever);
//   3. replays the declared migrations from the file's rev to SCHEMA_REV;
//   4. stamps `meta.schema_rev` = SCHEMA_REV.
//
// Saves stamp too (ctSchemaStamp before every serialize), so any file
// produced from now on carries its revision.
//
// Backend twin: shared/python/schema_migrations.py — SAME revs, SAME
// migration chains. Bumping SCHEMA_REV in one side without the other (or
// without an archived fixture in tests/fixtures/exports/) fails the
// fixture test.
class CtSchemaFutureRevError extends Error {
    constructor(fileRev, appRev) {
        super(t("schema.file_newer", { file_rev: String(fileRev), app_rev: String(appRev) }));
        this.name = "CtSchemaFutureRevError";
        this.fileRev = fileRev;
        this.appRev = appRev;
    }
}
function _ctSchemaAppRev() {
    var r = window.SCHEMA_REV;
    return typeof r === "number" && r >= 1 ? r : 1;
}
function _ctSchemaNormalize(data) {
    // Fill every missing top-level key (and missing meta subkey) from the
    // app's init template — additive only, never overwrites user data.
    var initVar = (typeof _ct === "function" && _ct().initDataVar) || "CT_INIT_DATA";
    var tpl = window[initVar];
    if (!tpl || typeof tpl !== "object")
        return;
    Object.keys(tpl).forEach(function (k) {
        if (data[k] === undefined || data[k] === null) {
            data[k] = JSON.parse(JSON.stringify(tpl[k]));
        }
    });
    if (tpl.meta && typeof tpl.meta === "object" && data.meta && typeof data.meta === "object") {
        Object.keys(tpl.meta).forEach(function (k) {
            if (data.meta[k] === undefined)
                data.meta[k] = JSON.parse(JSON.stringify(tpl.meta[k]));
        });
    }
}
function ctSchemaMigrate(data) {
    var appRev = _ctSchemaAppRev();
    var fileRev = (data.meta && typeof data.meta.schema_rev === "number") ? data.meta.schema_rev : 0;
    if (fileRev > appRev)
        throw new CtSchemaFutureRevError(fileRev, appRev);
    _ctSchemaNormalize(data);
    var migrations = (window.SCHEMA_MIGRATIONS
        || {});
    var guard = 0;
    for (var rev = Math.max(fileRev, 1); rev < appRev; rev++) {
        var fn = migrations[rev];
        if (typeof fn === "function")
            fn(data);
        if (++guard > 50)
            throw new Error("schema migration chain too long");
    }
    if (!data.meta || typeof data.meta !== "object")
        data.meta = {};
    data.meta.schema_rev = appRev;
}
function ctSchemaStamp(data) {
    if (!data.meta || typeof data.meta !== "object")
        data.meta = {};
    data.meta.schema_rev = _ctSchemaAppRev();
}
if (typeof window !== "undefined") {
    var _w = window;
    _w.ctSchemaMigrate = ctSchemaMigrate;
    _w.ctSchemaStamp = ctSchemaStamp;
    _w.CtSchemaFutureRevError = CtSchemaFutureRevError;
}
