# Risk (EBIOS RM) -- Architecture Document

## 1. Overview

The Risk module implements the **EBIOS Risk Manager** methodology, published by ANSSI (French National Cybersecurity Agency). EBIOS RM is a structured risk analysis approach organized around **5 sequential workshops** (ateliers), each feeding the next:

1. **Atelier 1 -- Cadrage**: Define scope, identify business values, supporting assets, dreaded events, and evaluate the existing security baseline.
2. **Atelier 2 -- Sources de risque**: Identify threat sources (SR) and their objectives (OV), evaluate relevance of each SR/OV pair.
3. **Atelier 3 -- Scenarios strategiques**: Map the ecosystem (stakeholders/PP), build strategic attack paths (SS), and define ecosystem security measures.
4. **Atelier 4 -- Scenarios operationnels**: Detail each strategic scenario as a technical kill chain (SOP), compute operational likelihood, and derive initial risk levels.
5. **Atelier 5 -- Traitement**: Consolidate all security measures, evaluate residual risks, and make treatment decisions.

**URL**: https://risk.cisotoolbox.org
**Repository**: https://github.com/CISOToolbox/risk

The application runs 100% client-side in the browser. No backend, no framework. The module-specific code is written in TypeScript (`ts/`) and the compiled JavaScript (`js/`) is committed: there is nothing to compile to run the app. Data is stored in the browser (localStorage for autosave, IndexedDB for the multi-analysis catalog, JSON file download for persistence).

---

## 2. File Structure

### Root

| File | Purpose |
|------|---------|
| `index.html` | Main HTML: toolbar, navigation rail, 15 panel containers, help overlay, script loading |
| `favicon.svg` | Application icon |
| `logo.svg` | CISO Toolbox logo |
| `demo-fr.json`, `demo-en.json` | Fictional demo dataset (MedSecure), loaded from *Settings → Load demonstration* |
| `templates/ebios-report-{fr,en}.docx` | Word report templates (fetched on Word export) |
| `tools/build_template.py` | python-docx script that builds the two Word report templates |
| `tsconfig.json` | TypeScript configuration (`ts/` → `js/`) |

### CSS: `css/`

| File | Purpose |
|------|---------|
| `cisotoolbox.css` | Shared styles: toolbar, navigation rail, tables, buttons, layout, responsive, ct-ref-select, sliders |
| `EBIOS_RM.css` | App-specific styles (analysis catalog cards, etc.) |

### JavaScript: `js/`

Files marked *shared* are identical across the CISO Toolbox apps: they carry a "Generated file - do not edit" header and are rewritten at every release. The other `EBIOS_RM_*.js` files are compiled from the TypeScript sources in `ts/`.

| File | Purpose |
|------|---------|
| `i18n.js` | *Shared.* Bilingual system: `t()`, `_registerTranslations()`, `switchLang()`, `_rt()` |
| `i18n_core_en.js`, `i18n_core_fr.js` | *Shared.* Common EN / FR translations |
| `cisotoolbox.js` | *Shared.* Event delegation, colors, badges, sliders, tables, undo/redo, matrix rendering, asset loading, encryption |
| `ct_schema.js` | *Shared.* Schema versioning and migration on load |
| `cisotoolbox_local.js` | *Shared.* Persistence layer: autosave, file I/O (open/save/new), snapshots, demo loading |
| `ct_refselect.js` | *Shared.* Multi-select dropdown with tags, search, deferred re-render |
| `ct_settings.js` | *Shared.* Settings drawer (language, AI assistant, module-specific settings) |
| `ai_common.js` | *Shared.* AI provider abstraction (API calls, key validation, suggestion panel UI) |
| `ct_bulkbar.js`, `ct_measure_modal.js`, `ct_modal.js`, `ct_table.js` | *Shared.* Present in the folder but not loaded by `index.html` |
| `EBIOS_RM_data.js` | `EBIOS_INIT_DATA` -- empty analysis template with the 42 ANSSI measures and the ISO 27001 rows (clauses 4-10 + 93 Annex A controls) pre-filled |
| `EBIOS_RM_i18n_fr.js` | French translations (loaded at startup) |
| `EBIOS_RM_i18n_en.js` | English translations (loaded at startup) |
| `EBIOS_RM_app.js` | **Main application logic** -- about 3,700 lines: rendering, data mutation, navigation, import/export |
| `EBIOS_RM_catalog.js` | Multi-analysis IndexedDB catalog (rail list, create/switch/delete/rename/duplicate/import/export analyses) |
| `EBIOS_RM_descriptions.js` | ANSSI and ISO control descriptions (lazy-loaded on the Socle panel) |
| `EBIOS_RM_ai_assistant.js` | AI assistant module (contextual suggestions per workshop) |
| `EBIOS_RM_template.js` | Excel template as base64 (lazy-loaded for Excel export) |
| `vendor/` | Third-party libraries served from the same origin, lazy-loaded: `exceljs.min.js`, `pptxgen.bundle.js`, `pizzip.min.js`, `docxtemplater.js` |

### TypeScript: `ts/`

`ts/EBIOS_RM_*.ts` are the sources of the module-specific `js/EBIOS_RM_*.js` files; `ts/types/*.d.ts` are the shared type declarations.

---

## 3. Architecture Diagram

