// ═══════════════════════════════════════════════════════════════════════
// CONFIG & DONNÉES
// ═══════════════════════════════════════════════════════════════════════
window.CT_CONFIG = {
    autosaveKey: "ebios_rm_autosave",
    initDataVar: "EBIOS_INIT_DATA",
    refNamespace: "EBIOS_REF",
    descNamespace: "EBIOS_DESCRIPTIONS",
    labelKey: "ebios.label",
    filePrefix: "EBIOS_RM",
    getSociete: function(d) { return d && d.context ? d.context.societe : ""; },
    getDate: function(d) { return d && d.context ? d.context.date : ""; },
    getScope: function(d) { return "EBIOS_RM"; }
};

let D = window.EBIOS_INIT_DATA || {};

// ── Chargement lazy des fichiers assets compagnons ──────────────────────
// Fichiers générés dans le même répertoire que le HTML :
//   "js/EBIOS_RM"_descriptions.js   → onglet Socle (descriptions ANSSI/ISO)
//   "js/EBIOS_RM"_ref_<id>.js       → un fichier par référentiel (chargé à l'activation)
//   "js/EBIOS_RM"_template.js       → export Excel (template base64)
const _ASSET_BASE = "js/EBIOS_RM";

// Catalogue des référentiels (label/couleur/description) embarqué dans le HTML.
// Permet d'afficher les chips immédiatement sans attendre le chargement d'un fichier.
// Les mesures complètes sont chargées à la demande via _ensureFramework().
// _REFERENTIELS_CATALOG loaded from referentiels_catalog.js (shared)
const _REFERENTIELS_CATALOG = window._REFERENTIELS_CATALOG || {"gamp": {"label": "GAMP 5", "description": "Good Automated Manufacturing Practice \u2014 exigences cybers\u00e9curit\u00e9 pour syst\u00e8mes valid\u00e9s", "description_en": "Good Automated Manufacturing Practice \u2014 cybersecurity requirements for validated systems", "color": "#5b6abf"}, "lpm": {"label": "LPM", "description": "Loi de Programmation Militaire (France) \u2014 r\u00e8gles de s\u00e9curit\u00e9 des arr\u00eat\u00e9s sectoriels ANSSI pour OIV", "description_en": "Military Programming Law (France) \u2014 ANSSI sectoral security rules for Operators of Vital Importance", "color": "#8b5e3c"}, "loi0520": {"label": "Loi 05-20 (Maroc)", "description": "Loi marocaine sur la cybers\u00e9curit\u00e9 \u2014 obligations des organismes soumis", "description_en": "Moroccan Cybersecurity Law \u2014 obligations for subject organizations", "color": "#7a6830"}, "dora": {"label": "DORA", "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 r\u00e9silience num\u00e9rique du secteur financier", "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 digital resilience for the financial sector", "color": "#3a7ca5"}, "hds": {"label": "HDS", "description": "Certification H\u00e9bergeur de Donn\u00e9es de Sant\u00e9 (France) \u2014 exigences compl\u00e9mentaires ISO 27001", "description_en": "Health Data Hosting Certification (France) \u2014 ISO 27001 complementary requirements", "color": "#3a8a6e"}, "secnumcloud": {"label": "SecNumCloud", "description": "R\u00e9f\u00e9rentiel de qualification ANSSI pour les prestataires de services Cloud (v3.2)", "description_en": "ANSSI qualification framework for Cloud service providers (v3.2)", "color": "#5c6b99"}, "nis2": {"label": "NIS 2", "description": "Directive NIS 2 (UE 2022/2555) \u2014 mesures de cybers\u00e9curit\u00e9 pour entit\u00e9s essentielles et importantes", "description_en": "NIS 2 Directive (EU 2022/2555) \u2014 cybersecurity measures for essential and important entities", "color": "#4a8fa8"}, "cra": {"label": "Cyber Resilience Act", "description": "R\u00e8glement UE sur la cyber-r\u00e9silience (CRA 2024) \u2014 exigences pour produits comportant des \u00e9l\u00e9ments num\u00e9riques", "description_en": "EU Cyber Resilience Act (CRA 2024) \u2014 requirements for products with digital elements", "color": "#96694a"}, "soc2": {"label": "SOC 2", "description": "Trust Services Criteria (AICPA) \u2014 s\u00e9curit\u00e9, disponibilit\u00e9, int\u00e9grit\u00e9, confidentialit\u00e9, vie priv\u00e9e", "description_en": "Trust Services Criteria (AICPA) \u2014 security, availability, processing integrity, confidentiality, privacy", "color": "#6b5b8a"}};
let REFERENTIELS_META = Object.fromEntries(
    Object.entries(_REFERENTIELS_CATALOG).map(([k, v]) => [k, {...v}])
);

// _descriptionsLoaded, _ensureDescriptions, _ensureFramework, _initDataAndRender
// are defined in cisotoolbox.js — do not redeclare here.

var _templateLoaded = false;

function _ensureTemplate(cb) {
    if (_templateLoaded) { cb(); return; }
    _loadAsset(_ASSET_BASE + "_template.js", () => {
        _templateLoaded = true;
        cb();
    });
}

// _getAnssDesc/_getIsoDesc defined in cisotoolbox.js (uses CT_CONFIG.descNamespace + locale)

// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════

// Sérialise les arguments en JSON pour data-args (safe dans attribut HTML single-quoted)
// ── Fonctions wrapper pour handlers complexes ───────────────────────────

function _triggerExcelInput() {
    document.getElementById("excel-input").click();
}

function _updateFieldFromEl(el) {
    const s = el.getAttribute("data-s");
    const i = parseInt(el.getAttribute("data-i"));
    const f = el.getAttribute("data-f");
    const typ = el.getAttribute("data-t");
    updateField(s, i, f, el.value, typ);
}

function _refSliderChange(fwId, idx, val) {
    updateRefField(fwId, idx, "conformite", parseInt(val), "number");
}

function _setContextField(key, val) {
    D.context[key] = val;
    renderContext();
}

function _setGravityField(idx, field, rerender, val) {
    D.gravity_scale[idx][field] = val;
    if (rerender) renderAll();
}

// Canonical risk level keys (always stored in FR)
var _RISK_CANONICAL = {"Élevé":"Élevé","Elevé":"Élevé","Eleve":"Élevé","High":"Élevé","Moyen":"Moyen","Medium":"Moyen","Faible":"Faible","Low":"Faible"};

function _toCanonicalRisk(val) { return _RISK_CANONICAL[val] || val; }
function _displayRisk(val) {
    var canon = _toCanonicalRisk(val);
    if (canon === "Élevé") return t("ebios.risk.eleve");
    if (canon === "Moyen") return t("ebios.risk.moyen");
    if (canon === "Faible") return t("ebios.risk.faible");
    return val;
}

function _setRiskMatrix(ri, vi, val) {
    D.risk_matrix[ri].levels[vi] = _toCanonicalRisk(val);
    renderContext();
    renderSynthesis();
}

function _effBadgeClick(el) {
    const s = el.nextElementSibling;
    s.style.display = "inline";
    el.style.display = "none";
    const sl = s.querySelector("select");
    if (sl) { sl.focus(); sl.click(); try { sl.showPicker(); } catch(e) {} }
}

function _newSRFor(idx) {
    const id = newSR();
    if (id) updateSROVRef(idx, "sr_id", id);
}

function _newOVFor(idx) {
    const id = newOV();
    if (id) updateSROVRef(idx, "ov_id", id);
}

// Delegation click/change/input : voir cisotoolbox.js

// ═══════════════════════════════════════════════════════════════════════
// CALCULS
// ═══════════════════════════════════════════════════════════════════════
function computeMenace(d, p, m, c) {
    if (!d || !p || !m || !c) return null;
    return (p * d) / (m * c);
}
function computeExposition(menace) {
    if (menace === null) return "";
    if (menace >= 4) return t("ebios.expo.critique");
    if (menace >= 2) return t("ebios.expo.elevee");
    if (menace >= 1) return t("ebios.expo.moderee");
    return t("ebios.expo.faible");
}
function expoColor(expo) {
    var m = {};
    m[t("ebios.expo.critique")] = "var(--red)";
    m[t("ebios.expo.elevee")] = "var(--orange)";
    m[t("ebios.expo.moderee")] = "var(--yellow)";
    m[t("ebios.expo.faible")] = "var(--green)";
    return m[expo] || "#ccc";
}
function riskColor(level) {
    if (!level) return "#ccc";
    // Match both FR and EN labels
    var reds = ["Élevé", "Elevé", "Eleve", t("ebios.risk.eleve")];
    var oranges = ["Moyen", t("ebios.risk.moyen")];
    var greens = ["Faible", t("ebios.risk.faible")];
    if (reds.indexOf(level) !== -1) return "var(--red)";
    if (oranges.indexOf(level) !== -1) return "var(--orange)";
    if (greens.indexOf(level) !== -1) return "var(--green)";
    return "#ccc";
}
function gravColor(n) {
    const c = {1:"var(--green)",2:"var(--yellow)",3:"var(--orange)",4:"var(--red)",5:"#c0392b"};
    return c[n] || "#ccc";
}
function gravLabel(n) {
    const gs = D.gravity_scale.find(g => g.niveau === n);
    return gs ? gs.label : "";
}
function riskLevel(gNum, v) {
    if (!gNum || !v) return "";
    for (const row of D.risk_matrix) {
        try { if (parseInt(row.g) === parseInt(gNum)) return _displayRisk(row.levels[parseInt(v) - 1] || ""); } catch(e) {}
    }
    return "";
}
function socleStatut(conf) {
    if (conf === "" || conf === null) return "";
    if (conf >= 80) return t("ebios.socle.applique");
    if (conf > 0) return t("ebios.socle.partiel");
    return t("ebios.socle.non_applique");
}
function soclePriorite(conf) {
    if (conf === "" || conf === null) return "";
    if (conf < 30) return t("ebios.socle.priorite_haute");
    if (conf < 60) return t("ebios.socle.priorite_moyenne");
    return t("ebios.socle.priorite_basse");
}

// Gravité SS = MAX des gravités des ER associés
function computeSSGravity(erList) {
    if (!erList) return "";
    let max = 0;
    const ids = erList.split(",").map(s => s.trim().substring(0, 5));
    for (const eid of ids) {
        const er = D.er.find(e => e.id === eid);
        if (er && er.gravite > max) max = er.gravite;
    }
    return max || "";
}

// ═══════════════════════════════════════════════════════════════════════
// MODALE MOT DE PASSE
// ═══════════════════════════════════════════════════════════════════════
function _confirmDialog(title, body) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("confirm-overlay");
        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-body").textContent = body;
        overlay.classList.add("open");
        function cleanup() {
            overlay.classList.remove("open");
            document.getElementById("confirm-oui").onclick = null;
            document.getElementById("confirm-non").onclick = null;
        }
        document.getElementById("confirm-oui").onclick = () => { cleanup(); resolve(true); };
        document.getElementById("confirm-non").onclick = () => { cleanup(); resolve(false); };
    });
}

// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
function _range(a, b) { const r = []; for (let i = Math.max(1,a||1); i <= Math.min(4,b||4); i++) r.push(i); return r; }
function inp(section, idx, field, val, type="text", cls="") {
    const w = type === "number" ? 'class="w-70" min="0" max="999999999999"' : 'maxlength="2000"';
    return `<input type="${type}" value="${esc(val)}" ${w} class="${cls}" data-s="${section}" data-i="${idx}" data-f="${field}" data-t="${type}" data-change="_updateFieldFromEl" data-pass-el />`;
}
function sel(section, idx, field, val, options) {
    let h = `<select data-s="${section}" data-i="${idx}" data-f="${field}" data-change="_updateFieldFromEl" data-pass-el>`;
    h += `<option value=""></option>`;
    for (const o of options) h += `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${o}</option>`;
    h += `</select>`;
    return h;
}
function ta(section, idx, field, val) {
    const rows = Math.max(2, Math.ceil((val || "").length / 40));
    return `<textarea rows="${rows}" data-s="${section}" data-i="${idx}" data-f="${field}" data-change="_updateFieldFromEl" data-pass-el data-input="_autoHeight" data-pass-el>${esc(val)}</textarea>`;
}
function ta_ref(fwId, idx, field, val) {
    const rows = Math.max(2, Math.ceil((val || "").length / 40));
    return `<textarea rows="${rows}" data-change="updateRefField" data-args='${_da(fwId,idx,field)}' data-pass-value data-input="_autoHeight" data-pass-el>${esc(val)}</textarea>`;
}
function delBtn(section, idx) {
    return `<button class="btn-del" data-click="delRow" data-args='${_da(section,idx)}'>X</button>`;
}
function dictToggle(section, idx, field, val) {
    const dims = ["D","I","C","T"];
    const selected = (val || "").split(",").map(s => s.trim()).filter(Boolean);
    let h = '<div class="dict-toggles">';
    for (const d of dims) {
        const active = selected.includes(d) ? "active" : "";
        h += `<div class="dict-btn ${active}" data-click="toggleDICT" data-args='${_da(section,idx,field,d)}' data-pass-el>${d}</div>`;
    }
    h += '</div>';
    return h;
}
function toggleDICT(section, idx, field, dim, el) {
    const current = (D[section][idx][field] || "").split(",").map(s => s.trim()).filter(Boolean);
    const pos = current.indexOf(dim);
    if (pos >= 0) current.splice(pos, 1);
    else current.push(dim);
    // Trier dans l'ordre D, I, C, T
    const order = ["D","I","C","T"];
    current.sort((a,b) => order.indexOf(a) - order.indexOf(b));
    D[section][idx][field] = current.join(", ");
    el.classList.toggle("active");
    showStatus(t("ebios.status.modified"));
}

// ── Sélecteur multi-références ──
// options = [{id:"VM-01", label:"Gestion des Taux"}, ...]
// val = "VM-01 - Gestion des Taux, VM-02 - Gestion des Actions" (string, comma-separated)
let _refCounter = 0;
function refSelect(section, idx, field, val, options, single) {
    const uid = "ref" + (_refCounter++);
    // Extraire les IDs sélectionnés depuis la valeur textuelle
    const selected = (val || "").split(",").map(s => s.trim().split(" - ")[0].split(" ")[0].trim()).filter(Boolean);
    // Tags
    let tags = "";
    for (const opt of options) {
        if (selected.includes(opt.id)) {
            tags += `<span class="ref-tag">${esc(opt.id)} - ${esc(opt.label)}<span class="ref-tag-x" data-click="refRemove" data-args='${_da(uid,section,idx,field,opt.id,!!single)}' data-stop>x</span></span>`;
        }
    }
    if (!tags) tags = '<span class="text-muted fs-xs">' + t("ebios.misc.click_choose") + '</span>';
    // Options dropdown
    let opts = "";
    for (const opt of options) {
        const checked = selected.includes(opt.id) ? "checked" : "";
        opts += `<label class="ref-option"><input type="${single?"radio":"checkbox"}" name="${uid}" value="${esc(opt.id)}" ${checked} data-change="refToggle" data-args='${_da(uid,section,idx,field,null,!!single)}' data-pass-el />${esc(opt.id)} - ${esc(opt.label)}</label>`;
    }
    return `<div class="ref-select" id="${uid}">
        <div class="ref-tags" data-click="refOpen" data-args='${_da(uid)}'>${tags}</div>
        <div class="ref-dropdown" id="${uid}-dd">
            <input class="ref-search" placeholder="${t("ebios.misc.filter")}" data-input="refFilter" data-args='${_da(uid)}' data-pass-value data-click="_noop" data-stop />
            <div class="ref-options">${opts}</div>
        </div>
    </div>`;
}

function refOpen(uid) {
    // Fermer tous les autres dropdowns ouverts (avec re-render différé si dirty)
    document.querySelectorAll(".ref-dropdown.open").forEach(d => {
        if (d.id !== uid + "-dd") { d.classList.remove("open"); _refFlushDirty(d); }
    });
    const dd = document.getElementById(uid + "-dd");
    const wasOpen = dd.classList.contains("open");
    dd.classList.toggle("open");
    if (!dd.classList.contains("open") && wasOpen) {
        // Vient de se fermer via clic sur les tags
        _refFlushDirty(dd);
    } else if (dd.classList.contains("open")) {
        const search = dd.querySelector(".ref-search");
        if (search) { search.value = ""; refFilter(uid, ""); search.focus(); }
    }
}

function refFilter(uid, query) {
    const q = query.toLowerCase();
    const dd = document.getElementById(uid + "-dd");
    dd.querySelectorAll(".ref-option").forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(q) ? "" : "none";
    });
}

function refToggle(uid, section, idx, field, checkbox, single) {
    // Reconstruire la valeur depuis les checkboxes cochées
    const dd = document.getElementById(uid + "-dd");
    const checks = dd.querySelectorAll("input:checked");
    const ids = Array.from(checks).map(c => c.value);
    // Construire la valeur textuelle "ID - Label, ID - Label"
    const parts = ids.map(id => {
        const label = _refLabelFor(section, field, id);
        return label ? id + " - " + label : id;
    });
    const val = parts.join(", ");
    // Pour sr_id/ov_id : stocker uniquement l'ID et appeler updateSROVRef
    if ((field === "sr_id" || field === "ov_id") && section === "srov") {
        const selectedId = ids.length > 0 ? ids[0] : "";
        D[section][idx][field] = selectedId;
        if (single) dd.classList.remove("open");
        updateSROVRef(idx, field, selectedId);
        return;
    }
    // Référentiels complémentaires : section "comp_<fwId>"
    if (section.startsWith("comp_")) {
        const fwId = section.slice(5);
        const refKey = _compRefKey(fwId, idx);
        if (D.socle_complementaires[fwId]) {
            if (!D.socle_complementaires[fwId][refKey]) D.socle_complementaires[fwId][refKey] = {conformite: "", ecart: "", mesures_prevues: ""};
            D.socle_complementaires[fwId][refKey][field] = val;
        }
        if (single) dd.classList.remove("open");
        _refUpdateTagsInline(uid, section, idx, field, ids);
        if (!single) {
            const wrap = document.getElementById(uid);
            if (wrap) wrap.dataset.dirty = JSON.stringify({section, field});
        }
        return;
    }
    D[section][idx][field] = val;
    if (single) {
        dd.classList.remove("open");
        if (section === "eco") _ecoSyncColumns(idx, field, checkbox.value, checkbox.checked);
        _reRenderForField(section, field);
    } else {
        // Multi-select : mettre à jour les tags sans re-render (la liste reste ouverte)
        _refUpdateTagsInline(uid, section, idx, field, ids);
        if (section === "eco") _ecoSyncColumns(idx, field, checkbox.value, checkbox.checked);
        // Marquer pour re-render différé à la fermeture de la liste
        const wrap = document.getElementById(uid);
        if (wrap) wrap.dataset.dirty = JSON.stringify({section, field});
    }
}

