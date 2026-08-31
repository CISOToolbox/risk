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

(function() {
"use strict";

// ── Alias locaux des fonctions partagées exposées via window par ai_common.js /
// ct_settings.js (les decls générées ne les déclarent que sur Window).
// ai_common.js est chargé avant ce fichier (ordre des <script> dans index.html).
var _aiIsEnabled = window._aiIsEnabled!;
var _aiCallAPI = window._aiCallAPI!;
var _aiParseJSON = window._aiParseJSON!;
var _aiEnsurePanel = window._aiEnsurePanel!;
var _aiClosePanel = window._aiClosePanel!;
var _aiShowLoading = window._aiShowLoading!;
// Décl gen ct-core/ai_common : _aiOpenPanel?: () => void — la vraie signature accepte un titre.
var _aiOpenPanel = window._aiOpenPanel as unknown as (title?: string) => void;
var openSettings = window.openSettings!;

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
// PROMPT BUILDERS (one per panel type)
// ═══════════════════════════════════════════════════════════════════════

var PROMPTS: Record<string, (arg?: any) => { user: string } | null> = {
    vm: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) + "\n\nExisting business assets (VM): " + JSON.stringify(D.vm.map(function(v) { return {id:v.id, nom:v.nom, nature:v.nature}; })) +
                "\n\nPropose 3-5 additional business assets (VM) that are missing for this organization. Consider the sector, activities, and regulatory context. You may also suggest updates to existing VMs by including their id." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"id":"VM-XX (only if updating existing)","nom":"...","nature":"Information|Processus","description":"...","responsable":"..."}]'
        };
    },
    bs: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nBusiness assets: " + JSON.stringify(D.vm.map(function(v) { return {id:v.id, nom:v.nom}; })) +
                "\n\nExisting supporting assets: " + JSON.stringify(D.bs.map(function(b) { return {id:b.id, nom:b.nom, type:b.type, vm:b.vm}; })) +
                "\n\nPropose 3-5 additional supporting assets (BS) missing to support these business assets. Include type and which VMs they support (use VM IDs). You may also suggest updates to existing BSs by including their id." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"id":"BS-XX (only if updating existing)","nom":"...","type":"...","vm":"VM-01 - Name, VM-02 - Name","localisation":"...","proprietaire":"..."}]'
        };
    },
    er: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        var maxG = D.gravity_scale.length > 0 ? D.gravity_scale[0].niveau : 4;
        var byCat = !!(D.context && D.context.gravite_par_categorie);
        var base = "Context: " + JSON.stringify(D.context) +
            "\n\nBusiness assets: " + JSON.stringify(D.vm.map(function(v) { return {id:v.id, nom:v.nom}; })) +
            "\n\nExisting feared events: " + JSON.stringify(D.er.map(function(e) { return {id:e.id, evenement:e.evenement, vm:e.vm, gravite:e.gravite}; }));
        var common = "\n\nPropose 3-5 additional feared events (ER) for business assets not yet covered or with missing DICT dimensions. Specify the VM (using ID - Name format), DICT criteria and impacts. To update an existing ER, include its id field." +
            "\n\nRespond in " + (lang === "fr" ? "French" : "English") + ".";
        if (byCat) {
            var scale = D.gravity_scale.map(function(g) { return {niveau:g.niveau, label:g.label, financier:g.impact_financier||"", reputation:g.impact_reputation||"", reglementaire:g.impact_reglementaire||"", donnees_perso:g.impact_donnees_perso||"", operationnel:g.impact_operationnel||""}; });
            return { user: base +
                "\n\nSeverity is assessed PER CATEGORY across five impact criteria: financier, reputation, reglementaire, donnees_perso, operationnel. Severity scale per category (level 1 to " + maxG + ", with the meaning of each level): " + JSON.stringify(scale) +
                "\n\nFor each feared event, give a level from 1 to " + maxG + " for every category in gravite_cat (the overall severity is the maximum of the five)." + common +
                '\n\nJSON schema: [{"id":"ER-XX (only if updating existing)","evenement":"...","vm":"VM-01 - Name","dict":"D|I|C|T","impacts":"...","gravite_cat":{"financier":1-' + maxG + ',"reputation":1-' + maxG + ',"reglementaire":1-' + maxG + ',"donnees_perso":1-' + maxG + ',"operationnel":1-' + maxG + '}}]'
            };
        }
        return { user: base +
            "\n\nGravity scale: 1 (low) to " + maxG + " (critical). Specify a single severity." + common +
            '\n\nJSON schema: [{"id":"ER-XX (only if updating existing)","evenement":"...","vm":"VM-01 - Name","dict":"D|I|C|T","impacts":"...","gravite":1-' + maxG + '}]'
        };
    },
    srov: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nBusiness assets: " + JSON.stringify(D.vm.map(function(v) { return {id:v.id, nom:v.nom}; })) +
                "\n\nExisting risk origins (SR): " + JSON.stringify(D.sr_list.map(function(s) { return {id:s.id, nom:s.nom}; })) +
                "\n\nExisting target objectives (OV): " + JSON.stringify(D.ov_list.map(function(s) { return {id:s.id, nom:s.nom}; })) +
                "\n\nExisting RO/TO pairs: " + JSON.stringify(D.srov.map(function(s) { return {couple:s.couple, sr_id:s.sr_id, ov_id:s.ov_id, motivation:s.motivation, ressources:s.ressources, activite:s.activite}; })) +
                "\n\nPropose 3-5 additional RO/TO pairs that are missing. You may suggest new risk origins (SR) or target objectives (OV) if needed. Score Motivation/Resources/Activity from 0 to 4. Include a detailed justification for each pair. Use existing SR/OV IDs when possible, and include the name (sr_nom, ov_nom) for clarity." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: {"new_sr":[{"id":"SR-XX","nom":"..."}], "new_ov":[{"id":"OV-XX","nom":"..."}], "pairs":[{"sr_id":"SR-XX","sr_nom":"name of the risk origin","ov_id":"OV-XX","ov_nom":"name of the target objective","motivation":0-4,"ressources":0-4,"activite":0-4,"justification":"detailed justification (2-3 sentences)"}]}'
        };
    },
    pp: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nSupporting assets: " + JSON.stringify(D.bs.map(function(b) { return {id:b.id, nom:b.nom, type:b.type}; })) +
                "\n\nExisting stakeholders: " + JSON.stringify(D.pp.map(function(p) { return {id:p.id, nom:p.nom, type:p.type}; })) +
                "\n\nPropose 3-5 additional stakeholders (PP) in the ecosystem. Only EXTERNAL actors (suppliers, partners, clients). Assess Dependency/Penetration/Maturity/Trust from 1 to 4. Link to relevant BS (using ID - Name format)." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"id":"PP-XX (only if updating existing)","nom":"...","type":"Fournisseur|Partenaire|Client","dependance":1-4,"penetration":1-4,"maturite":1-4,"confiance":1-4,"bs":"BS-01 - Name"}]'
        };
    },
    ss: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nRO/TO pairs (P1+P2): " + JSON.stringify(D.srov.filter(function(s) { return (Number(s.motivation) || 0) + (Number(s.ressources) || 0) + (Number(s.activite) || 0) > 4; }).map(function(s) { return {couple:s.couple, sr_id:s.sr_id, ov_id:s.ov_id}; })) +
                "\n\nStakeholders: " + JSON.stringify(D.pp.map(function(p) { return {id:p.id, nom:p.nom}; })) +
                "\n\nSupporting assets: " + JSON.stringify(D.bs.map(function(b) { return {id:b.id, nom:b.nom}; })) +
                "\n\nFeared events: " + JSON.stringify(D.er.map(function(e) { return {id:e.id, evenement:e.evenement, vm:e.vm, gravite:e.gravite}; })) +
                "\n\nExisting strategic scenarios: " + JSON.stringify(D.ss.map(function(s) { return {id:s.id, scenario:s.scenario}; })) +
                "\n\nPropose 2-4 additional strategic scenarios (SS) linking: WHO (RO/TO pair) → THROUGH WHOM (PP) → targeting WHAT (BS) → causing WHICH feared event (ER). Use existing element IDs." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"id":"SS-XX (only if updating existing)","scenario":"...","couple_id":"SR-XX/OV-XX","pp":"PP-01 - Name","bs":"BS-01 - Name","er":"ER-01 - Name"}]'
        };
    },
    sop: function(ssId?: string) {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        var targetSS = D.ss.find(function(s) { return s.id === ssId; });
        if (!targetSS) return null;
        return {
            user: "Context: " + JSON.stringify({societe: D.context.societe, socle: D.context.socle, reglementation: D.context.reglementation}) +
                "\n\nTarget strategic scenario: " + JSON.stringify({id:targetSS.id, scenario:targetSS.scenario, couple_id:targetSS.couple_id, pp:targetSS.pp, bs:targetSS.bs, er:targetSS.er}) +
                "\n\nSupporting assets: " + JSON.stringify(D.bs.map(function(b) { return {id:b.id, nom:b.nom, type:b.type}; })) +
                "\n\nExisting SOP for this SS: " + JSON.stringify(D.sop_detail.filter(function(d) { return d.ss === ssId; }).map(function(d) { return {phase:d.phase, phase_label:_attackLabel(d.phase), action:d.action, bs:d.bs}; })) +
                "\n\nPropose a kill chain (SOP) for this strategic scenario. Use the step-by-step method (proche en proche): entry point → lateral movement → target. Keep it concise: 4-6 key phases maximum. Set each phase to the MITRE ATT&CK tactic id that best matches it, following the canonical order: TA0043 Reconnaissance, TA0042 Resource Development, TA0001 Initial Access, TA0002 Execution, TA0003 Persistence, TA0004 Privilege Escalation, TA0005 Defense Evasion, TA0006 Credential Access, TA0007 Discovery, TA0008 Lateral Movement, TA0009 Collection, TA0011 Command and Control, TA0010 Exfiltration, TA0040 Impact. Put the specific ATT&CK technique id (TXXXX) in the action description. For phases with Absent or Partiel effectiveness, also propose a security measure (mesure_proposee)." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: {"ss":"' + ssId + '","phases":[{"phase":"TA00XX (ATT&CK tactic id from the list above)","action":"Short description (TXXXX)","bs":"BS-XX - Name","controle":"existing control or empty","ref":"baseline ref or empty","efficacite":"Absent|Partiel|Efficace","mesure_proposee":"proposed security measure or empty"}]}'
        };
    },
    eco: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify({societe: D.context.societe, socle: D.context.socle}) +
                "\n\nStakeholders (PP): " + JSON.stringify(D.pp.map(function(p) { return {id:p.id, nom:p.nom, type:p.type, dependance:p.dependance, penetration:p.penetration, maturite:p.maturite, confiance:p.confiance}; })) +
                "\n\nEcosystem measures already defined: " + JSON.stringify(D.eco.map(function(e) { return {pp:e.pp_id, existantes:e.mesures_existantes, complementaires:e.mesures_complementaires}; })) +
                "\n\nPropose 3-5 ecosystem security measures to reduce the threat level of the most exposed stakeholders. Each measure must target a specific PP (use PP ID - Name format). Include contractual, technical, organizational or monitoring measures. Each measure must have a short name (mesure) and detailed implementation description (details)." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed implementation description","pp_id":"PP-XX - Name","type":"Contractuelle|Technique|Organisationnelle|Surveillance","ref_socle":"baseline reference (#XX for ANSSI or A.X.X for ISO) or empty","responsable":"suggested owner"}]'
        };
    },
    measures: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        var weakPhases = D.sop_detail.filter(function(s) { return s.efficacite === "Absent" || s.efficacite === "Partiel"; });
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nWeak phases (Absent/Partial controls): " + JSON.stringify(weakPhases.map(function(s) { return {sop:s.sop, ss:s.ss, phase:_attackLabel(s.phase), action:s.action, bs:s.bs, efficacite:s.efficacite}; })) +
                "\n\nExisting measures: " + JSON.stringify(D.measures.map(function(m) { return {id:m.id, mesure:m.mesure, origine:m.origine}; })) +
                "\n\nPropose 3-5 security measures to address the weak phases. Prioritize baseline reinforcement, then ecosystem measures, then new complementary measures. Specify type (Prévention/Détection/Réaction), which SOP/phase it addresses, and baseline reference if applicable. Each measure must have a short name (mesure) and a detailed implementation description (details) — do not put the whole description in the mesure field." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed description of the measure","origine":"Socle|Écosystème|SOP|Complémentaire","type":"Prévention|Détection|Réaction","sop":"SOP-XX","phase":"Phase name","effet":"...","ref_socle":"#XX or A.X.X","responsable":"..."}]'
        };
    },
    residuals: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        return {
            user: "Context: " + JSON.stringify(D.context) +
                "\n\nStrategic scenarios: " + JSON.stringify(D.ss.map(function(s) { return {id:s.id, scenario:s.scenario}; })) +
                "\n\nAll measures: " + JSON.stringify(D.measures.map(function(m) { return {id:m.id, mesure:m.mesure, origine:m.origine, statut:m.statut}; })) +
                "\n\nCurrent residuals: " + JSON.stringify(D.residuals) +
                "\n\nPropose treatment improvements for the residual risks." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nRespond with valid JSON.'
        };
    },
    socle: function() {
        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        var isAnssi = D.socle_type !== "iso";
        var section: "socle_anssi" | "socle_iso" = isAnssi ? "socle_anssi" : "socle_iso";
        var entries = D[section] || [];
        // Focus the prompt on entries that are NOT fully conformant (conformite
        // is a 0-100 percentage; 100 = fully covered) and have a documented gap
        // — that's where measures are needed.
        var gaps = entries.filter(function(e) {
            return e.conformite !== 100 && (e.ecart || "").trim() !== "";
        }).slice(0, 40);
        var existing = (D.measures || [])
            .filter(function(m) { return m.origine === "Socle"; })
            .map(function(m) { return {id: m.id, mesure: m.mesure, ref_socle: m.ref_socle}; });
        return {
            user: "Context: " + JSON.stringify({societe: D.context.societe, socle: D.context.socle, reglementation: D.context.reglementation}) +
                "\n\nBaseline framework: " + (isAnssi ? "ANSSI Guide d'hygiène (42 measures)" : "ISO 27001 Annex A") +
                "\n\nBaseline controls with gaps (not fully conformant, with a documented écart): " + JSON.stringify(gaps.map(function(e) {
                    return {
                        ref: isAnssi ? "#" + e.num : e.ref,
                        theme: e.thematique || e.theme || "",
                        mesure: e.mesure,
                        conformite: e.conformite,
                        ecart: e.ecart
                    };
                })) +
                "\n\nExisting baseline measures already planned: " + JSON.stringify(existing) +
                "\n\nPropose 3-5 priority security measures to close the most critical baseline gaps. Target gaps not already covered by an existing measure. Each measure MUST reference the baseline control id it addresses (ref_socle). Each measure must have a short name (mesure) and a detailed implementation description (details) — do not put the whole description in the mesure field." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed description","type":"Prévention|Détection|Réaction","ref_socle":"#XX for ANSSI or A.X.X for ISO","responsable":"suggested owner role"}]'
        };
    }
};

