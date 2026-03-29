/**
 * CISO Toolbox — Bibliothèque JS commune
 *
 * Chaque application doit définir avant de charger ce fichier :
 *   window.CT_CONFIG = {
 *     autosaveKey: "compliance_autosave",  // clé localStorage
 *     initDataVar: "COMPLIANCE_INIT_DATA", // variable globale des données initiales
 *     refNamespace: "COMPLIANCE_REF",      // namespace des référentiels lazy
 *     descNamespace: "COMPLIANCE_DESCRIPTIONS", // namespace des descriptions
 *     label: "évaluation",                 // label pour les messages ("Nouvelle évaluation")
 *     filePrefix: "Conformite",            // préfixe par défaut du nom de fichier
 *     getSociete: function() { return D.meta?.societe || ""; },
 *     getDate: function() { return D.meta?.date_evaluation || ""; }
 *   };
 *
 * Et les globales :
 *   D                  — objet de données
 *   REFERENTIELS_META  — catalogue des référentiels
 *   _ASSET_BASE        — préfixe des fichiers assets
 *   ensureKeys()       — migration/init des données (app-specific)
 *   renderAll()        — rendu complet (app-specific)
 */

var _CT = {};
function _ctInit() { _CT = window.CT_CONFIG || {}; }
// Appelé automatiquement au premier besoin
function _ct() { if (!_CT.autosaveKey) _ctInit(); return _CT; }

// ═══════════════════════════════════════════════════════════════════════
// HELPERS HTML
// ═══════════════════════════════════════════════════════════════════════

function esc(v) {
    return v === null || v === undefined ? "" : String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
}

