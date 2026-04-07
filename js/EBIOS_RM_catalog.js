/**
 * EBIOS RM — Multi-Analysis Catalog (IndexedDB)
 *
 * Manages multiple risk analyses stored in IndexedDB.
 * Provides catalog UI in the sidebar + CRUD operations.
 *
 * Load AFTER cisotoolbox.js and BEFORE EBIOS_RM_app.js:
 *   <script src="js/EBIOS_RM_catalog.js"></script>
 */

(function() {
"use strict";

var DB_NAME = "ebios_rm_catalog";
var STORE = "analyses";
var DB_VERSION = 1;
var _db = null;
var _activeId = null;
var _saveTimer = null;

// ═══════════════════════════════════════════════════════════════
// IndexedDB LAYER
// ═══════════════════════════════════════════════════════════════

function _open(cb) {
    if (_db) { cb(_db); return; }
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
            var store = db.createObjectStore(STORE, { keyPath: "id" });
            store.createIndex("updatedAt", "updatedAt");
        }
    };
    req.onsuccess = function(e) { _db = e.target.result; cb(_db); };
    req.onerror = function() { console.error("IndexedDB error"); cb(null); };
}

function _getAll(cb) {
    _open(function(db) {
        if (!db) { cb([]); return; }
        var tx = db.transaction(STORE, "readonly");
        var req = tx.objectStore(STORE).getAll();
        req.onsuccess = function() {
            var items = req.result || [];
            items.sort(function(a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
            cb(items);
        };
        req.onerror = function() { cb([]); };
    });
}

function _get(id, cb) {
    _open(function(db) {
        if (!db) { cb(null); return; }
        var req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
        req.onsuccess = function() { cb(req.result || null); };
        req.onerror = function() { cb(null); };
    });
}

function _put(record, cb) {
    _open(function(db) {
        if (!db) { if (cb) cb(); return; }
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(record);
        tx.oncomplete = function() { if (cb) cb(); };
        tx.onerror = function() { if (cb) cb(); };
    });
}

function _del(id, cb) {
    _open(function(db) {
        if (!db) { if (cb) cb(); return; }
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = function() { if (cb) cb(); };
    });
}

function _genId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

// ═══════════════════════════════════════════════════════════════
// ANALYSIS STATS
// ═══════════════════════════════════════════════════════════════

function _buildStats() {
    return {
        vm: (D.vm || []).length,
        bs: (D.bs || []).length,
        ss: (D.ss || []).length,
        measures: (D.measures || []).length
    };
}

function _buildRecord(id, data) {
    var d = typeof data === "string" ? JSON.parse(data) : data;
    var name = (d.context && d.context.societe) || t("catalog.unnamed");
    var date = (d.context && d.context.date) || "";
    return {
        id: id,
        name: name,
        date: date,
        data: typeof data === "string" ? data : JSON.stringify(data),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
            vm: (d.vm || []).length,
            bs: (d.bs || []).length,
            ss: (d.ss || []).length,
            measures: (d.measures || []).length
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// AUTOSAVE (replaces localStorage-based _autoSave)
// ═══════════════════════════════════════════════════════════════

var _origAutoSave = window._autoSave;

window._autoSave = function() {
    // Keep localStorage autosave for backward compat (quick restore)
    if (_origAutoSave) _origAutoSave();

    // Debounced IndexedDB write
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
        if (!_activeId) return;
        var record = {
            id: _activeId,
            name: (D.context && D.context.societe) || t("catalog.unnamed"),
            date: (D.context && D.context.date) || "",
            data: JSON.stringify(D),
            updatedAt: new Date().toISOString(),
            stats: _buildStats()
        };
        _put(record, function() {
            _renderCatalog();
        });
    }, 500);
};

// ═══════════════════════════════════════════════════════════════
// CATALOG CRUD
// ═══════════════════════════════════════════════════════════════

window.catalogCreate = function() {
    var id = _genId();
    _activeId = id;
    localStorage.setItem("ebios_catalog_active", id);

    // Reset D silently (no confirm dialog)
    var init = window[_ct().initDataVar || "EBIOS_INIT_DATA"];
    if (init) { Object.keys(D).forEach(function(k){ delete D[k]; }); Object.assign(D, JSON.parse(JSON.stringify(init))); }
    if (typeof ensureKeys === "function") ensureKeys();
    if (typeof _initDataAndRender === "function") {
        _initDataAndRender(function() { _renderCatalog(); });
    } else {
        if (typeof renderAll === "function") renderAll();
    }
    _autoSave();
};

window.catalogOpen = function(id) {
    if (id === _activeId) return;
    _get(id, function(record) {
        if (!record) return;
        _activeId = id;
        localStorage.setItem("ebios_catalog_active", id);
        try {
            var _parsed = JSON.parse(record.data); Object.keys(D).forEach(function(k){ delete D[k]; }); Object.assign(D, _parsed);
            if (typeof ensureKeys === "function") ensureKeys();
            if (typeof _initDataAndRender === "function") {
                _initDataAndRender(function() {
                    _renderCatalog();
                });
            } else {
                if (typeof renderAll === "function") renderAll();
                _renderCatalog();
            }
        } catch (e) {
            console.error("Failed to load analysis:", e);
        }
    });
};

window.catalogDuplicate = function(id) {
    _get(id, function(record) {
        if (!record) return;
        var newId = _genId();
        var newRecord = JSON.parse(JSON.stringify(record));
        newRecord.id = newId;
        newRecord.name = (record.name || "") + " (" + t("catalog.copy") + ")";
        newRecord.createdAt = new Date().toISOString();
        newRecord.updatedAt = new Date().toISOString();
        // Update name inside data too
        try {
            var d = JSON.parse(newRecord.data);
            if (d.context) d.context.societe = newRecord.name;
            newRecord.data = JSON.stringify(d);
        } catch(e) {}
        _put(newRecord, function() {
            _renderCatalog();
            if (typeof showStatus === "function") showStatus(t("catalog.duplicated"));
        });
    });
};

window.catalogRename = function(id) {
    _get(id, function(record) {
        if (!record) return;
        var newName = prompt(t("catalog.rename_prompt"), record.name);
        if (!newName || newName === record.name) return;
        record.name = newName;
        record.updatedAt = new Date().toISOString();
        // Update name inside data too
        try {
            var d = JSON.parse(record.data);
            if (d.context) d.context.societe = newName;
            record.data = JSON.stringify(d);
        } catch(e) {}
        _put(record, function() {
            // If renaming active analysis, update D too
            if (id === _activeId && D.context) {
                D.context.societe = newName;
                var sub = document.getElementById("header-subtitle");
                if (sub) sub.textContent = newName;
            }
            _renderCatalog();
        });
    });
};

window.catalogDelete = function(id) {
    if (!confirm(t("catalog.delete_confirm"))) return;
    _del(id, function() {
        if (id === _activeId) {
            // Switch to another analysis or create new
            _getAll(function(items) {
                if (items.length > 0) {
                    catalogOpen(items[0].id);
                } else {
                    catalogCreate();
                }
            });
        } else {
            _renderCatalog();
        }
    });
};

window.catalogExport = function(id) {
    _get(id, function(record) {
        if (!record) return;
        var fname = (record.name || "analyse").replace(/[^a-zA-Z0-9_-]/g, "_") + "_EBIOS_RM.json";
        var blob = new Blob([record.data], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        a.click();
        URL.revokeObjectURL(a.href);
    });
};

// ═══════════════════════════════════════════════════════════════
// HOOKS INTO FILE MENU (openFile / saveJSON)
// ═══════════════════════════════════════════════════════════════

// Hook openFile: detect multi-analysis JSON and import all
var _origLoadBuffer = window._loadBuffer;
if (_origLoadBuffer) {
    window._loadBuffer = function(buffer, filename) {
        // Try to detect multi-analysis format before passing to original
        try {
            var text = typeof buffer === "string" ? buffer : new TextDecoder().decode(buffer);
            var parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].data) {
                // Multi-analysis import
                var pending = parsed.length;
                var lastId = null;
                parsed.forEach(function(item) {
                    var id = _genId();
                    var record = _buildRecord(id, item.data);
                    record.name = item.name || record.name;
                    record.date = item.date || record.date;
                    lastId = id;
                    _put(record, function() {
                        if (--pending === 0) {
                            catalogOpen(lastId);
                            if (typeof showStatus === "function") showStatus(parsed.length + " " + t("catalog.imported_multi"));
                        }
                    });
                });
                return; // Don't call original
            }
        } catch(e) {
            // Not JSON or not multi — fall through to original
        }
        // Single analysis: call original, then save to catalog
        _origLoadBuffer(buffer, filename);
        // After load, save the new D to catalog as a new entry
        setTimeout(function() {
            var id = _genId();
            _activeId = id;
            localStorage.setItem("ebios_catalog_active", id);
            _autoSave();
        }, 200);
    };
}

// Hook saveJSON: offer choice between single and all
var _origSaveJSON = window.saveJSON;
if (_origSaveJSON) {
    window.saveJSON = function() {
        _getAll(function(items) {
            if (items.length <= 1) {
                // Only one analysis, save normally
                _origSaveJSON();
                return;
            }
            // Ask: export current or all?
            var choice = confirm(t("catalog.save_all_prompt"));
            if (choice) {
                // Export all
                catalogExportAll();
            } else {
                // Export current only
                _origSaveJSON();
            }
        });
    };
}

window.catalogExportAll = function() {
    _getAll(function(items) {
        if (items.length === 0) return;
        var allData = items.map(function(item) {
            return {
                id: item.id,
                name: item.name,
                date: item.date,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                stats: item.stats,
                data: JSON.parse(item.data)
            };
        });
        var blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
        var fname = "EBIOS_RM_toutes_analyses_" + new Date().toISOString().slice(0, 10) + ".json";
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        a.click();
        URL.revokeObjectURL(a.href);
        if (typeof showStatus === "function") showStatus(t("catalog.exported_all"));
    });
};

window.catalogImport = function() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = function() {
        if (!input.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var parsed = JSON.parse(e.target.result);

                // Detect multi-analysis export (array of {id, name, data})
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].data) {
                    var pending = parsed.length;
                    var lastId = null;
                    parsed.forEach(function(item) {
                        var id = _genId();
                        var record = _buildRecord(id, item.data);
                        record.name = item.name || record.name;
                        record.date = item.date || record.date;
                        record.createdAt = item.createdAt || record.createdAt;
                        lastId = id;
                        _put(record, function() {
                            if (--pending === 0) {
                                catalogOpen(lastId);
                                if (typeof showStatus === "function") showStatus(parsed.length + " " + t("catalog.imported_multi"));
                            }
                        });
                    });
                } else {
                    // Single analysis import
                    var id = _genId();
                    var record = _buildRecord(id, parsed);
                    _put(record, function() {
                        catalogOpen(id);
                        if (typeof showStatus === "function") showStatus(t("catalog.imported"));
                    });
                }
            } catch (err) {
                alert(t("catalog.import_error"));
            }
        };
        reader.readAsText(input.files[0]);
    };
    input.click();
};

