// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/cisotoolbox_local.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Frontend persistence layer (localStorage)
 *
 * Autosave, file I/O (open/save with encryption), session restore banner, snapshots.
 * Load AFTER cisotoolbox.js. Used by standalone frontend apps only.
 * Backend apps load cisotoolbox_backend.js instead.
 */
var _fileHandle = null;
function _autoSave() {
    var key = _ct().autosaveKey;
    if (!key)
        return;
    if (typeof ctSchemaStamp === "function")
        ctSchemaStamp(D);
    try {
        localStorage.setItem(key, JSON.stringify(D));
    }
    catch (e) {
        showStatus(t("alert_storage_full"));
    }
}
// ═══════════════════════════════════════════════════════════════════════
// PERSISTENCE ADAPTER
// ═══════════════════════════════════════════════════════════════════════
//
// Uniform mutation interface shared between the opensource (localStorage)
// and backend (REST API) persistence layers. Every mutation site in
// the app code calls one of these three functions instead of raw
// `_autoSave()`. The **backend** layer (`vendor_api.js`, `risk_api.js`)
// overrides them with PATCH-based implementations; the opensource layer
// below simply delegates to the blob-level `_autoSave()`.
//
// Usage in app code (TPRM_app.js, EBIOS_RM_app.js):
//
//   D.vendors[idx].name = val;
//   _persist("vendor", v.id, { name: val });
//
//   D.vendors.push(newVendor);
//   _persistCreate("vendor", newVendor);
//
//   D.vendors.splice(idx, 1);
//   _persistDelete("vendor", v.id);
//
// Helper:
//   _obj("name", val)  →  { name: val }
//
// See CLAUDE.md § "Persistence adapter" for the full contract.
function _obj(k, v) { var o = {}; o[k] = v; return o; }
function _persist(entityType, entityId, fields) {
    _autoSave();
}
function _persistCreate(entityType, data) {
    _autoSave();
}
function _persistDelete(entityType, entityId) {
    _autoSave();
}
// Install a transparent undo hook on _autoSave. Each save pushes the
// previous serialized state on _undoStack, so apps get full undo/redo
// without sprinkling _saveState() everywhere. Apps that still call
// _saveState() manually (Risk, Compliance) are not broken — the hook
// detects a duplicate push by comparing with the top of the stack.
// Call this once at app boot, AFTER D is initialized.
// Render the Snapshots panel into `target` (element id or Element).
// Reuses createSnapshot / restoreSnapshot / deleteSnapshot / exportSnapshot
// / enableSnapEncryption / disableSnapEncryption / _getSnapshots /
// _isSnapEncrypted. Each app passes its own i18n keys + the name of the
// organization field stored on each snapshot (historically "societe",
// some apps use "organization").
//
// Example:
//   _renderSnapshotsPanel({
//     target: "history-content",
//     orgField: "societe",
//     keys: {
//       create: "tprm.history.create",
//       encrypt: "tprm.history.encrypt",
//       decrypt: "tprm.history.decrypt",
//       encryption_active: "tprm.history.encryption_active",
//       none: "tprm.history.none",
//       col_name: "tprm.history.col_name",
//       col_date: "tprm.history.col_date",
//       col_org: "tprm.history.col_org",
//       col_actions: "tprm.history.col_actions",
//       restore: "tprm.history.restore",
//       export: "tprm.history.export",
//       hint: "tprm.history.hint"
//     }
//   });
async function _renderSnapshotsPanel(opts) {
    opts = opts || {};
    var tgt = (typeof opts.target === "string") ? document.getElementById(opts.target) : opts.target;
    if (!tgt)
        return;
    var keys = opts.keys || {};
    var orgField = opts.orgField || "societe";
    var snaps = await _getSnapshots();
    var isEnc = _isSnapEncrypted();
    var h = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">';
    h += '<button class="ct-btn mt-8" data-write data-variant="primary" data-click="createSnapshot">' + esc(t(keys.create)) + '</button>';
    if (isEnc) {
        h += '<button class="ct-btn mt-8" data-write data-variant="primary" style="background:var(--ct-critical)" data-click="disableSnapEncryption">' + esc(t(keys.decrypt)) + '</button>';
        if (keys.encryption_active) {
            h += '<span style="color:var(--ct-low);font-size:0.82em">&#128274; ' + esc(t(keys.encryption_active)) + '</span>';
        }
    }
    else {
        h += '<button class="ct-btn mt-8" data-write data-variant="primary" style="background:var(--ct-accent)" data-click="enableSnapEncryption">' + esc(t(keys.encrypt)) + '</button>';
    }
    h += '</div>';
    if (!snaps.length) {
        h += '<p style="color:var(--ct-ink-2);font-size:0.9em">' + esc(t(keys.none)) + '</p>';
    }
    else {
        h += '<table><thead><tr><th>' + esc(t(keys.col_name)) + '</th><th>' + esc(t(keys.col_date)) + '</th><th>' + esc(t(keys.col_org)) + '</th><th>' + esc(t(keys.col_actions)) + '</th></tr></thead><tbody>';
        var loc = (typeof _locale !== "undefined" && _locale === "en") ? "en-US" : "fr-FR";
        for (var i = snaps.length - 1; i >= 0; i--) {
            var s = snaps[i];
            var d = new Date(s.date);
            var dateStr = d.toLocaleDateString(loc) + " " + d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
            var org = s[orgField] || s.societe || s.organization || "";
            h += '<tr><td><strong>' + esc(s.name || "") + '</strong></td><td>' + esc(dateStr) + '</td><td style="font-size:0.82em">' + esc(org) + '</td>';
            h += '<td><button class="ct-btn mt-8" data-write data-variant="primary" style="margin:0 4px 0 0" data-click="restoreSnapshot" data-args=\'' + _da(i) + '\'>' + esc(t(keys.restore)) + '</button>';
            h += '<button class="ct-btn mt-8" data-write data-variant="primary" style="margin:0 4px 0 0;background:var(--ct-accent)" data-click="exportSnapshot" data-args=\'' + _da(i) + '\'>' + esc(t(keys.export)) + '</button>';
            h += '<button class="ct-btn" data-variant="danger" data-size="xs" data-icon data-click="deleteSnapshot" data-args=\'' + _da(i) + '\'>' + _icon("trash", 14) + '</button></td></tr>';
        }
        h += '</tbody></table>';
    }
    if (keys.hint) {
        h += '<p style="margin-top:16px;color:var(--ct-ink-2);font-size:0.82em">' + esc(t(keys.hint)) + '</p>';
    }
    tgt.innerHTML = h;
}
function _installUndoHook() {
    if (typeof _autoSave !== "function" || typeof _undoStack === "undefined")
        return;
    if (_autoSave.__ctUndoHooked)
        return;
    var _original = _autoSave;
    var _lastSerialized = null;
    window._autoSave = function () {
        try {
            var cur = JSON.stringify(D);
            if (_lastSerialized != null && _lastSerialized !== cur) {
                // Skip if the caller already pushed this state via _saveState()
                if (_undoStack[_undoStack.length - 1] !== _lastSerialized) {
                    _undoStack.push(_lastSerialized);
                    if (_undoStack.length > 50)
                        _undoStack.shift();
                    _redoStack.length = 0;
                    if (typeof _updateUndoButtons === "function")
                        _updateUndoButtons();
                }
            }
            _lastSerialized = cur;
        }
        catch (e) { /* ignore serialization errors */ }
        return _original.apply(this, arguments);
    };
    window._autoSave.__ctUndoHooked = true;
}
function _loadAutoSave() {
    var key = _ct().autosaveKey;
    if (!key)
        return false;
    try {
        var raw = localStorage.getItem(key);
        if (!raw)
            return false;
        var parsed = JSON.parse(raw);
        Object.keys(D).forEach(function (k) { delete D[k]; });
        Object.assign(D, parsed);
        if (typeof ctSchemaMigrate === "function")
            ctSchemaMigrate(D);
        return true;
    }
    catch (e) {
        return false;
    }
}
function _checkAutoSaveBanner() {
    var key = _ct().autosaveKey;
    if (!key)
        return;
    try {
        var raw = localStorage.getItem(key);
        if (!raw)
            return;
        var parsed = JSON.parse(raw);
        var societe = (_ct().getSociete ? _ct().getSociete.call(null, parsed) : parsed.meta && parsed.meta.societe) || t("session_no_name");
        var date = (_ct().getDate ? _ct().getDate.call(null, parsed) : parsed.meta && parsed.meta.date_evaluation) || "";
        var label = societe + (date ? " — " + date : "");
        var banner = document.createElement("div");
        banner.className = "restore-banner";
        banner.id = "restore-banner";
        banner.innerHTML =
            '<span>&#128190; ' + t("session_found", { label: esc(label) }) + '</span>'
                + '<button class="btn-restore" data-click="_restoreSession">' + t("btn_restore") + '</button>'
                + '<button class="btn-discard" data-click="_discardSession">' + t("btn_discard") + '</button>';
        // Insert before the layout inside ITS OWN parent: .ct-body sits under
        // .ct-app, not under <body>. Calling body.insertBefore() with it threw
        // NotFoundError, the empty catch below swallowed it, and the restore
        // banner never appeared — the autosave survived but nothing offered it
        // back. Falls back to the top of <body> when no layout is found.
        var layoutEl = document.querySelector(".ct-body, .app-layout");
        var host = (layoutEl && layoutEl.parentNode) || document.body;
        host.insertBefore(banner, layoutEl && layoutEl.parentNode === host ? layoutEl : host.firstChild);
        if (layoutEl)
            layoutEl.classList.add("with-banner");
    }
    catch (e) { }
}
function _restoreSession() {
    if (_loadAutoSave()) {
        _initDataAndRender(function () { showStatus(t("status_session_restored")); });
    }
    _dismissBanner();
}
function _discardSession() {
    var key = _ct().autosaveKey;
    if (key)
        try {
            localStorage.removeItem(key);
        }
        catch (e) { }
    _dismissBanner();
}
function _dismissBanner() {
    var b = document.getElementById("restore-banner");
    if (b)
        b.remove();
    var layout = document.querySelector(".ct-body, .app-layout");
    if (layout)
        layout.classList.remove("with-banner");
}
// ═══════════════════════════════════════════════════════════════════════
// FICHIERS JSON (save / load / new)
// ═══════════════════════════════════════════════════════════════════════
function newAnalysis() {
    var lbl = t(_ct().labelKey || "analysis");
    if (!confirm(t("confirm_new", { label: lbl })))
        return;
    _resetFileBinding();
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
// The file binding (handle + password) belongs to the analysis it came from.
// Any switch of D to something else (multi-import, opening from a catalog)
// MUST clear it, otherwise quickSaveJSON overwrites another analysis's file.
function _resetFileBinding() {
    _fileHandle = null;
    _filePwd = null;
}
// Decode a buffer (decrypting if needed) into a JSON string. Returns null if
// the user cancels or mistypes the password — the caller must stop. Deliberate
// seam: the catalog hooks (multi-analysis) must inspect the JSON AFTER
// decryption, without prompting for the password again.
async function _decodeBuffer(buffer) {
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
    return jsonStr;
}
// Load one analysis's JSON string into D — second half of the seam.
function _applyLoadedJson(jsonStr) {
    var parsed = JSON.parse(jsonStr);
    delete parsed.__proto__;
    delete parsed.constructor;
    delete parsed.prototype;
    // Detect Pilot backup format: {"module":"...","data":[{"id":"...","data":{...}}]}
    if (parsed.module && Array.isArray(parsed.data) && parsed.data.length > 0 && parsed.data[0].data) {
        parsed = parsed.data[0].data;
    }
    // Clear D and merge parsed data (preserves the let D reference in app code)
    Object.keys(D).forEach(function (k) { delete D[k]; });
    Object.assign(D, parsed);
    // FEAT-36 — refuse future revs, normalize + replay migrations, stamp.
    if (typeof ctSchemaMigrate === "function")
        ctSchemaMigrate(D);
    return true;
}
// Load a buffer (encrypted or not) and return the JSON object.
async function _loadBuffer(buffer, filename) {
    var jsonStr = await _decodeBuffer(buffer);
    if (jsonStr === null)
        return null;
    return _applyLoadedJson(jsonStr);
}
function loadJSON(event) {
    var input = event.target;
    var file = input.files && input.files[0];
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
    if (typeof ctSchemaStamp === "function")
        ctSchemaStamp(D);
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
// ═══════════════════════════════════════════════════════════════════════
// SNAPSHOTS (localStorage, chiffrement optionnel)
// ═══════════════════════════════════════════════════════════════════════
var _snapPwd = null;
var SNAP_ENC_PREFIX = "ENC:";
var SNAP_MAX = 20;
function _getSnapKey() { return (_ct().autosaveKey || "ct") + "_snapshots"; }
async function _getSnapshots() {
    try {
        var raw = localStorage.getItem(_getSnapKey());
        if (!raw)
            return [];
        if (raw.startsWith(SNAP_ENC_PREFIX)) {
            if (!_snapPwd) {
                _snapPwd = await _promptPassword(t("pwd_title_snap_encrypted"), false);
                if (!_snapPwd)
                    return [];
            }
            try {
                var b64 = raw.slice(SNAP_ENC_PREFIX.length);
                var bytes = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
                var decrypted = await _decryptData(bytes, _snapPwd);
                return JSON.parse(decrypted);
            }
            catch (e) {
                _snapPwd = null;
                alert(t("alert_wrong_snap_password"));
                return [];
            }
        }
        return JSON.parse(raw);
    }
    catch (e) {
        return [];
    }
}
async function _saveSnapshots(snaps) {
    try {
        var json = JSON.stringify(snaps);
        if (_snapPwd) {
            var encrypted = await _encryptData(json, _snapPwd);
            var b64 = btoa(String.fromCharCode.apply(null, encrypted));
            localStorage.setItem(_getSnapKey(), SNAP_ENC_PREFIX + b64);
        }
        else {
            localStorage.setItem(_getSnapKey(), json);
        }
    }
    catch (e) {
        alert(t("alert_storage_full"));
    }
}
function _isSnapEncrypted() {
    try {
        var raw = localStorage.getItem(_getSnapKey());
        return raw ? raw.startsWith(SNAP_ENC_PREFIX) : false;
    }
    catch (e) {
        return false;
    }
}
async function createSnapshot() {
    var name = prompt(t("snap_prompt_name"), new Date().toLocaleString(_locale === "en" ? "en-GB" : "fr-FR"));
    if (!name)
        return;
    var snaps = await _getSnapshots();
    while (snaps.length >= SNAP_MAX)
        snaps.shift();
    var societe = _ct().getSociete ? _ct().getSociete(D) : "";
    if (typeof ctSchemaStamp === "function")
        ctSchemaStamp(D);
    snaps.push({ name: name, date: new Date().toISOString(), societe: societe, data: JSON.stringify(D) });
    await _saveSnapshots(snaps);
    showStatus(t("status_snap_created", { name: name }));
    if (typeof renderHistory === "function")
        renderHistory();
}
async function restoreSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length)
        return;
    if (!confirm(t("confirm_restore_snap", { name: snaps[idx].name })))
        return;
    _saveState();
    var restored = JSON.parse(snaps[idx].data);
    Object.keys(D).forEach(function (k) { delete D[k]; });
    Object.assign(D, restored);
    try {
        if (typeof ctSchemaMigrate === "function")
            ctSchemaMigrate(D);
    }
    catch (e) {
        alert(e && e.message ? e.message : String(e));
        return;
    }
    _initDataAndRender(function () { _autoSave(); });
}
async function deleteSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length)
        return;
    if (!confirm(t("confirm_delete_snap", { name: snaps[idx].name })))
        return;
    snaps.splice(idx, 1);
    await _saveSnapshots(snaps);
    if (typeof renderHistory === "function")
        renderHistory();
    showStatus(t("status_snap_deleted"));
}
async function exportSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length)
        return;
    var blob = new Blob([snaps[idx].data], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = snaps[idx].name.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
}
async function enableSnapEncryption() {
    var pwd = await _promptPassword(t("pwd_title_choose_snap"), true);
    if (!pwd)
        return;
    _snapPwd = pwd;
    var snaps = await _getSnapshots();
    await _saveSnapshots(snaps);
    showStatus(t("status_snap_encrypted"));
    if (typeof renderHistory === "function")
        renderHistory();
}
async function disableSnapEncryption() {
    if (!confirm(t("confirm_decrypt_snaps")))
        return;
    var snaps = await _getSnapshots();
    _snapPwd = null;
    await _saveSnapshots(snaps);
    showStatus(t("status_encryption_off"));
    if (typeof renderHistory === "function")
        renderHistory();
}
// Masquer "Enregistrer" si File System Access API non disponible
document.addEventListener("DOMContentLoaded", function () {
    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
        var el = document.getElementById("menu-item-save");
        if (el)
            el.style.display = "none";
    }
});
// ═══════════════════════════════════════════════════════════════════════
// DEMO DATA LOADING (settings panel hook)
// ═══════════════════════════════════════════════════════════════════════
function _demoSettingsHTML() {
    // In Pilot-managed (suite) mode, hide the demo loader so users
    // cannot accidentally seed MedSecure test data into the backend
    // DB — those rows would then leak up to Pilot's consolidated
    // action plan via /api/internal/measures.
    if (window._aiRuntime && window._aiRuntime.managed)
        return "";
    return '<div class="settings-section" style="margin-top:24px;border-top:1px solid var(--ct-line);padding-top:16px">' +
        '<div class="settings-label">' + t("settings.demo_section") + '</div>' +
        '<p class="fs-xs text-muted" style="margin-bottom:8px">' + t("settings.demo_note") + '</p>' +
        '<button class="ai-btn-close" style="width:100%;padding:8px;font-size:0.85em" id="settings-load-demo">' + t("settings.demo_load") + '</button>' +
        '</div>';
}
function _wireDemoSettings() {
    if (window._aiRuntime && window._aiRuntime.managed)
        return;
    var btn = document.getElementById("settings-load-demo");
    if (!btn)
        return;
    btn.onclick = function () {
        var demoFile = (window._locale || "fr") === "fr" ? "demo-fr.json" : "demo-en.json";
        if (typeof window._aiClosePanel === "function")
            window._aiClosePanel();
        fetch(demoFile).then(function (r) {
            if (!r.ok)
                throw new Error("Demo file not found: " + demoFile);
            return r.text();
        }).then(function (json) {
            D = JSON.parse(json);
            if (typeof _initDataAndRender === "function")
                _initDataAndRender(function () {
                    if (typeof _autoSave === "function")
                        _autoSave();
                    showStatus(t("settings.demo_loaded"));
                });
        }).catch(function (e) {
            showStatus(t("settings.demo_error") + " " + e.message);
        });
    };
}
_registerTranslations("fr", {
    "settings.demo_section": "Démonstration",
    "settings.demo_note": "Chargez un fichier d'exemple complet (société fictive MedSecure) pour découvrir les fonctionnalités de l'application.",
    "settings.demo_load": "Charger la démonstration",
    "settings.demo_loaded": "Démonstration chargée",
    "settings.demo_error": "Erreur lors du chargement :"
});
_registerTranslations("en", {
    "settings.demo_section": "Demonstration",
    "settings.demo_note": "Load a complete example file (fictional company MedSecure) to explore the application features.",
    "settings.demo_load": "Load demonstration",
    "settings.demo_loaded": "Demonstration loaded",
    "settings.demo_error": "Error loading demo:"
});