```
index.html
  |
  |-- css/cisotoolbox.css         (shared: toolbar, rail, tables, buttons, layout, responsive)
  |-- css/EBIOS_RM.css            (app-specific)
  |
  |-- js/i18n.js                  (bilingual system: t(), switchLang())
  |-- js/i18n_core_en.js          (shared EN translations)
  |-- js/i18n_core_fr.js          (shared FR translations)
  |-- js/cisotoolbox.js           (shared: events, colors, badges, sliders, tables, undo, matrix, encryption)
  |-- js/ct_schema.js             (schema versioning / migration on load)
  |-- js/cisotoolbox_local.js     (persistence: autosave, file I/O, snapshots, demo loading)
  |
  |-- js/EBIOS_RM_data.js         (EBIOS_INIT_DATA: empty analysis template)
  |-- js/EBIOS_RM_i18n_fr.js      (French translations)
  |-- js/EBIOS_RM_i18n_en.js      (English translations)
  |-- js/ct_refselect.js          (multi-select dropdown with tags and search)
  |-- js/EBIOS_RM_app.js          (MAIN: all application logic, rendering, data mutation)
  |-- js/EBIOS_RM_catalog.js      (multi-analysis IndexedDB catalog)
  |-- js/ai_common.js             (shared AI provider abstraction)
  |-- js/ct_settings.js           (settings drawer)
  |-- js/EBIOS_RM_ai_assistant.js (AI contextual suggestions per workshop)
  |
  |-- [lazy-loaded on demand]
  |     |-- js/EBIOS_RM_descriptions.js   (ANSSI/ISO control descriptions)
  |     |-- js/EBIOS_RM_template.js       (Excel template base64)
  |
  |-- [js/vendor/, same origin, loaded on demand]
  |     |-- exceljs.min.js                (Excel import/export)
  |     |-- pptxgen.bundle.js             (PowerPoint synthesis export)
  |     |-- pizzip.min.js, docxtemplater.js (Word report export)
  |
  |-- [fetched on demand]
        |-- templates/ebios-report-{fr,en}.docx (Word report templates)
        |-- demo-{fr,en}.json             (demo dataset, from the settings drawer)
```

### Data Flow

```
User Input (data-click/data-change/data-input)
    |
    v
_safeDispatch() [cisotoolbox.js] -- validates function name against blocklist
    |
    v
Handler function (EBIOS_RM_app.js) -- e.g. updateField(), addRow(), toggleDICT()
    |
    +--> _saveState()              -- push current D to undo stack
    +--> Mutate D object           -- update the specific field/array
    +--> cascade renamed IDs       -- update every "ID - Name" reference (updateField)
    +--> Re-render affected panels -- renderVM(), renderSS(), renderSynthesis()...
    +--> _persist() / _autoSave()  -- write D to localStorage
    +--> showStatus()              -- flash confirmation message
```

---

## 4. Data Model

The entire application state is stored in a single global object `D`. It is initialized from `window.EBIOS_INIT_DATA`, migrated by `ctSchemaMigrate()` (`ct_schema.js`, schema revision `window.SCHEMA_REV`) and completed by `ensureKeys()` on every load.

### D object structure

```javascript
D = {
    // ── Metadata ──
    context: {
        societe: "",           // string -- Organization name
        objet_etude: "",       // string -- Study subject
        date: "",              // string -- Analysis date
        analyste: "",          // string -- Analyst name
        reglementation: "",    // string -- Regulatory context (free text)
        socle: "",             // string -- Security baseline label (e.g. "ANSSI - Guide d'hygiene")
        commentaires: "",      // string -- General comments
        date_precedente: "",   // string -- Date of previous analysis
        evolutions: "",        // string -- Changes since previous analysis
    },

    socle_type: "anssi",       // "anssi" | "iso" -- Which baseline is active

    // ── Gravity scale (3, 4, or 5 levels) ──
    gravity_scale: [           // Array, highest level first
        {
            niveau: 4,                  // number -- Level (1-5)
            label: "Vital",             // string -- Level name
            description: "",            // string -- General description
            impact_financier: "",       // string -- Financial impact description
            impact_reputation: "",      // string -- Reputation impact
            impact_reglementaire: "",   // string -- Regulatory impact
            impact_donnees_perso: "",   // string -- Personal data impact
            impact_operationnel: "",    // string -- Operational impact
        },
        // ... (one entry per level)
    ],

    // ── Risk matrix (Gravity x Likelihood -> Risk level) ──
    risk_matrix: [
        { g: 4, levels: ["Moyen", "Moyen", "Eleve", "Eleve"] },  // V1, V2, V3, V4
        { g: 3, levels: ["Faible", "Moyen", "Moyen", "Eleve"] },
        // ... (one row per gravity level)
    ],

    // ── Atelier 1: Cadrage ──
    vm: [                      // Valeurs Metier (Business Values)
        { id: "VM-001", nom: "", nature: "", description: "", responsable: "" }
    ],
    bs: [                      // Biens Supports (Supporting Assets)
        { id: "BS-001", nom: "", type: "", vm: "", localisation: "", proprietaire: "" }
    ],
    er: [                      // Evenements Redoutes (Dreaded Events)
        { id: "ER-001", evenement: "", vm: "", dict: "", impacts: "", gravite: "" }
    ],
    socle_anssi: [             // ANSSI 42 measures (pre-filled from EBIOS_INIT_DATA)
        { num: "1", thematique: "", mesure: "", conformite: "", ecart: "", mesures_prevues: "",
          thematique_en: "", mesure_en: "" }
    ],
    socle_iso: [               // ISO 27001 clauses 4-10 + 93 Annex A controls (pre-filled from EBIOS_INIT_DATA)
        { ref: "A.5.1", theme: "", mesure: "", applicable: "", conformite: "", ecart: "", mesures_prevues: "",
          theme_en: "", mesure_en: "" }
    ],

    // ── Atelier 2: Sources de risque ──
    sr_list: [                 // Sources de Risque (Threat Sources)
        { id: "SR-001", nom: "" }
    ],
    ov_list: [                 // Objectifs Vises (Threat Objectives)
        { id: "OV-001", nom: "" }
    ],
    srov: [                    // Couples SR/OV
        { couple: "SR-001/OV-001", sr_id: "SR-001", ov_id: "OV-001",
          motivation: "", ressources: "", activite: "", justification: "" }
    ],

    // ── Atelier 3: Scenarios strategiques ──
    pp: [                      // Parties Prenantes (Stakeholders)
        { id: "PP-001", nom: "", categorie: "", type: "",
          dependance: "", penetration: "", maturite: "", confiance: "", bs: "" }
    ],
    ss: [                      // Scenarios Strategiques
        { id: "SS-001", scenario: "", couple_id: "", couple_desc: "",
          pp: "", bs: "", er: "" }
    ],
    eco: [                     // Ecosystem measures (one per PP)
        { pp_id: "", mesures_existantes: "", mesures_complementaires: "", categorie: "",
          dep_resid: "", pen_resid: "", mat_resid: "", conf_resid: "" }
    ],

    // ── Atelier 4: Scenarios operationnels ──
    sop_detail: [              // Kill chain phases (grouped by SOP ID)
        { sop: "SOP-001", ss: "", phase: "", action: "", bs: "",
          controle: "", ref: "", efficacite: "", commentaire: "",
          mesure_proposee: "", type_mesure: "" }
    ],
    sop_summary: [             // SOP to SS mapping
        { sop: "SOP-001", ss: "SS-001" }
    ],

    // ── Atelier 5: Traitement ──
    measures: [                // All security measures (consolidated)
        { id: "M-001", mesure: "", details: "", origine: "",  // "Socle"|"Ecosysteme"|"SOP"|"Complementaire"
          type: "", sop: "", phase: "", effet: "", ref_socle: "",
          responsable: "", echeance: "", cout: "", statut: "" }
    ],
    residuals: [               // Residual risks (indexed by SS position)
        { mesures: "", v_resid: "", decision: "" }  // decision: "Accepter"|"Reduire"|"Transferer"|"Eviter"
    ],

    // ── Reserved ──
    fair: [],                  // FAIR quantitative risk analysis (placeholder: lef_*, lm_*, ale_* fields)
}
```