// Mettre à jour les tags sans recréer le DOM
function _refUpdateTagsInline(uid, section, idx, field, selectedIds) {
    const wrap = document.getElementById(uid);
    if (!wrap) return;
    const tagsEl = wrap.querySelector(".ref-tags");
    if (!tagsEl) return;
    let html = "";
    for (const id of selectedIds) {
        const label = _refLabelFor(section, field, id);
        const display = label ? id + " - " + label : id;
        html += `<span class="ref-tag">${esc(display)}<span class="ref-tag-x" data-click="refRemove" data-args='${_da(uid,section,idx,field,id,false)}' data-stop>x</span></span>`;
    }
    if (!html) html = '<span class="text-muted fs-xs">' + t("ebios.misc.click_choose") + '</span>';
    tagsEl.innerHTML = html;
}

// Déclencher le re-render différé si un dropdown multi-select est marqué dirty
function _refFlushDirty(dd) {
    const wrap = dd.closest(".ref-select");
    if (wrap && wrap.dataset.dirty) {
        const {section, field} = JSON.parse(wrap.dataset.dirty);
        delete wrap.dataset.dirty;
        if (section.startsWith("comp_")) {
            // Pas de re-render complet nécessaire pour les refs complémentaires
        } else {
            _reRenderForField(section, field);
        }
    }
}

function refRemove(uid, section, idx, field, removeId, single) {
    if (section.startsWith("comp_")) {
        const fwId = section.slice(5);
        const refKey = _compRefKey(fwId, idx);
        if (D.socle_complementaires[fwId] && D.socle_complementaires[fwId][refKey]) {
            const current = D.socle_complementaires[fwId][refKey][field] || "";
            const parts = current.split(",").map(s => s.trim()).filter(s => !s.startsWith(removeId));
            D.socle_complementaires[fwId][refKey][field] = parts.join(", ");
        }
        renderSocleRefs();
        return;
    }
    const current = D[section][idx][field] || "";
    const parts = current.split(",").map(s => s.trim()).filter(s => !s.startsWith(removeId));
    D[section][idx][field] = parts.join(", ");
    _reRenderForField(section, field);
}

function _refLabelFor(section, field, id) {
    // Trouver le label associé à un ID selon le contexte
    const maps = {
        "vm": () => { const v = D.vm.find(x => x.id === id); return v ? v.nom : ""; },
        "bs": () => { const b = D.bs.find(x => x.id === id); return b ? b.nom : ""; },
        "pp": () => { const p = D.pp.find(x => x.id === id); return p ? p.nom : ""; },
        "er": () => { const e = D.er.find(x => x.id === id); return e ? e.evenement : ""; },
        "srov": () => { const s = D.srov.find(x => x.couple === id); return s ? _srFull(s.sr_id) + " / " + _ovFull(s.ov_id) : ""; },
        "ss": () => { const s = D.ss.find(x => x.id === id); return s ? s.scenario : ""; },
        "sr": () => { const s = (D.sr_list||[]).find(x => x.id === id); return s ? s.nom : ""; },
        "ov": () => { const o = (D.ov_list||[]).find(x => x.id === id); return o ? o.nom : ""; },
        "socle": () => {
            const isAnssi = D.socle_type !== "iso";
            const socle = isAnssi ? D.socle_anssi : D.socle_iso;
            const idCol = isAnssi ? "num" : "ref";
            const s = socle.find(x => (isAnssi ? "#"+x[idCol] : x[idCol]) === id);
            return s ? _rt(s, "mesure") : "";
        },
        "sop": () => { const s = D.sop_summary.find(x => x.sop === id); return s ? s.ss : ""; },
        "measures": () => { const m = D.measures.find(x => x.id === id); return m ? m.mesure : ""; },
    };
    // Déterminer quelle lookup utiliser selon le champ
    const fieldToSource = {
        "vm": "vm", "bs": "bs", "pp": "pp", "er": "er",
        "couple_id": "srov", "sop": "sop",
        "mesures": "measures", "mesures_existantes": "measures", "mesures_complementaires": "measures",
        "mesure_proposee": "measures", "mesures_prevues": "measures", "pp_id": "pp", "ss": "ss",
        "sr_id": "sr", "ov_id": "ov",
        "ref": "socle", "ref_socle": "socle",
    };
    const src = fieldToSource[field];
    if (src && maps[src]) return maps[src]();
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
    if (Array.isArray(fns)) fns.forEach(fn => fn());
    else if (fns) fns();
    else { /* fallback */ }
    renderIndicators();
    showStatus(t("ebios.status.modified"));
}

// Fermer les dropdowns quand on clique ailleurs + déclencher re-render différé
document.addEventListener("click", function(e) {
    if (!e.target.closest(".ref-select")) {
        document.querySelectorAll(".ref-dropdown.open").forEach(d => {
            d.classList.remove("open");
            _refFlushDirty(d);
        });
    }
});

// Raccourcis clavier : voir cisotoolbox.js (Ctrl+Z/Y/S)

// ── Fonctions pour obtenir les options de référence ──
function vmOptions() { return D.vm.map(v => ({id: v.id, label: v.nom})); }
function bsOptions() { return D.bs.map(b => ({id: b.id, label: b.nom})); }
function ppOptions() { return D.pp.map(p => ({id: p.id, label: p.nom})); }
function erOptions() { return D.er.map(e => ({id: e.id, label: (e.evenement||"").substring(0,60)})); }
function srovOptions() { return D.srov.map(s => ({id: s.couple, label: _srFull(s.sr_id) + " / " + _ovFull(s.ov_id)})); }
function ssOptions() { return D.ss.map(s => ({id: s.id, label: (s.scenario||"").substring(0,60)})); }
function socleOptions() {
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const idCol = isAnssi ? "num" : "ref";
    return socle.map(s => ({id: isAnssi ? "#"+s[idCol] : s[idCol], label: (_rt(s, "mesure")||"").substring(0,50)}));
}
function sopOptions() { return D.sop_summary.map(s => ({id: s.sop, label: s.ss})); }
function measuresOptions() { return D.measures.map(m => ({id: m.id, label: (_rt(m, "mesure")||"").substring(0,50)})); }

// ═══════════════════════════════════════════════════════════════════════
// HISTORIQUE — Undo/Redo + Snapshots
// ═══════════════════════════════════════════════════════════════════════
// _undoStack, _redoStack, undo/redo defined in cisotoolbox.js (limit: 50)
// Auto-save, banner, newAnalysis : voir cisotoolbox.js

function _updateUndoButtons() {
    const btnU = document.getElementById("btn-undo");
    const btnR = document.getElementById("btn-redo");
    if (btnU) { btnU.style.opacity = _undoStack.length > 0 ? "1" : "0.3"; btnU.disabled = _undoStack.length === 0; }
    if (btnR) { btnR.style.opacity = _redoStack.length > 0 ? "1" : "0.3"; btnR.disabled = _redoStack.length === 0; }
}

// ── Snapshots localStorage (chiffrement optionnel) ──


async function renderHistory() {
    const el = document.getElementById("history-content");
    if (!el) return;
    const snaps = await _getSnapshots();
    const isEnc = _isSnapEncrypted();
    let h = '<div class="mb-12 flex-row-center">';
    h += `<button class="btn-add" data-click="createSnapshot">${t("ebios.history.create")}</button>`;
    if (isEnc) {
        h += `<button class="btn-add snap-btn-red" data-click="disableSnapEncryption">${t("ebios.history.decrypt")}</button>`;
        h += `<span class="text-green fs-sm">${t("ebios.history.encryption_active")}</span>`;
    } else {
        h += `<button class="btn-add snap-btn-blue" data-click="enableSnapEncryption">${t("ebios.history.encrypt")}</button>`;
    }
    h += '</div>';
    if (snaps.length === 0) {
        h += `<p class="text-muted">${t("ebios.history.none")}</p>`;
    } else {
        h += `<table><thead><tr><th>${t("ebios.history.col_name")}</th><th>${t("ebios.history.col_date")}</th><th>${t("ebios.history.col_societe")}</th><th>${t("ebios.history.col_actions")}</th></tr></thead><tbody>`;
        for (let i = snaps.length - 1; i >= 0; i--) {
            const s = snaps[i];
            const d = new Date(s.date);
            const loc = _locale === "en" ? "en-US" : "fr-FR";
            const dateStr = d.toLocaleDateString(loc) + " " + d.toLocaleTimeString(loc, {hour:"2-digit",minute:"2-digit"});
            h += `<tr><td><strong>${esc(s.name)}</strong></td><td>${dateStr}</td><td class="fs-sm">${esc(s.societe)}</td>`;
            h += `<td><button class="btn-add mx-4" data-click="restoreSnapshot" data-args='${_da(i)}'>${t("ebios.history.restore")}</button>`;
            h += `<button class="btn-add" style="margin:0 4px 0 0;background:var(--light-blue)" data-click="exportSnapshot" data-args='${_da(i)}'>${t("ebios.history.export")}</button>`;
            h += `<button class="btn-del" data-click="deleteSnapshot" data-args='${_da(i)}'>X</button></td></tr>`;
        }
        h += '</tbody></table>';
    }
    h += `<p class="mt-16 text-muted fs-sm">${t("ebios.history.hint")}</p>`;
    el.innerHTML = h;
}

// ═══════════════════════════════════════════════════════════════════════
// MISE À JOUR
// ═══════════════════════════════════════════════════════════════════════
// Mettre à jour les références "ID - OldName" → "ID - NewName" dans toutes les sections
function propagateNameChange(id, newName) {
    // Tous les champs qui contiennent des références textuelles "ID - Nom"
    const refFields = [
        ["bs", "vm"], ["pp", "bs"],
        ["er", "vm"], ["ss", "couple_id"], ["ss", "couple_desc"],
        ["ss", "pp"], ["ss", "bs"], ["ss", "er"],
        ["eco", "pp_id"], ["measures", "sop"], ["residuals", "mesures"],
    ];
    const pattern = new RegExp("(^|, )" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "( - [^,]*)?", "g");
    const replacement = "$1" + id + " - " + newName;
    for (const [sec, fld] of refFields) {
        if (!D[sec]) continue;
        for (const item of D[sec]) {
            if (item[fld] && typeof item[fld] === "string" && item[fld].includes(id)) {
                item[fld] = item[fld].replace(pattern, replacement);
            }
        }
    }
}

