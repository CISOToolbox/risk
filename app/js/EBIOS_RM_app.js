// ═══════════════════════════════════════════════════════════════════════
// CONFIG & DATA
// ═══════════════════════════════════════════════════════════════════════
window.CT_CONFIG = {
    edition: "suite",
    module: "risk",
    deployed: ["risk", "compliance", "audit", "vendor", "asset", "pilot", "appsec", "surface", "access", "watch"],
    autosaveKey: "ebios_rm_autosave",
    initDataVar: "EBIOS_INIT_DATA",
    descNamespace: "EBIOS_DESCRIPTIONS",
    labelKey: "ebios.label",
    filePrefix: "EBIOS_RM",
    getSociete: function (d) { return d && d.context ? d.context.societe : ""; },
    getDate: function (d) { return d && d.context ? d.context.date : ""; },
    getScope: function (d) { return "EBIOS_RM"; }
};
// FEAT-36 — schema versioning (rev 1 = normalized baseline; bump + add a
// migration + archive a fixture whenever the exported data model changes).
window.SCHEMA_REV = 1;
let D = JSON.parse(JSON.stringify(window.EBIOS_INIT_DATA || {}));
// ── Lazy loading of the companion asset files ───────────────────────────
// Files generated in the same directory as the HTML:
//   "js/EBIOS_RM"_descriptions.js   → Socle tab (ANSSI/ISO descriptions)
//   "js/EBIOS_RM"_ref_<id>.js       → one file per framework (loaded on activation)
//   "js/EBIOS_RM"_template.js       → Excel export (base64 template)
const _ASSET_BASE = "js/EBIOS_RM";
// _descriptionsLoaded, _ensureDescriptions, _initDataAndRender
// are defined in cisotoolbox.js — do not redeclare here.
var _templateLoaded = false;
function _ensureTemplate(cb) {
    if (_templateLoaded) {
        cb();
        return;
    }
    _loadAsset(_ASSET_BASE + "_template.js", () => {
        _templateLoaded = true;
        cb();
    });
}
// _getAnssDesc/_getIsoDesc defined in cisotoolbox.js (uses CT_CONFIG.descNamespace + locale)
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// Serializes the arguments to JSON for data-args (safe in a single-quoted HTML attribute)
// ── Wrapper functions for complex handlers ──────────────────────────────
function _triggerExcelInput() {
    document.getElementById("excel-input").click();
}
function _updateFieldFromEl(el) {
    const s = el.getAttribute("data-s");
    const i = parseInt(el.getAttribute("data-i"));
    const f = el.getAttribute("data-f");
    const typ = el.getAttribute("data-t") || undefined;
    updateField(s, i, f, el.value, typ);
}
function _setContextField(key, val) {
    D.context[key] = val;
    renderContext();
    _persist("context");
}
function _setGravityField(idx, field, rerender, val) {
    D.gravity_scale[idx][field] = val;
    if (rerender)
        renderAll();
    _persist("gravity_scale");
}
// Canonical risk level keys (always stored in FR)
var _RISK_CANONICAL = { "Élevé": "Élevé", "Elevé": "Élevé", "Eleve": "Élevé", "High": "Élevé", "Moyen": "Moyen", "Medium": "Moyen", "Faible": "Faible", "Low": "Faible" };
function _toCanonicalRisk(val) { return _RISK_CANONICAL[val] || val; }
function _displayRisk(val) {
    var canon = _toCanonicalRisk(val);
    if (canon === "Élevé")
        return t("ebios.risk.eleve");
    if (canon === "Moyen")
        return t("ebios.risk.moyen");
    if (canon === "Faible")
        return t("ebios.risk.faible");
    return val;
}
function _setRiskMatrix(ri, vi, val) {
    D.risk_matrix[ri].levels[vi] = _toCanonicalRisk(val);
    renderContext();
    renderSynthesis();
    _persist("risk_matrix");
}
function _effBadgeClick(el) {
    const s = el.nextElementSibling;
    s.style.display = "inline";
    el.style.display = "none";
    const sl = s.querySelector("select");
    if (sl) {
        sl.focus();
        sl.click();
        try {
            sl.showPicker();
        }
        catch (e) { }
    }
}
function _newSRFor(idx) {
    const id = newSR();
    if (id)
        updateSROVRef(idx, "sr_id", id);
}
function _newOVFor(idx) {
    const id = newOV();
    if (id)
        updateSROVRef(idx, "ov_id", id);
}
// Delegation click/change/input: see cisotoolbox.js
// ═══════════════════════════════════════════════════════════════════════
// COMPUTATIONS
// ═══════════════════════════════════════════════════════════════════════
function computeMenace(d, p, m, c) {
    if (!d || !p || !m || !c)
        return null;
    return Math.round((p * d) / (m * c) * 100) / 100;
}
function computeExposition(menace) {
    if (menace === null)
        return "";
    if (menace >= 4)
        return t("ebios.expo.critique");
    if (menace >= 2)
        return t("ebios.expo.elevee");
    if (menace >= 1)
        return t("ebios.expo.moderee");
    return t("ebios.expo.faible");
}
// ── Color helpers using CT_COLORS from cisotoolbox.js ──
// The tone is enough: .ct-badge[data-tone] already carries the -tint / -ink
// pair in both themes. The inline style that duplicated it was a workaround
// from when badges lived on .badge, the colorless v1 primitive.
var _CT_TONES = { red: "critical", redDark: "critical", redMax: "critical", orange: "high", yellow: "medium", green: "low", blue: "info", gray: "neutral" };
function _tBadge(text, colorName) {
    if (!text)
        return "";
    return '<span class="ct-badge" data-tone="' + (_CT_TONES[colorName] || "neutral") + '">' + esc(text) + '</span>';
}
function _riskColorName(level) {
    if (!level)
        return "gray";
    var reds = ["Élevé", "Elevé", "Eleve", t("ebios.risk.eleve")];
    var oranges = ["Moyen", t("ebios.risk.moyen")];
    var greens = ["Faible", t("ebios.risk.faible")];
    if (reds.indexOf(level) !== -1)
        return "red";
    if (oranges.indexOf(level) !== -1)
        return "orange";
    if (greens.indexOf(level) !== -1)
        return "green";
    return "gray";
}
function riskColor(level) { return ctColor(_riskColorName(level)).vivid; }
// Matrices and G×V editor: DS tokens (theme-aware) instead of the CT_COLORS
// pastels — same values as the legends, so legend ≡ cells ≡ badges.
// SVG→PNG exports go through _svgResolveTokens (light hex, report background).
function _riskTone(level) { return _CT_TONES[_riskColorName(level)] || "neutral"; }
function _riskBg(level) { return "var(--ct-" + _riskTone(level) + "-fill)"; }
function _riskTxt(level) { return "var(--ct-" + _riskTone(level) + "-ink)"; }
function _riskBadge(text) { return _tBadge(text, _riskColorName(text)); }
function _expoColorName(expo) {
    var m = {};
    m[t("ebios.expo.critique")] = "red";
    m[t("ebios.expo.elevee")] = "orange";
    m[t("ebios.expo.moderee")] = "yellow";
    m[t("ebios.expo.faible")] = "green";
    return m[expo] || "gray";
}
function _expoBadge(text) { return _tBadge(text, _expoColorName(text)); }
// Severity scale chips: DS tokens (theme-aware) instead of the CT_COLORS
// pastels; the max level takes the "extreme" tone (--ebios-extreme, same
// logic as the max cell of the vendor matrices). Screen only.
var _GRAV_TONES = ["low", "medium", "high", "critical"];
function gravColor(n) {
    var i = Math.max(0, Math.min(n - 1, 4));
    return i === 4 ? "var(--ebios-extreme, var(--ct-critical-tint))" : "var(--ct-" + _GRAV_TONES[i] + "-tint)";
}
function gravTextColor(n) {
    var i = Math.max(0, Math.min(n - 1, 4));
    return "var(--ct-" + (i === 4 ? "critical" : _GRAV_TONES[i]) + "-ink)";
}
// Severity badge: same -tint/-ink tokens as the severity scale chips and the
// rest of the module (ctBadgeLevel would emit a solid base+white [data-fill],
// misaligned); max level → "extreme" tone, like gravColor().
function _gravBadge(text, n) {
    if (!text)
        return "";
    var i = Math.max(0, Math.min(n - 1, 4));
    if (i === 4)
        return '<span class="ct-badge" style="background:var(--ebios-extreme,var(--ct-critical-tint));color:var(--ct-critical-ink)">' + esc(text) + '</span>';
    return '<span class="ct-badge" data-tone="' + _GRAV_TONES[i] + '">' + esc(text) + '</span>';
}
function _socleBadge(text) {
    var m = {};
    m[t("ebios.socle.applique")] = "green";
    m[t("ebios.socle.partiel")] = "orange";
    m[t("ebios.socle.non_applique")] = "red";
    return _tBadge(text, m[text] || "gray");
}
function _prioBadge(text) {
    var m = {};
    m[t("ebios.socle.priorite_haute")] = "red";
    m[t("ebios.socle.priorite_moyenne")] = "orange";
    m[t("ebios.socle.priorite_basse")] = "green";
    return _tBadge(text, m[text] || "gray");
}
// Measure status is STORED as a French literal (data model unchanged); only
// the display is translated. _normStatut maps the stored value to a canonical
// i18n suffix; the badge/label/color all key on that suffix, so a locale switch
// re-renders in the active language while the stored value stays canonical.
var _STATUT_KEYS = {
    "Terminé": "termine", "En cours": "en_cours",
    "À étudier": "a_etudier", "A étudier": "a_etudier",
    "À lancer": "a_lancer", "A lancer": "a_lancer",
    "Planifié": "planifie",
};
function _normStatut(raw) {
    return _STATUT_KEYS[String(raw || "").trim()] || null;
}
function _statutLabel(raw) {
    var k = _normStatut(raw);
    return k ? t("ebios.m.statut_" + k) : String(raw || "");
}
function _statutBadge(text) {
    var tones = { termine: "green", en_cours: "orange", a_etudier: "red", a_lancer: "gray", planifie: "blue" };
    var k = _normStatut(text);
    return _tBadge(_statutLabel(text), (k && tones[k]) || "gray");
}
var _effTones = { "Absent": "critical", "Partiel": "high", "Efficace": "low", "Partial": "high", "Effective": "low" };
function _effBadge(count, text, type) {
    if (!count)
        return "";
    return '<span class="ct-badge" data-tone="' + (_effTones[type] || "neutral") + '">' + count + ' ' + esc(text) + '</span>';
}
function _origineBadge(text) {
    var m = { "Socle": "green", "\u00c9cosyst\u00e8me": "yellow", "SOP": "orange", "Compl\u00e9mentaire": "blue" };
    return _tBadge(text, m[text] || "gray");
}
// gravTextColor now uses ctColorLevel from CT_COLORS
function gravLabel(n) {
    const gs = D.gravity_scale.find(g => String(g.niveau) === String(n));
    return gs ? gs.label : "";
}
function riskLevel(gNum, v) {
    if (!gNum || !v)
        return "";
    for (const row of D.risk_matrix) {
        try {
            if (parseInt(String(row.g)) === parseInt(String(gNum)))
                return _displayRisk(row.levels[parseInt(String(v)) - 1] || "");
        }
        catch (e) { }
    }
    return "";
}
function socleStatut(conf) {
    if (conf === "" || conf === null)
        return "";
    if (conf >= 80)
        return t("ebios.socle.applique");
    if (conf > 0)
        return t("ebios.socle.partiel");
    return t("ebios.socle.non_applique");
}
function soclePriorite(conf) {
    if (conf === "" || conf === null)
        return "";
    if (conf < 30)
        return t("ebios.socle.priorite_haute");
    if (conf < 60)
        return t("ebios.socle.priorite_moyenne");
    return t("ebios.socle.priorite_basse");
}
// SS severity = MAX of the severities of the associated ERs.
// erList looks like "ER-001 - Évé… , ER-002 - Autre" — extract the ID via regex
// (zero-padding may vary depending on the version that generated the JSON).
// Normalizes "ER-01" / "ER-001" / "ER-1" -> "ER-1" for a match TOLERANT to the
// zero-padding: the SS->ER link (s.er) and the ER's actual id (D.er[].id) can
// have a different padding depending on the version that generated the data,
// and an exact `e.id === eid` match then failed silently (empty SS severity
// while the ERs did have one — BUG-16).
function _erIdKey(id) {
    const m = String(id || "").trim().match(/^ER-0*(\d+)/i);
    return m ? "ER-" + m[1] : String(id || "").trim();
}
function computeSSGravity(erList) {
    if (!erList)
        return "";
    let max = 0;
    const ids = erList.split(",")
        .map(s => (s.trim().match(/^ER-\d+/) || [""])[0])
        .filter(Boolean)
        .map(_erIdKey);
    for (const eid of ids) {
        const er = D.er.find(e => _erIdKey(e.id) === eid);
        if (er && Number(er.gravite) > max)
            max = Number(er.gravite);
    }
    return max || "";
}
// ═══════════════════════════════════════════════════════════════════════
// _confirmDialog() is provided by cisotoolbox.js
// ═══════════════════════════════════════════════════════════════════════
function _range(a, b) { const r = []; for (let i = Math.max(1, a || 1); i <= Math.min(4, b || 4); i++)
    r.push(i); return r; }
function inp(section, idx, field, val, type = "text", cls = "") {
    // Retro-compat: a date field with a legacy non-ISO value stays a text input so
    // the old value stays visible/editable; ISO (YYYY-MM-DD) or empty gets the picker.
    if (type === "date" && val != null && val !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(String(val)))
        type = "text";
    const w = type === "number" ? 'class="w-70" min="0" max="999999999999"' : 'maxlength="2000"';
    return `<input type="${type}" value="${esc(val)}" ${w} class="${cls}" data-s="${section}" data-i="${idx}" data-f="${field}" data-t="${type}" data-change="_updateFieldFromEl" data-pass-el />`;
}
// labelFn (optional) translates the DISPLAYED option label while the stored
// value stays the option itself — used by the status select so the dropdown
// tracks the badge on a locale switch without changing the stored value.
function sel(section, idx, field, val, options, labelFn) {
    let h = `<select data-s="${section}" data-i="${idx}" data-f="${field}" data-change="_updateFieldFromEl" data-pass-el>`;
    h += `<option value=""></option>`;
    for (const o of options)
        h += `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${labelFn ? esc(String(labelFn(o))) : o}</option>`;
    h += `</select>`;
    return h;
}
function ta(section, idx, field, val) {
    const rows = Math.max(2, Math.ceil((val || "").length / 40));
    return `<textarea rows="${rows}" data-s="${section}" data-i="${idx}" data-f="${field}" data-change="_updateFieldFromEl" data-pass-el data-input="_autoHeight" data-pass-el>${esc(val)}</textarea>`;
}
function delBtn(section, idx) {
    return `<button class="ct-btn" data-variant="danger" data-size="xs" data-click="delRow" data-args='${_da(section, idx)}' data-icon>${_icon("trash", 14)}</button>`;
}
// MITRE ATT&CK Enterprise tactics in canonical order — used as the vocabulary
// for operational scenario (SOP) phases. The stored value is the tactic id
// (TA00xx) or, for retro-compat, free text. Labels come from i18n.
const MITRE_TACTICS = ["TA0043", "TA0042", "TA0001", "TA0002", "TA0003", "TA0004", "TA0005", "TA0006", "TA0007", "TA0008", "TA0009", "TA0011", "TA0010", "TA0040"];
function _attackResolveId(value) {
    const v = String(value || "").replace(/^\d+\.\s*/, "").trim();
    if (!v)
        return "";
    if (MITRE_TACTICS.indexOf(v) >= 0)
        return v;
    // Mixed form — "TA0001 Initial Access", "TA0001 - Accès initial",
    // "(TA0001)". This is what a model readily returns when asked for an
    // identifier while being shown the list with its labels.
    const embedded = v.match(/\bTA\d{4}\b/);
    if (embedded && MITRE_TACTICS.indexOf(embedded[0]) >= 0)
        return embedded[0];
    const lc = v.toLowerCase();
    for (const id of MITRE_TACTICS)
        if (t("ebios.attack." + id).toLowerCase() === lc)
            return id;
    return "";
}
function _attackLabel(value) {
    const id = _attackResolveId(value);
    if (id)
        return t("ebios.attack." + id);
    return String(value || "").replace(/^\d+\.\s*/, "").trim();
}
function _sopPhaseSelect(idx, value) {
    const tid = _attackResolveId(value);
    const raw = String(value || "").replace(/^\d+\.\s*/, "").trim();
    const isFree = !tid && !!raw;
    let h = `<select data-change="_setSOPPhase" data-args='${_da(idx)}' data-pass-value>`;
    h += `<option value=""${!tid && !isFree ? " selected" : ""}>—</option>`;
    for (const id of MITRE_TACTICS)
        h += `<option value="${id}"${tid === id ? " selected" : ""}>${esc(t("ebios.attack." + id))}</option>`;
    h += `<option value="__other__"${isFree ? " selected" : ""}>${esc(t("ebios.sop.phase_other"))}</option>`;
    h += `</select>`;
    if (isFree)
        h += ` <input type="text" value="${esc(raw)}" data-change="_setSOPPhaseText" data-args='${_da(idx)}' data-pass-value maxlength="2000" />`;
    return h;
}
function dictToggle(section, idx, field, val) {
    const dims = ["D", "I", "C", "T"];
    const selected = (val || "").split(",").map(s => s.trim()).filter(Boolean);
    // .ct-choice carries the state via aria-pressed: announced by screen
    // readers, unlike the old .active class. And <button> rather than <div>
    // makes the toggles keyboard-focusable.
    let h = '<div class="ct-choice" data-size="xs">';
    for (const d of dims) {
        // Stored value stays the canonical French letter (D/I/C/T); only the
        // shown letter is localized (A/I/C/T in English) with the full criterion
        // name as tooltip.
        var short = t("ebios.dict." + d.toLowerCase() + "_short");
        var full = t("ebios.dict." + d.toLowerCase());
        h += `<button type="button" aria-pressed="${selected.includes(d)}" title="${esc(full)}" data-click="toggleDICT" data-args='${_da(section, idx, field, d)}' data-pass-el>${esc(short)}</button>`;
    }
    h += '</div>';
    return h;
}
function toggleDICT(section, idx, field, dim, el) {
    const current = (D[section][idx][field] || "").split(",").map((s) => s.trim()).filter(Boolean);
    const pos = current.indexOf(dim);
    if (pos >= 0)
        current.splice(pos, 1);
    else
        current.push(dim);
    // Sort in D, I, C, T order
    const order = ["D", "I", "C", "T"];
    current.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    D[section][idx][field] = current.join(", ");
    // Both the visual state and the vocal announcement go through aria-pressed
    // (see dictToggle and .ct-choice > button[aria-pressed="true"]). Toggling
    // .active changed nothing: that class has no rule for these buttons, and
    // the state only showed up on the next re-render.
    el.setAttribute("aria-pressed", String(current.includes(dim)));
    _persist(section);
    showStatus(t("ebios.status.modified"));
}
// ── Multi-reference selector ──
// options = [{id:"VM-01", label:"Gestion des Taux"}, ...]
// val = "VM-01 - Gestion des Taux, VM-02 - Gestion des Actions" (string, comma-separated)
let _refCounter = 0;
function refSelect(section, idx, field, val, options, single) {
    const uid = "ref" + (_refCounter++);
    ctRefRegister(uid, {
        single: !!single,
        emptyText: t("ebios.misc.click_choose"),
        labelFor: id => _refLabelFor(section, field, id),
        onToggle: (u, ids, el) => _refOnToggle(u, section, idx, field, ids, el, !!single),
        onRemove: (u, removeId) => _refOnRemove(section, idx, field, removeId),
        onFlush: () => _refOnFlush(section, field),
    });
    return ctRefSelect(uid, val, options, {
        placeholder: t("ebios.misc.filter"),
        emptyText: t("ebios.misc.click_choose"),
        single: !!single,
    });
}
function _refOnToggle(uid, section, idx, field, ids, el, single) {
    _saveState();
    const parts = ids.map(id => {
        const label = _refLabelFor(section, field, id);
        return label ? id + " - " + label : id;
    });
    const val = parts.join(", ");
    if ((field === "sr_id" || field === "ov_id") && section === "srov") {
        const selectedId = ids.length > 0 ? ids[0] : "";
        D[section][idx][field] = selectedId;
        updateSROVRef(idx, field, selectedId);
        return;
    }
    var oldVal = D[section][idx][field];
    D[section][idx][field] = val;
    if (section === "sop_detail" && field === "mesure_proposee") {
        _syncSopMeasuresToResiduals(idx, oldVal, val);
    }
    if (single) {
        if (section === "eco")
            _ecoSyncColumns(idx, field, el ? el.value : "", el ? el.checked : false);
        _reRenderForField(section, field);
    }
    else {
        if (section === "eco")
            _ecoSyncColumns(idx, field, el ? el.value : "", el ? el.checked : false);
    }
    _persist(section);
}
function _refOnRemove(section, idx, field, removeId) {
    _saveState();
    const current = D[section][idx][field] || "";
    const parts = current.split(",").map((s) => s.trim()).filter((s) => !s.startsWith(removeId));
    D[section][idx][field] = parts.join(", ");
    _reRenderForField(section, field);
    _persist(section);
}
function _refOnFlush(section, field) {
    if (section.startsWith("comp_"))
        return;
    _reRenderForField(section, field);
}
// Which field points to which section. Used to resolve a label, and to find
// what references a row before deleting it.
const _FIELD_TO_SOURCE = {
    "vm": "vm", "bs": "bs", "pp": "pp", "er": "er",
    "couple_id": "srov", "sop": "sop",
    "mesures": "measures", "mesures_existantes": "measures", "mesures_complementaires": "measures",
    "mesure_proposee": "measures", "mesures_prevues": "measures", "pp_id": "pp", "ss": "ss",
    "sr_id": "sr", "ov_id": "ov",
    "ref": "socle", "ref_socle": "socle",
};
function _refLabelFor(section, field, id) {
    const maps = {
        "vm": () => { const v = D.vm.find(x => x.id === id); return v ? v.nom : ""; },
        "bs": () => { const b = D.bs.find(x => x.id === id); return b ? b.nom : ""; },
        "pp": () => { const p = D.pp.find(x => x.id === id); return p ? p.nom : ""; },
        "er": () => { const e = D.er.find(x => x.id === id); return e ? e.evenement : ""; },
        "srov": () => { const s = D.srov.find(x => x.couple === id); return s ? _srFull(s.sr_id) + " / " + _ovFull(s.ov_id) : ""; },
        "ss": () => { const s = D.ss.find(x => x.id === id); return s ? s.scenario : ""; },
        "sr": () => { const s = (D.sr_list || []).find(x => x.id === id); return s ? s.nom : ""; },
        "ov": () => { const o = (D.ov_list || []).find(x => x.id === id); return o ? o.nom : ""; },
        "socle": () => {
            const isAnssi = D.socle_type !== "iso";
            const socle = isAnssi ? D.socle_anssi : D.socle_iso;
            const idCol = isAnssi ? "num" : "ref";
            const s = socle.find(x => (isAnssi ? "#" + String(x[idCol] ?? "") : x[idCol]) === id);
            return s ? _rt(s, "mesure") : "";
        },
        "sop": () => { const s = D.sop_summary.find(x => x.sop === id); return s ? s.ss : ""; },
        "measures": () => { const m = D.measures.find(x => x.id === id); return m ? m.mesure : ""; },
    };
    const src = _FIELD_TO_SOURCE[field];
    if (src && maps[src])
        return maps[src]();
    return "";
}
function _reRenderForField(section, field) {
    const renders = {
        "vm": renderVM, "bs": [renderBS, renderPP],
        "pp": [renderPP, renderEcoMap, renderSynthesis], "er": [renderER, renderSS, renderResiduals, renderSynthesis],
        "ss": [renderSS, renderResiduals, renderSynthesis],
        "srov": renderSROV, "eco": [renderEco, renderMeasures],
        "sop_detail": [renderSOP, renderSOPSynth, renderMeasures],
        "socle_anssi": [renderSocle, renderMeasures, renderSynthesis],
        "socle_iso": [renderSocle, renderMeasures, renderSynthesis],
        "measures": [renderMeasures, renderResiduals],
        "residuals": [renderResiduals, renderSynthesis],
    };
    const fns = renders[section];
    if (Array.isArray(fns))
        fns.forEach(fn => fn());
    else if (fns)
        fns();
    else { /* fallback */ }
    renderIndicators();
    showStatus(t("ebios.status.modified"));
}
// Keyboard shortcuts: see cisotoolbox.js (Ctrl+Z/Y/S)
// ── Functions returning the reference options ──
function vmOptions() { return D.vm.map(v => ({ id: v.id, label: v.nom })); }
function bsOptions() { return D.bs.map(b => ({ id: b.id, label: b.nom })); }
function ppOptions() { return D.pp.map(p => ({ id: p.id, label: p.nom })); }
function erOptions() { return D.er.map(e => ({ id: e.id, label: (e.evenement || "").substring(0, 60) })); }
function srovOptions() { return D.srov.map(s => ({ id: s.couple, label: _srFull(s.sr_id) + " / " + _ovFull(s.ov_id) })); }
function ssOptions() { return D.ss.map(s => ({ id: s.id, label: (s.scenario || "").substring(0, 60) })); }
function socleOptions() {
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const idCol = isAnssi ? "num" : "ref";
    return socle.map(s => ({ id: isAnssi ? "#" + String(s[idCol] ?? "") : String(s[idCol] ?? ""), label: (_rt(s, "mesure") || "").substring(0, 50) }));
}
function sopOptions() { return D.sop_summary.map(s => ({ id: s.sop, label: s.ss })); }
function measuresOptions() { return D.measures.map(m => ({ id: m.id, label: (_rt(m, "mesure") || "").substring(0, 50) })); }
// ═══════════════════════════════════════════════════════════════════════
// HISTORY — Undo/Redo + Snapshots
// ═══════════════════════════════════════════════════════════════════════
// _undoStack, _redoStack, undo/redo defined in cisotoolbox.js (limit: 50)
// Auto-save, banner, newAnalysis: see cisotoolbox.js
// _updateUndoButtons: see cisotoolbox.ts (shared impl, matches .btn-undo / #btn-undo)
// ── localStorage snapshots (optional encryption) ──
// ═══════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════
// Update the "ID - OldName" → "ID - NewName" references in every section
function propagateNameChange(id, newName) {
    // All the fields that contain textual "ID - Name" references
    const refFields = [
        ["bs", "vm"], ["pp", "bs"],
        ["er", "vm"], ["ss", "couple_id"], ["ss", "couple_desc"],
        ["ss", "pp"], ["ss", "bs"], ["ss", "er"],
        ["eco", "pp_id"], ["measures", "sop"], ["residuals", "mesures"],
        // Fields carrying MEASURE references. They were missing: renaming a
        // measure left its old label frozen here, because _csvAppendRef writes
        // "ID - label" and never reads it back. Invisible in the selectors
        // (which resolve the label from the id), but very much present in the
        // Word and Excel exports.
        ["sop_detail", "mesure_proposee"],
        ["socle_anssi", "mesures_prevues"], ["socle_iso", "mesures_prevues"],
        ["eco", "mesures_existantes"], ["eco", "mesures_complementaires"],
    ];
    for (const [sec, fld] of refFields) {
        if (!D[sec])
            continue;
        for (const item of D[sec]) {
            if (item[fld] && typeof item[fld] === "string" && item[fld].includes(id)) {
                item[fld] = item[fld].split(", ").map(function (part) {
                    return part.split(" - ")[0] === id ? id + " - " + newName : part;
                }).join(", ");
            }
        }
    }
}
// EBIOS numeric fields — must be numbers, not strings.
// In backend mode the API returns these values as strings (`text` columns);
// _coerceNumericFields() normalizes them on load (cf. ensureKeys) so that
// additive computations (e.g. SROV relevance) do not end up concatenating
// ("4"+"4"+"4" = "444" instead of 12).
const NUMERIC_FIELDS = ["motivation", "ressources", "activite", "d", "i", "c", "t",
    "dependance", "penetration", "maturite", "confiance", "gravite", "v_resid", "conformite",
    "dep_resid", "pen_resid", "mat_resid", "conf_resid"];