### Key relationships

- `bs[].vm` references `vm[].id` (comma-separated)
- `pp[].bs` references `bs[].id` (comma-separated)
- `er[].vm` references `vm[].id` (single)
- `ss[].couple_id` references `srov[].couple`
- `ss[].pp` references `pp[].id` (comma-separated)
- `ss[].bs` references `bs[].id` (comma-separated)
- `ss[].er` references `er[].id` (comma-separated)
- `eco[].pp_id` is `"PP-001 - Name"` format, links to `pp[].id`
- `sop_detail[].ss` references `ss[].id`
- `sop_detail[].mesure_proposee` references `measures[].id`
- `residuals[i]` corresponds to `ss[i]` by array index position
- `measures[].sop` references `sop_summary[].sop`
- `measures[].ref_socle` references socle measures by num/ref

### Computed values (not stored)

- **PP menace** = `(penetration * dependance) / (maturite * confiance)`
- **PP exposition** = threshold on menace (>=4 Critique, >=2 Elevee, >=1 Moderee, <1 Faible)
- **SR/OV pertinence** = `motivation + ressources + activite` (out of 12)
- **SS gravite** = MAX of associated ER gravites
- **SOP taux de faiblesse** = `MAX(0, (absent*2 + partiel - efficace*2)) / (total*2)`
- **SOP V operationnelle** = 4 if taux>=0.7, 3 if >=0.4, 2 if >=0.2, else 1
- **Risk level** = lookup in `D.risk_matrix` by gravity row and V column

---

## 5. Navigation

### Panel System

The app uses a flat panel navigation system. Each panel is a `<div class="tab-panel">` with an `id="panel-{name}"`. Only one panel is visible at a time (class `active`).

**15 panels**: `synth`, `context`, `vm`, `bs`, `er`, `socle`, `srov`, `pp`, `ss`, `eco`, `sop`, `sop-synth`, `measures`, `residuals`, `history`.

### `selectPanel(id)` (line 741)

1. Sets `_currentPanel = id`
2. Closes the mobile navigation drawer (removes `open` from `.ct-rail`)
3. Calls `_updateSidebarAccordion(id)` (from cisotoolbox.js) to mark the active rail item and expand its group
4. Hides all `.tab-panel` elements, shows `#panel-{id}`
5. Invokes the panel's render function from the `_PANEL_RENDER` map

### `_PANEL_RENDER` map (line 724)

```javascript
{
    synth:      renderSynthesis,
    context:    renderContext,
    vm:         renderVM,
    bs:         renderBS,
    er:         renderER,
    socle:      renderSocle,
    srov:       renderSROV,
    pp:         renderPP,
    ss:         renderSS,
    eco:        renderEco + renderEcoMap,
    sop:        renderSOP,
    "sop-synth": renderSOPSynth,
    measures:   renderMeasures,
    residuals:  renderResiduals,
    history:    renderHistory,
}
```

### Navigation Rail Groups

The navigation is a `<nav class="ct-rail">` in `index.html`. Each workshop is a `.ct-rail-section` whose header is a `.ct-rail-group` button (`aria-expanded`), toggled by `ct_toggleRailGroup(el)`; each entry is a `.ct-rail-item` calling `selectPanel` (or `toggleHelp` for the help entries):