function updateField(section, idx, field, val, type) {
    _saveState();
    // Convertir en nombre pour les champs numériques
    const numericFields = ["motivation","ressources","activite","d","i","c","t",
        "dependance","penetration","maturite","confiance","gravite","v_resid","conformite",
        "dep_resid","pen_resid","mat_resid","conf_resid"];
    if (type === "number" || numericFields.includes(field)) {
        val = val === "" ? "" : parseFloat(val);
        if (typeof val === "number" && (isNaN(val) || val < -1000 || val > 1e12)) val = "";
    }
    // Limiter la longueur des chaînes
    if (typeof val === "string" && val.length > 5000) val = val.substring(0, 5000);
    const oldVal = D[section][idx][field];
    D[section][idx][field] = val;

    // Si un nom change, propager dans toutes les références
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
            // Re-render tout car les références ont changé partout
            renderAll();
            showStatus(t("ebios.status.modified_refs"));
            return;
        }
    }

    // Re-render la section modifiée + les sections dépendantes (différé pour ne pas interférer avec l'événement)
    setTimeout(() => {
        const rerenders = {
            "vm": [renderVM],
            "bs": [renderBS],
            "pp": [renderPP, renderEcoMap, renderSynthesis],
            "er": [renderER, renderSS, renderResiduals, renderSynthesis],
            "ss": [renderSS, renderResiduals, renderSynthesis],
            "srov": [renderSROV],
            "eco": [renderEco],
            "sop_detail": [renderSOP, renderSOPSynth],
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
}
function nextId(section) {
    const prefixes = {
        vm: "VM", bs: "BS", pp: "PP", er: "ER", ss: "SS",
        srov: "SR/OV", measures: "M", eco: "PP",
    };
    const prefix = prefixes[section] || "X";
    const idField = section === "srov" ? "couple" : (section === "eco" ? "pp_id" : "id");
    let max = 0;
    for (const item of D[section]) {
        const id = item[idField] || "";
        const m = id.match(/(\d+)/);
        if (m) max = Math.max(max, parseInt(m[1]));
    }
    const num = String(max + 1).padStart(3, "0");
    return prefix + "-" + num;
}

function addRow(section) {
    _saveState();
    const id = nextId(section);
    const templates = {
        vm: {id:id,nom:"",nature:"",description:"",responsable:""},
        bs: {id:id,nom:"",type:"",vm:"",localisation:"",proprietaire:""},
        pp: {id:id,nom:"",categorie:"",type:"",dependance:"",penetration:"",maturite:"",confiance:"",bs:""},
        er: {id:id,evenement:"",vm:"",dict:"",impacts:"",gravite:""},
        ss: {id:id,scenario:"",couple_id:"",couple_desc:"",pp:"",bs:"",er:""},
        srov: {couple:id,sr_id:"",ov_id:"",motivation:"",ressources:"",activite:"",justification:""},
        eco: {pp_id:"",mesures_existantes:"",mesures_complementaires:"",categorie:"",dep_resid:"",pen_resid:"",mat_resid:"",conf_resid:""},
        measures: {id:id,mesure:"",details:"",origine:"Complémentaire",type:"",sop:"",phase:"",effet:"",ref_socle:"",responsable:"",echeance:"",cout:"",statut:"À lancer"},
    };
    if (templates[section]) {
        D[section].push({...templates[section]});
        renderAll();
        showStatus(t("ebios.status.line_added", {id: id}));
    }
}
function delRow(section, idx) {
    _saveState();
    D[section].splice(idx, 1);
    // Re-render only the affected section (not renderAll which resets navigation)
    _reRenderForField(section, "");
    if (typeof renderIndicators === "function") renderIndicators();
    _autoSave();
    showStatus(t("ebios.status.line_deleted"));
}
// Structure de navigation : atelier → sous-onglets
function _buildNAV() {
    return {
        synth: [{id:"synth", label:t("ebios.nav.synth")}],
        a1: [
            {id:"context", label:t("ebios.nav.context")},
            {id:"vm", label:t("ebios.nav.vm")},
            {id:"bs", label:t("ebios.nav.bs")},
            {id:"er", label:t("ebios.nav.er")},
            {id:"socle", label:t("ebios.nav.socle")},
        ],
        a2: [{id:"srov", label:t("ebios.nav.srov")}],
        a3: [
            {id:"pp", label:t("ebios.nav.pp")},
            {id:"ss", label:t("ebios.nav.ss")},
            {id:"eco", label:t("ebios.nav.eco")},
        ],
        a4: [{id:"sop", label:t("ebios.nav.sop")},{id:"sop-synth", label:t("ebios.nav.sop_synth")}],
        a5: [
            {id:"measures", label:t("ebios.nav.measures")},
            {id:"residuals", label:t("ebios.nav.residuals")},
        ],
        history: [{id:"history", label:t("ebios.nav.history")}],
    };
}
var NAV = _buildNAV();

let currentAtelier = "synth";

function selectAtelier(atelier) {
    currentAtelier = atelier;
    // Fermer la sidebar mobile
    document.querySelector(".sidebar").classList.remove("open");
    // Mettre à jour la sidebar
    document.querySelectorAll(".sidebar-item").forEach(s => {
        s.classList.remove("active");
        var args = s.getAttribute("data-args");
        if (args) { try { if (JSON.parse(args)[0] === atelier) s.classList.add("active"); } catch(e) {} }
    });
    // Générer les sous-onglets
    const subtabs = NAV[atelier] || [];
    const bar = document.getElementById("subtab-bar");
    if (subtabs.length <= 1) {
        bar.innerHTML = "";
    } else {
        bar.innerHTML = subtabs.map((st, i) =>
            `<div class="subtab ${i===0?'active':''}" data-click="switchSubtab" data-args='${_da(st.id)}'>${st.label}</div>`
        ).join("");
    }
    // Afficher le premier panel de cet atelier
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    if (subtabs.length > 0) {
        const panel = document.getElementById("panel-" + subtabs[0].id);
        if (panel) panel.classList.add("active");
    }
    // Rendu spécifique par atelier
    if (atelier === "synth") renderSynthesis();
    if (atelier === "a1") { renderContext(); renderSocle(); }
    if (atelier === "a2") renderSROV();
    if (atelier === "a3") { renderPP(); renderSS(); renderEco(); renderEcoMap(); }
    if (atelier === "a4") { renderSOP(); renderSOPSynth(); }
    if (atelier === "a5") { renderMeasures(); renderResiduals(); }
    if (atelier === "history") renderHistory();
}

function switchSubtab(panelId) {
    // Masquer tous les panels de l'atelier courant
    const subtabs = NAV[currentAtelier] || [];
    subtabs.forEach(st => {
        const p = document.getElementById("panel-" + st.id);
        if (p) p.classList.remove("active");
    });
    // Afficher le panel demandé
    const panel = document.getElementById("panel-" + panelId);
    if (panel) panel.classList.add("active");
    // Mettre à jour les sous-onglets actifs
    document.querySelectorAll(".subtab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".subtab").forEach(t => {
        if (t.getAttribute("onclick") && t.getAttribute("onclick").includes("'" + panelId + "'"))
            t.classList.add("active");
    });
    if (panelId === "eco") renderEcoMap();
}

// ═══════════════════════════════════════════════════════════════════════
// RENDU
// ═══════════════════════════════════════════════════════════════════════
function renderIndicators() {
    const counts = [
        ["VM", D.vm.length], ["BS", D.bs.length], ["PP", D.pp.length],
        ["ER", D.er.length], ["SS", D.ss.length], ["SOP", D.sop_summary.length],
        [t("ebios.misc.measures_indicator"), D.measures.filter(function(m) { return m.statut !== "À étudier"; }).length],
    ];
    document.getElementById("indicators").innerHTML = counts.map(
        ([d,n]) => `<div class="indicator"><div class="number">${n}</div><div class="desc">${d}</div></div>`
    ).join("");
    // Badges counts
    for (const [k,v] of [["vm",D.vm],["bs",D.bs],["pp",D.pp],["er",D.er],["ss",D.ss],
        ["srov",D.srov],["eco",D.eco],["measures",D.measures],["residuals",D.residuals]])
        { const el = document.getElementById("count-"+k); if(el) el.textContent = v.length; }
    const socle = D.socle_type === "iso" ? D.socle_iso : D.socle_anssi;
    const el = document.getElementById("count-socle"); if(el) el.textContent = socle.length;
    const el2 = document.getElementById("count-sop"); if(el2) el2.textContent = D.sop_detail.length + " " + t("ebios.misc.phases");
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
        h += `<div class="meta-item"><div class="label">${label}</div><div class="value">
            <input type="text" value="${esc(c[key])}" class="w-full" data-change="_setContextField" data-args='${_da(key)}' data-pass-value />
        </div></div>`;
    }
    h += '</div>';
    h += `<div class="meta-item mb-12"><div class="label">${t("ebios.col.reglementation")}</div><div class="value">
        <textarea rows="2" class="w-full" data-change="_setContextField" data-args='["reglementation"]' data-pass-value>${esc(c.reglementation||"")}</textarea>
    </div></div>`;
    h += `<div class="meta-item mb-12"><div class="label">${t("ebios.col.ref_socle_securite")}</div><div class="value flex-row-center">`;
    const isAnssi = D.socle_type !== "iso";
    h += `<label class="cursor-pointer flex-row-center">
        <input type="radio" name="socle_type" value="anssi" ${isAnssi?"checked":""} data-change="setSocleType" data-args='["anssi"]'> ${t("ebios.col.anssi_label")}
    </label>`;
    h += `<label class="cursor-pointer flex-row-center">
        <input type="radio" name="socle_type" value="iso" ${!isAnssi?"checked":""} data-change="setSocleType" data-args='["iso"]'> ${t("ebios.col.iso_label")}
    </label>`;
    h += `</div></div>`;
    h += `<div class="meta-item mb-12"><div class="label">${t("ebios.col.ref_complementaires")}</div><div class="value py-4">`;
    for (const [fwId, meta] of Object.entries(REFERENTIELS_META)) {
        const active = D.referentiels_actifs.includes(fwId);
        const chipStyle = `border-color:${meta.color};color:${active ? "white" : meta.color};background:${active ? meta.color : "white"}`;
        h += `<span class="ref-chip ${active ? "active" : "inactive"}" style="${chipStyle}" data-click="toggleReferentiel" data-args='${_da(fwId)}' title="${esc(_rt(meta, "description"))}">${active ? "✓" : "+"} ${esc(meta.label)}</span>`;
    }
    h += `</div></div>`;
    h += `<div class="meta-item mb-12"><div class="label">${t("ebios.col.commentaires")}</div><div class="value">
        <textarea rows="4" class="w-full" data-change="_setContextField" data-args='["commentaires"]' data-pass-value>${esc(c.commentaires||"")}</textarea>
    </div></div>`;
    h += `<div class="meta-item mb-12"><div class="label">${t("ebios.col.evolutions")}</div><div class="value">
        <textarea rows="3" class="w-full" data-change="_setContextField" data-args='["evolutions"]' data-pass-value>${esc(c.evolutions||"")}</textarea>
    </div></div>`;
    document.getElementById("context-fields").innerHTML = h;

    // ── Échelle de gravité ──
    const n = D.gravity_scale.length;
    let gh = `<h3 class="section-heading">${t("ebios.gravity.heading")}</h3>`;
    gh += '<div class="mb-12 flex-row-center">';
    gh += `<span class="label-bold-sm">${t("ebios.gravity.nb_levels")}</span>`;
    for (const lv of [3, 4, 5]) {
        const active = lv === n;
        gh += `<button style="padding:6px 16px;border-radius:6px;border:2px solid ${active?"var(--light-blue)":"var(--border)"};background:${active?"var(--light-blue)":"white"};color:${active?"white":"var(--text)"};font-weight:700;cursor:pointer;font-size:0.9em" data-click="setGravityLevels" data-args='${_da(lv)}'>${lv}</button>`;
    }
    gh += '</div>';
    const impactCols = [
        {key:"impact_financier", label:t("ebios.gravity.col_impact_financier")},
        {key:"impact_reputation", label:t("ebios.gravity.col_impact_reputation")},
        {key:"impact_reglementaire", label:t("ebios.gravity.col_impact_reglementaire")},
        {key:"impact_donnees_perso", label:t("ebios.gravity.col_impact_donnees_perso")},
        {key:"impact_operationnel", label:t("ebios.gravity.col_impact_operationnel")},
    ];
    gh += `<div class="overflow-x-auto"><table class="minw-1000"><thead><tr><th class="w-50">${t("ebios.gravity.col_niveau")}</th><th class="w-100">${t("ebios.gravity.col_label")}</th><th class="w-180">${t("ebios.gravity.col_description")}</th>`;
    for (const ic of impactCols) gh += `<th>${ic.label}</th>`;
    gh += '</tr></thead><tbody>';
    D.gravity_scale.forEach((g, i) => {
        const gc = gravColor(g.niveau);
        gh += `<tr><td class="ta-c"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${gc};color:white;text-align:center;line-height:28px;font-weight:700">${g.niveau}</span></td>`;
        gh += `<td><input type="text" value="${esc(g.label)}" class="w-full fw-600" data-change="_setGravityField" data-args='${_da(i,"label",true)}' data-pass-value></td>`;
        gh += `<td><textarea rows="2" class="w-full fs-sm" data-change="_setGravityField" data-args='${_da(i,"description",false)}' data-pass-value>${esc(g.description||"")}</textarea></td>`;
        for (const ic of impactCols) {
            gh += `<td><textarea rows="2" class="w-full fs-sm" data-change="_setGravityField" data-args='${_da(i,ic.key,false)}' data-pass-value>${esc(g[ic.key]||"")}</textarea></td>`;
        }
        gh += '</tr>';
    });
    gh += '</tbody></table></div>';

    // ── Matrice de risque G×V ──
    gh += `<h3 class="section-heading">${t("ebios.matrix.heading")}</h3>`;
    gh += '<table class="maxw-500"><thead><tr><th class="w-100">G \\ V</th>';
    for (let v = 1; v <= 4; v++) gh += `<th>V${v}</th>`;
    gh += '</tr></thead><tbody>';
    var riskCanonicals = ["Faible", "Moyen", "Élevé"];
    D.risk_matrix.forEach((row, ri) => {
        const gLbl = gravLabel(row.g);
        gh += `<tr><th class="ta-l fs-sm">${gLbl || "G"+row.g} (${row.g})</th>`;
        for (let vi = 0; vi < 4; vi++) {
            const rawVal = row.levels[vi] || "";
            const canon = _toCanonicalRisk(rawVal);
            const displayed = _displayRisk(rawVal);
            const rc = riskColor(canon);
            gh += `<td style="text-align:center;padding:2px"><select style="width:100%;padding:4px;border-radius:4px;border:1.5px solid var(--border);font-weight:600;color:white;background:${rc};text-align:center" data-change="_setRiskMatrix" data-args='${_da(ri,vi)}' data-pass-value>`;
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
    // Sauvegarder l'échelle courante dans le cache
    const curN = D.gravity_scale.length;
    if (curN > 0) {
        _gravCache[curN] = { scale: JSON.parse(JSON.stringify(D.gravity_scale)), matrix: JSON.parse(JSON.stringify(D.risk_matrix)) };
    }
    // Restaurer depuis le cache si disponible
    if (_gravCache[n]) {
        D.gravity_scale = _gravCache[n].scale;
        D.risk_matrix = _gravCache[n].matrix;
    } else {
        // Sinon utiliser les défauts
        function g(niv, label, desc) {
            return {niveau:niv, label:label, description:desc,
                impact_financier:"", impact_reputation:"", impact_reglementaire:"",
                impact_donnees_perso:"", impact_operationnel:""};
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
                {g:3, levels:[_M,_E,_E,_E]},
                {g:2, levels:[_F,_M,_M,_E]},
                {g:1, levels:[_F,_F,_F,_M]},
            ],
            4: [
                {g:4, levels:[_M,_M,_E,_E]},
                {g:3, levels:[_F,_M,_M,_E]},
                {g:2, levels:[_F,_F,_M,_M]},
                {g:1, levels:[_F,_F,_F,_M]},
            ],
            5: [
                {g:5, levels:[_M,_E,_E,_E]},
                {g:4, levels:[_M,_M,_E,_E]},
                {g:3, levels:[_F,_M,_M,_E]},
                {g:2, levels:[_F,_F,_M,_M]},
                {g:1, levels:[_F,_F,_F,_F]},
            ],
        };
        D.gravity_scale = defaults[n];
        D.risk_matrix = matrices[n];
    }
    renderAll();
}

function setSocleType(type) {
    _saveState();
    D.socle_type = type;
    D.context.socle = type === "iso" ? "ISO 27001 — Annexe A" : "ANSSI — Guide d'hygiène";
    renderContext();
    renderSocle();
    renderSynthesis();
}

function toggleReferentiel(fwId) {
    // Charger le fichier du référentiel avant d'agir
    _ensureFramework(fwId, () => _toggleReferentielNow(fwId));
}

function _toggleReferentielNow(fwId) {
    _saveState();
    const pos = D.referentiels_actifs.indexOf(fwId);
    if (pos >= 0) {
        D.referentiels_actifs.splice(pos, 1);
    } else {
        D.referentiels_actifs.push(fwId);
        // Initialiser les données utilisateur si absentes (format objet clé=ref)
        const meta = REFERENTIELS_META[fwId];
        if (meta && !D.socle_complementaires[fwId]) {
            D.socle_complementaires[fwId] = Object.fromEntries(
                meta.measures.map(m => [m.ref, {conformite: "", ecart: "", mesures_prevues: ""}])
            );
        }
    }
    renderSocleRefs();
    renderContext();
    _autoSave();
}

// Résoudre le ref-clé d'une exigence complémentaire depuis son index ou ref
function _compRefKey(fwId, idx) {
    const meta = REFERENTIELS_META[fwId];
    if (!meta) return String(idx);
    const m = meta.measures[typeof idx === "number" ? idx : parseInt(idx)];
    return m ? m.ref : String(idx);
}

function updateRefField(fwId, idx, field, value, cast) {
    if (!D.socle_complementaires[fwId]) return;
    const refKey = _compRefKey(fwId, idx);
    if (!D.socle_complementaires[fwId][refKey]) D.socle_complementaires[fwId][refKey] = {conformite: "", ecart: "", mesures_prevues: ""};
    D.socle_complementaires[fwId][refKey][field] = cast === "number" ? (value === "" ? "" : parseInt(value)) : value;
    _autoSave();
}

function renderSocleRefs() {
    const container = document.getElementById("socle-refs");
    if (!container) return;
    let h = '<div class="refs-bar">';
    h += `<div class="refs-bar-title">${t("ebios.col.ref_title")}</div>`;
    h += '<div>';
    for (const [fwId, meta] of Object.entries(REFERENTIELS_META)) {
        const active = D.referentiels_actifs.includes(fwId);
        const chip_style = `border-color:${meta.color};color:${active ? "white" : meta.color};background:${active ? meta.color : "white"}`;
        h += `<span class="ref-chip ${active ? "active" : "inactive"}" style="${chip_style}" data-click="toggleReferentiel" data-args='${_da(fwId)}' title="${esc(_rt(meta, "description"))}">`;
        h += `${active ? "✓" : "+"} ${esc(meta.label)}</span>`;
    }
    h += '</div>';

    for (const fwId of D.referentiels_actifs) {
        const meta = REFERENTIELS_META[fwId];
        if (!meta) continue;
        const rows = D.socle_complementaires[fwId] || {};
        h += `<div class="ref-section" style="border-color:${meta.color}20">`;
        h += `<div class="ref-section-header" style="background:${meta.color}15">`;
        h += `<span class="ref-badge" style="background:${meta.color}">${esc(meta.label)}</span>`;
        h += `<span>${esc(_rt(meta, "description"))}</span>`;
        h += `<span style="margin-left:auto;color:var(--text-muted);font-size:0.8em;font-weight:400">${t("ebios.col.ref_exigences", {n: meta.measures.length})}</span>`;
        h += `</div>`;
        h += `<table class="m-0"><thead><tr>`;
        h += `<th class="w-100">${t("ebios.col.ref_ref")}</th><th class="minw-120">${t("ebios.col.ref_theme")}</th><th>${t("ebios.col.ref_mesure")}</th>`;
        h += `<th class="w-130">${t("ebios.col.ref_conformite")}</th><th class="w-80">${t("ebios.col.ref_statut")}</th>`;
        h += `<th class="minw-250">${t("ebios.col.ref_ecart")}</th><th class="w-80">${t("ebios.col.ref_priorite")}</th>`;
        h += `<th>${t("ebios.col.ref_mesures_prevues")}</th></tr></thead><tbody>`;
        meta.measures.forEach((m, i) => {
            const ud = rows[m.ref] || {conformite: "", ecart: "", mesures_prevues: ""};
            const conf = ud.conformite;
            const confVal = (conf === "" || conf === null) ? 0 : parseInt(conf) || 0;
            const confColor = confVal >= 80 ? "var(--green)" : confVal > 0 ? "var(--orange)" : "var(--red)";
            const statut = socleStatut(conf);
            const prio = soclePriorite(conf);
            var _sc = {}; _sc[t("ebios.socle.applique")]="var(--green)"; _sc[t("ebios.socle.partiel")]="var(--yellow)"; _sc[t("ebios.socle.non_applique")]="var(--red)";
            const statutColor = _sc[statut] || "#ccc";
            var _pc = {}; _pc[t("ebios.socle.priorite_haute")]="var(--red)"; _pc[t("ebios.socle.priorite_moyenne")]="var(--yellow)"; _pc[t("ebios.socle.priorite_basse")]="var(--green)";
            const prioColor = _pc[prio] || "#ccc";
            const sliderId = `slbl-ref-${fwId}-${i}`;
            h += `<tr>`;
            h += `<td><strong>${esc(m.ref)}</strong></td>`;
            h += `<td class="desc-text-size">${esc(_rt(m, "theme"))}</td>`;
            h += `<td><div class="fw-600 mb-4">${esc(_rt(m, "mesure"))}</div>`;
            h += `${_rt(m, "description") ? `<div class="desc-text">${esc(_rt(m, "description"))}</div>` : ""}`;
            h += `</td>`;
            h += `<td><div id="${sliderId}" style="text-align:center;font-weight:700;font-size:0.85em;color:${confColor}">${conf !== "" && conf !== null ? confVal + "%" : "—"}</div>`;
            h += `<input type="range" min="0" max="100" step="1" value="${confVal}" style="width:100%;cursor:pointer;accent-color:${confColor}" `;
            h += `data-input="_sliderInput" data-pass-el `;
            h += `data-change="_refSliderChange" data-args='${_da(fwId,i)}' data-pass-value /></td>`;
            h += `<td class="computed">${badge(statut, statutColor)}</td>`;
            h += `<td>${ta_ref(fwId, i, "ecart", ud.ecart)}</td>`;
            h += `<td class="computed">${badge(prio, prioColor)}</td>`;
            h += `<td>${refSelect("comp_" + fwId, i, "mesures_prevues", ud.mesures_prevues || "", measuresOptions())}</td>`;
            h += `</tr>`;
        });
        h += `</tbody></table></div>`;
    }
    h += '</div>';
    container.innerHTML = h;
}

function renderVM() {
    const tc = [{key:"nature",label:t("ebios.col.vm_nature"),on:true},{key:"desc",label:t("ebios.col.vm_description"),on:true},{key:"resp",label:t("ebios.col.vm_responsable"),on:true}];
    document.getElementById("toggles-vm").innerHTML = colsButton("vm-table");
    let h = `<table id="vm-table"><thead><tr><th class="w-65">${t("ebios.col.vm_id")}</th><th>${t("ebios.col.vm_name")}</th><th${hd("nature")} class="w-110">${t("ebios.col.vm_nature")}</th><th${hd("desc")}>${t("ebios.col.vm_description")}</th><th${hd("resp")}>${t("ebios.col.vm_responsable")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.vm.forEach((v, i) => {
        h += `<tr><td><strong>${esc(v.id)}</strong></td><td>${inp("vm",i,"nom",v.nom)}</td>
            <td${hd("nature")}>${sel("vm",i,"nature",v.nature||"",["Information","Processus"])}</td>
            <td${hd("desc")}>${ta("vm",i,"description",v.description)}</td>
            <td${hd("resp")}>${inp("vm",i,"responsable",v.responsable||"")}</td>
            <td>${delBtn("vm",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-vm").innerHTML = h;
    _setupTable("vm-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function renderBS() {
    const tc = [{key:"type",label:t("ebios.col.bs_type"),on:true},{key:"vm",label:t("ebios.col.bs_vm"),on:true},{key:"loc",label:t("ebios.col.bs_localisation"),on:true},{key:"prop",label:t("ebios.col.bs_proprietaire"),on:true}];
    document.getElementById("toggles-bs").innerHTML = colsButton("bs-table");
    let h = `<table id="bs-table"><thead><tr><th class="w-65">${t("ebios.col.bs_id")}</th><th>${t("ebios.col.bs_name")}</th><th${hd("type")}>${t("ebios.col.bs_type")}</th><th${hd("vm")} class="w-120">${t("ebios.col.bs_vm")}</th><th${hd("loc")}>${t("ebios.col.bs_localisation")}</th><th${hd("prop")}>${t("ebios.col.bs_proprietaire")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.bs.forEach((b, i) => {
        h += `<tr><td><strong>${esc(b.id)}</strong></td><td>${inp("bs",i,"nom",b.nom)}</td>
            <td${hd("type")}>${inp("bs",i,"type",b.type)}</td><td${hd("vm")}>${refSelect("bs",i,"vm",b.vm,vmOptions())}</td>
            <td${hd("loc")}>${inp("bs",i,"localisation",b.localisation)}</td>
            <td${hd("prop")}>${inp("bs",i,"proprietaire",b.proprietaire)}</td>
            <td>${delBtn("bs",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-bs").innerHTML = h;
    _setupTable("bs-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function renderPP() {
    const tc = [{key:"cat",label:t("ebios.col.pp_categorie"),on:true},{key:"type",label:t("ebios.col.pp_type"),on:true},{key:"dep",label:t("ebios.col.pp_dependance"),on:true},{key:"pen",label:t("ebios.col.pp_penetration"),on:true},{key:"mat",label:t("ebios.col.pp_maturite"),on:true},{key:"conf",label:t("ebios.col.pp_confiance"),on:true},{key:"menace",label:t("ebios.col.pp_menace"),on:true},{key:"expo",label:t("ebios.col.pp_exposition"),on:true},{key:"bs",label:t("ebios.col.pp_bs"),on:true}];
    document.getElementById("toggles-pp").innerHTML = colsButton("pp-table");
    let h = `<table id="pp-table"><thead><tr><th>${t("ebios.col.pp_id")}</th><th>${t("ebios.col.pp_name")}</th><th${hd("cat")}>${t("ebios.col.pp_categorie")}</th><th${hd("type")}>${t("ebios.col.pp_type")}</th><th${hd("dep")} class="w-40">${t("ebios.col.pp_dependance")}</th><th${hd("pen")} class="w-40">${t("ebios.col.pp_penetration")}</th><th${hd("mat")} class="w-40">${t("ebios.col.pp_maturite")}</th><th${hd("conf")} class="w-40">${t("ebios.col.pp_confiance")}</th><th${hd("menace")}>${t("ebios.col.pp_menace")}</th><th${hd("expo")}>${t("ebios.col.pp_exposition")}</th><th${hd("bs")} class="w-120">${t("ebios.col.pp_bs")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.pp.forEach((p, i) => {
        const menace = computeMenace(p.dependance, p.penetration, p.maturite, p.confiance);
        const expo = computeExposition(menace);
        h += `<tr><td><strong>${esc(p.id)}</strong></td><td>${inp("pp",i,"nom",p.nom)}</td>
            <td${hd("cat")}>${sel("pp",i,"categorie",p.categorie||"",["Client","Partenaire","Prestataire"])}</td>
            <td${hd("type")}>${inp("pp",i,"type",p.type)}</td>
            <td>${sel("pp",i,"dependance",p.dependance,[1,2,3,4])}</td>
            <td>${sel("pp",i,"penetration",p.penetration,[1,2,3,4])}</td>
            <td>${sel("pp",i,"maturite",p.maturite,[1,2,3,4])}</td>
            <td${hd("conf")}>${sel("pp",i,"confiance",p.confiance,[1,2,3,4])}</td>
            <td${hd("menace")} class="computed">${menace !== null ? menace.toFixed(2) : ""}</td>
            <td${hd("expo")} class="computed">${badge(expo, expoColor(expo))}</td>
            <td${hd("bs")}>${refSelect("pp",i,"bs",p.bs,bsOptions())}</td>
            <td>${delBtn("pp",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-pp").innerHTML = h;
    _setupTable("pp-table", tc.filter(c=>!c.on).map(c=>c.key));
    renderPPMap();
}

function renderSocle() {
    // Charger les descriptions si besoin, puis re-rendre (pop-in gracieux)
    if (!_descriptionsLoaded) {
        _ensureDescriptions(() => renderSocle());
    }
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const section = isAnssi ? "socle_anssi" : "socle_iso";
    const idCol = isAnssi ? "num" : "ref";
    const themeCol = isAnssi ? "thematique" : "theme";

    const tc = [{key:"theme",label:t("ebios.col.socle_theme"),on:true},{key:"mesure",label:t("ebios.col.socle_mesure"),on:true},{key:"conf",label:t("ebios.col.socle_conformite"),on:true},{key:"statut",label:t("ebios.col.socle_statut"),on:true},{key:"ecart",label:t("ebios.col.socle_ecart"),on:true},{key:"prio",label:t("ebios.col.socle_priorite"),on:true},{key:"mp",label:t("ebios.col.socle_mesures_prevues"),on:true}];
    document.getElementById("toggles-socle").innerHTML = colsButton("socle-table");
    let h = `<p class="mb-12 text-muted">Socle : ${isAnssi ? t("ebios.socle.anssi_label") : t("ebios.socle.iso_label")}</p>`;
    h += `<table id="socle-table"><thead><tr><th>${t("ebios.col.socle_num")}</th><th${hd("theme")}>${t("ebios.col.socle_theme")}</th><th${hd("mesure")}>${t("ebios.col.socle_mesure")}</th><th${hd("conf")} class="w-130">${t("ebios.col.socle_conformite")}</th><th${hd("statut")}>${t("ebios.col.socle_statut")}</th><th${hd("ecart")} class="minw-300">${t("ebios.col.socle_ecart")}</th><th${hd("prio")}>${t("ebios.col.socle_priorite")}</th><th${hd("mp")}>${t("ebios.col.socle_mesures_prevues")}</th></tr></thead><tbody>`;
    socle.forEach((s, i) => {
        const conf = s.conformite;
        const confVal = (conf === "" || conf === null) ? 0 : parseInt(conf) || 0;
        const confColor = confVal >= 80 ? "var(--green)" : confVal > 0 ? "var(--orange)" : "var(--red)";
        const statut = socleStatut(conf);
        const prio = soclePriorite(conf);
        var _sc = {}; _sc[t("ebios.socle.applique")]="var(--green)"; _sc[t("ebios.socle.partiel")]="var(--yellow)"; _sc[t("ebios.socle.non_applique")]="var(--red)";
            const statutColor = _sc[statut] || "#ccc";
        var _pc = {}; _pc[t("ebios.socle.priorite_haute")]="var(--red)"; _pc[t("ebios.socle.priorite_moyenne")]="var(--yellow)"; _pc[t("ebios.socle.priorite_basse")]="var(--green)";
            const prioColor = _pc[prio] || "#ccc";
        const sliderId = "slbl-" + section + "-" + i;
        const desc = isAnssi ? _getAnssDesc(s.num) : _getIsoDesc(s.ref || s.num);
        h += `<tr><td>${esc(s[idCol])}</td><td${hd("theme")}>${esc(_rt(s, themeCol))}</td><td${hd("mesure")}><div class="fw-600 mb-4">${esc(_rt(s, "mesure"))}</div>${desc ? `<div class="desc-text">${esc(desc)}</div>` : ""}</td>
            <td${hd("conf")}><div id="${sliderId}" style="text-align:center;font-weight:700;font-size:0.85em;color:${confColor}">${conf !== "" && conf !== null ? confVal + "%" : "—"}</div><input type="range" min="0" max="100" step="1" value="${confVal}" style="width:100%;cursor:pointer;accent-color:${confColor}" data-s="${section}" data-i="${i}" data-f="conformite" data-lbl="${sliderId}" data-input="_sliderInput" data-pass-el data-change="_sliderChange" data-pass-el /></td>
            <td${hd("statut")} class="computed">${badge(statut, statutColor)}</td>
            <td${hd("ecart")}>${ta(section,i,"ecart",s.ecart)}</td>
            <td${hd("prio")} class="computed">${badge(prio, prioColor)}</td>
            <td${hd("mp")}>${refSelect(section,i,"mesures_prevues",s.mesures_prevues||"",measuresOptions())}<button class="btn-add btn-add-sm" data-click="addSocleMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_socle_measure")}</button></td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-socle").innerHTML = h;
    _setupTable("socle-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function addSocleMeasure(socleIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_socle_measure"));
    if (!desc) return;
    const id = nextId("measures");
    const isAnssi = D.socle_type !== "iso";
    const section = isAnssi ? "socle_anssi" : "socle_iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    const refNum = socle[socleIdx] ? (isAnssi ? "#" + socle[socleIdx].num : socle[socleIdx].ref) : "";
    // Créer la mesure dans 5a
    D.measures.push({
        id: id, mesure: desc, origine: "Socle", type: "Prévention",
        sop: "", phase: "", effet: t("ebios.m.renforcement_socle", {ref: refNum}),
        ref_socle: refNum, responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    // Ajouter la référence dans le champ mesures_prevues du socle
    const current = socle[socleIdx].mesures_prevues || "";
    const newRef = id + " - " + desc;
    socle[socleIdx].mesures_prevues = current ? current + ", " + newRef : newRef;
    renderSocle();
    renderMeasures();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", {id: id}));
}

// ── SR/OV : listes séparées SR, OV, couples ──
function srOptions() { return (D.sr_list||[]).map(s => ({id: s.id, label: s.nom})); }
function ovOptions() { return (D.ov_list||[]).map(o => ({id: o.id, label: o.nom})); }

function _srNom(id) { const s = (D.sr_list||[]).find(x => x.id === id); return s ? s.nom : ""; }
function _ovNom(id) { const o = (D.ov_list||[]).find(x => x.id === id); return o ? o.nom : ""; }
function _srFull(id) { return id ? id + " - " + _srNom(id) : ""; }
function _ovFull(id) { return id ? id + " - " + _ovNom(id) : ""; }

function newSR() {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_sr"));
    if (!desc) return null;
    let max = 0;
    (D.sr_list||[]).forEach(s => { const m = s.id.match(/(\d+)/); if (m) max = Math.max(max, parseInt(m[1])); });
    const id = "SR-" + String(max + 1).padStart(3, "0");
    D.sr_list.push({id: id, nom: desc});
    showStatus(t("ebios.status.sr_created", {id: id}));
    return id;
}
function newOV() {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_ov"));
    if (!desc) return null;
    let max = 0;
    (D.ov_list||[]).forEach(o => { const m = o.id.match(/(\d+)/); if (m) max = Math.max(max, parseInt(m[1])); });
    const id = "OV-" + String(max + 1).padStart(3, "0");
    D.ov_list.push({id: id, nom: desc});
    showStatus(t("ebios.status.ov_created", {id: id}));
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
            if (j === idx) continue;
            if (D.srov[j].sr_id === srId && D.srov[j].ov_id === ovId) {
                alert(t("ebios.confirm.duplicate_srov", {sr: srId, ov: ovId}));
                D.srov[idx][field] = oldVal;
                renderSROV();
                return;
            }
        }
        D.srov[idx].couple = srId + "/" + ovId;
    }
    renderSROV();
    showStatus(t("ebios.status.modified"));
}

function srSelectWidget(idx, val) {
    const fullVal = val ? val + " - " + _srNom(val) : "";
    return refSelect("srov", idx, "sr_id", fullVal, srOptions(), true) +
        `<button class="btn-phase mt-3" data-click="_newSRFor" data-args='${_da(idx)}'>${t("ebios.btn.new_sr")}</button>`;
}
function ovSelectWidget(idx, val) {
    const fullVal = val ? val + " - " + _ovNom(val) : "";
    return refSelect("srov", idx, "ov_id", fullVal, ovOptions(), true) +
        `<button class="btn-phase mt-3" data-click="_newOVFor" data-args='${_da(idx)}'>${t("ebios.btn.new_ov")}</button>`;
}

function renderSROV() {
    const tc = [{key:"sr",label:t("ebios.col.srov_sr"),on:true},{key:"ov",label:t("ebios.col.srov_ov"),on:true},{key:"m",label:t("ebios.col.srov_motivation"),on:true},{key:"r",label:t("ebios.col.srov_ressources"),on:true},{key:"a",label:t("ebios.col.srov_activite"),on:true},{key:"pert",label:t("ebios.col.srov_pertinence"),on:true},{key:"prio",label:t("ebios.col.srov_priorite"),on:true},{key:"just",label:t("ebios.col.srov_justification"),on:true}];
    document.getElementById("toggles-srov").innerHTML = colsButton("srov-table");
    let h = `<table id="srov-table"><thead><tr><th class="w-85">${t("ebios.col.srov_couple")}</th><th${hd("sr")}>${t("ebios.col.srov_sr")}</th><th${hd("ov")}>${t("ebios.col.srov_ov")}</th><th${hd("m")} class="w-40">${t("ebios.col.srov_motivation")}</th><th${hd("r")} class="w-40">${t("ebios.col.srov_ressources")}</th><th${hd("a")} class="w-40">${t("ebios.col.srov_activite")}</th><th${hd("pert")} class="w-40">${t("ebios.col.srov_pertinence")}</th><th${hd("prio")}>${t("ebios.col.srov_priorite")}</th><th${hd("just")}>${t("ebios.col.srov_justification")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.srov.forEach((s, i) => {
        const pert = (s.motivation||0) + (s.ressources||0) + (s.activite||0);
        let prio = "";
        if (pert > 7) prio = t("ebios.srov.p1"); else if (pert > 4) prio = t("ebios.srov.p2");
        else if (pert >= 3) prio = t("ebios.srov.non_retenu"); else if (pert > 0) prio = t("ebios.srov.ecarte");
        var _prioColors = {};
        _prioColors[t("ebios.srov.p1")] = "var(--red)";
        _prioColors[t("ebios.srov.p2")] = "var(--orange)";
        _prioColors[t("ebios.srov.non_retenu")] = "var(--yellow)";
        _prioColors[t("ebios.srov.ecarte")] = "#ccc";
        const prioColor = _prioColors[prio] || "#ccc";
        h += `<tr><td><strong>${esc(s.couple)}</strong></td>
            <td${hd("sr")}>${srSelectWidget(i, s.sr_id)}</td><td${hd("ov")}>${ovSelectWidget(i, s.ov_id)}</td>
            <td${hd("m")}>${sel("srov",i,"motivation",s.motivation,[0,1,2,3,4])}</td>
            <td${hd("r")}>${sel("srov",i,"ressources",s.ressources,[0,1,2,3,4])}</td>
            <td${hd("a")}>${sel("srov",i,"activite",s.activite,[0,1,2,3,4])}</td>
            <td${hd("pert")} class="computed">${pert||""}</td>
            <td${hd("prio")} class="computed">${badge(prio, prioColor)}</td>
            <td${hd("just")}>${ta("srov",i,"justification",s.justification)}</td>
            <td>${delBtn("srov",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-srov").innerHTML = h;
    _setupTable("srov-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function renderER() {
    var maxG = D.gravity_scale.length > 0 ? D.gravity_scale[0].niveau : 4;
    var descEl = document.getElementById("desc-er");
    if (descEl) descEl.textContent = t("ebios.desc.er", {max: maxG});
    const tc = [{key:"vm",label:t("ebios.col.er_vm"),on:true},{key:"dict",label:t("ebios.col.er_dict"),on:true},{key:"impacts",label:t("ebios.col.er_impacts"),on:true},{key:"grav",label:t("ebios.col.er_gravite"),on:true},{key:"label",label:t("ebios.col.er_label"),on:true}];
    document.getElementById("toggles-er").innerHTML = colsButton("er-table");
    const gOpts = D.gravity_scale.map(g => g.niveau);
    let h = `<table id="er-table"><thead><tr><th class="w-65">${t("ebios.col.er_id")}</th><th class="minw-200">${t("ebios.col.er_evenement")}</th><th${hd("vm")}>${t("ebios.col.er_vm")}</th><th${hd("dict")} class="w-100">${t("ebios.col.er_dict")}</th><th${hd("impacts")}>${t("ebios.col.er_impacts")}</th><th${hd("grav")}>${t("ebios.col.er_gravite")}</th><th${hd("label")}>${t("ebios.col.er_label")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.er.forEach((e, i) => {
        const lbl = gravLabel(e.gravite);
        h += `<tr><td><strong>${esc(e.id)}</strong></td><td>${ta("er",i,"evenement",e.evenement)}</td>
            <td${hd("vm")}>${refSelect("er",i,"vm",e.vm,vmOptions(),true)}</td><td${hd("dict")}>${dictToggle("er",i,"dict",e.dict)}</td>
            <td${hd("impacts")}>${ta("er",i,"impacts",e.impacts)}</td>
            <td${hd("grav")}>${sel("er",i,"gravite",e.gravite,gOpts)}</td>
            <td${hd("label")} class="computed">${lbl ? badge(lbl, gravColor(e.gravite)) : ""}</td>
            <td>${delBtn("er",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-er").innerHTML = h;
    _setupTable("er-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function renderSS() {
    const tc = [{key:"srov",label:t("ebios.col.ss_srov"),on:false},{key:"pp",label:t("ebios.col.ss_pp"),on:true},{key:"bs",label:t("ebios.col.ss_bs"),on:false},{key:"er",label:t("ebios.col.ss_er"),on:true},{key:"grav",label:t("ebios.col.ss_gravite"),on:true}];
    document.getElementById("toggles-ss").innerHTML = colsButton("ss-table");
    let h = `<table id="ss-table"><thead><tr><th class="w-55">${t("ebios.col.ss_id")}</th><th class="minw-250">${t("ebios.col.ss_scenario")}</th><th${hd("srov")} class="w-120">${t("ebios.col.ss_srov")}</th><th${hd("pp")}>${t("ebios.col.ss_pp")}</th><th${hd("bs")}>${t("ebios.col.ss_bs")}</th><th${hd("er")}>${t("ebios.col.ss_er")}</th><th${hd("grav")} class="w-70">${t("ebios.col.ss_gravite")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const lbl = gravLabel(gNum);
        h += `<tr><td><strong>${esc(s.id)}</strong></td><td>${ta("ss",i,"scenario",s.scenario)}</td>
            <td${hd("srov")}>${refSelect("ss",i,"couple_id",s.couple_id,srovOptions(),true)}</td>
            <td${hd("pp")}>${refSelect("ss",i,"pp",s.pp,ppOptions())}</td>
            <td${hd("bs")}>${refSelect("ss",i,"bs",s.bs,bsOptions())}</td>
            <td${hd("er")}>${refSelect("ss",i,"er",s.er,erOptions())}</td>
            <td${hd("grav")} class="computed">${lbl ? badge(lbl, gravColor(gNum)) : ""}</td>
            <td>${delBtn("ss",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-ss").innerHTML = h;
    _setupTable("ss-table", tc.filter(c=>!c.on).map(c=>c.key));
}

// Système de colonnes : masquer/afficher + redimensionner

// Colonnes, popups, resize : voir cisotoolbox.js
function _ecoSyncColumns(idx, field, measureId, added) {
    if (!added || !measureId) return;
    const eco = D.eco[idx];
    const otherField = field === "mesures_existantes" ? "mesures_complementaires" : "mesures_existantes";
    const otherVal = eco[otherField] || "";

    // Vérifier si la mesure ajoutée est dans l'autre colonne
    const otherParts = otherVal.split(",").map(s => s.trim()).filter(Boolean);
    const found = otherParts.findIndex(p => p.startsWith(measureId));
    if (found >= 0) {
        // Retirer de l'autre colonne
        otherParts.splice(found, 1);
        eco[otherField] = otherParts.join(", ");

        if (field === "mesures_complementaires") {
            // Ajouté dans complémentaires → était dans existantes
            // → passer le statut de la mesure à "À étudier" dans 5a
            const m = D.measures.find(x => x.id === measureId);
            if (m && m.statut === "Terminé") {
                m.statut = "À étudier";
                showStatus(t("ebios.status.eco_moved_compl", {id: measureId}));
            }
        } else {
            // Ajouté dans existantes → était dans complémentaires
            showStatus(t("ebios.status.eco_moved_exist", {id: measureId}));
        }
    }
}

function _buildEcoSVG(ppList, title) {
    const W = 1000, H = 900, CX = W/2, CY = 390, R = 270, M = 15;
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

    // 4 quadrants : haut-gauche=Clients, haut-droit=Partenaires, bas-gauche=Prestataires, bas-droit=Légende
    // 0°=haut sens horaire : 270-360=haut-gauche, 0-90=haut-droit, 180-270=bas-gauche, 90-180=bas-droit(échelle)
    var _cl = t("ebios.eco.clients"), _pa = t("ebios.eco.partenaires"), _pr = t("ebios.eco.prestataires");
    const quads = {};
    quads[_cl] = { a1: 270, a2: 360, color: "#1abc9c", rx: CX-R-M, ry: CY-R-M, rw: R+M-8, rh: R+M-8 };
    quads[_pa] = { a1: 0,   a2: 90,  color: "#9b59b6", rx: CX+8,   ry: CY-R-M, rw: R+M-8, rh: R+M-8 };
    quads[_pr] = { a1: 180, a2: 270, color: "#7f8c8d", rx: CX-R-M, ry: CY+8,   rw: R+M-8, rh: R+M-8 };

    let svg = `<svg viewBox="0 0 ${W} ${H}" style="max-width:${W}px;width:100%;height:auto;display:block;margin:0 auto">`;

    // Cadres rectangulaires arrondis par quadrant
    for (const [name, q] of Object.entries(quads)) {
        svg += `<rect x="${q.rx}" y="${q.ry}" width="${q.rw}" height="${q.rh}" rx="18" fill="${q.color}" fill-opacity="0.05" stroke="${q.color}" stroke-width="2" stroke-opacity="0.25" />`;
        // Label du quadrant
        const lx = q.rx + q.rw / 2;
        const isTop = q.ry < CY;
        const ly = isTop ? q.ry + 16 : q.ry + q.rh - 8;
        svg += `<text x="${lx}" y="${ly}" font-size="13" fill="${q.color}" font-style="italic" font-weight="600" text-anchor="middle">${name}</text>`;
    }

    // Zones concentriques
    svg += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="#1abc9c" fill-opacity="0.06" stroke="#1abc9c" stroke-width="2" opacity="0.35" />`;
    svg += `<circle cx="${CX}" cy="${CY}" r="${menaceToR(0.9)}" fill="#f1c40f" fill-opacity="0.07" stroke="#f1c40f" stroke-width="2" opacity="0.45" />`;
    svg += `<circle cx="${CX}" cy="${CY}" r="${menaceToR(2.5)}" fill="#e74c3c" fill-opacity="0.08" stroke="#e74c3c" stroke-width="2" opacity="0.5" />`;

    // Axes
    svg += `<line x1="${CX}" y1="${CY - R - 5}" x2="${CX}" y2="${CY + R + 5}" stroke="#ccc" stroke-width="0.8" />`;
    svg += `<line x1="${CX - R - 5}" y1="${CY}" x2="${CX + R + 5}" y2="${CY}" stroke="#ccc" stroke-width="0.8" />`;

    // Graduations sur l'axe bas-droit (quadrant légende)
    for (let i = 0; i <= maxMenace; i++) {
        const rr = menaceToR(i);
        svg += `<circle cx="${CX}" cy="${CY}" r="${rr}" fill="none" stroke="#ddd" stroke-width="0.5" stroke-dasharray="3,3" />`;
        // Label sur la diagonale bas-droit
        const [lx, ly] = degXY(135, rr + 4);
        svg += `<text x="${lx}" y="${ly - 2}" font-size="13" fill="#555" font-weight="700">${i}</text>`;
    }

    // Centre
    svg += `<circle cx="${CX}" cy="${CY}" r="7" fill="#2c3e50" />`;

    // Passe 1 : calculer toutes les positions des PP et labels
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
            const fill = fc < 4 ? "#e74c3c" : fc < 7 ? "#f39c12" : fc < 10 ? "#f1c40f" : "#1abc9c";
            const stroke = fc < 4 ? "#c0392b" : fc < 7 ? "#e67e22" : fc < 10 ? "#d4ac0d" : "#16a085";
            const isLeft = px < CX;
            const labelText = esc(p.id + " - " + p.nom);
            // Label aligné sur le bord du rectangle du quadrant
            const lx = isLeft ? q.rx + 8 : q.rx + q.rw - 8;
            allPP.push({ px, py, cr, fill, stroke, isLeft, lx, ly: py, labelText, quad: catName });
        });
    }

    // Passe 2 : résoudre les collisions de labels par quadrant, clamper dans le rectangle
    const LH = 14;
    const quadGroups = {};
    allPP.forEach((p, i) => {
        if (!quadGroups[p.quad]) quadGroups[p.quad] = [];
        quadGroups[p.quad].push(i);
    });
    for (const [qName, indices] of Object.entries(quadGroups)) {
        const q = quads[qName];
        const yMin = q.ry + 22;
        const yMax = q.ry + q.rh - 10;
        // Clamper les positions initiales
        for (const i of indices) allPP[i].ly = Math.max(yMin, Math.min(yMax, allPP[i].ly));
        // Trier par Y et résoudre les collisions
        indices.sort((a, b) => allPP[a].ly - allPP[b].ly);
        for (let k = 1; k < indices.length; k++) {
            const prev = allPP[indices[k - 1]];
            const curr = allPP[indices[k]];
            if (curr.ly - prev.ly < LH) {
                curr.ly = prev.ly + LH;
            }
        }
        // Si les derniers dépassent, comprimer vers le haut
        const last = allPP[indices[indices.length - 1]];
        if (last.ly > yMax) {
            const overflow = last.ly - yMax;
            for (const i of indices) allPP[i].ly = Math.max(yMin, allPP[i].ly - overflow);
            // Re-espacer si comprimé
            for (let k = 1; k < indices.length; k++) {
                const prev = allPP[indices[k - 1]];
                const curr = allPP[indices[k]];
                if (curr.ly - prev.ly < LH * 0.7) curr.ly = prev.ly + LH * 0.7;
            }
        }
    }

    // Passe 3 : dessiner connecteurs, cercles, labels
    for (const p of allPP) {
        const ex = p.isLeft ? p.px - p.cr - 2 : p.px + p.cr + 2;
        const lx2 = p.isLeft ? p.lx + 2 : p.lx - 2;
        svg += `<path d="M${ex},${p.py} C${(ex + lx2) / 2},${p.py} ${(ex + lx2) / 2},${p.ly} ${lx2},${p.ly}" fill="none" stroke="#ccc" stroke-width="0.8" />`;
        svg += `<circle cx="${lx2}" cy="${p.ly}" r="1.5" fill="#ccc" />`;
    }
    // Cercles PP
    for (const p of allPP) {
        svg += `<circle cx="${p.px}" cy="${p.py}" r="${p.cr}" fill="${p.fill}" fill-opacity="0.75" stroke="${p.stroke}" stroke-width="2" />`;
    }
    // Labels
    for (const p of allPP) {
        const anchor = p.isLeft ? "end" : "start";
        svg += `<text x="${p.lx}" y="${p.ly + 4}" font-size="9" fill="#333" text-anchor="${anchor}" font-weight="600">${p.labelText}</text>`;
    }

    // Légende en bas
    const ly = CY + R + M + 20;
    svg += `<circle cx="60" cy="${ly}" r="10" fill="none" stroke="#e74c3c" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="76" y="${ly+4}" font-size="10" fill="#555">${t("ebios.eco.zone_danger")}</text>`;
    svg += `<circle cx="280" cy="${ly}" r="10" fill="none" stroke="#f1c40f" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="296" y="${ly+4}" font-size="10" fill="#555">${t("ebios.eco.zone_controle")}</text>`;
    svg += `<circle cx="520" cy="${ly}" r="10" fill="none" stroke="#1abc9c" stroke-width="4" opacity="0.5" />`;
    svg += `<text x="536" y="${ly+4}" font-size="10" fill="#555">${t("ebios.eco.zone_veille")}</text>`;

    const ly2 = ly + 24;
    svg += `<text x="60" y="${ly2}" font-size="9" fill="#999" font-weight="600">${t("ebios.eco.fiabilite")}</text>`;
    const fiabs = [["#e74c3c",t("ebios.eco.fiab_faible"),170],["#f39c12",t("ebios.eco.fiab_moyenne"),250],["#f1c40f",t("ebios.eco.fiab_bonne"),340],["#1abc9c",t("ebios.eco.fiab_elevee"),420]];
    for (const [c, label, fx] of fiabs) {
        svg += `<circle cx="${fx}" cy="${ly2-3}" r="5" fill="${c}" fill-opacity="0.75" />`;
        svg += `<text x="${fx+8}" y="${ly2}" font-size="9" fill="#999">${label}</text>`;
    }
    svg += `<text x="500" y="${ly2}" font-size="9" fill="#999" font-weight="600">${t("ebios.eco.diametre")}</text>`;

    svg += '</svg>';
    return svg;
}

function renderEcoMap() {
    const el = document.getElementById("eco-map");
    if (!el || D.pp.length === 0) { if (el) el.innerHTML = ""; return; }
    const ppData = D.pp.map(p => {
        const d = p.dependance||0, pen = p.penetration||0, m = p.maturite||0, c = p.confiance||0;
        const eco = D.eco.find(e => (e.pp_id || "").split(" - ")[0].trim() === p.id);
        const dr = eco && eco.dep_resid ? eco.dep_resid : d;
        const pr = eco && eco.pen_resid ? eco.pen_resid : pen;
        const mr = eco && eco.mat_resid ? eco.mat_resid : m;
        const cr = eco && eco.conf_resid ? eco.conf_resid : c;
        const menace = (mr && cr) ? (pr * dr) / (mr * cr) : 0;
        return { id: p.id, nom: p.nom, cat: p.categorie || "", menace, fiab: (mr||0)*(cr||0), expo: (dr||0)*(pr||0) };
    });
    el.innerHTML = _buildEcoSVG(ppData, t("ebios.eco.map_after"));
}

function renderPPMap() {
    const el = document.getElementById("pp-map");
    if (!el || D.pp.length === 0) { if (el) el.innerHTML = ""; return; }
    const ppData = D.pp.map(p => {
        const d = p.dependance||0, pen = p.penetration||0, m = p.maturite||0, c = p.confiance||0;
        const menace = (m && c) ? (pen * d) / (m * c) : 0;
        return { id: p.id, nom: p.nom, cat: p.categorie || "", menace, fiab: (m||0)*(c||0), expo: (d||0)*(pen||0) };
    });
    el.innerHTML = _buildEcoSVG(ppData, t("ebios.eco.map_initial"));
}

function renderEco() {
    // Auto-populate eco entries for PPs that don't have one yet
    D.pp.forEach(pp => {
        const ppRef = pp.id + " - " + pp.nom;
        if (!D.eco.some(e => (e.pp_id || "").split(" - ")[0].trim() === pp.id)) {
            D.eco.push({pp_id: ppRef, mesures_existantes: "", mesures_complementaires: "", categorie: "",
                dep_resid: pp.dependance || "", pen_resid: pp.penetration || "", mat_resid: pp.maturite || "", conf_resid: pp.confiance || ""});
        }
    });
    const tc = [{key:"exist",label:t("ebios.col.eco_existantes"),on:true},{key:"compl",label:t("ebios.col.eco_complementaires"),on:true},{key:"dep",label:t("ebios.col.eco_dep"),on:true},{key:"pen",label:t("ebios.col.eco_pen"),on:true},{key:"mat",label:t("ebios.col.eco_mat"),on:true},{key:"conf",label:t("ebios.col.eco_conf"),on:true},{key:"mr",label:t("ebios.col.eco_menace"),on:true},{key:"er",label:t("ebios.col.eco_exposition"),on:true}];
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
            <td${hd("exist")}>${refSelect("eco",i,"mesures_existantes",e.mesures_existantes||"",measuresOptions())}</td>
            <td${hd("compl")}>${refSelect("eco",i,"mesures_complementaires",e.mesures_complementaires||"",measuresOptions())}<button class="btn-add btn-add-sm" data-click="addEcoMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_measure")}</button></td>
            <td${hd("dep")}>${sel("eco",i,"dep_resid",dr,_range(1,pp?pp.dependance:4))}</td>
            <td${hd("pen")}>${sel("eco",i,"pen_resid",pr,_range(1,pp?pp.penetration:4))}</td>
            <td${hd("mat")}>${sel("eco",i,"mat_resid",mr,_range(pp?pp.maturite:1,4))}</td>
            <td${hd("conf")}>${sel("eco",i,"conf_resid",cr,_range(pp?pp.confiance:1,4))}</td>
            <td${hd("mr")} class="computed">${menace !== null ? menace.toFixed(2) : ""}</td>
            <td${hd("er")} class="computed">${badge(expo, expoColor(expo))}</td>
            </tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-eco").innerHTML = h;
    _setupTable("eco-table", tc.filter(c=>!c.on).map(c=>c.key));
    renderEcoMap();
}

function addEcoMeasure(ecoIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_eco_measure"));
    if (!desc) return;
    const id = nextId("measures");
    const ppId = D.eco[ecoIdx] ? (D.eco[ecoIdx].pp_id || "").split(" - ")[0].trim() : "";
    const ppNom = D.eco[ecoIdx] ? (D.eco[ecoIdx].pp_id || "").split(" - ").slice(1).join(" - ").trim() : "";
    // Créer la mesure dans 5a
    D.measures.push({
        id: id, mesure: desc, origine: "Écosystème", type: "Prévention",
        sop: "", phase: "", effet: t("ebios.m.mesure_eco_pour", {pp: ppNom || ppId}),
        ref_socle: "", responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    // Ajouter la référence dans le champ mesures complémentaires de l'éco
    const current = D.eco[ecoIdx].mesures_complementaires || "";
    const newRef = id + " - " + desc;
    D.eco[ecoIdx].mesures_complementaires = current ? current + ", " + newRef : newRef;
    renderEco();
    renderMeasures();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", {id: id}));
}

function renderSOP() {
    const tc = [{key:"ss",label:t("ebios.col.sop_ss"),on:true},{key:"action",label:t("ebios.col.sop_action"),on:true},{key:"bs",label:t("ebios.col.sop_bs"),on:true},{key:"ctrl",label:t("ebios.col.sop_controle"),on:true},{key:"ref",label:t("ebios.col.sop_ref"),on:false},{key:"mp",label:t("ebios.col.sop_mesure_proposee"),on:true}];
    document.getElementById("toggles-sop").innerHTML = colsButton("sop-table");

    // Calculer les rowspans pour SOP et SS — grouper par SOP ID identique
    // Une ligne sans SOP ID ou avec le même SOP ID que la précédente = même groupe
    const spans = [];
    let si = 0;
    while (si < D.sop_detail.length) {
        const sopId = D.sop_detail[si].sop || "";
        let count = 1;
        while (si + count < D.sop_detail.length) {
            const nextSop = D.sop_detail[si + count].sop || "";
            // Même groupe si : pas de SOP ID, ou même SOP ID que le premier
            if (!nextSop || nextSop === sopId) { count++; }
            else break;
        }
        for (let j = 0; j < count; j++) spans.push(j === 0 ? count : 0);
        si += count;
    }

    let h = `<table id="sop-table" class="table-fixed"><thead><tr><th class="w-60">${t("ebios.col.sop_sop")}</th><th${hd("ss")} class="minw-140">${t("ebios.col.sop_ss")}</th><th>${t("ebios.col.sop_phase")}</th><th${hd("action")}>${t("ebios.col.sop_action")}</th><th${hd("bs")}>${t("ebios.col.sop_bs")}</th><th${hd("ctrl")}>${t("ebios.col.sop_controle")}</th><th${hd("ref")}>${t("ebios.col.sop_ref")}</th><th class="w-80">${t("ebios.col.sop_efficacite")}</th><th${hd("mp")}>${t("ebios.col.sop_mesure_proposee")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    // Calculer le numéro de phase dans chaque groupe
    let phaseNums = [];
    let pn = 0;
    for (let i = 0; i < D.sop_detail.length; i++) {
        if (spans[i] > 0) pn = 0;
        pn++;
        phaseNums.push(pn);
    }

    D.sop_detail.forEach((s, i) => {
        const effColor = {"Absent":"#e74c3c","Partiel":"#e67e22","Efficace":"#27ae60"}[s.efficacite] || "";
        h += '<tr>';
        if (spans[i] > 0) {
            h += `<td rowspan="${spans[i]}" style="vertical-align:top;font-weight:600;background:#eef3f7">${esc(s.sop)}<br><button class="btn-phase" data-click="addSOPPhase" data-args='${_da(i)}'>${t("ebios.btn.add_phase")}</button></td>`;
            h += `<td${hd("ss")} rowspan="${spans[i]}" style="vertical-align:top;background:#eef3f7">${refSelect("sop_detail",i,"ss",s.ss,ssOptions())}</td>`;
        }
        // Phase : numéro auto + nom éditable
        const phaseName = (s.phase||"").replace(/^\d+\.\s*/, "");
        h += `<td><span style="color:var(--text-muted);font-weight:600">${phaseNums[i]}.</span> ${inp("sop_detail",i,"phase",phaseName)}</td>
            <td${hd("action")}>${ta("sop_detail",i,"action",s.action)}</td>
            <td${hd("bs")}>${refSelect("sop_detail",i,"bs",s.bs,bsOptions())}</td>
            <td${hd("ctrl")}>${ta("sop_detail",i,"controle",s.controle)}</td>
            <td${hd("ref")}>${refSelect("sop_detail",i,"ref",s.ref,socleOptions())}</td>
            <td class="ta-c"><span class="eff-badge" data-click="_effBadgeClick" data-pass-el>${s.efficacite ? badge(s.efficacite, effColor) : `<span class="text-muted fs-xs cursor-pointer">${t("ebios.col.sop_choose")}</span>`}</span><span class="hidden">${sel("sop_detail",i,"efficacite",s.efficacite,[t("ebios.eff.absent"),t("ebios.eff.partiel"),t("ebios.eff.efficace")])}</span></td>
            <td${hd("mp")}>${refSelect("sop_detail",i,"mesure_proposee",s.mesure_proposee,measuresOptions())}<button class="btn-add btn-add-sm" data-click="addSOPMeasure" data-args='${_da(i)}'>${t("ebios.btn.new_measure")}</button></td>`;
        h += `<td><div class="phase-actions">`;
        h += `<button class="btn-move" data-click="moveSOPPhase" data-args='${_da(i,-1)}' title="Monter">&#9650;</button>`;
        h += `<button class="btn-move" data-click="moveSOPPhase" data-args='${_da(i,1)}' title="Descendre">&#9660;</button>`;
        h += `<button class="btn-del" data-click="delSOPPhase" data-args='${_da(i)}'>X</button>`;
        h += `</div></td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-sop").innerHTML = h;
    _setupTable("sop-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function addSOP() {
    _saveState();
    // Trouver le prochain numéro de SOP
    let maxNum = 0;
    D.sop_detail.forEach(s => {
        const m = (s.sop||"").match(/(\d+)/);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
    });
    const sopId = "SOP-" + String(maxNum + 1).padStart(3, "0");
    D.sop_detail.push({
        sop: sopId, ss: "", phase: t("ebios.sop.initial_phase"), action: "",
        bs: "", controle: "", ref: "", efficacite: "", commentaire: "",
        mesure_proposee: "", type_mesure: "",
    });
    // Ajouter aussi dans sop_summary
    D.sop_summary.push({ sop: sopId, ss: "" });
    renderSOP();
    renderIndicators();
    showStatus(t("ebios.status.sop_added", {id: sopId}));
}

function addSOPPhase(firstIdx) {
    _saveState();
    // Ajouter une phase après la dernière phase du même SOP
    const sopId = D.sop_detail[firstIdx].sop;
    let lastIdx = firstIdx;
    for (let j = firstIdx + 1; j < D.sop_detail.length; j++) {
        if (D.sop_detail[j].sop) break;
        lastIdx = j;
    }
    // Compter les phases existantes pour numéroter
    const phaseCount = lastIdx - firstIdx + 1;
    D.sop_detail.splice(lastIdx + 1, 0, {
        sop: "", ss: "", phase: (phaseCount + 1) + ". " + t("ebios.sop.new_phase"), action: "",
        bs: "", controle: "", ref: "", efficacite: "", commentaire: "",
        mesure_proposee: "", type_mesure: "",
    });
    renderSOP();
    showStatus(t("ebios.status.phase_added", {id: sopId}));
}

function _findSOPGroup(idx) {
    // Trouver le SOP ID du groupe auquel appartient l'index
    const s = D.sop_detail[idx];
    if (s.sop) return s.sop;
    for (let j = idx - 1; j >= 0; j--) {
        if (D.sop_detail[j].sop) return D.sop_detail[j].sop;
    }
    return "";
}

function _findSOPStart(sopId) {
    for (let j = 0; j < D.sop_detail.length; j++) {
        if (D.sop_detail[j].sop === sopId) return j;
    }
    return -1;
}

function moveSOPPhase(idx, dir) {
    _saveState();
    const target = idx + dir;
    if (target < 0 || target >= D.sop_detail.length) return;
    const mySop = _findSOPGroup(idx);
    const targetSop = _findSOPGroup(target);
    if (mySop !== targetSop) return;
    // Ne pas déplacer la première ligne du groupe (elle porte le SOP ID + SS)
    const groupStart = _findSOPStart(mySop);
    if (idx === groupStart && dir === -1) return;
    if (target === groupStart && dir === -1) return;
    if (idx === groupStart) return; // la première ligne ne bouge pas
    [D.sop_detail[idx], D.sop_detail[target]] = [D.sop_detail[target], D.sop_detail[idx]];
    renderSOP();
    showStatus(t("ebios.status.phase_moved"));
}

function delSOPPhase(idx) {
    _saveState();
    const mySop = _findSOPGroup(idx);
    const groupStart = _findSOPStart(mySop);
    if (idx === groupStart) {
        // Première ligne = supprimer tout le SOP
        if (!confirm(t("ebios.confirm.delete_sop", {sop: mySop}))) return;
        let end = groupStart + 1;
        while (end < D.sop_detail.length) {
            const nextSop = D.sop_detail[end].sop;
            if (nextSop && nextSop !== mySop) break;
            end++;
        }
        D.sop_detail.splice(groupStart, end - groupStart);
        D.sop_summary = D.sop_summary.filter(s => s.sop !== mySop);
    } else {
        D.sop_detail.splice(idx, 1);
    }
    renderSOP();
    renderIndicators();
    showStatus(t("ebios.status.deleted"));
}

function cycleEfficacite(idx) {
    _saveState();
    const vals = ["", "Absent", "Partiel", "Efficace"];
    const current = D.sop_detail[idx].efficacite || "";
    const next = vals[(vals.indexOf(current) + 1) % vals.length];
    D.sop_detail[idx].efficacite = next;
    renderSOP();
    showStatus(t("ebios.status.efficacite", {val: next || "—"}));
}

function addSOPMeasure(sopIdx) {
    _saveState();
    const desc = prompt(t("ebios.prompt.new_sop_measure"));
    if (!desc) return;
    const id = nextId("measures");
    const sopId = D.sop_detail[sopIdx] ? D.sop_detail[sopIdx].sop || "" : "";
    const phase = D.sop_detail[sopIdx] ? D.sop_detail[sopIdx].phase || "" : "";
    // Créer la mesure dans 5a
    D.measures.push({
        id: id, mesure: desc, origine: "SOP", type: "Prévention",
        sop: sopId, phase: phase, effet: "",
        ref_socle: "", responsable: "", echeance: "", cout: "", statut: "À étudier",
    });
    // Ajouter la référence dans le champ mesure_proposee du SOP
    const current = D.sop_detail[sopIdx].mesure_proposee || "";
    const newRef = id + " - " + desc;
    D.sop_detail[sopIdx].mesure_proposee = current ? current + ", " + newRef : newRef;
    renderSOP();
    renderMeasures();
    renderIndicators();
    showStatus(t("ebios.status.measure_created", {id: id}));
}

function _computeSOPVop() {
    // Compter les phases par SOP et calculer V opérationnelle
    const sopPhases = {};
    D.sop_detail.forEach(s => {
        const sopId = s.sop;
        if (!sopId) return;
        if (!sopPhases[sopId]) sopPhases[sopId] = { absent: 0, partiel: 0, efficace: 0, total: 0 };
        sopPhases[sopId].total++;
        if (s.efficacite === "Absent") sopPhases[sopId].absent++;
        else if (s.efficacite === "Partiel") sopPhases[sopId].partiel++;
        else if (s.efficacite === "Efficace") sopPhases[sopId].efficace++;
    });
    const sopVop = {};
    const sopTaux = {};
    for (const [sopId, ph] of Object.entries(sopPhases)) {
        if (ph.total === 0) continue;
        const taux = Math.max(0, (ph.absent * 2 + ph.partiel - ph.efficace * 2)) / (ph.total * 2);
        sopTaux[sopId] = taux;
        sopVop[sopId] = taux >= 0.7 ? 4 : taux >= 0.4 ? 3 : taux >= 0.2 ? 2 : 1;
    }
    return { sopVop, sopTaux, sopPhases };
}

function _sopToSS() {
    // Dériver le lien SOP→SS depuis sop_detail (source de vérité)
    // Un SOP peut être associé à plusieurs SS (multi-sélection)
    const map = {};
    D.sop_detail.forEach(s => {
        if (!s.sop || !s.ss) return;
        if (!map[s.sop]) map[s.sop] = new Set();
        // Extraire les SS IDs (format "SS-01 - Nom, SS-02 - Nom")
        const ids = s.ss.split(",").map(x => x.trim().substring(0, 5)).filter(x => x.startsWith("SS-"));
        ids.forEach(id => map[s.sop].add(id));
    });
    // Synchroniser sop_summary
    const existingSops = new Set(D.sop_summary.map(s => s.sop));
    for (const [sopId, ssSet] of Object.entries(map)) {
        const ssStr = [...ssSet].join(", ");
        const entry = D.sop_summary.find(s => s.sop === sopId);
        if (entry) entry.ss = ssStr;
        else if (!existingSops.has(sopId)) D.sop_summary.push({ sop: sopId, ss: ssStr });
    }
    return map;
}

function renderSOPSynth() {
    const { sopVop, sopTaux, sopPhases } = _computeSOPVop();
    const sopToSS = _sopToSS();
    // V initiale par SS = MAX V opérationnelle des SOP associés
    const ssData = {};
    for (const [sopId, ssSet] of Object.entries(sopToSS)) {
        for (const ssId of ssSet) {
            if (!ssData[ssId]) ssData[ssId] = { vInit: 0, sops: [] };
            const v = sopVop[sopId] || 0;
            if (v > ssData[ssId].vInit) ssData[ssId].vInit = v;
            ssData[ssId].sops.push({
                sop: sopId,
                taux: sopTaux[sopId],
                vop: sopVop[sopId],
                phases: sopPhases[sopId] || { absent:0, partiel:0, efficace:0, total:0 },
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
                h += `<td rowspan="${rspan}" style="font-weight:600;vertical-align:top">${esc(s.id)}</td>`;
                h += `<td rowspan="${rspan}" style="vertical-align:top;font-size:0.9em">${esc(s.scenario)}</td>`;
                h += `<td rowspan="${rspan}" class="ta-c-va-t">${gNum ? badge(gLbl, gravColor(gNum)) : ""}</td>`;
            }
            const ph = sop.phases;
            const tauxPct = sop.taux != null ? (sop.taux * 100).toFixed(0) + "%" : "";
            const tauxColor = sop.taux >= 0.7 ? "var(--red)" : sop.taux >= 0.4 ? "var(--orange)" : sop.taux >= 0.2 ? "var(--yellow)" : "var(--green)";
            h += `<td class="fw-600">${esc(sop.sop)}</td>`;
            h += `<td><div style="display:flex;flex-direction:column;gap:3px;align-items:center">${ph.absent ? badge(ph.absent + " " + t("ebios.eff.absent"), "#e74c3c") : ""}${ph.partiel ? badge(ph.partiel + " " + t("ebios.eff.partiel"), "#e67e22") : ""}${ph.efficace ? badge(ph.efficace + " " + t("ebios.eff.efficace"), "#27ae60") : ""}</div></td>`;
            h += `<td class="ta-c"><span style="color:${tauxColor};font-weight:600">${tauxPct}</span></td>`;
            if (j === 0) {
                h += `<td rowspan="${rspan}" style="text-align:center;vertical-align:top;font-weight:600">${vInit || ""}</td>`;
                h += `<td rowspan="${rspan}" class="ta-c-va-t">${risk ? badge(risk, rc) : '<span class="text-muted">—</span>'}</td>`;
            }
            h += '</tr>';
        });
        if (sd.sops.length === 0) {
            h += `<tr><td class="fw-600">${esc(s.id)}</td><td style="font-size:0.9em">${esc(s.scenario)}</td>`;
            h += `<td class="ta-c">${gNum ? badge(gLbl, gravColor(gNum)) : ""}</td>`;
            h += `<td colspan="3" style="text-align:center;color:var(--text-muted);font-style:italic">${t("ebios.col.sopsynth_no_sop")}</td>`;
            h += `<td class="ta-c">—</td><td class="ta-c"><span class="text-muted">—</span></td></tr>`;
        }
    });
    h += '</tbody></table>';
    document.getElementById("table-sop-synth").innerHTML = h;
}

function renderMeasures() {
    const tc = [{key:"details",label:t("ebios.col.m_details"),on:true},{key:"orig",label:t("ebios.col.m_origine"),on:true},{key:"type",label:t("ebios.col.m_type"),on:true},{key:"sop",label:t("ebios.col.m_sop"),on:false},{key:"phase",label:t("ebios.col.m_phase"),on:false},{key:"effet",label:t("ebios.col.m_effet"),on:false},{key:"ref",label:t("ebios.col.m_ref_socle"),on:true},{key:"resp",label:t("ebios.col.m_responsable"),on:true},{key:"ech",label:t("ebios.col.m_echeance"),on:true},{key:"cout",label:t("ebios.col.m_cout"),on:false},{key:"statut",label:t("ebios.col.m_statut"),on:true}];
    document.getElementById("toggles-measures").innerHTML = colsButton("measures-table");
    let h = `<table id="measures-table"><thead><tr><th>${t("ebios.col.m_id")}</th><th class="minw-150">${t("ebios.col.m_mesure")}</th><th${hd("details")} class="minw-200">${t("ebios.col.m_details")}</th><th${hd("orig")}>${t("ebios.col.m_origine")}</th><th${hd("type")}>${t("ebios.col.m_type")}</th><th${hd("sop")}>${t("ebios.col.m_sop")}</th><th${hd("phase")}>${t("ebios.col.m_phase")}</th><th${hd("effet")}>${t("ebios.col.m_effet")}</th><th${hd("ref")}>${t("ebios.col.m_ref_socle")}</th><th${hd("resp")}>${t("ebios.col.m_responsable")}</th><th${hd("ech")}>${t("ebios.col.m_echeance")}</th><th${hd("cout")}>${t("ebios.col.m_cout")}</th><th${hd("statut")}>${t("ebios.col.m_statut")}</th><th class="col-actions"></th></tr></thead><tbody>`;
    D.measures.forEach((m, i) => {
        h += `<tr><td><strong>${esc(m.id)}</strong></td><td>${inp("measures",i,"mesure",m.mesure)}</td>
            <td${hd("details")}>${ta("measures",i,"details",m.details||"")}</td>
            <td${hd("orig")}>${sel("measures",i,"origine",m.origine||"",["Socle","Écosystème","SOP","Complémentaire"])}</td>
            <td${hd("type")}>${sel("measures",i,"type",m.type,["Prévention","Détection","Réaction"])}</td>
            <td${hd("sop")}>${refSelect("measures",i,"sop",m.sop,sopOptions())}</td>
            <td${hd("phase")}>${inp("measures",i,"phase",m.phase)}</td>
            <td${hd("effet")}>${ta("measures",i,"effet",m.effet)}</td>
            <td${hd("ref")}>${refSelect("measures",i,"ref_socle",m.ref_socle,socleOptions())}</td>
            <td${hd("resp")}>${inp("measures",i,"responsable",m.responsable)}</td>
            <td${hd("ech")}>${inp("measures",i,"echeance",m.echeance)}</td>
            <td${hd("cout")}>${inp("measures",i,"cout",m.cout)}</td>
            <td${hd("statut")} class="ta-c"><span class="eff-badge" data-click="_effBadgeClick" data-pass-el>${m.statut ? badge(m.statut, ({"Terminé":"#27ae60","En cours":"#e67e22","À étudier":"#e74c3c"})[m.statut]||"#999") : `<span class="text-muted fs-xs cursor-pointer">${t("ebios.col.sop_choose")}</span>`}</span><span class="hidden">${sel("measures",i,"statut",m.statut,["Terminé","En cours","À étudier"])}</span></td>
            <td>${delBtn("measures",i)}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-measures").innerHTML = h;
    _setupTable("measures-table", tc.filter(c=>!c.on).map(c=>c.key));
}

// Compute initial likelihood per SS (MAX V opérationnelle of associated SOPs)
function _ssVInit() {
    const { sopVop } = _computeSOPVop();
    const sopToSS = _sopToSS();
    const vInitMap = {};
    for (const [sopId, ssSet] of Object.entries(sopToSS)) {
        for (const ssId of ssSet) {
            const v = sopVop[sopId] || 0;
            if (!vInitMap[ssId] || v > vInitMap[ssId]) vInitMap[ssId] = v;
        }
    }
    return vInitMap;
}

function renderResiduals() {
    const vInitMap = _ssVInit();
    const tc = [{key:"scenario",label:t("ebios.col.r_scenario"),on:true},{key:"grav",label:t("ebios.col.r_gravite"),on:true},{key:"mesures",label:t("ebios.col.r_mesures"),on:true},{key:"vi",label:t("ebios.col.r_v_init"),on:true},{key:"vr",label:t("ebios.col.r_v_resid"),on:true},{key:"rr",label:t("ebios.col.r_risque"),on:true},{key:"dec",label:t("ebios.col.r_decision"),on:true}];
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
        if (vrClamped !== vr && vr) { if (!D.residuals[i]) D.residuals[i] = {}; D.residuals[i].v_resid = vrClamped; }
        const risk = riskLevel(gNum, vrClamped);
        const rColor = riskColor(risk);
        const riInit = riskLevel(gNum, vInit);
        const riInitColor = riskColor(riInit);
        // v_resid options: 1 to vInit (cannot exceed initial)
        const vrOptions = [];
        for (let v = 1; v <= (vInit || 4); v++) vrOptions.push(v);
        h += `<tr><td>${esc(s.id)}</td><td${hd("scenario")}>${esc(s.scenario)}</td>
            <td${hd("grav")} class="computed">${lbl ? badge(lbl, gravColor(gNum)) : ""}</td>
            <td${hd("mesures")}>${refSelect("residuals",i,"mesures",res.mesures||"",measuresOptions())}</td>
            <td${hd("vi")} class="computed">${vInit ? badge("V" + vInit + (riInit ? " — " + riInit : ""), riInitColor || "#999") : '<span class="text-muted">—</span>'}</td>
            <td${hd("vr")}>${sel("residuals",i,"v_resid",vrClamped,vrOptions)}</td>
            <td${hd("rr")} class="computed">${risk ? badge(risk, rColor) : ""}</td>
            <td${hd("dec")}>${sel("residuals",i,"decision",res.decision||"",["Accepter","Réduire","Transférer","Éviter"])}</td></tr>`;
    });
    h += '</tbody></table>';
    document.getElementById("table-residuals").innerHTML = h;
    _setupTable("resid-table", tc.filter(c=>!c.on).map(c=>c.key));
}

function renderSynthesis() {
    // Distribution des risques (basée sur les SS avec SOP)
    let eleve = 0, moyen = 0, faible = 0, nonEval = 0;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const res = D.residuals[i];
        // Chercher le risque résiduel ou initial
        let risk = "";
        if (res && res.v_resid) {
            risk = riskLevel(gNum, res.v_resid);
        }
        if (risk === t("ebios.risk.eleve")) eleve++;
        else if (risk === t("ebios.risk.moyen")) moyen++;
        else if (risk === t("ebios.risk.faible")) faible++;
        else nonEval++;
    });
    let distH = '<div class="risk-dist">';
    distH += `<div class="risk-bar" style="background:var(--red)"><div class="count">${eleve}</div><div class="label">${t("ebios.misc.eleve_label")}</div></div>`;
    distH += `<div class="risk-bar" style="background:var(--orange)"><div class="count">${moyen}</div><div class="label">${t("ebios.misc.moyen_label")}</div></div>`;
    distH += `<div class="risk-bar" style="background:var(--green)"><div class="count">${faible}</div><div class="label">${t("ebios.misc.faible_label")}</div></div>`;
    distH += '</div>';
    if (nonEval > 0) distH += `<p style="color:var(--text-muted);font-size:0.85em;margin-top:8px">${t("ebios.misc.ss_not_evaluated", {n: nonEval})}</p>`;
    document.getElementById("synth-risk-dist").innerHTML = distH;

    // Calculer V initiale pour chaque SS depuis les SOP (taux de faiblesse)
    const { sopVop } = _computeSOPVop();
    const sopToSS = _sopToSS();
    // Pour chaque SS, V initiale = MAX V opérationnelle des SOP associés
    const ssVinit = {};
    for (const [sopId, ssSet] of Object.entries(sopToSS)) {
        const v = sopVop[sopId] || 0;
        for (const ssId of ssSet) {
            if (v > (ssVinit[ssId] || 0)) ssVinit[ssId] = v;
        }
    }

    // Construire les positions pour les deux matrices
    const ssPositions = [];
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const res = D.residuals[i] || {};
        const vInit = ssVinit[s.id] || 0;
        const vResid = res.v_resid ? parseInt(res.v_resid) : 0;
        ssPositions.push({ id: s.id, gNum, vInit, vResid });
    });

    function buildMatrix(target, getV, label) {
        // Grouper les SS par (g, v)
        const cells = {};
        ssPositions.forEach(sp => {
            const v = getV(sp);
            if (!sp.gNum || !v || v < 1 || v > 4) return;
            const key = sp.gNum + "-" + v;
            if (!cells[key]) cells[key] = [];
            cells[key].push(sp.id);
        });

        let mH = `<table class="risk-matrix"><thead><tr><th>G \\ V</th>`;
        for (let v = 1; v <= 4; v++) mH += `<th>V${v}</th>`;
        mH += `</tr></thead><tbody>`;
        const gLevels = D.risk_matrix.map(r => parseInt(r.g)).filter(g => !isNaN(g)).sort((a,b) => b-a);
        for (const g of gLevels) {
            const lbl = gravLabel(g);
            mH += `<tr><th style="font-size:0.75em">${lbl || "G"+g}</th>`;
            for (let v = 1; v <= 4; v++) {
                const level = riskLevel(g, v);
                const c = riskColor(level);
                const ids = cells[g + "-" + v] || [];
                mH += `<td style="background:${c}; font-size:0.75em; vertical-align:middle">${ids.join(", ")}</td>`;
            }
            mH += '</tr>';
        }
        mH += '</tbody></table>';
        document.getElementById(target).innerHTML = mH;
    }

    buildMatrix("synth-matrix-initial", sp => sp.vInit);
    buildMatrix("synth-matrix-residual", sp => sp.vResid);

    // Évolution des risques
    let evH = `<table><thead><tr><th>${t("ebios.synth.col_ss")}</th><th>${t("ebios.synth.col_scenario")}</th><th>${t("ebios.synth.col_risque_initial")}</th><th>${t("ebios.synth.col_risque_residuel")}</th><th>${t("ebios.synth.col_evolution")}</th><th>${t("ebios.synth.col_decision")}</th></tr></thead><tbody>`;
    D.ss.forEach((s, i) => {
        const gNum = computeSSGravity(s.er);
        const vInit = ssVinit[s.id] || 0;
        const res = D.residuals[i] || {};
        const vResid = res.v_resid ? parseInt(res.v_resid) : 0;
        const riskInit = riskLevel(gNum, vInit);
        const riskResid = riskLevel(gNum, vResid);
        const riColor = riskColor(riskInit);
        const rrColor = riskColor(riskResid);
        // Évolution
        let evol = "";
        var riskOrder = {};
        riskOrder[t("ebios.risk.eleve")] = 3;
        riskOrder[t("ebios.risk.moyen")] = 2;
        riskOrder[t("ebios.risk.faible")] = 1;
        const ri = riskOrder[riskInit] || 0;
        const rr = riskOrder[riskResid] || 0;
        if (ri && rr) {
            if (rr < ri) evol = `<span style="color:var(--green);font-weight:600">&#x2198; ${t("ebios.synth.ameliore")}</span>`;
            else if (rr === ri) evol = `<span class="text-muted">= ${t("ebios.synth.identique")}</span>`;
            else evol = `<span style="color:var(--red);font-weight:600">&#x2197; ${t("ebios.synth.degrade")}</span>`;
        } else evol = '<span class="text-muted">—</span>';
        evH += `<tr><td>${esc(s.id)}</td><td class="fs-sm">${esc(s.scenario)}</td>`;
        evH += `<td class="ta-c">${riskInit ? badge(riskInit, riColor) : "—"}</td>`;
        evH += `<td class="ta-c">${riskResid ? badge(riskResid, rrColor) : "—"}</td>`;
        evH += `<td class="ta-c">${evol}</td>`;
        evH += `<td>${esc(res.decision || "")}</td></tr>`;
    });
    evH += '</tbody></table>';
    document.getElementById("synth-evolution").innerHTML = evH;

    // Conformité du socle
    const isAnssi = D.socle_type !== "iso";
    const socle = isAnssi ? D.socle_anssi : D.socle_iso;
    if (socle.length > 0) {
        let totalConf = 0, count = 0, applique = 0, partiel = 0, nonApp = 0, nonEvalue = 0;
        socle.forEach(s => {
            const c = s.conformite;
            if (c !== "" && c !== null && !isNaN(c)) {
                totalConf += parseFloat(c);
                count++;
                if (c >= 80) applique++;
                else if (c > 0) partiel++;
                else nonApp++;
            } else nonEvalue++;
        });
        const avg = count > 0 ? Math.round(totalConf / count) : 0;
        let scH = '<div class="risk-dist">';
        scH += `<div class="risk-bar" style="background:var(--red)"><div class="count">${nonApp}</div><div class="label">${t("ebios.misc.non_applique_label")}</div></div>`;
        scH += `<div class="risk-bar" style="background:var(--yellow)"><div class="count">${partiel}</div><div class="label">${t("ebios.misc.partiel_label")}</div></div>`;
        scH += `<div class="risk-bar" style="background:var(--green)"><div class="count">${applique}</div><div class="label">${t("ebios.misc.applique_label")}</div></div>`;
        scH += '</div>';
        scH += `<p style="font-size:0.85em;margin-top:8px;color:var(--text-muted)">${t("ebios.socle.conformite_moyenne", {avg: avg, count: count})}</p>`;
        document.getElementById("synth-socle").innerHTML = scH;
    } else {
        document.getElementById("synth-socle").innerHTML = `<p class="text-muted">${t("ebios.socle.non_evalue")}</p>`;
    }

    // Synthèse des mesures
    const showAllMeasures = document.getElementById("synth-measures-all") && document.getElementById("synth-measures-all").checked;
    const filteredMeasures = showAllMeasures ? D.measures.filter(m => m.statut !== "À étudier") : D.measures.filter(m => m.statut && m.statut !== "Terminé" && m.statut !== "À étudier");
    const origColor = {"Socle":"var(--green)","Écosystème":"var(--yellow)","SOP":"var(--orange)","Complémentaire":"var(--light-blue)"};
    const statutColor = {"Terminé":"var(--green)","En cours":"var(--orange)","À étudier":"var(--red)"};
    const hasTerminated = D.measures.some(m => m.statut === "Terminé");
    let msH = hasTerminated ? `<label style="font-size:0.85em;cursor:pointer;margin-bottom:8px;display:inline-flex;align-items:center;gap:4px"><input type="checkbox" id="synth-measures-all" ${showAllMeasures?"checked":""} data-change="renderSynthesis"> ${t("ebios.misc.show_terminated")}</label>` : "";
    if (filteredMeasures.length > 0) {
        msH += `<table class="fs-sm"><thead><tr><th>${t("ebios.synth.col_id")}</th><th>${t("ebios.synth.col_mesure")}</th><th>${t("ebios.synth.col_origine")}</th><th>${t("ebios.synth.col_responsable")}</th><th>${t("ebios.synth.col_echeance")}</th><th>${t("ebios.synth.col_statut")}</th></tr></thead><tbody>`;
        filteredMeasures.forEach(m => {
            msH += `<tr><td><strong>${esc(m.id)}</strong></td><td>${esc(m.mesure)}</td>`;
            msH += `<td>${m.origine ? badge(m.origine, origColor[m.origine]||"#999") : ""}</td>`;
            msH += `<td>${esc(m.responsable||"")}</td>`;
            msH += `<td>${esc(m.echeance||"")}</td>`;
            msH += `<td>${m.statut ? badge(m.statut, statutColor[m.statut]||"#999") : ""}</td></tr>`;
        });
        msH += '</tbody></table>';
        const toDoCount = D.measures.filter(m => m.statut && m.statut !== "Terminé" && m.statut !== "À étudier").length;
        msH += `<p style="font-size:0.8em;color:var(--text-muted);margin-top:6px">${t("ebios.misc.measures_todo_count", {todo: toDoCount, total: D.measures.length})}</p>`;
    } else {
        msH += `<p class="text-muted">${t("ebios.misc.no_measures")}</p>`;
    }
    document.getElementById("synth-measures").innerHTML = msH;
}

function renderAll() {
    try {
        // Rebuild NAV labels on lang change
        NAV = _buildNAV();
        // Refresh toolbar right (lang toggle + GitHub)
        var _tr = document.getElementById("toolbar-right");
        if (_tr) _tr.innerHTML = _getSettingsButtonHTML() + _getGithubLinkHTML("https://github.com/CollectiveMakers/ebios_rm_webapp");
        // Re-select current atelier to refresh subtab labels
        if (typeof currentAtelier !== "undefined") selectAtelier(currentAtelier);
        renderContext();
        renderIndicators();
        renderSynthesis();
        renderVM();
        renderBS();
        renderPP();
        renderSocle();
        renderSocleRefs();
        renderSROV();
        renderER();
        renderSS();
        renderEco();
        renderSOP();
        renderSOPSynth();
        renderMeasures();
        renderResiduals();
    } catch(e) {
        console.error("Erreur renderAll:", e);
        showStatus(t("ebios.status.error", {msg: e.message}));
    }
}

// ═══════════════════════════════════════════════════════════════════════
// IMPORT / EXPORT JSON
// ═══════════════════════════════════════════════════════════════════════
function toggleHelp(tab) {
    document.querySelector(".sidebar").classList.remove("open");
    const overlay = document.getElementById("help-overlay");
    if (tab && !overlay.classList.contains("open")) {
        overlay.classList.add("open");
        switchHelpTab(tab);
    } else if (tab && overlay.classList.contains("open")) {
        switchHelpTab(tab);
    } else {
        overlay.classList.toggle("open");
    }
}
function switchHelpTab(tab) {
    document.querySelectorAll(".help-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".help-content").forEach(c => c.style.display = "none");
    const tabEl = document.getElementById("help-tab-" + tab);
    const contentEl = document.getElementById("help-content-" + tab);
    if (tabEl) tabEl.classList.add("active");
    if (contentEl) contentEl.style.display = "block";
}

// ── Chiffrement AES-GCM via Web Crypto API ──
// ── Validation JSON import ──
function _validateData(obj) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj))
        return "Le fichier doit contenir un objet JSON.";
    // Vérifier les clés attendues (au moins context)
    const requiredKeys = ["context"];
    for (const k of requiredKeys) {
        if (!(k in obj)) return "Cle manquante : " + k;
    }
    // context doit être un objet
    if (typeof obj.context !== "object" || Array.isArray(obj.context))
        return "context doit etre un objet.";
    // Les tableaux doivent être des tableaux
    const arrayKeys = ["gravity_scale","risk_matrix","vm","bs","pp","socle_anssi","socle_iso",
        "sr_list","ov_list","srov","er","ss","eco","sop_detail","sop_summary",
        "measures","residuals"];
    for (const k of arrayKeys) {
        if (k in obj && !Array.isArray(obj[k]))
            return k + " doit etre un tableau.";
    }
    // Limiter la taille des tableaux (protection DoS)
    const maxSizes = {vm:200, bs:500, pp:200, er:500, ss:200, srov:200, sop_detail:1000,
        measures:500, residuals:200, eco:200, socle_anssi:100, socle_iso:200,
        gravity_scale:10, risk_matrix:10, sr_list:100, ov_list:100, sop_summary:100};
    for (const [k, max] of Object.entries(maxSizes)) {
        if (k in obj && Array.isArray(obj[k]) && obj[k].length > max)
            return k + " depasse la taille maximale (" + max + ").";
    }
    // Vérifier que les éléments des tableaux sont des objets (pas de prototype pollution)
    for (const k of arrayKeys) {
        if (k in obj && Array.isArray(obj[k])) {
            for (let i = 0; i < obj[k].length; i++) {
                const item = obj[k][i];
                if (typeof item !== "object" || item === null || Array.isArray(item))
                    return k + "[" + i + "] doit etre un objet.";
                // Bloquer __proto__ et prototype pollution
                if (item.hasOwnProperty("__proto__") || item.hasOwnProperty("constructor") || item.hasOwnProperty("prototype"))
                    return k + "[" + i + "] contient une cle interdite.";
            }
        }
    }
    // Vérifier socle_type
    if ("socle_type" in obj && !["anssi","iso"].includes(obj.socle_type))
        return "socle_type invalide (anssi ou iso).";
    // Vérifier les valeurs numériques dans les champs critiques
    const numFields = ["dependance","penetration","maturite","confiance","d","i","c","t",
        "motivation","ressources","activite","gravite","v_resid","conformite","niveau"];
    for (const k of arrayKeys) {
        if (!(k in obj) || !Array.isArray(obj[k])) continue;
        for (let i = 0; i < obj[k].length; i++) {
            for (const nf of numFields) {
                if (nf in obj[k][i]) {
                    const v = obj[k][i][nf];
                    if (v !== "" && v !== null && typeof v !== "number")
                        return k + "[" + i + "]." + nf + " doit etre un nombre.";
                    if (typeof v === "number" && (v < -1000 || v > 1e12))
                        return k + "[" + i + "]." + nf + " hors limites.";
                }
            }
        }
    }
    // Vérifier les champs texte (longueur max)
    function checkStrLen(o, path, max) {
        for (const [k2, v2] of Object.entries(o)) {
            if (typeof v2 === "string" && v2.length > max)
                return path + "." + k2 + " depasse " + max + " caracteres.";
        }
        return null;
    }
    if (obj.context) {
        const e = checkStrLen(obj.context, "context", 5000);
        if (e) return e;
    }
    return null;
}

// Traitement commun d'un buffer JSON (chiffré ou non)
// File I/O + crypto : voir cisotoolbox.js

// ═══════════════════════════════════════════════════════════════════════
// EXPORT / IMPORT EXCEL
// Menu close : voir cisotoolbox.js

let _excelJSLoaded = false;
function _loadExcelJS() {
    return new Promise((resolve, reject) => {
        if (_excelJSLoaded) { resolve(); return; }
        showStatus(t("ebios.status.loading_exceljs"));
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
        s.integrity = "sha384-Pqp51FUN2/qzfxZxBCtF0stpc9ONI6MYZpVqmo8m20SoaQCzf+arZvACkLkirlPz";
        s.crossOrigin = "anonymous";
        s.onload = () => { _excelJSLoaded = true; showStatus(t("ebios.status.exceljs_loaded")); resolve(); };
        s.onerror = () => reject(new Error(t("ebios.alert.exceljs_load_error")));
        document.head.appendChild(s);
    });
}

async function exportExcel() {
    // Charger le template à la demande si pas encore fait
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

        // Charger le template
        const templateBytes = Uint8Array.from(atob(TEMPLATE_B64), c => c.charCodeAt(0));
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(templateBytes.buffer);

        // Remplir les données dans les cellules de saisie
        _fillExcelData(wb);

        // Télécharger
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        var societe = D.context.societe || _ct().filePrefix || "EBIOS_RM";
        var scope = _ct().getScope ? _ct().getScope(D) : "";
        var name = (societe + (scope ? "-" + scope : "")).replace(/[\/\\:*?"<>|]/g, "_").substring(0, 60);
        a.download = name + ".xlsx";
        a.click();
        URL.revokeObjectURL(a.href);
        showStatus(t("ebios.status.excel_downloaded"));
    } catch(e) {
        console.error("Erreur export Excel:", e);
        alert(t("ebios.alert.excel_export_error", {msg: e.message}));
    }
}

function _fillExcelData(wb) {
    // Contexte (Synthèse)
    const wsSynth = wb.getWorksheet("Synthèse");
    if (wsSynth) {
        const ctxKeys = ["societe","date","analyste","reglementation","socle","commentaires"];
        ctxKeys.forEach((k, i) => {
            const v = D.context[k];
            if (v) wsSynth.getCell(4 + i, 3).value = v;
        });
    }

    // Échelle de gravité
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
            if (p.dependance !== "") wsPP.getCell(r, 5).value = p.dependance;
            if (p.penetration !== "") wsPP.getCell(r, 6).value = p.penetration;
            if (p.maturite !== "") wsPP.getCell(r, 7).value = p.maturite;
            if (p.confiance !== "") wsPP.getCell(r, 8).value = p.confiance;
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
            if (s.conformite !== "") wsSA.getCell(r, 4).value = s.conformite;
            wsSA.getCell(r, 6).value = s.ecart || "";
            wsSA.getCell(r, 8).value = s.mesures_prevues || "";
        });
    }

    // Socle ISO
    const wsSI = wb.getWorksheet("1d-Socle ISO 27001");
    if (wsSI && D.socle_type === "iso") {
        D.socle_iso.forEach((s, i) => {
            const r = 5 + i;
            if (s.conformite !== "") wsSI.getCell(r, 5).value = s.conformite;
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
            // Reconstruire SR et OV complets
            const srNom = (D.sr_list||[]).find(x => x.id === s.sr_id);
            const ovNom = (D.ov_list||[]).find(x => x.id === s.ov_id);
            wsSROV.getCell(r, 2).value = s.sr_id + (srNom ? " - " + srNom.nom : "");
            wsSROV.getCell(r, 3).value = s.ov_id + (ovNom ? " - " + ovNom.nom : "");
            if (s.motivation !== "") wsSROV.getCell(r, 4).value = s.motivation;
            if (s.ressources !== "") wsSROV.getCell(r, 5).value = s.ressources;
            if (s.activite !== "") wsSROV.getCell(r, 6).value = s.activite;
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
            if (e.gravite !== "") wsER.getCell(r, 6).value = e.gravite;
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

    // Écosystème
    const wsEco = wb.getWorksheet("3c-Mesures Écosystème");
    if (wsEco) {
        D.eco.forEach((e, i) => {
            const r = 5 + i;
            wsEco.getCell(r, 1).value = e.pp_id || "";
            wsEco.getCell(r, 5).value = e.mesures_existantes || "";
            wsEco.getCell(r, 6).value = e.mesures_complementaires || "";
            wsEco.getCell(r, 7).value = e.categorie || "";
            if (e.dep_resid !== "") wsEco.getCell(r, 8).value = e.dep_resid;
            if (e.pen_resid !== "") wsEco.getCell(r, 9).value = e.pen_resid;
            if (e.mat_resid !== "") wsEco.getCell(r, 10).value = e.mat_resid;
            if (e.conf_resid !== "") wsEco.getCell(r, 11).value = e.conf_resid;
        });
    }

    // SOP détail
    const wsSOP = wb.getWorksheet("4a-Scénarios Opérationnels");
    if (wsSOP) {
        D.sop_detail.forEach((s, i) => {
            const r = 4 + i;
            if (s.sop) wsSOP.getCell(r, 1).value = s.sop;
            if (s.ss) {
                var ssObj = D.ss.find(function(x) { return x.id === s.ss; });
                wsSOP.getCell(r, 2).value = s.ss + (ssObj ? " - " + ssObj.scenario : "");
            }
            wsSOP.getCell(r, 3).value = s.phase || "";
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

    // SOP synthèse
    const wsSOPS = wb.getWorksheet("4b-Synthèse SOP");
    if (wsSOPS) {
        D.sop_summary.forEach((s, i) => {
            const r = 5 + i;
            wsSOPS.getCell(r, 1).value = s.sop;
            var ss = D.ss.find(function(x) { return x.id === s.ss; });
            wsSOPS.getCell(r, 2).value = s.ss + (ss ? " - " + ss.scenario : "");
        });
    }

    // Mesures
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

    // Résiduels
    const wsR = wb.getWorksheet("5b-Risques Résiduels");
    if (wsR) {
        D.residuals.forEach((r_, i) => {
            const r = 5 + i;
            wsR.getCell(r, 7).value = r_.mesures || "";
            if (r_.v_resid !== "") wsR.getCell(r, 8).value = r_.v_resid;
            wsR.getCell(r, 10).value = r_.decision || "";
        });
    }

    // Masquer le socle non utilisé
    const hideSheet = D.socle_type === "iso" ? "1d-Socle ANSSI" : "1d-Socle ISO 27001";
    const wsHide = wb.getWorksheet(hideSheet);
    if (wsHide) wsHide.state = "hidden";
}

async function importExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    try {
        await _loadExcelJS();
        showStatus(t("ebios.status.reading_excel"));
        const buf = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        _readExcelData(wb);
        _initDataAndRender(() => _autoSave());
    } catch(e) {
        console.error("Erreur import Excel:", e);
        alert(t("ebios.alert.excel_import_error", {msg: e.message}));
    }
}

function _cv(cell) {
    // Retourne la valeur d'une cellule ExcelJS (ignore formules)
    if (!cell || cell.value === null || cell.value === undefined) return "";
    const v = cell.value;
    if (typeof v === "object" && v !== null) {
        if (v.result !== undefined) return v.result; // formule avec résultat caché
        if (v.richText) return v.richText.map(r => r.text).join("");
        return "";
    }
    return v;
}

function _readExcelData(wb) {
    // Contexte
    const wsSynth = wb.getWorksheet("Synthèse");
    if (wsSynth) {
        const keys = ["societe","date","analyste","reglementation","socle","commentaires"];
        D.context = {};
        keys.forEach((k, i) => { D.context[k] = _cv(wsSynth.getCell(4+i, 3)); });
    }

    // Gravité
    const wsGrav = wb.getWorksheet("0-Échelle Gravité");
    D.gravity_scale = [];
    D.risk_matrix = [];
    if (wsGrav) {
        for (let i = 0; i < 5; i++) {
            const n = _cv(wsGrav.getCell(5+i, 1));
            if (!n) break;
            D.gravity_scale.push({niveau: n, label: _cv(wsGrav.getCell(5+i, 2)), description: _cv(wsGrav.getCell(5+i, 3))});
        }
        const ng = D.gravity_scale.length;
        for (let sr = ng+7; sr < ng+20; sr++) {
            const g = _cv(wsGrav.getCell(sr, 4));
            if (typeof g === "number" && g > 0) {
                for (let j = 0; j < ng; j++) {
                    const gv = _cv(wsGrav.getCell(sr+j, 4));
                    if (!gv) break;
                    D.risk_matrix.push({g: gv, levels: [_cv(wsGrav.getCell(sr+j,5)),_cv(wsGrav.getCell(sr+j,6)),_cv(wsGrav.getCell(sr+j,7)),_cv(wsGrav.getCell(sr+j,8))]});
                }
                break;
            }
        }
    }

    // Lecture générique par mapping
    function readSheet(name, headerRow, maxRows, colMap) {
        const ws = wb.getWorksheet(name);
        if (!ws) return [];
        const rows = [];
        for (let i = 0; i < maxRows; i++) {
            const r = headerRow + 1 + i;
            const firstCol = Object.values(colMap)[0];
            if (!_cv(ws.getCell(r, firstCol))) break;
            const row = {};
            for (const [k, c] of Object.entries(colMap)) row[k] = _cv(ws.getCell(r, c));
            rows.push(row);
        }
        return rows;
    }

    D.vm = readSheet("1a-Valeurs Métier", 3, 30, {id:1,nom:2,nature:3,description:4,responsable:5});
    D.bs = readSheet("1b-Biens Supports", 3, 50, {id:1,nom:2,type:3,vm:4,localisation:5,proprietaire:6});
    D.pp = readSheet("1c-Parties Prenantes", 4, 30, {id:1,nom:2,categorie:3,type:4,dependance:5,penetration:6,maturite:7,confiance:8,bs:11});
    D.er = readSheet("3a-Événements Redoutés", 3, 50, {id:1,evenement:2,vm:3,dict:4,impacts:5,gravite:6});
    D.ss = readSheet("3b-Scénarios Stratégiques", 4, 30, {id:1,scenario:2,couple_id:3,couple_desc:4,pp:5,bs:6,er:7});

    // Socle ANSSI
    D.socle_anssi = readSheet("1d-Socle ANSSI", 4, 42, {num:1,thematique:2,mesure:3,conformite:4,ecart:6,mesures_prevues:8});
    D.socle_iso = readSheet("1d-Socle ISO 27001", 4, 93, {ref:1,theme:2,mesure:3,applicable:4,conformite:5,ecart:7,mesures_prevues:9});

    // Déterminer type socle
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
            if (!couple) break;
            const srFull = String(_cv(wsSROV.getCell(r, 2)));
            const ovFull = String(_cv(wsSROV.getCell(r, 3)));
            const srId = srFull.split(" - ")[0].trim();
            const ovId = ovFull.split(" - ")[0].trim();
            if (srId && !srSeen[srId]) { srSeen[srId] = srFull.includes(" - ") ? srFull.split(" - ").slice(1).join(" - ").trim() : srFull; }
            if (ovId && !ovSeen[ovId]) { ovSeen[ovId] = ovFull.includes(" - ") ? ovFull.split(" - ").slice(1).join(" - ").trim() : ovFull; }
            D.srov.push({
                couple, sr_id: srId, ov_id: ovId,
                motivation: _cv(wsSROV.getCell(r,4)), ressources: _cv(wsSROV.getCell(r,5)),
                activite: _cv(wsSROV.getCell(r,6)), justification: _cv(wsSROV.getCell(r,9))
            });
        }
        D.sr_list = Object.entries(srSeen).sort().map(([id,nom]) => ({id,nom}));
        D.ov_list = Object.entries(ovSeen).sort().map(([id,nom]) => ({id,nom}));
    }

    // Écosystème
    D.eco = readSheet("3c-Mesures Écosystème", 4, 30, {pp_id:1,mesures_existantes:5,mesures_complementaires:6,categorie:7,dep_resid:8,pen_resid:9,mat_resid:10,conf_resid:11});

    // SOP détail (ne stoppe pas sur ID vide)
    D.sop_detail = [];
    const wsSOP = wb.getWorksheet("4a-Scénarios Opérationnels");
    if (wsSOP) {
        for (let i = 0; i < 150; i++) {
            const r = 4 + i;
            const sop = _cv(wsSOP.getCell(r, 1));
            const phase = _cv(wsSOP.getCell(r, 3));
            if (!sop && !phase) continue;
            D.sop_detail.push({
                sop, ss: _cv(wsSOP.getCell(r,2)), phase,
                action: _cv(wsSOP.getCell(r,4)), bs: _cv(wsSOP.getCell(r,5)),
                controle: _cv(wsSOP.getCell(r,6)), ref: _cv(wsSOP.getCell(r,7)),
                efficacite: _cv(wsSOP.getCell(r,8)), commentaire: _cv(wsSOP.getCell(r,9)),
                mesure_proposee: _cv(wsSOP.getCell(r,10)), type_mesure: _cv(wsSOP.getCell(r,11))
            });
        }
    }

    D.sop_summary = readSheet("4b-Synthèse SOP", 4, 20, {sop:1,ss:2});
    D.measures = readSheet("5a-Mesures", 4, 50, {id:1,mesure:2,origine:3,type:4,sop:5,phase:6,effet:7,ref_socle:8,responsable:9,echeance:10,cout:11,statut:12});

    // Résiduels
    D.residuals = [];
    const wsR = wb.getWorksheet("5b-Risques Résiduels");
    if (wsR) {
        for (let i = 0; i < 30; i++) {
            const r = 5 + i;
            const mesures = _cv(wsR.getCell(r, 7));
            const vr = _cv(wsR.getCell(r, 8));
            const dec = _cv(wsR.getCell(r, 10));
            if (!mesures && !vr && !dec) continue;
            D.residuals.push({mesures, v_resid: vr, decision: dec});
        }
    }

}

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
// S'assurer que toutes les clés existent (protection chargement JSON)
function ensureKeys() {
    // ── 1. Clés racine manquantes ──
    const defaults = {
        context: {societe:"",date:"",analyste:"",reglementation:"",socle:"",commentaires:""},
        gravity_scale: [], risk_matrix: [],
        vm: [], bs: [], pp: [],
        socle_anssi: [], socle_iso: [],
        sr_list: [], ov_list: [], srov: [], er: [], ss: [], eco: [],
        sop_detail: [], sop_summary: [],
        measures: [], residuals: [], fair: [],
        socle_type: "anssi",
        referentiels_actifs: [],
        socle_complementaires: {},
    };
    for (const [k, v] of Object.entries(defaults)) {
        if (!(k in D)) D[k] = v;
    }

    // ── 2. Context : champs manquants ──
    const ctxDefaults = {societe:"",objet_etude:"",date:"",analyste:"",reglementation:"",socle:"",commentaires:"",date_precedente:"",evolutions:""};
    for (const [k, v] of Object.entries(ctxDefaults)) {
        if (!(k in D.context)) D.context[k] = v;
    }

    // ── 3. Garantir les champs de chaque item dans les tableaux ──
    const fieldDefs = {
        vm: {id:"",nom:"",nature:"",description:"",responsable:""},
        bs: {id:"",nom:"",type:"",vm:"",localisation:"",proprietaire:""},
        pp: {id:"",nom:"",categorie:"",type:"",dependance:"",penetration:"",maturite:"",confiance:"",bs:""},
        er: {id:"",evenement:"",vm:"",dict:"",impacts:"",gravite:""},
        ss: {id:"",scenario:"",couple_id:"",couple_desc:"",pp:"",bs:"",er:""},
        srov: {couple:"",sr_id:"",ov_id:"",motivation:"",ressources:"",activite:"",justification:""},
        eco: {pp_id:"",mesures_existantes:"",mesures_complementaires:"",categorie:"",dep_resid:"",pen_resid:"",mat_resid:"",conf_resid:""},
        measures: {id:"",mesure:"",details:"",origine:"",type:"",sop:"",phase:"",effet:"",ref_socle:"",responsable:"",echeance:"",cout:"",statut:""},
        residuals: {mesures:"",v_resid:"",decision:""},
        sop_detail: {sop:"",ss:"",phase:"",action:"",bs:"",controle:"",ref:"",efficacite:"",commentaire:"",mesure_proposee:"",type_mesure:""},
        sop_summary: {sop:"",ss:""},
        fair: {lef_min:"",lef_likely:"",lef_max:"",lm_min:"",lm_likely:"",lm_max:"",ale_p10:"",ale_p50:"",ale_p90:"",ale_mean:""},
        sr_list: {id:"",nom:""},
        ov_list: {id:"",nom:""},
        socle_anssi: {num:"",thematique:"",mesure:"",conformite:"",ecart:"",mesures_prevues:""},
        socle_iso: {ref:"",theme:"",mesure:"",applicable:"",conformite:"",ecart:"",mesures_prevues:""},
    };
    for (const [section, tpl] of Object.entries(fieldDefs)) {
        if (!Array.isArray(D[section])) continue;
        D[section].forEach(item => {
            for (const [k, v] of Object.entries(tpl)) {
                if (!(k in item)) item[k] = v;
            }
        });
    }

    // ── 4. Gravité : champs d'impact ──
    const impactKeys = ["impact_financier","impact_reputation","impact_reglementaire","impact_donnees_perso","impact_operationnel"];
    D.gravity_scale.forEach(g => {
        if (!("niveau" in g)) g.niveau = "";
        if (!("label" in g)) g.label = "";
        if (!("description" in g)) g.description = "";
        for (const ik of impactKeys) if (!(ik in g)) g[ik] = "";
    });

    // ── 5. Référentiels complémentaires : init et migration ──
    if (!Array.isArray(D.referentiels_actifs)) D.referentiels_actifs = [];
    if (typeof D.socle_complementaires !== "object" || Array.isArray(D.socle_complementaires)) D.socle_complementaires = {};
    for (const fwId of D.referentiels_actifs) {
        const meta = REFERENTIELS_META[fwId];
        if (!meta) continue;
        const existing = D.socle_complementaires[fwId];
        if (!existing) {
            // Initialiser au format objet clé=ref
            D.socle_complementaires[fwId] = Object.fromEntries(
                meta.measures.map(m => [m.ref, {conformite: "", ecart: "", mesures_prevues: ""}])
            );
        } else if (Array.isArray(existing)) {
            // Migration : ancien format tableau → objet clé=ref
            const migrated = {};
            existing.forEach((entry, i) => {
                const refKey = meta.measures[i]?.ref;
                if (refKey) migrated[refKey] = entry;
            });
            D.socle_complementaires[fwId] = migrated;
        } else {
            // Compléter si de nouvelles exigences ont été ajoutées au référentiel
            for (const m of meta.measures) {
                if (!(m.ref in existing)) existing[m.ref] = {conformite: "", ecart: "", mesures_prevues: ""};
            }
        }
    }

    // ── 6. Migration : anciens formats ──
    // 5a. SR/OV : si sr_list/ov_list sont vides mais srov existe, les reconstituer
    if (D.srov.length > 0 && D.sr_list.length === 0) {
        const srSeen = {}, ovSeen = {};
        D.srov.forEach(s => {
            if (s.sr_id && !(s.sr_id in srSeen)) {
                srSeen[s.sr_id] = true;
                // Chercher le nom : sr_nom, ou extraire depuis "SR-01 - Description"
                let nom = s.sr_nom || "";
                if (!nom && s.sr) { const m = s.sr.match(/^SR-\d+\s*-\s*(.+)/); if (m) nom = m[1]; }
                D.sr_list.push({id: s.sr_id, nom: nom});
            }
            if (s.ov_id && !(s.ov_id in ovSeen)) {
                ovSeen[s.ov_id] = true;
                let nom = s.ov_nom || "";
                if (!nom && s.ov) { const m = s.ov.match(/^OV-\d+\s*-\s*(.+)/); if (m) nom = m[1]; }
                D.ov_list.push({id: s.ov_id, nom: nom});
            }
        });
    }
    // Compléter sr_list/ov_list depuis sr_list entries ayant une description mais pas de nom
    (D.sr_list||[]).forEach(s => { if (!s.nom && s.description) s.nom = s.description; });
    (D.ov_list||[]).forEach(o => { if (!o.nom && o.description) o.nom = o.description; });

    // 5b. SR/OV : migration des formats alternatifs du skill
    // Format skill : srov[].sr = "SR-01 - Description" → srov[].sr_id = "SR-01"
    D.srov.forEach(s => {
        if (!s.sr_id && s.sr) {
            const m = s.sr.match(/^(SR-\d+)/);
            s.sr_id = m ? m[1] : s.sr;
        }
        if (!s.ov_id && s.ov) {
            const m = s.ov.match(/^(OV-\d+)/);
            s.ov_id = m ? m[1] : s.ov;
        }
        if (!s.couple && s.sr_id && s.ov_id) s.couple = s.sr_id + "/" + s.ov_id;
    });
    // Format skill : bs[].vm_associees → bs[].vm
    D.bs.forEach(b => {
        if (!b.vm && b.vm_associees) b.vm = b.vm_associees;
    });
    // Format skill : pp[].bs_concernes → pp[].bs
    D.pp.forEach(p => {
        if (!p.bs && p.bs_concernes) p.bs = p.bs_concernes;
    });

    // 5c. Mesures : ancien format sans "origine"
    D.measures.forEach(m => {
        if (!m.origine && m.type && !["Prévention","Détection","Réaction"].includes(m.type)) {
            // Ancien format : type contenait l'origine
            m.origine = m.type;
            m.type = "";
        }
    });

    // 5c. SOP summary : reconstituer depuis sop_detail si vide
    if (D.sop_summary.length === 0 && D.sop_detail.length > 0) {
        const seen = new Set();
        D.sop_detail.forEach(s => {
            if (s.sop && !seen.has(s.sop)) {
                seen.add(s.sop);
                D.sop_summary.push({sop: s.sop, ss: s.ss || ""});
            }
        });
    }

    // 5d. Matrice de risque par défaut si vide
    if (D.risk_matrix.length === 0 && D.gravity_scale.length > 0) {
        const n = D.gravity_scale.length;
        setGravityLevels(n);
    }

    // 5e. PP : deviner la catégorie depuis le type si absente
    D.pp.forEach(p => {
        if (!p.categorie && p.type) {
            const t = p.type.toLowerCase();
            if (t.includes("client")) p.categorie = "Client";
            else if (t.includes("partenaire")) p.categorie = "Partenaire";
            else if (t.includes("prestataire") || t.includes("fournisseur") || t.includes("hébergeur") || t.includes("editeur") || t.includes("éditeur") || t.includes("cloud")) p.categorie = "Prestataire";
        }
    });

    // 5f. Eco : initialiser D/P/M/C résiduels depuis les PP si absents
    D.eco.forEach(e => {
        const ppId = (e.pp_id || "").split(" - ")[0].trim();
        const pp = D.pp.find(p => p.id === ppId);
        // Migration ancien format : menace_resid → supprimer
        if ("menace_resid" in e) delete e.menace_resid;
        // Initialiser les valeurs résiduelles depuis les PP si vides
        if (pp) {
            if (!e.dep_resid && e.dep_resid !== 0) e.dep_resid = pp.dependance || "";
            if (!e.pen_resid && e.pen_resid !== 0) e.pen_resid = pp.penetration || "";
            if (!e.mat_resid && e.mat_resid !== 0) e.mat_resid = pp.maturite || "";
            if (!e.conf_resid && e.conf_resid !== 0) e.conf_resid = pp.confiance || "";
        }
    });

    // 5g. Mesures : normaliser les statuts
    const statutMap = {"Planifié":"En cours", "À lancer":"À étudier", "A lancer":"À étudier", "A étudier":"À étudier"};
    D.measures.forEach(m => {
        if (m.statut && statutMap[m.statut]) m.statut = statutMap[m.statut];
    });

    // 5f. Eco : ancien champ "mesure" → "mesures_existantes"
    D.eco.forEach(e => {
        if (e.mesure && !e.mesures_existantes) {
            e.mesures_existantes = e.mesure;
            delete e.mesure;
        }
    });
}

try {
    // Toolbar right: language toggle + GitHub link
    var tr = document.getElementById("toolbar-right");
    if (tr) tr.innerHTML = _getSettingsButtonHTML() + _getGithubLinkHTML("https://github.com/CollectiveMakers/ebios_rm_webapp");
    // Rebuild NAV with current locale
    NAV = _buildNAV();
    _initDataAndRender();
    _applyStaticTranslations();
    // Masquer "Enregistrer" si le File System Access API n'est pas disponible
    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
        const el = document.getElementById("menu-item-save");
        if (el) el.style.display = "none";
    }
    // Proposer la restauration de session si des données existent dans localStorage
    _checkAutoSaveBanner();
} catch(e) {
    console.error("Erreur au rendu initial:", e);
    document.querySelector(".container").innerHTML = `<section><h2>Erreur</h2><pre>${esc(e.message)}
${esc(e.stack||"")}</pre></section>`;
}

// AI module config (read by ai_common.js)
window.AI_APP_CONFIG = { storagePrefix: "ebios" };