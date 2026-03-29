// EBIOS RM — English translations
_registerTranslations("en", {

    // ── Label app ──
    "ebios.label": "analysis",

    // ── Navigation (sidebar) ──
    "ebios.sidebar.synth": "Overview",
    "ebios.sidebar.section_cadrage": "Scoping",
    "ebios.sidebar.a1": "Workshop 1 - Scoping and security baseline",
    "ebios.sidebar.section_risques": "Risks",
    "ebios.sidebar.a2": "Workshop 2 - Risk origins",
    "ebios.sidebar.a3": "Workshop 3 - Strategic scenarios",
    "ebios.sidebar.a4": "Workshop 4 - Operational scenarios",
    "ebios.sidebar.section_traitement": "Treatment",
    "ebios.sidebar.a5": "Workshop 5 - Risk treatment",
    "ebios.sidebar.section_aide": "Help",
    "ebios.sidebar.methodo": "Methodology",
    "ebios.sidebar.usage": "User guide",
    "ebios.sidebar.section_historique": "History",
    "ebios.sidebar.snapshots": "Snapshots",

    // ── NAV subtabs ──
    "ebios.nav.synth": "Overview",
    "ebios.nav.context": "Context",
    "ebios.nav.vm": "Business assets",
    "ebios.nav.bs": "Supporting Assets",
    "ebios.nav.er": "Feared Events",
    "ebios.nav.socle": "Security Baseline",
    "ebios.nav.srov": "RO/TO Pairs",
    "ebios.nav.pp": "Stakeholders",
    "ebios.nav.ss": "Strategic Scenarios",
    "ebios.nav.eco": "Ecosystem Security Measures",
    "ebios.nav.sop": "Operational Scenarios",
    "ebios.nav.sop_synth": "Initial Risks",
    "ebios.nav.measures": "Security Measures Registry",
    "ebios.nav.residuals": "Residual Risks",
    "ebios.nav.history": "History",

    // ── Toolbar menu ──
    "ebios.menu.file": "File",
    "ebios.menu.open": "Open",
    "ebios.menu.save": "Save",
    "ebios.menu.save_as": "Save as",
    "ebios.menu.import_excel": "Import Excel",
    "ebios.menu.export_excel": "Export Excel",
    "ebios.menu.new_analysis": "New analysis",

    // ── Panel descriptions ──
    "ebios.desc.synth": "Consolidated analysis view: key indicators, risk maps, evolution and baseline compliance.",
    "ebios.desc.context": "General information about the organization, study scope and regulatory framework.",
    "ebios.desc.vm": "Essential business assets of the organization: critical processes or information. Specify the nature (Information or Process) and the owner.",
    "ebios.desc.bs": "Information system components supporting business assets: applications, servers, networks, data.",
    "ebios.desc.pp": "External actors (suppliers, service providers, partners). Assess their threat level via 4 criteria: Dependency, Penetration, Cyber maturity, Trust.",
    "ebios.desc.socle": "Compliance assessment of the security baseline (ANSSI 42 controls or ISO 27001 93 controls). Enter compliance percentage and identified gaps.",
    "ebios.desc.srov": "Identification of risk origins (threat actors) and their objectives. Each RO/TO pair is assessed on 3 criteria (Motivation, Resources, Activity) to determine relevance.",
    "ebios.desc.er": "Business impact feared events for each business asset. Severity determines the importance of the event on a scale of 1 to {max}.",
    "ebios.desc.ss": "Strategic attack paths: WHO (RO) attacks WHY (TO), THROUGH WHOM (stakeholder), targeting WHAT (asset), causing WHICH event (FE). Severity is computed automatically (MAX of FE).",
    "ebios.desc.eco": "Security controls applied to ecosystem stakeholders to reduce their threat level. Controls are referenced in registry 5a.",
    "ebios.desc.sop": "Attack phase detail (kill chain) for each operational scenario. For each phase, identify existing measures, effectiveness, and propose treatment measures.",
    "ebios.desc.sop_synth": "Initial risk summary: for each strategic scenario, severity (from FE) crossed with operational likelihood (from SOP) gives the initial risk level.",
    "ebios.desc.measures": "Complete security controls registry: baseline measures (applied and missing), ecosystem measures, SOP measures and additional measures. Each control is traced to its origin.",
    "ebios.desc.residuals": "Residual risk assessment after applying measures. For each strategic scenario, define residual likelihood and treatment decision.",
    "ebios.desc.history": "Checkpoints and modification history. Snapshots are stored in the browser.",

    // ── Footer ──
    "ebios.footer": "Interactive EBIOS RM report — Editable data, JSON save",

    // ── Synthesis cards ──
    "ebios.synth.initial_map": "Initial risk map",
    "ebios.synth.residual_map": "Residual risk map",
    "ebios.synth.socle_compliance": "Baseline compliance",
    "ebios.synth.risk_dist": "Residual risk distribution",
    "ebios.synth.risk_evolution": "Risk evolution",
    "ebios.synth.measures_todo": "Security measures to implement",

    // ── Buttons ──
    "ebios.btn.add_vm": "+ Add business asset",
    "ebios.btn.add_bs": "+ Add supporting asset",
    "ebios.btn.add_pp": "+ Add stakeholder",
    "ebios.btn.add_er": "+ Add feared event",
    "ebios.btn.add_srov": "+ Add RO/TO pair",
    "ebios.btn.add_ss": "+ Add strategic scenario",
    "ebios.btn.add_eco": "+ Add ecosystem measure",
    "ebios.btn.add_sop": "+ New SOP",
    "ebios.btn.add_measure": "+ Add security measure",
    "ebios.btn.add_phase": "+ Phase",
    "ebios.btn.new_measure": "+ New security measure",
    "ebios.btn.new_sr": "+ New RS",
    "ebios.btn.new_ov": "+ New TO",
    "ebios.btn.new_socle_measure": "+ New security measure",

    // ── Help tabs ──
    "ebios.help.tab_methodo": "EBIOS RM Methodology",
    "ebios.help.tab_usage": "Application User Guide",

    // ── Confirm dialog ──
    "ebios.confirm.delete_sop": "Delete all of {sop} and its phases?",
    "ebios.confirm.duplicate_srov": "Pair {sr}/{ov} already exists. Change cancelled.",

    // ── Column headers: Context ──
    "ebios.col.societe": "Company / Organization",
    "ebios.col.objet_etude": "Studied object",
    "ebios.col.date": "Analysis date",
    "ebios.col.analyste": "Performed by",
    "ebios.col.date_precedente": "Previous analysis date",
    "ebios.col.reglementation": "Applicable regulations",
    "ebios.col.ref_socle_securite": "Security baseline framework",
    "ebios.col.ref_complementaires": "Additional frameworks",
    "ebios.col.commentaires": "Comments / context",
    "ebios.col.evolutions": "Changes since last analysis",
    "ebios.col.anssi_label": "ANSSI — Hygiene Guide (42 controls)",
    "ebios.col.iso_label": "ISO 27001 — Annex A (93 controls)",

    // ── Gravity ──
    "ebios.gravity.heading": "Severity scale",
    "ebios.gravity.nb_levels": "Number of levels:",
    "ebios.gravity.col_niveau": "Lvl.",
    "ebios.gravity.col_label": "Label",
    "ebios.gravity.col_description": "Description",
    "ebios.gravity.col_impact_financier": "Financial impact",
    "ebios.gravity.col_impact_reputation": "Reputation impact",
    "ebios.gravity.col_impact_reglementaire": "Regulatory impact",
    "ebios.gravity.col_impact_donnees_perso": "Personal data impact",
    "ebios.gravity.col_impact_operationnel": "Operational impact",

    // ── Risk matrix ──
    "ebios.matrix.heading": "Risk matrix (Severity x Likelihood)",
    "ebios.matrix.hint": "Click a level to change it. Changes propagate to the entire analysis.",

    // ── Risk levels ──
    "ebios.risk.eleve": "High",
    "ebios.risk.moyen": "Medium",
    "ebios.risk.faible": "Low",

    // ── Exposure levels ──
    "ebios.expo.critique": "Critical",
    "ebios.expo.elevee": "High",
    "ebios.expo.moderee": "Moderate",
    "ebios.expo.faible": "Low",

    // ── Socle status ──
    "ebios.socle.applique": "Applied",
    "ebios.socle.partiel": "Partial",
    "ebios.socle.non_applique": "Not applied",
    "ebios.socle.priorite_haute": "High",
    "ebios.socle.priorite_moyenne": "Medium",
    "ebios.socle.priorite_basse": "Low",
    "ebios.socle.anssi_label": "ANSSI (42 controls)",
    "ebios.socle.iso_label": "ISO 27001 (93 controls)",
    "ebios.socle.non_evalue": "Baseline not assessed",
    "ebios.socle.conformite_moyenne": "Average compliance: <strong>{avg}%</strong> ({count} measures assessed)",

    // ── Column headers: VM ──
    "ebios.col.vm_id": "ID",
    "ebios.col.vm_name": "Business asset",
    "ebios.col.vm_nature": "Nature",
    "ebios.col.vm_description": "Description",
    "ebios.col.vm_responsable": "Owner",

    // ── Column headers: BS ──
    "ebios.col.bs_id": "ID",
    "ebios.col.bs_name": "Supporting Asset",
    "ebios.col.bs_type": "Type",
    "ebios.col.bs_vm": "Supported BA",
    "ebios.col.bs_localisation": "Location",
    "ebios.col.bs_proprietaire": "Owner",

    // ── Column headers: PP ──
    "ebios.col.pp_id": "ID",
    "ebios.col.pp_name": "Stakeholder",
    "ebios.col.pp_categorie": "Category",
    "ebios.col.pp_type": "Type",
    "ebios.col.pp_dependance": "Depen-dency",
    "ebios.col.pp_penetration": "Pene-tration",
    "ebios.col.pp_maturite": "Matu-rity",
    "ebios.col.pp_confiance": "Trust",
    "ebios.col.pp_menace": "Threat",
    "ebios.col.pp_exposition": "Exposure",
    "ebios.col.pp_bs": "Related assets",

    // ── PP categories ──
    "ebios.pp.cat_client": "Client",
    "ebios.pp.cat_partenaire": "Partner",
    "ebios.pp.cat_prestataire": "Service provider",

    // ── Column headers: Socle ──
    "ebios.col.socle_num": "#",
    "ebios.col.socle_theme": "Theme",
    "ebios.col.socle_mesure": "Measure / Expected",
    "ebios.col.socle_conformite": "Compliance",
    "ebios.col.socle_statut": "Status",
    "ebios.col.socle_ecart": "Identified gap",
    "ebios.col.socle_priorite": "Priority",
    "ebios.col.socle_mesures_prevues": "Planned controls",

    // ── Column headers: Referentiels complementaires ──
    "ebios.col.ref_title": "Additional frameworks",
    "ebios.col.ref_ref": "Ref.",
    "ebios.col.ref_theme": "Theme",
    "ebios.col.ref_mesure": "Measure / Expected",
    "ebios.col.ref_conformite": "Compliance",
    "ebios.col.ref_statut": "Status",
    "ebios.col.ref_ecart": "Identified gap",
    "ebios.col.ref_priorite": "Priority",
    "ebios.col.ref_mesures_prevues": "Planned controls",
    "ebios.col.ref_exigences": "{n} requirements",

    // ── Column headers: SR/OV ──
    "ebios.col.srov_couple": "Pair",
    "ebios.col.srov_sr": "Risk origin",
    "ebios.col.srov_ov": "Target objective",
    "ebios.col.srov_motivation": "Motiva-tion",
    "ebios.col.srov_ressources": "Resour-ces",
    "ebios.col.srov_activite": "Acti-vity",
    "ebios.col.srov_pertinence": "Rele-vance",
    "ebios.col.srov_priorite": "Priority",
    "ebios.col.srov_justification": "Justification",

    // ── SROV priority labels ──
    "ebios.srov.p1": "P1",
    "ebios.srov.p2": "P2",
    "ebios.srov.non_retenu": "Not retained",
    "ebios.srov.ecarte": "Excluded",

    // ── Column headers: ER ──
    "ebios.col.er_id": "ID",
    "ebios.col.er_evenement": "Feared event",
    "ebios.col.er_vm": "Related BA",
    "ebios.col.er_dict": "DICT",
    "ebios.col.er_impacts": "Impacts",
    "ebios.col.er_gravite": "Severity",
    "ebios.col.er_label": "Label",

    // ── Column headers: SS ──
    "ebios.col.ss_id": "ID",
    "ebios.col.ss_scenario": "Scenario",
    "ebios.col.ss_srov": "RO/TO pair",
    "ebios.col.ss_pp": "Stakeholders",
    "ebios.col.ss_bs": "Targeted assets",
    "ebios.col.ss_er": "Related FE",
    "ebios.col.ss_gravite": "Severity",

    // ── Column headers: Eco ──
    "ebios.col.eco_pp": "SH",
    "ebios.col.eco_nom": "Name",
    "ebios.col.eco_existantes": "Existing measures",
    "ebios.col.eco_complementaires": "Additional measures",
    "ebios.col.eco_dep": "Dep.",
    "ebios.col.eco_pen": "Pen.",
    "ebios.col.eco_mat": "Mat.",
    "ebios.col.eco_conf": "Trust",
    "ebios.col.eco_menace": "Threat",
    "ebios.col.eco_exposition": "Exposure",

    // ── Column headers: SOP ──
    "ebios.col.sop_sop": "SOP",
    "ebios.col.sop_ss": "SS",
    "ebios.col.sop_phase": "Phase",
    "ebios.col.sop_action": "Action",
    "ebios.col.sop_bs": "Targeted asset",
    "ebios.col.sop_controle": "Existing control",
    "ebios.col.sop_ref": "Baseline ref.",
    "ebios.col.sop_efficacite": "Effectiveness",
    "ebios.col.sop_mesure_proposee": "Proposed measure(s)",
    "ebios.col.sop_choose": "— choose",

    // ── Efficacite labels ──
    "ebios.eff.absent": "Absent",
    "ebios.eff.partiel": "Partial",
    "ebios.eff.efficace": "Effective",

    // ── Column headers: SOP Synth ──
    "ebios.col.sopsynth_ss": "SS",
    "ebios.col.sopsynth_scenario": "Scenario",
    "ebios.col.sopsynth_gravite": "Severity",
    "ebios.col.sopsynth_sop": "SOP",
    "ebios.col.sopsynth_efficacite": "Measure effectiveness",
    "ebios.col.sopsynth_taux": "Weakness rate",
    "ebios.col.sopsynth_vinit": "Init. L",
    "ebios.col.sopsynth_risque": "Initial risk",
    "ebios.col.sopsynth_no_sop": "No associated SOP",

    // ── Column headers: Measures ──
    "ebios.col.m_id": "ID",
    "ebios.col.m_mesure": "Security measure",
    "ebios.col.m_details": "Details",
    "ebios.col.m_origine": "Origin",
    "ebios.col.m_type": "Type",
    "ebios.col.m_sop": "Addressed SOP",
    "ebios.col.m_phase": "Phase",
    "ebios.col.m_effet": "Effect",
    "ebios.col.m_ref_socle": "Baseline ref.",
    "ebios.col.m_responsable": "Owner",
    "ebios.col.m_echeance": "Deadline",
    "ebios.col.m_cout": "Cost",
    "ebios.col.m_statut": "Status",

    // ── Measure origins ──
    "ebios.m.origine_socle": "Baseline",
    "ebios.m.origine_ecosysteme": "Ecosystem",
    "ebios.m.origine_sop": "SOP",
    "ebios.m.origine_complementaire": "Additional",

    // ── Measure types ──
    "ebios.m.type_prevention": "Prevention",
    "ebios.m.type_detection": "Detection",
    "ebios.m.type_reaction": "Response",

    // ── Measure statuts ──
    "ebios.m.statut_termine": "Completed",
    "ebios.m.statut_en_cours": "In progress",
    "ebios.m.statut_a_etudier": "To study",

    // ── Column headers: Residuals ──
    "ebios.col.r_ss": "SS",
    "ebios.col.r_scenario": "Scenario",
    "ebios.col.r_gravite": "Severity",
    "ebios.col.r_mesures": "Applied measures",
    "ebios.col.r_v_init": "Init. L",
    "ebios.col.r_v_resid": "Resid. L",
    "ebios.col.r_risque": "Resid. risk",
    "ebios.col.r_decision": "Decision",

    // ── Risk decisions ──
    "ebios.decision.accepter": "Accept",
    "ebios.decision.reduire": "Reduce",
    "ebios.decision.transferer": "Transfer",
    "ebios.decision.eviter": "Avoid",

    // ── DICT ──
    "ebios.dict.d": "Availability",
    "ebios.dict.i": "Integrity",
    "ebios.dict.c": "Confidentiality",
    "ebios.dict.t": "Traceability",

    // ── Snapshots / History ──
    "ebios.history.create": "+ Create checkpoint",
    "ebios.history.decrypt": "Decrypt snapshots",
    "ebios.history.encrypt": "Encrypt snapshots",
    "ebios.history.encryption_active": "Encryption active",
    "ebios.history.none": "No snapshots saved.",
    "ebios.history.col_name": "Name",
    "ebios.history.col_date": "Date",
    "ebios.history.col_societe": "Company",
    "ebios.history.col_actions": "Actions",
    "ebios.history.restore": "Restore",
    "ebios.history.export": "Export",
    "ebios.history.hint": "Snapshots are stored in the browser (localStorage). They are lost if you clear browser data. Use \"Export\" to save them as files.",

    // ── Status messages ──
    "ebios.status.modified": "Modified",
    "ebios.status.modified_refs": "Modified + references updated",
    "ebios.status.line_added": "Row added: {id}",
    "ebios.status.line_deleted": "Row deleted",
    "ebios.status.sop_added": "SOP {id} added",
    "ebios.status.phase_added": "Phase added to {id}",
    "ebios.status.phase_moved": "Phase moved",
    "ebios.status.deleted": "Deleted",
    "ebios.status.efficacite": "Effectiveness: {val}",
    "ebios.status.measure_created": "Measure {id} created and added",
    "ebios.status.sr_created": "{id} created",
    "ebios.status.ov_created": "{id} created",
    "ebios.status.loading_exceljs": "Loading ExcelJS...",
    "ebios.status.exceljs_loaded": "ExcelJS loaded",
    "ebios.status.loading_template": "Loading template...",
    "ebios.status.generating_excel": "Generating Excel...",
    "ebios.status.excel_downloaded": "Excel downloaded",
    "ebios.status.reading_excel": "Reading Excel...",
    "ebios.status.eco_moved_compl": "{id} moved to additional controls — status changed to 'To study'",
    "ebios.status.eco_moved_exist": "{id} moved to existing controls",
    "ebios.status.error": "Error: {msg}",

    // ── Prompt messages ──
    "ebios.prompt.new_socle_measure": "New measure description:",
    "ebios.prompt.new_sr": "New risk origin description:",
    "ebios.prompt.new_ov": "New target objective description:",
    "ebios.prompt.new_eco_measure": "New ecosystem measure description:",
    "ebios.prompt.new_sop_measure": "New SOP measure description:",

    // ── Alert messages ──
    "ebios.alert.template_unavailable": "Excel template not available. Use python3 json_to_excel.py",
    "ebios.alert.excel_export_error": "Excel export error: {msg}\nUse python3 json_to_excel.py as an alternative.",
    "ebios.alert.excel_import_error": "Excel import error: {msg}",
    "ebios.alert.exceljs_load_error": "Unable to load ExcelJS",

    // ── Validation ──
    "ebios.validate.must_be_object": "The file must contain a JSON object.",
    "ebios.validate.missing_key": "Missing key: {key}",
    "ebios.validate.context_object": "context must be an object.",
    "ebios.validate.must_be_array": "{key} must be an array.",
    "ebios.validate.max_size": "{key} exceeds maximum size ({max}).",
    "ebios.validate.must_be_item_object": "{key}[{i}] must be an object.",
    "ebios.validate.forbidden_key": "{key}[{i}] contains a forbidden key.",
    "ebios.validate.invalid_socle_type": "Invalid socle_type (anssi or iso).",
    "ebios.validate.must_be_number": "{path} must be a number.",
    "ebios.validate.out_of_bounds": "{path} out of bounds.",
    "ebios.validate.string_too_long": "{path} exceeds {max} characters.",

    // ── Misc ──
    "ebios.misc.click_choose": "Click to choose...",
    "ebios.misc.filter": "Filter...",
    "ebios.misc.phases": "phases",
    "ebios.misc.measures_indicator": "Controls",
    "ebios.misc.show_terminated": "Also show completed measures",
    "ebios.misc.no_measures": "No measures",
    "ebios.misc.measures_todo_count": "{todo} measures to implement out of {total} total",
    "ebios.misc.ss_not_evaluated": "{n} SS not assessed (no SOP or residual likelihood)",
    "ebios.misc.eleve_label": "High",
    "ebios.misc.moyen_label": "Medium",
    "ebios.misc.faible_label": "Low",
    "ebios.misc.non_applique_label": "Not applied",
    "ebios.misc.partiel_label": "Partial",
    "ebios.misc.applique_label": "Applied",

    // ── Synthesis evolution ──
    "ebios.synth.col_ss": "SS",
    "ebios.synth.col_scenario": "Scenario",
    "ebios.synth.col_risque_initial": "Initial risk",
    "ebios.synth.col_risque_residuel": "Residual risk",
    "ebios.synth.col_evolution": "Evolution",
    "ebios.synth.col_decision": "Decision",
    "ebios.synth.ameliore": "Improved",
    "ebios.synth.identique": "Unchanged",
    "ebios.synth.degrade": "Degraded",

    // ── Synthesis measures table ──
    "ebios.synth.col_id": "ID",
    "ebios.synth.col_mesure": "Control",
    "ebios.synth.col_origine": "Origin",
    "ebios.synth.col_responsable": "Owner",
    "ebios.synth.col_echeance": "Deadline",
    "ebios.synth.col_statut": "Status",

    // ── Eco SVG labels ──
    "ebios.eco.clients": "Clients",
    "ebios.eco.partenaires": "Partners",
    "ebios.eco.prestataires": "Service providers",
    "ebios.eco.zone_danger": "Danger zone (threshold: 2.5)",
    "ebios.eco.zone_controle": "Control zone (threshold: 0.9)",
    "ebios.eco.zone_veille": "Watch zone (threshold: 0.2)",
    "ebios.eco.fiabilite": "CYBER RELIABILITY:",
    "ebios.eco.fiab_faible": "Low",
    "ebios.eco.fiab_moyenne": "Medium",
    "ebios.eco.fiab_bonne": "Good",
    "ebios.eco.fiab_elevee": "High",
    "ebios.eco.diametre": "DIAMETER = exposure",
    "ebios.eco.map_after": "Map (after ecosystem controls)",
    "ebios.eco.map_initial": "Ecosystem map (initial threat)",

    // ── Gravity defaults ──
    "ebios.grav.extreme": "Extreme",
    "ebios.grav.critique": "Critical",
    "ebios.grav.grave": "Severe",
    "ebios.grav.significatif": "Significant",
    "ebios.grav.faible": "Low",
    "ebios.grav.desc_extreme": "Catastrophic consequences threatening the survival of the organization",
    "ebios.grav.desc_critique": "Unacceptable consequences (major impact on essential missions)",
    "ebios.grav.desc_grave": "Serious consequences (notable degradation of activities)",
    "ebios.grav.desc_significatif": "Significant but manageable consequences (limited and temporary impact)",
    "ebios.grav.desc_faible": "Limited and acceptable consequences",

    // ── SOP new phase ──
    "ebios.sop.initial_phase": "1. Initial phase",
    "ebios.sop.new_phase": "New phase",

    // ── Measure effects ──
    "ebios.m.renforcement_socle": "Baseline measure reinforcement {ref}",
    "ebios.m.mesure_eco_pour": "Ecosystem measure for {pp}",

    // ── Referentiels catalog descriptions (EN) ──
    "ebios.ref.gamp.desc": "Good Automated Manufacturing Practice — cybersecurity requirements for validated systems",
    "ebios.ref.lpm.desc": "Military Programming Law (France) — ANSSI security rules for critical infrastructure operators",
    "ebios.ref.loi0520.desc": "Moroccan cybersecurity law — obligations for regulated organizations",
    "ebios.ref.dora.desc": "Digital Operational Resilience Act (EU 2022/2554) — digital resilience for the financial sector",
    "ebios.ref.hds.desc": "Health Data Hosting Certification (France) — additional ISO 27001 requirements",
    "ebios.ref.secnumcloud.desc": "ANSSI qualification framework for Cloud service providers (v3.2)",
    "ebios.ref.nis2.desc": "NIS 2 Directive (EU 2022/2555) — cybersecurity requirements for essential and important entities",
    "ebios.ref.cra.desc": "EU Cyber Resilience Act (CRA 2024) — requirements for products with digital elements",
    "ebios.ref.soc2.desc": "Trust Services Criteria (AICPA) — security, availability, integrity, confidentiality, privacy",

    // ── Help content ──
    "ebios.help.usage": "<h1 class=\"heading-blue\">User Guide</h1>\n<p class=\"text-muted\">How to use the EBIOS RM interactive application</p>\n\n<h2>Overview</h2>\n<p>The application is organized in <strong>3 areas</strong>: the <strong>toolbar</strong> at the top (File menu, settings), the <strong>sidebar</strong> on the left (workshop navigation) and the <strong>work area</strong> in the center (editable tables).</p>\n<div class=\"help-tip\">All data stays in your browser. No information is sent to a server (unless the AI assistant is enabled). Remember to save regularly as JSON.</div>\n\n<h2>Navigation</h2>\n<table><thead><tr><th>Élément</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Sidebar</strong></td><td>Click on a workshop to display its sub-tabs. The menu collapses automatically on mobile.</td></tr>\n<tr><td><strong>Sub-tabs</strong></td><td>Workshops with multiple sections (e.g. Workshop 1) show sub-tabs at the top of the work area.</td></tr>\n<tr><td><strong>Overview</strong></td><td>Dashboard with indicators, risk matrices and maps. Updates automatically.</td></tr>\n</tbody></table>\n\n<h2>Editing tables</h2>\n<h3>Edit a cell</h3>\n<p>Editable cells contain an <strong>input field</strong> (text or number) or a <strong>dropdown</strong>. Changes are applied when you leave the field (tab, click elsewhere).</p>\n<h3>Add a row</h3>\n<p>Click the <strong class=\"text-green\">+ Add</strong> button below the table. The identifier (VM-XX, BS-XX, etc.) is generated automatically.</p>\n<h3>Delete a row</h3>\n<p>Click the <strong class=\"text-red\">X</strong> button on the right of the row. Confirmation is required if the row contains data.</p>\n<h3>Computed values</h3>\n<p>Grey-background columns are computed automatically and are not editable:</p>\n<ul>\n<li><strong>SH Threat</strong> = (Pénétration &times; Dependency) / (Maturity &times; Trust)</li>\n<li><strong>SH Exposure</strong> = thresholds on threat (&ge;4 Critical, &ge;2 High, &ge;1 Moderate, &lt;1 Low)</li>\n<li><strong>RS/TO Relevance</strong> = (Motivation + Resources + Activity) / 12</li>\n<li><strong>SS Severity</strong> = maximum of associated FE severities</li>\n<li><strong>SOP Weakness rate</strong> = MAX(0, (Absent&times;2 + Partial - Effective&times;2)) / (Total&times;2)</li>\n<li><strong>SOP Likelihood</strong> = derived from weakness rate (1 to 4)</li>\n<li><strong>Initial/residual risk</strong> = Severity &times; Likelihood in the risk matrix</li>\n</ul>\n\n<h2>Column management</h2>\n<table><thead><tr><th>Action</th><th>How</th></tr></thead><tbody>\n<tr><td><strong>Hide a column</strong></td><td>Click the <strong>&times;</strong> on the right of the column name in the table header</td></tr>\n<tr><td><strong>Restore a column</strong></td><td>A <strong>Hidden columns (N)</strong> button appears above the table — click to choose columns to restore</td></tr>\n<tr><td><strong>Resize</strong></td><td>Drag the right edge of a column header</td></tr>\n</tbody></table>\n\n<h2>Cross-references</h2>\n<p>Fields that reference other elements (BV in assets, SH in scenarios, FE in scenarios, etc.) use a <strong>search selector</strong>:</p>\n<ul>\n<li>Click the field to open the selector</li>\n<li>Type to filter available elements</li>\n<li>Check/uncheck to select (multi-sélection supported)</li>\n<li>Click outside to close</li>\n</ul>\n<div class=\"help-tip\">When you rename an element (BV, SA, SH, FE...), all references in other tables are updated automatically.</div>\n\n<h2>File management</h2>\n<p>The <strong>File</strong> menu gives access to all options:</p>\n<table><thead><tr><th>Action</th><th>Format</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Open</strong></td><td>.json / .json.enc</td><td>Load a JSON (or encrypted) file from disk and replace all data. Automatic format validation.</td></tr>\n<tr><td><strong>Save</strong></td><td>.json</td><td>Quick save of the currently open file. Not compatible with encryption (use Save as to encrypt).</td></tr>\n<tr><td><strong>Save as</strong></td><td>.json / .json.enc</td><td>Save as JSON with optional AES-256 password encryption.</td></tr>\n<tr><td><strong>Import Excel</strong></td><td>.xlsx</td><td>Read an existing EBIOS RM Excel file and load the data.</td></tr>\n<tr><td><strong>Export Excel</strong></td><td>.xlsx</td><td>Generate an Excel file with formulas and conditional formatting. Requires internet (ExcelJS loading).</td></tr>\n</tbody></table>\n\n<h2>History and undo</h2>\n<h3>Undo / Redo</h3>\n<p>Each change is recorded in history (50 levels max). Use the sidebar buttons or shortcuts:</p>\n<ul>\n<li><strong>Ctrl+Z</strong> (or Cmd+Z on Mac): undo last change</li>\n<li><strong>Ctrl+Y</strong> (or Cmd+Y on Mac): redo undone change</li>\n</ul>\n<h3>Snapshots</h3>\n<p>Snapshots are named checkpoints stored in the browser:</p>\n<ul>\n<li><strong>Create a snapshot</strong>: click \"+ Create checkpoint\" in the Snapshots tab</li>\n<li><strong>Restore</strong>: return to the exact snapshot state (current state is saved in undo)</li>\n<li><strong>Export</strong>: download a snapshot as an independent JSON file</li>\n<li><strong>Encrypt</strong>: enable encryption for all browser snapshots</li>\n</ul>\n<div class=\"help-tip\"><strong>Warning</strong>: snapshots are stored in localStorage. They are lost if you clear browser data. Export important snapshots regularly as files.</div>\n\n<h2>Settings</h2>\n<p>Click the <strong>gear icon</strong> (&#9881;) in the toolbar to access settings:</p>\n<ul>\n<li><strong>Language</strong>: switch between French and English</li>\n<li><strong>AI Assistant</strong>: enable/disable, choose provider (Anthropic/OpenAI), model, and API key</li>\n<li><strong>Methodology instructions</strong>: upload a Markdown file to guide AI suggestions</li>\n</ul>\n\n<h2>AI Assistant</h2>\n<p>The AI assistant is an optional module that provides contextual suggestions at each stage of the analysis. It is <strong>disabled by default</strong>.</p>\n<h3>Usage</h3>\n<p>Once enabled in Settings, a <strong>&#10024; AI</strong> button appears on each tab (Business Values, Supporting Assets, Scenarios, Controls, etc.). Clicking it:</p>\n<ul>\n<li>The assistant analyzes the data already entered in the current analysis</li>\n<li>It suggests additional elements (BV, SA, RS/TO, scenarios, controls, kill chains...)</li>\n<li>Each suggestion can be <strong>accepted</strong> (added to the analysis) or <strong>ignored</strong></li>\n<li>Suggestions are tailored to the organization context and existing data</li>\n</ul>\n<h3>Methodology instructions</h3>\n<p>A Markdown file can be uploaded in Settings to enrich the AI context:</p>\n<ul>\n<li>Internal organizational framework</li>\n<li>Writing or naming conventions</li>\n<li>Specific methodology or EBIOS RM supplements</li>\n<li>Applicable security policy or charter</li>\n</ul>\n<p>This file is appended to the system prompt of every AI request.</p>\n<h3>Risks and precautions</h3>\n<ul>\n<li><strong>Data sharing</strong>: analysis data is sent to the AI provider. Verify that your privacy policy and contractual obligations allow this.</li>\n<li><strong>API key in HTTP headers</strong>: the API key is transmitted in HTTP headers directly from the browser. It is visible in DevTools, can be captured by browser extensions, and may be logged by corporate proxies. Use a dedicated browser profile without extensions.</li>\n<li><strong>API key in localStorage</strong>: the key is stored in the browser, never in saved files.</li>\n<li><strong>No guarantee on suggestions</strong>: AI proposals must be validated by the analyst.</li>\n</ul>\n\n<h2>Data security</h2>\n<ul>\n<li><strong>No server</strong>: all data stays in your browser (unless AI assistant is enabled)</li>\n<li><strong>JSON encryption</strong>: AES-256-GCM with PBKDF2 key derivation (250,000 iterations)</li>\n<li><strong>Snapshot encryption</strong>: optional encryption of localStorage data</li>\n<li><strong>Import validation</strong>: every imported JSON file is validated before loading (structure, types, bounds)</li>\n<li><strong>API keys</strong>: stored only in localStorage, never in saved files</li>\n</ul>\n\n<h2>Keyboard shortcuts</h2>\n<table><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>\n<tr><td><strong>Ctrl+S</strong> / <strong>Cmd+S</strong></td><td>Save</td></tr>\n<tr><td><strong>Ctrl+Z</strong> / <strong>Cmd+Z</strong></td><td>Undo</td></tr>\n<tr><td><strong>Ctrl+Y</strong> / <strong>Cmd+Y</strong></td><td>Redo</td></tr>\n<tr><td><strong>Tab</strong></td><td>Move to next field in a table</td></tr>\n<tr><td><strong>Escape</strong></td><td>Close help panel or an open selector</td></tr>\n</tbody></table>\n\n<h2>Best practices</h2>\n<ul>\n<li><strong>Save often</strong>: use File &rarr; Save regularly, especially before closing the browser</li>\n<li><strong>Use snapshots</strong>: create a snapshot before each work session or major change</li>\n<li><strong>Follow workshop order</strong>: later workshops depend on earlier ones (BV &rarr; SA &rarr; SH &rarr; RS/TO &rarr; FE &rarr; SS &rarr; SOP &rarr; Controls)</li>\n<li><strong>Check the overview</strong>: the Overview tab provides a global view — indicators and matrices update automatically</li>\n<li><strong>Excel export</strong>: for a formal deliverable, use File &rarr; Export Excel — the file contains formulas and professional formatting</li>\n</ul>",

    "ebios.help.methodo": "<h1 class=\"heading-blue\">EBIOS Risk Manager Methodology Guide</h1>\n<p class=\"text-muted\">Risk assessment method published by ANSSI — 5 workshops</p>\n\n<h2>General principle</h2>\n<p>EBIOS RM is a risk assessment method that starts from the organization's <strong>business assets</strong> to identify the most relevant <strong>risk scenarios</strong> and define a proportionate <strong>treatment plan</strong>. It is carried out in 5 sequential workshops, each feeding the next.</p>\n\n<h2>Workshop 1 — Scoping and security baseline</h2>\n<h3>Objective</h3>\n<p>Define the study scope, identify critical assets, feared events and assess the existing security level.</p>\n<h3>Participants</h3>\n<p><strong>CISO</strong>, <strong>CIO</strong>, <strong>Business management</strong>, <strong>DPO</strong> (if personal data)</p>\n<h3>Steps in the application</h3>\n<table><thead><tr><th>Tab</th><th>Content</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Context</td><td>Scope, regulations, severity scale</td><td>Fill in name, date, chosen baseline, configure severity levels (3, 4 or 5)</td></tr>\n<tr><td>Business assets</td><td>Essential processes</td><td>Identify 5-10 BA, assess DICT from 1 to N (per scale)</td></tr>\n<tr><td>Supporting Assets</td><td>IS supporting BA</td><td>List servers, apps, networks, data and associate with BA</td></tr>\n<tr><td>Feared Events</td><td>Impacts feared per BA</td><td>For each BA, identify FE and assess severity</td></tr>\n<tr><td>Security Baseline</td><td>ANSSI or ISO compliance</td><td>Assess each control (0-100%), identify gaps</td></tr>\n</tbody></table>\n\n<h2>Workshop 2 — Risk origins and target objectives</h2>\n<h3>Objective</h3>\n<p>Identify <strong>who</strong> could attack (risk origins) and <strong>why</strong> (target objectives). Assess the relevance of each RO/TO pair.</p>\n<h3>Participants</h3>\n<p><strong>CISO</strong>, <strong>CTI Analyst</strong> (if available), <strong>Management</strong></p>\n<h3>Guide</h3>\n<ul>\n<li>Create risk origins (cybercriminals, employees, states, competitors...)</li>\n<li>Create target objectives (ransomware, data theft, sabotage...)</li>\n<li>Combine into pairs and rate Motivation (0-4), Resources (0-4), Activity (0-4)</li>\n<li>Relevance = sum /12. Priority: P1 (&gt;7), P2 (5-7), Not retained (3-4), Excluded (&le;2)</li>\n</ul>\n\n<h2>Workshop 3 — Strategic scenarios</h2>\n<h3>Objective</h3>\n<p>Identify and assess ecosystem <strong>stakeholders</strong>, build <strong>strategic attack paths</strong> and define controls to reduce ecosystem threat.</p>\n<h3>Participants</h3>\n<p><strong>CISO</strong>, <strong>Business management</strong>, <strong>Procurement/partnership manager</strong></p>\n<h3>Steps</h3>\n<table><thead><tr><th>Tab</th><th>Content</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Stakeholders</td><td>Ecosystem actors</td><td>Suppliers (providers), partners, clients — assess D/P/M/T (1-4), category</td></tr>\n<tr><td>Strategic Scenarios</td><td>Attack paths</td><td>Link RO/TO + SH + Asset + FE. Severity is computed automatically (MAX of FE)</td></tr>\n<tr><td>Ecosystem Security Measures</td><td>SH threat reduction</td><td>For each SH, list measures and reassess residual D/P/M/T. Ecosystem map</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Stakeholder rule</strong>: if the study scope is the entire company, internal employees are NOT stakeholders. Only external actors are stakeholders.</div>\n\n<h2>Workshop 4 — Operational scenarios</h2>\n<h3>Objective</h3>\n<p>Detail each strategic scenario into a <strong>technical kill chain</strong>: attack phases, existing measures, effectiveness. Calculate <strong>operational likelihood</strong> and <strong>initial risk</strong>.</p>\n<h3>Participants</h3>\n<p><strong>CISO</strong>, <strong>Technical team/SOC</strong>, <strong>Security architect</strong>, <strong>DevOps/Sysadmin</strong></p>\n<h3>Steps</h3>\n<table><thead><tr><th>Tab</th><th>Content</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Operational Scenarios</td><td>Kill chain per SOP</td><td>4-8 phases per SOP, measures, effectiveness (Absent/Partial/Effective), proposed controls</td></tr>\n<tr><td>Initial Risks</td><td>Risk summary</td><td>For each SS: severity, control effectiveness, weakness rate, operational likelihood, initial risk</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Formula</strong>: Weakness rate = MAX(0, (Absent&times;2 + Partial - Effective&times;2)) / (Total&times;2). Each Effective phase compensates for one Absent in the kill chain.</div>\n\n<h2>Workshop 5 — Risk treatment</h2>\n<h3>Objective</h3>\n<p>Define the <strong>treatment plan</strong>: security measures, owners, deadlines. Assess <strong>residual risks</strong> and make treatment decisions.</p>\n<h3>Participants</h3>\n<p><strong>CISO</strong>, <strong>Management</strong>, <strong>CIO</strong>, <strong>Business owners</strong>, <strong>DPO</strong></p>\n<h3>Steps</h3>\n<table><thead><tr><th>Tab</th><th>Content</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Security Measures Registry</td><td>All controls</td><td>Consolidate: baseline applied (Completed), baseline to reinforce, ecosystem, SOP, additional</td></tr>\n<tr><td>Residual Risks</td><td>Risk after treatment</td><td>For each SS, assess residual likelihood (1-4) and choose decision (Accept/Reduce/Transfer)</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Control priority</strong>: propose missing baseline controls first, then ecosystem measures, then additional controls only if necessary.</div>\n\n<h2>Glossary</h2>\n<table><thead><tr><th>Acronym</th><th>Meaning</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>BV</strong></td><td>Business asset</td><td>Essential process or activity of the organization (e.g. order management, R&amp;D)</td></tr>\n<tr><td><strong>SA</strong></td><td>Supporting Asset</td><td>IS component supporting a BA (server, application, network, data)</td></tr>\n<tr><td><strong>SH</strong></td><td>Stakeholder</td><td>External actor to the study scope (supplier, provider, partner, client)</td></tr>\n<tr><td><strong>RS</strong></td><td>Risk Source</td><td>Potential threat actor (cybercriminal, malicious employee, competitor, state)</td></tr>\n<tr><td><strong>TO</strong></td><td>Target Objective</td><td>Goal pursued by the risk origin (extortion, data theft, sabotage)</td></tr>\n<tr><td><strong>RO/TO</strong></td><td>Origin/Objective Pair</td><td>Combination of a RO and a TO assessed for relevance</td></tr>\n<tr><td><strong>FE</strong></td><td>Feared Event</td><td>Feared business impact in DICT terms (e.g. client data leak)</td></tr>\n<tr><td><strong>SS</strong></td><td>Strategic Scenario</td><td>Attack path: WHO (RO) attacks WHY (TO) THROUGH WHOM (SH) targeting WHAT (SA) causing WHICH impact (FE)</td></tr>\n<tr><td><strong>SOP</strong></td><td>Operational Scenario</td><td>Technical kill chain detailing the attack phases of a SS</td></tr>\n<tr><td><strong>DICT</strong></td><td>Availability, Integrity, Confidentiality, Traceability</td><td>The 4 security criteria for assessing needs and breaches</td></tr>\n<tr><td><strong>PACS</strong></td><td>Security Continuous Improvement Plan</td><td>Treatment plan resulting from the EBIOS RM analysis</td></tr>\n</tbody></table>"
});