| Group | Entries | Workshop |
|-------|---------|----------|
| (top-level) | `synth` | Synthesis dashboard |
| Atelier 1 | `context, vm, bs, er, socle` | Framing |
| Atelier 2 | `srov` | Risk sources |
| Atelier 3 | `pp, ss, eco` | Strategic scenarios |
| Atelier 4 | `sop, sop-synth` | Operational scenarios |
| Atelier 5 | `measures, residuals` | Treatment |
| Aide | help overlay: `methodo`, `usage` | Help |
| Historique | `history` | Snapshots |

The rail footer holds the multi-analysis catalog (`#analysis-catalog`). `_updateSidebarAccordion(panelId)` sets `aria-current="page"` on the active item and expands the group that contains it.

---

## 6. Functions Reference

Main functions of `EBIOS_RM_app.js`, grouped by category. Line numbers refer to the `function name(` definition in `js/EBIOS_RM_app.js`.

### Configuration & Setup

| Function | Line | Purpose |
|----------|------|---------|
| `_ensureTemplate(cb)` | 27 | Lazy-load Excel template JS file |
| `ensureKeys()` | 2776 | Migrate/initialize all missing keys in D (called on every load) |

### Calculations

| Function | Line | Purpose |
|----------|------|---------|
| `computeMenace(d, p, m, c)` | 110 | Compute PP threat level: (p*d)/(m*c) |
| `computeExposition(menace)` | 115 | Map menace score to exposure label (Critique/Elevee/Moderee/Faible) |
| `computeSSGravity(erList)` | 280 | Compute SS gravity as MAX of associated ER gravities |
| `riskLevel(gNum, v)` | 241 | Look up risk level in D.risk_matrix by gravity and likelihood |
| `socleStatut(conf)` | 253 | Map conformity % to status (Applique>=80 / Partiel>0 / Non applique) |
| `soclePriorite(conf)` | 262 | Map conformity % to priority (Haute<30 / Moyenne<60 / Basse) |
| `gravLabel(n)` | 237 | Get gravity label from D.gravity_scale by level number |
| `_computeSOPVop()` | 1867 | Compute V operationnelle per SOP from phase efficacy counts |
| `_sopToSS()` | 1895 | Derive SOP-to-SS mapping from sop_detail (source of truth) |
| `_ssVInit()` | 2012 | Compute initial likelihood per SS (MAX V of associated SOPs) |

### Color & Badge Helpers

| Function | Line | Purpose |
|----------|------|---------|
| `_toCanonicalRisk(val)` | 65 | Normalize risk level to canonical French key |
| `_displayRisk(val)` | 66 | Display risk level in current language |
| `_riskColorName(level)` | 136 | Map risk level to CT_COLORS key (red/orange/green) |
| `riskColor(level)` | 150 | Get vivid risk color |
| `_riskBg(level)` | 155 | Get risk background color |
| `_riskTxt(level)` | 156 | Get risk text color |
| `_riskBadge(text)` | 157 | Render risk level badge HTML |
| `_expoColorName(expo)` | 158 | Map exposition to color name |
| `_expoBadge(text)` | 166 | Render exposition badge HTML |
| `gravColor(n)` | 171 | Get gravity background color by level |
| `gravTextColor(n)` | 175 | Get gravity text color by level |
| `_gravBadge(text, n)` | 182 | Render gravity badge HTML |
| `_socleBadge(text)` | 190 | Render socle status badge (Applique/Partiel/Non applique) |
| `_prioBadge(text)` | 197 | Render priority badge (Haute/Moyenne/Basse) |
| `_statutBadge(text)` | 221 | Render measure status badge (Termine/En cours/A etudier) |
| `_effBadge(count, text, type)` | 227 | Render efficacy count badge (Absent/Partiel/Efficace) |
| `_origineBadge(text)` | 232 | Render measure origin badge (Socle/Ecosysteme/SOP/Complementaire) |

### HTML Widget Builders

| Function | Line | Purpose |
|----------|------|---------|
| `inp(section, idx, field, val, type = "text", cls = "")` | 300 | Generate `<input>` with data-change handler |
| `sel(section, idx, field, val, options, labelFn)` | 311 | Generate `<select>` with data-change handler |
| `ta(section, idx, field, val)` | 319 | Generate `<textarea>` with data-change and auto-height |
| `delBtn(section, idx)` | 323 | Generate delete button with data-click="delRow" |
| `dictToggle(section, idx, field, val)` | 368 | Generate DICT toggle buttons (D, I, C, T) |
| `refSelect(section, idx, field, val, options, single)` | 409 | Generate multi-select reference dropdown (uses ct_refselect.js) |
| `srSelectWidget(idx, val)` | 1245 | SR selector with "New SR" button |
| `ovSelectWidget(idx, val)` | 1250 | OV selector with "New OV" button |

### Reference Options Providers

| Function | Line | Purpose |
|----------|------|---------|
| `vmOptions()` | 523 | Return {id, label} list from D.vm |
| `bsOptions()` | 524 | Return {id, label} list from D.bs |
| `ppOptions()` | 525 | Return {id, label} list from D.pp |
| `erOptions()` | 526 | Return {id, label} list from D.er |
| `srovOptions()` | 527 | Return {id, label} list from D.srov |
| `ssOptions()` | 528 | Return {id, label} list from D.ss |
| `socleOptions()` | 529 | Return {id, label} list from active socle (ANSSI or ISO) |
| `sopOptions()` | 535 | Return {id, label} list from D.sop_summary |
| `measuresOptions()` | 536 | Return {id, label} list from D.measures |
| `srOptions()` | 1188 | Return {id, label} list from D.sr_list |
| `ovOptions()` | 1189 | Return {id, label} list from D.ov_list |