// API key is now managed via openSettings() in ai_common.js
// No separate prompt dialog needed

// ═══════════════════════════════════════════════════════════════════════
// API CALL (wrapper using shared _aiCallAPI)
// ═══════════════════════════════════════════════════════════════════════

async function _callAI(promptObj: { user: string }): Promise<any> {
    if (!_aiIsEnabled()) {
        openSettings();
        return null;
    }
    var userContent = promptObj.user + (_extraContext ? "\n\nAdditional user instruction: " + _extraContext : "");
    _extraContext = ""; // reset after use

    // Backend deployment: the EBIOS RM methodology system prompt is owned
    // server-side. POST the per-panel user prompt to the métier endpoint.
    var resp = await fetch("api/ai/risk/suggest", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userContent })
    });
    if (!resp.ok) {
        var errTxt = await resp.text();
        var detail = errTxt.substring(0, 300);
        // FastAPI error bodies are {"detail":"..."} — surface just the
        // detail message (e.g. a 422 explicit refusal from the backend)
        // so the existing catch in _aiRunSuggest can render it cleanly.
        try { var j = JSON.parse(errTxt); if (j && j.detail) detail = j.detail; } catch (_) {}
        throw new Error(detail);
    }
    var data = await resp.json();
    return data.result;
}

// ═══════════════════════════════════════════════════════════════════════
// SUGGESTION PANEL UI (uses shared panel from ai_common.js)
// ═══════════════════════════════════════════════════════════════════════