function _da() {
    return JSON.stringify(Array.from(arguments)).replace(/'/g, "&#39;");
}

function badge(text, color) {
    if (!text) return "";
    return '<span class="badge" style="background:' + color + '">' + esc(text) + '</span>';
}

function confColor(v) {
    if (v === "" || v === null || v === undefined) return "var(--text-muted)";
    var n = parseInt(v);
    return n >= 80 ? "var(--green)" : n > 0 ? "var(--orange)" : "var(--red)";
}

function _noop() {}

// ═══════════════════════════════════════════════════════════════════════
// DELEGATION D'EVENEMENTS (CSP : zero inline handlers)
// ═══════════════════════════════════════════════════════════════════════

function _toggleSidebarMobile() {
    document.querySelector(".sidebar").classList.toggle("open");
}

function _menuAction(fnName) {
    if (typeof window[fnName] === "function") window[fnName]();
    toggleMenu();
}

function _autoHeight(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

// Blocked function names for data-click dispatch (defense-in-depth)
var _BLOCKED_DISPATCH = {"eval":1,"Function":1,"setTimeout":1,"setInterval":1,"fetch":1,"open":1,"close":1,"alert":1,"confirm":1,"prompt":1,"importScripts":1,"postMessage":1};

function _safeDispatch(fn, args) {
    if (_BLOCKED_DISPATCH[fn]) return;
    if (typeof window[fn] === "function") window[fn].apply(null, args);
}

document.addEventListener("click", function(e) {
    var selfEl = e.target.closest("[data-click-self]");
    if (selfEl && e.target === selfEl) {
        var fn0 = selfEl.getAttribute("data-click-self");
        _safeDispatch(fn0, []);
        return;
    }
    var el = e.target.closest("[data-click]");
    if (!el) return;
    if (el.hasAttribute("data-stop")) e.stopPropagation();
    var fn = el.getAttribute("data-click");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-el")) args.push(el);
    if (el.hasAttribute("data-pass-event")) args.push(e);
    _safeDispatch(fn, args);
});

document.addEventListener("change", function(e) {
    var el = e.target.closest("[data-change]");
    if (!el) return;
    var fn = el.getAttribute("data-change");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-value")) args.push(el.value);
    if (el.hasAttribute("data-pass-checked")) args.push(el.checked);
    if (el.hasAttribute("data-pass-el")) args.push(el);
    if (el.hasAttribute("data-pass-event")) args.push(e);
    _safeDispatch(fn, args);
});

document.addEventListener("input", function(e) {
    var el = e.target.closest("[data-input]");
    if (!el) return;
    var fn = el.getAttribute("data-input");
    var args = el.hasAttribute("data-args") ? JSON.parse(el.getAttribute("data-args")) : [];
    if (el.hasAttribute("data-pass-value")) args.push(el.value);
    if (el.hasAttribute("data-pass-el")) args.push(el);
    _safeDispatch(fn, args);
});

// ═══════════════════════════════════════════════════════════════════════
// COLONNES (masquer / afficher / redimensionner)
// ═══════════════════════════════════════════════════════════════════════

function hd(key) { return ' data-col="' + key + '"'; }

var _userHiddenCols = {};
var _userColWidths = {};

function _setupTable(tableId, defaultHidden) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var ths = table.querySelectorAll("thead th");
    ths.forEach(function(th, ci) {
        if (ci === ths.length - 1) return;
        if (th.querySelector(".col-hide")) return;
        var col = th.getAttribute("data-col");
        if (col) {
            var btn = document.createElement("span");
            btn.className = "col-hide";
            btn.innerHTML = "&#10005;";
            btn.title = t("col_hide_title");
            btn.onclick = function(e) { e.stopPropagation(); e.preventDefault(); hideCol(tableId, col); };
            th.appendChild(btn);
        }
    });
    if (_userColWidths[tableId]) {
        for (var ci in _userColWidths[tableId]) {
            var th = ths[parseInt(ci)];
            if (th) { th.style.width = _userColWidths[tableId][ci]; th.style.minWidth = _userColWidths[tableId][ci]; }
        }
    }
    var toHide = _userHiddenCols[tableId] || defaultHidden || [];
    for (var i = 0; i < toHide.length; i++) hideCol(tableId, toHide[i], true);
}

function _updateColsBtn(tableId) {
    var btn = document.getElementById(tableId + "-cols-btn");
    if (!btn) return;
    var table = document.getElementById(tableId);
    if (!table) return;
    var hidden = table.querySelectorAll("thead th[data-col][style*='display: none']");
    btn.style.display = hidden.length > 0 ? "" : "none";
}

function hideCol(tableId, col, silent) {
    var table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('[data-col="' + col + '"]').forEach(function(el) { el.style.display = "none"; });
    if (!silent) {
        if (!_userHiddenCols[tableId]) _userHiddenCols[tableId] = [];
        if (_userHiddenCols[tableId].indexOf(col) === -1) _userHiddenCols[tableId].push(col);
    }
    _updateColsPopup(tableId);
    _updateColsBtn(tableId);
}

function showCol(tableId, col) {
    var table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('[data-col="' + col + '"]').forEach(function(el) { el.style.display = ""; });
    if (_userHiddenCols[tableId]) {
        _userHiddenCols[tableId] = _userHiddenCols[tableId].filter(function(c) { return c !== col; });
        if (_userHiddenCols[tableId].length === 0) delete _userHiddenCols[tableId];
    }
    _updateColsPopup(tableId);
    _updateColsBtn(tableId);
}

function _updateColsPopup(tableId) {
    var popup = document.getElementById(tableId + "-cols-popup");
    if (!popup) return;
    var table = document.getElementById(tableId);
    if (!table) return;
    var ths = table.querySelectorAll("thead th[data-col]");
    var h = '';
    ths.forEach(function(th) {
        var col = th.getAttribute("data-col");
        var label = th.textContent.replace("✕","").trim();
        if (th.style.display === "none") {
            h += '<label><input type="checkbox" data-change="showCol" data-args=\'' + _da(tableId, col) + '\'> ' + esc(label) + '</label>';
        }
    });
    popup.innerHTML = h || '<span class="text-muted fs-sm">' + t("cols_all_visible") + '</span>';
}

function toggleColsPopup(tableId) {
    _updateColsPopup(tableId);
    var popup = document.getElementById(tableId + "-cols-popup");
    if (popup) popup.classList.toggle("open");
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".cols-popup") && !e.target.closest(".btn-show-cols")) {
        document.querySelectorAll(".cols-popup.open").forEach(function(p) { p.classList.remove("open"); });
    }
});