### Reference Selection Callbacks

| Function | Line | Purpose |
|----------|------|---------|
| `_refOnToggle(uid, section, idx, field, ids, el, single)` | 425 | Handle reference selection toggle (multi or single) |
| `_refOnRemove(section, idx, field, removeId)` | 454 | Handle reference tag removal |
| `_refOnFlush(section, field)` | 462 | Handle deferred re-render after batch changes |
| `_refLabelFor(section, field, id)` | 467 | Look up display label for a reference ID across all sections |
| `_reRenderForField(section, field)` | 500 | Determine which panels to re-render when a field changes |

### Event Handler Wrappers

| Function | Line | Purpose |
|----------|------|---------|
| `_triggerExcelInput()` | 42 | Trigger hidden Excel file input click |
| `_updateFieldFromEl(el)` | 45 | Extract section/index/field/type from data attributes and call updateField |
| `_setContextField(key, val)` | 52 | Update D.context field and re-render |
| `_setGravityField(idx, field, rerender, val)` | 57 | Update gravity scale field |
| `_setRiskMatrix(ri, vi, val)` | 76 | Update risk matrix cell |
| `_effBadgeClick(el)` | 82 | Toggle inline efficacy selector on badge click |
| `_newSRFor(idx)` | 96 | Create new SR and assign to SROV row |
| `_newOVFor(idx)` | 101 | Create new OV and assign to SROV row |
| `toggleDICT(section, idx, field, dim, el)` | 386 | Toggle a DICT dimension (D/I/C/T) for an ER |
| `_ecoSyncColumns(idx, field, measureId, added)` | 1367 | Auto-move measures between existantes/complementaires in eco |

### Data Mutation

| Function | Line | Purpose |
|----------|------|---------|
| `updateField(section, idx, field, val, type)` | 597 | Generic field update with undo, type coercion, rename cascade (`propagateNameChange`), and dependent re-render |
| `propagateNameChange(id, newName)` | 568 | Update every "ID - Name" reference across all sections when an entity is renamed |
| `nextId(section)` | 675 | Generate next sequential ID for a section (e.g. VM-004, BS-012) |
| `addRow(section)` | 692 | Add a new row with default template to a section |
| `delRow(section, idx)` | 712 | Delete a row and re-render affected sections |
| `updateSROVRef(idx, field, val)` | 1222 | Update SR or OV reference in SROV row, check for duplicates, update couple ID |
| `newSR()` | 1194 | Create a new Source de Risque via prompt |
| `newOV()` | 1208 | Create a new Objectif Vise via prompt |
| `setSocleType(type)` | 944 | Switch between ANSSI and ISO baseline |
| `setGravityLevels(n)` | 877 | Switch gravity scale between 3, 4, or 5 levels (with cache) |
| `addSocleMeasure(socleIdx)` | 1159 | Create a new measure from socle gap and link it |
| `addEcoMeasure(ecoIdx)` | 1612 | Create a new ecosystem measure and link to PP |
| `addSOP()` | 1694 | Create a new SOP with initial phase |
| `addSOPPhase(firstIdx)` | 1737 | Add a kill chain phase to an existing SOP |
| `moveSOPPhase(idx, dir)` | 1791 | Move a SOP phase up or down within its group |
| `delSOPPhase(idx)` | 1813 | Delete a SOP phase (or entire SOP if first phase) |
| `addSOPMeasure(sopIdx)` | 1840 | Create a new SOP measure and link to phase |

### Navigation

| Function | Line | Purpose |
|----------|------|---------|
| `selectPanel(id)` | 741 | Switch to a panel, update sidebar, invoke render function |

### Rendering

| Function | Line | Purpose |
|----------|------|---------|
| `renderAll()` | 2219 | Full re-render of all panels (called on load, import, new analysis) |
| `renderIndicators()` | 757 | Render top indicator badges (VM/BS/PP/ER/SS/SOP/Measures counts) |
| `renderContext()` | 779 | Render context form, gravity scale editor, risk matrix editor |
| `renderVM()` | 954 | Render Valeurs Metier table |
| `renderBS()` | 969 | Render Biens Supports table |
| `renderPP()` | 984 | Render Parties Prenantes table with computed menace/exposition |
| `renderPPMap()` | 1562 | Render initial ecosystem SVG map on PP panel |
| `renderSocle()` | 1126 | Render socle (ANSSI or ISO) table with sliders and descriptions |
| `renderSROV()` | 1255 | Render SR/OV couples table with pertinence/priority |
| `renderER()` | 1290 | Render Evenements Redoutes table with DICT toggles |
| `renderSS()` | 1346 | Render Scenarios Strategiques table with computed gravity |
| `renderEco()` | 1576 | Render ecosystem measures table with residual D/P/M/C |
| `renderEcoMap()` | 1543 | Render residual ecosystem SVG radar map |
| `renderSOP()` | 1637 | Render SOP kill chain table with rowspan grouping, phase management |
| `renderSOPSynth()` | 1924 | Render SOP synthesis table (per SS: gravity, efficacy, V, initial risk) |
| `renderMeasures()` | 1988 | Render consolidated measures table (all origins) |
| `renderResiduals()` | 2025 | Render residual risk table with clamped V and treatment decisions |
| `renderSynthesis()` | 2063 | Render synthesis dashboard: risk matrices, distribution, evolution, socle conformity, measures summary |
| `renderHistory()` | 544 | Render snapshots table with create/restore/export/delete/encrypt |

