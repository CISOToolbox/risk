/**
 * EBIOS RM — AI Assistant Module (Optional)
 *
 * Adds AI suggestion buttons on each analysis panel.
 * Calls the AI API directly from the browser.
 * API key stored in localStorage (entered once by the user).
 *
 * Requires: ai_common.js loaded first (shared providers, storage, settings, panel UI, CSS).
 * Installation: add before </body> in EBIOS_RM.html:
 *   <script src="js/ai_common.js"></script>
 *   <script src="js/EBIOS_RM_ai_assistant.js"></script>
 */
(function () {
    "use strict";
    // ── Alias locaux des fonctions partagées exposées via window par ai_common.js /
    // ct_settings.js (les decls générées ne les déclarent que sur Window).
    // ai_common.js est chargé avant ce fichier (ordre des <script> dans index.html).
    var _aiIsEnabled = window._aiIsEnabled;
    var _aiCallAPI = window._aiCallAPI;
    var _aiParseJSON = window._aiParseJSON;
    var _aiEnsurePanel = window._aiEnsurePanel;
    var _aiClosePanel = window._aiClosePanel;
    var _aiShowLoading = window._aiShowLoading;
    // Décl gen ct-core/ai_common : _aiOpenPanel?: () => void — la vraie signature accepte un titre.
    var _aiOpenPanel = window._aiOpenPanel;
    var openSettings = window.openSettings;
    // ═══════════════════════════════════════════════════════════════════════
    // I18N — register UI translations for this module (app-specific only)
    // ═══════════════════════════════════════════════════════════════════════
    if (typeof _registerTranslations === "function") {
        _registerTranslations("fr", {
            "ai.btn": "✨ IA",
            "ai.generating": "Génération des suggestions...",
            "ai.generating_sop": "Génération de la kill chain pour {id}...",
            "ai.error": "Erreur : {msg}",
            "ai.all_done": "Toutes les suggestions ont été traitées.",
            "ai.generate_more": "Générer d'autres suggestions",
            "ai.context_placeholder": "Contexte additionnel (ex : « propose des VM liées aux RH »)",
            "ai.prompt_intro": "Que souhaitez-vous demander à l'assistant IA ?",
            "ai.auto_suggest": "Proposer automatiquement des éléments",
            "ai.custom_instruction_label": "Ou donnez vos instructions :",
            "ai.custom_instruction_placeholder": "Décrivez ce que vous attendez de l'IA (ex : « propose des scénarios liés au ransomware », « identifie les risques cloud »...)",
            "ai.send_instruction": "Envoyer mes instructions",
            "ai.update": "Mettre à jour",
            "ai.update_existing": "Mise à jour de {id}",
            "ai.residual.owner": "Responsable",
            "ai.residual.selected": "Mesures existantes à appliquer",
            "ai.residual.new_measures": "Nouvelles mesures à créer",
            "ai.residual.proposed_v": "Vraisemblance résiduelle proposée",
            "ai.residual.accepted": "Plan de traitement mis à jour",
            "ai.added": "IA : {id} ajouté",
            "ai.added_count": "IA : {count} éléments ajoutés",
            "ai.select_ss": "Sélectionnez un scénario stratégique :",
            "ai.sop_exists": "⚠ SOP existant — générera une alternative",
            "ai.no_ss": "Aucun scénario stratégique défini.",
            "ai.no_prompt": "Pas de prompt IA défini pour : {type}",
            "ai.apikey_title": "Clé API",
            "ai.apikey_placeholder": "sk-ant-...",
            "ai.apikey_empty": "Veuillez saisir votre clé API.",
            "ai.apikey_invalid": "Clé API invalide. Veuillez réessayer.",
            "ai.no_analysis": "Aucune analyse ouverte : ouvrez ou créez une analyse avant d'utiliser l'assistant.",
            "ai.include_measures": "Tenir compte des mesures déjà identifiées",
            "ai.include_measures_help": "Transmet le plan de mesures complet pour éviter les doublons. À décocher sur un plan volumineux si le modèle a une petite fenêtre de contexte.",
            "ai.measure.completes": "Complète la mesure {id} — {nom}.",
            "ai.preview.title": "Ce que l'acceptation va écrire",
            "ai.preview.name": "Titre :",
            "ai.preview.name_kept": "Titre inchangé",
            "ai.preview.details": "Description :",
            "ai.preview.no_change": "déjà couvert, rien à ajouter",
            "ai.sop.measure_col": "Mesure",
            "ai.sop.adjusted": "ajustée",
            "ai.sop.reused": "réutilisée",
            "ai.sop.new": "à créer",
            "ai.sop.unknown_measure": "mesure {id} inconnue — sera créée",
            "ai.added_count_partial": "{count} ajoutée(s). {differes} modifient une mesure existante : à valider une par une.",
            "ai.label.vm": "Valeurs Métier (VM)",
            "ai.label.bs": "Biens Supports (BS)",
            "ai.label.er": "Événements Redoutés (ER)",
            "ai.label.srov": "Couples SR/OV",
            "ai.label.pp": "Parties Prenantes (PP)",
            "ai.label.ss": "Scénarios Stratégiques (SS)",
            "ai.label.sop": "Scénarios Opérationnels (SOP)",
            "ai.label.eco": "Mesures Écosystème",
            "ai.label.measures": "Mesures de Sécurité",
            "ai.label.residuals": "Risques Résiduels",
            "ai.label.socle": "Socle de sécurité"
        });
        _registerTranslations("en", {
            "ai.btn": "✨ AI",
            "ai.generating": "Generating suggestions...",
            "ai.generating_sop": "Generating kill chain for {id}...",
            "ai.error": "Error: {msg}",
            "ai.all_done": "All suggestions have been processed.",
            "ai.generate_more": "Generate more suggestions",
            "ai.context_placeholder": "Additional context (e.g. \"suggest VM related to HR\")",
            "ai.prompt_intro": "What would you like the AI assistant to do?",
            "ai.auto_suggest": "Automatically suggest elements",
            "ai.custom_instruction_label": "Or provide your instructions:",
            "ai.custom_instruction_placeholder": "Describe what you expect from the AI (e.g. \"suggest ransomware-related scenarios\", \"identify cloud risks\"...)",
            "ai.send_instruction": "Send my instructions",
            "ai.update": "Update",
            "ai.update_existing": "Update {id}",
            "ai.residual.owner": "Owner",
            "ai.residual.selected": "Existing controls to apply",
            "ai.residual.new_measures": "New controls to create",
            "ai.residual.proposed_v": "Proposed residual likelihood",
            "ai.residual.accepted": "Treatment plan updated",
            "ai.added": "AI: {id} added",
            "ai.added_count": "AI: {count} items added",
            "ai.select_ss": "Select a strategic scenario:",
            "ai.sop_exists": "⚠ SOP already exists — will generate alternative",
            "ai.no_ss": "No strategic scenarios defined.",
            "ai.no_prompt": "No AI prompt defined for: {type}",
            "ai.apikey_title": "API Key",
            "ai.apikey_placeholder": "sk-ant-...",
            "ai.apikey_empty": "Please enter your API key.",
            "ai.apikey_invalid": "Invalid API key. Please try again.",
            "ai.no_analysis": "No analysis open: open or create one before using the assistant.",
            "ai.include_measures": "Take existing measures into account",
            "ai.include_measures_help": "Sends the full measure plan so the model avoids duplicates. Uncheck on a large plan if your model has a small context window.",
            "ai.measure.completes": "Complements measure {id} — {nom}.",
            "ai.preview.title": "What accepting will write",
            "ai.preview.name": "Title:",
            "ai.preview.name_kept": "Title unchanged",
            "ai.preview.details": "Description:",
            "ai.preview.no_change": "already covered, nothing to add",
            "ai.sop.measure_col": "Measure",
            "ai.sop.adjusted": "adjusted",
            "ai.sop.reused": "reused",
            "ai.sop.new": "to create",
            "ai.sop.unknown_measure": "measure {id} unknown — will be created",
            "ai.added_count_partial": "{count} added. {differes} modify an existing measure: review them one by one.",
            "ai.label.vm": "Business Assets (VM)",
            "ai.label.bs": "Supporting Assets (BS)",
            "ai.label.er": "Feared Events (ER)",
            "ai.label.srov": "RO/TO Pairs (SR/OV)",
            "ai.label.pp": "Stakeholders (PP)",
            "ai.label.ss": "Strategic Scenarios (SS)",
            "ai.label.sop": "Operational Scenarios (SOP)",
            "ai.label.eco": "Ecosystem Controls",
            "ai.label.measures": "Security Controls",
            "ai.label.residuals": "Residual Risks",
            "ai.label.socle": "Security baseline"
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM PROMPT — backend deployment
    // ═══════════════════════════════════════════════════════════════════════
    // The EBIOS RM methodology system prompt lives server-side, in
    // risk/src/routes/ai.py (RISK_SYSTEM_PROMPT). _callAI posts the per-panel
    // user prompt to POST api/ai/risk/suggest, which owns the methodology.
    // The opensource (browser-local) build keeps the prompt here instead.
    // ═══════════════════════════════════════════════════════════════════════
    // FEAT-41 — les prompts ne sont plus construits ici.
    //
    // Le serveur relit l'analyse en base et compose le prompt (src/ai_prompts.py).
    // Le frontend ne déclare plus QUE ce qu'il veut : le panneau, la langue, et
    // l'éventuelle instruction libre. Voir CLAUDE.md §5.1.
    //
    // La variante navigateur (webapp/) garde ses constructeurs : sans backend,
    // elle appelle le fournisseur directement. Divergence déclarée.
    // ═══════════════════════════════════════════════════════════════════════
    // Panneaux acceptés par POST api/ai/risk/suggest (doit rester aligné sur
    // PANELS dans src/ai_prompts.py — un panneau inconnu répond 422).
    var AI_PANELS = ["vm", "bs", "er", "srov", "pp", "ss", "sop", "eco",
        "measures", "residuals", "socle"];
    async function _callAI(ask) {
        if (!_aiIsEnabled()) {
            openSettings();
            return null;
        }
        var analysisId = localStorage.getItem("ebios_catalog_active") || "";
        if (!analysisId)
            throw new Error(t("ai.no_analysis"));
        // Le serveur relit l'analyse EN BASE (FEAT-41) : les écritures encore
        // débouncées doivent partir d'abord, sinon le modèle travaillerait sur
        // l'état d'avant la dernière édition sans que rien ne le signale.
        if (typeof window._riskFlushPending === "function") {
            await window._riskFlushPending();
        }
        var extra = _extraContext;
        _extraContext = ""; // reset after use
        var resp = await fetch("api/ai/risk/suggest", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                analysis_id: analysisId,
                panel: ask.panel,
                ss_id: ask.ssId || null,
                language: typeof _locale !== "undefined" ? _locale : "fr",
                row: (ask.row === undefined ? null : ask.row),
                include_existing_measures: ask.includeMeasures !== false,
                custom_instruction: ask.custom || null,
                extra_instruction: extra || null
            })
        });
        if (!resp.ok) {
            var errTxt = await resp.text();
            var detail = errTxt.substring(0, 300);
            // FastAPI error bodies are {"detail":"..."} — surface just the
            // detail message (e.g. a 422 explicit refusal from the backend)
            // so the existing catch in _aiRunSuggest can render it cleanly.
            try {
                var j = JSON.parse(errTxt);
                if (j && j.detail)
                    detail = j.detail;
            }
            catch (_) { }
            throw new Error(detail);
        }
        var data = await resp.json();
        return data.result;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // SUGGESTION PANEL UI (uses shared panel from ai_common.js)
    // ═══════════════════════════════════════════════════════════════════════
    // Normalize AI result into an array of suggestions, handling special types (SROV, SOP)
    function _normalizeSuggestions(type, result) {
        if (type === "srov" && result && result.pairs) {
            return result.pairs.map(function (p) {
                p._newSR = result.new_sr || [];
                p._newOV = result.new_ov || [];
                p._title = (p.sr_nom || p.sr_id || "") + " / " + (p.ov_nom || p.ov_id || "");
                return p;
            });
        }
        if (type === "sop" && result && result.phases) {
            result._title = "SOP for " + (result.ss || "");
            return [result];
        }
        if (Array.isArray(result))
            return result;
        return [result];
    }
    // Fields to hide from cards (internal or verbose)
    var _HIDDEN_FIELDS = { "_title": 1, "_socleIdx": 1, "_ref": 1, "_ecoIdx": 1, "_ppId": 1, "_ppNom": 1, "_sopIdx": 1, "_sop": 1, "_phase": 1, "_newSR": 1, "_newOV": 1 };
    // Fields shown as short summary only (truncated)
    var _SUMMARY_FIELDS = { "details": 1, "description": 1, "impacts": 1, "effet": 1 };
    // Fields to skip in SROV (shown in custom rendering)
    var _SROV_SKIP = { "sr_id": 1, "ov_id": 1, "sr_nom": 1, "ov_nom": 1, "motivation": 1, "ressources": 1, "activite": 1 };
    /** FEAT-40 — ce que l'acceptation va réellement écrire dans la mesure visée.
     *
     *  Sans cet aperçu, la carte montre le fragment proposé par le modèle et
     *  l'utilisateur ne peut pas savoir s'il complète ou s'il écrase — ni ce que
     *  devient le titre. On rend donc l'avant et l'après, calculés avec les MÊMES
     *  fonctions que l'acceptation, sinon l'aperçu mentirait.
     */
    /** Ce que _mergeDetails ajoutera réellement : "" si rien ne change. */
    function _detailsAddition(ancien, ajout) {
        var a = (ancien || "").trim();
        var b = (ajout || "").trim();
        if (!b)
            return "";
        if (a && a.indexOf(b) !== -1)
            return "";
        return b;
    }
    function _enrichPreviewHTML(s) {
        if (!s || s.action !== "enrich" || !s.id)
            return "";
        var cible = D.measures.find(function (m) { return m.id === s.id; });
        if (!cible)
            return "";
        var h = '<div class="ai-diff ct-mt-2 ct-p-2 ct-r-md" style="background:var(--ct-bg-alt)">';
        h += '<div class="ct-text-label ct-strong ct-mb-1">' + esc(t("ai.preview.title")) + '</div>';
        var nouveauTitre = (s.mesure || "").trim();
        if (nouveauTitre && nouveauTitre !== cible.mesure) {
            h += '<div class="ct-text-label ct-muted">' + esc(t("ai.preview.name")) + '</div>';
            h += '<div class="ct-text-label"><s class="ct-muted">' + esc(cible.mesure) + '</s></div>';
            h += '<div class="ct-text-label ct-strong">' + esc(nouveauTitre) + '</div>';
        }
        else {
            h += '<div class="ct-text-label ct-muted">' + esc(t("ai.preview.name_kept")) + '</div>';
        }
        if (s.details) {
            h += '<div class="ct-text-label ct-muted ct-mt-2">' + esc(t("ai.preview.details")) + '</div>';
            if (cible.details) {
                h += '<div class="ct-text-label ct-muted">' + esc(cible.details) + '</div>';
            }
            // Ce qui s'ajoute réellement, avec la MÊME règle que _mergeDetails —
            // pas une soustraction de chaînes, qui dérape sur les espaces de fin.
            var ajout = _detailsAddition(cible.details || "", s.details);
            h += ajout
                ? '<div class="ct-text-label ct-text-ok ct-strong">+ ' + esc(ajout) + '</div>'
                : '<div class="ct-text-label ct-muted"><em>' + esc(t("ai.preview.no_change")) + '</em></div>';
        }
        h += '</div>';
        return h;
    }
    function _renderCards(type, suggestions, acceptFn) {
        var p = _aiEnsurePanel();
        if (!suggestions || suggestions.length === 0) {
            p.body.innerHTML = '<div class="ai-error">' + t("ai.no_suggestions") + '</div>';
            return;
        }
        var h = "";
        suggestions.forEach(function (s, i) {
            if (!s || typeof s !== "object")
                return;
            h += '<div class="ai-card" id="ai-card-' + i + '">';
            // Custom rendering for SROV pairs
            if (type === "srov") {
                var srLabel = (s.sr_nom || s.sr_id || "?");
                var ovLabel = (s.ov_nom || s.ov_id || "?");
                h += '<div class="ai-card-title">' + esc(srLabel + " / " + ovLabel) + '</div>';
                h += '<div class="ai-card-field ct-flex ct-gap-3 ct-mb-1">';
                h += '<span><strong>M:</strong> ' + (s.motivation || 0) + '/4</span>';
                h += '<span><strong>R:</strong> ' + (s.ressources || 0) + '/4</span>';
                h += '<span><strong>A:</strong> ' + (s.activite || 0) + '/4</span>';
                var pertinence = ((s.motivation || 0) + (s.ressources || 0) + (s.activite || 0));
                h += '<span style="margin-left:auto;font-weight:600;color:' + (pertinence > 7 ? 'var(--ct-critical)' : pertinence > 4 ? 'var(--ct-high)' : 'var(--ct-ink-2)') + '">' + pertinence + '/12</span>';
                h += '</div>';
                if (s.justification)
                    h += '<div class="ai-card-details">' + esc(s.justification) + '</div>';
            }
            else {
                // Generic rendering
                h += '<div class="ai-card-title">' + esc(s._title || s.nom || s.scenario || s.mesure || s.evenement || ("Suggestion " + (i + 1))) + '</div>';
            }
            for (var k in s) {
                if (_HIDDEN_FIELDS[k])
                    continue;
                if (type === "srov" && (_SROV_SKIP[k] || k === "justification"))
                    continue;
                // Skip the field used as title
                if (k === "nom" || k === "mesure" || k === "scenario" || k === "evenement") {
                    if ((s._title || s[k]) === (s._title || ""))
                        continue;
                }
                var v = s[k];
                if (typeof v === "object")
                    v = JSON.stringify(v);
                var val = String(v);
                if (_SUMMARY_FIELDS[k] && val.length > 120) {
                    val = val.substring(0, 120) + "…";
                }
                h += '<div class="ai-card-field"><strong>' + esc(k) + ':</strong> ' + esc(val) + '</div>';
            }
            // FEAT-40 — aperçu avant/après. Accepter un enrichissement écrit dans
            // une mesure existante : l'utilisateur doit voir CE QUI CHANGE avant,
            // pas seulement le fragment proposé.
            h += _enrichPreviewHTML(s);
            // Detect if this is an update (existing ID) or a new element
            var isUpdate = s.id && _aiIdExists(type, s.id);
            if (isUpdate) {
                h += '<div class="ct-text-label ct-text-high ct-strong ct-mb-1">&#9998; ' + t("ai.update_existing", { id: esc(s.id) }) + '</div>';
            }
            h += '<div class="ai-card-actions">';
            h += '<button class="ct-btn ai-btn-accept" data-variant="primary" data-click="_aiAccept" data-args=\'' + _da(type, i) + '\'>' + (isUpdate ? t("ai.update") : t("ai.accept")) + '</button>';
            h += '<button class="ct-btn ai-btn-ignore" data-click="_aiIgnore" data-args=\'' + _da(i) + '\'>' + t("ai.ignore") + '</button>';
            h += '</div></div>';
        });
        p.body.innerHTML = h;
        // Footer
        p.footer.innerHTML = '<button class="ct-btn ai-btn-all" data-size="sm" data-click="_aiAcceptAll" data-args=\'' + _da(type) + '\'>' + t("ai.accept_all") + '</button>' +
            '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        // Store suggestions for accept handlers
        window._aiSuggestions = suggestions;
        window._aiAcceptFn = acceptFn;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // ACCEPT HANDLERS — insert or update suggestions in D
    // ═══════════════════════════════════════════════════════════════════════
    // Check if an ID exists in the corresponding D array for a given type
    function _aiIdExists(type, id) {
        var arrays = { vm: D.vm, bs: D.bs, er: D.er, pp: D.pp, ss: D.ss, measures: D.measures, eco: D.measures };
        var arr = arrays[type];
        if (!arr)
            return false;
        return arr.some(function (e) { return e.id === id; });
    }
    /** FEAT-40 — fusionne une description existante et son enrichissement.
     *  Concaténer plutôt que remplacer : le travail de rédaction déjà fait ne
     *  doit pas disparaître parce que le modèle a proposé un complément. */
    function _mergeDetails(ancien, ajout) {
        var a = (ancien || "").trim();
        var b = (ajout || "").trim();
        if (!a)
            return b;
        if (!b || a.indexOf(b) !== -1)
            return a;
        return a + "\n\n" + b;
    }
    // Helper: find existing element by ID in an array, update its fields, return true if found
    function _updateIfExists(arr, s, fields) {
        if (!s.id)
            return false;
        var existing = arr.find(function (e) { return e.id === s.id; });
        if (!existing)
            return false;
        fields.forEach(function (f) {
            if (s[f] !== undefined && s[f] !== "")
                existing[f] = s[f];
        });
        return true;
    }
    var ACCEPT_HANDLERS = {
        vm: function (s) {
            if (_updateIfExists(D.vm, s, ["nom", "nature", "description", "responsable"]))
                return s.id + " ✓";
            var id = nextId("vm");
            D.vm.push({ id: id, nom: s.nom || "", nature: s.nature || "", description: s.description || "", responsable: s.responsable || "" });
            return id;
        },
        bs: function (s) {
            if (_updateIfExists(D.bs, s, ["nom", "type", "vm", "localisation", "proprietaire"]))
                return s.id + " ✓";
            var id = nextId("bs");
            D.bs.push({ id: id, nom: s.nom || "", type: s.type || "", vm: s.vm || "", localisation: s.localisation || "", proprietaire: s.proprietaire || "" });
            return id;
        },
        er: function (s) {
            var maxG = D.gravity_scale.length > 0 ? Number(D.gravity_scale[0].niveau) : 4;
            if (s.gravite_cat && typeof s.gravite_cat === "object") {
                var gc = {};
                ["financier", "reputation", "reglementaire", "donnees_perso", "operationnel"].forEach(function (k) {
                    var n = parseInt(s.gravite_cat[k]);
                    if (n >= 1 && n <= maxG)
                        gc[k] = n;
                });
                s.gravite_cat = gc;
                var vals = Object.keys(gc).map(function (k) { return gc[k]; });
                if (vals.length)
                    s.gravite = Math.max.apply(null, vals);
            }
            if (_updateIfExists(D.er, s, ["evenement", "vm", "dict", "impacts", "gravite", "gravite_cat"]))
                return s.id + " ✓";
            var id = nextId("er");
            var obj = { id: id, evenement: s.evenement || "", vm: s.vm || "", dict: s.dict || "", impacts: s.impacts || "", gravite: s.gravite || "" };
            if (s.gravite_cat)
                obj.gravite_cat = s.gravite_cat;
            D.er.push(obj);
            return id;
        },
        pp: function (s) {
            if (_updateIfExists(D.pp, s, ["nom", "categorie", "type", "dependance", "penetration", "maturite", "confiance", "bs"]))
                return s.id + " ✓";
            var id = nextId("pp");
            D.pp.push({ id: id, nom: s.nom || "", categorie: s.categorie || "", type: s.type || "", dependance: s.dependance || "", penetration: s.penetration || "", maturite: s.maturite || "", confiance: s.confiance || "", bs: s.bs || "" });
            // Auto-create eco entry for this PP
            var ppRef = id + " - " + (s.nom || "");
            if (!D.eco.some(function (e) { return (e.pp_id || "").split(" - ")[0].trim() === id; })) {
                D.eco.push({ pp_id: ppRef, mesures_existantes: "", mesures_complementaires: "", categorie: "",
                    dep_resid: s.dependance || "", pen_resid: s.penetration || "", mat_resid: s.maturite || "", conf_resid: s.confiance || "" });
            }
            return id;
        },
        srov: function (s) {
            // May need to add new SR/OV first
            if (s._newSR) {
                s._newSR.forEach(function (sr) {
                    if (!D.sr_list.some(function (x) { return x.id === sr.id; })) {
                        D.sr_list.push({ id: sr.id, nom: sr.nom });
                    }
                });
            }
            if (s._newOV) {
                s._newOV.forEach(function (ov) {
                    if (!D.ov_list.some(function (x) { return x.id === ov.id; })) {
                        D.ov_list.push({ id: ov.id, nom: ov.nom });
                    }
                });
            }
            var couple = s.sr_id + "/" + s.ov_id;
            D.srov.push({ couple: couple, sr_id: s.sr_id, ov_id: s.ov_id, motivation: s.motivation || 0, ressources: s.ressources || 0, activite: s.activite || 0, justification: s.justification || "" });
            return couple;
        },
        ss: function (s) {
            if (_updateIfExists(D.ss, s, ["scenario", "couple_id", "couple_desc", "pp", "bs", "er"]))
                return s.id + " ✓";
            var id = nextId("ss");
            D.ss.push({ id: id, scenario: s.scenario || "", couple_id: s.couple_id || "", couple_desc: s.couple_desc || "", pp: s.pp || "", bs: s.bs || "", er: s.er || "" });
            return id;
        },
        sop: function (s) {
            // s has {ss, phases:[...]}
            // Pas la longueur du tableau : apres une suppression elle redonne un
            // identifiant deja pris, et les phases proposees s'ajoutent alors a un
            // SOP existant au lieu d'en creer un nouveau.
            var sopId = nextSopId();
            D.sop_summary.push({ sop: sopId, ss: s.ss });
            (s.phases || []).forEach(function (p) {
                var mesureRef = "";
                // FEAT-40 — réutiliser AVANT de créer. Ce handler créait une mesure
                // pour CHAQUE phase faible : générer un SOP pour un second scénario
                // aux phases voisines dupliquait le plan à chaque fois, avec en
                // prime une description vide.
                if (p.mesure_existante_id) {
                    var deja = D.measures.find(function (m) { return m.id === p.mesure_existante_id; });
                    if (deja) {
                        // « Ajustée » : la mesure couvre la phase PARTIELLEMENT et
                        // reçoit un complément. Concaténé, jamais substitué — même
                        // règle que l'enrichissement des autres panneaux.
                        if (p.mesure_ajustement) {
                            deja.details = _mergeDetails(deja.details || "", p.mesure_ajustement);
                        }
                        // Titre corrigé si l'élargissement rend l'existant inexact.
                        // Les références figées ailleurs ("M-01 - libellé") doivent
                        // alors être rafraîchies, sinon l'ancien libellé survit
                        // dans les exports.
                        var nt = (p.mesure_titre || "").trim();
                        if (nt && nt !== deja.mesure) {
                            deja.mesure = nt;
                            if (typeof propagateNameChange === "function") {
                                propagateNameChange(deja.id, nt);
                            }
                        }
                        mesureRef = deja.id + " - " + deja.mesure;
                    }
                }
                // Sinon seulement, on crée.
                if (!mesureRef && (p.efficacite === "Absent" || p.efficacite === "Partiel") && p.mesure_proposee) {
                    var mId = nextId("measures");
                    D.measures.push({ id: mId, mesure: p.mesure_proposee, details: "", origine: "SOP", type: "Prévention",
                        sop: sopId, phase: _attackResolveId(p.phase) || (p.phase || ""), effet: "", ref_socle: p.ref || "", responsable: "", echeance: "", cout: "", statut: "À étudier" });
                    mesureRef = mId + " - " + p.mesure_proposee;
                }
                var phase = _attackResolveId(p.phase) || (p.phase || "");
                D.sop_detail.push({ sop: sopId, ss: s.ss, phase: phase, action: p.action || "", bs: p.bs || "", controle: p.controle || "", ref: p.ref || "", efficacite: p.efficacite || "Absent", commentaire: "", mesure_proposee: mesureRef, type_mesure: "" });
            });
            return sopId;
        },
        measures: function (s) {
            // FEAT-40 — enrichir NE DOIT PAS écraser. _updateIfExists remplace
            // champ par champ : appliqué tel quel à un enrichissement il détruit
            // ce qu'il est censé étendre — la description déjà rédigée, et le
            // champ `sop`, qui est une chaîne SIMPLE : enrichir une mesure pour
            // couvrir un SOP de plus effacerait le SOP d'origine, soit exactement
            // le geste que la feature sert.
            if (s.action === "enrich" && s.id) {
                var cible = D.measures.find(function (m) { return m.id === s.id; });
                if (cible) {
                    if (s.details)
                        cible.details = _mergeDetails(cible.details || "", s.details);
                    // Le titre n'est ajusté que si le modèle en propose un AUTRE :
                    // c'est sous ce libellé que la mesure est connue dans le plan
                    // d'action et les rapports. Et il faut alors rafraîchir les
                    // références stockées ("M-01 - libellé" figé par _csvAppendRef),
                    // sinon l'ancien libellé survit dans les exports.
                    if (s.mesure && s.mesure.trim() && s.mesure.trim() !== cible.mesure) {
                        cible.mesure = s.mesure.trim();
                        if (typeof propagateNameChange === "function") {
                            propagateNameChange(cible.id, cible.mesure);
                        }
                    }
                    // `origine`, `sop`, `phase` ne sont PAS touchés : un
                    // enrichissement ajoute, il ne déplace pas.
                    ["type", "effet", "ref_socle", "responsable"].forEach(function (f) {
                        if (!cible[f] && s[f])
                            cible[f] = s[f];
                    });
                    _persist("measures");
                    return s.id + " ✓";
                }
                // id inventé par le modèle : on retombe sur une création plutôt
                // que de perdre la suggestion.
            }
            if (s.action !== "enrich" && s.action !== "complement"
                && _updateIfExists(D.measures, s, ["mesure", "details", "origine", "type", "sop", "phase", "effet", "ref_socle", "responsable"]))
                return s.id + " ✓";
            var id = nextId("measures");
            var details = s.details || "";
            // « complément » : la mesure complétée est NOMMÉE dans la description,
            // sinon le lien se perd dès que la carte disparaît.
            if (s.action === "complement" && s.complete_id) {
                var base = D.measures.find(function (m) { return m.id === s.complete_id; });
                if (base)
                    details = t("ai.measure.completes", { id: s.complete_id, nom: base.mesure }) + "\n\n" + details;
            }
            D.measures.push({ id: id, mesure: s.mesure || "", details: details, origine: s.origine || "Complémentaire", type: s.type || "", sop: s.sop || "", phase: s.phase || "", effet: s.effet || "", ref_socle: s.ref_socle || "", responsable: s.responsable || "", echeance: "", cout: "", statut: "À étudier" });
            return id;
        }
    };
    // Re-render only the relevant panel (avoids page switch from renderAll)
    var TYPE_RENDER = {
        vm: "renderVM", bs: "renderBS", er: "renderER", pp: "renderPP",
        srov: "renderSROV", ss: "renderSS", sop: "renderSOP", measures: "renderMeasures"
    };
    function _aiRerender(type) {
        var fn = TYPE_RENDER[type];
        if (fn && typeof window[fn] === "function")
            window[fn]();
        // When PP changes, also refresh eco (auto-populates D.eco from D.pp)
        if (type === "pp" && typeof renderEco === "function")
            renderEco();
        if (typeof renderIndicators === "function")
            renderIndicators();
    }
    // Check if all cards are gone and show completion + restart option
    function _checkEmptyPanel() {
        var p = _aiEnsurePanel();
        if (p.body.querySelectorAll(".ai-card").length > 0)
            return;
        p.body.innerHTML = '<div style="text-align:center;padding:var(--ct-s5) var(--ct-s4);color:var(--ct-ink-2)">' +
            '<div class="ct-text-page ct-mb-2">✓</div>' +
            '<div class="ct-text-data ct-mb-2">' + t("ai.all_done") + '</div>' +
            '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-all" data-size="sm" data-click="_aiRestart">' + t("ai.generate_more") + '</button>' +
            '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
    // Restart the full AI flow for the current type (goes back to the initial prompt panel)
    window._aiRestart = function () {
        if (_lastSuggestType === "_aiGenSOP" || _lastSuggestType === "suggestFor") {
            // Re-open the initial suggestFor panel which shows SS selector for SOP, or prompt panel for others
            var type = _lastSuggestType === "_aiGenSOP" ? "sop" : (_lastSuggestArgs ? _lastSuggestArgs[0] : null);
            if (type) {
                suggestFor(type);
                return;
            }
        }
        _aiClosePanel();
    };
    // Store last call context for regeneration
    var _lastSuggestType = null;
    var _lastSuggestArgs = null;
    var _extraContext = "";
    window._aiIgnore = function (idx) {
        var card = document.getElementById("ai-card-" + idx);
        if (card)
            card.remove();
        _checkEmptyPanel();
    };
    window._aiRegenerate = function () {
        var ctx = document.getElementById("ai-extra-context");
        _extraContext = ctx ? ctx.value.trim() : "";
        if (_lastSuggestType && _lastSuggestArgs) {
            var fn = window[_lastSuggestType];
            if (typeof fn === "function")
                fn.apply(null, _lastSuggestArgs);
        }
    };
    window._aiAccept = function (type, idx) {
        var s = window._aiSuggestions[idx];
        if (!s)
            return;
        _saveState();
        var handler = ACCEPT_HANDLERS[type];
        if (handler) {
            var id = handler(s);
            showStatus(t("ai.added", { id: id }));
        }
        var card = document.getElementById("ai-card-" + idx);
        if (card)
            card.remove();
        _autoSave();
        _aiRerender(type);
        _checkEmptyPanel();
    };
    window._aiAcceptAll = function (type) {
        _saveState();
        var handler = ACCEPT_HANDLERS[type];
        if (!handler)
            return;
        var count = 0, differes = 0;
        (window._aiSuggestions || []).forEach(function (s, i) {
            if (!document.getElementById("ai-card-" + i))
                return;
            // « Tout accepter » ne CRÉE que. Une suggestion qui ÉCRIT dans une
            // mesure existante (enrich, complement) exige d'avoir vu son
            // avant/après — c'est le seul contrôle qui protège d'une injection
            // de prompt : un texte hostile stocké dans une mesure (un plan
            // d'action saisi par un fournisseur, par exemple) peut pousser le
            // modèle à renvoyer un `enrich` sur une mesure sans rapport.
            if (s && (s.action === "enrich" || s.action === "complement")) {
                differes++;
                return;
            }
            handler(s);
            count++;
        });
        showStatus(differes
            ? t("ai.added_count_partial", { count: count, differes: differes })
            : t("ai.added_count", { count: count }));
        _autoSave();
        _aiRerender(type);
        _aiClosePanel();
    };
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN HANDLER — called by suggest buttons
    // ═══════════════════════════════════════════════════════════════════════
    async function suggestFor(type) {
        if (AI_PANELS.indexOf(type) === -1) {
            alert(t("ai.no_prompt", { type: type }));
            return;
        }
        var labels = {
            vm: t("ai.label.vm"), bs: t("ai.label.bs"), er: t("ai.label.er"),
            srov: t("ai.label.srov"), pp: t("ai.label.pp"), ss: t("ai.label.ss"),
            sop: t("ai.label.sop"), eco: t("ai.label.eco"), measures: t("ai.label.measures"), residuals: t("ai.label.residuals"),
            socle: t("ai.label.socle")
        };
        _lastSuggestType = "suggestFor";
        _lastSuggestArgs = [type];
        // SOP: show SS selector first
        if (type === "sop") {
            if (D.ss.length === 0) {
                alert(t("ai.no_ss"));
                return;
            }
            var p = _aiEnsurePanel();
            _aiOpenPanel("✨ " + labels.sop);
            // Ce panneau ne passe pas par l'écran d'options : la case est posée
            // ici, avant le choix du scénario, donc lisible au clic.
            var h = _measureCtxToggleHTML("sop");
            h += '<div class="ct-py-2 ct-px-0 ct-text-data ct-strong ct-mb-2">' + t("ai.select_ss") + '</div>';
            D.ss.forEach(function (s) {
                h += '<div class="ai-card ct-clickable" data-click="_aiGenSOP" data-args=\'' + _da(s.id) + '\'>';
                h += '<div class="ai-card-title">' + esc(s.id + " — " + s.scenario) + '</div>';
                h += '</div>';
            });
            p.body.innerHTML = h;
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
            return;
        }
        // Residuals: show SS selector first, then prompt panel
        if (type === "residuals") {
            if (D.ss.length === 0) {
                alert(t("ai.no_ss"));
                return;
            }
            var p = _aiEnsurePanel();
            _aiOpenPanel("✨ " + t("ai.label.residuals"));
            var h = '<p class="fs-sm ct-mb-3 ct-muted">' + t("ai.prompt_intro") + '</p>';
            // Ce panneau ne passe pas par l'écran d'options générique : la case y
            // est posée ici, avant la sélection du scénario, donc lisible au clic.
            h += _measureCtxToggleHTML("residuals");
            h += '<div class="settings-label fs-sm ct-mb-2">' + t("ai.select_ss") + '</div>';
            D.ss.forEach(function (s, i) {
                h += '<div class="ai-card ct-clickable" data-click="_aiResidualForSS" data-args=\'' + _da(i) + '\'>';
                h += '<div class="ai-card-title">' + esc(s.id + " — " + s.scenario) + '</div>';
                h += '</div>';
            });
            h += '<div style="margin-top:var(--ct-s4);border-top:1px solid var(--ct-line);padding-top:12px">';
            h += '<div class="settings-label fs-sm ct-mb-1">' + t("ai.custom_instruction_label") + '</div>';
            h += '<textarea id="ai-custom-instruction" class="w-full ct-bordered ct-r-md ct-p-2 ct-text-meta ct-resize-y" rows="3" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>';
            h += '<button class="ct-btn ai-btn-accept ct-journal-body ct-p-2 ct-text-data ct-mt-2 ct-bg-accent" data-variant="primary" data-click="_aiRunSuggest" data-args=\'' + _da(type, "__custom__") + '\'>' + t("ai.send_instruction") + '</button>';
            h += '</div>';
            p.body.innerHTML = h;
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
            return;
        }
        // Show prompt panel — user chooses between auto-suggest or custom instruction
        var panelTitle = "✨ " + (labels[type] || type);
        var pp = _aiEnsurePanel();
        _aiOpenPanel(panelTitle);
        pp.body.innerHTML =
            '<p class="fs-sm ct-mb-4 ct-muted">' + t("ai.prompt_intro") + '</p>' +
                _measureCtxToggleHTML(type) +
                '<button class="ct-btn ai-btn-accept ct-w-full ct-p-2 ct-text-data ct-mb-4" data-variant="primary" data-click="_aiRunSuggest" data-args=\'' + _da(type, "") + '\'>' + t("ai.auto_suggest") + '</button>' +
                '<div class="settings-label fs-sm ct-mb-1">' + t("ai.custom_instruction_label") + '</div>' +
                '<textarea id="ai-custom-instruction" class="w-full ct-bordered ct-r-md ct-p-2 ct-text-meta ct-resize-y" rows="4" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>' +
                '<button class="ct-btn ai-btn-accept ct-journal-body ct-p-2 ct-text-data ct-mt-2 ct-bg-accent" data-variant="primary" data-click="_aiRunSuggest" data-args=\'' + _da(type, "__custom__") + '\'>' + t("ai.send_instruction") + '</button>';
        pp.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        return;
    }
    // FEAT-40 — l'option « inclure les mesures existantes ».
    //
    // Cochée par défaut : le cas normal est de ne pas vouloir de doublon.
    // L'option sert l'exception — plan volumineux et modèle à petite fenêtre,
    // démarrage d'analyse où le plan est vide, ou exploration délibérée sans
    // être bridé par l'existant.
    //
    // Elle ne s'affiche que sur les panneaux qui proposent des mesures.
    // Panneaux qui affichent l'écran d'options AVANT de lancer. Les boutons IA
    // « en ligne » (socle_row, eco_row, sop_row) s'exécutent d'un clic, sans
    // écran intermédiaire : pas de case à cocher pour eux, ils gardent le
    // défaut — mesures incluses.
    // Le panneau SOP se lance en deux temps (choix du scénario, puis mode) :
    // la case n'existe plus au moment de l'appel, on retient donc sa valeur.
    var _aiSopIncludeMeasures = true;
    var MEASURE_PANELS = ["measures", "socle", "eco", "residuals", "sop"];
    function _measureCtxToggleHTML(type) {
        if (MEASURE_PANELS.indexOf(type) === -1)
            return "";
        return '<label class="ct-flex ct-items-start ct-gap-2 ct-mb-4 ct-clickable">'
            + '<input type="checkbox" id="ai-include-measures" class="ct-mt-1" checked>'
            + '<span class="fs-sm"><strong>' + esc(t("ai.include_measures")) + '</strong>'
            + '<br><span class="ct-muted">' + esc(t("ai.include_measures_help")) + '</span></span>'
            + '</label>';
    }
    /** Lu au moment de l'appel : la case peut avoir disparu du DOM (panneau
     *  remplacé par l'écran de chargement), auquel cas on garde le défaut. */
    function _includeMeasures() {
        var el = document.getElementById("ai-include-measures");
        return el ? el.checked : true;
    }
    // Internal: actually run the suggestion after the prompt panel
    window._aiRunSuggest = async function (type, mode) {
        var labels = {
            vm: t("ai.label.vm"), bs: t("ai.label.bs"), er: t("ai.label.er"),
            srov: t("ai.label.srov"), pp: t("ai.label.pp"), ss: t("ai.label.ss"),
            sop: t("ai.label.sop"), eco: t("ai.label.eco"), measures: t("ai.label.measures"), residuals: t("ai.label.residuals"),
            socle: t("ai.label.socle")
        };
        _lastSuggestType = "suggestFor";
        _lastSuggestArgs = [type];
        // Read textarea BEFORE replacing the panel content
        var userText = "";
        if (mode === "__custom__") {
            var textarea = document.getElementById("ai-custom-instruction");
            userText = textarea ? textarea.value.trim() : "";
        }
        // Lu AVANT que _aiShowLoading ne remplace le panneau : après, la case
        // n'est plus dans le DOM et on retomberait silencieusement sur le défaut.
        var avecMesures = _includeMeasures();
        _aiShowLoading("✨ " + (labels[type] || type));
        // Mode personnalisé : le serveur conserve les données et le schéma du
        // panneau et remplace la seule instruction automatique (FEAT-41 —
        // build_prompt/custom_instruction reproduit la découpe que faisait
        // _aiPromptContext / _aiPromptSchema ici même).
        if (mode === "__custom__") {
            if (!userText) {
                _aiClosePanel();
                return;
            }
            try {
                var cResult = await _callAI({ panel: type, custom: userText, includeMeasures: avecMesures });
                _renderCards(type, _normalizeSuggestions(type, cResult), ACCEPT_HANDLERS[type]);
            }
            catch (e) {
                var cp = _aiEnsurePanel();
                cp.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
                cp.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
            }
            return;
        }
        // Mode automatique
        if (AI_PANELS.indexOf(type) === -1)
            return;
        try {
            var result = await _callAI({ panel: type, includeMeasures: avecMesures });
            var suggestions = _normalizeSuggestions(type, result);
            _renderCards(type, suggestions, ACCEPT_HANDLERS[type]);
        }
        catch (e) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    window.suggestFor = suggestFor;
    // SOP generation after SS selection — show prompt panel
    /** FEAT-40 — ce que la phase fera de sa mesure : réutiliser, ou créer.
     *  Le panneau SOP n'a pas d'action `enrich` (son schéma est par phase, pas par
     *  mesure) : la réutilisation s'y exprime par `mesure_existante_id`. Sans
     *  affichage dédié, elle était indiscernable d'une création. */
    function _sopMeasureCellHTML(ph) {
        if (ph && ph.mesure_existante_id) {
            var m = D.measures.find(function (x) { return x.id === ph.mesure_existante_id; });
            if (m) {
                // Réutilisée telle quelle, ou réutilisée AVEC un complément : les
                // deux touchent une mesure existante, mais la seconde la modifie.
                // Les confondre masquerait une écriture derrière une simple
                // référence.
                var ajout = ph.mesure_ajustement
                    ? _detailsAddition(m.details || "", ph.mesure_ajustement) : "";
                var nouveauTitre = (ph.mesure_titre || "").trim();
                var titreChange = nouveauTitre && nouveauTitre !== m.mesure;
                if (ajout || titreChange) {
                    var c = '<span class="ct-text-high ct-strong">&#9998; ' + esc(t("ai.sop.adjusted")) + '</span>';
                    c += titreChange
                        ? '<br><span class="ct-muted"><s>' + esc(m.id + " — " + m.mesure) + '</s></span>'
                            + '<br><span class="ct-strong">' + esc(m.id + " — " + nouveauTitre) + '</span>'
                        : '<br><span class="ct-muted">' + esc(m.id + " — " + m.mesure) + '</span>';
                    if (ajout)
                        c += '<br><span class="ct-text-ok">+ ' + esc(ajout) + '</span>';
                    return c;
                }
                return '<span class="ct-text-ok ct-strong">&#8635; ' + esc(t("ai.sop.reused")) + '</span>'
                    + '<br><span class="ct-muted">' + esc(m.id + " — " + m.mesure) + '</span>';
            }
            // Identifiant inconnu : le handler retombera sur une création, on le dit.
            return '<span class="ct-text-high">' + esc(t("ai.sop.unknown_measure", { id: ph.mesure_existante_id })) + '</span>';
        }
        if (ph && ph.mesure_proposee) {
            return '<span class="ct-text-high ct-strong">+ ' + esc(t("ai.sop.new")) + '</span>'
                + '<br><span class="ct-muted">' + esc(ph.mesure_proposee) + '</span>';
        }
        return '<span class="ct-muted">—</span>';
    }
    window._aiGenSOP = function (ssId) {
        // Lu MAINTENANT : le panneau va être remplacé par le sélecteur de mode.
        _aiSopIncludeMeasures = _includeMeasures();
        _lastSuggestType = "_aiGenSOP";
        _lastSuggestArgs = [ssId];
        var ssLabel = (D.ss.find(function (s) { return s.id === ssId; }) || {}).scenario || ssId;
        var p = _aiEnsurePanel();
        _aiOpenPanel("✨ SOP — " + ssId);
        p.body.innerHTML =
            '<p class="fs-sm ct-mb-2 ct-muted">' + esc(ssLabel) + '</p>' +
                '<p class="fs-sm ct-mb-4 ct-muted">' + t("ai.prompt_intro") + '</p>' +
                '<button class="ct-btn ai-btn-accept ct-w-full ct-p-2 ct-text-data ct-mb-4" data-variant="primary" data-click="_aiRunSOP" data-args=\'' + _da(ssId, "") + '\'>' + t("ai.auto_suggest") + '</button>' +
                '<div class="settings-label fs-sm ct-mb-1">' + t("ai.custom_instruction_label") + '</div>' +
                '<textarea id="ai-custom-instruction" class="w-full ct-bordered ct-r-md ct-p-2 ct-text-meta ct-resize-y" rows="4" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>' +
                '<button class="ct-btn ai-btn-accept ct-journal-body ct-p-2 ct-text-data ct-mt-2 ct-bg-accent" data-variant="primary" data-click="_aiRunSOP" data-args=\'' + _da(ssId, "__custom__") + '\'>' + t("ai.send_instruction") + '</button>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    };
    // SOP generation — actually run the API call
    window._aiRunSOP = async function (ssId, mode) {
        var userText = "";
        if (mode === "__custom__") {
            var textarea = document.getElementById("ai-custom-instruction");
            userText = textarea ? textarea.value.trim() : "";
            if (!userText)
                return;
        }
        _lastSuggestType = "_aiGenSOP";
        _lastSuggestArgs = [ssId];
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p class="ct-mt-3">' + t("ai.generating_sop", { id: ssId }) + '</p></div>';
        p.footer.innerHTML = "";
        try {
            // Un scénario stratégique inconnu est refusé par le serveur (422),
            // qui seul connaît l'analyse en base.
            var result = await _callAI({ panel: "sop", ssId: ssId, custom: userText || undefined,
                includeMeasures: _aiSopIncludeMeasures });
            // Render as a single SOP card with phases listed
            var suggestions;
            if (result.phases) {
                result._title = "SOP — " + ssId + " — " + (D.ss.find(function (s) { return s.id === ssId; }) || {}).scenario;
                suggestions = [result];
            }
            else if (Array.isArray(result)) {
                suggestions = result.map(function (r) { r._title = "SOP — " + ssId; return r; });
            }
            else {
                suggestions = [result];
            }
            // Custom card rendering for SOP (show phases as a compact table)
            var h = "";
            suggestions.forEach(function (sop, i) {
                h += '<div class="ai-card" id="ai-card-' + i + '">';
                h += '<div class="ai-card-title">' + esc(sop._title || "SOP") + '</div>';
                if (sop.phases && sop.phases.length) {
                    h += '<table style="width:100%;font-size:var(--ct-text-label);border-collapse:collapse;margin:var(--ct-s1) 0">';
                    h += '<tr class="ct-bg-info-tint"><th class="ct-py-1 ct-px-1 ct-ta-l">Phase</th><th class="ct-py-1 ct-px-1 ct-ta-l">Action</th><th class="ct-py-1 ct-px-1 ct-ta-l">BS</th><th class="ct-py-1 ct-px-1 ct-ta-l">Eff.</th><th class="ct-py-1 ct-px-1 ct-ta-l">' + t("ai.sop.measure_col") + '</th></tr>';
                    sop.phases.forEach(function (ph) {
                        var effColor = ph.efficacite === "Efficace" ? "#27ae60" : ph.efficacite === "Partiel" ? "#f39c12" : "#e74c3c";
                        h += '<tr class="ct-border-bottom">';
                        h += '<td class="ct-py-1 ct-px-1 ct-nowrap">' + esc(_attackLabel(ph.phase) || "") + '</td>';
                        h += '<td class="ct-p-1">' + esc(ph.action || "") + '</td>';
                        h += '<td class="ct-py-1 ct-px-1 ct-nowrap">' + esc((ph.bs || "").split(" - ")[0]) + '</td>';
                        h += '<td style="padding:3px 6px;color:' + effColor + ';font-weight:600">' + esc(ph.efficacite || "Absent") + '</td>';
                        // FEAT-40 — sans cette colonne, réutiliser une mesure
                        // existante ou en inventer une produisait exactement le
                        // même affichage : l'anti-doublon était invisible.
                        h += '<td class="ct-py-1 ct-px-1">' + _sopMeasureCellHTML(ph) + '</td>';
                        h += '</tr>';
                    });
                    h += '</table>';
                }
                h += '<div class="ai-card-actions">';
                h += '<button class="ct-btn ai-btn-accept" data-variant="primary" data-click="_aiAccept" data-args=\'' + _da("sop", i) + '\'>' + t("ai.accept") + '</button>';
                h += '<button class="ct-btn ai-btn-ignore" data-click="_aiIgnore" data-args=\'' + _da(i) + '\'>' + t("ai.ignore") + '</button>';
                h += '</div></div>';
            });
            p.body.innerHTML = h;
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
            window._aiSuggestions = suggestions;
        }
        catch (e) {
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    // ═══════════════════════════════════════════════════════════════════════
    // INLINE MEASURE SUGGESTIONS (socle, eco, sop)
    // ═══════════════════════════════════════════════════════════════════════
    // Suggest measures for a specific socle gap
    window.suggestSocleMeasure = async function (socleIdx) {
        _lastSuggestType = "suggestSocleMeasure";
        _lastSuggestArgs = [socleIdx];
        var isAnssi = D.socle_type !== "iso";
        var section = isAnssi ? "socle_anssi" : "socle_iso";
        var entry = D[section][socleIdx];
        if (!entry)
            return;
        var ref = isAnssi ? "#" + entry.num : entry.ref;
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        _aiShowLoading("✨ " + t("ai.label.measures") + " — " + ref);
        try {
            var result = await _callAI({ panel: "socle_row", row: socleIdx });
            var suggestions = Array.isArray(result) ? result : [result];
            // Add context for accept handler
            suggestions.forEach(function (s) {
                s._socleIdx = socleIdx;
                s._ref = ref;
                s._title = s.mesure;
            });
            _renderCards("socle_measure", suggestions);
            window._aiSuggestions = suggestions;
        }
        catch (e) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    // Suggest measures for a specific PP in ecosystem
    window.suggestEcoMeasure = async function (ecoIdx) {
        _lastSuggestType = "suggestEcoMeasure";
        _lastSuggestArgs = [ecoIdx];
        var entry = D.eco[ecoIdx];
        if (!entry)
            return;
        var ppId = (entry.pp_id || "").split(" - ")[0].trim();
        var ppNom = (entry.pp_id || "").split(" - ").slice(1).join(" - ").trim();
        var pp = D.pp.find(function (p) { return p.id === ppId; });
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        _aiShowLoading("✨ " + t("ai.label.measures") + " — " + (ppNom || ppId));
        try {
            var result = await _callAI({ panel: "eco_row", row: ecoIdx });
            var suggestions = Array.isArray(result) ? result : [result];
            suggestions.forEach(function (s) {
                s._ecoIdx = ecoIdx;
                s._ppId = ppId;
                s._ppNom = ppNom;
                s._title = s.mesure;
            });
            _renderCards("eco_measure", suggestions);
            window._aiSuggestions = suggestions;
        }
        catch (e) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    // Suggest measure for a specific SOP phase
    window.suggestSOPMeasure = async function (sopIdx) {
        _lastSuggestType = "suggestSOPMeasure";
        _lastSuggestArgs = [sopIdx];
        var entry = D.sop_detail[sopIdx];
        if (!entry)
            return;
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        _aiShowLoading("✨ " + t("ai.label.measures") + " — " + (entry.sop || "") + " " + (_attackLabel(entry.phase) || ""));
        try {
            var result = await _callAI({ panel: "sop_row", row: sopIdx });
            var suggestions = Array.isArray(result) ? result : [result];
            suggestions.forEach(function (s) {
                s._sopIdx = sopIdx;
                s._sop = entry.sop;
                s._phase = entry.phase;
                s._title = s.mesure;
            });
            _renderCards("sop_measure", suggestions);
            window._aiSuggestions = suggestions;
        }
        catch (e) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    // Accept handlers for inline measure suggestions
    ACCEPT_HANDLERS.eco = function (s) {
        var ppRef = s.pp_id || "";
        var ppId = ppRef.split(" - ")[0].trim();
        var ppNom = ppRef.split(" - ").slice(1).join(" - ").trim();
        var reutilise = _reuseMeasure(s, function (mid, lib) { _linkEcoRef(ppId, mid, lib); });
        if (reutilise)
            return reutilise + " ✓";
        var id = nextId("measures");
        D.measures.push({ id: id, mesure: s.mesure || "", details: _complementPrefix(s) + (s.details || ""), origine: "Écosystème", type: s.type || "",
            sop: "", phase: "", effet: t("ebios.m.mesure_eco_pour", { pp: ppNom || ppId }),
            ref_socle: "", responsable: s.responsable || "", echeance: "", cout: "", statut: "À étudier" });
        _linkEcoRef(ppId, id, s.mesure);
        return id;
    };
    /** Rattache une mesure à la fiche écosystème de la partie prenante `ppId`. */
    function _linkEcoRef(ppId, mid, libelle) {
        var i = D.eco.findIndex(function (e) { return (e.pp_id || "").split(" - ")[0].trim() === ppId; });
        if (i < 0)
            return;
        var cur = D.eco[i].mesures_complementaires || "";
        if (cur.indexOf(mid + " - ") === -1) {
            D.eco[i].mesures_complementaires = _csvAppendRef(cur, mid, libelle);
        }
    }
    // General socle accept handler — used by the page-level IA button. The
    // suggestion carries the baseline ref it targets (s.ref_socle); we match
    // it back to the right row in socle_anssi / socle_iso to keep the
    // mesures_prevues column in sync.
    /** FEAT-40 — l'issue « réutiliser » commune à TOUS les handlers de mesure.
     *
     *  Rend l'id de la mesure existante quand la suggestion demande de l'enrichir,
     *  après y avoir écrit ; rend "" quand il faut créer. Les handlers l'appellent
     *  AVANT de créer, sinon le prompt demande `enrich` et le handler fabrique
     *  quand même un doublon — à partir d'un fragment de description, ce qui est
     *  pire que l'état d'origine.
     *
     *  `rattacher(id, libelle)` relie la mesure réutilisée à l'élément traité
     *  (ligne de socle, PP, phase SOP) : sans cet effet visible, accepter ne
     *  produit rien et l'utilisateur recrée la mesure à la main.
     */
    function _reuseMeasure(s, rattacher) {
        if (!s || s.action !== "enrich" || !s.id)
            return "";
        var cible = D.measures.find(function (m) { return m.id === s.id; });
        if (!cible)
            return ""; // id inventé : l'appelant crée, plutôt que perdre la suggestion
        if (s.details)
            cible.details = _mergeDetails(cible.details || "", s.details);
        var nt = (s.mesure || "").trim();
        if (nt && nt !== cible.mesure) {
            cible.mesure = nt;
            if (typeof propagateNameChange === "function")
                propagateNameChange(cible.id, nt);
        }
        ["type", "effet", "ref_socle", "responsable"].forEach(function (f) {
            if (!cible[f] && s[f])
                cible[f] = s[f];
        });
        if (rattacher)
            rattacher(cible.id, cible.mesure);
        _persist("measures");
        return cible.id;
    }
    /** Préfixe de description pour une mesure créée EN COMPLÉMENT d'une autre. */
    function _complementPrefix(s) {
        if (!s || s.action !== "complement" || !s.complete_id)
            return "";
        var base = D.measures.find(function (m) { return m.id === s.complete_id; });
        return base ? t("ai.measure.completes", { id: s.complete_id, nom: base.mesure }) + "\n\n" : "";
    }
    ACCEPT_HANDLERS.socle = function (s) {
        var refSocle = s.ref_socle || "";
        var lier = function (mid, lib) { _linkSocleRef(refSocle, mid, lib); };
        var reutilise = _reuseMeasure(s, lier);
        if (reutilise)
            return reutilise + " ✓";
        var id = nextId("measures");
        D.measures.push({ id: id, mesure: s.mesure || "", details: _complementPrefix(s) + (s.details || ""), origine: "Socle", type: s.type || "Prévention",
            sop: "", phase: "", effet: t("ebios.m.renforcement_socle", { ref: refSocle }),
            ref_socle: refSocle, responsable: s.responsable || "", echeance: "", cout: "", statut: "À étudier" });
        _linkSocleRef(refSocle, id, s.mesure);
        return id;
    };
    /** Rattache une mesure à la ligne de socle portant `refSocle`. */
    function _linkSocleRef(refSocle, mid, libelle) {
        var isAnssi = D.socle_type !== "iso";
        var section = isAnssi ? "socle_anssi" : "socle_iso";
        var socle = D[section] || [];
        var idx = socle.findIndex(function (e) {
            return (isAnssi ? ("#" + e.num) : e.ref) === refSocle;
        });
        if (idx >= 0) {
            var cur = socle[idx].mesures_prevues || "";
            if (cur.indexOf(mid + " - ") === -1) {
                socle[idx].mesures_prevues = _csvAppendRef(cur, mid, libelle);
            }
        }
    }
    ACCEPT_HANDLERS.socle_measure = function (s) {
        var lierLigne = function (mid, lib) {
            var sec = D.socle_type !== "iso" ? "socle_anssi" : "socle_iso";
            var row = D[sec][s._socleIdx];
            if (row && (row.mesures_prevues || "").indexOf(mid + " - ") === -1) {
                row.mesures_prevues = _csvAppendRef(row.mesures_prevues || "", mid, lib);
            }
        };
        var reutilise = _reuseMeasure(s, lierLigne);
        if (reutilise)
            return reutilise + " ✓";
        var id = nextId("measures");
        var isAnssi = D.socle_type !== "iso";
        var section = isAnssi ? "socle_anssi" : "socle_iso";
        var socle = D[section];
        var refNum = s._ref || "";
        D.measures.push({ id: id, mesure: s.mesure || "", details: _complementPrefix(s) + (s.details || ""), origine: "Socle", type: s.type || "Prévention",
            sop: "", phase: "", effet: t("ebios.m.renforcement_socle", { ref: refNum }),
            ref_socle: refNum, responsable: s.responsable || "", echeance: "", cout: "", statut: "En cours" });
        // Link to socle entry
        if (socle[s._socleIdx]) {
            var cur = socle[s._socleIdx].mesures_prevues || "";
            socle[s._socleIdx].mesures_prevues = _csvAppendRef(cur, id, s.mesure);
        }
        return id;
    };
    ACCEPT_HANDLERS.eco_measure = function (s) {
        var lierEco = function (mid, lib) {
            var e = D.eco[s._ecoIdx];
            if (e && (e.mesures_complementaires || "").indexOf(mid + " - ") === -1) {
                e.mesures_complementaires = _csvAppendRef(e.mesures_complementaires || "", mid, lib);
            }
        };
        var reutilise = _reuseMeasure(s, lierEco);
        if (reutilise)
            return reutilise + " ✓";
        var id = nextId("measures");
        D.measures.push({ id: id, mesure: s.mesure || "", details: _complementPrefix(s) + (s.details || ""), origine: "Écosystème", type: s.type || "Prévention",
            sop: "", phase: "", effet: t("ebios.m.mesure_eco_pour", { pp: s._ppNom || s._ppId }),
            ref_socle: s.ref_socle || "", responsable: s.responsable || "", echeance: "", cout: "", statut: "À étudier" });
        // Link to eco entry
        if (D.eco[s._ecoIdx]) {
            var cur = D.eco[s._ecoIdx].mesures_complementaires || "";
            D.eco[s._ecoIdx].mesures_complementaires = _csvAppendRef(cur, id, s.mesure);
        }
        return id;
    };
    ACCEPT_HANDLERS.sop_measure = function (s) {
        var lierPhase = function (mid, lib) {
            var d = D.sop_detail[s._sopIdx];
            if (d && (d.mesure_proposee || "").indexOf(mid + " - ") === -1) {
                d.mesure_proposee = _csvAppendRef(d.mesure_proposee || "", mid, lib);
            }
        };
        var reutilise = _reuseMeasure(s, lierPhase);
        if (reutilise)
            return reutilise + " ✓";
        var id = nextId("measures");
        D.measures.push({ id: id, mesure: s.mesure || "", details: _complementPrefix(s) + (s.details || ""), origine: "SOP", type: s.type || "Prévention",
            sop: s._sop || "", phase: s._phase || "", effet: s.effet || "",
            ref_socle: s.ref_socle || "", responsable: s.responsable || "", echeance: "", cout: "", statut: "À étudier" });
        // Link to SOP phase
        if (D.sop_detail[s._sopIdx]) {
            var cur = D.sop_detail[s._sopIdx].mesure_proposee || "";
            D.sop_detail[s._sopIdx].mesure_proposee = _csvAppendRef(cur, id, s.mesure);
        }
        return id;
    };
    // ── Residual risk: suggest measures + likelihood for a specific SS ──
    window.suggestResidualMeasures = async function (ssIdx, avecMesures) {
        if (!_aiIsEnabled())
            return;
        var ss = D.ss[ssIdx];
        if (!ss)
            return;
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        var gNum = computeSSGravity(ss.er);
        var vInitMap = _ssVInit();
        var vInit = vInitMap[ss.id] || 0;
        var res = D.residuals[ssIdx] || {};
        // Collect existing measures and SOP details for this SS
        var sopPhases = D.sop_detail.filter(function (d) { return d.ss === ss.id; });
        var weakPhases = sopPhases.filter(function (d) { return d.efficacite === "Absent" || d.efficacite === "Partiel"; });
        var existingMeasures = D.measures.map(function (m) { return { id: m.id, mesure: m.mesure, origine: m.origine, type: m.type, statut: m.statut }; });
        var currentLinked = (res.mesures || "").split(",").map(function (s) { return s.trim().split(" - ")[0].trim(); }).filter(Boolean);
        _aiShowLoading("✨ " + ss.id + " — " + t("ebios.col.r_mesures"));
        try {
            var result = await _callAI({ panel: "residual_ss", row: ssIdx,
                includeMeasures: avecMesures !== false });
            // Normalize field names
            // Parse and render
            var p = _aiEnsurePanel();
            _aiOpenPanel("✨ " + ss.id + " — " + ss.scenario);
            var h = '';
            // Selected existing measures (with checkboxes)
            if (result.selected_measures && result.selected_measures.length > 0) {
                h += '<div class="settings-label ct-mb-1">' + t("ai.residual.selected") + '</div>';
                result.selected_measures.forEach(function (mId, i) {
                    var m = D.measures.find(function (x) { return x.id === mId; });
                    if (m) {
                        h += '<label class="ct-flex ct-items-start ct-gap-2 ct-py-1 ct-px-0 ct-border-bottom ct-clickable">';
                        h += '<input class="ai-resid-check ct-mt-1" type="checkbox" checked data-mid="' + esc(mId) + '">';
                        h += '<div><strong>' + esc(mId) + '</strong> — ' + esc(m.mesure);
                        if (m.details)
                            h += '<div class="fs-xs text-muted ct-mt-1">' + esc(m.details).substring(0, 120) + '</div>';
                        h += '</div></label>';
                    }
                });
            }
            // New measures to create (with checkboxes)
            if (result.new_measures && result.new_measures.length > 0) {
                h += '<div class="settings-label ct-mt-3 ct-mb-1">' + t("ai.residual.new_measures") + '</div>';
                result.new_measures.forEach(function (m, i) {
                    h += '<div class="ai-card" id="ai-residual-new-' + i + '">';
                    h += '<label class="ct-flex ct-items-start ct-gap-2 ct-clickable">';
                    h += '<input class="ai-resid-new-check ct-mt-1" type="checkbox" checked data-idx="' + i + '">';
                    h += '<div><div class="ai-card-title ct-mb-1">' + esc(m.mesure) + '</div>';
                    if (m.details)
                        h += '<div class="ai-card-details">' + esc(m.details) + '</div>';
                    if (m.responsable)
                        h += '<div class="ai-card-meta">' + t("ai.residual.owner") + ' : ' + esc(m.responsable) + '</div>';
                    // FEAT-40 — accepter cette carte peut ÉCRIRE dans une mesure
                    // existante (via _reuseMeasure) : c'était le seul endroit où
                    // cela se faisait sans badge ni aperçu avant/après.
                    if (m.action === "enrich" && m.id && D.measures.some(function (x) { return x.id === m.id; })) {
                        h += '<div class="ct-text-label ct-text-high ct-strong ct-mt-1">&#9998; ' + t("ai.update_existing", { id: esc(m.id) }) + '</div>';
                        h += _enrichPreviewHTML(m);
                    }
                    h += '</div></label></div>';
                });
            }
            // Proposed residual likelihood
            if (result.v_resid) {
                var proposedRisk = riskLevel(gNum, result.v_resid);
                var proposedColor = riskColor(proposedRisk);
                h += '<div class="settings-label ct-mt-3 ct-mb-1">' + t("ai.residual.proposed_v") + '</div>';
                h += '<div class="ai-card"><div class="ct-flex ct-items-center ct-gap-3">';
                h += '<span class="ct-text-section ct-bold">V' + result.v_resid + '</span>';
                h += badge(proposedRisk, proposedColor);
                h += '</div>';
                if (result.justification)
                    h += '<div class="ai-card-details ct-mt-2">' + esc(result.justification) + '</div>';
                h += '</div>';
            }
            p.body.innerHTML = h;
            // Store for accept
            window._aiResidualResult = result;
            window._aiResidualSSIdx = ssIdx;
            p.footer.innerHTML = '<button class="ct-btn ai-btn-accept" data-variant="primary" data-click="_aiAcceptResidual">' + t("ai.accept") + '</button>' +
                '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
        catch (e) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", { msg: esc(e.message) }) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
    };
    window._aiResidualForSS = function (ssIdx) {
        // Lu MAINTENANT : suggestResidualMeasures remplace aussitôt le panneau.
        window.suggestResidualMeasures(ssIdx, _includeMeasures());
    };
    window._aiAcceptResidual = function () {
        var result = window._aiResidualResult;
        var ssIdx = window._aiResidualSSIdx;
        if (!result)
            return;
        _saveState();
        // 1. Link selected existing measures (only checked ones)
        var checkedMIds = [];
        document.querySelectorAll(".ai-resid-check:checked").forEach(function (cb) {
            checkedMIds.push(cb.getAttribute("data-mid"));
        });
        if (checkedMIds.length > 0) {
            var currentMesures = (D.residuals[ssIdx] || {}).mesures || "";
            var linked = currentMesures.split(",").map(function (s) { return s.trim().split(" - ")[0].trim(); }).filter(Boolean);
            checkedMIds.forEach(function (mId) {
                if (linked.indexOf(mId) === -1) {
                    var m = D.measures.find(function (x) { return x.id === mId; });
                    if (m) {
                        currentMesures = _csvAppendRef(currentMesures, mId, m.mesure);
                    }
                }
            });
            if (!D.residuals[ssIdx])
                D.residuals[ssIdx] = {};
            D.residuals[ssIdx].mesures = currentMesures;
        }
        // 2. Create new measures (only checked ones)
        var checkedNewIdxs = [];
        document.querySelectorAll(".ai-resid-new-check:checked").forEach(function (cb) {
            checkedNewIdxs.push(parseInt(cb.getAttribute("data-idx")));
        });
        if (result.new_measures) {
            result.new_measures.forEach(function (nm, i) {
                // Décochée = AUCUNE écriture. `_reuseMeasure` écrivait dans la
                // mesure existante (fusion de details, renommage) AVANT ce test :
                // décocher la carte ne bloquait que la création, pas
                // l'enrichissement — une écriture sans consentement.
                if (checkedNewIdxs.indexOf(i) === -1)
                    return; // skip unchecked
                // FEAT-40 — ce panneau propose aussi des mesures NEUVES à côté de
                // celles qu'il sélectionne. Sans ce court-circuit, un `enrich`
                // renvoyé par le modèle devenait une mesure de plus, construite à
                // partir d'un simple incrément de description.
                var reutilise = _reuseMeasure(nm, function (mid, lib) {
                    var r = D.residuals[ssIdx] || (D.residuals[ssIdx] = {});
                    if ((r.mesures || "").indexOf(mid + " - ") === -1) {
                        r.mesures = _csvAppendRef(r.mesures || "", mid, lib);
                    }
                });
                if (reutilise)
                    return;
                var id = nextId("measures");
                D.measures.push({ id: id, mesure: nm.mesure || "", details: _complementPrefix(nm) + (nm.details || ""), origine: "Complémentaire", type: nm.type || "Prévention",
                    sop: "", phase: "", effet: "", ref_socle: "", responsable: nm.responsable || "", echeance: "", cout: "", statut: "En cours" });
                // Link to residual
                if (!D.residuals[ssIdx])
                    D.residuals[ssIdx] = {};
                var cur = D.residuals[ssIdx].mesures || "";
                D.residuals[ssIdx].mesures = _csvAppendRef(cur, id, nm.mesure);
            });
        }
        // 3. Set proposed v_resid
        if (result.v_resid) {
            if (!D.residuals[ssIdx])
                D.residuals[ssIdx] = {};
            D.residuals[ssIdx].v_resid = result.v_resid;
            D.residuals[ssIdx].decision = D.residuals[ssIdx].decision || "Réduire";
        }
        _autoSave();
        _aiClosePanel();
        renderResiduals();
        renderMeasures();
        renderSynthesis();
        showStatus(t("ai.residual.accepted"));
    };
    // Re-render map for inline measure types
    TYPE_RENDER.socle = "renderSocle";
    TYPE_RENDER.socle_measure = "renderSocle";
    TYPE_RENDER.eco = "renderEco";
    TYPE_RENDER.eco_measure = "renderEco";
    TYPE_RENDER.sop_measure = "renderSOP";
    TYPE_RENDER.residuals = "renderResiduals";
    // ═══════════════════════════════════════════════════════════════════════
    // INJECTION — wrap render functions to add AI buttons
    // ═══════════════════════════════════════════════════════════════════════
    var RENDER_MAP = {
        renderVM: "vm", renderBS: "bs", renderER: "er",
        renderPP: "pp", renderSROV: "srov", renderSS: "ss",
        renderMeasures: "measures", renderResiduals: "residuals"
        // renderSocle, renderEco, renderSOP are wrapped separately (with inline AI buttons)
    };
    function _addToggleAIBtn(type) {
        var toggles = document.getElementById("toggles-" + type);
        if (!toggles)
            return;
        var existing = toggles.querySelector(".btn-ai");
        if (existing)
            existing.remove();
        if (!_aiIsEnabled())
            return;
        var btn = document.createElement("button");
        btn.className = "ct-btn btn-ai";
        btn.setAttribute("data-size", "xs");
        btn.textContent = t("ai.btn");
        btn.setAttribute("data-click", "suggestFor");
        btn.setAttribute("data-args", JSON.stringify([type]));
        toggles.style.display = "flex";
        toggles.style.alignItems = "center";
        toggles.style.gap = "8px";
        toggles.appendChild(btn);
    }
    function _addInlineAIBtns(tableId, fnName, argPrefix) {
        if (!_aiIsEnabled())
            return;
        var table = document.getElementById(tableId);
        if (!table)
            return;
        var rows = table.querySelectorAll("tbody tr");
        rows.forEach(function (row, i) {
            // Ancrer sur l'action et non sur une classe de style : .btn-add-sm a
            // disparu avec la migration ct-*, ce qui faisait disparaitre ce bouton.
            var addBtn = row.querySelector('[data-click="' + fnName.replace(/^suggest/, "add") + '"]');
            if (!addBtn)
                return;
            // Skip if already has AI btn
            if (addBtn.parentElement.querySelector(".btn-ai"))
                return;
            var aiBtn = document.createElement("button");
            aiBtn.className = "ct-btn btn-ai";
            aiBtn.setAttribute("data-size", "xs");
            aiBtn.textContent = "\u2728";
            aiBtn.title = t("ai.btn");
            aiBtn.style.marginLeft = "4px";
            aiBtn.setAttribute("data-click", fnName);
            aiBtn.setAttribute("data-args", JSON.stringify([argPrefix !== undefined ? argPrefix + i : i]));
            addBtn.parentElement.appendChild(aiBtn);
        });
    }
    function _injectButtons() {
        for (var fnName in RENDER_MAP) {
            (function (fn, type) {
                var orig = window[fn];
                if (!orig || orig._aiWrapped)
                    return;
                window[fn] = function () {
                    orig.apply(this, arguments);
                    _addToggleAIBtn(type);
                    // Inject inline AI buttons for measure suggestions
                    if (fn === "renderSocle" || fn === "renderSOP") {
                        // renderSocle wraps socle_anssi or socle_iso tables
                        // The socle table may use different IDs
                    }
                };
                window[fn]._aiWrapped = true;
            })(fnName, RENDER_MAP[fnName]);
        }
        // Wrap renderSocle for inline measure AI buttons
        var origSocle = window.renderSocle;
        if (origSocle && !origSocle._aiInlineWrapped) {
            window.renderSocle = function () {
                origSocle.apply(this, arguments);
                _addToggleAIBtn("socle");
                _addInlineAIBtns("socle-table", "suggestSocleMeasure");
            };
            window.renderSocle._aiWrapped = true;
            window.renderSocle._aiInlineWrapped = true;
        }
        // Wrap renderEco for inline measure AI buttons
        var origEco = window.renderEco;
        if (origEco && !origEco._aiInlineWrapped) {
            window.renderEco = function () {
                origEco.apply(this, arguments);
                _addToggleAIBtn("eco");
                _addInlineAIBtns("eco-table", "suggestEcoMeasure");
            };
            window.renderEco._aiWrapped = true;
            window.renderEco._aiInlineWrapped = true;
        }
        // Wrap renderSOP for inline measure AI buttons
        var origSOP = window.renderSOP;
        if (origSOP && !origSOP._aiInlineWrapped) {
            window.renderSOP = function () {
                origSOP.apply(this, arguments);
                _addToggleAIBtn("sop");
                _addInlineAIBtns("sop-table", "suggestSOPMeasure");
            };
            window.renderSOP._aiWrapped = true;
            window.renderSOP._aiInlineWrapped = true;
        }
        // renderResiduals is wrapped via RENDER_MAP above (adds the toggle AI button)
    }
    // ═══════════════════════════════════════════════════════════════════════
    // EBIOS-specific CSS (app-specific styles only, not in ai_common.js)
    // ═══════════════════════════════════════════════════════════════════════
    var style = document.createElement("style");
    style.textContent = [
        ".ai-card-field { font-size:0.8em; color:var(--ct-ink-2); margin-bottom:3px; }",
        ".ai-card-field strong { color:var(--ct-ink); }",
        ".ai-loading { text-align:center; padding:40px 20px; color:var(--ct-ink-2); }",
        ".ai-loading .spinner { display:inline-block; width:32px; height:32px; border:3px solid var(--ct-line); border-top-color:#667eea; border-radius:50%; animation:ai-spin 0.8s linear infinite; }"
    ].join("\n");
    document.head.appendChild(style);
    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════
    function _initAI() {
        _injectButtons();
        // Trigger re-render to inject buttons
        if (typeof renderAll === "function") {
            try {
                renderAll();
            }
            catch (e) { }
        }
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", _initAI);
    }
    else {
        _initAI();
    }
})();