function colsButton(tableId) {
    return '<div style="position:relative;display:inline-block;margin-bottom:6px">'
        + '<button class="btn-show-cols" style="display:none" id="' + tableId + '-cols-btn" data-click="toggleColsPopup" data-args=\'' + _da(tableId) + '\'>' + t("cols_hidden_btn") + '</button>'
        + '<div class="cols-popup" id="' + tableId + '-cols-popup"></div>'
        + '</div>';
}

// Redimensionnement de colonnes
var RESIZE_EDGE = 6;
var _resizing = null;

document.addEventListener("mousemove", function(e) {
    if (_resizing) return;
    var cell = e.target.closest("td, th");
    if (!cell || !cell.closest("table[id]")) return;
    var rect = cell.getBoundingClientRect();
    cell.style.cursor = (rect.right - e.clientX <= RESIZE_EDGE) ? "col-resize" : "";
});

document.addEventListener("mousedown", function(e) {
    if (_resizing) return;
    var cell = e.target.closest("td, th");
    if (!cell) return;
    var table = cell.closest("table[id]");
    if (!table) return;
    var rect = cell.getBoundingClientRect();
    if (rect.right - e.clientX > RESIZE_EDGE) return;
    e.preventDefault();
    var ci = 0;
    for (var c = cell.previousElementSibling; c; c = c.previousElementSibling) ci += (c.colSpan || 1);
    var th = table.querySelector("thead tr").children[ci];
    if (!th) return;
    _resizing = { th: th, startX: e.pageX, startW: th.offsetWidth, table: table };
    document.onmousemove = _doResize;
    document.onmouseup = _stopResize;
});

function _doResize(e) {
    if (!_resizing) return;
    var diff = e.pageX - _resizing.startX;
    var newW = Math.max(30, _resizing.startW + diff);
    _resizing.th.style.width = newW + "px";
    _resizing.th.style.minWidth = newW + "px";
}

function _stopResize() {
    if (_resizing) {
        var th = _resizing.th;
        var table = th.closest("table");
        if (table && table.id) {
            var ci = Array.from(th.parentElement.children).indexOf(th);
            if (!_userColWidths[table.id]) _userColWidths[table.id] = {};
            _userColWidths[table.id][ci] = th.style.width;
        }
    }
    _resizing = null;
    document.onmousemove = null;
    document.onmouseup = null;
}

// ═══════════════════════════════════════════════════════════════════════
// CHARGEMENT LAZY D'ASSETS
// ═══════════════════════════════════════════════════════════════════════

function _loadAsset(filename, cb) {
    var existing = document.querySelector('script[data-asset="' + filename + '"]');
    if (existing) {
        if (existing.dataset.loaded === "1") cb();
        else { existing.addEventListener("load", cb); existing.addEventListener("error", cb); }
        return;
    }
    var s = document.createElement("script");
    s.dataset.asset = filename;
    s.src = filename;
    s.onload  = function() { s.dataset.loaded = "1"; cb(); };
    s.onerror = function() { s.dataset.loaded = "err"; cb(); };
    document.head.appendChild(s);
}

var _descriptionsLoaded = false;

function _ensureDescriptions(cb) {
    if (_descriptionsLoaded) { cb(); return; }
    _loadAsset(_ASSET_BASE + "_descriptions.js", function() {
        _descriptionsLoaded = true;
        cb();
    });
}

function _ensureFramework(fwId, cb) {
    if (REFERENTIELS_META[fwId] && REFERENTIELS_META[fwId].measures) { cb(); return; }
    _loadAsset(_ASSET_BASE + "_ref_" + fwId + ".js", function() {
        var ns = _ct().refNamespace || "CT_REF";
        if (window[ns] && window[ns][fwId]) {
            REFERENTIELS_META[fwId] = window[ns][fwId];
        }
        cb();
    });
}

function _initDataAndRender(afterFn) {
    var finish = function() { ensureKeys(); renderAll(); if (afterFn) afterFn(); };
    var active = (D.referentiels_actifs || []).filter(function(id) { return id; });
    if (active.length === 0) { finish(); return; }
    var pending = active.length;
    var done = function() { if (--pending === 0) finish(); };
    active.forEach(function(fwId) { _ensureFramework(fwId, done); });
}