### Ecosystem Visualization

| Function | Line | Purpose |
|----------|------|---------|
| `_buildEcoSVG(ppList, title)` | 1397 | Build SVG radar visualization of PP ecosystem (3 quadrants, concentric threat zones, color-coded by fiability) |

### Vendor Import

| Function | Line | Purpose |
|----------|------|---------|
| `triggerImportVendor()` | 1008 | Trigger hidden vendor file input click |
| `importVendorPP(event)` | 1011 | Import PP from Vendor app export (supports pp_export and full vendor format) |

### SOP Helper Functions

| Function | Line | Purpose |
|----------|------|---------|
| `_findSOPGroup(idx)` | 1773 | Find the SOP ID of the group containing a phase index |
| `_findSOPStart(sopId)` | 1784 | Find the starting index of a SOP group |
| `_srNom(id)` | 1190 | Look up SR name by ID |
| `_ovNom(id)` | 1191 | Look up OV name by ID |
| `_srFull(id)` | 1192 | Format SR as "ID - Name" |
| `_ovFull(id)` | 1193 | Format OV as "ID - Name" |

### Undo/Redo

Undo/redo is provided by `cisotoolbox.js` (`_saveState()`, `undo()`, `redo()`, `_updateUndoButtons()`), see section 7.

### Utility

| Function | Line | Purpose |
|----------|------|---------|
| `_range(a, b)` | 298 | Generate integer range [max(1,a)..min(4,b)] |

### Validation

| Function | Line | Purpose |
|----------|------|---------|
| `_validateData(obj)` | 2254 | Validate imported JSON: required keys, types, array sizes, prototype pollution, numeric ranges, string lengths |

### Excel Import/Export

| Function | Line | Purpose |
|----------|------|---------|
| `_loadExcelJS()` | 2336 | Lazy-load ExcelJS from `js/vendor/` (same origin, no CDN) |
| `exportExcel()` | 2345 | Export current analysis to Excel (load template, fill data, download) |
| `_fillExcelData(wb)` | 2379 | Fill ExcelJS workbook cells from D (all worksheets) |
| `importExcel(event)` | 2608 | Import Excel file, read data, populate D |
| `_cv(cell)` | 2627 | Extract cell value from ExcelJS cell (handles formulas, rich text) |
| `_readExcelData(wb)` | 2641 | Read all worksheets from ExcelJS workbook into D |

### PowerPoint / Word Export

| Function | Line | Purpose |
|----------|------|---------|
| `_loadPptxGenJS()` | 3103 | Lazy-load PptxGenJS from `js/vendor/` |
| `exportSynthesisPPTX()` | 3133 | Export the managerial synthesis as a PowerPoint file (File menu) |
| `_loadDocxLibs()` | 3286 | Lazy-load PizZip and docxtemplater from `js/vendor/` |
| `exportWordReport()` | 3629 | Fill `templates/ebios-report-{fr,en}.docx` and download the EBIOS RM report (File menu) |

### Initialization

After the function definitions, `EBIOS_RM_app.js` runs a top-level `try` block that:
1. Sets the toolbar right content (settings button + GitHub link)
2. Calls `window._appInitCallback()` when the host defines it, otherwise `_initDataAndRender()` (from cisotoolbox.js: runs the schema migration, then `ensureKeys()` and `renderAll()`)
3. Opens the panel named in the URL hash, if any (`selectPanel`)
4. Calls `_applyStaticTranslations()` (from i18n.js)
5. Hides the "Save" menu item if the File System Access API is not available
6. Calls `_checkAutoSaveBanner()` to offer session restore if autosave data exists

At the end of the file, `window.AI_APP_CONFIG = { storagePrefix: "ebios", settingsExtraHTML, onSettingsRendered }` configures the AI module and adds the demo-loading section to the settings drawer (`_demoSettingsHTML()` / `_wireDemoSettings()` from `cisotoolbox_local.js`).

---

## 7. Shared Library (cisotoolbox.js)

Key functions from `cisotoolbox.js` used by the Risk module:

### Configuration

| Function | Purpose |
|----------|---------|
| `_ct()` | Access `window.CT_CONFIG` (lazy-init) |
| `_ctInit()` | Initialize from `window.CT_CONFIG` |

### HTML Helpers

| Function | Purpose |
|----------|---------|
| `esc(v)` | HTML-escape a value (prevents XSS) -- replaces `& < > " '` |
| `_da(...)` | JSON-encode arguments for `data-args` attribute (safe in single-quoted HTML) |
| `hd(key)` | Generate `data-col="key"` attribute for hideable columns |
| `badge(text, color)` | Render a simple colored badge |

### Color System (CT_COLORS)

| Function | Purpose |
|----------|---------|
| `ctColor(name)` | Get `{bg, txt, vivid}` by color name (green, orange, red, etc.) |
| `ctColorLevel(level, maxLevel)` | Get color by numeric level (1-N) in a scale |
| `ctBadge(text, colorName)` | Render a pastel badge by color name |
| `ctBadgeLevel(text, level, maxLevel)` | Render a badge by numeric level |
| `confColor(v)` | Get slider accent color for conformity percentage |

### Table System

| Function | Purpose |
|----------|---------|
| `_setupTable(tableId, defaultHidden)` | Initialize column hide/show/resize for a table |
| `colsButton(tableId)` | Generate "Columns" popup button HTML |
| `hideCol(tableId, col, silent)` | Hide a column by data-col key |
| `showCol(tableId, col)` | Show a hidden column |

