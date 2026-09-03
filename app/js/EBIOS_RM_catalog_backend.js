/**
 * EBIOS RM — Analysis Catalog (Backend REST API)
 *
 * Uses RiskAPI for all persistence. Transitions reload the page.
 * Load AFTER risk_api.js and BEFORE EBIOS_RM_app.js.
 */
(function () {
    "use strict";
    var _activeId = localStorage.getItem("ebios_catalog_active") || null;
    var _saveTimer = null;
    // FEAT-33 — server_rev seen at load; sent with the blob PUT (409 = a
    // server-initiated write happened since: reload instead of overwrite).
    var _serverRev = 0;
    var _saveLocked = false;
    var _catalogFilter = "";
    var _renderTimer = null;
    // ═══════════════════════════════════════════════════════════════
    // SAVE LOCK
    // ═══════════════════════════════════════════════════════════════
    function _lockSave() {
        if (_saveTimer) {
            clearTimeout(_saveTimer);
            _saveTimer = null;
        }
        _saveLocked = true;
    }
    // ═══════════════════════════════════════════════════════════════
    // PERSISTENCE ADAPTER
    // ═══════════════════════════════════════════════════════════════
    //
    // Risk backend doesn't have per-entity PATCH routes yet (VM, BS,
    // SS, measures are stored relationally but mutated only via the
    // blob PUT). All three _persist* functions delegate to _autoSave
    // for now. When granular PATCH routes are added to the Risk API,
    // swap this implementation like Vendor's vendor_api.js does.
    //
    // See shared/js/cisotoolbox_local.js for the contract and
    // CLAUDE.md § "Persistence adapter" for the full specification.
    // ═══════════════════════════════════════════════════════════════
    // Blob PUT — used as fallback for unmigrated mutations, import, undo
    window._autoSave = function () {
        if (_saveLocked || !_activeId)
            return;
        if (_saveTimer)
            clearTimeout(_saveTimer);
        var saveId = _activeId;
        _saveTimer = setTimeout(function () {
            _saveTimer = null; // FEAT-33: a fired timer must not keep blocking the focus refresh
            if (_saveLocked || String(saveId) !== String(_activeId))
                return;
            RiskAPI.update(saveId, {
                name: (D.context && D.context.societe) || "",
                data: D,
                expected_server_rev: _serverRev
            }).then(function () {
                _renderCatalog();
            }).catch(function (e) {
                if (e && String(e.message || "").indexOf("API 409") === 0) {
                    alert(t("chrome.stale_conflict"));
                    window.location.reload();
                    return;
                }
                console.error("Autosave failed:", e);
            });
        }, 800);
    };
    // ── Granular persist via PUT /analyses/{id}/{section} ──
    // Each entity route does delete-all + re-insert of the whole section
    // array. This is the same as the blob PUT but only touches one table
    // at a time — faster, less conflict-prone, better audit trail potential.
    var _sectionDirty = {};
    var _sectionFlushTimer = null;
    var _SECTION_MAP = {
        "vm": "vm", "bs": "bs", "pp": "pp", "sr": "sr_list", "ov": "ov_list",
        "srov": "srov", "er": "er", "ss": "ss", "eco": "eco",
        "sop_detail": "sop_detail", "sop_summary": "sop_summary",
        "measures": "measures", "residuals": "residuals", "fair": "fair",
        "socle_anssi": "socle_anssi", "socle_iso": "socle_iso",
        "gravity_scale": "gravity_scale",
        "context": "context", "settings": "settings", "risk_matrix": "risk_matrix"
    };
    function _flushSections() {
        if (_sectionFlushTimer)
            clearTimeout(_sectionFlushTimer);
        _sectionFlushTimer = setTimeout(function () {
            if (_saveLocked || !_activeId)
                return;
            var batch = _sectionDirty;
            _sectionDirty = {};
            var saveId = _activeId;
            for (var section in batch) {
                var urlKey = _SECTION_MAP[section] || section;
                var data = D[section];
                if (data === undefined)
                    continue;
                // Singleton sections (context, settings) send an object, not an array
                RiskAPI._putSection(saveId, urlKey, data).catch(function (e) {
                    console.error("PUT section " + section + " failed:", e);
                });
            }
            _renderCatalog();
        }, 500);
    }
    // Flush pending (debounced) section writes immediately before the page is
    // hidden/unloaded, so a quick reload right after an edit doesn't lose it.
    // keepalive lets the request outlive the page (section bodies are small).
    function _flushNow() {
        if (!_activeId || _saveLocked)
            return;
        if (_sectionFlushTimer) {
            clearTimeout(_sectionFlushTimer);
            _sectionFlushTimer = null;
        }
        var batch = _sectionDirty;
        _sectionDirty = {};
        for (var section in batch) {
            var data = D[section];
            if (data === undefined)
                continue;
            try {
                RiskAPI._putSection(_activeId, _SECTION_MAP[section] || section, data, true);
            }
            catch (e) { /* best effort */ }
        }
    }
    window.addEventListener("pagehide", _flushNow);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden")
        _flushNow(); });
    // FEAT-41 — vidage ATTENDABLE des écritures en attente.
    //
    // Depuis que le serveur relit l'analyse en base pour composer les prompts IA,
    // l'autosave débouncé (800 ms) est devenu un piège : éditer puis cliquer
    // aussitôt sur l'assistant ferait travailler le modèle sur l'état d'avant
    // l'édition, sans que rien ne le signale. `_flushNow` ne convient pas ici —
    // il tire en keepalive, sans rien à attendre.
    window._riskFlushPending = function () {
        if (!_activeId || _saveLocked)
            return Promise.resolve();
        if (_saveTimer) {
            clearTimeout(_saveTimer);
            _saveTimer = null;
        }
        if (_sectionFlushTimer) {
            clearTimeout(_sectionFlushTimer);
            _sectionFlushTimer = null;
        }
        var batch = _sectionDirty;
        _sectionDirty = {};
        var jobs = [];
        for (var section in batch) {
            var data = D[section];
            if (data === undefined)
                continue;
            jobs.push(RiskAPI._putSection(_activeId, _SECTION_MAP[section] || section, data));
        }
        // Le blob PUT couvre les mutations non encore migrées vers _persist.
        jobs.push(RiskAPI.update(_activeId, {
            name: (D.context && D.context.societe) || "",
            data: D,
            expected_server_rev: _serverRev
        }));
        // Un échec d'écriture ne doit pas bloquer la suggestion : le serveur
        // travaillera sur le dernier état enregistré, ce qui reste préférable à
        // un assistant qui refuse de répondre.
        return Promise.all(jobs.map(function (p) { return p.catch(function () { }); }))
            .then(function () { return; });
    };
    window._persist = function (entityType, entityId, fields) {
        if (!_activeId || _saveLocked)
            return;
        _sectionDirty[entityType] = true;
        _flushSections();
    };
    window._persistCreate = function (entityType, data) {
        // A create is just a full section replace (the item was already
        // pushed into D[section] by the caller)
        if (!_activeId || _saveLocked)
            return;
        _sectionDirty[entityType] = true;
        _flushSections();
    };
    window._persistDelete = function (entityType, entityId) {
        // Same: the item was already spliced out of D[section]
        if (!_activeId || _saveLocked)
            return;
        _sectionDirty[entityType] = true;
        _flushSections();
    };
    // Dedicated helper for settings (socle_type) — it lives at the top of D but is
    // persisted via PUT /settings as one body.
    var _settingsDirty = false;
    var _settingsTimer = null;
    window._persistSettings = function () {
        if (!_activeId || _saveLocked)
            return;
        _settingsDirty = true;
        if (_settingsTimer)
            clearTimeout(_settingsTimer);
        _settingsTimer = setTimeout(function () {
            if (!_settingsDirty || !_activeId)
                return;
            _settingsDirty = false;
            var body = {
                socle_type: D.socle_type || "anssi",
            };
            RiskAPI._putSection(_activeId, "settings", body)
                .catch(function (e) { console.error("PUT settings failed:", e); });
        }, 500);
    };
    // ═══════════════════════════════════════════════════════════════
    // CATALOG CRUD
    // ═══════════════════════════════════════════════════════════════
    window.catalogCreate = function () {
        if (!confirm(t("confirm_new", { label: t(_ct().labelKey || "analysis") })))
            return;
        _lockSave();
        var init = window[_ct().initDataVar || "EBIOS_INIT_DATA"];
        RiskAPI.create({ name: "", data: init ? JSON.parse(JSON.stringify(init)) : {} }).then(function (created) {
            localStorage.setItem("ebios_catalog_active", String(created.id));
            window.location.reload();
        }).catch(function (e) { _saveLocked = false; alert("Error: " + e.message); });
    };
    window.catalogOpen = function (id) {
        if (String(id) === String(_activeId))
            return;
        _lockSave();
        localStorage.setItem("ebios_catalog_active", String(id));
        window.location.reload();
    };
    window.catalogDelete = function (id) {
        if (!confirm(t("catalog.delete_confirm")))
            return;
        _lockSave();
        RiskAPI.del(id).then(function () {
            if (String(id) === String(_activeId))
                localStorage.removeItem("ebios_catalog_active");
            window.location.reload();
        }).catch(function (e) { _saveLocked = false; alert("Error: " + e.message); });
    };
    window.catalogDuplicate = function (id) {
        RiskAPI.duplicate(id).then(function () {
            _renderCatalog();
            showStatus(t("catalog.duplicated"));
        }).catch(function (e) { alert("Error: " + e.message); });
    };
    window.catalogRename = function (id) {
        RiskAPI.get(id).then(function (a) {
            if (!a)
                return;
            var data = typeof a.data === "string" ? undefined : a.data;
            var cur = a.name || (data && data.context && data.context.societe) || "";
            const newName = prompt(t("catalog.rename_prompt"), cur);
            if (!newName || newName === cur)
                return;
            return RiskAPI.update(id, { name: newName }).then(function () {
                if (String(id) === String(_activeId) && D.context) {
                    D.context.societe = newName;
                    var sub = document.getElementById("header-subtitle");
                    if (sub)
                        sub.textContent = newName;
                }
                _renderCatalog();
            });
        }).catch(function (e) { alert("Error: " + e.message); });
    };
    window.catalogExport = function (id) {
        RiskAPI.get(id).then(function (a) {
            if (!a)
                return;
            var d = typeof a.data === "string" ? a.data : JSON.stringify(a.data, null, 2);
            var fname = (a.name || "analyse").replace(/[^a-zA-Z0-9_-]/g, "_") + "_EBIOS_RM.json";
            var blob = new Blob([d], { type: "application/json" });
            var link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fname;
            link.click();
            URL.revokeObjectURL(link.href);
        }).catch(function (e) { alert("Error: " + e.message); });
    };
    window.catalogSearch = function (q) {
        _catalogFilter = (q || "").toLowerCase().trim();
        _renderCatalog();
    };
    // ═══════════════════════════════════════════════════════════════
    // RENDER CATALOG SIDEBAR (debounced)
    // ═══════════════════════════════════════════════════════════════
    function _renderCatalog() {
        if (_renderTimer)
            clearTimeout(_renderTimer);
        _renderTimer = setTimeout(_doRender, 200);
    }
    function _doRender() {
        var el = document.getElementById("analysis-catalog");
        if (!el)
            return;
        RiskAPI.list().then(function (items) {
            var h = "", q = _catalogFilter;
            if (items.length > 3) {
                h += '<div class="catalog-actions-bar">';
                h += '<input type="text" class="catalog-search" placeholder="\uD83D\uDD0D ' + esc(t("catalog.search")) + '" value="' + esc(q) + '" data-input="catalogSearch" data-pass-value data-stop>';
                h += '</div>';
            }
            var filtered = q ? items.filter(function (it) {
                return ((it.name || "") + " " + (it.organization || "")).toLowerCase().indexOf(q) >= 0;
            }) : items;
            if (!filtered.length) {
                h += '<div class="catalog-empty">' + t(q ? "catalog.no_results" : "catalog.empty") + '</div>';
            }
            else {
                for (var i = 0; i < filtered.length; i++) {
                    var item = filtered[i];
                    var isActive = String(item.id) === String(_activeId);
                    var name = isActive ? ((D.context && D.context.societe) || item.name) : item.name;
                    var statsStr = "";
                    if (isActive) {
                        statsStr = (D.vm || []).length + " VM, " + (D.bs || []).length + " BS, " + (D.ss || []).length + " SS";
                    }
                    else if (item.vm_count != null) {
                        statsStr = (item.vm_count || 0) + " VM, " + (item.bs_count || 0) + " BS, " + (item.ss_count || 0) + " SS";
                    }
                    h += '<div class="catalog-card' + (isActive ? ' catalog-active' : '') + '" data-click="catalogOpen" data-args=\'' + _da(item.id) + '\'>';
                    h += '<div class="catalog-card-name">' + esc(name || t("catalog.unnamed")) + '</div>';
                    h += '<div class="catalog-card-meta">';
                    if (statsStr)
                        h += '<span>' + statsStr + '</span>';
                    h += '</div>';
                    h += '<div class="catalog-card-actions">';
                    h += '<button class="ct-btn ct-tip" data-size="xs" data-variant="ghost" data-icon data-click="catalogDuplicate" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.duplicate")) + '">\u29C9</button>';
                    h += '<button class="ct-btn ct-tip" data-size="xs" data-variant="ghost" data-icon data-click="catalogRename" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.rename")) + '">\u270E</button>';
                    h += '<button class="ct-btn ct-tip" data-size="xs" data-variant="ghost" data-icon data-click="catalogExport" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.export")) + '">\u2193</button>';
                    if (!isActive)
                        h += '<button class="ct-btn ct-tip" data-size="xs" data-variant="danger" data-icon data-click="catalogDelete" data-args=\'' + _da(item.id) + '\' data-stop data-tip="' + esc(t("catalog.delete")) + '">' + _icon("trash", 14) + '</button>';
                    h += '</div>';
                    h += '</div>';
                }
            }
            el.innerHTML = h;
        }).catch(function () { });
    }
    window._renderCatalog = _renderCatalog;
    // ═══════════════════════════════════════════════════════════════
    // INIT — Load active analysis from API
    // ═══════════════════════════════════════════════════════════════
    window._appInitCallback = function () {
        RiskAPI.list().then(function (analyses) {
            if (!analyses || !analyses.length) {
                var init = window[_ct().initDataVar || "EBIOS_INIT_DATA"];
                return RiskAPI.create({ name: "", data: init ? JSON.parse(JSON.stringify(init)) : {} }).then(function (created) {
                    _activeId = String(created.id);
                    localStorage.setItem("ebios_catalog_active", _activeId);
                    return RiskAPI.get(_activeId);
                });
            }
            var savedId = localStorage.getItem("ebios_catalog_active");
            // FEAT-13 — a Pilot deep link (?entity=<analysis id>) targets a
            // precise analysis: it wins over the saved choice.
            try {
                var _dlEntity = new URLSearchParams(window.location.search).get("entity");
                if (_dlEntity && analyses.some(function (a) { return String(a.id) === _dlEntity; }))
                    savedId = _dlEntity;
            }
            catch (e) { /* ignore */ }
            var found = analyses.find(function (a) { return String(a.id) === savedId; });
            _activeId = String(found ? found.id : analyses[0].id);
            localStorage.setItem("ebios_catalog_active", _activeId);
            return RiskAPI.get(_activeId);
        }).then(function (analysis) {
            if (analysis)
                _serverRev = analysis.server_rev || 0;
            if (analysis && analysis.data) {
                var d = typeof analysis.data === "string" ? JSON.parse(analysis.data) : analysis.data;
                Object.keys(D).forEach(function (k) { delete D[k]; });
                Object.assign(D, d);
            }
            if (typeof ensureKeys === "function")
                ensureKeys();
            if (typeof _initDataAndRender === "function") {
                _initDataAndRender(function () {
                    _installRenderAllHook();
                    _renderCatalog();
                    _handleMeasureDeepLink();
                });
            }
            else {
                if (typeof renderAll === "function")
                    renderAll();
                _installRenderAllHook();
                _renderCatalog();
                _handleMeasureDeepLink();
            }
        }).catch(function (e) {
            console.error("Init failed:", e);
            if (typeof _initDataAndRender === "function")
                _initDataAndRender();
        });
    };
    // FEAT-13 — deep-linked measure (?measure=<analysisid:m-001>). Risk edits
    // measures inline in the table, so "open the editor" = select the panel and
    // focus the targeted row (shared highlight helper). The composite source_id
    // is de-namespaced on ":" (the analysis part was consumed at boot).
    function _handleMeasureDeepLink() {
        if (typeof window.ct_handleMeasureDeepLink !== "function")
            return;
        window.ct_handleMeasureDeepLink({ open: function (mid) {
                var local = mid.indexOf(":") >= 0 ? (mid.split(":").pop() || mid) : mid;
                var measures = (D && D.measures) || [];
                if (!measures.some(function (m) { return m.id === local; }))
                    return false;
                if (typeof selectPanel === "function")
                    selectPanel("measures");
                setTimeout(function () {
                    if (typeof window.ct_highlightMeasureRow === "function")
                        window.ct_highlightMeasureRow(local);
                }, 150);
                return true;
            } });
    }
    // ═══════════════════════════════════════════════════════════════
    // HOOK: _loadBuffer — Save loaded file as new analysis
    // ═══════════════════════════════════════════════════════════════
    var _origLoadBuffer = window._loadBuffer;
    if (typeof _origLoadBuffer === "function") {
        window._loadBuffer = async function (buffer, filename) {
            var ok = await _origLoadBuffer(buffer, filename);
            if (!ok)
                return ok;
            // D is now populated — save as new analysis
            _lockSave();
            try {
                var created = await RiskAPI.create({
                    name: (D.context && D.context.societe) || "",
                    data: D
                });
                _activeId = String(created.id);
                localStorage.setItem("ebios_catalog_active", _activeId);
                _saveLocked = false;
                _renderCatalog();
            }
            catch (e) {
                _saveLocked = false;
            }
            return ok;
        };
    }
    // ═══════════════════════════════════════════════════════════════
    // HOOK: renderAll — installed after app.js loads (deferred)
    // ═══════════════════════════════════════════════════════════════
    function _installRenderAllHook() {
        var _ra = window.renderAll;
        if (_ra && !_ra._hooked) {
            var _orig = _ra;
            window.renderAll = function () {
                _orig();
                _renderCatalog();
            };
            window.renderAll._hooked = true;
        }
    }
    // FEAT-33 — refresh on tab focus when a server-initiated write happened
    // while the tab was hidden. Skipped while a save is pending/locked.
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible" || !_activeId || _saveLocked || _saveTimer)
            return;
        RiskAPI.get(_activeId).then(function (analysis) {
            if (!analysis || (analysis.server_rev || 0) === _serverRev)
                return;
            _serverRev = analysis.server_rev || 0;
            var d = typeof analysis.data === "string" ? JSON.parse(analysis.data) : analysis.data;
            Object.keys(D).forEach(function (k) { delete D[k]; });
            Object.assign(D, d || {});
            if (typeof ensureKeys === "function")
                ensureKeys();
            if (typeof renderAll === "function")
                renderAll();
            showStatus(t("chrome.stale_refreshed"));
        }).catch(function () { });
    });
})();