// Normalize AI result into an array of suggestions, handling special types (SROV, SOP)
function _normalizeSuggestions(type: string, result: any): any[] {
    if (type === "srov" && result && result.pairs) {
        return result.pairs.map(function(p: any) {
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
    if (Array.isArray(result)) return result;
    return [result];
}

// Fields to hide from cards (internal or verbose)
var _HIDDEN_FIELDS: Record<string, number> = {"_title":1,"_socleIdx":1,"_ref":1,"_ecoIdx":1,"_ppId":1,"_ppNom":1,"_sopIdx":1,"_sop":1,"_phase":1,"_newSR":1,"_newOV":1};
// Fields shown as short summary only (truncated)
var _SUMMARY_FIELDS: Record<string, number> = {"details":1,"description":1,"impacts":1,"effet":1};
// Fields to skip in SROV (shown in custom rendering)
var _SROV_SKIP: Record<string, number> = {"sr_id":1,"ov_id":1,"sr_nom":1,"ov_nom":1,"motivation":1,"ressources":1,"activite":1};

function _renderCards(type: string, suggestions: any[], acceptFn?: (s: any) => string) {
    var p = _aiEnsurePanel();
    if (!suggestions || suggestions.length === 0) {
        p.body.innerHTML = '<div class="ai-error">' + t("ai.no_suggestions") + '</div>';
        return;
    }
    var h = "";
    suggestions.forEach(function(s: any, i: number) {
        if (!s || typeof s !== "object") return;
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
            var pertinence = ((s.motivation||0) + (s.ressources||0) + (s.activite||0));
            h += '<span style="margin-left:auto;font-weight:600;color:' + (pertinence > 7 ? 'var(--ct-critical)' : pertinence > 4 ? 'var(--ct-high)' : 'var(--ct-ink-2)') + '">' + pertinence + '/12</span>';
            h += '</div>';
            if (s.justification) h += '<div class="ai-card-details">' + esc(s.justification) + '</div>';
        } else {
            // Generic rendering
            h += '<div class="ai-card-title">' + esc(s._title || s.nom || s.scenario || s.mesure || s.evenement || ("Suggestion " + (i+1))) + '</div>';
        }

        for (var k in s) {
            if (_HIDDEN_FIELDS[k]) continue;
            if (type === "srov" && (_SROV_SKIP[k] || k === "justification")) continue;
            // Skip the field used as title
            if (k === "nom" || k === "mesure" || k === "scenario" || k === "evenement") {
                if ((s._title || s[k]) === (s._title || "")) continue;
            }
            var v = s[k];
            if (typeof v === "object") v = JSON.stringify(v);
            var val = String(v);
            if (_SUMMARY_FIELDS[k] && val.length > 120) {
                val = val.substring(0, 120) + "…";
            }
            h += '<div class="ai-card-field"><strong>' + esc(k) + ':</strong> ' + esc(val) + '</div>';
        }
        // Detect if this is an update (existing ID) or a new element
        var isUpdate = s.id && _aiIdExists(type, s.id);
        if (isUpdate) {
            h += '<div class="ct-text-label ct-text-high ct-strong ct-mb-1">&#9998; ' + t("ai.update_existing", {id: esc(s.id)}) + '</div>';
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
function _aiIdExists(type: string, id: string) {
    var arrays: Record<string, { id: string }[]> = {vm: D.vm, bs: D.bs, er: D.er, pp: D.pp, ss: D.ss, measures: D.measures, eco: D.measures};
    var arr = arrays[type];
    if (!arr) return false;
    return arr.some(function(e) { return e.id === id; });
}

// Helper: find existing element by ID in an array, update its fields, return true if found
function _updateIfExists(arr: any[], s: any, fields: string[]) {
    if (!s.id) return false;
    var existing = arr.find(function(e: any) { return e.id === s.id; });
    if (!existing) return false;
    fields.forEach(function(f) {
        if (s[f] !== undefined && s[f] !== "") existing[f] = s[f];
    });
    return true;
}

var ACCEPT_HANDLERS: Record<string, (s: any) => string> = {
    vm: function(s: any) {
        if (_updateIfExists(D.vm, s, ["nom","nature","description","responsable"])) return s.id + " ✓";
        var id = nextId("vm");
        D.vm.push({id:id, nom:s.nom||"", nature:s.nature||"", description:s.description||"", responsable:s.responsable||""});
        return id;
    },
    bs: function(s: any) {
        if (_updateIfExists(D.bs, s, ["nom","type","vm","localisation","proprietaire"])) return s.id + " ✓";
        var id = nextId("bs");
        D.bs.push({id:id, nom:s.nom||"", type:s.type||"", vm:s.vm||"", localisation:s.localisation||"", proprietaire:s.proprietaire||""});
        return id;
    },
    er: function(s: any) {
        var maxG = D.gravity_scale.length > 0 ? Number(D.gravity_scale[0].niveau) : 4;
        if (s.gravite_cat && typeof s.gravite_cat === "object") {
            var gc: Record<string, number> = {};
            ["financier","reputation","reglementaire","donnees_perso","operationnel"].forEach(function(k) {
                var n = parseInt(s.gravite_cat[k]); if (n >= 1 && n <= maxG) gc[k] = n;
            });
            s.gravite_cat = gc;
            var vals = Object.keys(gc).map(function(k) { return gc[k]; });
            if (vals.length) s.gravite = Math.max.apply(null, vals);
        }
        if (_updateIfExists(D.er, s, ["evenement","vm","dict","impacts","gravite","gravite_cat"])) return s.id + " ✓";
        var id = nextId("er");
        var obj: EbiosER = {id:id, evenement:s.evenement||"", vm:s.vm||"", dict:s.dict||"", impacts:s.impacts||"", gravite:s.gravite||""};
        if (s.gravite_cat) obj.gravite_cat = s.gravite_cat;
        D.er.push(obj);
        return id;
    },
    pp: function(s: any) {
        if (_updateIfExists(D.pp, s, ["nom","categorie","type","dependance","penetration","maturite","confiance","bs"])) return s.id + " ✓";
        var id = nextId("pp");
        D.pp.push({id:id, nom:s.nom||"", categorie:s.categorie||"", type:s.type||"", dependance:s.dependance||"", penetration:s.penetration||"", maturite:s.maturite||"", confiance:s.confiance||"", bs:s.bs||""});
        // Auto-create eco entry for this PP
        var ppRef = id + " - " + (s.nom || "");
        if (!D.eco.some(function(e) { return (e.pp_id || "").split(" - ")[0].trim() === id; })) {
            D.eco.push({pp_id: ppRef, mesures_existantes: "", mesures_complementaires: "", categorie: "",
                dep_resid: s.dependance || "", pen_resid: s.penetration || "", mat_resid: s.maturite || "", conf_resid: s.confiance || ""});
        }
        return id;
    },
    srov: function(s: any) {
        // May need to add new SR/OV first
        if (s._newSR) {
            s._newSR.forEach(function(sr: any) {
                if (!D.sr_list.some(function(x) { return x.id === sr.id; })) {
                    D.sr_list.push({id: sr.id, nom: sr.nom});
                }
            });
        }
        if (s._newOV) {
            s._newOV.forEach(function(ov: any) {
                if (!D.ov_list.some(function(x) { return x.id === ov.id; })) {
                    D.ov_list.push({id: ov.id, nom: ov.nom});
                }
            });
        }
        var couple = s.sr_id + "/" + s.ov_id;
        D.srov.push({couple:couple, sr_id:s.sr_id, ov_id:s.ov_id, motivation:s.motivation||0, ressources:s.ressources||0, activite:s.activite||0, justification:s.justification||""});
        return couple;
    },
    ss: function(s: any) {
        if (_updateIfExists(D.ss, s, ["scenario","couple_id","couple_desc","pp","bs","er"])) return s.id + " ✓";
        var id = nextId("ss");
        D.ss.push({id:id, scenario:s.scenario||"", couple_id:s.couple_id||"", couple_desc:s.couple_desc||"", pp:s.pp||"", bs:s.bs||"", er:s.er||""});
        return id;
    },
    sop: function(s: any) {
        // s has {ss, phases:[...]}
        // Pas la longueur du tableau : apres une suppression elle redonne un
        // identifiant deja pris, et les phases proposees s'ajoutent alors a un
        // SOP existant au lieu d'en creer un nouveau.
        var sopId = nextSopId();
        D.sop_summary.push({sop: sopId, ss: s.ss});
        (s.phases || []).forEach(function(p: any) {
            var mesureRef = "";
            // If the AI proposed a control for a weak phase, create a measure in the registry
            if ((p.efficacite === "Absent" || p.efficacite === "Partiel") && p.mesure_proposee) {
                var mId = nextId("measures");
                D.measures.push({id:mId, mesure:p.mesure_proposee, details:"", origine:"SOP", type:"Prévention",
                    sop:sopId, phase:_attackResolveId(p.phase) || (p.phase || ""), effet:"", ref_socle:p.ref||"", responsable:"", echeance:"", cout:"", statut:"À étudier"});
                mesureRef = mId + " - " + p.mesure_proposee;
            }
            var phase = _attackResolveId(p.phase) || (p.phase || "");
            D.sop_detail.push({sop:sopId, ss:s.ss, phase:phase, action:p.action||"", bs:p.bs||"", controle:p.controle||"", ref:p.ref||"", efficacite:p.efficacite||"Absent", commentaire:"", mesure_proposee:mesureRef, type_mesure:""});
        });
        return sopId;
    },
    measures: function(s: any) {
        if (_updateIfExists(D.measures, s, ["mesure","details","origine","type","sop","phase","effet","ref_socle","responsable"])) return s.id + " ✓";
        var id = nextId("measures");
        D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:s.origine||"Complémentaire", type:s.type||"", sop:s.sop||"", phase:s.phase||"", effet:s.effet||"", ref_socle:s.ref_socle||"", responsable:s.responsable||"", echeance:"", cout:"", statut:"À étudier"});
        return id;
    }
};

// Re-render only the relevant panel (avoids page switch from renderAll)
var TYPE_RENDER: Record<string, string> = {
    vm: "renderVM", bs: "renderBS", er: "renderER", pp: "renderPP",
    srov: "renderSROV", ss: "renderSS", sop: "renderSOP", measures: "renderMeasures"
};
function _aiRerender(type: string) {
    var fn = TYPE_RENDER[type];
    if (fn && typeof window[fn] === "function") window[fn]();
    // When PP changes, also refresh eco (auto-populates D.eco from D.pp)
    if (type === "pp" && typeof renderEco === "function") renderEco();
    if (typeof renderIndicators === "function") renderIndicators();
}

// Check if all cards are gone and show completion + restart option
function _checkEmptyPanel() {
    var p = _aiEnsurePanel();
    if (p.body.querySelectorAll(".ai-card").length > 0) return;
    p.body.innerHTML = '<div style="text-align:center;padding:var(--ct-s5) var(--ct-s4);color:var(--ct-ink-2)">' +
        '<div class="ct-text-page ct-mb-2">✓</div>' +
        '<div class="ct-text-data ct-mb-2">' + t("ai.all_done") + '</div>' +
        '</div>';
    p.footer.innerHTML = '<button class="ct-btn ai-btn-all" data-size="sm" data-click="_aiRestart">' + t("ai.generate_more") + '</button>' +
        '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
}

// Restart the full AI flow for the current type (goes back to the initial prompt panel)
window._aiRestart = function() {
    if (_lastSuggestType === "_aiGenSOP" || _lastSuggestType === "suggestFor") {
        // Re-open the initial suggestFor panel which shows SS selector for SOP, or prompt panel for others
        var type = _lastSuggestType === "_aiGenSOP" ? "sop" : (_lastSuggestArgs ? _lastSuggestArgs[0] : null);
        if (type) { suggestFor(type); return; }
    }
    _aiClosePanel();
};

// Store last call context for regeneration
var _lastSuggestType: string | null = null;
var _lastSuggestArgs: any[] | null = null;
var _extraContext = "";

window._aiIgnore = function(idx: number) {
    var card = document.getElementById("ai-card-" + idx);
    if (card) card.remove();
    _checkEmptyPanel();
};

window._aiRegenerate = function() {
    var ctx = document.getElementById("ai-extra-context") as HTMLTextAreaElement | null;
    _extraContext = ctx ? ctx.value.trim() : "";
    if (_lastSuggestType && _lastSuggestArgs) {
        var fn = window[_lastSuggestType];
        if (typeof fn === "function") fn.apply(null, _lastSuggestArgs);
    }
};

window._aiAccept = function(type: string, idx: number) {
    var s = window._aiSuggestions![idx];
    if (!s) return;
    _saveState();
    var handler = ACCEPT_HANDLERS[type];
    if (handler) {
        var id = handler(s);
        showStatus(t("ai.added", {id: id}));
    }
    var card = document.getElementById("ai-card-" + idx);
    if (card) card.remove();
    _autoSave();
    _aiRerender(type);
    _checkEmptyPanel();
};

window._aiAcceptAll = function(type: string) {
    _saveState();
    var handler = ACCEPT_HANDLERS[type];
    if (!handler) return;
    var count = 0;
    (window._aiSuggestions || []).forEach(function(s: any, i: number) {
        if (document.getElementById("ai-card-" + i)) {
            handler(s);
            count++;
        }
    });
    showStatus(t("ai.added_count", {count: count}));
    _autoSave();
    _aiRerender(type);
    _aiClosePanel();
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN HANDLER — called by suggest buttons
// ═══════════════════════════════════════════════════════════════════════

async function suggestFor(type: string) {
    var promptBuilder = PROMPTS[type];
    if (!promptBuilder) { alert(t("ai.no_prompt", {type: type})); return; }

    var labels: Record<string, string> = {
        vm: t("ai.label.vm"), bs: t("ai.label.bs"), er: t("ai.label.er"),
        srov: t("ai.label.srov"), pp: t("ai.label.pp"), ss: t("ai.label.ss"),
        sop: t("ai.label.sop"), eco: t("ai.label.eco"), measures: t("ai.label.measures"), residuals: t("ai.label.residuals"),
        socle: t("ai.label.socle")
    };

    _lastSuggestType = "suggestFor";
    _lastSuggestArgs = [type];

    // SOP: show SS selector first
    if (type === "sop") {
        if (D.ss.length === 0) { alert(t("ai.no_ss")); return; }
        var p = _aiEnsurePanel();
        _aiOpenPanel("✨ " + labels.sop);
        var h = '<div class="ct-py-2 ct-px-0 ct-text-data ct-strong ct-mb-2">' + t("ai.select_ss") + '</div>';
        D.ss.forEach(function(s) {
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
        if (D.ss.length === 0) { alert(t("ai.no_ss")); return; }
        var p = _aiEnsurePanel();
        _aiOpenPanel("✨ " + t("ai.label.residuals"));
        var h = '<p class="fs-sm ct-mb-3 ct-muted">' + t("ai.prompt_intro") + '</p>';
        h += '<div class="settings-label fs-sm ct-mb-2">' + t("ai.select_ss") + '</div>';
        D.ss.forEach(function(s, i) {
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
        '<button class="ct-btn ai-btn-accept ct-w-full ct-p-2 ct-text-data ct-mb-4" data-variant="primary" data-click="_aiRunSuggest" data-args=\'' + _da(type, "") + '\'>' + t("ai.auto_suggest") + '</button>' +
        '<div class="settings-label fs-sm ct-mb-1">' + t("ai.custom_instruction_label") + '</div>' +
        '<textarea id="ai-custom-instruction" class="w-full ct-bordered ct-r-md ct-p-2 ct-text-meta ct-resize-y" rows="4" placeholder="' + esc(t("ai.custom_instruction_placeholder")) + '"></textarea>' +
        '<button class="ct-btn ai-btn-accept ct-journal-body ct-p-2 ct-text-data ct-mt-2 ct-bg-accent" data-variant="primary" data-click="_aiRunSuggest" data-args=\'' + _da(type, "__custom__") + '\'>' + t("ai.send_instruction") + '</button>';
    pp.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    return;
}

// Internal: actually run the suggestion after the prompt panel
window._aiRunSuggest = async function(type: string, mode: string) {
    var labels: Record<string, string> = {
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
        var textarea = document.getElementById("ai-custom-instruction") as HTMLTextAreaElement | null;
        userText = textarea ? textarea.value.trim() : "";
    }

    _aiShowLoading("✨ " + (labels[type] || type));

    // Custom mode: use the page-specific prompt but replace the auto instruction with the user's text
    if (mode === "__custom__") {
        if (!userText) { _aiClosePanel(); return; }

        var lang = typeof _locale !== "undefined" ? _locale : "fr";
        // Get the auto prompt to extract all context data, then replace the instruction
        var promptBuilder = PROMPTS[type];
        if (!promptBuilder) return;
        var autoPrompt = promptBuilder();
        if (!autoPrompt) return;
        // Find where the auto instruction starts and replace it
        var contextData = window._aiPromptContext!(autoPrompt.user);
        // Extract the JSON schema from the auto prompt
        var schema = window._aiPromptSchema!(autoPrompt.user);

        var customPrompt = {
            user: contextData +
                "\n\nIMPORTANT: You are working on this specific section of the analysis. You must ONLY propose elements that fit this section." +
                "\n\nUser instruction: " + userText +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                (schema ? "\n\nRespond with valid JSON matching this schema: " + schema : "\n\nRespond with valid JSON.")
        };
        try {
            var result = await _callAI(customPrompt);
            var suggestions = _normalizeSuggestions(type, result);
            _renderCards(type, suggestions, ACCEPT_HANDLERS[type]);
        } catch (e: any) {
            var p = _aiEnsurePanel();
            p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
            p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
        }
        return;
    }

    // Auto mode: use the page-specific prompt builder
    var promptBuilder = PROMPTS[type];
    if (!promptBuilder) return;

    try {
        var promptObj = promptBuilder();
        var result = await _callAI(promptObj as { user: string });

        var suggestions = _normalizeSuggestions(type, result);
        _renderCards(type, suggestions, ACCEPT_HANDLERS[type]);
    } catch (e: any) {
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
}
window.suggestFor = suggestFor;

// SOP generation after SS selection — show prompt panel
window._aiGenSOP = function(ssId: string) {
    _lastSuggestType = "_aiGenSOP";
    _lastSuggestArgs = [ssId];
    var ssLabel = (D.ss.find(function(s){return s.id===ssId;})||{}).scenario || ssId;
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
window._aiRunSOP = async function(ssId: string, mode: string) {
    var userText = "";
    if (mode === "__custom__") {
        var textarea = document.getElementById("ai-custom-instruction") as HTMLTextAreaElement | null;
        userText = textarea ? textarea.value.trim() : "";
        if (!userText) return;
    }

    _lastSuggestType = "_aiGenSOP";
    _lastSuggestArgs = [ssId];
    var p = _aiEnsurePanel();
    p.body.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p class="ct-mt-3">' + t("ai.generating_sop", {id: ssId}) + '</p></div>';
    p.footer.innerHTML = "";
    try {
        var promptObj = PROMPTS.sop(ssId);
        if (!promptObj) throw new Error("Strategic scenario " + ssId + " not found");
        if (userText) {
            // Replace auto instruction with user text, keep context
            var contextData = window._aiPromptContext!(promptObj.user);
            var schema = window._aiPromptSchema!(promptObj.user);
            var lang = typeof _locale !== "undefined" ? _locale : "fr";
            promptObj.user = contextData +
                "\n\nUser instruction: " + userText +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                (schema ? "\n\nRespond with valid JSON matching this schema: " + schema : "");
        }
        var result = await _callAI(promptObj);
        // Render as a single SOP card with phases listed
        var suggestions;
        if (result.phases) {
            result._title = "SOP — " + ssId + " — " + (D.ss.find(function(s){return s.id===ssId;})||{}).scenario;
            suggestions = [result];
        } else if (Array.isArray(result)) {
            suggestions = result.map(function(r: any) { r._title = "SOP — " + ssId; return r; });
        } else {
            suggestions = [result];
        }
        // Custom card rendering for SOP (show phases as a compact table)
        var h = "";
        suggestions.forEach(function(sop: any, i: number) {
            h += '<div class="ai-card" id="ai-card-' + i + '">';
            h += '<div class="ai-card-title">' + esc(sop._title || "SOP") + '</div>';
            if (sop.phases && sop.phases.length) {
                h += '<table style="width:100%;font-size:var(--ct-text-label);border-collapse:collapse;margin:var(--ct-s1) 0">';
                h += '<tr class="ct-bg-info-tint"><th class="ct-py-1 ct-px-1 ct-ta-l">Phase</th><th class="ct-py-1 ct-px-1 ct-ta-l">Action</th><th class="ct-py-1 ct-px-1 ct-ta-l">BS</th><th class="ct-py-1 ct-px-1 ct-ta-l">Eff.</th></tr>';
                sop.phases.forEach(function(ph: any) {
                    var effColor = ph.efficacite === "Efficace" ? "#27ae60" : ph.efficacite === "Partiel" ? "#f39c12" : "#e74c3c";
                    h += '<tr class="ct-border-bottom">';
                    h += '<td class="ct-py-1 ct-px-1 ct-nowrap">' + esc(_attackLabel(ph.phase) || "") + '</td>';
                    h += '<td class="ct-p-1">' + esc(ph.action || "") + '</td>';
                    h += '<td class="ct-py-1 ct-px-1 ct-nowrap">' + esc((ph.bs || "").split(" - ")[0]) + '</td>';
                    h += '<td style="padding:3px 6px;color:' + effColor + ';font-weight:600">' + esc(ph.efficacite || "Absent") + '</td>';
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
    } catch (e: any) {
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
};

// ═══════════════════════════════════════════════════════════════════════
// INLINE MEASURE SUGGESTIONS (socle, eco, sop)
// ═══════════════════════════════════════════════════════════════════════

// Suggest measures for a specific socle gap
window.suggestSocleMeasure = async function(socleIdx: number) {
    _lastSuggestType = "suggestSocleMeasure";
    _lastSuggestArgs = [socleIdx];
    var isAnssi = D.socle_type !== "iso";
    var section = isAnssi ? "socle_anssi" : "socle_iso";
    var entry = D[section][socleIdx];
    if (!entry) return;
    var ref = isAnssi ? "#" + entry.num : entry.ref;
    var lang = typeof _locale !== "undefined" ? _locale : "fr";

    _aiShowLoading("✨ " + t("ai.label.measures") + " — " + ref);
    try {
        var result = await _callAI({
            user: "Context: " + JSON.stringify({societe: D.context.societe, socle: D.context.socle}) +
                "\n\nBaseline control with gap: " + JSON.stringify({ref: ref, theme: entry.thematique || entry.theme, mesure: entry.mesure, conformite: entry.conformite, ecart: entry.ecart}) +
                "\n\nExisting planned measures: " + (entry.mesures_prevues || "none") +
                "\n\nPropose 2-3 concrete security measures to close this gap. Each measure should be actionable and specific to this control." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed description","type":"Prévention|Détection|Réaction","ref_socle":"baseline reference (#XX for ANSSI or A.X.X for ISO) or empty","responsable":"suggested owner role"}]'
        });
        var suggestions = Array.isArray(result) ? result : [result];

        // Add context for accept handler
        suggestions.forEach(function(s: any) {
            s._socleIdx = socleIdx;
            s._ref = ref;
            s._title = s.mesure;
        });
        _renderCards("socle_measure", suggestions);
        window._aiSuggestions = suggestions;
    } catch (e: any) {
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
};

// Suggest measures for a specific PP in ecosystem
window.suggestEcoMeasure = async function(ecoIdx: number) {
    _lastSuggestType = "suggestEcoMeasure";
    _lastSuggestArgs = [ecoIdx];
    var entry = D.eco[ecoIdx];
    if (!entry) return;
    var ppId = (entry.pp_id || "").split(" - ")[0].trim();
    var ppNom = (entry.pp_id || "").split(" - ").slice(1).join(" - ").trim();
    var pp = D.pp.find(function(p) { return p.id === ppId; });
    var lang = typeof _locale !== "undefined" ? _locale : "fr";

    _aiShowLoading("✨ " + t("ai.label.measures") + " — " + (ppNom || ppId));
    try {
        var result = await _callAI({
            user: "Context: " + JSON.stringify({societe: D.context.societe}) +
                "\n\nStakeholder: " + JSON.stringify({id: ppId, nom: ppNom, type: pp ? pp.type : "", dependance: pp ? pp.dependance : "", penetration: pp ? pp.penetration : "", maturite: pp ? pp.maturite : "", confiance: pp ? pp.confiance : ""}) +
                "\n\nExisting ecosystem measures: " + (entry.mesures_existantes || "none") +
                "\n\nAdditional measures already planned: " + (entry.mesures_complementaires || "none") +
                "\n\nPropose 2-3 security measures to reduce the threat level of this stakeholder. Consider contractual, technical, organizational and monitoring measures. Each measure must have a short name (mesure) and a detailed implementation description (details)." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed implementation description (2-3 sentences)","type":"Contractuelle|Technique|Organisationnelle|Surveillance","ref_socle":"baseline reference (#XX for ANSSI or A.X.X for ISO) or empty","responsable":"suggested owner role"}]'
        });
        var suggestions = Array.isArray(result) ? result : [result];

        suggestions.forEach(function(s: any) {
            s._ecoIdx = ecoIdx;
            s._ppId = ppId;
            s._ppNom = ppNom;
            s._title = s.mesure;
        });
        _renderCards("eco_measure", suggestions);
        window._aiSuggestions = suggestions;
    } catch (e: any) {
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
};

// Suggest measure for a specific SOP phase
window.suggestSOPMeasure = async function(sopIdx: number) {
    _lastSuggestType = "suggestSOPMeasure";
    _lastSuggestArgs = [sopIdx];
    var entry = D.sop_detail[sopIdx];
    if (!entry) return;
    var lang = typeof _locale !== "undefined" ? _locale : "fr";

    _aiShowLoading("✨ " + t("ai.label.measures") + " — " + (entry.sop || "") + " " + (_attackLabel(entry.phase) || ""));
    try {
        var result = await _callAI({
            user: "Context: " + JSON.stringify({societe: D.context.societe}) +
                "\n\nSOP phase with weak control: " + JSON.stringify({sop: entry.sop, ss: entry.ss, phase: entry.phase, action: entry.action, bs: entry.bs, controle: entry.controle, efficacite: entry.efficacite}) +
                "\n\nExisting proposed measure: " + (entry.mesure_proposee || "none") +
                "\n\nPropose 2-3 security measures to address this attack phase. Reference MITRE ATT&CK mitigations when relevant." +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: [{"mesure":"short name","details":"detailed description","type":"Prévention|Détection|Réaction","ref_socle":"baseline reference (#XX for ANSSI or A.X.X for ISO) or empty","responsable":"suggested owner role","effet":"expected effect"}]'
        });
        var suggestions = Array.isArray(result) ? result : [result];

        suggestions.forEach(function(s: any) {
            s._sopIdx = sopIdx;
            s._sop = entry.sop;
            s._phase = entry.phase;
            s._title = s.mesure;
        });
        _renderCards("sop_measure", suggestions);
        window._aiSuggestions = suggestions;
    } catch (e: any) {
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
};

// Accept handlers for inline measure suggestions
ACCEPT_HANDLERS.eco = function(s: any) {
    var id = nextId("measures");
    var ppRef = s.pp_id || "";
    var ppId = ppRef.split(" - ")[0].trim();
    var ppNom = ppRef.split(" - ").slice(1).join(" - ").trim();
    D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:"Écosystème", type:s.type||"",
        sop:"", phase:"", effet:t("ebios.m.mesure_eco_pour",{pp:ppNom||ppId}),
        ref_socle:"", responsable:s.responsable||"", echeance:"", cout:"", statut:"À étudier"});
    // Find the eco entry for this PP and link the measure
    var ecoIdx = D.eco.findIndex(function(e) { return (e.pp_id||"").split(" - ")[0].trim() === ppId; });
    if (ecoIdx >= 0) {
        var cur = D.eco[ecoIdx].mesures_complementaires || "";
        D.eco[ecoIdx].mesures_complementaires = _csvAppendRef(cur, id, s.mesure);
    }
    return id;
};

// General socle accept handler — used by the page-level IA button. The
// suggestion carries the baseline ref it targets (s.ref_socle); we match
// it back to the right row in socle_anssi / socle_iso to keep the
// mesures_prevues column in sync.
ACCEPT_HANDLERS.socle = function(s: any) {
    var id = nextId("measures");
    var refSocle = s.ref_socle || "";
    D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:"Socle", type:s.type||"Prévention",
        sop:"", phase:"", effet:t("ebios.m.renforcement_socle",{ref:refSocle}),
        ref_socle:refSocle, responsable:s.responsable||"", echeance:"", cout:"", statut:"À étudier"});
    var isAnssi = D.socle_type !== "iso";
    var section: "socle_anssi" | "socle_iso" = isAnssi ? "socle_anssi" : "socle_iso";
    var socle = D[section] || [];
    var idx = socle.findIndex(function(e) {
        var ref = isAnssi ? ("#" + e.num) : e.ref;
        return ref === refSocle;
    });
    if (idx >= 0) {
        var cur = socle[idx].mesures_prevues || "";
        socle[idx].mesures_prevues = _csvAppendRef(cur, id, s.mesure);
    }
    return id;
};

ACCEPT_HANDLERS.socle_measure = function(s: any) {
    var id = nextId("measures");
    var isAnssi = D.socle_type !== "iso";
    var section = isAnssi ? "socle_anssi" : "socle_iso";
    var socle = D[section];
    var refNum = s._ref || "";
    D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:"Socle", type:s.type||"Prévention",
        sop:"", phase:"", effet:t("ebios.m.renforcement_socle",{ref:refNum}),
        ref_socle:refNum, responsable:s.responsable||"", echeance:"", cout:"", statut:"En cours"});
    // Link to socle entry
    if (socle[s._socleIdx]) {
        var cur = socle[s._socleIdx].mesures_prevues || "";
        socle[s._socleIdx].mesures_prevues = _csvAppendRef(cur, id, s.mesure);
    }
    return id;
};

ACCEPT_HANDLERS.eco_measure = function(s: any) {
    var id = nextId("measures");
    D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:"Écosystème", type:s.type||"Prévention",
        sop:"", phase:"", effet:t("ebios.m.mesure_eco_pour",{pp:s._ppNom||s._ppId}),
        ref_socle:s.ref_socle||"", responsable:s.responsable||"", echeance:"", cout:"", statut:"À étudier"});
    // Link to eco entry
    if (D.eco[s._ecoIdx]) {
        var cur = D.eco[s._ecoIdx].mesures_complementaires || "";
        D.eco[s._ecoIdx].mesures_complementaires = _csvAppendRef(cur, id, s.mesure);
    }
    return id;
};

ACCEPT_HANDLERS.sop_measure = function(s: any) {
    var id = nextId("measures");
    D.measures.push({id:id, mesure:s.mesure||"", details:s.details||"", origine:"SOP", type:s.type||"Prévention",
        sop:s._sop||"", phase:s._phase||"", effet:s.effet||"",
        ref_socle:s.ref_socle||"", responsable:s.responsable||"", echeance:"", cout:"", statut:"À étudier"});
    // Link to SOP phase
    if (D.sop_detail[s._sopIdx]) {
        var cur = D.sop_detail[s._sopIdx].mesure_proposee || "";
        D.sop_detail[s._sopIdx].mesure_proposee = _csvAppendRef(cur, id, s.mesure);
    }
    return id;
};

// ── Residual risk: suggest measures + likelihood for a specific SS ──
window.suggestResidualMeasures = async function(ssIdx: number) {
    if (!_aiIsEnabled()) return;
    var ss = D.ss[ssIdx];
    if (!ss) return;
    var lang = typeof _locale !== "undefined" ? _locale : "fr";
    var gNum = computeSSGravity(ss.er);
    var vInitMap = _ssVInit();
    var vInit = vInitMap[ss.id] || 0;
    var res = D.residuals[ssIdx] || {};

    // Collect existing measures and SOP details for this SS
    var sopPhases = D.sop_detail.filter(function(d) { return d.ss === ss.id; });
    var weakPhases = sopPhases.filter(function(d) { return d.efficacite === "Absent" || d.efficacite === "Partiel"; });
    var existingMeasures = D.measures.map(function(m) { return {id:m.id, mesure:m.mesure, origine:m.origine, type:m.type, statut:m.statut}; });
    var currentLinked = (res.mesures || "").split(",").map(function(s: string) { return s.trim().split(" - ")[0].trim(); }).filter(Boolean);

    _aiShowLoading("✨ " + ss.id + " — " + t("ebios.col.r_mesures"));

    try {
        var result = await _callAI({
            user: "Context: " + JSON.stringify({societe: D.context.societe, socle: D.context.socle}) +
                "\n\nStrategic scenario: " + JSON.stringify({id:ss.id, scenario:ss.scenario, couple_id:ss.couple_id, pp:ss.pp, bs:ss.bs, er:ss.er}) +
                "\n\nSeverity: " + gNum + ", Initial likelihood: V" + vInit +
                "\n\nWeak SOP phases (Absent/Partial): " + JSON.stringify(weakPhases.map(function(p) { return {phase:_attackLabel(p.phase), action:p.action, bs:p.bs, efficacite:p.efficacite}; })) +
                "\n\nAll available measures in the registry: " + JSON.stringify(existingMeasures) +
                "\n\nCurrently linked measures: " + (currentLinked.join(", ") || "none") +
                "\n\nFor this strategic scenario, propose:" +
                "\n1. A selection of existing measures (by ID) from the registry that should be applied to reduce the likelihood" +
                "\n2. If needed, 1-3 new measures to create" +
                "\n3. An estimated residual likelihood (v_resid) from 1 to " + (vInit || 4) + " after applying these measures, with justification" +
                "\n\nRespond in " + (lang === "fr" ? "French" : "English") + "." +
                '\n\nJSON schema: {"selected_measures":["M-XX","M-YY"],"new_measures":[{"mesure":"short name","details":"description","type":"Prévention|Détection|Réaction","responsable":"..."}],"v_resid":1-' + (vInit || 4) + ',"justification":"why this residual likelihood"}'
        });

        // Normalize field names
        // Parse and render
        var p = _aiEnsurePanel();
        _aiOpenPanel("✨ " + ss.id + " — " + ss.scenario);
        var h = '';

        // Selected existing measures (with checkboxes)
        if (result.selected_measures && result.selected_measures.length > 0) {
            h += '<div class="settings-label ct-mb-1">' + t("ai.residual.selected") + '</div>';
            result.selected_measures.forEach(function(mId: string, i: number) {
                var m = D.measures.find(function(x) { return x.id === mId; });
                if (m) {
                    h += '<label class="ct-flex ct-items-start ct-gap-2 ct-py-1 ct-px-0 ct-border-bottom ct-clickable">';
                    h += '<input class="ai-resid-check ct-mt-1" type="checkbox" checked data-mid="' + esc(mId) + '">';
                    h += '<div><strong>' + esc(mId) + '</strong> — ' + esc(m.mesure);
                    if (m.details) h += '<div class="fs-xs text-muted ct-mt-1">' + esc(m.details).substring(0, 120) + '</div>';
                    h += '</div></label>';
                }
            });
        }

        // New measures to create (with checkboxes)
        if (result.new_measures && result.new_measures.length > 0) {
            h += '<div class="settings-label ct-mt-3 ct-mb-1">' + t("ai.residual.new_measures") + '</div>';
            result.new_measures.forEach(function(m: any, i: number) {
                h += '<div class="ai-card" id="ai-residual-new-' + i + '">';
                h += '<label class="ct-flex ct-items-start ct-gap-2 ct-clickable">';
                h += '<input class="ai-resid-new-check ct-mt-1" type="checkbox" checked data-idx="' + i + '">';
                h += '<div><div class="ai-card-title ct-mb-1">' + esc(m.mesure) + '</div>';
                if (m.details) h += '<div class="ai-card-details">' + esc(m.details) + '</div>';
                if (m.responsable) h += '<div class="ai-card-meta">' + t("ai.residual.owner") + ' : ' + esc(m.responsable) + '</div>';
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
            if (result.justification) h += '<div class="ai-card-details ct-mt-2">' + esc(result.justification) + '</div>';
            h += '</div>';
        }

        p.body.innerHTML = h;

        // Store for accept
        window._aiResidualResult = result;
        window._aiResidualSSIdx = ssIdx;

        p.footer.innerHTML = '<button class="ct-btn ai-btn-accept" data-variant="primary" data-click="_aiAcceptResidual">' + t("ai.accept") + '</button>' +
            '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';

    } catch (e: any) {
        var p = _aiEnsurePanel();
        p.body.innerHTML = '<div class="ai-error">' + t("ai.error", {msg: esc(e.message)}) + '</div>';
        p.footer.innerHTML = '<button class="ct-btn ai-btn-close" data-click="_aiClosePanel">' + t("ai.close") + '</button>';
    }
};

window._aiResidualForSS = function(ssIdx: number) {
    window.suggestResidualMeasures!(ssIdx);
};

window._aiAcceptResidual = function() {
    var result = window._aiResidualResult;
    var ssIdx = window._aiResidualSSIdx!;
    if (!result) return;
    _saveState();

    // 1. Link selected existing measures (only checked ones)
    var checkedMIds: string[] = [];
    document.querySelectorAll(".ai-resid-check:checked").forEach(function(cb) {
        checkedMIds.push(cb.getAttribute("data-mid")!);
    });
    if (checkedMIds.length > 0) {
        var currentMesures = (D.residuals[ssIdx] || {}).mesures || "";
        var linked = currentMesures.split(",").map(function(s: string) { return s.trim().split(" - ")[0].trim(); }).filter(Boolean);
        checkedMIds.forEach(function(mId) {
            if (linked.indexOf(mId) === -1) {
                var m = D.measures.find(function(x) { return x.id === mId; });
                if (m) {
                    currentMesures = _csvAppendRef(currentMesures, mId, m.mesure);
                }
            }
        });
        if (!D.residuals[ssIdx]) D.residuals[ssIdx] = {};
        D.residuals[ssIdx].mesures = currentMesures;
    }

    // 2. Create new measures (only checked ones)
    var checkedNewIdxs: number[] = [];
    document.querySelectorAll(".ai-resid-new-check:checked").forEach(function(cb) {
        checkedNewIdxs.push(parseInt(cb.getAttribute("data-idx")!));
    });
    if (result.new_measures) {
        result.new_measures.forEach(function(nm: any, i: number) {
            if (checkedNewIdxs.indexOf(i) === -1) return; // skip unchecked
            var id = nextId("measures");
            D.measures.push({id:id, mesure:nm.mesure||"", details:nm.details||"", origine:"Complémentaire", type:nm.type||"Prévention",
                sop:"", phase:"", effet:"", ref_socle:"", responsable:nm.responsable||"", echeance:"", cout:"", statut:"En cours"});
            // Link to residual
            if (!D.residuals[ssIdx]) D.residuals[ssIdx] = {};
            var cur = D.residuals[ssIdx].mesures || "";
            D.residuals[ssIdx].mesures = _csvAppendRef(cur, id, nm.mesure);
        });
    }

    // 3. Set proposed v_resid
    if (result.v_resid) {
        if (!D.residuals[ssIdx]) D.residuals[ssIdx] = {};
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

var RENDER_MAP: Record<string, string> = {
    renderVM: "vm", renderBS: "bs", renderER: "er",
    renderPP: "pp", renderSROV: "srov", renderSS: "ss",
    renderMeasures: "measures", renderResiduals: "residuals"
    // renderSocle, renderEco, renderSOP are wrapped separately (with inline AI buttons)
};

function _addToggleAIBtn(type: string) {
    var toggles = document.getElementById("toggles-" + type);
    if (!toggles) return;
    var existing = toggles.querySelector(".btn-ai");
    if (existing) existing.remove();
    if (!_aiIsEnabled()) return;
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

function _addInlineAIBtns(tableId: string, fnName: string, argPrefix?: number) {
    if (!_aiIsEnabled()) return;
    var table = document.getElementById(tableId);
    if (!table) return;
    var rows = table.querySelectorAll("tbody tr");
    rows.forEach(function(row, i) {
        // Ancrer sur l'action et non sur une classe de style : .btn-add-sm a
        // disparu avec la migration ct-*, ce qui faisait disparaitre ce bouton.
        var addBtn = row.querySelector('[data-click="' + fnName.replace(/^suggest/, "add") + '"]');
        if (!addBtn) return;
        // Skip if already has AI btn
        if (addBtn.parentElement!.querySelector(".btn-ai")) return;
        var aiBtn = document.createElement("button");
        aiBtn.className = "ct-btn btn-ai";
        aiBtn.setAttribute("data-size", "xs");
        aiBtn.textContent = "\u2728";
        aiBtn.title = t("ai.btn");
        aiBtn.style.marginLeft = "4px";
        aiBtn.setAttribute("data-click", fnName);
        aiBtn.setAttribute("data-args", JSON.stringify([argPrefix !== undefined ? argPrefix + i : i]));
        addBtn.parentElement!.appendChild(aiBtn);
    });
}

function _injectButtons() {
    for (var fnName in RENDER_MAP) {
        (function(fn: string, type: string) {
            var orig = window[fn];
            if (!orig || orig._aiWrapped) return;
            window[fn] = function(this: any) {
                orig.apply(this, arguments as any);
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
        window.renderSocle = function(this: any) {
            origSocle.apply(this, arguments as any);
            _addToggleAIBtn("socle");
            _addInlineAIBtns("socle-table", "suggestSocleMeasure");
        };
        window.renderSocle!._aiWrapped = true;
        window.renderSocle!._aiInlineWrapped = true;
    }
    // Wrap renderEco for inline measure AI buttons
    var origEco = window.renderEco;
    if (origEco && !origEco._aiInlineWrapped) {
        window.renderEco = function(this: any) {
            origEco.apply(this, arguments as any);
            _addToggleAIBtn("eco");
            _addInlineAIBtns("eco-table", "suggestEcoMeasure");
        };
        window.renderEco!._aiWrapped = true;
        window.renderEco!._aiInlineWrapped = true;
    }
    // Wrap renderSOP for inline measure AI buttons
    var origSOP = window.renderSOP;
    if (origSOP && !origSOP._aiInlineWrapped) {
        window.renderSOP = function(this: any) {
            origSOP.apply(this, arguments as any);
            _addToggleAIBtn("sop");
            _addInlineAIBtns("sop-table", "suggestSOPMeasure");
        };
        window.renderSOP!._aiWrapped = true;
        window.renderSOP!._aiInlineWrapped = true;
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
        try { renderAll(); } catch (e: any) {}
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _initAI);
} else {
    _initAI();
}

})();