### Sidebar & Navigation

| Function | Purpose |
|----------|---------|
| `_updateSidebarAccordion(panelId)` | Mark the active rail item and expand the group containing panelId |
| `ct_toggleRailGroup(el)` | Toggle a rail group collapse/expand |
| `toggleSidebar()` | Toggle sidebar visibility |
| `_toggleSidebarMobile()` | Toggle sidebar on mobile (hamburger) |
| `toggleHelp(tab)` | Open/close help overlay |
| `switchHelpTab(tab)` | Switch between help tabs (methodo/usage) |

### Sliders

| Function | Purpose |
|----------|---------|
| `_sliderInput(el)` | Real-time slider visual update (label + accent color) |
| `_sliderColor(val, max)` | Compute slider color based on value |
| `_applySliderStyle(el)` | Apply accent color to a range input |
| `_initSliders()` | Initialize all sliders on page |

### Event Dispatch

| Function | Purpose |
|----------|---------|
| `_safeDispatch(fn, args)` | Validate and dispatch a function call from data-click/data-change/data-input |
| `_menuAction(fnName)` | Close menu and dispatch action |

### Undo/Redo

| Function | Purpose |
|----------|---------|
| `_saveState()` | Push current D state to undo stack (limit: 50) |
| `_updateUndoButtons()` | Update the undo/redo buttons from the stack state |
| `_replaceD(json)` | Replace D content from JSON string (preserves reference) |
| `undo()` | Restore previous state |
| `redo()` | Restore next state |

### Asset Loading

| Function | Purpose |
|----------|---------|
| `_loadAsset(filename, cb)` | Load a JS file dynamically (script tag injection) |
| `_loadScript(url, opts)` | Load a library once and return a Promise (used for `js/vendor/`) |
| `_ensureDescriptions(cb)` | Lazy-load descriptions file |
| `_initDataAndRender(afterFn)` | Run the schema migration, call ensureKeys(), renderAll(), then afterFn |

`cisotoolbox.js` also contains a generic `_ensureFramework()` hook for apps with lazy-loaded complementary frameworks. This module ships none: its baselines (ANSSI and ISO 27001) are embedded in `EBIOS_RM_data.js`.

### Description Lookups

| Function | Purpose |
|----------|---------|
| `_getAnssDesc(num)` | Get ANSSI control description by number (locale-aware) |
| `_getIsoDesc(ref)` | Get ISO control description by ref (locale-aware) |

### Matrix Rendering

| Function | Purpose |
|----------|---------|
| `ctRenderMatrix(opts)` | Render an interactive risk matrix grid with tooltips and legend |

### Status & Menus

| Function | Purpose |
|----------|---------|
| `showStatus(msg)` | Flash a status message in the toolbar |
| `toggleMenu()` | Toggle File dropdown menu |

### Encryption

| Function | Purpose |
|----------|---------|
| `_encryptData(jsonStr, password)` / `_decryptData(buffer, password)` | AES-256-GCM encryption with a PBKDF2-derived key |
| `_isEncrypted(buffer)` | Check if a file buffer is AES-encrypted |
| `_promptPassword(title, confirmMode)` | Show password dialog (with optional confirmation) |
| `_confirmDialog(title, body)` | Show a confirm/cancel dialog |

---

## 8. Event System

All user interactions use **data attributes** on HTML elements, dispatched by `cisotoolbox.js`. No inline `onclick=` handlers are used (CSP compliance).

### Data Attributes

| Attribute | Event | Behavior |
|-----------|-------|----------|
| `data-click="fnName"` | click | Call `fnName()` on click |
| `data-change="fnName"` | change | Call `fnName()` on change (select, input, checkbox) |
| `data-input="fnName"` | input | Call `fnName()` on real-time input (typing, slider drag) |
| `data-args='["a","b"]'` | -- | JSON array of arguments passed to the function |
| `data-pass-value` | -- | Append the element's `.value` (change / input) |
| `data-pass-checked` | -- | Append the element's `.checked` (change) |
| `data-pass-el` | -- | Append the DOM element itself |
| `data-pass-event` | -- | Append the DOM event (click / change) |
| `data-stop` | -- | Call `event.stopPropagation()` (click) |
| `data-click-self="fnName"` | click | Only fires if the click target is the element itself (not children) |

### Dispatch Flow

```
1. User clicks/changes/inputs on an element
2. cisotoolbox.js event listener catches the event (delegated on document)
3. Reads data-click / data-change / data-input attribute
4. Reads data-args (JSON parse)
5. If data-stop (click): calls event.stopPropagation()
6. If data-pass-value / data-pass-checked (change, input): appends el.value / el.checked to args
7. If data-pass-el / data-pass-event: appends el / the event to args
8. Calls _safeDispatch(fnName, args)
```

### `_safeDispatch(fn, args)` (cisotoolbox.js line 719)

1. Returns if `fn` is in the `_BLOCKED_DISPATCH` blocklist (security)
2. Resolves `window[fn]` and checks that it is a function
3. Calls `window[fn].apply(null, args)`

### Example

```html
<button data-click="addRow" data-args='["vm"]'>+ Add VM</button>
```

This calls `addRow("vm")` when clicked.

```html
<input data-change="_updateFieldFromEl" data-pass-el
       data-s="vm" data-i="0" data-f="nom" data-t="text" />
```

On change, calls `_updateFieldFromEl(element)`, which extracts `section=vm, idx=0, field=nom, type=text` from data attributes and calls `updateField("vm", 0, "nom", value, "text")`.