function _getAnssDesc(num) {
    var ns = _ct().descNamespace || "CT_DESCRIPTIONS";
    var dd = window[ns];
    if (!dd) return "";
    var key = String(num);
    if (_locale === "en" && dd.anssi_en && dd.anssi_en[key]) return dd.anssi_en[key];
    return (dd.anssi && dd.anssi[key]) || "";
}

function _getIsoDesc(ref) {
    var ns = _ct().descNamespace || "CT_DESCRIPTIONS";
    var dd = window[ns];
    if (!dd) return "";
    if (_locale === "en" && dd.iso_en && dd.iso_en[ref]) return dd.iso_en[ref];
    return (dd.iso && dd.iso[ref]) || "";
}

// ═══════════════════════════════════════════════════════════════════════
// SLIDER CONFORMITE
// ═══════════════════════════════════════════════════════════════════════

function _sliderInput(el) {
    var v = parseInt(el.value);
    var c = v >= 80 ? "var(--green)" : v > 0 ? "var(--orange)" : "var(--red)";
    var lbl = el.getAttribute("data-lbl");
    var l = lbl ? document.getElementById(lbl) : null;
    if (l) { l.textContent = v + "%"; l.style.color = c; }
    el.style.accentColor = c;
}

// ═══════════════════════════════════════════════════════════════════════
// TOOLBAR & SIDEBAR
// ═══════════════════════════════════════════════════════════════════════

function showStatus(msg) {
    var el = document.getElementById("status-msg");
    if (el) { el.textContent = msg; setTimeout(function() { el.textContent = ""; }, 3000); }
}

function toggleMenu() {
    document.getElementById("io-menu").classList.toggle("open");
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".toolbar-menu")) {
        var m = document.getElementById("io-menu");
        if (m) m.classList.remove("open");
    }
});

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("collapsed");
}

// ═══════════════════════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════════════════════

var _undoStack = [];
var _redoStack = [];

function _saveState() {
    _undoStack.push(JSON.stringify(D));
    if (_undoStack.length > 50) _undoStack.shift();
    _redoStack.length = 0;
}

function undo() {
    if (_undoStack.length === 0) return;
    _redoStack.push(JSON.stringify(D));
    D = JSON.parse(_undoStack.pop());
    if (typeof renderAll === "function") renderAll();
    if (typeof _autoSave === "function") _autoSave();
}

function redo() {
    if (_redoStack.length === 0) return;
    _undoStack.push(JSON.stringify(D));
    D = JSON.parse(_redoStack.pop());
    if (typeof renderAll === "function") renderAll();
    if (typeof _autoSave === "function") _autoSave();
}

// ═══════════════════════════════════════════════════════════════════════
// AUTO-SAVE / RESTAURATION SESSION
// ═══════════════════════════════════════════════════════════════════════

var _fileHandle = null;

function _autoSave() {
    var key = _ct().autosaveKey;
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(D)); } catch(e) { showStatus(t("alert_storage_full")); }
}

function _loadAutoSave() {
    var key = _ct().autosaveKey;
    if (!key) return false;
    try {
        var raw = localStorage.getItem(key);
        if (!raw) return false;
        D = JSON.parse(raw);
        return true;
    } catch(e) { return false; }
}

function _checkAutoSaveBanner() {
    var key = _ct().autosaveKey;
    if (!key) return;
    try {
        var raw = localStorage.getItem(key);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        var societe = (_ct().getSociete ? _ct().getSociete.call(null, parsed) : parsed.meta && parsed.meta.societe) || t("session_no_name");
        var date = (_ct().getDate ? _ct().getDate.call(null, parsed) : parsed.meta && parsed.meta.date_evaluation) || "";
        var label = societe + (date ? " — " + date : "");
        var banner = document.createElement("div");
        banner.className = "restore-banner";
        banner.id = "restore-banner";
        banner.innerHTML =
            '<span>&#128190; ' + t("session_found", {label: esc(label)}) + '</span>'
            + '<button class="btn-restore" data-click="_restoreSession">' + t("btn_restore") + '</button>'
            + '<button class="btn-discard" data-click="_discardSession">' + t("btn_discard") + '</button>';
        document.body.insertBefore(banner, document.querySelector(".app-layout"));
        var layout = document.querySelector(".app-layout");
        if (layout) layout.classList.add("with-banner");
    } catch(e) {}
}