// ═══════════════════════════════════════════════════════════════
// CATALOG UI (rendered in sidebar)
// ═══════════════════════════════════════════════════════════════

var _catalogFilter = "";

window.catalogSearch = function(val) {
    _catalogFilter = (val || "").toLowerCase();
    _renderCatalog();
};

function _renderCatalog() {
    var el = document.getElementById("analysis-catalog");
    if (!el) return;

    _getAll(function(items) {
        var h = '';
        var q = _catalogFilter;

        // Search bar (appears when 4+ analyses)
        if (items.length > 3) {
            h += '<div class="catalog-actions-bar">';
            h += '<input type="text" class="catalog-search" placeholder="🔍 ' + esc(t("catalog.search")) + '" value="' + esc(q) + '" data-input="catalogSearch" data-pass-value data-stop>';
            h += '</div>';
        }

        // Filter
        var filtered = items;
        if (q) {
            filtered = items.filter(function(item) {
                var haystack = ((item.name || "") + " " + (item.date || "")).toLowerCase();
                return haystack.indexOf(q) >= 0;
            });
        }

        // Analysis list
        if (filtered.length === 0) {
            h += '<div class="catalog-empty">' + t(q ? "catalog.no_results" : "catalog.empty") + '</div>';
        } else {
            for (var i = 0; i < filtered.length; i++) {
                var item = filtered[i];
                var isActive = item.id === _activeId;
                var stats = item.stats || {};
                var statsStr = (stats.vm || 0) + " VM, " + (stats.bs || 0) + " BS, " + (stats.ss || 0) + " SS";

                h += '<div class="catalog-card' + (isActive ? ' catalog-active' : '') + '" data-click="catalogOpen" data-args=\'' + _da(item.id) + '\'>';
                h += '<div class="catalog-card-name">' + esc(item.name || t("catalog.unnamed")) + '</div>';
                h += '<div class="catalog-card-meta">';
                if (item.date) h += '<span>' + esc(item.date) + '</span>';
                h += '<span>' + statsStr + '</span>';
                h += '</div>';
                h += '<div class="catalog-card-actions">';
                h += '<button class="catalog-btn-sm" data-click="catalogDuplicate" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.duplicate")) + '">⧉</button>';
                h += '<button class="catalog-btn-sm" data-click="catalogRename" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.rename")) + '">✎</button>';
                h += '<button class="catalog-btn-sm" data-click="catalogExport" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.export")) + '">↓</button>';
                if (!isActive) h += '<button class="catalog-btn-sm catalog-btn-del" data-click="catalogDelete" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.delete")) + '">✕</button>';
                h += '</div>';
                h += '</div>';
            }
        }

        el.innerHTML = h;
    });
}
window._renderCatalog = _renderCatalog;