---

## 9. Security

### Content Security Policy (.htaccess)

```
script-src 'self'
style-src 'self' 'unsafe-inline'
```

- No `unsafe-inline` for scripts, no `unsafe-eval`
- ExcelJS, PptxGenJS, PizZip and docxtemplater vendored under `js/vendor/` and loaded from the app's own origin (no CDN, no SRI needed)
- All JS in external files

### XSS Prevention

- **`esc(v)`** -- All user data is HTML-escaped before DOM insertion via `innerHTML`
- **`_da(...)`** -- Arguments are JSON-encoded and single-quote-escaped for `data-args`
- No `eval()`, `Function()`, `document.write()`, `setTimeout(string)`
- No inline `onclick=`, `onchange=` in generated HTML

### `_BLOCKED_DISPATCH` (cisotoolbox.js)

The event dispatch system maintains a blocklist of dangerous function names that cannot be called via `data-click`/`data-change`/`data-input`:

```
eval, Function, setTimeout, setInterval, fetch, open, close,
alert, confirm, prompt, importScripts, postMessage, XMLHttpRequest,
WebSocket, EventSource, Worker, SharedWorker, navigator, crypto,
Notification
```

### AES-256-GCM Encryption (cisotoolbox.js, cisotoolbox_local.js)

- Crypto primitives (`_encryptData`, `_decryptData`) live in `cisotoolbox.js`; file and snapshot handling in `cisotoolbox_local.js`
- Files can be encrypted with a password before saving (`.enc` extension)
- PBKDF2 with 250,000 iterations for key derivation
- AES-256-GCM via Web Crypto API
- Snapshots can be independently encrypted in localStorage
- Password stored only in memory (`_filePwd`, `_snapPwd`), never persisted

### Prototype Pollution Guards

- `_applyLoadedJson()` (cisotoolbox_local.js) deletes `__proto__`, `constructor`, `prototype` from parsed JSON
- `_validateData()` checks for forbidden keys in imported data arrays
- `ensureKeys()` does not blindly merge -- it only adds missing keys with safe defaults

### Input Validation (`_validateData`)

- Enforces required keys (at least `context`)
- Array size limits (e.g., max 200 VM, 500 BS, 1000 SOP phases)
- Numeric field range checks (-1000 to 1e12)
- String length limits (5000 chars max per field)
- Type validation (arrays must be arrays, objects must be objects)
- `socle_type` must be "anssi" or "iso"

### HTTP Security Headers (.htaccess)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` configured
- Dotfiles (`.git`, `.env`) blocked
- `package.json`, `composer.json` blocked

---

## 10. i18n System

### Architecture

The bilingual system is provided by `i18n.js` (shared) with app-specific translation files.

- **French** (`i18n_core_fr.js` + `EBIOS_RM_i18n_fr.js`) -- loaded synchronously at startup
- **English** (`i18n_core_en.js` + `EBIOS_RM_i18n_en.js`) -- loaded synchronously at startup
- Initial language: stored choice (`localStorage["ct_lang"]`), else the browser language when available, else English

### Key Functions

| Function | Source | Purpose |
|----------|--------|---------|
| `t(key, params)` | i18n.js | Translate a key with optional parameter interpolation: `t("status_saved_name", {name: "file.json"})` |
| `_registerTranslations(locale, obj)` | i18n.js | Register a translation dictionary for a locale |
| `switchLang(lang, cb)` | i18n.js | Switch language, store it in `ct_lang`, re-render |
| `_loadI18nFile(lang, cb)` | i18n.js | Load the core + module dictionaries of a language not yet loaded (no-op for FR/EN, already loaded) |
| `_applyStaticTranslations()` | i18n.js | Apply `data-i18n` and `data-i18n-html` attributes to the DOM |
| `_rt(obj, field)` | i18n.js | Bilingual field resolver: returns `obj[field + "_en"]` in EN, `obj[field]` in FR |

### Translation Keys Convention

Keys follow the pattern `{app}.{section}.{item}`:

```
ebios.sidebar.synth        -- Sidebar item label
ebios.col.vm_name          -- Column header
ebios.btn.add_vm           -- Button label
ebios.desc.context         -- Panel description
ebios.status.modified      -- Status message
ebios.help.methodo         -- Help content
ebios.risk.eleve           -- Risk level label
ebios.grav.critique        -- Gravity level label
```

### DOM Integration

```html
<!-- Text content translation -->
<div data-i18n="ebios.sidebar.synth">Synthese</div>

<!-- HTML content translation (for help panels) -->
<div data-i18n-html="ebios.help.methodo">...</div>

<!-- Title attribute translation -->
<button data-i18n-title="btn_undo_title" title="Annuler">...</button>
```

### Bilingual Data Fields

Reference data (socle measures, framework controls) supports bilingual via `_en` suffixed fields:

```javascript
{ mesure: "Former les equipes", mesure_en: "Train operational teams" }
```

`_rt(item, "mesure")` returns the correct language version based on current locale.

### Domain-Specific Terms

Domain terms in data models are always stored in French (canonical form), regardless of the display language:
- Risk levels: `"Faible"`, `"Moyen"`, `"Eleve"` (never "Low", "Medium", "High")
- Socle statuses: `"Applique"`, `"Partiel"`, `"Non applique"`
- Efficacy: `"Absent"`, `"Partiel"`, `"Efficace"`
- Origins: `"Socle"`, `"Ecosysteme"`, `"SOP"`, `"Complementaire"`

Display functions (`_displayRisk()`, etc.) translate these to the current locale for the UI.