function _coerceNumericFields() {
    const sections = ["vm", "bs", "pp", "er", "srov", "eco", "ss", "residuals", "measures",
        "sr", "ov", "socle_anssi", "socle_iso"];
    sections.forEach(function (sec) {
        const arr = D[sec];
        if (!Array.isArray(arr))
            return;
        arr.forEach(function (item) {
            if (!item || typeof item !== "object")
                return;
            NUMERIC_FIELDS.forEach(function (f) {
                if (typeof item[f] === "string" && item[f] !== "") {
                    const n = parseFloat(item[f]);
                    if (!isNaN(n))
                        item[f] = n;
                }
            });
        });
    });
}
function updateField(section, idx, field, val, type) {
    _saveState();
    // Convert to number for the numeric fields
    if (type === "number" || NUMERIC_FIELDS.includes(field)) {
        val = val === "" ? "" : parseFloat(val);
        if (typeof val === "number" && (isNaN(val) || val < -1000 || val > 1e12))
            val = "";
    }
    // Cap string length
    if (typeof val === "string" && val.length > 5000)
        val = val.substring(0, 5000);
    if (!D[section][idx])
        D[section][idx] = {};
    const oldVal = D[section][idx][field];
    D[section][idx][field] = val;
    // If a name changes, propagate into all the references
    const nameFields = {
        vm: ["nom", "id"], bs: ["nom", "id"], pp: ["nom", "id"],
        er: ["evenement", "id"], srov: ["sr", "couple"],
        measures: ["mesure", "id"],
    };
    const nf = nameFields[section];
    if (nf && field === nf[0]) {
        const id = D[section][idx][nf[1]];
        if (id) {
            propagateNameChange(id, val);
            // Re-render everything because the references changed everywhere
            renderAll();
            showStatus(t("ebios.status.modified_refs"));
            return;
        }
    }
    if (section === "sop_detail" && field === "mesure_proposee") {
        _syncSopMeasuresToResiduals(idx, oldVal, val);
    }
    // Re-render the modified section + the dependent ones (deferred so as not to interfere with the event)
    setTimeout(() => {
        const rerenders = {
            "vm": [renderVM],
            "bs": [renderBS],
            "pp": [renderPP, renderEcoMap, renderSynthesis],
            "er": [renderER, renderSS, renderResiduals, renderSynthesis],
            "ss": [renderSS, renderResiduals, renderSynthesis],
            "srov": [renderSROV],
            "eco": [renderEco],
            "sop_detail": [renderSOP, renderSOPSynth, renderResiduals],
            "measures": [renderMeasures, renderSynthesis],
            "residuals": [renderResiduals, renderSynthesis],
            "socle_anssi": [renderSocle, renderSynthesis],
            "socle_iso": [renderSocle, renderSynthesis],
        };
        const fns = rerenders[section] || [];
        fns.forEach(fn => fn());
        renderIndicators();
        showStatus(t("ebios.status.modified"));
    }, 0);
    _persist(section);
}
// SOPs escape nextId(): their identifier lives in two arrays
// (sop_summary and sop_detail) and under a field named `sop`, not `id`.
// We sweep both — a SOP can exist in the summary without having any
// phase yet, and the reverse happens on imported data.
//
// Above all, we take the MAXIMUM and not the length: after a deletion,
// length-based numbering hands out an identifier already taken, and the
// new phases silently aggregate onto an existing SOP.
function nextSopId() {
    let max = 0;
    for (const row of [].concat(D.sop_summary || [], D.sop_detail || [])) {
        const m = String(row.sop || "").match(/(\d+)/);
        if (m)
            max = Math.max(max, parseInt(m[1]));
    }
    return "SOP-" + String(max + 1).padStart(3, "0");
}
function nextId(section) {
    const prefixes = {
        vm: "VM", bs: "BS", pp: "PP", er: "ER", ss: "SS",
        // FEAT-32 — new measures use the suite-wide MES- prefix; the max
        // scan below is digit-based so legacy M-NNN ids keep feeding it.
        srov: "SR/OV", measures: "MES", eco: "PP",
    };
    const prefix = prefixes[section] || "X";
    const idField = section === "srov" ? "couple" : (section === "eco" ? "pp_id" : "id");
    let max = 0;
    for (const item of D[section]) {
        const id = item[idField] || "";
        const m = id.match(/(\d+)/);
        if (m)
            max = Math.max(max, parseInt(m[1]));
    }
    const num = String(max + 1).padStart(3, "0");
    return prefix + "-" + num;
}
function addRow(section) {
    _saveState();
    const id = nextId(section);
    const templates = {
        vm: { id: id, nom: "", nature: "", description: "", responsable: "" },
        bs: { id: id, nom: "", type: "", vm: "", localisation: "", proprietaire: "" },
        pp: { id: id, nom: "", categorie: "", type: "", dependance: "", penetration: "", maturite: "", confiance: "", bs: "" },
        er: { id: id, evenement: "", vm: "", dict: "", impacts: "", gravite: "" },
        ss: { id: id, scenario: "", couple_id: "", couple_desc: "", pp: "", bs: "", er: "" },
        srov: { couple: id, sr_id: "", ov_id: "", motivation: "", ressources: "", activite: "", justification: "" },
        eco: { pp_id: "", mesures_existantes: "", mesures_complementaires: "", categorie: "", dep_resid: "", pen_resid: "", mat_resid: "", conf_resid: "" },
        measures: { id: id, mesure: "", details: "", origine: "Complémentaire", type: "", sop: "", phase: "", effet: "", ref_socle: "", responsable: "", echeance: "", cout: "", statut: "À lancer" },
    };
    if (templates[section]) {
        D[section].push({ ...templates[section] });
        renderAll();
        showStatus(t("ebios.status.line_added", { id: id }));
        _persist(section);
    }
}
// A reference is stored as "ID - label", several of them separated by commas
// (except srov.sr_id / srov.ov_id, which carry the bare identifier). Since the
// label is copied into the string, a dead reference keeps displaying the old
// name: that is what makes the inconsistency invisible.
function _refParts(value) {
    return String(value || "").split(",").map(x => x.trim()).filter(Boolean);
}
function _partMatches(part, id) {
    // Exact comparison on the leading token, not startsWith: beyond 999 rows,
    // "VM-100" would prefix "VM-1000".
    return part === id || part.startsWith(id + " - ");
}
// A row's identifier depending on its section (same rule as nextId).
function _rowIdField(section) {
    return section === "srov" ? "couple" : (section === "eco" ? "pp_id" : "id");
}
// Every row that references `id`, a row of `source`.
function _findRefsTo(source, id) {
    const found = [];
    if (!id)
        return found;
    Object.keys(D).forEach(section => {
        const rows = D[section];
        if (!Array.isArray(rows))
            return;
        rows.forEach((row, idx) => {
            if (!row || typeof row !== "object")
                return;
            Object.keys(row).forEach(field => {
                if (_FIELD_TO_SOURCE[field] !== source)
                    return;
                if (_refParts(row[field]).some(part => _partMatches(part, id))) {
                    found.push({ section: section, idx: idx, field: field });
                }
            });
        });
    });
    return found;
}
function _stripRefs(refs, id) {
    // An eco row is identified BY its reference (pp_id). Clearing that field
    // would not remove a link: it would leave a row with no identity. Those
    // rows disappear along with what they described.
    const doomed = {};
    refs.forEach(r => {
        const row = D[r.section][r.idx];
        if (!row)
            return;
        if (r.field === _rowIdField(r.section)) {
            (doomed[r.section] = doomed[r.section] || []).push(r.idx);
            return;
        }
        row[r.field] = _refParts(row[r.field]).filter(part => !_partMatches(part, id)).join(", ");
    });
    // By descending index, otherwise each deletion shifts the following ones.
    Object.keys(doomed).forEach(section => {
        doomed[section].sort((a, b) => b - a).forEach(i => {
            D[section].splice(i, 1);
        });
    });
}
function delRow(section, idx) {
    const row = D[section][idx];
    const rowId = row ? String(row[_rowIdField(section)] || "") : "";
    // Nothing cascades in this model: the links are strings. Deleting a VM
    // without cleaning up would leave the BS and the ER pointing at a
    // vanished identifier, still displaying its old name.
    const refs = _findRefsTo(section, rowId);
    if (refs.length && !confirm(t("ebios.confirm.delete_referenced", { id: rowId, n: String(refs.length) })))
        return;
    _saveState();
    D[section].splice(idx, 1);
    _stripRefs(refs, rowId);
    // Re-render only the affected section (not renderAll which resets navigation)
    _reRenderForField(section, "");
    const touched = {};
    refs.forEach(r => {
        const key = r.section + "|" + r.field;
        if (touched[key])
            return;
        touched[key] = true;
        _reRenderForField(r.section, r.field);
        _persist(r.section);
    });
    if (typeof renderIndicators === "function")
        renderIndicators();
    _persist(section);
    showStatus(t("ebios.status.line_deleted"));
}
// Navigation — flat panel selection (like Vendor/Compliance/Audit)
let _currentPanel = "synth";
var _PANEL_RENDER = {
    synth: function () { renderSynthesis(); },
    context: function () { renderContext(); },
    vm: function () { renderVM(); },
    bs: function () { renderBS(); },
    er: function () { renderER(); },
    socle: function () { renderSocle(); },
    srov: function () { renderSROV(); },
    pp: function () { renderPP(); },
    ss: function () { renderSS(); },
    eco: function () { renderEco(); renderEcoMap(); },
    sop: function () { renderSOP(); },
    "sop-synth": function () { renderSOPSynth(); },
    measures: function () { renderMeasures(); },
    residuals: function () { renderResiduals(); },
};
function selectPanel(id) {
    _currentPanel = id;
    document.querySelector(".ct-rail, .sidebar")?.classList.remove("open");
    _updateSidebarAccordion(id);
    document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
    var panel = document.getElementById("panel-" + id);
    if (panel)
        panel.classList.add("active");
    if (_PANEL_RENDER[id])
        _PANEL_RENDER[id]();
}
// ═══════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════
function renderIndicators() {
    const counts = [
        ["VM", D.vm.length], ["BS", D.bs.length], ["PP", D.pp.length],
        ["ER", D.er.length], ["SS", D.ss.length], ["SOP", D.sop_summary.length],
        [t("ebios.misc.measures_indicator"), D.measures.filter(function (m) { return m.statut !== "À étudier"; }).length],
    ];
    document.getElementById("indicators").innerHTML = counts.map(([d, n]) => `<div class="ct-kpi" data-density="dense"><div class="ct-kpi-tone"></div><div class="ct-kpi-body"><div class="ct-kpi-label">${esc(d)}</div><div class="ct-kpi-value">${n}</div></div></div>`).join("");
    // Badges counts
    for (const [k, v] of [["vm", D.vm], ["bs", D.bs], ["pp", D.pp], ["er", D.er], ["ss", D.ss],
        ["srov", D.srov], ["eco", D.eco], ["measures", D.measures], ["residuals", D.residuals]]) {
        const el = document.getElementById("count-" + k);
        if (el)
            el.textContent = String(v.length);
    }
    const socle = D.socle_type === "iso" ? D.socle_iso : D.socle_anssi;
    const el = document.getElementById("count-socle");
    if (el)
        el.textContent = String(socle.length);
    const el2 = document.getElementById("count-sop");
    if (el2)
        el2.textContent = D.sop_detail.length + " " + t("ebios.misc.phases");
}
function renderContext() {
    const c = D.context;
    document.getElementById("header-subtitle").textContent = c.societe || "";
    const shortFields = [
        [t("ebios.col.societe"), "societe"],
        [t("ebios.col.objet_etude"), "objet_etude"],
        [t("ebios.col.date"), "date"],
        [t("ebios.col.analyste"), "analyste"],
        [t("ebios.col.date_precedente"), "date_precedente"],
    ];
    let h = '<div class="grid-2col">';
    for (const [label, key] of shortFields) {
        h += `<div class="ct-meta-item"><div class="label">${label}</div><div class="value">
            <input type="text" value="${esc(c[key])}" class="w-full" data-change="_setContextField" data-args='${_da(key)}' data-pass-value />
        </div></div>`;
    }
    h += '</div>';
    h += `<div class="ct-meta-item mb-12"><div class="label">${t("ebios.col.reglementation")}</div><div class="value">
        <textarea rows="2" class="w-full" data-change="_setContextField" data-args='["reglementation"]' data-pass-value>${esc(c.reglementation || "")}</textarea>
    </div></div>`;
    h += `<div class="ct-meta-item mb-12"><div class="label">${t("ebios.col.ref_socle_securite")}</div><div class="value flex-row-center">`;
    const isAnssi = D.socle_type !== "iso";
    h += `<label class="cursor-pointer flex-row-center">
        <input type="radio" name="socle_type" value="anssi" ${isAnssi ? "checked" : ""} data-change="setSocleType" data-args='["anssi"]'> ${t("ebios.col.anssi_label")}
    </label>`;
    h += `<label class="cursor-pointer flex-row-center">
        <input type="radio" name="socle_type" value="iso" ${!isAnssi ? "checked" : ""} data-change="setSocleType" data-args='["iso"]'> ${t("ebios.col.iso_label")}
    </label>`;
    h += `</div></div>`;
    h += `<div class="ct-meta-item mb-12"><div class="label">${t("ebios.col.commentaires")}</div><div class="value">
        <textarea rows="4" class="w-full" data-change="_setContextField" data-args='["commentaires"]' data-pass-value>${esc(c.commentaires || "")}</textarea>
    </div></div>`;
    h += `<div class="ct-meta-item mb-12"><div class="label">${t("ebios.col.evolutions")}</div><div class="value">
        <textarea rows="3" class="w-full" data-change="_setContextField" data-args='["evolutions"]' data-pass-value>${esc(c.evolutions || "")}</textarea>
    </div></div>`;
    document.getElementById("context-fields").innerHTML = h;
    // ── Severity scale ──
    const n = D.gravity_scale.length;
    let gh = `<h3 class="section-heading">${t("ebios.gravity.heading")}</h3>`;
    gh += '<div class="mb-12 flex-row-center">';
    gh += `<span class="label-bold-sm">${t("ebios.gravity.nb_levels")}</span>`;
    for (const lv of [3, 4, 5]) {
        const active = lv === n;
        gh += `<button style="padding:var(--ct-s2) var(--ct-s4);border-radius:var(--ct-r-md);border:2px solid ${active ? "var(--ct-accent)" : "var(--ct-line)"};background:${active ? "var(--ct-accent)" : "var(--ct-surface)"};color:${active ? "white" : "var(--ct-ink)"};font-weight:700;cursor:pointer;font-size:0.9em" data-click="setGravityLevels" data-args='${_da(lv)}'>${lv}</button>`;
    }
    gh += '</div>';
    const impactCols = [
        { key: "impact_financier", label: t("ebios.gravity.col_impact_financier") },
        { key: "impact_reputation", label: t("ebios.gravity.col_impact_reputation") },
        { key: "impact_reglementaire", label: t("ebios.gravity.col_impact_reglementaire") },
        { key: "impact_donnees_perso", label: t("ebios.gravity.col_impact_donnees_perso") },
        { key: "impact_operationnel", label: t("ebios.gravity.col_impact_operationnel") },
    ];
    gh += `<div class="overflow-x-auto"><table class="minw-1000"><thead><tr><th class="w-50">${t("ebios.gravity.col_niveau")}</th><th class="w-100">${t("ebios.gravity.col_label")}</th><th class="w-180">${t("ebios.gravity.col_description")}</th>`;
    for (const ic of impactCols)
        gh += `<th>${ic.label}</th>`;
    gh += '</tr></thead><tbody>';
    D.gravity_scale.forEach((g, i) => {
        const gc = gravColor(g.niveau);
        const gtc = gravTextColor(g.niveau);
        gh += `<tr><td class="ta-c"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${gc};color:${gtc};text-align:center;line-height:28px;font-weight:700">${g.niveau}</span></td>`;
        gh += `<td><input type="text" value="${esc(g.label)}" class="w-full fw-600" data-change="_setGravityField" data-args='${_da(i, "label", true)}' data-pass-value></td>`;
        gh += `<td><textarea rows="2" class="w-full fs-sm" data-change="_setGravityField" data-args='${_da(i, "description", false)}' data-pass-value>${esc(g.description || "")}</textarea></td>`;
        for (const ic of impactCols) {
            gh += `<td><textarea rows="2" class="w-full fs-sm" data-change="_setGravityField" data-args='${_da(i, ic.key, false)}' data-pass-value>${esc(g[ic.key] || "")}</textarea></td>`;
        }
        gh += '</tr>';
    });
    gh += '</tbody></table></div>';
    // ── G×V risk matrix ──
    gh += `<h3 class="section-heading">${t("ebios.matrix.heading")}</h3>`;
    gh += '<table class="maxw-500"><thead><tr><th class="w-100">G \\ V</th>';
    for (let v = 1; v <= 4; v++)
        gh += `<th>V${v}</th>`;
    gh += '</tr></thead><tbody>';
    var riskCanonicals = ["Faible", "Moyen", "Élevé"];
    D.risk_matrix.forEach((row, ri) => {
        const gLbl = gravLabel(row.g);
        gh += `<tr><th class="ta-l fs-sm">${gLbl || "G" + row.g} (${row.g})</th>`;
        for (let vi = 0; vi < 4; vi++) {
            const rawVal = row.levels[vi] || "";
            const canon = _toCanonicalRisk(rawVal);
            const displayed = _displayRisk(rawVal);
            const rc = _riskBg(canon);
            const rtc = _riskTxt(canon);
            gh += `<td class="ct-ta-c ct-p-1"><select style="width:100%;padding:4px;border-radius:4px;border:1.5px solid var(--ct-line);font-weight:600;color:${rtc};background:${rc};text-align:center" data-change="_setRiskMatrix" data-args='${_da(ri, vi)}' data-pass-value>`;
            for (const cval of riskCanonicals) {
                gh += `<option value="${cval}" ${canon === cval ? "selected" : ""} class="text-black bg-white">${_displayRisk(cval)}</option>`;
            }
            gh += '</select></td>';
        }
        gh += '</tr>';
    });
    gh += '</tbody></table>';
    gh += `<p class="mt-8 text-muted fs-sm">${t("ebios.matrix.hint")}</p>`;
    document.getElementById("context-gravity").innerHTML = gh;
}
const _gravCache = {};
function setGravityLevels(n) {
    _saveState();
    // Save the current scale into the cache
    const curN = D.gravity_scale.length;
    if (curN > 0) {
        _gravCache[curN] = { scale: JSON.parse(JSON.stringify(D.gravity_scale)), matrix: JSON.parse(JSON.stringify(D.risk_matrix)) };
    }
    // Restore from the cache if available
    if (_gravCache[n]) {
        D.gravity_scale = _gravCache[n].scale;
        D.risk_matrix = _gravCache[n].matrix;
    }
    else {
        // Otherwise use the defaults
        function g(niv, label, desc) {
            return { niveau: niv, label: label, description: desc,
                impact_financier: "", impact_reputation: "", impact_reglementaire: "",
                impact_donnees_perso: "", impact_operationnel: "" };
        }
        var _F = t("ebios.risk.faible"), _M = t("ebios.risk.moyen"), _E = t("ebios.risk.eleve");
        const defaults = {
            3: [
                g(3, t("ebios.grav.critique"), t("ebios.grav.desc_critique")),
                g(2, t("ebios.grav.grave"), t("ebios.grav.desc_grave")),
                g(1, t("ebios.grav.faible"), t("ebios.grav.desc_faible")),
            ],
            4: [
                g(4, t("ebios.grav.critique"), t("ebios.grav.desc_critique")),
                g(3, t("ebios.grav.grave"), t("ebios.grav.desc_grave")),
                g(2, t("ebios.grav.significatif"), t("ebios.grav.desc_significatif")),
                g(1, t("ebios.grav.faible"), t("ebios.grav.desc_faible")),
            ],
            5: [
                g(5, t("ebios.grav.extreme"), t("ebios.grav.desc_extreme")),
                g(4, t("ebios.grav.critique"), t("ebios.grav.desc_critique")),
                g(3, t("ebios.grav.grave"), t("ebios.grav.desc_grave")),
                g(2, t("ebios.grav.significatif"), t("ebios.grav.desc_significatif")),
                g(1, t("ebios.grav.faible"), t("ebios.grav.desc_faible")),
            ],
        };
        const matrices = {
            3: [
                { g: 3, levels: [_M, _E, _E, _E] },
                { g: 2, levels: [_F, _M, _M, _E] },
                { g: 1, levels: [_F, _F, _F, _M] },
            ],
            4: [
                { g: 4, levels: [_M, _M, _E, _E] },
                { g: 3, levels: [_F, _M, _M, _E] },
                { g: 2, levels: [_F, _F, _M, _M] },
                { g: 1, levels: [_F, _F, _F, _M] },
            ],
            5: [
                { g: 5, levels: [_M, _E, _E, _E] },
                { g: 4, levels: [_M, _M, _E, _E] },
                { g: 3, levels: [_F, _M, _M, _E] },
                { g: 2, levels: [_F, _F, _M, _M] },
                { g: 1, levels: [_F, _F, _F, _F] },
            ],
        };
        D.gravity_scale = defaults[n];
        D.risk_matrix = matrices[n];
    }
    renderAll();
    _persist("gravity_scale");
    _persist("risk_matrix");
}
function setSocleType(type) {
    _saveState();
    D.socle_type = type;
    D.context.socle = type === "iso" ? "ISO 27001 — Annexe A" : "ANSSI — Guide d'hygiène";
    renderContext();
    renderSocle();
    renderSynthesis();
    _persist("context");
    _persist("settings");
}
function renderVM() {
    const tc = [{ key: "nature", label: t("ebios.col.vm_nature"), on: true }, { key: "desc", label: t("ebios.col.vm_description"), on: true }, { key: "resp", label: t("ebios.col.vm_responsable"), on: true }];
    document.getElementById("toggles-vm").innerHTML = colsButton("vm-table");
    let h = `<table id="vm-table"><thead><tr><th class="w-65">${t("ebios.col.vm_id")}</th><th>${t("ebios.col.vm_name")}</th><th${hd("nature")} class="w-110">${t("ebios.col.vm_nature")}</th><th${hd("desc")}>${t("ebios.col.vm_description")}</th><th${hd("resp")}>${t("ebios.col.vm_responsable")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.vm.forEach((v, i) => {
        h += `<tr><td><strong>${esc(v.id)}</strong></td><td>${inp("vm", i, "nom", v.nom)}</td>
            <td${hd("nature")}>${sel("vm", i, "nature", v.nature || "", ["Information", "Processus"])}</td>
            <td${hd("desc")}>${ta("vm", i, "description", v.description)}</td>
            <td${hd("resp")}>${_dirPicker(v.responsable || "", "updateField", _da("vm", i, "responsable"))}</td>
            <td>${delBtn("vm", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-vm").innerHTML = h;
    _setupTable("vm-table", tc.filter(c => !c.on).map(c => c.key));
}
function renderBS() {
    const tc = [{ key: "type", label: t("ebios.col.bs_type"), on: true }, { key: "vm", label: t("ebios.col.bs_vm"), on: true }, { key: "loc", label: t("ebios.col.bs_localisation"), on: true }, { key: "prop", label: t("ebios.col.bs_proprietaire"), on: true }];
    document.getElementById("toggles-bs").innerHTML = colsButton("bs-table");
    let h = `<table id="bs-table"><thead><tr><th class="w-65">${t("ebios.col.bs_id")}</th><th>${t("ebios.col.bs_name")}</th><th${hd("type")}>${t("ebios.col.bs_type")}</th><th${hd("vm")} class="w-120">${t("ebios.col.bs_vm")}</th><th${hd("loc")}>${t("ebios.col.bs_localisation")}</th><th${hd("prop")}>${t("ebios.col.bs_proprietaire")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.bs.forEach((b, i) => {
        h += `<tr><td><strong>${esc(b.id)}</strong></td><td>${inp("bs", i, "nom", b.nom)}</td>
            <td${hd("type")}>${inp("bs", i, "type", b.type)}</td><td${hd("vm")}>${refSelect("bs", i, "vm", b.vm, vmOptions())}</td>
            <td${hd("loc")}>${inp("bs", i, "localisation", b.localisation)}</td>
            <td${hd("prop")}>${_dirPicker(b.proprietaire || "", "updateField", _da("bs", i, "proprietaire"))}</td>
            <td>${delBtn("bs", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-bs").innerHTML = h;
    _setupTable("bs-table", tc.filter(c => !c.on).map(c => c.key));
}
function renderPP() {
    const tc = [{ key: "cat", label: t("ebios.col.pp_categorie"), on: true }, { key: "type", label: t("ebios.col.pp_type"), on: true }, { key: "dep", label: t("ebios.col.pp_dependance"), on: true }, { key: "pen", label: t("ebios.col.pp_penetration"), on: true }, { key: "mat", label: t("ebios.col.pp_maturite"), on: true }, { key: "conf", label: t("ebios.col.pp_confiance"), on: true }, { key: "menace", label: t("ebios.col.pp_menace"), on: true }, { key: "expo", label: t("ebios.col.pp_exposition"), on: true }, { key: "bs", label: t("ebios.col.pp_bs"), on: true }];
    document.getElementById("toggles-pp").innerHTML = colsButton("pp-table");
    let h = `<table id="pp-table"><thead><tr><th>${t("ebios.col.pp_id")}</th><th>${t("ebios.col.pp_name")}</th><th${hd("cat")}>${t("ebios.col.pp_categorie")}</th><th${hd("type")}>${t("ebios.col.pp_type")}</th><th${hd("dep")} class="w-40">${t("ebios.col.pp_dependance")}</th><th${hd("pen")} class="w-40">${t("ebios.col.pp_penetration")}</th><th${hd("mat")} class="w-40">${t("ebios.col.pp_maturite")}</th><th${hd("conf")} class="w-40">${t("ebios.col.pp_confiance")}</th><th${hd("menace")}>${t("ebios.col.pp_menace")}</th><th${hd("expo")}>${t("ebios.col.pp_exposition")}</th><th${hd("bs")} class="w-120">${t("ebios.col.pp_bs")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.pp.forEach((p, i) => {
        const menace = computeMenace(p.dependance, p.penetration, p.maturite, p.confiance);
        const expo = computeExposition(menace);
        h += `<tr><td><strong>${esc(p.id)}</strong></td><td>${inp("pp", i, "nom", p.nom)}</td>
            <td${hd("cat")}>${sel("pp", i, "categorie", p.categorie || "", ["Client", "Partenaire", "Prestataire"])}</td>
            <td${hd("type")}>${inp("pp", i, "type", p.type)}</td>
            <td>${sel("pp", i, "dependance", p.dependance, [1, 2, 3, 4])}</td>
            <td>${sel("pp", i, "penetration", p.penetration, [1, 2, 3, 4])}</td>
            <td>${sel("pp", i, "maturite", p.maturite, [1, 2, 3, 4])}</td>
            <td${hd("conf")}>${sel("pp", i, "confiance", p.confiance, [1, 2, 3, 4])}</td>
            <td${hd("menace")} class="computed">${menace !== null ? menace.toFixed(2) : ""}</td>
            <td${hd("expo")} class="computed">${_expoBadge(expo)}</td>
            <td${hd("bs")}>${refSelect("pp", i, "bs", p.bs, bsOptions())}</td>
            <td>${delBtn("pp", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-pp").innerHTML = h;
    _setupTable("pp-table", tc.filter(c => !c.on).map(c => c.key));
    renderPPMap();
}
function triggerImportVendor() {
    document.getElementById("vendor-import-input").click();
}
function importVendorPP(event) {
    var file = event.target.files[0];
    if (!file)
        return;
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            // Support 2 formats: pp_export (from Vendor "Exporter PP") or full Vendor save (vendors array)
            var ppList = [];
            if (data.pp_export) {
                // Format: {pp_export: [{id, nom, type, dependance, penetration, maturite, confiance}]}
                ppList = data.pp_export;
            }
            else if (data.vendors) {
                // Format: full Vendor save file with vendors array
                ppList = data.vendors.map(function (v) {
                    var ex = v.exposure || {};
                    var cls = v.classification || {};
                    var dep = ex.dependance || 0;
                    var pen = ex.penetration || 0;
                    if (!dep && cls.ops_impact != null) {
                        dep = Math.round(((cls.ops_impact || 0) + (cls.processes || 0) + (cls.replace_difficulty || 0)) / 3 * 10) / 10;
                    }
                    if (!pen && cls.data_sensitivity != null) {
                        pen = Math.round(((cls.data_sensitivity || 0) + (cls.integration || 0) + (cls.regulatory_impact || 0)) / 3 * 10) / 10;
                    }
                    return {
                        nom: v.name, type: v.sector || "Prestataire",
                        dependance: dep, penetration: pen, maturite: ex.maturite || 0, confiance: ex.confiance || 0,
                        measures: (v.measures || []).map(function (m) {
                            return { mesure: m.mesure || "", details: m.details || "", type: m.type || "", statut: m.statut || "", responsable: m.responsable || "", echeance: m.echeance || "" };
                        })
                    };
                });
            }
            if (!ppList.length) {
                showStatus(t("ebios.import_vendor.no_vendors"));
                return;
            }
            _saveState();
            var added = 0, skipped = 0, measureCount = 0;
            var clamp = function (v) { var n = Math.round(v); return n >= 1 ? Math.min(n, 4) : ""; };
            ppList.forEach(function (v) {
                var nom = v.nom || v.name || "";
                var exists = D.pp.some(function (p) { return p.nom === nom; });
                if (exists) {
                    skipped++;
                    return;
                }
                var cat = "Prestataire";
                var type = v.type || "";
                if (/client/i.test(type))
                    cat = "Client";
                else if (/partenaire|partner/i.test(type))
                    cat = "Partenaire";
                var id = nextId("pp");
                D.pp.push({
                    id: id,
                    nom: nom,
                    categorie: cat,
                    type: type,
                    dependance: clamp(v.dependance || 0),
                    penetration: clamp(v.penetration || 0),
                    maturite: clamp(v.maturite || 0),
                    confiance: clamp(v.confiance || 0),
                    bs: ""
                });
                // Import associated measures as "Écosystème" origin
                var vMeasures = v.measures || [];
                var existantes = [], complementaires = [];
                var statutMap = { "termine": "Terminé", "en_cours": "En cours", "planifie": "Planifié", "a_lancer": "À lancer" };
                vMeasures.forEach(function (m) {
                    var mId = nextId("measures");
                    var statut = statutMap[m.statut] || m.statut || "À lancer";
                    D.measures.push({
                        id: mId,
                        mesure: m.mesure || "",
                        details: (m.details || "") + (nom ? "\n[Vendor: " + nom + "]" : ""),
                        origine: "Écosystème",
                        type: m.type || "",
                        sop: "", phase: "", effet: m.effet || "", ref_socle: "",
                        responsable: m.responsable || "",
                        echeance: m.echeance || "",
                        cout: "",
                        statut: statut
                    });
                    var ref = mId + " - " + (m.mesure || "").substring(0, 50);
                    if (statut === "Terminé")
                        existantes.push(ref);
                    else
                        complementaires.push(ref);
                    measureCount++;
                });
                // Create eco entry linking PP to its measures
                D.eco.push({
                    pp_id: id + " - " + nom,
                    mesures_existantes: existantes.join(", "),
                    mesures_complementaires: complementaires.join(", "),
                    categorie: "",
                    dep_resid: "", pen_resid: "", mat_resid: "", conf_resid: ""
                });
                added++;
            });
            _autoSave();
            renderPP();
            showStatus(t("ebios.import_vendor.success", { added: added, skipped: skipped, measures: measureCount }));
        }
        catch (err) {
            showStatus(t("ebios.import_vendor.error", { msg: err.message }));
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}
function renderSocle() {
    // Load the descriptions if needed, then re-render (graceful pop-in)
    if (!_descriptionsLoaded) {
        _ensureDescriptions(() => renderSocle());
    }
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const section = isAnssi ? "socle_anssi" : "socle_iso";
    const idCol = isAnssi ? "num" : "ref";
    const themeCol = isAnssi ? "thematique" : "theme";
    const tc = [{ key: "theme", label: t("ebios.col.socle_theme"), on: true }, { key: "mesure", label: t("ebios.col.socle_mesure"), on: true }, { key: "conf", label: t("ebios.col.socle_conformite"), on: true }, { key: "statut", label: t("ebios.col.socle_statut"), on: true }, { key: "ecart", label: t("ebios.col.socle_ecart"), on: true }, { key: "prio", label: t("ebios.col.socle_priorite"), on: true }, { key: "mp", label: t("ebios.col.socle_mesures_prevues"), on: true }];
    document.getElementById("toggles-socle").innerHTML = colsButton("socle-table");
    let h = `<p class="mb-12 text-muted">Socle : ${isAnssi ? t("ebios.socle.anssi_label") : t("ebios.socle.iso_label")}</p>`;
    h += `<table id="socle-table"><thead><tr><th>${t("ebios.col.socle_num")}</th><th${hd("theme")}>${t("ebios.col.socle_theme")}</th><th${hd("mesure")}>${t("ebios.col.socle_mesure")}</th><th${hd("conf")} class="w-130">${t("ebios.col.socle_conformite")}</th><th${hd("statut")}>${t("ebios.col.socle_statut")}</th><th${hd("ecart")} class="minw-300">${t("ebios.col.socle_ecart")}</th><th${hd("prio")}>${t("ebios.col.socle_priorite")}</th><th${hd("mp")}>${t("ebios.col.socle_mesures_prevues")}</th></tr></thead><tbody>`;
    socle.forEach((s, i) => {
        const conf = s.conformite;
        const confVal = (conf === "" || conf === null) ? 0 : parseInt(String(conf)) || 0;
        const confColor = confVal >= 80 ? "var(--ct-low)" : confVal > 0 ? "var(--ct-medium)" : "var(--ct-critical)";
        const statut = socleStatut(conf);
        const prio = soclePriorite(conf);
        const sliderId = "slbl-" + section + "-" + i;
        const desc = isAnssi ? _getAnssDesc(s.num ?? "") : _getIsoDesc(String(s.ref || s.num || ""));
        h += `<tr><td>${esc(s[idCol])}</td><td${hd("theme")}>${esc(_rt(s, themeCol))}</td><td${hd("mesure")}><div class="fw-600 mb-4">${esc(_rt(s, "mesure"))}</div>${desc ? `<div class="desc-text">${esc(desc)}</div>` : ""}</td>
            <td${hd("conf")}><div id="${sliderId}" style="text-align:center;font-weight:700;font-size:var(--ct-text-meta);color:${confColor}">${conf !== "" && conf !== null ? confVal + "%" : "—"}</div><input type="range" min="0" max="100" step="1" value="${confVal}" style="width:100%;cursor:pointer;accent-color:${confColor}" data-s="${section}" data-i="${i}" data-f="conformite" data-t="number" data-lbl="${sliderId}" data-input="_sliderInput" data-pass-el data-change="_updateFieldFromEl" data-pass-el /></td>
            <td${hd("statut")} class="computed">${_socleBadge(statut)}</td>
            <td${hd("ecart")}>${ta(section, i, "ecart", s.ecart)}</td>
            <td${hd("prio")} class="computed">${_prioBadge(prio)}</td>
            <td${hd("mp")}>${refSelect(section, i, "mesures_prevues", s.mesures_prevues || "", measuresOptions())}<button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="addSocleMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_socle_measure")}</button></td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-socle").innerHTML = h;
    _setupTable("socle-table", tc.filter(c => !c.on).map(c => c.key));
}
function addSocleMeasure(socleIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_socle_measure"));
    if (!desc)
        return;
    const id = nextId("measures");
    const isAnssi = D.socle_type !== "iso";
    const section = isAnssi ? "socle_anssi" : "socle_iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const refNum = socle[socleIdx] ? (isAnssi ? "#" + socle[socleIdx].num : socle[socleIdx].ref || "") : "";
    // Create the measure in 5a
    D.measures.push({
        id: id, mesure: desc, origine: "Socle", type: "Prévention",
        sop: "", phase: "", effet: t("ebios.m.renforcement_socle", { ref: refNum }),
        ref_socle: refNum, responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    // Add the reference into the socle's mesures_prevues field
    const current = socle[socleIdx].mesures_prevues || "";
    const newRef = id + " - " + desc;
    socle[socleIdx].mesures_prevues = current ? current + ", " + newRef : newRef;
    renderSocle();
    renderMeasures();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", { id: id }));
    _persist("measures");
    _persist("socle_anssi");
    _persist("socle_iso");
}
// ── SR/OV: separate SR, OV and couple lists ──
function srOptions() { return (D.sr_list || []).map(s => ({ id: s.id, label: s.nom })); }
function ovOptions() { return (D.ov_list || []).map(o => ({ id: o.id, label: o.nom })); }
function _srNom(id) { const s = (D.sr_list || []).find(x => x.id === id); return s ? s.nom : ""; }
function _ovNom(id) { const o = (D.ov_list || []).find(x => x.id === id); return o ? o.nom : ""; }
function _srFull(id) { return id ? id + " - " + _srNom(id) : ""; }
function _ovFull(id) { return id ? id + " - " + _ovNom(id) : ""; }
function newSR() {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_sr"));
    if (!desc)
        return null;
    let max = 0;
    (D.sr_list || []).forEach(s => { const m = s.id.match(/(\d+)/); if (m)
        max = Math.max(max, parseInt(m[1])); });
    const id = "SR-" + String(max + 1).padStart(3, "0");
    D.sr_list.push({ id: id, nom: desc });
    showStatus(t("ebios.status.sr_created", { id: id }));
    _persist("sr");
    return id;
}
function newOV() {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_ov"));
    if (!desc)
        return null;
    let max = 0;
    (D.ov_list || []).forEach(o => { const m = o.id.match(/(\d+)/); if (m)
        max = Math.max(max, parseInt(m[1])); });
    const id = "OV-" + String(max + 1).padStart(3, "0");
    D.ov_list.push({ id: id, nom: desc });
    showStatus(t("ebios.status.ov_created", { id: id }));
    _persist("ov");
    return id;
}
function updateSROVRef(idx, field, val) {
    _saveState();
    const oldVal = D.srov[idx][field];
    D.srov[idx][field] = val;
    const srId = D.srov[idx].sr_id || "";
    const ovId = D.srov[idx].ov_id || "";
    if (srId && ovId) {
        for (let j = 0; j < D.srov.length; j++) {
            if (j === idx)
                continue;
            if (D.srov[j].sr_id === srId && D.srov[j].ov_id === ovId) {
                alert(t("ebios.confirm.duplicate_srov", { sr: srId, ov: ovId }));
                D.srov[idx][field] = oldVal;
                renderSROV();
                return;
            }
        }
        D.srov[idx].couple = srId + "/" + ovId;
    }
    renderSROV();
    showStatus(t("ebios.status.modified"));
    _persist("srov");
}
function srSelectWidget(idx, val) {
    const fullVal = val ? val + " - " + _srNom(val) : "";
    return refSelect("srov", idx, "sr_id", fullVal, srOptions(), true) +
        `<button class="ct-btn mt-3" data-size="xs" data-variant="primary" data-click="_newSRFor" data-args='${_da(idx)}'>${t("ebios.btn.new_sr")}</button>`;
}
function ovSelectWidget(idx, val) {
    const fullVal = val ? val + " - " + _ovNom(val) : "";
    return refSelect("srov", idx, "ov_id", fullVal, ovOptions(), true) +
        `<button class="ct-btn mt-3" data-size="xs" data-variant="primary" data-click="_newOVFor" data-args='${_da(idx)}'>${t("ebios.btn.new_ov")}</button>`;
}
function renderSROV() {
    const tc = [{ key: "sr", label: t("ebios.col.srov_sr"), on: true }, { key: "ov", label: t("ebios.col.srov_ov"), on: true }, { key: "m", label: t("ebios.col.srov_motivation"), on: true }, { key: "r", label: t("ebios.col.srov_ressources"), on: true }, { key: "a", label: t("ebios.col.srov_activite"), on: true }, { key: "pert", label: t("ebios.col.srov_pertinence"), on: true }, { key: "prio", label: t("ebios.col.srov_priorite"), on: true }, { key: "just", label: t("ebios.col.srov_justification"), on: true }];
    document.getElementById("toggles-srov").innerHTML = colsButton("srov-table");
    let h = `<table id="srov-table"><thead><tr><th class="w-85">${t("ebios.col.srov_couple")}</th><th${hd("sr")}>${t("ebios.col.srov_sr")}</th><th${hd("ov")}>${t("ebios.col.srov_ov")}</th><th${hd("m")} class="w-40">${t("ebios.col.srov_motivation")}</th><th${hd("r")} class="w-40">${t("ebios.col.srov_ressources")}</th><th${hd("a")} class="w-40">${t("ebios.col.srov_activite")}</th><th${hd("pert")} class="w-40">${t("ebios.col.srov_pertinence")}</th><th${hd("prio")}>${t("ebios.col.srov_priorite")}</th><th${hd("just")}>${t("ebios.col.srov_justification")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.srov.forEach((s, i) => {
        // Numeric coercion: in backend mode the values loaded from the API
        // can be strings ("4"+"4"+"4" would give "444" instead of 12). Same
        // treatment as the export (_exportData) in this same file.
        const pert = (Number(s.motivation) || 0) + (Number(s.ressources) || 0) + (Number(s.activite) || 0);
        let prio = "";
        if (pert > 7)
            prio = t("ebios.srov.p1");
        else if (pert > 4)
            prio = t("ebios.srov.p2");
        else if (pert >= 3)
            prio = t("ebios.srov.non_retenu");
        else if (pert > 0)
            prio = t("ebios.srov.ecarte");
        var _prioColors = {};
        _prioColors[t("ebios.srov.p1")] = "var(--ct-critical)";
        _prioColors[t("ebios.srov.p2")] = "var(--ct-high)";
        _prioColors[t("ebios.srov.non_retenu")] = "var(--ct-medium)";
        _prioColors[t("ebios.srov.ecarte")] = "#cbd5e1";
        const prioColor = _prioColors[prio] || "#cbd5e1";
        h += `<tr><td><strong>${esc(s.couple)}</strong></td>
            <td${hd("sr")}>${srSelectWidget(i, s.sr_id)}</td><td${hd("ov")}>${ovSelectWidget(i, s.ov_id)}</td>
            <td${hd("m")}>${sel("srov", i, "motivation", s.motivation, [0, 1, 2, 3, 4])}</td>
            <td${hd("r")}>${sel("srov", i, "ressources", s.ressources, [0, 1, 2, 3, 4])}</td>
            <td${hd("a")}>${sel("srov", i, "activite", s.activite, [0, 1, 2, 3, 4])}</td>
            <td${hd("pert")} class="computed">${pert || ""}</td>
            <td${hd("prio")} class="computed">${_prioBadge(prio)}</td>
            <td${hd("just")}>${ta("srov", i, "justification", s.justification)}</td>
            <td>${delBtn("srov", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-srov").innerHTML = h;
    _setupTable("srov-table", tc.filter(c => !c.on).map(c => c.key));
}
function renderER() {
    var maxG = D.gravity_scale.length > 0 ? D.gravity_scale[0].niveau : 4;
    var descEl = document.getElementById("desc-er");
    if (descEl)
        descEl.textContent = t("ebios.desc.er", { max: maxG });
    const byCat = !!(D.context && D.context.gravite_par_categorie);
    const cats = [["financier", t("ebios.gravity.col_impact_financier")], ["reputation", t("ebios.gravity.col_impact_reputation")], ["reglementaire", t("ebios.gravity.col_impact_reglementaire")], ["donnees_perso", t("ebios.gravity.col_impact_donnees_perso")], ["operationnel", t("ebios.gravity.col_impact_operationnel")]];
    const tc = [{ key: "vm", label: t("ebios.col.er_vm"), on: true }, { key: "dict", label: t("ebios.col.er_dict"), on: true }, { key: "impacts", label: t("ebios.col.er_impacts"), on: true }, { key: "grav", label: t("ebios.col.er_gravite"), on: true }, { key: "label", label: t("ebios.col.er_label"), on: true }];
    const optHtml = `<label style="font-size:var(--ct-text-meta);cursor:pointer;display:inline-flex;align-items:center;gap:var(--ct-s1);margin-right:var(--ct-s3)"><input type="checkbox" id="er-grav-cat-toggle" ${byCat ? "checked" : ""} data-change="_toggleErGraviteCat"> ${t("ebios.er.gravite_par_cat")}</label>`;
    document.getElementById("toggles-er").innerHTML = optHtml + colsButton("er-table");
    const gOpts = D.gravity_scale.map(g => g.niveau);
    const gravHead = byCat ? cats.map(c => `<th${hd("grav")} class="w-80">${esc(c[1])}</th>`).join("") : `<th${hd("grav")}>${t("ebios.col.er_gravite")}</th>`;
    let h = `<table id="er-table"><thead><tr><th class="w-65">${t("ebios.col.er_id")}</th><th class="minw-200">${t("ebios.col.er_evenement")}</th><th${hd("vm")}>${t("ebios.col.er_vm")}</th><th${hd("dict")} class="w-100">${t("ebios.col.er_dict")}</th><th${hd("impacts")}>${t("ebios.col.er_impacts")}</th>${gravHead}<th${hd("label")}>${t("ebios.col.er_label")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.er.forEach((e, i) => {
        const lbl = gravLabel(e.gravite);
        const gravCells = byCat ? cats.map(c => `<td${hd("grav")}>${_selErCat(i, c[0], (e.gravite_cat || {})[c[0]])}</td>`).join("") : `<td${hd("grav")}>${sel("er", i, "gravite", e.gravite, gOpts)}</td>`;
        h += `<tr><td><strong>${esc(e.id)}</strong></td><td>${ta("er", i, "evenement", e.evenement)}</td>
            <td${hd("vm")}>${refSelect("er", i, "vm", e.vm, vmOptions(), true)}</td><td${hd("dict")}>${dictToggle("er", i, "dict", e.dict)}</td>
            <td${hd("impacts")}>${ta("er", i, "impacts", e.impacts)}</td>
            ${gravCells}
            <td${hd("label")} class="computed">${lbl ? _gravBadge(lbl, e.gravite) : ""}</td>
            <td>${delBtn("er", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-er").innerHTML = h;
    _setupTable("er-table", tc.filter(c => !c.on).map(c => c.key));
}
// Severity per scale category (option on the "Événements redoutés" page)
function _selErCat(idx, catKey, val) {
    const field = "impact_" + catKey;
    let h = `<select data-i="${idx}" data-cat="${catKey}" data-change="_updateErGraviteCat" data-pass-el><option value=""></option>`;
    D.gravity_scale.forEach(g => {
        const desc = (g[field] && String(g[field]).trim()) || ("Niveau " + g.niveau + (g.label ? " — " + g.label : ""));
        h += `<option value="${g.niveau}" ${String(val) === String(g.niveau) ? "selected" : ""}>${esc(desc)}</option>`;
    });
    return h + "</select>";
}
function _updateErGraviteCat(el) {
    const i = parseInt(el.getAttribute("data-i"));
    const cat = el.getAttribute("data-cat");
    const e = D.er[i];
    if (!e)
        return;
    e.gravite_cat = e.gravite_cat || {};
    e.gravite_cat[cat] = el.value ? parseInt(el.value) : "";
    const vals = Object.keys(e.gravite_cat).map(k => Number(e.gravite_cat[k])).filter(n => n >= 1);
    updateField("er", i, "gravite", vals.length ? Math.max.apply(null, vals) : "");
}
function _toggleErGraviteCat() {
    const cb = document.getElementById("er-grav-cat-toggle");
    D.context = D.context || {};
    D.context.gravite_par_categorie = !!(cb && cb.checked);
    if (typeof _autoSave === "function")
        _autoSave();
    renderER();
}
function renderSS() {
    const tc = [{ key: "srov", label: t("ebios.col.ss_srov"), on: false }, { key: "pp", label: t("ebios.col.ss_pp"), on: true }, { key: "bs", label: t("ebios.col.ss_bs"), on: false }, { key: "er", label: t("ebios.col.ss_er"), on: true }, { key: "grav", label: t("ebios.col.ss_gravite"), on: true }];
    document.getElementById("toggles-ss").innerHTML = colsButton("ss-table");
    let h = `<table id="ss-table"><thead><tr><th class="w-55">${t("ebios.col.ss_id")}</th><th class="minw-250">${t("ebios.col.ss_scenario")}</th><th${hd("srov")} class="w-120">${t("ebios.col.ss_srov")}</th><th${hd("pp")}>${t("ebios.col.ss_pp")}</th><th${hd("bs")}>${t("ebios.col.ss_bs")}</th><th${hd("er")}>${t("ebios.col.ss_er")}</th><th${hd("grav")} class="w-70">${t("ebios.col.ss_gravite")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const lbl = gravLabel(gNum);
        h += `<tr><td><strong>${esc(s.id)}</strong></td><td>${ta("ss", i, "scenario", s.scenario)}</td>
            <td${hd("srov")}>${refSelect("ss", i, "couple_id", s.couple_id, srovOptions(), true)}</td>
            <td${hd("pp")}>${refSelect("ss", i, "pp", s.pp, ppOptions())}</td>
            <td${hd("bs")}>${refSelect("ss", i, "bs", s.bs, bsOptions())}</td>
            <td${hd("er")}>${refSelect("ss", i, "er", s.er, erOptions())}</td>
            <td${hd("grav")} class="computed">${lbl ? _gravBadge(lbl, gNum) : ""}</td>
            <td>${delBtn("ss", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-ss").innerHTML = h;
    _setupTable("ss-table", tc.filter(c => !c.on).map(c => c.key));
}
// Column system: hide/show + resize
// Columns, popups, resize: see cisotoolbox.js
function _ecoSyncColumns(idx, field, measureId, added) {
    if (!added || !measureId)
        return;
    const eco = D.eco[idx];
    const otherField = field === "mesures_existantes" ? "mesures_complementaires" : "mesures_existantes";
    const otherVal = eco[otherField] || "";
    // Check whether the added measure is in the other column
    const otherParts = otherVal.split(",").map(s => s.trim()).filter(Boolean);
    const found = otherParts.findIndex(p => p.startsWith(measureId));
    if (found >= 0) {
        // Remove from the other column
        otherParts.splice(found, 1);
        eco[otherField] = otherParts.join(", ");
        _persist("eco");
        if (field === "mesures_complementaires") {
            // Added to complementary → was in existing
            // → switch the measure's status to "À étudier" in 5a
            const m = D.measures.find(x => x.id === measureId);
            if (m && m.statut === "Terminé") {
                m.statut = "À étudier";
                _persist("measures");
                showStatus(t("ebios.status.eco_moved_compl", { id: measureId }));
            }
        }
        else {
            // Added to existing → was in complementary
            showStatus(t("ebios.status.eco_moved_exist", { id: measureId }));
        }
    }
}
function _buildEcoSVG(ppList, title) {
    const W = 1000, H = 900, CX = W / 2, CY = 390, R = 270, M = 15;
    const maxMenace = 5;
    function menaceToR(m) { return R * (1 - Math.min(m, maxMenace) / maxMenace); }
    function degXY(deg, r) {
        const rad = (deg - 90) * Math.PI / 180;
        return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
    }
    const catMap = {};
    catMap[t("ebios.eco.clients")] = [];
    catMap[t("ebios.eco.partenaires")] = [];
    catMap[t("ebios.eco.prestataires")] = [];
    ppList.forEach(p => {
        const c = p.cat === "Client" ? t("ebios.eco.clients") : p.cat === "Partenaire" ? t("ebios.eco.partenaires") : t("ebios.eco.prestataires");
        catMap[c].push(p);
    });
    // 4 quadrants: top-left=Clients, top-right=Partenaires, bottom-left=Prestataires, bottom-right=Legend
    // 0°=top clockwise: 270-360=top-left, 0-90=top-right, 180-270=bottom-left, 90-180=bottom-right(scale)
    var _cl = t("ebios.eco.clients"), _pa = t("ebios.eco.partenaires"), _pr = t("ebios.eco.prestataires");
    const quads = {};
    quads[_cl] = { a1: 270, a2: 360, color: "#16a34a", rx: CX - R - M, ry: CY - R - M, rw: R + M - 8, rh: R + M - 8 };
    quads[_pa] = { a1: 0, a2: 90, color: "#7c3aed", rx: CX + 8, ry: CY - R - M, rw: R + M - 8, rh: R + M - 8 };
    quads[_pr] = { a1: 180, a2: 270, color: "#94a3b8", rx: CX - R - M, ry: CY + 8, rw: R + M - 8, rh: R + M - 8 };
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="max-width:${W}px;width:100%;height:auto;display:block;margin:0 auto">`;
    // Rounded rectangular frames per quadrant
    for (const [name, q] of Object.entries(quads)) {
        svg += `<rect x="${q.rx}" y="${q.ry}" width="${q.rw}" height="${q.rh}" rx="18" fill="${q.color}" fill-opacity="0.05" stroke="${q.color}" stroke-width="2" stroke-opacity="0.25" />`;
        // Quadrant label
        const lx = q.rx + q.rw / 2;
        const isTop = q.ry < CY;
        const ly = isTop ? q.ry + 16 : q.ry + q.rh - 8;
        svg += `<text x="${lx}" y="${ly}" font-size="13" fill="${q.color}" font-style="italic" font-weight="600" text-anchor="middle">${name}</text>`;
    }
    // Concentric zones
    svg += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="#14b8a6" fill-opacity="0.06" stroke="#14b8a6" stroke-width="2" opacity="0.35" />`;
    svg += `<circle cx="${CX}" cy="${CY}" r="${menaceToR(0.9)}" fill="#eab308" fill-opacity="0.07" stroke="#eab308" stroke-width="2" opacity="0.45" />`;
    svg += `<circle cx="${CX}" cy="${CY}" r="${menaceToR(2.5)}" fill="#dc2626" fill-opacity="0.08" stroke="#dc2626" stroke-width="2" opacity="0.5" />`;
    // Axes
    svg += `<line x1="${CX}" y1="${CY - R - 5}" x2="${CX}" y2="${CY + R + 5}" stroke="#cbd5e1" stroke-width="0.8" />`;
    svg += `<line x1="${CX - R - 5}" y1="${CY}" x2="${CX + R + 5}" y2="${CY}" stroke="#cbd5e1" stroke-width="0.8" />`;
    // Graduations on the bottom-right axis (legend quadrant)
    for (let i = 0; i <= maxMenace; i++) {
        const rr = menaceToR(i);
        svg += `<circle cx="${CX}" cy="${CY}" r="${rr}" fill="none" stroke="var(--ct-line)" stroke-width="0.5" stroke-dasharray="3,3" />`;
        // Label on the bottom-right diagonal
        const [lx, ly] = degXY(135, rr + 4);
        svg += `<text x="${lx}" y="${ly - 2}" font-size="13" fill="#475569" font-weight="700">${i}</text>`;
    }
    // Center
    svg += `<circle cx="${CX}" cy="${CY}" r="7" fill="#1e293b" />`;
    // Pass 1: compute all PP and label positions
    const allPP = [];
    for (const [catName, pps] of Object.entries(catMap)) {
        const q = quads[catName];
        const span = q.a2 - q.a1;
        const margin = 12;
        pps.sort((a, b) => b.menace - a.menace);
        pps.forEach((p, idx) => {
            const rr = menaceToR(p.menace);
            const angle = q.a1 + margin + ((span - 2 * margin) * (idx + 0.5)) / Math.max(pps.length, 1);
            const [px, py] = degXY(angle, rr);
            const cr = Math.max(7, Math.min(20, 4 + p.expo * 1.0));
            const fc = p.fiab;
            const fill = fc < 4 ? "#dc2626" : fc < 7 ? "#f59e0b" : fc < 10 ? "#eab308" : "#16a34a";
            const stroke = fc < 4 ? "#b91c1c" : fc < 7 ? "#f59e0b" : fc < 10 ? "#eab308" : "#16a34a";
            const isLeft = px < CX;
            const labelText = esc(p.id + " - " + p.nom);
            // Label aligned on the edge of the quadrant rectangle
            const lx = isLeft ? q.rx + 8 : q.rx + q.rw - 8;
            allPP.push({ px, py, cr, fill, stroke, isLeft, lx, ly: py, labelText, quad: catName });
        });
    }
    // Pass 2: resolve label collisions per quadrant, clamp inside the rectangle
    const LH = 14;
    const quadGroups = {};
    allPP.forEach((p, i) => {
        if (!quadGroups[p.quad])
            quadGroups[p.quad] = [];
        quadGroups[p.quad].push(i);
    });
    for (const [qName, indices] of Object.entries(quadGroups)) {
        const q = quads[qName];
        const yMin = q.ry + 22;
        const yMax = q.ry + q.rh - 10;
        // Clamp the initial positions
        for (const i of indices)
            allPP[i].ly = Math.max(yMin, Math.min(yMax, allPP[i].ly));
        // Sort by Y and resolve the collisions
        indices.sort((a, b) => allPP[a].ly - allPP[b].ly);
        for (let k = 1; k < indices.length; k++) {
            const prev = allPP[indices[k - 1]];
            const curr = allPP[indices[k]];
            if (curr.ly - prev.ly < LH) {
                curr.ly = prev.ly + LH;
            }
        }
        // If the last ones overflow, compress upward
        const last = allPP[indices[indices.length - 1]];
        if (last.ly > yMax) {
            const overflow = last.ly - yMax;
            for (const i of indices)
                allPP[i].ly = Math.max(yMin, allPP[i].ly - overflow);
            // Re-space if compressed
            for (let k = 1; k < indices.length; k++) {
                const prev = allPP[indices[k - 1]];
                const curr = allPP[indices[k]];
                if (curr.ly - prev.ly < LH * 0.7)
                    curr.ly = prev.ly + LH * 0.7;
            }
        }
    }
    // Pass 3: draw connectors, circles, labels
    for (const p of allPP) {
        const ex = p.isLeft ? p.px - p.cr - 2 : p.px + p.cr + 2;
        const lx2 = p.isLeft ? p.lx + 2 : p.lx - 2;
        svg += `<path d="M${ex},${p.py} C${(ex + lx2) / 2},${p.py} ${(ex + lx2) / 2},${p.ly} ${lx2},${p.ly}" fill="none" stroke="#cbd5e1" stroke-width="0.8" />`;
        svg += `<circle cx="${lx2}" cy="${p.ly}" r="1.5" fill="#cbd5e1" />`;
    }
    // PP circles
    for (const p of allPP) {
        svg += `<circle cx="${p.px}" cy="${p.py}" r="${p.cr}" fill="${p.fill}" fill-opacity="0.75" stroke="${p.stroke}" stroke-width="2" />`;
    }
    // Labels
    for (const p of allPP) {
        const anchor = p.isLeft ? "end" : "start";
        svg += `<text x="${p.lx}" y="${p.ly + 4}" font-size="9" fill="#475569" text-anchor="${anchor}" font-weight="600">${p.labelText}</text>`;
    }
    // Legend at the bottom
    const ly = CY + R + M + 20;
    svg += `<circle cx="60" cy="${ly}" r="10" fill="none" stroke="#dc2626" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="76" y="${ly + 4}" font-size="10" fill="#475569">${t("ebios.eco.zone_danger")}</text>`;
    svg += `<circle cx="280" cy="${ly}" r="10" fill="none" stroke="#eab308" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="296" y="${ly + 4}" font-size="10" fill="#475569">${t("ebios.eco.zone_controle")}</text>`;
    svg += `<circle cx="520" cy="${ly}" r="10" fill="none" stroke="#14b8a6" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="536" y="${ly + 4}" font-size="10" fill="#475569">${t("ebios.eco.zone_veille")}</text>`;
    const ly2 = ly + 24;
    svg += `<text x="60" y="${ly2}" font-size="9" fill="#94a3b8" font-weight="600">${t("ebios.eco.fiabilite")}</text>`;
    const fiabs = [["#dc2626", t("ebios.eco.fiab_faible"), 170], ["#f59e0b", t("ebios.eco.fiab_moyenne"), 250], ["#eab308", t("ebios.eco.fiab_bonne"), 340], ["#16a34a", t("ebios.eco.fiab_elevee"), 420]];
    for (const [c, label, fx] of fiabs) {
        svg += `<circle cx="${fx}" cy="${ly2 - 3}" r="5" fill="${c}" fill-opacity="0.75" />`;
        svg += `<text x="${fx + 8}" y="${ly2}" font-size="9" fill="#94a3b8">${label}</text>`;
    }
    svg += `<text x="500" y="${ly2}" font-size="9" fill="#94a3b8" font-weight="600">${t("ebios.eco.diametre")}</text>`;
    svg += '</svg>';
    return svg;
}
function renderEcoMap() {
    const el = document.getElementById("eco-map");
    if (!el || D.pp.length === 0) {
        if (el)
            el.innerHTML = "";
        return;
    }
    const ppData = D.pp.map(p => {
        const d = p.dependance || 0, pen = p.penetration || 0, m = p.maturite || 0, c = p.confiance || 0;
        const eco = D.eco.find(e => (e.pp_id || "").split(" - ")[0].trim() === p.id);
        const dr = eco && eco.dep_resid ? eco.dep_resid : d;
        const pr = eco && eco.pen_resid ? eco.pen_resid : pen;
        const mr = eco && eco.mat_resid ? eco.mat_resid : m;
        const cr = eco && eco.conf_resid ? eco.conf_resid : c;
        const menace = computeMenace(dr, pr, mr, cr) || 0;
        return { id: p.id, nom: p.nom, cat: p.categorie || "", menace, fiab: (mr || 0) * (cr || 0), expo: (dr || 0) * (pr || 0) };
    });
    el.innerHTML = _buildEcoSVG(ppData, t("ebios.eco.map_after"));
}
function renderPPMap() {
    const el = document.getElementById("pp-map");
    if (!el || D.pp.length === 0) {
        if (el)
            el.innerHTML = "";
        return;
    }
    const ppData = D.pp.map(p => {
        const d = p.dependance || 0, pen = p.penetration || 0, m = p.maturite || 0, c = p.confiance || 0;
        const menace = computeMenace(d, pen, m, c) || 0;
        return { id: p.id, nom: p.nom, cat: p.categorie || "", menace, fiab: (m || 0) * (c || 0), expo: (d || 0) * (pen || 0) };
    });
    el.innerHTML = _buildEcoSVG(ppData, t("ebios.eco.map_initial"));
}
function renderEco() {
    // Auto-populate eco entries for PPs that don't have one yet
    D.pp.forEach(pp => {
        const ppRef = pp.id + " - " + pp.nom;
        if (!D.eco.some(e => (e.pp_id || "").split(" - ")[0].trim() === pp.id)) {
            D.eco.push({ pp_id: ppRef, mesures_existantes: "", mesures_complementaires: "", categorie: "",
                dep_resid: pp.dependance || "", pen_resid: pp.penetration || "", mat_resid: pp.maturite || "", conf_resid: pp.confiance || "" });
        }
    });
    const tc = [{ key: "exist", label: t("ebios.col.eco_existantes"), on: true }, { key: "compl", label: t("ebios.col.eco_complementaires"), on: true }, { key: "dep", label: t("ebios.col.eco_dep"), on: true }, { key: "pen", label: t("ebios.col.eco_pen"), on: true }, { key: "mat", label: t("ebios.col.eco_mat"), on: true }, { key: "conf", label: t("ebios.col.eco_conf"), on: true }, { key: "mr", label: t("ebios.col.eco_menace"), on: true }, { key: "er", label: t("ebios.col.eco_exposition"), on: true }];
    document.getElementById("toggles-eco").innerHTML = colsButton("eco-table");
    let h = `<table id="eco-table"><thead><tr><th class="w-60">${t("ebios.col.eco_pp")}</th><th${hd("ppnom")}>${t("ebios.col.eco_nom")}</th><th${hd("exist")}>${t("ebios.col.eco_existantes")}</th><th${hd("compl")}>${t("ebios.col.eco_complementaires")}</th><th${hd("dep")} class="w-40">${t("ebios.col.eco_dep")}</th><th${hd("pen")} class="w-40">${t("ebios.col.eco_pen")}</th><th${hd("mat")} class="w-40">${t("ebios.col.eco_mat")}</th><th${hd("conf")} class="w-40">${t("ebios.col.eco_conf")}</th><th${hd("mr")}>${t("ebios.col.eco_menace")}</th><th${hd("er")}>${t("ebios.col.eco_exposition")}</th></tr></thead><tbody>`;
    D.eco.forEach((e, i) => {
        const dr = e.dep_resid, pr = e.pen_resid, mr = e.mat_resid, cr = e.conf_resid;
        const menace = computeMenace(dr, pr, mr, cr);
        const expo = computeExposition(menace);
        const ppRaw = e.pp_id || "";
        const ppId = ppRaw.split(" - ")[0].trim();
        const pp = D.pp.find(p => p.id === ppId);
        const ppNom = pp ? pp.nom : ppRaw.split(" - ").slice(1).join(" - ").trim();
        h += `<tr><td><strong>${esc(ppId)}</strong></td><td${hd("ppnom")}>${esc(ppNom)}</td>
            <td${hd("exist")}>${refSelect("eco", i, "mesures_existantes", e.mesures_existantes || "", measuresOptions())}</td>
            <td${hd("compl")}>${refSelect("eco", i, "mesures_complementaires", e.mesures_complementaires || "", measuresOptions())}<button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="addEcoMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_measure")}</button></td>
            <td${hd("dep")}>${sel("eco", i, "dep_resid", dr, _range(1, pp ? pp.dependance : 4))}</td>
            <td${hd("pen")}>${sel("eco", i, "pen_resid", pr, _range(1, pp ? pp.penetration : 4))}</td>
            <td${hd("mat")}>${sel("eco", i, "mat_resid", mr, _range(pp ? pp.maturite : 1, 4))}</td>
            <td${hd("conf")}>${sel("eco", i, "conf_resid", cr, _range(pp ? pp.confiance : 1, 4))}</td>
            <td${hd("mr")} class="computed">${menace !== null ? menace.toFixed(2) : ""}</td>
            <td${hd("er")} class="computed">${_expoBadge(expo)}</td>
            </tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-eco").innerHTML = h;
    _setupTable("eco-table", tc.filter(c => !c.on).map(c => c.key));
    renderEcoMap();
}
function addEcoMeasure(ecoIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_eco_measure"));
    if (!desc)
        return;
    const id = nextId("measures");
    const ppId = D.eco[ecoIdx] ? (D.eco[ecoIdx].pp_id || "").split(" - ")[0].trim() : "";
    const ppNom = D.eco[ecoIdx] ? (D.eco[ecoIdx].pp_id || "").split(" - ").slice(1).join(" - ").trim() : "";
    // Create the measure in 5a
    D.measures.push({
        id: id, mesure: desc, origine: "Écosystème", type: "Prévention",
        sop: "", phase: "", effet: t("ebios.m.mesure_eco_pour", { pp: ppNom || ppId }),
        ref_socle: "", responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    // Add the reference into the eco's complementary measures field
    const current = D.eco[ecoIdx].mesures_complementaires || "";
    const newRef = id + " - " + desc;
    D.eco[ecoIdx].mesures_complementaires = current ? current + ", " + newRef : newRef;
    renderEco();
    renderMeasures();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", { id: id }));
    _persist("measures");
    _persist("eco");
}
function renderSOP() {
    const tc = [{ key: "ss", label: t("ebios.col.sop_ss"), on: true }, { key: "action", label: t("ebios.col.sop_action"), on: true }, { key: "bs", label: t("ebios.col.sop_bs"), on: true }, { key: "ctrl", label: t("ebios.col.sop_controle"), on: true }, { key: "ref", label: t("ebios.col.sop_ref"), on: false }, { key: "mp", label: t("ebios.col.sop_mesure_proposee"), on: true }];
    document.getElementById("toggles-sop").innerHTML = colsButton("sop-table");
    // Compute the rowspans for SOP and SS — group by identical SOP ID
    // A row with no SOP ID, or the same SOP ID as the previous one = same group
    const spans = [];
    let si = 0;
    while (si < D.sop_detail.length) {
        const sopId = D.sop_detail[si].sop || "";
        let count = 1;
        while (si + count < D.sop_detail.length) {
            const nextSop = D.sop_detail[si + count].sop || "";
            // Same group if: no SOP ID, or same SOP ID as the first one
            if (!nextSop || nextSop === sopId) {
                count++;
            }
            else
                break;
        }
        for (let j = 0; j < count; j++)
            spans.push(j === 0 ? count : 0);
        si += count;
    }
    let h = `<table id="sop-table" class="table-fixed"><thead><tr><th class="w-85">${t("ebios.col.sop_sop")}</th><th${hd("ss")} class="minw-140">${t("ebios.col.sop_ss")}</th><th>${t("ebios.col.sop_phase")}</th><th${hd("action")}>${t("ebios.col.sop_action")}</th><th${hd("bs")}>${t("ebios.col.sop_bs")}</th><th${hd("ctrl")}>${t("ebios.col.sop_controle")}</th><th${hd("ref")}>${t("ebios.col.sop_ref")}</th><th class="w-80">${t("ebios.col.sop_efficacite")}</th><th${hd("mp")}>${t("ebios.col.sop_mesure_proposee")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    // Compute the phase number inside each group
    let phaseNums = [];
    let pn = 0;
    for (let i = 0; i < D.sop_detail.length; i++) {
        if (spans[i] > 0)
            pn = 0;
        pn++;
        phaseNums.push(pn);
    }
    D.sop_detail.forEach((s, i) => {
        h += '<tr>';
        if (spans[i] > 0) {
            h += `<td rowspan="${spans[i]}" class="ct-va-top ct-strong ct-bg-alt">${esc(s.sop)}<br><button class="ct-btn" data-size="xs" data-variant="primary" data-click="addSOPPhase" data-args='${_da(i)}'>${t("ebios.btn.add_phase")}</button></td>`;
            h += `<td${hd("ss")} rowspan="${spans[i]}" class="ct-va-top ct-bg-alt">${refSelect("sop_detail", i, "ss", s.ss, ssOptions())}</td>`;
        }
        // Phase: auto number + ATT&CK tactic (list) or free text
        h += `<td><span class="ct-muted ct-strong">${phaseNums[i]}.</span> ${_sopPhaseSelect(i, s.phase)}</td>
            <td${hd("action")}>${ta("sop_detail", i, "action", s.action)}</td>
            <td${hd("bs")}>${refSelect("sop_detail", i, "bs", s.bs, bsOptions())}</td>
            <td${hd("ctrl")}>${ta("sop_detail", i, "controle", s.controle)}</td>
            <td${hd("ref")}>${refSelect("sop_detail", i, "ref", s.ref, socleOptions())}</td>
            <td class="ta-c"><span class="eff-badge" data-click="_effBadgeClick" data-pass-el>${s.efficacite ? '<span class="ct-badge" data-tone="' + (_effTones[s.efficacite] || "neutral") + '">' + esc(s.efficacite) + '</span>' : `<span class="text-muted fs-xs cursor-pointer">${t("ebios.col.sop_choose")}</span>`}</span><span class="hidden">${sel("sop_detail", i, "efficacite", s.efficacite, [t("ebios.eff.absent"), t("ebios.eff.partiel"), t("ebios.eff.efficace")])}</span></td>
            <td${hd("mp")}>${refSelect("sop_detail", i, "mesure_proposee", s.mesure_proposee, measuresOptions())}<button class="ct-btn mt-8" data-write data-variant="primary" data-size="xs" data-click="addSOPMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_measure")}</button></td>`;
        h += `<td><div class="phase-actions">`;
        h += `<button class="ct-btn" data-size="xs" data-variant="primary" data-icon data-click="moveSOPPhase" data-args='${_da(i, -1)}' title="Monter">&#9650;</button>`;
        h += `<button class="ct-btn" data-size="xs" data-variant="primary" data-icon data-click="moveSOPPhase" data-args='${_da(i, 1)}' title="Descendre">&#9660;</button>`;
        h += `<button class="ct-btn" data-variant="danger" data-size="xs" data-click="delSOPPhase" data-args='${_da(i)}' data-icon>${_icon("trash", 14)}</button>`;
        h += `</div></td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-sop").innerHTML = h;
    _setupTable("sop-table", tc.filter(c => !c.on).map(c => c.key));
}
function addSOP() {
    _saveState();
    // Find the next SOP number
    const sopId = nextSopId();
    D.sop_detail.push({
        sop: sopId, ss: "", phase: "", action: "",
        bs: "", controle: "", ref: "", efficacite: "", commentaire: "",
        mesure_proposee: "", type_mesure: "",
    });
    // Also add it into sop_summary
    D.sop_summary.push({ sop: sopId, ss: "" });
    renderSOP();
    renderIndicators();
    showStatus(t("ebios.status.sop_added", { id: sopId }));
    _persist("sop_detail");
    _persist("sop_summary");
}
function _syncSopMeasuresToResiduals(sopDetailIdx, oldVal, newVal) {
    var sopId = _findSOPGroup(sopDetailIdx);
    if (!sopId)
        return;
    var newRefs = (newVal || "").split(",").map(function (r) { return r.trim(); }).filter(Boolean);
    var oldRefs = (oldVal || "").split(",").map(function (r) { return r.trim(); }).filter(Boolean);
    var added = newRefs.filter(function (r) { return oldRefs.indexOf(r) < 0; });
    if (added.length === 0)
        return;
    var sopToSS = _sopToSS();
    var ssIds = sopToSS[sopId];
    if (!ssIds)
        return;
    ssIds.forEach(function (ssId) {
        var ssIdx = D.ss.findIndex(function (s) { return s.id === ssId; });
        if (ssIdx < 0)
            return;
        if (!D.residuals[ssIdx])
            D.residuals[ssIdx] = { mesures: "", v_resid: "", decision: "" };
        var cur = D.residuals[ssIdx].mesures || "";
        var refs = cur ? cur.split(",").map(function (r) { return r.trim(); }).filter(Boolean) : [];
        added.forEach(function (a) { if (refs.indexOf(a) < 0)
            refs.push(a); });
        D.residuals[ssIdx].mesures = refs.join(", ");
    });
}
function addSOPPhase(firstIdx) {
    _saveState();
    // Add a phase after the last phase of the same SOP
    const sopId = D.sop_detail[firstIdx].sop;
    let lastIdx = firstIdx;
    for (let j = firstIdx + 1; j < D.sop_detail.length; j++) {
        if (D.sop_detail[j].sop)
            break;
        lastIdx = j;
    }
    D.sop_detail.splice(lastIdx + 1, 0, {
        sop: "", ss: "", phase: "", action: "",
        bs: "", controle: "", ref: "", efficacite: "", commentaire: "",
        mesure_proposee: "", type_mesure: "",
    });
    renderSOP();
    showStatus(t("ebios.status.phase_added", { id: sopId }));
    _persist("sop_detail");
}
function _setSOPPhase(idx, value) {
    _saveState();
    if (value === "__other__") {
        const cur = String(D.sop_detail[idx].phase || "").replace(/^\d+\.\s*/, "").trim();
        const txt = prompt(t("ebios.sop.phase_free_prompt"), _attackResolveId(cur) ? "" : cur);
        D.sop_detail[idx].phase = (txt || "").trim();
    }
    else {
        D.sop_detail[idx].phase = value; // tactic id or ""
    }
    renderSOP();
    _persist("sop_detail");
}
function _setSOPPhaseText(idx, value) {
    D.sop_detail[idx].phase = (value || "").trim();
    _persist("sop_detail");
}
function _findSOPGroup(idx) {
    // Find the SOP ID of the group the index belongs to
    const s = D.sop_detail[idx];
    if (s.sop)
        return s.sop;
    for (let j = idx - 1; j >= 0; j--) {
        if (D.sop_detail[j].sop)
            return D.sop_detail[j].sop;
    }
    return "";
}
function _findSOPStart(sopId) {
    for (let j = 0; j < D.sop_detail.length; j++) {
        if (D.sop_detail[j].sop === sopId)
            return j;
    }
    return -1;
}
function moveSOPPhase(idx, dir) {
    _saveState();
    const target = idx + dir;
    if (target < 0 || target >= D.sop_detail.length)
        return;
    const mySop = _findSOPGroup(idx);
    const targetSop = _findSOPGroup(target);
    if (mySop !== targetSop)
        return;
    // Do not move the first row of the group (it carries the SOP ID + SS)
    const groupStart = _findSOPStart(mySop);
    if (idx === groupStart && dir === -1)
        return;
    if (target === groupStart && dir === -1)
        return;
    if (idx === groupStart)
        return; // the first row does not move
    [D.sop_detail[idx], D.sop_detail[target]] = [D.sop_detail[target], D.sop_detail[idx]];
    renderSOP();
    showStatus(t("ebios.status.phase_moved"));
    _persist("sop_detail");
}
function delSOPPhase(idx) {
    _saveState();
    const mySop = _findSOPGroup(idx);
    const groupStart = _findSOPStart(mySop);
    if (idx === groupStart) {
        // First row = delete the whole SOP
        if (!confirm(t("ebios.confirm.delete_sop", { sop: mySop })))
            return;
        let end = groupStart + 1;
        while (end < D.sop_detail.length) {
            const nextSop = D.sop_detail[end].sop;
            if (nextSop && nextSop !== mySop)
                break;
            end++;
        }
        D.sop_detail.splice(groupStart, end - groupStart);
        D.sop_summary = D.sop_summary.filter(s => s.sop !== mySop);
    }
    else {
        D.sop_detail.splice(idx, 1);
    }
    renderSOP();
    renderIndicators();
    showStatus(t("ebios.status.deleted"));
    _persist("sop_detail");
    _persist("sop_summary");
}
function addSOPMeasure(sopIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_sop_measure"));
    if (!desc)
        return;
    const id = nextId("measures");
    const sopId = D.sop_detail[sopIdx] ? D.sop_detail[sopIdx].sop || "" : "";
    const phase = D.sop_detail[sopIdx] ? _attackLabel(D.sop_detail[sopIdx].phase) : "";
    // Create the measure in 5a
    D.measures.push({
        id: id, mesure: desc, origine: "SOP", type: "Prévention",
        sop: sopId, phase: phase, effet: "",
        ref_socle: "", responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    const current = D.sop_detail[sopIdx].mesure_proposee || "";
    const newRef = id + " - " + desc;
    D.sop_detail[sopIdx].mesure_proposee = current ? current + ", " + newRef : newRef;
    _syncSopMeasuresToResiduals(sopIdx, current, D.sop_detail[sopIdx].mesure_proposee);
    renderSOP();
    renderMeasures();
    renderResiduals();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", { id: id }));
    _persist("measures");
    _persist("sop_detail");
    _persist("residuals");
}
function _computeSOPVop() {
    // Count the phases per SOP and compute the operational likelihood
    const sopPhases = {};
    D.sop_detail.forEach(s => {
        const sopId = s.sop;
        if (!sopId)
            return;
        if (!sopPhases[sopId])
            sopPhases[sopId] = { absent: 0, partiel: 0, efficace: 0, total: 0 };
        sopPhases[sopId].total++;
        if (s.efficacite === "Absent")
            sopPhases[sopId].absent++;
        else if (s.efficacite === "Partiel")
            sopPhases[sopId].partiel++;
        else if (s.efficacite === "Efficace")
            sopPhases[sopId].efficace++;
    });
    const sopVop = {};
    const sopTaux = {};
    for (const [sopId, ph] of Object.entries(sopPhases)) {
        if (ph.total === 0)
            continue;
        const taux = Math.max(0, (ph.absent * 2 + ph.partiel - ph.efficace * 2)) / (ph.total * 2);
        sopTaux[sopId] = taux;
        sopVop[sopId] = taux >= 0.7 ? 4 : taux >= 0.4 ? 3 : taux >= 0.2 ? 2 : 1;
    }
    return { sopVop, sopTaux, sopPhases };
}
function _sopToSS() {
    // Derive the SOP→SS link from sop_detail (source of truth)
    // A SOP can be linked to several SS (multi-select)
    const map = {};
    D.sop_detail.forEach(s => {
        if (!s.sop || !s.ss)
            return;
        if (!map[s.sop])
            map[s.sop] = new Set();
        // Extract the SS IDs. Format: "SS-001 - Nom, SS-002 - Nom" (padding
        // varies with the version). Regex rather than substring to avoid
        // truncating SS-001 into SS-00.
        const ids = s.ss.split(",")
            .map(x => (x.trim().match(/^SS-\d+/) || [""])[0])
            .filter(Boolean);
        ids.forEach(id => map[s.sop].add(id));
    });
    // Synchronize sop_summary
    const existingSops = new Set(D.sop_summary.map(s => s.sop));
    for (const [sopId, ssSet] of Object.entries(map)) {
        const ssStr = [...ssSet].join(", ");
        const entry = D.sop_summary.find(s => s.sop === sopId);
        if (entry)
            entry.ss = ssStr;
        else if (!existingSops.has(sopId))
            D.sop_summary.push({ sop: sopId, ss: ssStr });
    }
    return map;
}
function renderSOPSynth() {
    const { sopVop, sopTaux, sopPhases } = _computeSOPVop();
    const sopToSS = _sopToSS();
    // Initial V per SS = MAX operational likelihood of the associated SOPs
    const ssData = {};
    for (const [sopId, ssSet] of Object.entries(sopToSS)) {
        for (const ssId of ssSet) {
            if (!ssData[ssId])
                ssData[ssId] = { vInit: 0, sops: [] };
            const v = sopVop[sopId] || 0;
            if (v > ssData[ssId].vInit)
                ssData[ssId].vInit = v;
            ssData[ssId].sops.push({
                sop: sopId,
                taux: sopTaux[sopId],
                vop: sopVop[sopId],
                phases: sopPhases[sopId] || { absent: 0, partiel: 0, efficace: 0, total: 0 },
            });
        }
    }
    let h = '<table id="sop-synth-table" class="table-fixed"><thead><tr>';
    h += `<th class="w-60">${t("ebios.col.sopsynth_ss")}</th><th class="minw-200">${t("ebios.col.sopsynth_scenario")}</th>`;
    h += `<th class="w-80">${t("ebios.col.sopsynth_gravite")}</th>`;
    h += `<th class="w-80">${t("ebios.col.sopsynth_sop")}</th><th class="w-180">${t("ebios.col.sopsynth_efficacite")}</th>`;
    h += `<th class="w-100">${t("ebios.col.sopsynth_taux")}</th><th class="w-80">${t("ebios.col.sopsynth_vinit")}</th>`;
    h += `<th class="w-100">${t("ebios.col.sopsynth_risque")}</th>`;
    h += '</tr></thead><tbody>';
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const gLbl = gNum ? gravLabel(gNum) : "";
        const sd = ssData[s.id] || { vInit: 0, sops: [] };
        const vInit = sd.vInit;
        const risk = riskLevel(gNum, vInit);
        const rc = riskColor(risk);
        const rspan = sd.sops.length || 1;
        sd.sops.forEach((sop, j) => {
            h += '<tr>';
            if (j === 0) {
                h += `<td rowspan="${rspan}" class="ct-strong ct-va-top">${esc(s.id)}</td>`;
                h += `<td rowspan="${rspan}" class="ct-va-top ct-text-data">${esc(s.scenario)}</td>`;
                h += `<td rowspan="${rspan}" class="ta-c-va-t">${gNum ? _gravBadge(gLbl, gNum) : ""}</td>`;
            }
            const ph = sop.phases;
            const tauxPct = sop.taux != null ? (sop.taux * 100).toFixed(0) + "%" : "";
            const tauxColor = sop.taux >= 0.7 ? "var(--ct-critical)" : sop.taux >= 0.4 ? "var(--ct-high)" : sop.taux >= 0.2 ? "var(--ct-medium)" : "var(--ct-low)";
            h += `<td class="fw-600">${esc(sop.sop)}</td>`;
            h += `<td><div class="ct-flex ct-body ct-gap-1 ct-items-center">${ph.absent ? _effBadge(ph.absent, t("ebios.eff.absent"), "Absent") : ""}${ph.partiel ? _effBadge(ph.partiel, t("ebios.eff.partiel"), "Partiel") : ""}${ph.efficace ? _effBadge(ph.efficace, t("ebios.eff.efficace"), "Efficace") : ""}</div></td>`;
            h += `<td class="ta-c"><span style="color:${tauxColor};font-weight:600">${tauxPct}</span></td>`;
            if (j === 0) {
                h += `<td rowspan="${rspan}" class="ct-ta-c ct-va-top ct-strong">${vInit || ""}</td>`;
                h += `<td rowspan="${rspan}" class="ta-c-va-t">${risk ? _riskBadge(risk) : '<span class="text-muted">—</span>'}</td>`;
            }
            h += '</tr>';
        });
        if (sd.sops.length === 0) {
            h += `<tr><td class="fw-600">${esc(s.id)}</td><td class="ct-text-data">${esc(s.scenario)}</td>`;
            h += `<td class="ta-c">${gNum ? _gravBadge(gLbl, gNum) : ""}</td>`;
            h += `<td colspan="3" class="ct-ta-c ct-journal-sep ct-italic">${t("ebios.col.sopsynth_no_sop")}</td>`;
            h += `<td class="ta-c">—</td><td class="ta-c"><span class="text-muted">—</span></td></tr>`;
        }
    });
    h += '</tbody></table>';
    document.getElementById("table-sop-synth").innerHTML = h;
}
function renderMeasures() {
    const tc = [{ key: "details", label: t("ebios.col.m_details"), on: true }, { key: "orig", label: t("ebios.col.m_origine"), on: true }, { key: "type", label: t("ebios.col.m_type"), on: true }, { key: "sop", label: t("ebios.col.m_sop"), on: false }, { key: "phase", label: t("ebios.col.m_phase"), on: false }, { key: "effet", label: t("ebios.col.m_effet"), on: false }, { key: "ref", label: t("ebios.col.m_ref_socle"), on: true }, { key: "resp", label: t("ebios.col.m_responsable"), on: true }, { key: "ech", label: t("ebios.col.m_echeance"), on: true }, { key: "cout", label: t("ebios.col.m_cout"), on: false }, { key: "statut", label: t("ebios.col.m_statut"), on: true }];
    document.getElementById("toggles-measures").innerHTML = colsButton("measures-table");
    let h = `<table id="measures-table"><thead><tr><th>${t("ebios.col.m_id")}</th><th class="minw-150">${t("ebios.col.m_mesure")}</th><th${hd("details")} class="minw-200">${t("ebios.col.m_details")}</th><th${hd("orig")}>${t("ebios.col.m_origine")}</th><th${hd("type")}>${t("ebios.col.m_type")}</th><th${hd("sop")}>${t("ebios.col.m_sop")}</th><th${hd("phase")}>${t("ebios.col.m_phase")}</th><th${hd("effet")}>${t("ebios.col.m_effet")}</th><th${hd("ref")}>${t("ebios.col.m_ref_socle")}</th><th${hd("resp")}>${t("ebios.col.m_responsable")}</th><th${hd("ech")}>${t("ebios.col.m_echeance")}</th><th${hd("cout")}>${t("ebios.col.m_cout")}</th><th${hd("statut")}>${t("ebios.col.m_statut")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.measures.forEach((m, i) => {
        h += `<tr><td><strong>${esc(m.id)}</strong></td><td>${inp("measures", i, "mesure", m.mesure)}</td>
            <td${hd("details")}>${ta("measures", i, "details", m.details || "")}</td>
            <td${hd("orig")}>${sel("measures", i, "origine", m.origine || "", ["Socle", "Écosystème", "SOP", "Complémentaire"])}</td>
            <td${hd("type")}>${sel("measures", i, "type", m.type, ["Prévention", "Détection", "Réaction"])}</td>
            <td${hd("sop")}>${refSelect("measures", i, "sop", m.sop, sopOptions())}</td>
            <td${hd("phase")}>${inp("measures", i, "phase", m.phase)}</td>
            <td${hd("effet")}>${ta("measures", i, "effet", m.effet)}</td>
            <td${hd("ref")}>${refSelect("measures", i, "ref_socle", m.ref_socle, socleOptions())}</td>
            <td${hd("resp")}>${_dirPicker(m.responsable || "", "updateField", _da("measures", i, "responsable"))}</td>
            <td${hd("ech")}>${inp("measures", i, "echeance", m.echeance, "date")}</td>
            <td${hd("cout")}>${inp("measures", i, "cout", m.cout)}</td>
            <td${hd("statut")} class="ta-c"><span class="eff-badge" data-click="_effBadgeClick" data-pass-el>${m.statut ? _statutBadge(m.statut) : `<span class="text-muted fs-xs cursor-pointer">${t("ebios.col.sop_choose")}</span>`}</span><span class="hidden">${sel("measures", i, "statut", m.statut, ["Terminé", "En cours", "À étudier"], _statutLabel)}</span></td>
            <td>${delBtn("measures", i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-measures").innerHTML = h;
    _setupTable("measures-table", tc.filter(c => !c.on).map(c => c.key));
}
// Compute initial likelihood per SS (MAX operational likelihood of associated SOPs)
function _ssVInit() {
    const { sopVop } = _computeSOPVop();
    const sopToSS = _sopToSS();
    const vInitMap = {};
    for (const [sopId, ssSet] of Object.entries(sopToSS)) {
        for (const ssId of ssSet) {
            const v = sopVop[sopId] || 0;
            if (!vInitMap[ssId] || v > vInitMap[ssId])
                vInitMap[ssId] = v;
        }
    }
    return vInitMap;
}
function renderResiduals() {
    const vInitMap = _ssVInit();
    const tc = [{ key: "scenario", label: t("ebios.col.r_scenario"), on: true }, { key: "grav", label: t("ebios.col.r_gravite"), on: true }, { key: "mesures", label: t("ebios.col.r_mesures"), on: true }, { key: "vi", label: t("ebios.col.r_v_init"), on: true }, { key: "vr", label: t("ebios.col.r_v_resid"), on: true }, { key: "rr", label: t("ebios.col.r_risque"), on: true }, { key: "dec", label: t("ebios.col.r_decision"), on: true }];
    document.getElementById("toggles-residuals").innerHTML = colsButton("resid-table");
    let h = `<table id="resid-table"><thead><tr><th>${t("ebios.col.r_ss")}</th><th${hd("scenario")}>${t("ebios.col.r_scenario")}</th><th${hd("grav")}>${t("ebios.col.r_gravite")}</th><th${hd("mesures")} class="w-180">${t("ebios.col.r_mesures")}</th><th${hd("vi")}>${t("ebios.col.r_v_init")}</th><th${hd("vr")}>${t("ebios.col.r_v_resid")}</th><th${hd("rr")}>${t("ebios.col.r_risque")}</th><th${hd("dec")}>${t("ebios.col.r_decision")}</th></tr></thead><tbody>`;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const lbl = gravLabel(gNum);
        const res = D.residuals[i] || {};
        const vInit = vInitMap[s.id] || 0;
        const vr = res.v_resid;
        // Clamp v_resid to not exceed vInit
        const vrClamped = (vr && vInit && vr > vInit) ? vInit : vr;
        if (vrClamped !== vr && vr) {
            if (!D.residuals[i])
                D.residuals[i] = {};
            D.residuals[i].v_resid = vrClamped;
        }
        const risk = riskLevel(gNum, vrClamped);
        const rColor = riskColor(risk);
        const riInit = riskLevel(gNum, vInit);
        const riInitColor = riskColor(riInit);
        // v_resid options: 1 to vInit (cannot exceed initial)
        const vrOptions = [];
        for (let v = 1; v <= (vInit || 4); v++)
            vrOptions.push(v);
        h += `<tr><td>${esc(s.id)}</td><td${hd("scenario")}>${esc(s.scenario)}</td>
            <td${hd("grav")} class="computed">${lbl ? _gravBadge(lbl, gNum) : ""}</td>
            <td${hd("mesures")}>${refSelect("residuals", i, "mesures", res.mesures || "", measuresOptions())}</td>
            <td${hd("vi")} class="computed">${vInit ? _riskBadge(riInit ? "V" + vInit + " \u2014 " + riInit : "V" + vInit) : '<span class="text-muted">—</span>'}</td>
            <td${hd("vr")}>${sel("residuals", i, "v_resid", vrClamped, vrOptions)}</td>
            <td${hd("rr")} class="computed">${risk ? _riskBadge(risk) : ""}</td>
            <td${hd("dec")}>${sel("residuals", i, "decision", res.decision || "", ["Accepter", "Réduire", "Transférer", "Éviter"])}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-residuals").innerHTML = h;
    _setupTable("resid-table", tc.filter(c => !c.on).map(c => c.key));
}
// Single source of truth for the synthesis aggregates — consumed by both the
// Synthesis view (renderSynthesis) and the managerial export (PPTX/PDF).
// Pure: reads D, returns data, touches no DOM.
function _synthesisData() {
    const sopVop = _computeSOPVop().sopVop;
    const sopToSS = _sopToSS();
    const ssVinit = {};
    for (const sopId in sopToSS) {
        const v = sopVop[sopId] || 0;
        sopToSS[sopId].forEach(function (ssId) { if (v > (ssVinit[ssId] || 0))
            ssVinit[ssId] = v; });
    }
    const EL = t("ebios.risk.eleve"), MO = t("ebios.risk.moyen"), FA = t("ebios.risk.faible");
    const dist = { eleve: 0, moyen: 0, faible: 0, nonEval: 0 };
    const positions = [], rows = [];
    D.ss.forEach(function (s, i) {
        const gNum = computeSSGravity(s.er);
        const res = D.residuals[i] || {};
        const vInit = ssVinit[s.id] || 0;
        const vResid = res.v_resid ? parseInt(String(res.v_resid)) : 0;
        positions.push({ id: s.id, gNum: gNum, vInit: vInit, vResid: vResid });
        const riskResid = vResid ? riskLevel(gNum, vResid) : "";
        if (riskResid === EL)
            dist.eleve++;
        else if (riskResid === MO)
            dist.moyen++;
        else if (riskResid === FA)
            dist.faible++;
        else
            dist.nonEval++;
        rows.push({
            id: s.id, scenario: s.scenario || "", gNum: gNum, vInit: vInit, vResid: vResid,
            riskInit: riskLevel(gNum, vInit), riskResid: riskResid, decision: res.decision || ""
        });
    });
    const isAnssi = D.socle_type !== "iso";
    const socleRows = (isAnssi ? D.socle_anssi : D.socle_iso) || [];
    const socle = { applique: 0, partiel: 0, nonApp: 0, nonEvalue: 0, avg: 0, count: 0,
        total: socleRows.length, type: isAnssi ? "anssi" : "iso" };
    let totalConf = 0;
    socleRows.forEach(function (s) {
        const c = s.conformite;
        if (c !== "" && c !== null && !isNaN(c)) {
            totalConf += parseFloat(String(c));
            socle.count++;
            if (c >= 80)
                socle.applique++;
            else if (c > 0)
                socle.partiel++;
            else
                socle.nonApp++;
        }
        else
            socle.nonEvalue++;
    });
    socle.avg = socle.count > 0 ? Math.round(totalConf / socle.count) : 0;
    const toDo = D.measures.filter(function (m) { return m.statut && m.statut !== "Terminé" && m.statut !== "À étudier"; });
    const NY = (D.risk_matrix && D.risk_matrix.length) || (D.gravity_scale && D.gravity_scale.length) || 4;
    const NX = (D.risk_matrix && D.risk_matrix[0] && D.risk_matrix[0].levels && D.risk_matrix[0].levels.length) || 4;
    return { ssVinit: ssVinit, dist: dist, positions: positions, rows: rows, socle: socle,
        measures: { todo: toDo, all: D.measures, toDoCount: toDo.length, total: D.measures.length },
        NX: NX, NY: NY };
}
function renderSynthesis() {
    const _sd = _synthesisData();
    // Risk distribution (based on the SS that have a SOP)
    let eleve = _sd.dist.eleve, moyen = _sd.dist.moyen, faible = _sd.dist.faible, nonEval = _sd.dist.nonEval;
    let distH = '<div class="risk-dist">';
    distH += `<div class="risk-bar ct-bg-critical-tint ct-text-critical-ink"><div class="count">${eleve}</div><div class="label">${t("ebios.misc.eleve_label")}</div></div>`;
    distH += `<div class="risk-bar ct-bg-high-tint ct-text-high-ink"><div class="count">${moyen}</div><div class="label">${t("ebios.misc.moyen_label")}</div></div>`;
    distH += `<div class="risk-bar ct-bg-low-tint ct-text-low-ink"><div class="count">${faible}</div><div class="label">${t("ebios.misc.faible_label")}</div></div>`;
    distH += '</div>';
    if (nonEval > 0)
        distH += `<p class="ct-muted ct-text-meta ct-mt-2">${t("ebios.misc.ss_not_evaluated", { n: nonEval })}</p>`;
    document.getElementById("synth-risk-dist").innerHTML = distH;
    // Aggregates from the single source of truth (_synthesisData)
    const ssVinit = _sd.ssVinit;
    const ssPositions = _sd.positions;
    var NY = _sd.NY, NX = _sd.NX;
    function buildMatrix(target, getV) {
        var grid = {};
        ssPositions.forEach(function (sp) {
            var v = getV(sp);
            if (!sp.gNum || !v || v < 1 || v > NX || sp.gNum < 1 || sp.gNum > NY)
                return;
            // Key: x=likelihood, y=severity (X-axis=V, Y-axis=G)
            var key = v + "-" + sp.gNum;
            if (!grid[key])
                grid[key] = [];
            grid[key].push({
                id: sp.id,
                label: sp.id + " — " + (D.ss.find(function (s) { return s.id === sp.id; }) || {}).scenario || ""
            });
        });
        var gLabels = [];
        for (var g = 1; g <= NY; g++) {
            gLabels.push(gravLabel(g) || "G" + g);
        }
        document.getElementById(target).innerHTML = ctRenderMatrix({
            levels: Math.max(NX, NY),
            xLevels: NX,
            yLevels: NY,
            xLabel: t("ebios.synth.col_vraisemblance") || "Vraisemblance",
            yLabel: t("ebios.synth.col_gravite") || "Gravite",
            yLabels: gLabels,
            grid: grid,
            colorFn: function (v, g) {
                // v=vraisemblance (x), g=gravite (y) — use the risk matrix to get the color
                var level = riskLevel(g, v);
                return _riskBg(level);
            },
            legend: [
                { label: t("ebios.risk.faible") || "Faible", color: "var(--ct-low-fill)" },
                { label: t("ebios.risk.moyen") || "Moyen", color: "var(--ct-high-fill)" },
                { label: t("ebios.risk.eleve") || "Eleve", color: "var(--ct-critical-fill)" }
            ],
            tooltipFn: function (items) {
                return items.map(function (item) {
                    return '<div class="ct-py-1 ct-px-0"><strong>' + esc(item.id) + '</strong> ' + esc((item.label || "").split(" — ")[1] || "") + '</div>';
                }).join("");
            }
        });
    }
    buildMatrix("synth-matrix-initial", function (sp) { return sp.vInit; });
    buildMatrix("synth-matrix-residual", function (sp) { return sp.vResid; });
    // Risk evolution
    let evH = `<table><thead><tr><th>${t("ebios.synth.col_ss")}</th><th>${t("ebios.synth.col_scenario")}</th><th>${t("ebios.synth.col_risque_initial")}</th><th>${t("ebios.synth.col_risque_residuel")}</th><th>${t("ebios.synth.col_evolution")}</th><th>${t("ebios.synth.col_decision")}</th></tr></thead><tbody>`;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const vInit = ssVinit[s.id] || 0;
        const res = D.residuals[i] || {};
        const vResid = res.v_resid ? parseInt(String(res.v_resid)) : 0;
        const riskInit = riskLevel(gNum, vInit);
        const riskResid = riskLevel(gNum, vResid);
        const riColor = riskColor(riskInit);
        const rrColor = riskColor(riskResid);
        // Evolution
        let evol = "";
        var riskOrder = {};
        riskOrder[t("ebios.risk.eleve")] = 3;
        riskOrder[t("ebios.risk.moyen")] = 2;
        riskOrder[t("ebios.risk.faible")] = 1;
        const ri = riskOrder[riskInit] || 0;
        const rr = riskOrder[riskResid] || 0;
        if (ri && rr) {
            if (rr < ri)
                evol = `<span class="ct-text-low ct-strong">&#x2198; ${t("ebios.synth.ameliore")}</span>`;
            else if (rr === ri)
                evol = `<span class="text-muted">= ${t("ebios.synth.identique")}</span>`;
            else
                evol = `<span class="ct-text-critical ct-strong">&#x2197; ${t("ebios.synth.degrade")}</span>`;
        }
        else
            evol = '<span class="text-muted">—</span>';
        evH += `<tr><td>${esc(s.id)}</td><td class="fs-sm">${esc(s.scenario)}</td>`;
        evH += `<td class="ta-c">${riskInit ? _riskBadge(riskInit) : "—"}</td>`;
        evH += `<td class="ta-c">${riskResid ? _riskBadge(riskResid) : "—"}</td>`;
        evH += `<td class="ta-c">${evol}</td>`;
        evH += `<td>${esc(res.decision || "")}</td></tr>`;
    });
    evH += '</tbody></table>';
    document.getElementById("synth-evolution").innerHTML = evH;
    // Baseline compliance
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    if (socle.length > 0) {
        let totalConf = 0, count = 0, applique = 0, partiel = 0, nonApp = 0, nonEvalue = 0;
        socle.forEach(s => {
            const c = s.conformite;
            if (c !== "" && c !== null && !isNaN(c)) {
                totalConf += parseFloat(String(c));
                count++;
                if (c >= 80)
                    applique++;
                else if (c > 0)
                    partiel++;
                else
                    nonApp++;
            }
            else
                nonEvalue++;
        });
        const avg = count > 0 ? Math.round(totalConf / count) : 0;
        let scH = '<div class="risk-dist">';
        scH += `<div class="risk-bar ct-bg-critical-tint ct-text-critical-ink"><div class="count">${nonApp}</div><div class="label">${t("ebios.misc.non_applique_label")}</div></div>`;
        scH += `<div class="risk-bar ct-bg-high-tint ct-text-high-ink"><div class="count">${partiel}</div><div class="label">${t("ebios.misc.partiel_label")}</div></div>`;
        scH += `<div class="risk-bar ct-bg-low-tint ct-text-low-ink"><div class="count">${applique}</div><div class="label">${t("ebios.misc.applique_label")}</div></div>`;
        scH += '</div>';
        scH += `<p class="ct-text-meta ct-mt-2 ct-muted">${t("ebios.socle.conformite_moyenne", { avg: avg, count: count })}</p>`;
        document.getElementById("synth-socle").innerHTML = scH;
    }
    else {
        document.getElementById("synth-socle").innerHTML = `<p class="text-muted">${t("ebios.socle.non_evalue")}</p>`;
    }
    // Measures summary
    const showAllMeasures = !!(document.getElementById("synth-measures-all") && document.getElementById("synth-measures-all").checked);
    const filteredMeasures = showAllMeasures ? D.measures.filter(m => m.statut !== "À étudier") : D.measures.filter(m => m.statut && m.statut !== "Terminé" && m.statut !== "À étudier");
    const origColor = { "Socle": "var(--ct-low-tint)", "Écosystème": "var(--ct-medium-tint)", "SOP": "var(--ct-high-tint)", "Complémentaire": "var(--ct-info-tint)" };
    const statutColor = { "Terminé": "var(--ct-low)", "En cours": "var(--ct-high)", "À étudier": "var(--ct-critical)" };
    const hasTerminated = D.measures.some(m => m.statut === "Terminé");
    let msH = hasTerminated ? `<label class="ct-text-meta ct-clickable ct-mb-2 ct-inline-flex ct-items-center ct-gap-1"><input type="checkbox" id="synth-measures-all" ${showAllMeasures ? "checked" : ""} data-change="renderSynthesis"> ${t("ebios.misc.show_terminated")}</label>` : "";
    if (filteredMeasures.length > 0) {
        msH += `<table class="fs-sm"><thead><tr><th>${t("ebios.synth.col_id")}</th><th>${t("ebios.synth.col_mesure")}</th><th>${t("ebios.synth.col_origine")}</th><th>${t("ebios.synth.col_responsable")}</th><th>${t("ebios.synth.col_echeance")}</th><th>${t("ebios.synth.col_statut")}</th></tr></thead><tbody>`;
        filteredMeasures.forEach(m => {
            msH += `<tr><td><strong>${esc(m.id)}</strong></td><td>${esc(m.mesure)}</td>`;
            msH += `<td>${m.origine ? _origineBadge(m.origine) : ""}</td>`;
            msH += `<td>${esc(m.responsable || "")}</td>`;
            msH += `<td>${esc(m.echeance || "")}</td>`;
            msH += `<td>${m.statut ? _statutBadge(m.statut) : ""}</td></tr>`;
        });
        msH += '</tbody></table>';
        const toDoCount = D.measures.filter(m => m.statut && m.statut !== "Terminé" && m.statut !== "À étudier").length;
        msH += `<p class="ct-text-label ct-muted ct-mt-1">${t("ebios.misc.measures_todo_count", { todo: toDoCount, total: D.measures.length })}</p>`;
    }
    else {
        msH += `<p class="text-muted">${t("ebios.misc.no_measures")}</p>`;
    }
    document.getElementById("synth-measures").innerHTML = msH;
}
function renderAll() {
    try {
        // Refresh toolbar right — preserve auth buttons, only inject settings once
        var _tr = document.getElementById("toolbar-right");
        if (_tr && !_tr.querySelector(".toolbar-settings")) {
            var _sh = _getSettingsButtonHTML();
            if (_sh)
                _tr.insertAdjacentHTML("afterbegin", '<span class="toolbar-settings">' + _sh + '</span>');
        }
        // Re-select current panel to refresh content
        if (typeof _currentPanel !== "undefined")
            selectPanel(_currentPanel);
        renderContext();
        renderIndicators();
        renderSynthesis();
        renderVM();
        renderBS();
        renderPP();
        renderSocle();
        renderSROV();
        renderER();
        renderSS();
        renderEco();
        renderSOP();
        renderSOPSynth();
        renderMeasures();
        renderResiduals();
    }
    catch (e) {
        console.error("Erreur renderAll:", e);
        showStatus(t("ebios.status.error", { msg: e.message }));
    }
}
// ═══════════════════════════════════════════════════════════════════════
// IMPORT / EXPORT JSON
// ═══════════════════════════════════════════════════════════════════════
// Common handling of a JSON buffer (encrypted or not)
// File I/O + crypto: see cisotoolbox.js
// ═══════════════════════════════════════════════════════════════════════
// EXPORT / IMPORT EXCEL
// Menu close: see cisotoolbox.js
function _loadExcelJS() {
    return _loadScript("js/vendor/exceljs.min.js", { onStart: () => showStatus(t("ebios.status.loading_exceljs")), onDone: () => showStatus(t("ebios.status.exceljs_loaded")) });
}
// ── Managerial synthesis (PPTX / PDF) ──────────────────────────
// Both exports consume _synthesisData() (single source of truth) and reuse
// the existing risk helpers (riskLevel, gravLabel). Libs are lazy-loaded from
// the CDN (pinned + SRI), mirroring _loadExcelJS.
function _loadPptxGenJS() {
    return _loadScript("js/vendor/pptxgen.bundle.js", { onStart: () => showStatus(t("ebios.status.loading_pptx")) });
}
function _synthFileName() {
    var societe = D.context.societe || _ct().filePrefix || "EBIOS_RM";
    var scope = _ct().getScope ? _ct().getScope(D) : "";
    return (societe + (scope ? "-" + scope : "")).replace(/[\/\\:*?"<>|]/g, "_").substring(0, 60);
}
// Risk level → hex (no '#'), shared by PPTX + PDF
function _riskHex(level) {
    if (level === t("ebios.risk.eleve"))
        return "FCA5A5";
    if (level === t("ebios.risk.moyen"))
        return "FED7AA";
    if (level === t("ebios.risk.faible"))
        return "DCFCE7";
    return "F1F5F9";
}
// {v-g: [ids]} grid for one matrix, from synthesis positions
function _synthGrid(sd, getV) {
    const grid = {};
    sd.positions.forEach(function (sp) {
        const v = getV(sp);
        if (!sp.gNum || !v || v < 1 || v > sd.NX || sp.gNum < 1 || sp.gNum > sd.NY)
            return;
        const key = v + "-" + sp.gNum;
        (grid[key] = grid[key] || []).push(sp.id);
    });
    return grid;
}
async function exportSynthesisPPTX() {
    try {
        await _loadPptxGenJS();
        showStatus(t("ebios.status.generating_pptx"));
        const sd = _synthesisData();
        const pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_WIDE";
        const W = 13.33, ACCENT = "1E3A5F";
        const societe = D.context.societe || "EBIOS RM";
        const dateStr = new Date().toLocaleDateString();
        function header(s, title) {
            s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.7, fill: { color: ACCENT } });
            s.addText(title, { x: 0.5, y: 0.12, w: W - 1, h: 0.46, fontSize: 20, bold: true, color: "FFFFFF" });
        }
        function matrixSlide(title, getV, intro, reading) {
            const s = pptx.addSlide();
            header(s, title);
            if (intro)
                s.addText(intro, { x: 0.5, y: 0.78, w: W - 1, h: 0.55, fontSize: 13, color: "374151" });
            const grid = _synthGrid(sd, getV);
            const cw = Math.min(1.1, 5 / sd.NX), ch = Math.min(0.92, 4.3 / sd.NY), x0 = 1.7, y0 = 1.6;
            for (let g = sd.NY; g >= 1; g--) {
                const row = sd.NY - g;
                s.addText(gravLabel(g) || ("G" + g), { x: 0.25, y: y0 + row * ch, w: 1.35, h: ch, fontSize: 9, align: "right", valign: "middle", color: "374151" });
                for (let v = 1; v <= sd.NX; v++) {
                    const x = x0 + (v - 1) * cw;
                    s.addShape(pptx.ShapeType.rect, { x: x, y: y0 + row * ch, w: cw, h: ch, fill: { color: _riskHex(riskLevel(g, v)) }, line: { color: "FFFFFF", width: 1 } });
                    const ids = grid[v + "-" + g];
                    if (ids && ids.length)
                        s.addText(String(ids.length), { x: x, y: y0 + row * ch, w: cw, h: ch, fontSize: 18, bold: true, align: "center", valign: "middle", color: "1F2937" });
                }
            }
            for (let v = 1; v <= sd.NX; v++)
                s.addText("V" + v, { x: x0 + (v - 1) * cw, y: y0 + sd.NY * ch, w: cw, h: 0.3, fontSize: 9, align: "center", color: "6B7280" });
            s.addText(t("ebios.synth.col_vraisemblance") || "Vraisemblance", { x: x0, y: y0 + sd.NY * ch + 0.3, w: sd.NX * cw, h: 0.3, fontSize: 10, align: "center", color: "374151" });
            if (reading) {
                const px = x0 + sd.NX * cw + 0.5;
                s.addText(reading, { x: px, y: 1.6, w: Math.max(3, W - px - 0.4), h: 4.6, fontSize: 13, color: "374151", valign: "top" });
            }
            return s;
        }
        // Build one or more slides for a table, at most maxRows data rows
        // per slide (PptxGenJS' autoPage overflowed wrapped cells and gave
        // continuation slides no header band). Each page gets the header
        // band, a "(i/n)" suffix and the repeated table header; the intro
        // is shown on the first page only.
        function tableSlide(title, head, rows, intro, maxRows) {
            const FS = 10, tableW = W - 1, per = Math.max(1, maxRows || 15);
            rows = rows || [];
            const pages = [];
            for (let i = 0; i < rows.length; i += per)
                pages.push(rows.slice(i, i + per));
            if (!pages.length)
                pages.push([]);
            const headRow = head.map(function (h) { return { text: h, options: { bold: true, color: "FFFFFF", fill: { color: ACCENT } } }; });
            let firstSlide = null;
            pages.forEach(function (pg, idx) {
                const s = pptx.addSlide();
                header(s, pages.length > 1 ? (title + " (" + (idx + 1) + "/" + pages.length + ")") : title);
                let ty = 0.9;
                if (idx === 0 && intro) {
                    s.addText(intro, { x: 0.5, y: 0.8, w: tableW, h: 0.7, fontSize: 13, color: "374151" });
                    ty = 1.7;
                }
                const body = [headRow].concat(pg.map(function (r) { return r.map(function (c) { return (c && typeof c === "object") ? c : String(c == null ? "" : c); }); }));
                s.addTable(body, { x: 0.5, y: ty, w: tableW, fontSize: FS, valign: "top", border: { type: "solid", color: "E5E7EB", pt: 0.5 } });
                if (!firstSlide)
                    firstSlide = s;
            });
            return firstSlide;
        }
        const sev = function (lvl) { var c = _riskColorName(lvl); return c === "red" ? 3 : c === "orange" ? 2 : c === "green" ? 1 : 0; };
        const distOf = function (key) { var d = { eleve: 0, moyen: 0, faible: 0 }; sd.rows.forEach(function (r) { var c = _riskColorName(r[key]); if (c === "red")
            d.eleve++;
        else if (c === "orange")
            d.moyen++;
        else if (c === "green")
            d.faible++; }); return d; };
        const dInit = distOf("riskInit"), dResid = distOf("riskResid");
        const riskCell = function (lvl) { return { text: lvl || "—", options: { fill: { color: _riskHex(lvl) }, color: "1F2937", bold: true, align: "center" } }; };
        const objet = (D.context && (D.context.objet_etude || D.context.societe)) || societe;
        const socleRef = (D.socle_type === "iso") ? t("ebios.synth.socle_iso") : t("ebios.synth.socle_anssi");
        const socleMeasures = (D.measures || []).filter(function (m) { return (m.origine || "") === "Socle"; }).length;
        // 1. Title
        let s = pptx.addSlide();
        s.background = { color: ACCENT };
        s.addText(t("ebios.synth.export_title") || "Synthèse managériale des risques", { x: 0.5, y: 2.6, w: W - 1, h: 1, fontSize: 34, bold: true, color: "FFFFFF", align: "center" });
        s.addText(societe, { x: 0.5, y: 3.7, w: W - 1, h: 0.6, fontSize: 22, color: "DCE6F2", align: "center" });
        s.addText((t("ebios.synth.export_subtitle") || "Analyse EBIOS RM") + " · " + dateStr, { x: 0.5, y: 4.4, w: W - 1, h: 0.5, fontSize: 14, color: "9FB3C8", align: "center" });
        // 2. Scope and security baseline
        s = pptx.addSlide();
        header(s, t("ebios.synth.scope_title") || "Périmètre et socle de sécurité");
        s.addText([
            { text: t("ebios.synth.scope_perimeter") + "  ", options: { bold: true, color: "1E3A5F" } }, { text: objet + "\n\n", options: { color: "374151" } },
            { text: t("ebios.synth.scope_referentiel") + "  ", options: { bold: true, color: "1E3A5F" } }, { text: socleRef, options: { color: "374151" } }
        ], { x: 0.6, y: 0.95, w: W - 1.2, h: 1.3, fontSize: 15 });
        s.addText((t("ebios.synth.scope_coverage") || "Couverture du socle de sécurité :") + "  " + sd.socle.avg + "%", { x: 0.6, y: 2.4, w: W - 1.2, h: 0.6, fontSize: 22, bold: true, color: ACCENT, align: "center" });
        [{ n: sd.socle.nonApp, l: t("ebios.misc.non_applique_label"), c: "FCA5A5" }, { n: sd.socle.partiel, l: t("ebios.misc.partiel_label"), c: "FED7AA" }, { n: sd.socle.applique, l: t("ebios.misc.applique_label"), c: "DCFCE7" }].forEach(function (k, i) {
            const x = 1.4 + i * 3.6;
            s.addShape(pptx.ShapeType.roundRect, { x: x, y: 3.1, w: 3, h: 1.6, fill: { color: k.c }, rectRadius: 0.1 });
            s.addText(String(k.n), { x: x, y: 3.25, w: 3, h: 0.9, fontSize: 40, bold: true, align: "center", color: "1F2937" });
            s.addText(k.l, { x: x, y: 4.15, w: 3, h: 0.45, fontSize: 14, align: "center", color: "374151" });
        });
        s.addText(t("ebios.synth.scope_measures", { n: socleMeasures }), { x: 0.6, y: 5.2, w: W - 1.2, h: 0.8, fontSize: 15, color: "374151", align: "center" });
        s.addNotes(t("ebios.synth.scope_measures", { n: socleMeasures }));
        // 3. Synthesis: initial vs residual risks + baseline / measures
        s = pptx.addSlide();
        header(s, t("ebios.synth.exec_summary") || "Synthèse managériale");
        s.addText(t("ebios.synth.intro_synthese"), { x: 0.5, y: 0.78, w: W - 1, h: 0.55, fontSize: 13, color: "374151" });
        const distRow = function (d, y, label) {
            s.addText(label, { x: 0.5, y: y - 0.38, w: W - 1, h: 0.32, fontSize: 13, bold: true, color: ACCENT, align: "center" });
            [{ n: d.eleve, l: t("ebios.misc.eleve_label"), c: "FCA5A5" }, { n: d.moyen, l: t("ebios.misc.moyen_label"), c: "FED7AA" }, { n: d.faible, l: t("ebios.misc.faible_label"), c: "DCFCE7" }].forEach(function (k, i) {
                var x = 2.7 + i * 2.9;
                s.addShape(pptx.ShapeType.roundRect, { x: x, y: y, w: 2.3, h: 1.3, fill: { color: k.c }, rectRadius: 0.08 });
                s.addText(String(k.n), { x: x, y: y + 0.05, w: 2.3, h: 0.8, fontSize: 36, bold: true, align: "center", color: "1F2937" });
                s.addText(k.l, { x: x, y: y + 0.9, w: 2.3, h: 0.35, fontSize: 12, align: "center", color: "374151" });
            });
        };
        distRow(dInit, 1.85, t("ebios.synth.dist_initial"));
        distRow(dResid, 3.85, t("ebios.synth.dist_residual"));
        s.addText((t("ebios.synth.socle_avg") || "Conformité du socle") + " : " + sd.socle.avg + "%   ·   " + t("ebios.misc.measures_todo_count", { todo: sd.measures.toDoCount, total: sd.measures.total }), { x: 1, y: 5.5, w: W - 2, h: 0.5, fontSize: 15, align: "center", color: "374151" });
        s.addNotes(t("ebios.synth.intro_synthese"));
        // 3. Initial cartography (before treatment)
        matrixSlide(t("ebios.synth.map_initial") || "Cartographie initiale", function (sp) { return sp.vInit; }, t("ebios.synth.intro_carto_init"), t("ebios.synth.reading_matrix")).addNotes(t("ebios.synth.intro_carto_init"));
        // 4. Residual cartography (after treatment)
        matrixSlide(t("ebios.synth.map_residual") || "Cartographie résiduelle", function (sp) { return sp.vResid; }, t("ebios.synth.intro_carto_resid"), t("ebios.synth.reading_matrix")).addNotes(t("ebios.synth.intro_carto_resid"));
        // 5. Top risks to treat (non-low residuals, sorted by severity)
        let topRows = sd.rows.slice().sort(function (a, b) { return (sev(b.riskResid) - sev(a.riskResid)) || (sev(b.riskInit) - sev(a.riskInit)); });
        const prioritaires = topRows.filter(function (r) { return sev(r.riskResid) >= 2; });
        if (prioritaires.length)
            topRows = prioritaires;
        tableSlide(t("ebios.synth.top_risks") || "Top risques à traiter", [t("ebios.synth.col_ss"), t("ebios.synth.col_scenario"), t("ebios.synth.col_risque_initial"), t("ebios.synth.col_risque_residuel")], topRows.map(function (r) { return [r.id, r.scenario, riskCell(r.riskInit), riskCell(r.riskResid)]; }), t("ebios.synth.intro_top_risks"), 15).addNotes(t("ebios.synth.intro_top_risks"));
        // 6. Treatment plan (measures to implement)
        tableSlide(t("ebios.synth.measures_title") || "Plan de traitement", [t("ebios.synth.col_id"), t("ebios.synth.col_mesure"), t("ebios.synth.col_origine"), t("ebios.synth.col_responsable"), t("ebios.synth.col_echeance"), t("ebios.synth.col_statut")], sd.measures.todo.map(function (m) { return [m.id, m.mesure, m.origine || "", m.responsable || "", m.echeance || "", m.statut || ""]; }), t("ebios.synth.intro_pacs"), 12).addNotes(t("ebios.synth.intro_pacs"));
        // 7. Residual risk acceptance
        s = pptx.addSlide();
        header(s, t("ebios.synth.acceptance_title") || "Acceptation des risques résiduels");
        s.addText(t("ebios.synth.acceptance_text", { eleve: dResid.eleve, moyen: dResid.moyen, faible: dResid.faible }), { x: 0.6, y: 1.0, w: W - 1.2, h: 1.1, fontSize: 16, color: "374151" });
        s.addText(t("ebios.synth.acceptance_note"), { x: 0.6, y: 2.2, w: W - 1.2, h: 1.1, fontSize: 14, color: "374151" });
        s.addText(t("ebios.synth.val_date") || "Date :", { x: 1, y: 3.7, w: 2, h: 0.4, fontSize: 15, bold: true, color: "1F2937" });
        s.addShape(pptx.ShapeType.line, { x: 3, y: 4.05, w: 4.5, h: 0, line: { color: "9CA3AF", width: 1 } });
        s.addText(t("ebios.synth.val_sign") || "Nom / signature :", { x: 1, y: 4.6, w: 3, h: 0.4, fontSize: 15, bold: true, color: "1F2937" });
        s.addShape(pptx.ShapeType.line, { x: 4, y: 4.95, w: 7, h: 0, line: { color: "9CA3AF", width: 1 } });
        s.addNotes(t("ebios.synth.acceptance_text", { eleve: dResid.eleve, moyen: dResid.moyen, faible: dResid.faible }) + " " + t("ebios.synth.acceptance_note"));
        await pptx.writeFile({ fileName: _synthFileName() + ".pptx" });
        showStatus(t("ebios.status.pptx_downloaded"));
    }
    catch (e) {
        console.error("Erreur export PPTX:", e);
        alert(t("ebios.alert.pptx_export_error", { msg: e.message }));
    }
}
// ── EBIOS RM output report (Word / docxtemplater) ──────────────
function _loadDocxLibs() {
    return _loadScript("js/vendor/pizzip.min.js", { onStart: () => showStatus(t("ebios.status.loading_docx")) })
        .then(() => _loadScript("js/vendor/docxtemplater.js"))
        .catch(() => { throw new Error(t("ebios.alert.docx_load_error")); });
}
// Render an SVG string to a PNG ArrayBuffer (for the docx image module).
function _svgToPng(svg, targetW, scale) {
    scale = scale || 2; // render the canvas at higher pixel density → sharper text
    return new Promise((resolve, reject) => {
        // SVGs in the app are inline (no xmlns) → required for the Image to load.
        svg = svg.replace(/<svg(?![^>]*\bxmlns=)/i, '<svg xmlns="http://www.w3.org/2000/svg" ');
        // Preserve the SVG's natural aspect ratio (from viewBox) to avoid distortion.
        let ratio = 0.75;
        const vb = svg.match(/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
        if (vb && parseFloat(vb[1]) > 0)
            ratio = parseFloat(vb[2]) / parseFloat(vb[1]);
        const w = targetW, h = Math.round(targetW * ratio); // display size (px → EMU)
        const pw = w * scale, ph = h * scale; // canvas pixel size
        const img = new Image();
        img.onload = function () {
            const cv = document.createElement("canvas");
            cv.width = pw;
            cv.height = ph;
            const ctx = cv.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, pw, ph);
            ctx.drawImage(img, 0, 0, pw, ph);
            cv.toBlob(b => { b ? b.arrayBuffer().then(ab => resolve({ buf: ab, w: w, h: h })) : reject(new Error("toBlob")); }, "image/png");
        };
        img.onerror = reject;
        // data: URL (CSP allows 'data:' for img-src, but not blob:)
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
}
// Report captures render outside the DOM (_svgToPng) where CSS variables don't
// resolve — bake the light-theme hex in (reports are white-background docs).
var _SVG_TOKEN_HEX = {
    "var(--ct-low-tint)": "#e7f4ec", "var(--ct-low-ink)": "#116233",
    "var(--ct-medium-tint)": "#fdf4dc", "var(--ct-medium-ink)": "#7c4a05",
    "var(--ct-high-tint)": "#fdeee3", "var(--ct-high-ink)": "#8f3009",
    "var(--ct-critical-tint)": "#fbe9e7", "var(--ct-critical-ink)": "#8c1d18",
    "var(--ct-neutral-tint)": "#f2f3f7", "var(--ct-neutral-ink)": "#4c5566",
    "var(--ct-critical-fill)": "#e7bcb9", "var(--ct-high-fill)": "#eecabb",
    "var(--ct-medium-fill)": "#e8d8c1", "var(--ct-low-fill)": "#c4dfce",
    "var(--ct-neutral-fill)": "#d7d9df",
    "var(--ct-accent)": "#5a4bd8",
};
function _svgResolveTokens(svg) {
    return svg.replace(/var\(--ct-[a-z]+(?:-(?:tint|ink|fill))?\)/g, function (tok) {
        return _SVG_TOKEN_HEX[tok] || "#f2f3f7";
    });
}
// Build a risk cartography matrix SVG (initial/residual) via ctRenderMatrix,
// mirroring renderSynthesis' buildMatrix. Returns the <svg> string (or null).
function _riskMatrixSVG(getV) {
    if (typeof ctRenderMatrix !== "function")
        return null;
    const sd = _synthesisData();
    const grid = {};
    sd.positions.forEach(sp => {
        const v = getV(sp);
        if (!sp.gNum || !v || v < 1 || v > sd.NX || sp.gNum < 1 || sp.gNum > sd.NY)
            return;
        const k = v + "-" + sp.gNum;
        (grid[k] = grid[k] || []).push({ id: sp.id, label: sp.id });
    });
    const gLabels = [];
    for (let g = 1; g <= sd.NY; g++)
        gLabels.push((typeof gravLabel === "function" && gravLabel(g)) || ("G" + g));
    const html = ctRenderMatrix({
        levels: Math.max(sd.NX, sd.NY), xLevels: sd.NX, yLevels: sd.NY,
        xLabel: t("ebios.synth.col_vraisemblance") || "Vraisemblance", yLabel: t("ebios.synth.col_gravite") || "Gravité",
        yLabels: gLabels, grid: grid,
        colorFn: (v, g) => _riskBg(riskLevel(g, v)),
        legend: [{ label: t("ebios.risk.faible"), color: "var(--ct-low-fill)" }, { label: t("ebios.risk.moyen"), color: "var(--ct-high-fill)" }, { label: t("ebios.risk.eleve"), color: "var(--ct-critical-fill)" }]
    });
    const m = html.match(/<svg[\s\S]*?<\/svg>/i);
    return m ? m[0] : null;
}
// Build the risk *acceptability* matrix (Annexe B): the empty colored grid
// (gravity × likelihood → level), no scenarios placed. Same renderer as the
// cartographies, just an empty grid so each cell shows only its risk level color.
function _riskMatrixRefSVG() {
    if (typeof ctRenderMatrix !== "function")
        return null;
    const sd = _synthesisData();
    const gLabels = [];
    for (let g = 1; g <= sd.NY; g++)
        gLabels.push((typeof gravLabel === "function" && gravLabel(g)) || ("G" + g));
    const html = ctRenderMatrix({
        levels: Math.max(sd.NX, sd.NY), xLevels: sd.NX, yLevels: sd.NY,
        xLabel: t("ebios.synth.col_vraisemblance") || "Vraisemblance", yLabel: t("ebios.synth.col_gravite") || "Gravité",
        yLabels: gLabels, grid: {},
        colorFn: (v, g) => _riskBg(riskLevel(g, v)),
        legend: [{ label: t("ebios.risk.faible"), color: "var(--ct-low-fill)" }, { label: t("ebios.risk.moyen"), color: "var(--ct-high-fill)" }, { label: t("ebios.risk.eleve"), color: "var(--ct-critical-fill)" }]
    });
    const m = html.match(/<svg[\s\S]*?<\/svg>/i);
    if (!m)
        return null;
    // ctRenderMatrix colours the cells but draws no in-cell text (its legend is an
    // HTML div outside the <svg>, lost on capture) → overlay the level name per cell.
    const cellW = 55, cellH = 50, MT = 4;
    let maxYLen = 0;
    gLabels.forEach((l) => { if (String(l).length > maxYLen)
        maxYLen = String(l).length; });
    const ML = Math.max(58, 28 + maxYLen * 5.5);
    let overlay = "";
    for (let col = 1; col <= sd.NX; col++) {
        for (let row = 1; row <= sd.NY; row++) {
            const lvl = riskLevel(row, col);
            if (!lvl)
                continue;
            const cx = ML + (col - 1) * cellW + cellW / 2;
            const cy = MT + (sd.NY - row) * cellH + cellH / 2 + 4;
            overlay += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">' + esc(lvl) + '</text>';
        }
    }
    return m[0].replace("</svg>", overlay + "</svg>");
}
// Capture the report images (ecosystem cartographies + risk matrices) as PNG
// buffers, reusing the app's own SVG renderers. Each capture is isolated so one
// failure doesn't drop the others; missing ones fall back to a blank image.
async function _reportImages() {
    const imgs = {};
    try {
        if (typeof _buildEcoSVG === "function" && (D.pp || []).length) {
            const init = D.pp.map(p => {
                const d = p.dependance || 0, pe = p.penetration || 0, m = p.maturite || 0, c = p.confiance || 0;
                return { id: p.id, nom: p.nom, cat: p.categorie || "", menace: computeMenace(d, pe, m, c) || 0, fiab: m * c, expo: d * pe };
            });
            const resid = D.pp.map(p => {
                const eco = (D.eco || []).find(e => (e.pp_id || "").split(" - ")[0].trim() === p.id) || {};
                const d = eco.dep_resid || p.dependance || 0, pe = eco.pen_resid || p.penetration || 0, m = eco.mat_resid || p.maturite || 0, c = eco.conf_resid || p.confiance || 0;
                return { id: p.id, nom: p.nom, cat: p.categorie || "", menace: computeMenace(d, pe, m, c) || 0, fiab: m * c, expo: d * pe };
            });
            // Crop the eco SVG's white top/bottom margins and enlarge the PP labels
            // for the report only (the on-screen cartography is left untouched).
            // Crop the white top/bottom margins, widen left/right so the PP labels
            // (anchored on the quadrant edges, extending outward) are not clipped,
            // and enlarge the labels — report capture only, on-screen map untouched.
            const _eco = (s) => s.replace('viewBox="0 0 1000 900"', 'viewBox="-140 90 1280 650"').replace(/font-size="9"/g, 'font-size="12"');
            imgs.pp_map_initial = await _svgToPng(_eco(_buildEcoSVG(init, t("ebios.eco.map_initial"))), 720, 3);
            imgs.pp_map_residual = await _svgToPng(_eco(_buildEcoSVG(resid, t("ebios.eco.map_after"))), 720, 3);
        }
    }
    catch (e) {
        console.warn("Capture cartographie écosystème:", e);
    }
    try {
        const si = _riskMatrixSVG(sp => sp.vInit), sr = _riskMatrixSVG(sp => sp.vResid);
        if (si)
            imgs.risk_map_initial = await _svgToPng(_svgResolveTokens(si), 380, 2);
        if (sr)
            imgs.risk_map_residual = await _svgToPng(_svgResolveTokens(sr), 380, 2);
    }
    catch (e) {
        console.warn("Capture matrice de risque:", e);
    }
    try {
        const ref = _riskMatrixRefSVG();
        if (ref)
            imgs.risk_matrix_ref = await _svgToPng(_svgResolveTokens(ref), 440, 2);
    }
    catch (e) {
        console.warn("Capture matrice d'acceptabilité:", e);
    }
    return imgs;
}
// Resolve the report's "Rédacteur": logged-in user (backend suite) → analyst →
// remembered name → prompt (standalone frontend fallback, cached in localStorage).
function _resolveRedacteur() {
    const u = window._currentUser;
    if (u && (u.name || u.email))
        return u.name || u.email;
    const c = D.context || {};
    if (c.analyste)
        return c.analyste;
    let saved = "";
    try {
        saved = localStorage.getItem("ct_report_redacteur") || "";
    }
    catch (e) { }
    const name = ((typeof window.prompt === "function" ? window.prompt(t("ebios.report.ask_redacteur"), saved) : "") || "").trim();
    if (name) {
        try {
            localStorage.setItem("ct_report_redacteur", name);
        }
        catch (e) { }
        return name;
    }
    return saved;
}
// Map D + _synthesisData() → the report template tags (all values coerced to
// strings; sr_id/ov_id resolved to names via sr_list/ov_list).
function _reportData() {
    const sd = _synthesisData();
    const c = D.context || {};
    const srName = {};
    (D.sr_list || []).forEach(x => srName[x.id] = x.nom);
    const ovName = {};
    (D.ov_list || []).forEach(x => ovName[x.id] = x.nom);
    const isAnssi = D.socle_type !== "iso";
    const socleRows = (isAnssi ? D.socle_anssi : D.socle_iso) || [];
    const S = (v) => (v == null ? "" : String(v));
    // Risk distribution by level, initial vs residual (for the 5.2 / 5.4 bullets)
    const di = { eleve: 0, moyen: 0, faible: 0 }, dr = { eleve: 0, moyen: 0, faible: 0 };
    const bucket = (lvl) => { const cn = _riskColorName(lvl); return cn === "red" ? "eleve" : cn === "orange" ? "moyen" : cn === "green" ? "faible" : null; };
    sd.rows.forEach(r => { const bi = bucket(r.riskInit); if (bi)
        di[bi]++; const br = bucket(r.riskResid); if (br)
        dr[br]++; });
    // Atelier 4 — operational scenarios grouped by strategic scenario (nested loop)
    const { sopVop, sopTaux } = _computeSOPVop();
    const sopSS = {}, stepsBySop = {};
    (D.sop_detail || []).forEach(x => {
        if (x.sop && x.ss) {
            const ids = String(x.ss).split(",").map(s => (s.trim().match(/^SS-\d+/) || [""])[0]).filter(Boolean);
            (sopSS[x.sop] = sopSS[x.sop] || new Set());
            ids.forEach(id => sopSS[x.sop].add(id));
        }
        if (x.sop)
            (stepsBySop[x.sop] = stepsBySop[x.sop] || []).push({ phase: S(_attackLabel(x.phase)), action: S(x.action), controle: S(x.controle), efficacite: S(x.efficacite) });
    });
    // Resolve SS-linked couples (SR/OV) and feared events to readable labels.
    const coupleTxt = {};
    (D.srov || []).forEach(x => { coupleTxt[x.couple] = S(srName[x.sr_id] || x.sr_id) + " / " + S(ovName[x.ov_id] || x.ov_id); });
    const erEvt = {};
    (D.er || []).forEach(x => { erEvt[x.id] = S(x.evenement); });
    const _idsFrom = (str) => String(str || "").split(",").map(tok => { tok = tok.trim(); if (!tok)
        return ""; const k = tok.indexOf(" - "); return (k >= 0 ? tok.slice(0, k) : tok).trim(); }).filter(Boolean);
    const ss_groups = (D.ss || []).map((s, i) => {
        const sopIds = Object.keys(sopSS).filter(sp => sopSS[sp].has(s.id));
        let vmax = 0;
        sopIds.forEach(sp => { if ((sopVop[sp] || 0) > vmax)
            vmax = sopVop[sp] || 0; });
        const sops = sopIds.map((sp, j) => ({
            sop_num: "4." + (i + 1) + "." + (j + 1), sop_label: S(sp),
            taux_phrase: t("ebios.report.taux_phrase", { pct: Math.round((sopTaux[sp] || 0) * 100), vop: (sopVop[sp] || 0) }),
            steps: stepsBySop[sp] || []
        }));
        const coupleList = _idsFrom(s.couple_id).map(id => coupleTxt[id] || id);
        const erList = _idsFrom(s.er).map(id => erEvt[id] || id);
        const cTxt = coupleList.length
            ? (coupleList.length === 1 ? t("ebios.report.couple_one", { c: coupleList[0] })
                : t("ebios.report.couple_many", { list: coupleList.join(" ; ") }))
            : t("ebios.report.couple_none");
        return {
            num: "4." + (i + 1), ss_label: S(s.id) + (s.scenario ? " — " + S(s.scenario) : ""),
            ss_intro_pre: t("ebios.report.ss_intro_pre", { scenario: S(s.scenario), couples: cTxt }),
            er_multi: erList.length >= 2, // ≥ 2 ER → bullet list
            er_single: erList.length === 1, // exactly 1 ER → inline sentence
            er_one: erList.length === 1 ? erList[0] : "",
            er_list: erList.map(e => ({ er: e })),
            ss_intro_post: t("ebios.report.ss_intro_post", { vmax: vmax }),
            sops: sops
        };
    });
    const _conf = (v) => (v === "" || v == null) ? "" : S(v) + " %";
    return {
        // scalars — cover / managerial synthesis / context (blanks via nullGetter)
        contexte_objet: S(c.objet_etude || c.societe), contexte_societe: S(c.societe),
        contexte_date: S(c.date), contexte_analyste: S(c.analyste),
        contexte_reglementation: S(c.reglementation), contexte_socle: S(c.socle),
        // cover document-control block (cartouche)
        cart_redacteur: S(_resolveRedacteur()),
        cart_contributeurs: S(c.contributeurs || ""),
        cart_version: "1",
        cart_date: (new Date()).toLocaleDateString("fr-FR"),
        cart_classification: "Confidentiel",
        dist_eleve: dr.eleve, dist_moyen: dr.moyen, dist_faible: dr.faible,
        dist_init_eleve: di.eleve, dist_init_moyen: di.moyen, dist_init_faible: di.faible,
        ss_count: (D.ss || []).length,
        socle_avg: sd.socle.avg, mes_todo: sd.measures.toDoCount, mes_total: sd.measures.total,
        // loops — field names MUST match the tags in tools/tag-original-template.py
        vm: (D.vm || []).map(x => ({ id: S(x.id), nom: S(x.nom), nature: S(x.nature), description: S(x.description), responsable: S(x.responsable) })),
        bs: (D.bs || []).map(x => ({ id: S(x.id), nom: S(x.nom), type: S(x.type), vm: S(x.vm), localisation: S(x.localisation), proprietaire: S(x.proprietaire) })),
        er: (D.er || []).map(x => ({ id: S(x.id), vm: S(x.vm), evenement: S(x.evenement), impacts: S(x.impacts), gravite: S(x.gravite) })),
        sr_list: (D.sr_list || []).map(x => ({ id: S(x.id), nom: S(x.nom) })),
        ov_list: (D.ov_list || []).map(x => ({ id: S(x.id), nom: S(x.nom) })),
        srov: (D.srov || []).map(x => {
            const pert = (Number(x.motivation) || 0) + (Number(x.ressources) || 0) + (Number(x.activite) || 0);
            const prio = pert > 7 ? t("ebios.srov.p1") : pert > 4 ? t("ebios.srov.p2") : pert >= 3 ? t("ebios.srov.non_retenu") : pert > 0 ? t("ebios.srov.ecarte") : "";
            return { couple: S(x.couple), sr: S(srName[x.sr_id] || x.sr_id), ov: S(ovName[x.ov_id] || x.ov_id), motivation: S(x.motivation), ressources: S(x.ressources), activite: S(x.activite), pertinence: S(pert || ""), priorite: S(prio), justification: S(x.justification) };
        }),
        pp: (D.pp || []).map(x => ({ id: S(x.id), nom: S(x.nom), categorie: S(x.categorie) })),
        pp_eval: (D.pp || []).map(x => {
            const men = computeMenace(x.dependance, x.penetration, x.maturite, x.confiance);
            return { nom: S(x.nom), dependance: S(x.dependance), penetration: S(x.penetration), maturite: S(x.maturite), confiance: S(x.confiance), menace: men == null ? "" : S(men), exposition: men == null ? "" : computeExposition(men) };
        }),
        ss_groups: ss_groups,
        ss: (D.ss || []).map(x => ({ id: S(x.id), scenario: S(x.scenario), pp: S(x.pp), bs: S(x.bs), er: S(x.er) })),
        risks_init: sd.rows.map(r => ({ id: S(r.id), scenario: S(r.scenario), gravite: S(r.gNum), vInit: S(r.vInit), riskInit: S(r.riskInit || "—") })),
        risks_resid: sd.rows.map(r => ({ id: S(r.id), scenario: S(r.scenario), reduction: S(r.riskInit || "—") + " → " + S(r.riskResid || "—") })),
        measures: (D.measures || []).filter(x => !/termin|done/i.test(String(x.statut || ""))).map(x => ({ id: S(x.id), mesure: S(x.mesure), origine: S(x.origine), cout: S(x.cout), responsable: S(x.responsable), echeance: S(x.echeance), statut: S(x.statut) })),
        socle: socleRows.map(s => isAnssi
            ? ({ ref: S(s.num), theme: S(s.thematique), mesure: S(s.mesure), conformite: _conf(s.conformite), ecart: S(s.ecart) })
            : ({ ref: S(s.ref), theme: S(s.theme), mesure: S(s.mesure), conformite: _conf(s.conformite), ecart: S(s.ecart) })),
        gravity_scale: (D.gravity_scale || []).map(g => ({ niveau: S(g.niveau), label: S(g.label), description: S(g.description), impact_financier: S(g.impact_financier), impact_reputation: S(g.impact_reputation), impact_reglementaire: S(g.impact_reglementaire), impact_donnees_perso: S(g.impact_donnees_perso), impact_operationnel: S(g.impact_operationnel) })),
        socle_planned: socleRows.filter(s => (s.mesures_prevues || "").trim()).map(s => ({ ref: S(isAnssi ? s.num : s.ref), mesure: S(s.mesure), mesures_prevues: S(s.mesures_prevues) })),
        // image tags (resolved by the docx image module → see exportWordReport)
        pp_map_initial: "pp_map_initial", pp_map_residual: "pp_map_residual",
        risk_map_initial: "risk_map_initial", risk_map_residual: "risk_map_residual",
    };
}
// Inject PNG images into a rendered docx (PizZip) by replacing @@IMG:key@@ text
// markers with inline drawings. Pure OOXML — avoids the buggy image module.
// imgs: { key: { buf: ArrayBuffer, w, h } } — w/h (px) set the display size.
function _injectImages(zip, imgs) {
    const EMU = 9525;
    let docXml = zip.file("word/document.xml").asText();
    let ct = zip.file("[Content_Types].xml").asText();
    if (!/Extension="png"/i.test(ct)) {
        ct = ct.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>');
        zip.file("[Content_Types].xml", ct);
    }
    const relsPath = "word/_rels/document.xml.rels";
    let rels = zip.file(relsPath) ? zip.file(relsPath).asText()
        : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    let rid = (rels.match(/Id="rId(\d+)"/g) || []).reduce((m, s) => Math.max(m, parseInt(s.replace(/\D/g, ""), 10)), 0);
    Object.keys(imgs || {}).forEach(key => {
        const marker = "@@IMG:" + key + "@@";
        const item = imgs && imgs[key];
        if (item && item.buf) {
            rid++;
            const id = "rId" + rid;
            const cx = item.w * EMU, cy = item.h * EMU;
            zip.file("word/media/" + key + ".png", item.buf);
            rels = rels.replace("</Relationships>", '<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + key + '.png"/></Relationships>');
            const drawing = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">' +
                '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + rid + '" name="' + key + '"/>' +
                '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + rid + '" name="' + key + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
                '<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="' + id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
                '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
                '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
            docXml = docXml.replace(new RegExp('<w:t[^>]*>' + marker + '</w:t>'), drawing);
        }
    });
    // Strip any marker left without an image (capture failed for that one)
    docXml = docXml.replace(/<w:t[^>]*>@@IMG:[a-z_]+@@<\/w:t>/g, '<w:t/>');
    zip.file(relsPath, rels);
    zip.file("word/document.xml", docXml);
    return zip;
}
async function exportWordReport() {
    try {
        await _loadDocxLibs();
        showStatus(t("ebios.status.generating_docx"));
        const _wlang = (typeof _locale !== "undefined" && _locale === "en") ? "en" : "fr";
        const resp = await fetch("templates/ebios-report-" + _wlang + ".docx");
        if (!resp.ok)
            throw new Error("template HTTP " + resp.status);
        const doc = new window.docxtemplater(new PizZip(await resp.arrayBuffer()), { paragraphLoop: true, linebreaks: true, nullGetter: function () { return ""; } });
        doc.render(_reportData());
        const zip = doc.getZip();
        try {
            _injectImages(zip, await _reportImages());
        }
        catch (imgErr) {
            console.warn("Cartographies non intégrées:", imgErr);
            zip.file("word/document.xml", zip.file("word/document.xml").asText().replace(/<w:t[^>]*>@@IMG:[a-z_]+@@<\/w:t>/g, '<w:t/>'));
        }
        const blob = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        _downloadBlob(blob, _synthFileName() + ".docx");
        showStatus(t("ebios.status.docx_downloaded"));
    }
    catch (e) {
        console.error("Erreur export Word:", e);
        alert(t("ebios.alert.docx_export_error", { msg: e.message }));
    }
}
// AI module config (read by ai_common.js)
async function exportExcel() {
    // Load the template on demand if not done yet
    if (!_templateLoaded) {
        showStatus(t("ebios.status.loading_template"));
        await new Promise(resolve => _ensureTemplate(resolve));
    }
    const TEMPLATE_B64 = (window.EBIOS_TEMPLATE && window.EBIOS_TEMPLATE.templateB64) || "";
    if (!TEMPLATE_B64) {
        alert(t("ebios.alert.template_unavailable"));
        return;
    }
    try {
        await _loadExcelJS();
        showStatus(t("ebios.status.generating_excel"));
        // Load the template
        const templateBytes = Uint8Array.from(atob(TEMPLATE_B64), c => c.charCodeAt(0));
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(templateBytes.buffer);
        // Fill the data into the input cells
        _fillExcelData(wb);
        // Download
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var societe = D.context.societe || _ct().filePrefix || "EBIOS_RM";
        var scope = _ct().getScope ? _ct().getScope(D) : "";
        var name = _safeFileName(societe + (scope ? "-" + scope : ""), 60);
        _downloadBlob(blob, name + ".xlsx");
        showStatus(t("ebios.status.excel_downloaded"));
    }
    catch (e) {
        console.error("Erreur export Excel:", e);
        alert(t("ebios.alert.excel_export_error", { msg: e.message }));
    }
}
function _fillExcelData(wb) {
    // Context (Synthesis)
    const wsSynth = wb.getWorksheet("Synthèse");
    if (wsSynth) {
        const ctxKeys = ["societe", "date", "analyste", "reglementation", "socle", "commentaires"];
        ctxKeys.forEach((k, i) => {
            const v = D.context[k];
            if (v)
                wsSynth.getCell(4 + i, 3).value = v;
        });
    }
    // Gravity scale
    const wsGrav = wb.getWorksheet("0-Échelle Gravité");
    if (wsGrav) {
        D.gravity_scale.forEach((g, i) => {
            const r = 5 + i;
            wsGrav.getCell(r, 2).value = g.label;
            wsGrav.getCell(r, 3).value = g.description || "";
            wsGrav.getCell(r, 4).value = g.impact_financier || "";
            wsGrav.getCell(r, 5).value = g.impact_reputation || "";
            wsGrav.getCell(r, 6).value = g.impact_reglementaire || "";
            wsGrav.getCell(r, 7).value = g.impact_donnees_perso || "";
            wsGrav.getCell(r, 8).value = g.impact_operationnel || "";
        });
    }
    // VM
    const wsVM = wb.getWorksheet("1a-Valeurs Métier");
    if (wsVM) {
        D.vm.forEach((v, i) => {
            const r = 4 + i;
            wsVM.getCell(r, 1).value = v.id;
            wsVM.getCell(r, 2).value = v.nom;
            wsVM.getCell(r, 3).value = v.nature || "";
            wsVM.getCell(r, 4).value = v.description || "";
            wsVM.getCell(r, 5).value = v.responsable || "";
        });
    }
    // BS
    const wsBS = wb.getWorksheet("1b-Biens Supports");
    if (wsBS) {
        D.bs.forEach((b, i) => {
            const r = 4 + i;
            wsBS.getCell(r, 1).value = b.id;
            wsBS.getCell(r, 2).value = b.nom;
            wsBS.getCell(r, 3).value = b.type || "";
            wsBS.getCell(r, 4).value = b.vm || "";
            wsBS.getCell(r, 5).value = b.localisation || "";
            wsBS.getCell(r, 6).value = b.proprietaire || "";
        });
    }
    // PP
    const wsPP = wb.getWorksheet("1c-Parties Prenantes");
    if (wsPP) {
        D.pp.forEach((p, i) => {
            const r = 5 + i;
            wsPP.getCell(r, 1).value = p.id;
            wsPP.getCell(r, 2).value = p.nom;
            wsPP.getCell(r, 3).value = p.categorie || "";
            wsPP.getCell(r, 4).value = p.type || "";
            if (p.dependance !== "")
                wsPP.getCell(r, 5).value = p.dependance;
            if (p.penetration !== "")
                wsPP.getCell(r, 6).value = p.penetration;
            if (p.maturite !== "")
                wsPP.getCell(r, 7).value = p.maturite;
            if (p.confiance !== "")
                wsPP.getCell(r, 8).value = p.confiance;
            wsPP.getCell(r, 11).value = p.bs || "";
        });
    }
    // Socle ANSSI
    const wsSA = wb.getWorksheet("1d-Socle ANSSI");
    if (wsSA && D.socle_type !== "iso") {
        D.socle_anssi.forEach((s, i) => {
            const r = 5 + i;
            wsSA.getCell(r, 2).value = _rt(s, "thematique") || "";
            wsSA.getCell(r, 3).value = _rt(s, "mesure") || "";
            if (s.conformite !== "")
                wsSA.getCell(r, 4).value = s.conformite;
            wsSA.getCell(r, 6).value = s.ecart || "";
            wsSA.getCell(r, 8).value = s.mesures_prevues || "";
        });
    }
    // Socle ISO
    const wsSI = wb.getWorksheet("1d-Socle ISO 27001");
    if (wsSI && D.socle_type === "iso") {
        D.socle_iso.forEach((s, i) => {
            const r = 5 + i;
            if (s.conformite !== "")
                wsSI.getCell(r, 5).value = s.conformite;
            wsSI.getCell(r, 7).value = s.ecart || "";
            wsSI.getCell(r, 9).value = s.mesures_prevues || "";
        });
    }
    // SR/OV
    const wsSROV = wb.getWorksheet("2-Couples SR-OV");
    if (wsSROV) {
        D.srov.forEach((s, i) => {
            const r = 5 + i;
            wsSROV.getCell(r, 1).value = s.couple;
            // Rebuild the complete SR and OV
            const srNom = (D.sr_list || []).find(x => x.id === s.sr_id);
            const ovNom = (D.ov_list || []).find(x => x.id === s.ov_id);
            wsSROV.getCell(r, 2).value = s.sr_id + (srNom ? " - " + srNom.nom : "");
            wsSROV.getCell(r, 3).value = s.ov_id + (ovNom ? " - " + ovNom.nom : "");
            if (s.motivation !== "")
                wsSROV.getCell(r, 4).value = s.motivation;
            if (s.ressources !== "")
                wsSROV.getCell(r, 5).value = s.ressources;
            if (s.activite !== "")
                wsSROV.getCell(r, 6).value = s.activite;
            wsSROV.getCell(r, 9).value = s.justification || "";
        });
    }
    // ER
    const wsER = wb.getWorksheet("3a-Événements Redoutés");
    if (wsER) {
        D.er.forEach((e, i) => {
            const r = 4 + i;
            wsER.getCell(r, 1).value = e.id;
            wsER.getCell(r, 2).value = e.evenement || "";
            wsER.getCell(r, 3).value = e.vm || "";
            wsER.getCell(r, 4).value = e.dict || "";
            wsER.getCell(r, 5).value = e.impacts || "";
            if (e.gravite !== "")
                wsER.getCell(r, 6).value = e.gravite;
        });
    }
    // SS
    const wsSS = wb.getWorksheet("3b-Scénarios Stratégiques");
    if (wsSS) {
        D.ss.forEach((s, i) => {
            const r = 5 + i;
            wsSS.getCell(r, 1).value = s.id;
            wsSS.getCell(r, 2).value = s.scenario || "";
            wsSS.getCell(r, 3).value = s.couple_id || "";
            wsSS.getCell(r, 4).value = s.couple_desc || "";
            wsSS.getCell(r, 5).value = s.pp || "";
            wsSS.getCell(r, 6).value = s.bs || "";
            wsSS.getCell(r, 7).value = s.er || "";
        });
    }
    // Ecosystem
    const wsEco = wb.getWorksheet("3c-Mesures Écosystème");
    if (wsEco) {
        D.eco.forEach((e, i) => {
            const r = 5 + i;
            wsEco.getCell(r, 1).value = e.pp_id || "";
            wsEco.getCell(r, 5).value = e.mesures_existantes || "";
            wsEco.getCell(r, 6).value = e.mesures_complementaires || "";
            wsEco.getCell(r, 7).value = e.categorie || "";
            if (e.dep_resid !== "")
                wsEco.getCell(r, 8).value = e.dep_resid;
            if (e.pen_resid !== "")
                wsEco.getCell(r, 9).value = e.pen_resid;
            if (e.mat_resid !== "")
                wsEco.getCell(r, 10).value = e.mat_resid;
            if (e.conf_resid !== "")
                wsEco.getCell(r, 11).value = e.conf_resid;
        });
    }
    // SOP detail
    const wsSOP = wb.getWorksheet("4a-Scénarios Opérationnels");
    if (wsSOP) {
        D.sop_detail.forEach((s, i) => {
            const r = 4 + i;
            if (s.sop)
                wsSOP.getCell(r, 1).value = s.sop;
            if (s.ss) {
                var ssObj = D.ss.find(function (x) { return x.id === s.ss; });
                wsSOP.getCell(r, 2).value = s.ss + (ssObj ? " - " + ssObj.scenario : "");
            }
            wsSOP.getCell(r, 3).value = _attackLabel(s.phase) || "";
            wsSOP.getCell(r, 4).value = s.action || "";
            wsSOP.getCell(r, 5).value = s.bs || "";
            wsSOP.getCell(r, 6).value = s.controle || "";
            wsSOP.getCell(r, 7).value = s.ref || "";
            wsSOP.getCell(r, 8).value = s.efficacite || "";
            wsSOP.getCell(r, 9).value = s.commentaire || "";
            wsSOP.getCell(r, 10).value = s.mesure_proposee || "";
            wsSOP.getCell(r, 11).value = s.type_mesure || "";
        });
    }
    // SOP summary
    const wsSOPS = wb.getWorksheet("4b-Synthèse SOP");
    if (wsSOPS) {
        D.sop_summary.forEach((s, i) => {
            const r = 5 + i;
            wsSOPS.getCell(r, 1).value = s.sop;
            var ss = D.ss.find(function (x) { return x.id === s.ss; });
            wsSOPS.getCell(r, 2).value = s.ss + (ss ? " - " + ss.scenario : "");
        });
    }
    // Measures
    const wsM = wb.getWorksheet("5a-Mesures");
    if (wsM) {
        D.measures.forEach((m, i) => {
            const r = 5 + i;
            wsM.getCell(r, 1).value = m.id;
            wsM.getCell(r, 2).value = m.mesure || "";
            wsM.getCell(r, 3).value = m.origine || "";
            wsM.getCell(r, 4).value = m.type || "";
            wsM.getCell(r, 5).value = m.sop || "";
            wsM.getCell(r, 6).value = m.phase || "";
            wsM.getCell(r, 7).value = m.effet || "";
            wsM.getCell(r, 8).value = m.ref_socle || "";
            wsM.getCell(r, 9).value = m.responsable || "";
            wsM.getCell(r, 10).value = m.echeance || "";
            wsM.getCell(r, 11).value = m.cout || "";
            wsM.getCell(r, 12).value = m.statut || "";
        });
    }
    // Residuals
    const wsR = wb.getWorksheet("5b-Risques Résiduels");
    if (wsR) {
        D.residuals.forEach((r_, i) => {
            const r = 5 + i;
            wsR.getCell(r, 7).value = r_.mesures || "";
            if (r_.v_resid !== "")
                wsR.getCell(r, 8).value = r_.v_resid;
            wsR.getCell(r, 10).value = r_.decision || "";
        });
    }
    // Hide the unused baseline
    const hideSheet = D.socle_type === "iso" ? "1d-Socle ANSSI" : "1d-Socle ISO 27001";
    const wsHide = wb.getWorksheet(hideSheet);
    if (wsHide)
        wsHide.state = "hidden";
}
async function importExcel(event) {
    const file = event.target.files[0];
    if (!file)
        return;
    event.target.value = "";
    try {
        await _loadExcelJS();
        showStatus(t("ebios.status.reading_excel"));
        const buf = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        _readExcelData(wb);
        _initDataAndRender(() => _autoSave());
    }
    catch (e) {
        console.error("Erreur import Excel:", e);
        alert(t("ebios.alert.excel_import_error", { msg: e.message }));
    }
}
function _cv(cell) {
    // Return an ExcelJS cell value (ignores formulas)
    if (!cell || cell.value === null || cell.value === undefined)
        return "";
    const v = cell.value;
    if (typeof v === "object" && v !== null) {
        if (v.result !== undefined)
            return v.result; // formula with a cached result
        if (v.richText)
            return v.richText.map((r) => r.text).join("");
        return "";
    }
    return v;
}
function _readExcelData(wb) {
    // Context
    const wsSynth = wb.getWorksheet("Synthèse");
    if (wsSynth) {
        const keys = ["societe", "date", "analyste", "reglementation", "socle", "commentaires"];
        D.context = {};
        keys.forEach((k, i) => { D.context[k] = _cv(wsSynth.getCell(4 + i, 3)); });
    }
    // Gravity
    const wsGrav = wb.getWorksheet("0-Échelle Gravité");
    D.gravity_scale = [];
    D.risk_matrix = [];
    if (wsGrav) {
        for (let i = 0; i < 5; i++) {
            const n = _cv(wsGrav.getCell(5 + i, 1));
            if (!n)
                break;
            D.gravity_scale.push({ niveau: n, label: _cv(wsGrav.getCell(5 + i, 2)), description: _cv(wsGrav.getCell(5 + i, 3)) });
        }
        const ng = D.gravity_scale.length;
        for (let sr = ng + 7; sr < ng + 20; sr++) {
            const g = _cv(wsGrav.getCell(sr, 4));
            if (typeof g === "number" && g > 0) {
                for (let j = 0; j < ng; j++) {
                    const gv = _cv(wsGrav.getCell(sr + j, 4));
                    if (!gv)
                        break;
                    D.risk_matrix.push({ g: gv, levels: [_cv(wsGrav.getCell(sr + j, 5)), _cv(wsGrav.getCell(sr + j, 6)), _cv(wsGrav.getCell(sr + j, 7)), _cv(wsGrav.getCell(sr + j, 8))] });
                }
                break;
            }
        }
    }
    // Generic read through a mapping
    function readSheet(name, headerRow, maxRows, colMap) {
        const ws = wb.getWorksheet(name);
        if (!ws)
            return [];
        const rows = [];
        for (let i = 0; i < maxRows; i++) {
            const r = headerRow + 1 + i;
            const firstCol = Object.values(colMap)[0];
            if (!_cv(ws.getCell(r, firstCol)))
                break;
            const row = {};
            for (const [k, c] of Object.entries(colMap))
                row[k] = _cv(ws.getCell(r, c));
            rows.push(row);
        }
        return rows;
    }
    D.vm = readSheet("1a-Valeurs Métier", 3, 30, { id: 1, nom: 2, nature: 3, description: 4, responsable: 5 });
    D.bs = readSheet("1b-Biens Supports", 3, 50, { id: 1, nom: 2, type: 3, vm: 4, localisation: 5, proprietaire: 6 });
    D.pp = readSheet("1c-Parties Prenantes", 4, 30, { id: 1, nom: 2, categorie: 3, type: 4, dependance: 5, penetration: 6, maturite: 7, confiance: 8, bs: 11 });
    D.er = readSheet("3a-Événements Redoutés", 3, 50, { id: 1, evenement: 2, vm: 3, dict: 4, impacts: 5, gravite: 6 });
    D.ss = readSheet("3b-Scénarios Stratégiques", 4, 30, { id: 1, scenario: 2, couple_id: 3, couple_desc: 4, pp: 5, bs: 6, er: 7 });
    // Socle ANSSI
    D.socle_anssi = readSheet("1d-Socle ANSSI", 4, 42, { num: 1, thematique: 2, mesure: 3, conformite: 4, ecart: 6, mesures_prevues: 8 });
    D.socle_iso = readSheet("1d-Socle ISO 27001", 4, 93, { ref: 1, theme: 2, mesure: 3, applicable: 4, conformite: 5, ecart: 7, mesures_prevues: 9 });
    // Determine the baseline type
    const wsAnssi = wb.getWorksheet("1d-Socle ANSSI");
    D.socle_type = (wsAnssi && wsAnssi.state === "hidden") ? "iso" : "anssi";
    // SR/OV
    D.srov = [];
    D.sr_list = [];
    D.ov_list = [];
    const srSeen = {}, ovSeen = {};
    const wsSROV = wb.getWorksheet("2-Couples SR-OV");
    if (wsSROV) {
        for (let i = 0; i < 30; i++) {
            const r = 5 + i;
            const couple = _cv(wsSROV.getCell(r, 1));
            if (!couple)
                break;
            const srFull = String(_cv(wsSROV.getCell(r, 2)));
            const ovFull = String(_cv(wsSROV.getCell(r, 3)));
            const srId = srFull.split(" - ")[0].trim();
            const ovId = ovFull.split(" - ")[0].trim();
            if (srId && !srSeen[srId]) {
                srSeen[srId] = srFull.includes(" - ") ? srFull.split(" - ").slice(1).join(" - ").trim() : srFull;
            }
            if (ovId && !ovSeen[ovId]) {
                ovSeen[ovId] = ovFull.includes(" - ") ? ovFull.split(" - ").slice(1).join(" - ").trim() : ovFull;
            }
            D.srov.push({
                couple, sr_id: srId, ov_id: ovId,
                motivation: _cv(wsSROV.getCell(r, 4)), ressources: _cv(wsSROV.getCell(r, 5)),
                activite: _cv(wsSROV.getCell(r, 6)), justification: _cv(wsSROV.getCell(r, 9))
            });
        }
        D.sr_list = Object.entries(srSeen).sort().map(([id, nom]) => ({ id, nom }));
        D.ov_list = Object.entries(ovSeen).sort().map(([id, nom]) => ({ id, nom }));
    }
    // Ecosystem
    D.eco = readSheet("3c-Mesures Écosystème", 4, 30, { pp_id: 1, mesures_existantes: 5, mesures_complementaires: 6, categorie: 7, dep_resid: 8, pen_resid: 9, mat_resid: 10, conf_resid: 11 });
    // SOP detail (does not stop on an empty ID)
    D.sop_detail = [];
    const wsSOP = wb.getWorksheet("4a-Scénarios Opérationnels");
    if (wsSOP) {
        for (let i = 0; i < 150; i++) {
            const r = 4 + i;
            const sop = _cv(wsSOP.getCell(r, 1));
            const phase = _cv(wsSOP.getCell(r, 3));
            if (!sop && !phase)
                continue;
            D.sop_detail.push({
                sop, ss: _cv(wsSOP.getCell(r, 2)), phase,
                action: _cv(wsSOP.getCell(r, 4)), bs: _cv(wsSOP.getCell(r, 5)),
                controle: _cv(wsSOP.getCell(r, 6)), ref: _cv(wsSOP.getCell(r, 7)),
                efficacite: _cv(wsSOP.getCell(r, 8)), commentaire: _cv(wsSOP.getCell(r, 9)),
                mesure_proposee: _cv(wsSOP.getCell(r, 10)), type_mesure: _cv(wsSOP.getCell(r, 11))
            });
        }
    }
    D.sop_summary = readSheet("4b-Synthèse SOP", 4, 20, { sop: 1, ss: 2 });
    D.measures = readSheet("5a-Mesures", 4, 50, { id: 1, mesure: 2, origine: 3, type: 4, sop: 5, phase: 6, effet: 7, ref_socle: 8, responsable: 9, echeance: 10, cout: 11, statut: 12 });
    // Residuals
    D.residuals = [];
    const wsR = wb.getWorksheet("5b-Risques Résiduels");
    if (wsR) {
        for (let i = 0; i < 30; i++) {
            const r = 5 + i;
            const mesures = _cv(wsR.getCell(r, 7));
            const vr = _cv(wsR.getCell(r, 8));
            const dec = _cv(wsR.getCell(r, 10));
            if (!mesures && !vr && !dec)
                continue;
            D.residuals.push({ mesures, v_resid: vr, decision: dec });
        }
    }
}
// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
// Ensure every key exists (JSON loading protection)
function ensureKeys() {
    // ── 1. Missing root keys ──
    const defaults = {
        context: { societe: "", date: "", analyste: "", reglementation: "", socle: "", commentaires: "" },
        gravity_scale: [], risk_matrix: [],
        vm: [], bs: [], pp: [],
        socle_anssi: [], socle_iso: [],
        sr_list: [], ov_list: [], srov: [], er: [], ss: [], eco: [],
        sop_detail: [], sop_summary: [],
        measures: [], residuals: [], fair: [],
        socle_type: "anssi",
    };
    for (const [k, v] of Object.entries(defaults)) {
        if (!(k in D))
            D[k] = v;
    }
    // ── 2. Context: missing fields ──
    const ctxDefaults = { societe: "", objet_etude: "", date: "", analyste: "", reglementation: "", socle: "", commentaires: "", date_precedente: "", evolutions: "" };
    for (const [k, v] of Object.entries(ctxDefaults)) {
        if (!(k in D.context))
            D.context[k] = v;
    }
    // ── 3. Guarantee each item's fields inside the arrays ──
    const fieldDefs = {
        vm: { id: "", nom: "", nature: "", description: "", responsable: "" },
        bs: { id: "", nom: "", type: "", vm: "", localisation: "", proprietaire: "" },
        pp: { id: "", nom: "", categorie: "", type: "", dependance: "", penetration: "", maturite: "", confiance: "", bs: "" },
        er: { id: "", evenement: "", vm: "", dict: "", impacts: "", gravite: "" },
        ss: { id: "", scenario: "", couple_id: "", couple_desc: "", pp: "", bs: "", er: "" },
        srov: { couple: "", sr_id: "", ov_id: "", motivation: "", ressources: "", activite: "", justification: "" },
        eco: { pp_id: "", mesures_existantes: "", mesures_complementaires: "", categorie: "", dep_resid: "", pen_resid: "", mat_resid: "", conf_resid: "" },
        measures: { id: "", mesure: "", details: "", origine: "", type: "", sop: "", phase: "", effet: "", ref_socle: "", responsable: "", echeance: "", cout: "", statut: "" },
        residuals: { mesures: "", v_resid: "", decision: "" },
        sop_detail: { sop: "", ss: "", phase: "", action: "", bs: "", controle: "", ref: "", efficacite: "", commentaire: "", mesure_proposee: "", type_mesure: "" },
        sop_summary: { sop: "", ss: "" },
        fair: { lef_min: "", lef_likely: "", lef_max: "", lm_min: "", lm_likely: "", lm_max: "", ale_p10: "", ale_p50: "", ale_p90: "", ale_mean: "" },
        sr_list: { id: "", nom: "" },
        ov_list: { id: "", nom: "" },
        socle_anssi: { num: "", thematique: "", mesure: "", conformite: "", ecart: "", mesures_prevues: "" },
        socle_iso: { ref: "", theme: "", mesure: "", applicable: "", conformite: "", ecart: "", mesures_prevues: "" },
    };
    for (const [section, tpl] of Object.entries(fieldDefs)) {
        if (!Array.isArray(D[section]))
            continue;
        D[section].forEach(item => {
            for (const [k, v] of Object.entries(tpl)) {
                if (!(k in item))
                    item[k] = v;
            }
        });
    }
    // ── 4. Gravity: impact fields ──
    const impactKeys = ["impact_financier", "impact_reputation", "impact_reglementaire", "impact_donnees_perso", "impact_operationnel"];
    D.gravity_scale.forEach(g => {
        if (!("niveau" in g))
            g.niveau = "";
        if (!("label" in g))
            g.label = "";
        if (!("description" in g))
            g.description = "";
        for (const ik of impactKeys)
            if (!(ik in g))
                g[ik] = "";
    });
    // ── 4b. ANSSI / ISO baselines: re-seed from EBIOS_INIT_DATA if empty ──
    // A JSON saved by an older version may have socle_anssi: []
    // (or missing) — reload the 42 pre-populated ANSSI / 93 ISO measures and
    // merge the values (conformite / ecart / mesures_prevues) of the entries
    // already present, matched by num/ref.
    const _seedSocle = (key, idCol) => {
        const init = (window.EBIOS_INIT_DATA && window.EBIOS_INIT_DATA[key]) || [];
        if (!init.length)
            return;
        const existing = Array.isArray(D[key]) ? D[key] : [];
        if (existing.length >= init.length)
            return;
        const byId = {};
        existing.forEach(s => { if (s && s[idCol] != null)
            byId[String(s[idCol])] = s; });
        D[key] = init.map(tpl => {
            const prev = byId[String(tpl[idCol])];
            return Object.assign({}, tpl, prev ? {
                conformite: prev.conformite || "",
                ecart: prev.ecart || "",
                mesures_prevues: prev.mesures_prevues || "",
            } : {});
        });
    };
    _seedSocle("socle_anssi", "num");
    _seedSocle("socle_iso", "ref");
    // ── 6. Migration: legacy formats ──
    // 5a. SR/OV: if sr_list/ov_list are empty but srov exists, rebuild them
    if (D.srov.length > 0 && D.sr_list.length === 0) {
        const srSeen = {}, ovSeen = {};
        D.srov.forEach(s => {
            if (s.sr_id && !(s.sr_id in srSeen)) {
                srSeen[s.sr_id] = true;
                // Look for the name: sr_nom, or extract it from "SR-01 - Description"
                let nom = s.sr_nom || "";
                if (!nom && s.sr) {
                    const m = s.sr.match(/^SR-\d+\s*-\s*(.+)/);
                    if (m)
                        nom = m[1];
                }
                D.sr_list.push({ id: s.sr_id, nom: nom });
            }
            if (s.ov_id && !(s.ov_id in ovSeen)) {
                ovSeen[s.ov_id] = true;
                let nom = s.ov_nom || "";
                if (!nom && s.ov) {
                    const m = s.ov.match(/^OV-\d+\s*-\s*(.+)/);
                    if (m)
                        nom = m[1];
                }
                D.ov_list.push({ id: s.ov_id, nom: nom });
            }
        });
    }
    // Complete sr_list/ov_list from sr_list entries that have a description but no name
    (D.sr_list || []).forEach(s => { if (!s.nom && s.description)
        s.nom = s.description; });
    (D.ov_list || []).forEach(o => { if (!o.nom && o.description)
        o.nom = o.description; });
    // 5b. SR/OV: migration of the skill's alternative formats
    // Skill format: srov[].sr = "SR-01 - Description" → srov[].sr_id = "SR-01"
    D.srov.forEach(s => {
        if (!s.sr_id && s.sr) {
            const m = s.sr.match(/^(SR-\d+)/);
            s.sr_id = m ? m[1] : s.sr;
        }
        if (!s.ov_id && s.ov) {
            const m = s.ov.match(/^(OV-\d+)/);
            s.ov_id = m ? m[1] : s.ov;
        }
        if (!s.couple && s.sr_id && s.ov_id)
            s.couple = s.sr_id + "/" + s.ov_id;
    });
    // Skill format: bs[].vm_associees → bs[].vm
    D.bs.forEach(b => {
        if (!b.vm && b.vm_associees)
            b.vm = b.vm_associees;
    });
    // Skill format: pp[].bs_concernes → pp[].bs
    D.pp.forEach(p => {
        if (!p.bs && p.bs_concernes)
            p.bs = p.bs_concernes;
    });
    // 5c. Measures: legacy format without "origine"
    D.measures.forEach(m => {
        if (!m.origine && m.type && !["Prévention", "Détection", "Réaction"].includes(m.type)) {
            // Legacy format: type carried the origin
            m.origine = m.type;
            m.type = "";
        }
    });
    // 5c. SOP summary: rebuild from sop_detail if empty
    if (D.sop_summary.length === 0 && D.sop_detail.length > 0) {
        const seen = new Set();
        D.sop_detail.forEach(s => {
            if (s.sop && !seen.has(s.sop)) {
                seen.add(s.sop);
                D.sop_summary.push({ sop: s.sop, ss: s.ss || "" });
            }
        });
    }
    // 5d. Default risk matrix if empty
    if (D.risk_matrix.length === 0) {
        var _F = t("ebios.risk.faible"), _M = t("ebios.risk.moyen"), _E = t("ebios.risk.eleve");
        var n = D.gravity_scale.length || 4;
        if (D.gravity_scale.length === 0) {
            function _g(niv, label, desc) {
                return { niveau: niv, label: label, description: desc,
                    impact_financier: "", impact_reputation: "", impact_reglementaire: "",
                    impact_donnees_perso: "", impact_operationnel: "" };
            }
            D.gravity_scale = [
                _g(4, t("ebios.grav.critique"), t("ebios.grav.desc_critique")),
                _g(3, t("ebios.grav.grave"), t("ebios.grav.desc_grave")),
                _g(2, t("ebios.grav.significatif"), t("ebios.grav.desc_significatif")),
                _g(1, t("ebios.grav.faible"), t("ebios.grav.desc_faible")),
            ];
        }
        var _matrices = {
            3: [{ g: 3, levels: [_M, _E, _E, _E] }, { g: 2, levels: [_F, _M, _M, _E] }, { g: 1, levels: [_F, _F, _F, _M] }],
            4: [{ g: 4, levels: [_M, _M, _E, _E] }, { g: 3, levels: [_F, _M, _M, _E] }, { g: 2, levels: [_F, _F, _M, _M] }, { g: 1, levels: [_F, _F, _F, _M] }],
            5: [{ g: 5, levels: [_M, _E, _E, _E] }, { g: 4, levels: [_M, _M, _E, _E] }, { g: 3, levels: [_F, _M, _M, _E] }, { g: 2, levels: [_F, _F, _M, _M] }, { g: 1, levels: [_F, _F, _F, _F] }],
        };
        D.risk_matrix = _matrices[n] || _matrices[4];
    }
    // 5e. PP: guess the category from the type if missing
    D.pp.forEach(p => {
        if (!p.categorie && p.type) {
            const t = p.type.toLowerCase();
            if (t.includes("client"))
                p.categorie = "Client";
            else if (t.includes("partenaire"))
                p.categorie = "Partenaire";
            else if (t.includes("prestataire") || t.includes("fournisseur") || t.includes("hébergeur") || t.includes("editeur") || t.includes("éditeur") || t.includes("cloud"))
                p.categorie = "Prestataire";
        }
    });
    // 5f. Eco: initialize the residual D/P/M/C from the PP if missing
    D.eco.forEach(e => {
        const ppId = (e.pp_id || "").split(" - ")[0].trim();
        const pp = D.pp.find(p => p.id === ppId);
        // Legacy format migration: menace_resid → remove
        if ("menace_resid" in e)
            delete e.menace_resid;
        // Initialize the residual values from the PP if empty
        if (pp) {
            if (!e.dep_resid && e.dep_resid !== 0)
                e.dep_resid = pp.dependance || "";
            if (!e.pen_resid && e.pen_resid !== 0)
                e.pen_resid = pp.penetration || "";
            if (!e.mat_resid && e.mat_resid !== 0)
                e.mat_resid = pp.maturite || "";
            if (!e.conf_resid && e.conf_resid !== 0)
                e.conf_resid = pp.confiance || "";
        }
    });
    // 5g. Measures: normalize the statuses
    const statutMap = { "Planifié": "En cours", "À lancer": "À étudier", "A lancer": "À étudier", "A étudier": "À étudier" };
    D.measures.forEach(m => {
        if (m.statut && statutMap[m.statut])
            m.statut = statutMap[m.statut];
    });
    // 5f. Eco: legacy field "mesure" → "mesures_existantes"
    D.eco.forEach(e => {
        if (e.mesure && !e.mesures_existantes) {
            e.mesures_existantes = e.mesure;
            delete e.mesure;
        }
    });
    // ── Backend: normalize the loaded numeric fields (strings -> numbers) ──
    _coerceNumericFields();
}
try {
    // Toolbar right: settings button (auth buttons appended by _initAuth)
    var tr = document.getElementById("toolbar-right");
    if (tr && !tr.querySelector(".toolbar-settings")) {
        var _sh = _getSettingsButtonHTML();
        if (_sh)
            tr.insertAdjacentHTML("afterbegin", '<span class="toolbar-settings">' + _sh + '</span>');
    }
    if (typeof window._appInitCallback === "function") {
        window._appInitCallback();
    }
    else {
        _initDataAndRender();
    }
    // Hash-based deep link from Pilot (e.g. /risk/#measures)
    var _hashPanel = (location.hash || "").replace("#", "");
    if (_hashPanel && typeof selectPanel === "function") {
        setTimeout(function () { selectPanel(_hashPanel); }, 200);
    }
    _applyStaticTranslations();
    // Hide "Enregistrer" if the File System Access API is unavailable
    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
        const el = document.getElementById("menu-item-save");
        if (el)
            el.style.display = "none";
    }
    // Offer session restore if data exists in localStorage
    _checkAutoSaveBanner();
}
catch (e) {
    console.error("Erreur au rendu initial:", e);
    document.querySelector(".container").innerHTML = `<section><h2>Erreur</h2><pre>${esc(e.message)}
${esc(e.stack || "")}</pre></section>`;
}
window.AI_APP_CONFIG = {
    storagePrefix: "ebios",
    settingsExtraHTML: function () { return typeof _demoSettingsHTML === "function" ? _demoSettingsHTML() : ""; },
    onSettingsRendered: function () { if (typeof _wireDemoSettings === "function")
        _wireDemoSettings(); }
};