function _restoreSession() {
    if (_loadAutoSave()) {
        _initDataAndRender(function() { showStatus(t("status_session_restored")); });
    }
    _dismissBanner();
}

function _discardSession() {
    var key = _ct().autosaveKey;
    if (key) try { localStorage.removeItem(key); } catch(e) {}
    _dismissBanner();
}

function _dismissBanner() {
    var b = document.getElementById("restore-banner");
    if (b) b.remove();
    var layout = document.querySelector(".app-layout");
    if (layout) layout.classList.remove("with-banner");
}

// ═══════════════════════════════════════════════════════════════════════
// FICHIERS JSON (save / load / new)
// ═══════════════════════════════════════════════════════════════════════

function newAnalysis() {
    var lbl = t(_ct().labelKey || "analysis");
    if (!confirm(t("confirm_new", {label: lbl}))) return;
    _fileHandle = null;
    var initVar = _ct().initDataVar || "CT_INIT_DATA";
    D = JSON.parse(JSON.stringify(window[initVar] || {}));
    _initDataAndRender(function() {
        _autoSave();
        showStatus(t("status_new", {label: lbl}));
    });
}

// Mot de passe du fichier courant (en mémoire uniquement)
var _filePwd = null;

// Charger un buffer (chiffré ou non) et retourner l'objet JSON
async function _loadBuffer(buffer, filename) {
    var bytes = new Uint8Array(buffer);
    var jsonStr;
    if (_isEncrypted(bytes)) {
        var pwd = await _promptPassword(t("pwd_title_encrypted_file"), false);
        if (!pwd) return null;
        try {
            jsonStr = await _decryptData(bytes, pwd);
            _filePwd = pwd;
        } catch(e) {
            alert(t("alert_wrong_password"));
            return null;
        }
    } else {
        jsonStr = new TextDecoder().decode(bytes);
        _filePwd = null;
    }
    if (jsonStr.length > 10000000) throw new Error("File too large (>10MB)");
    var parsed = JSON.parse(jsonStr);
    D = parsed;
    return true;
}

function loadJSON(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var ok = await _loadBuffer(e.target.result, file.name);
            if (!ok) return;
            _fileHandle = null;
            _initDataAndRender(function() {
                _autoSave();
                showStatus(t("status_file_opened", {name: file.name}));
            });
        } catch(err) {
            alert(t("alert_load_error", {msg: err.message}));
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
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
            if (!ok) return;
            _fileHandle = handle;
            _initDataAndRender(function() {
                _autoSave();
                showStatus(t("status_file_opened", {name: file.name}));
            });
        } catch(e) {
            if (e.name !== "AbortError") alert(t("alert_open_error", {msg: e.message}));
        }
    } else {
        document.getElementById("file-input").click();
    }
}

// Sérialiser D en contenu fichier (chiffré ou non)
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
        } catch(e) {}
    }
    await saveJSON();
}

async function saveJSON() {
    var prefix = _ct().filePrefix || "Export";
    var societe = (_ct().getSociete ? _ct().getSociete.call(null, D) : D.meta && D.meta.societe) || prefix;
    var scope = _ct().getScope ? _ct().getScope.call(null, D) : "";
    if (scope) societe = societe + "-" + scope;
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
            showStatus(t("status_saved_name", {name: handle.name}) + (_filePwd ? t("status_saved_encrypted") : ""));
        } catch(e) {
            if (e.name !== "AbortError") alert(t("alert_save_error", {msg: e.message}));
        }
    } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = societe + ext;
        a.click();
        URL.revokeObjectURL(a.href);
        showStatus(t("status_downloaded") + (_filePwd ? t("status_saved_encrypted") : ""));
    }
}

