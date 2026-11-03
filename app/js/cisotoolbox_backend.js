// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Backend persistence layer
 *
 * No-op stubs for localStorage autosave (data is in PostgreSQL).
 * File I/O (open/save/import/export) still works for JSON import/export.
 * Snapshots disabled (use database backups instead).
 * Load AFTER cisotoolbox.js. Used by backend apps only.
 *
 * FACTORED SOURCE — replaces the historical variants with a
 * single file parameterised by a runtime flag, read at action time (never
 * at load time):
 *
 *   window._CT_IMPORT_NO_UNWRAP = true
 *       → disables detection/unwrapping of the Pilot backup format
 *         {"module":...,"data":[{"id":...,"data":{...}}]} on import.
 *         To be set by the PILOT module's front end (it must not unwrap
 *         its own backups). Default: unwrap enabled (8/9 modules).
 *
 * The newAnalysis → window.catalogCreate delegation stays guarded by a
 * runtime typeof: modules with no catalog (pilot, appsec, watch) do not
 * define catalogCreate, behaviour unchanged.
 */
// Legacy flag set by the appsec/watch variants; no known reader in the
// code (kept for possible client forks).
window._CT_HAS_BACKEND = true;
// ═══════════════════════════════════════════════════════════════════════
// AUTO-SAVE — No-ops (data persisted in PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════
function _autoSave() { }
function _loadAutoSave() { return false; }
function _checkAutoSaveBanner() { }
function _restoreSession() { }
function _discardSession() { }
// ═══════════════════════════════════════════════════════════════════════
// FICHIERS JSON (save / load / new) — for import/export
// ═══════════════════════════════════════════════════════════════════════
var _fileHandle = null;
function newAnalysis() {
    // In backend mode with catalog, delegate to catalogCreate which creates a new DB entry
    if (typeof window.catalogCreate === "function") {
        window.catalogCreate();
        return;
    }
    var lbl = t(_ct().labelKey || "analysis");
    if (!confirm(t("confirm_new", { label: lbl })))
        return;
    _fileHandle = null;
    var initVar = _ct().initDataVar || "CT_INIT_DATA";
    var fresh = JSON.parse(JSON.stringify(window[initVar] || {}));
    Object.keys(D).forEach(function (k) { delete D[k]; });
    Object.assign(D, fresh);
    _initDataAndRender(function () {
        _autoSave();
        showStatus(t("status_new", { label: lbl }));
    });
}
// Password of the current file (in memory only)
var _filePwd = null;
// Load a buffer (encrypted or not) and return the JSON object
async function _loadBuffer(buffer, filename) {
    var bytes = new Uint8Array(buffer);
    var jsonStr;
    if (_isEncrypted(bytes)) {
        var pwd = await _promptPassword(t("pwd_title_encrypted_file"), false);
        if (!pwd)
            return null;
        try {
            jsonStr = await _decryptData(bytes, pwd);
            _filePwd = pwd;
        }
        catch (e) {
            alert(t("alert_wrong_password"));
            return null;
        }
    }
    else {
        jsonStr = new TextDecoder().decode(bytes);
        _filePwd = null;
    }
    if (jsonStr.length > 10000000)
        throw new Error("File too large (>10MB)");
    var parsed = JSON.parse(jsonStr);
    delete parsed.__proto__;
    delete parsed.constructor;
    delete parsed.prototype;
    // Detect Pilot backup format: {"module":"...","data":[{"id":"...","data":{...}}]}
    // (can be disabled with window._CT_IMPORT_NO_UNWRAP — see the header)
    if (!window._CT_IMPORT_NO_UNWRAP && parsed.module && Array.isArray(parsed.data) && parsed.data.length > 0 && parsed.data[0].data) {
        parsed = parsed.data[0].data;
    }
    Object.keys(D).forEach(function (k) { delete D[k]; });
    Object.assign(D, parsed);
    return true;
}
function loadJSON(event) {
    var input = event.target;
    var file = input.files[0];
    if (!file)
        return;
    var reader = new FileReader();
    reader.onload = async function (e) {
        try {
            var ok = await _loadBuffer(e.target.result, file.name);
            if (!ok)
                return;
            _fileHandle = null;
            _initDataAndRender(function () {
                _autoSave();
                showStatus(t("status_file_opened", { name: file.name }));
            });
        }
        catch (err) {
            alert(t("alert_load_error", { msg: err.message }));
        }
    };
    reader.readAsArrayBuffer(file);
    input.value = "";
}
async function openFile() {
    if (window.showOpenFilePicker) {
        try {
            var handles = await window.showOpenFilePicker({
                types: [{ description: "JSON", accept: { "application/json": [".json", ".enc"] } }],
                multiple: false
            });
            var handle = handles[0];
            var file = await handle.getFile();
            var ok = await _loadBuffer(await file.arrayBuffer(), file.name);
            if (!ok)
                return;
            _fileHandle = handle;
            _initDataAndRender(function () {
                _autoSave();
                showStatus(t("status_file_opened", { name: file.name }));
            });
        }
        catch (e) {
            if (e.name !== "AbortError")
                alert(t("alert_open_error", { msg: e.message }));
        }
    }
    else {
        document.getElementById("file-input").click();
    }
}
// Serialize D into file content (encrypted or not)
async function _serializeForSave() {
    var jsonStr = JSON.stringify(D, null, 2);
    if (_filePwd) {
        var encrypted = await _encryptData(jsonStr, _filePwd);
        return new Blob([encrypted], { type: "application/octet-stream" });
    }
    return new Blob([jsonStr], { type: "application/json" });
}
async function quickSaveJSON() {
    if (_fileHandle) {
        try {
            var blob = await _serializeForSave();
            var writable = await _fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            showStatus(t("status_saved") + (_filePwd ? t("status_saved_encrypted") : ""));
            return;
        }
        catch (e) { }
    }
    await saveJSON();
}
async function saveJSON() {
    // Ask whether to encrypt
    var wantEncrypt = await _confirmDialog(t("save_encrypt_prompt"));
    if (wantEncrypt) {
        var pwd = await _promptPassword(t("pwd_title_choose_file"), true);
        if (!pwd)
            return; // user cancelled
        _filePwd = pwd;
    }
    else {
        _filePwd = null;
    }
    var prefix = _ct().filePrefix || "Export";
    var societe = (_ct().getSociete ? _ct().getSociete.call(null, D) : D.meta && D.meta.societe) || prefix;
    var scope = _ct().getScope ? _ct().getScope.call(null, D) : "";
    if (scope)
        societe = societe + "-" + scope;
    societe = societe.replace(/[\/\\:*?"<>|]/g, "_").trim();
    var ext = _filePwd ? ".enc" : ".json";
    var blob = await _serializeForSave();
    if (window.showSaveFilePicker) {
        try {
            var handle = await window.showSaveFilePicker({
                suggestedName: societe + ext,
                types: [{ description: "JSON", accept: { "application/json": [".json", ".enc"] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            _fileHandle = handle;
            showStatus(t("status_saved_name", { name: handle.name }) + (_filePwd ? t("status_saved_encrypted") : ""));
        }
        catch (e) {
            if (e.name !== "AbortError")
                alert(t("alert_save_error", { msg: e.message }));
        }
    }
    else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = societe + ext;
        a.click();
        URL.revokeObjectURL(a.href);
        showStatus(t("status_downloaded") + (_filePwd ? t("status_saved_encrypted") : ""));
    }
}
// Enable/disable file encryption
async function enableFileEncryption() {
    var pwd = await _promptPassword(t("pwd_title_choose_file"), true);
    if (!pwd)
        return;
    _filePwd = pwd;
    showStatus(t("status_encryption_on"));
}
function disableFileEncryption() {
    _filePwd = null;
    showStatus(t("status_encryption_off"));
}
// Ctrl+S
document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (typeof quickSaveJSON === "function")
            quickSaveJSON();
    }
});
// A FastAPI validation error (422) carries a list of {loc, msg}: said as
// "field: message; …" rather than as raw JSON.
function _ctDetailText(detail) {
    if (typeof detail === "string")
        return detail;
    if (Array.isArray(detail)) {
        return detail.map(function (d) {
            if (!d || typeof d !== "object" || !d.msg)
                return typeof d === "string" ? d : JSON.stringify(d);
            var loc = Array.isArray(d.loc) ? d.loc.filter(function (x) { return x !== "body"; }).join(".") : "";
            return (loc ? loc + ": " : "") + String(d.msg);
        }).join("; ");
    }
    return JSON.stringify(detail);
}
function ct_apiError(resp, body) {
    var detail = body || "";
    try {
        var parsed = JSON.parse(body);
        if (parsed && parsed.detail)
            detail = _ctDetailText(parsed.detail);
    }
    catch (e) { }
    // A proxy's own error page (HTML) or an empty body gives no reason to show.
    if (!detail.trim() || detail.trim().charAt(0) === "<")
        detail = t("chrome.no_reason", { status: String(resp.status) });
    var err = new Error("API " + resp.status + ": " + (body || "").substring(0, 200));
    err.status = resp.status;
    err.detail = detail;
    err.stale = resp.status === 409 && !!resp.headers && resp.headers.get("X-CT-Conflict") === "stale";
    return err;
}
// A refusal carries a reason worth showing; a server error or a network
// failure does not.
function _ctRefusal(err) {
    var st = err && err.status;
    return st === 400 || st === 403 || st === 409 || st === 422;
}
/**
 * The whole-project save failed. A version conflict keeps its own message;
 * any other refusal (400 / 409 / 422) says the server's reason, then reloads what
 * the server keeps — every later save would fail the same way. A 403 is only
 * said, in red: reloading would not change it, and a read-only user would
 * get it on every visit. Returns false for any other failure (the caller
 * logs it).
 */
function ct_projectSaveFailed(err) {
    if (err && err.stale) {
        alert(t("chrome.stale_conflict"));
        window.location.reload();
        return true;
    }
    if (!_ctRefusal(err))
        return false;
    var reason = String((err && err.detail) || "");
    if (err.status === 403) {
        showStatus("⚠ " + reason.substring(0, 200), true);
        return true;
    }
    alert(t("chrome.save_refused", { reason: reason }));
    window.location.reload();
    return true;
}
/**
 * A targeted change (PATCH, section PUT, create, delete) failed: a refusal
 * shows the server's reason in red — a 404 too (the record was deleted
 * meanwhile, e.g. from another tab) — and any other failure (server error,
 * network) is said too: the change was not saved.
 */
function ct_changeFailed(err) {
    console.error("Change not saved:", err);
    if (_ctRefusal(err) || (err && err.status === 404))
        showStatus("⚠ " + String((err && err.detail) || "").substring(0, 200), true);
    else
        showStatus(t("chrome.save_failed"), true);
}
// ═══════════════════════════════════════════════════════════════════════
// SNAPSHOTS / HISTORY — removed in the suite/standalone variants.
// Feature dropped (the History tab no longer exists). Stubs kept in case
// older code still calls these names.
// ═══════════════════════════════════════════════════════════════════════
function createSnapshot() { }
function restoreSnapshot() { }
function deleteSnapshot() { }
function exportSnapshot() { }
function enableSnapEncryption() { }
function disableSnapEncryption() { }
function _isSnapEncrypted() { return false; }
function _getSnapshots() { return Promise.resolve([]); }