// ═══════════════════════════════════════════════════════════════
// INIT — Migration + Load active analysis
// ═══════════════════════════════════════════════════════════════

function _initCatalog(cb) {
    // Check for active analysis
    _activeId = localStorage.getItem("ebios_catalog_active") || null;

    _open(function(db) {
        if (!db) { if (cb) cb(); return; }

        // Migration: if no active ID but localStorage has autosave, import it
        if (!_activeId) {
            var lsKey = (_ct().autosaveKey || "ebios_rm_autosave");
            var lsData = localStorage.getItem(lsKey);
            if (lsData) {
                try {
                    var parsed = JSON.parse(lsData);
                    var id = _genId();
                    var record = _buildRecord(id, parsed);
                    _activeId = id;
                    localStorage.setItem("ebios_catalog_active", id);
                    _put(record, function() {
                        if (cb) cb();
                    });
                    return;
                } catch(e) {
                    // Corrupted localStorage, ignore
                }
            }
        }

        // If active ID exists, verify it's still in IndexedDB
        if (_activeId) {
            _get(_activeId, function(record) {
                if (!record) {
                    // Active analysis was deleted, check if others exist
                    _getAll(function(items) {
                        if (items.length > 0) {
                            _activeId = items[0].id;
                            localStorage.setItem("ebios_catalog_active", _activeId);
                        } else {
                            _activeId = null;
                            localStorage.removeItem("ebios_catalog_active");
                        }
                        if (cb) cb();
                    });
                } else {
                    if (cb) cb();
                }
            });
        } else {
            if (cb) cb();
        }
    });
}

// Hook into the app init sequence
// Wait for DOM ready + other scripts loaded
var _origInit = window._appInitCallback;
window._appInitCallback = function() {
    _initCatalog(function() {
        // If no active analysis, create one from current D
        if (!_activeId) {
            _activeId = _genId();
            localStorage.setItem("ebios_catalog_active", _activeId);
            // Save current D (from autosave or init)
            var record = _buildRecord(_activeId, D);
            _put(record);
        }
        // Render catalog
        _renderCatalog();
        // Call original init if exists
        if (_origInit) _origInit();
    });
};

// Also hook into renderAll to keep catalog updated
var _origRenderAll = window.renderAll;
if (_origRenderAll) {
    window.renderAll = function() {
        _origRenderAll();
        _renderCatalog();
    };
}

})();