// Activer/désactiver le chiffrement du fichier
async function enableFileEncryption() {
    var pwd = await _promptPassword(t("pwd_title_choose_file"), true);
    if (!pwd) return;
    _filePwd = pwd;
    showStatus(t("status_encryption_on"));
}

function disableFileEncryption() {
    _filePwd = null;
    showStatus(t("status_encryption_off"));
}

// Ctrl+S
document.addEventListener("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (typeof quickSaveJSON === "function") quickSaveJSON();
    }
});

// Ctrl+Z / Ctrl+Y
document.addEventListener("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
        e.preventDefault(); undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
        e.preventDefault(); redo();
    }
});

// ═══════════════════════════════════════════════════════════════════════
// CHIFFREMENT (AES-256-GCM, PBKDF2 250k)
// ═══════════════════════════════════════════════════════════════════════

async function _deriveKey(password, salt) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        {name: "PBKDF2", salt: salt, iterations: 250000, hash: "SHA-256"},
        keyMaterial, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]
    );
}

async function _encryptData(jsonStr, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await _deriveKey(password, salt);
    var ciphertext = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, new TextEncoder().encode(jsonStr));
    var header = new TextEncoder().encode("CT_ENC");
    var result = new Uint8Array(header.length + salt.length + iv.length + ciphertext.byteLength);
    result.set(header, 0);
    result.set(salt, header.length);
    result.set(iv, header.length + salt.length);
    result.set(new Uint8Array(ciphertext), header.length + salt.length + iv.length);
    return result;
}

async function _decryptData(buffer, password) {
    var header = new TextDecoder().decode(buffer.slice(0, 6));
    // Support ancien format EBIOS_ENC (9 bytes) et nouveau CT_ENC (6 bytes)
    var headerLen = header === "CT_ENC" ? 6 : (new TextDecoder().decode(buffer.slice(0, 9)) === "EBIOS_ENC" ? 9 : 0);
    if (!headerLen) throw new Error(t("err_not_encrypted"));
    var salt = buffer.slice(headerLen, headerLen + 16);
    var iv = buffer.slice(headerLen + 16, headerLen + 28);
    var ciphertext = buffer.slice(headerLen + 28);
    var key = await _deriveKey(password, salt);
    var decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}

function _isEncrypted(buffer) {
    if (buffer.byteLength < 9) return false;
    var h6 = new TextDecoder().decode(buffer.slice(0, 6));
    var h9 = new TextDecoder().decode(buffer.slice(0, 9));
    return h6 === "CT_ENC" || h9 === "EBIOS_ENC";
}

// Prompt password (utilise le dialog #pwd-overlay s'il existe, sinon prompt natif)
function _promptPassword(title, confirmMode) {
    var overlay = document.getElementById("pwd-overlay");
    if (!overlay) {
        return new Promise(function(resolve) {
            var pwd = prompt(title);
            resolve(pwd);
        });
    }
    return new Promise(function(resolve) {
        var inp1 = document.getElementById("pwd-input");
        var inp2 = document.getElementById("pwd-input2");
        var err = document.getElementById("pwd-error");
        document.getElementById("pwd-title").textContent = title;
        inp1.value = ""; inp2.value = ""; err.textContent = "";
        if (confirmMode) { inp2.classList.remove("hidden"); inp2.style.display = ""; }
        else { inp2.classList.add("hidden"); }
        overlay.classList.add("open");
        inp1.focus();
        function cleanup() {
            overlay.classList.remove("open");
            document.getElementById("pwd-ok").onclick = null;
            document.getElementById("pwd-cancel").onclick = null;
            inp1.onkeydown = null; inp2.onkeydown = null;
        }
        function submit() {
            var v1 = inp1.value;
            if (!v1) { err.textContent = t("pwd_err_empty"); return; }
            if (confirmMode && v1 !== inp2.value) { err.textContent = t("pwd_err_mismatch"); inp2.focus(); return; }
            cleanup(); resolve(v1);
        }
        function cancel() { cleanup(); resolve(null); }
        document.getElementById("pwd-ok").onclick = submit;
        document.getElementById("pwd-cancel").onclick = cancel;
        var onKey = function(e) { if (e.key === "Enter") submit(); if (e.key === "Escape") cancel(); };
        inp1.onkeydown = onKey; inp2.onkeydown = onKey;
    });
}

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
        if (!raw) return [];
        if (raw.startsWith(SNAP_ENC_PREFIX)) {
            if (!_snapPwd) {
                _snapPwd = await _promptPassword(t("pwd_title_snap_encrypted"), false);
                if (!_snapPwd) return [];
            }
            try {
                var b64 = raw.slice(SNAP_ENC_PREFIX.length);
                var bytes = Uint8Array.from(atob(b64), function(c) { return c.charCodeAt(0); });
                var decrypted = await _decryptData(bytes, _snapPwd);
                return JSON.parse(decrypted);
            } catch(e) {
                _snapPwd = null;
                alert(t("alert_wrong_snap_password"));
                return [];
            }
        }
        return JSON.parse(raw);
    } catch(e) { return []; }
}

async function _saveSnapshots(snaps) {
    try {
        var json = JSON.stringify(snaps);
        if (_snapPwd) {
            var encrypted = await _encryptData(json, _snapPwd);
            var b64 = btoa(String.fromCharCode.apply(null, encrypted));
            localStorage.setItem(_getSnapKey(), SNAP_ENC_PREFIX + b64);
        } else {
            localStorage.setItem(_getSnapKey(), json);
        }
    } catch(e) { alert(t("alert_storage_full")); }
}

function _isSnapEncrypted() {
    try {
        var raw = localStorage.getItem(_getSnapKey());
        return raw ? raw.startsWith(SNAP_ENC_PREFIX) : false;
    } catch(e) { return false; }
}

async function createSnapshot() {
    var name = prompt(t("snap_prompt_name"), new Date().toLocaleString(_locale === "en" ? "en-GB" : "fr-FR"));
    if (!name) return;
    var snaps = await _getSnapshots();
    while (snaps.length >= SNAP_MAX) snaps.shift();
    var societe = _ct().getSociete ? _ct().getSociete(D) : "";
    snaps.push({ name: name, date: new Date().toISOString(), societe: societe, data: JSON.stringify(D) });
    await _saveSnapshots(snaps);
    showStatus(t("status_snap_created", {name: name}));
    if (typeof renderHistory === "function") renderHistory();
}

async function restoreSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length) return;
    if (!confirm(t("confirm_restore_snap", {name: snaps[idx].name}))) return;
    _saveState();
    D = JSON.parse(snaps[idx].data);
    _initDataAndRender(function() { _autoSave(); });
}

async function deleteSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length) return;
    if (!confirm(t("confirm_delete_snap", {name: snaps[idx].name}))) return;
    snaps.splice(idx, 1);
    await _saveSnapshots(snaps);
    if (typeof renderHistory === "function") renderHistory();
    showStatus(t("status_snap_deleted"));
}

async function exportSnapshot(idx) {
    var snaps = await _getSnapshots();
    if (idx < 0 || idx >= snaps.length) return;
    var blob = new Blob([snaps[idx].data], {type: "application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = snaps[idx].name.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
}

async function enableSnapEncryption() {
    var pwd = await _promptPassword(t("pwd_title_choose_snap"), true);
    if (!pwd) return;
    _snapPwd = pwd;
    var snaps = await _getSnapshots();
    await _saveSnapshots(snaps);
    showStatus(t("status_snap_encrypted"));
    if (typeof renderHistory === "function") renderHistory();
}

async function disableSnapEncryption() {
    if (!confirm(t("confirm_decrypt_snaps"))) return;
    var snaps = await _getSnapshots();
    _snapPwd = null;
    await _saveSnapshots(snaps);
    showStatus(t("status_encryption_off"));
    if (typeof renderHistory === "function") renderHistory();
}

// Masquer "Enregistrer" si File System Access API non disponible
document.addEventListener("DOMContentLoaded", function() {
    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
        var el = document.getElementById("menu-item-save");
        if (el) el.style.display = "none";
    }
});
