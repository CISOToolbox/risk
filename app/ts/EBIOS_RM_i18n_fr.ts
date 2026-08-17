// EBIOS RM — French translations
// ═══════════════════════════════════════════════════════════════════════
// EBIOS RM — Traductions FR / EN
// ═══════════════════════════════════════════════════════════════════════

_registerTranslations("fr", {

    // ── Label app ──
    "ebios.label": "analyse",

    // ── Navigation (sidebar) ──
    "ebios.sidebar.synth": "Synthèse",
    "ebios.sidebar.a1": "Atelier 1 - Cadrage",
    "ebios.sidebar.a2": "Atelier 2 - Sources de risque",
    "ebios.sidebar.a3": "Atelier 3 - Scénarios stratégiques",
    "ebios.sidebar.a4": "Atelier 4 - Scénarios opérationnels",
    "ebios.sidebar.a5": "Atelier 5 - Traitement",
    "ebios.sidebar.context": "Contexte",
    "ebios.sidebar.vm": "Valeurs métier",
    "ebios.sidebar.bs": "Biens supports",
    "ebios.sidebar.er": "Événements redoutés",
    "ebios.sidebar.socle": "Socle de sécurité",
    "ebios.sidebar.srov": "Sources de risque",
    "ebios.sidebar.pp": "Parties prenantes",
    "ebios.sidebar.ss": "Scénarios stratégiques",
    "ebios.sidebar.eco": "Écosystème",
    "ebios.sidebar.sop": "Scénarios opérationnels",
    "ebios.sidebar.sop_synth": "Synthèse des risques",
    "ebios.sidebar.measures": "Mesures",
    "ebios.sidebar.residuals": "Risques résiduels",
    "ebios.sidebar.section_aide": "Aide",
    "ebios.sidebar.methodo": "Méthodologie",
    "ebios.sidebar.usage": "Utilisation",

    // ── Catalog ──
    "catalog.section": "Analyses",
    "catalog.import": "Importer",
    "catalog.export": "Exporter",
    "catalog.duplicate": "Dupliquer",
    "catalog.rename": "Renommer",
    "catalog.delete": "Supprimer",
    "catalog.copy": "copie",
    "catalog.unnamed": "Sans nom",
    "catalog.empty": "Aucune analyse",
    "catalog.rename_prompt": "Nouveau nom :",
    "catalog.delete_confirm": "Supprimer cette analyse ?",
    "catalog.duplicated": "Analyse dupliquée",
    "catalog.imported": "Analyse importée",
    "catalog.import_error": "Erreur lors de l'import",
    "catalog.export_all": "Exporter toutes les analyses",
    "catalog.exported_all": "Toutes les analyses exportées",
    "catalog.imported_multi": "analyses importées",
    "catalog.search": "Rechercher...",
    "catalog.no_results": "Aucun résultat",
    "catalog.save_all_prompt": "Exporter toutes les analyses ?\n\nOK = Toutes les analyses\nAnnuler = Analyse en cours uniquement",

    // ── NAV subtabs ──

    // ── Toolbar menu ──
    "ebios.menu.file": "Fichier",
    "ebios.menu.open": "Ouvrir",
    "ebios.menu.save": "Enregistrer",
    "ebios.menu.save_as": "Enregistrer sous",
    "ebios.menu.import_excel": "Import Excel",
    "ebios.menu.export_excel": "Export Excel",
    "ebios.menu.export_synth_pptx": "Synthèse managériale (PPTX)",
    "ebios.menu.export_report_word": "Export rapport (Word)",
    "ebios.status.loading_docx": "Chargement du moteur Word…",
    "ebios.status.generating_docx": "Génération du rapport Word…",
    "ebios.status.docx_downloaded": "Rapport Word téléchargé",
    "ebios.report.ask_redacteur": "Nom du rédacteur du rapport :",
    "ebios.report.taux_phrase": "Taux de faiblesse : {pct} % — vraisemblance opérationnelle : {vop}/4.",
    "ebios.report.couple_one": "au couple source de risque / objectif visé « {c} »",
    "ebios.report.couple_many": "aux couples source de risque / objectif visé « {list} »",
    "ebios.report.couple_none": "aux couples source de risque / objectif visé retenus",
    "ebios.report.ss_intro_pre": "Ce scénario stratégique — « {scenario} » — est associé {couples}.",
    "ebios.report.ss_intro_post": "Compte tenu de l'évaluation des scénarios opérationnels détaillés dans les sections qui suivent, la vraisemblance est estimée à {vmax}/4.",
    "ebios.alert.docx_load_error": "Impossible de charger le moteur Word",
    "ebios.alert.docx_export_error": "Erreur export Word : {msg}",
    "ebios.status.loading_pptx": "Chargement du moteur PPTX…",
    "ebios.status.generating_pptx": "Génération du PPTX…",
    "ebios.status.pptx_downloaded": "Synthèse PPTX téléchargée",
    "ebios.alert.pptx_load_error": "Impossible de charger le moteur PPTX",
    "ebios.alert.pptx_export_error": "Erreur export PPTX : {msg}",
    "ebios.synth.export_title": "Synthèse managériale des risques",
    "ebios.synth.export_subtitle": "Analyse EBIOS RM",
    "ebios.synth.exec_summary": "Synthèse exécutive",
    "ebios.synth.socle_avg": "Conformité du socle",
    "ebios.synth.socle_title": "Conformité du socle de sécurité",
    "ebios.synth.map_initial": "Cartographie initiale",
    "ebios.synth.map_residual": "Cartographie résiduelle",
    "ebios.synth.risks_title": "Risques",
    "ebios.synth.measures_title": "Plan de traitement",
    "ebios.synth.top_risks": "Top risques à traiter",
    "ebios.synth.acceptance_title": "Acceptation des risques résiduels",
    "ebios.synth.acceptance_text": "Après mise en œuvre du plan de traitement, la cartographie résiduelle fait apparaître {eleve} risque(s) élevé(s), {moyen} moyen(s) et {faible} faible(s). La direction est invitée à statuer formellement sur l'acceptation de ces risques résiduels.",
    "ebios.synth.val_date": "Date :",
    "ebios.synth.val_sign": "Nom / signature :",
    "ebios.synth.intro_synthese": "Cette analyse EBIOS Risk Manager identifie et hiérarchise les risques pesant sur le périmètre étudié. Les chiffres ci-dessous comparent les risques avant et après mise en œuvre du plan de traitement proposé.",
    "ebios.synth.dist_initial": "Risques initiaux — avant mise en œuvre du plan de traitement proposé",
    "ebios.synth.dist_residual": "Risques résiduels — après mise en œuvre du plan de traitement proposé",
    "ebios.synth.intro_carto_init": "Positionnement des risques avant traitement, selon leur gravité et leur vraisemblance.",
    "ebios.synth.intro_carto_resid": "Positionnement des risques après mise en œuvre des mesures de traitement : les risques se déplacent vers des niveaux inférieurs.",
    "ebios.synth.reading_matrix": "Comment lire la matrice :\n\n• Axe vertical : gravité\n• Axe horizontal : vraisemblance\n• Couleur de la case : niveau de risque (vert = faible, orange = moyen, rouge = élevé)\n\nLes risques en haut à droite sont les plus critiques et prioritaires à traiter.",
    "ebios.synth.intro_top_risks": "Les risques ci-dessous restent élevés ou moyens après traitement : ils concentrent l'attention de la direction. Les colonnes « risque initial » et « risque résiduel » montrent la réduction obtenue grâce aux mesures.",
    "ebios.synth.intro_pacs": "Le plan d'amélioration continue de la sécurité (PACS) regroupe les mesures restant à mettre en œuvre pour réduire les risques, avec leur origine, leur responsable et leur échéance.",
    "ebios.synth.acceptance_note": "Le risque résiduel ne peut jamais être totalement nul. La direction doit décider, en connaissance de cause, d'accepter ces risques ou d'engager des mesures complémentaires ; cette décision engage sa responsabilité.",
    "ebios.synth.scope_title": "Périmètre et socle de sécurité",
    "ebios.synth.scope_perimeter": "Périmètre de l'étude :",
    "ebios.synth.scope_referentiel": "Référentiel d'évaluation du socle :",
    "ebios.synth.scope_coverage": "Couverture du socle de sécurité :",
    "ebios.synth.scope_measures": "{n} mesure(s) ont été ajoutées au plan de traitement pour couvrir les exigences du socle.",
    "ebios.synth.socle_anssi": "Mesures d'hygiène de l'ANSSI (42 mesures)",
    "ebios.synth.socle_iso": "Norme ISO/IEC 27001",
    "ebios.synth.evolution_title": "Évolution des risques",
    "ebios.menu.new_analysis": "Nouvelle analyse",

    // ── Panel descriptions ──
    "ebios.desc.synth": "Vue consolidée de l'analyse : indicateurs clés, cartographies des risques, évolution et conformité du socle.",
    "ebios.desc.context": "Informations générales sur l'organisation, le périmètre de l'étude et le cadre réglementaire.",
    "ebios.desc.vm": "Valeurs métier essentielles de l'organisation : processus ou informations critiques. Préciser la nature (Information ou Processus) et le responsable.",
    "ebios.desc.bs": "Composants du système d'information qui supportent les valeurs métier : applications, serveurs, réseaux, données.",
    "ebios.desc.pp": "Acteurs externes à l'objet d'étude (fournisseurs, prestataires, partenaires). Évaluer leur niveau de menace via 4 critères : Dépendance, Pénétration, Maturité cyber, Confiance.",
    "ebios.desc.socle": "Évaluation de la conformité au référentiel de sécurité (ANSSI 42 mesures ou ISO 27001 93 mesures). Saisir le pourcentage de conformité et les écarts identifiés.",
    "ebios.desc.srov": "Identification des sources de risque (acteurs de menace) et de leurs objectifs. Chaque couple SR/OV est évalué sur 3 critères (Motivation, Ressources, Activité) pour déterminer sa pertinence.",
    "ebios.desc.er": "Événements redoutés en termes d'impact métier pour chaque valeur métier. La gravité détermine l'importance de l'événement sur une échelle de 1 à {max}.",
    "ebios.desc.ss": "Chemins d'attaque stratégiques : QUI (SR) attaque POURQUOI (OV), VIA QUI (PP), ciblant QUOI (BS), provoquant QUEL événement (ER). La gravité est calculée automatiquement (MAX des ER).",
    "ebios.desc.eco": "Mesures de sécurité appliquées aux parties prenantes de l'écosystème pour réduire leur niveau de menace. Les mesures sont référencées dans le référentiel 5a.",
    "ebios.desc.sop": "Détail des phases d'attaque (kill chain) pour chaque scénario opérationnel. Pour chaque phase, identifier le contrôle existant, son efficacité, et proposer des mesures de traitement.",
    "ebios.desc.sop_synth": "Synthèse des risques initiaux : pour chaque scénario stratégique, la gravité (issue des ER) croisée avec la vraisemblance opérationnelle (issue des SOP) donne le niveau de risque initial.",
    "ebios.desc.measures": "Référentiel complet des mesures de sécurité : mesures du socle (appliquées et manquantes), mesures écosystème, mesures SOP et mesures complémentaires. Chaque mesure est tracée vers son origine.",
    "ebios.desc.residuals": "Évaluation du risque résiduel après application des mesures. Pour chaque scénario stratégique, définir la vraisemblance résiduelle et la decision de traitement.",

    // ── Footer ──
    "ebios.footer": "Rapport interactif EBIOS RM — Donnees modifiables, sauvegarde JSON",

    // ── Synthesis cards ──
    "ebios.synth.initial_map": "Cartographie des risques initiaux",
    "ebios.synth.residual_map": "Cartographie des risques résiduels",
    "ebios.synth.socle_compliance": "Conformité du socle",
    "ebios.synth.risk_dist": "Distribution des risques résiduels",
    "ebios.synth.risk_evolution": "Évolution des risques",
    "ebios.synth.measures_todo": "Mesures à mettre en oeuvre",

    // ── Buttons ──
    "ebios.btn.add_vm": "+ Ajouter une valeur métier",
    "ebios.btn.add_bs": "+ Ajouter un bien support",
    "ebios.btn.add_pp": "+ Ajouter une partie prenante",
    "ebios.btn.import_vendor": "Importer depuis Vendor",
    "ebios.import_vendor.no_vendors": "Aucun fournisseur trouvé dans le fichier.",
    "ebios.import_vendor.success": "{added} PP importée(s), {measures} mesure(s), {skipped} ignorée(s).",
    "ebios.import_vendor.error": "Erreur d'import : {msg}",
    "ebios.btn.add_er": "+ Ajouter un événement redoute",
    "ebios.btn.add_srov": "+ Ajouter un couple SR/OV",
    "ebios.btn.add_ss": "+ Ajouter un scénario stratégique",
    "ebios.btn.add_eco": "+ Ajouter une mesure écosystème",
    "ebios.btn.add_sop": "+ Nouveau SOP",
    "ebios.btn.add_measure": "+ Ajouter une mesure",
    "ebios.btn.add_phase": "+ Phase",
    "ebios.btn.new_measure": "+ Nouvelle mesure",
    "ebios.btn.new_sr": "+ Nouvelle SR",
    "ebios.btn.new_ov": "+ Nouvel OV",
    "ebios.btn.new_socle_measure": "+ Nouvelle mesure",

    // ── Help tabs ──
    "ebios.help.tab_methodo": "Méthodologie EBIOS RM",
    "ebios.help.tab_usage": "Utilisation de l'application",

    // ── Confirm dialog ──
    "ebios.confirm.delete_sop": "Supprimer tout le {sop} et ses phases ?",
    "ebios.confirm.duplicate_srov": "Ce couple {sr}/{ov} existe deja. Modification annulee.",

    // ── Column headers: Context ──
    "ebios.col.societe": "Société / Organisation",
    "ebios.col.objet_etude": "Objet de l'étude",
    "ebios.col.date": "Date de l'analyse",
    "ebios.col.analyste": "Réalisé par",
    "ebios.col.date_precedente": "Date de la précédente analyse",
    "ebios.col.reglementation": "Réglementation applicable",
    "ebios.col.ref_socle_securite": "Référentiel du socle de sécurité",
    "ebios.col.commentaires": "Commentaires / contexte",
    "ebios.col.evolutions": "Evolutions depuis la dernière analyse",
    "ebios.col.anssi_label": "ANSSI — Guide d'hygiène (42 mesures)",
    "ebios.col.iso_label": "ISO 27001 — Annexe A (93 mesures)",

    // ── Gravity ──
    "ebios.gravity.heading": "Échelle de gravité",
    "ebios.gravity.nb_levels": "Nombre de niveaux :",
    "ebios.gravity.col_niveau": "Niv.",
    "ebios.gravity.col_label": "Label",
    "ebios.gravity.col_description": "Description",
    "ebios.gravity.col_impact_financier": "Impact financier",
    "ebios.gravity.col_impact_reputation": "Impact reputation",
    "ebios.gravity.col_impact_reglementaire": "Impact réglementaire",
    "ebios.gravity.col_impact_donnees_perso": "Impact données personnelles",
    "ebios.gravity.col_impact_operationnel": "Impact opérationnel",

    // ── Risk matrix ──
    "ebios.matrix.heading": "Matrice de risque (Gravité × Vraisemblance)",
    "ebios.matrix.hint": "Cliquer sur un niveau pour modifier la valeur. Les changements se répercutent sur toute l'analyse.",

    // ── Risk levels ──
    "ebios.risk.eleve": "Élevé",
    "ebios.risk.moyen": "Moyen",
    "ebios.risk.faible": "Faible",

    // ── Exposure levels ──
    "ebios.expo.critique": "Critique",
    "ebios.expo.elevee": "Élevée",
    "ebios.expo.moderee": "Modérée",
    "ebios.expo.faible": "Faible",

    // ── Socle status ──
    "ebios.socle.applique": "Appliqué",
    "ebios.socle.partiel": "Partiel",
    "ebios.socle.non_applique": "Non appliqué",
    "ebios.socle.priorite_haute": "Haute",
    "ebios.socle.priorite_moyenne": "Moyenne",
    "ebios.socle.priorite_basse": "Basse",
    "ebios.socle.anssi_label": "ANSSI (42 mesures)",
    "ebios.socle.iso_label": "ISO 27001 (93 mesures)",
    "ebios.socle.non_evalue": "Socle non évalué",
    "ebios.socle.conformite_moyenne": "Conformité moyenne : <strong>{avg}%</strong> ({count} mesures évaluées)",

    // ── Column headers: VM ──
    "ebios.col.vm_id": "ID",
    "ebios.col.vm_name": "Valeur Métier",
    "ebios.col.vm_nature": "Nature",
    "ebios.col.vm_description": "Description",
    "ebios.col.vm_responsable": "Responsable",

    // ── Column headers: BS ──
    "ebios.col.bs_id": "ID",
    "ebios.col.bs_name": "Bien Support",
    "ebios.col.bs_type": "Type",
    "ebios.col.bs_vm": "VM supportées",
    "ebios.col.bs_localisation": "Localisation",
    "ebios.col.bs_proprietaire": "Propriétaire",

    // ── Column headers: PP ──
    "ebios.col.pp_id": "ID",
    "ebios.col.pp_name": "Partie Prenante",
    "ebios.col.pp_categorie": "Catégorie",
    "ebios.col.pp_type": "Type",
    "ebios.col.pp_dependance": "Dépen-dance",
    "ebios.col.pp_penetration": "Péné-tration",
    "ebios.col.pp_maturite": "Matu-rité",
    "ebios.col.pp_confiance": "Con-fiance",
    "ebios.col.pp_menace": "Menace",
    "ebios.col.pp_exposition": "Exposition",
    "ebios.col.pp_bs": "BS concernés",

    // ── PP categories (select options) ──
    "ebios.pp.cat_client": "Client",
    "ebios.pp.cat_partenaire": "Partenaire",
    "ebios.pp.cat_prestataire": "Prestataire",

    // ── Column headers: Socle ──
    "ebios.col.socle_num": "#",
    "ebios.col.socle_theme": "Thématique",
    "ebios.col.socle_mesure": "Mesure / Attendu",
    "ebios.col.socle_conformite": "Conformité",
    "ebios.col.socle_statut": "Statut",
    "ebios.col.socle_ecart": "Écart identifié",
    "ebios.col.socle_priorite": "Priorité",
    "ebios.col.socle_mesures_prevues": "Mesures prévues",

    // ── Column headers: Référentiels complémentaires ──

    // ── Column headers: SR/OV ──
    "ebios.col.srov_couple": "Couple",
    "ebios.col.srov_sr": "Source de risque",
    "ebios.col.srov_ov": "Objectif visé",
    "ebios.col.srov_motivation": "Motiva-tion",
    "ebios.col.srov_ressources": "Ress-ources",
    "ebios.col.srov_activite": "Acti-vité",
    "ebios.col.srov_pertinence": "Perti-nence",
    "ebios.col.srov_priorite": "Priorité",
    "ebios.col.srov_justification": "Justification",

    // ── SROV priority labels ──
    "ebios.srov.p1": "P1",
    "ebios.srov.p2": "P2",
    "ebios.srov.non_retenu": "Non retenu",
    "ebios.srov.ecarte": "Écarté",

    // ── Column headers: ER ──
    "ebios.col.er_id": "ID",
    "ebios.col.er_evenement": "Événement redouté",
    "ebios.col.er_vm": "VM concernée",
    "ebios.col.er_dict": "DICT",
    "ebios.col.er_impacts": "Impacts",
    "ebios.col.er_gravite": "Gravité",
    "ebios.col.er_label": "Label",
    "ebios.er.gravite_par_cat": "Gravité par catégorie",

    // ── Column headers: SS ──
    "ebios.col.ss_id": "ID",
    "ebios.col.ss_scenario": "Scénario",
    "ebios.col.ss_srov": "Couple SR/OV",
    "ebios.col.ss_pp": "PP",
    "ebios.col.ss_bs": "BS ciblés",
    "ebios.col.ss_er": "ER associés",
    "ebios.col.ss_gravite": "Gravité",

    // ── Column headers: Eco ──
    "ebios.col.eco_pp": "PP",
    "ebios.col.eco_nom": "Nom",
    "ebios.col.eco_existantes": "Mesures existantes",
    "ebios.col.eco_complementaires": "Mesures complémentaires",
    "ebios.col.eco_dep": "Dép.",
    "ebios.col.eco_pen": "Pén.",
    "ebios.col.eco_mat": "Mat.",
    "ebios.col.eco_conf": "Conf.",
    "ebios.col.eco_menace": "Menace",
    "ebios.col.eco_exposition": "Exposition",

    // ── Column headers: SOP ──
    "ebios.col.sop_sop": "SOP",
    "ebios.col.sop_ss": "SS",
    "ebios.col.sop_phase": "Phase",
    "ebios.col.sop_action": "Action",
    "ebios.col.sop_bs": "BS ciblé",
    "ebios.col.sop_controle": "Contrôle existant",
    "ebios.col.sop_ref": "Réf. socle",
    "ebios.col.sop_efficacite": "Efficacité",
    "ebios.col.sop_mesure_proposee": "Mesure(s) proposée(s)",
    "ebios.col.sop_choose": "— choisir",

    // ── Efficacite labels ──
    "ebios.eff.absent": "Absent",
    "ebios.eff.partiel": "Partiel",
    "ebios.eff.efficace": "Efficace",

    // ── Column headers: SOP Synth ──
    "ebios.col.sopsynth_ss": "SS",
    "ebios.col.sopsynth_scenario": "Scenario",
    "ebios.col.sopsynth_gravite": "Gravite",
    "ebios.col.sopsynth_sop": "SOP",
    "ebios.col.sopsynth_efficacite": "Efficacité des mesures",
    "ebios.col.sopsynth_taux": "Taux faiblesse",
    "ebios.col.sopsynth_vinit": "V init.",
    "ebios.col.sopsynth_risque": "Risque initial",
    "ebios.col.sopsynth_no_sop": "Pas de SOP associé",

    // ── Column headers: Measures ──
    "ebios.col.m_id": "ID",
    "ebios.col.m_mesure": "Mesure",
    "ebios.col.m_details": "Détails",
    "ebios.col.m_origine": "Origine",
    "ebios.col.m_type": "Type",
    "ebios.col.m_sop": "SOP adressés",
    "ebios.col.m_phase": "Phase",
    "ebios.col.m_effet": "Effet",
    "ebios.col.m_ref_socle": "Réf. socle",
    "ebios.col.m_responsable": "Responsable",
    "ebios.col.m_echeance": "Échéance",
    "ebios.col.m_cout": "Coût",
    "ebios.col.m_statut": "Statut",

    // ── Measure origins ──
    "ebios.m.origine_socle": "Socle",
    "ebios.m.origine_ecosysteme": "Écosystème",
    "ebios.m.origine_sop": "SOP",
    "ebios.m.origine_complementaire": "Complémentaire",

    // ── Measure types ──
    "ebios.m.type_prevention": "Prévention",
    "ebios.m.type_detection": "Détection",
    "ebios.m.type_reaction": "Réaction",

    // ── Measure statuts ──
    "ebios.m.statut_termine": "Terminé",
    "ebios.m.statut_en_cours": "En cours",
    "ebios.m.statut_a_etudier": "À étudier",

    // ── Column headers: Residuals ──
    "ebios.col.r_ss": "SS",
    "ebios.col.r_scenario": "Scénario",
    "ebios.col.r_gravite": "Gravité",
    "ebios.col.r_mesures": "Mesures appliquées",
    "ebios.col.r_v_init": "V init.",
    "ebios.col.r_v_resid": "V résid.",
    "ebios.col.r_risque": "Risque résid.",
    "ebios.col.r_decision": "Décision",

    // ── Risk decisions ──
    "ebios.decision.accepter": "Accepter",
    "ebios.decision.reduire": "Réduire",
    "ebios.decision.transferer": "Transférer",
    "ebios.decision.eviter": "Éviter",

    // ── DICT ──
    "ebios.dict.d": "Disponibilité",
    "ebios.dict.i": "Intégrité",
    "ebios.dict.c": "Confidentialité",
    "ebios.dict.t": "Traçabilité",

    // ── Snapshots / History ──

    // ── Status messages ──
    "ebios.status.modified": "Modifié",
    "ebios.status.modified_refs": "Modifié + références mises à jour",
    "ebios.status.line_added": "Ligne ajoutée : {id}",
    "ebios.status.line_deleted": "Ligne supprimée",
    "ebios.status.sop_added": "SOP {id} ajouté",
    "ebios.status.phase_added": "Phase ajoutée à {id}",
    "ebios.status.phase_moved": "Phase déplacée",
    "ebios.status.deleted": "Supprimé",
    "ebios.status.efficacite": "Efficacité : {val}",
    "ebios.status.measure_created": "Mesure {id} créée et ajoutée",
    "ebios.status.sr_created": "{id} créée",
    "ebios.status.ov_created": "{id} créé",
    "ebios.status.loading_exceljs": "Chargement ExcelJS...",
    "ebios.status.exceljs_loaded": "ExcelJS charge",
    "ebios.status.loading_template": "Chargement template...",
    "ebios.status.generating_excel": "Generation Excel...",
    "ebios.status.excel_downloaded": "Excel telecharge",
    "ebios.status.reading_excel": "Lecture Excel...",
    "ebios.status.eco_moved_compl": "{id} déplacée en complémentaire — statut passé à 'À étudier'",
    "ebios.status.eco_moved_exist": "{id} déplacée dans les mesures existantes",
    "ebios.status.error": "Erreur : {msg}",

    // ── Prompt messages ──
    "ebios.prompt.new_socle_measure": "Description de la nouvelle mesure :",
    "ebios.prompt.new_sr": "Description de la nouvelle source de risque :",
    "ebios.prompt.new_ov": "Description du nouvel objectif visé :",
    "ebios.prompt.new_eco_measure": "Description de la nouvelle mesure écosystème :",
    "ebios.prompt.new_sop_measure": "Description de la nouvelle mesure SOP :",

    // ── Alert messages ──
    "ebios.alert.template_unavailable": "Template Excel non disponible. Utilisez python3 json_to_excel.py",
    "ebios.alert.excel_export_error": "Erreur export Excel: {msg}\nUtilisez python3 json_to_excel.py comme alternative.",
    "ebios.alert.excel_import_error": "Erreur import Excel: {msg}",
    "ebios.alert.exceljs_load_error": "Impossible de charger ExcelJS",

    // ── Validation ──

    // ── Misc ──
    "ebios.misc.click_choose": "Cliquer pour choisir...",
    "ebios.misc.filter": "Filtrer...",
    "ebios.misc.phases": "phases",
    "ebios.misc.measures_indicator": "Mesures",
    "ebios.misc.show_terminated": "Afficher aussi les mesures terminées",
    "ebios.misc.no_measures": "Aucune mesure",
    "ebios.misc.measures_todo_count": "{todo} mesures à mettre en oeuvre sur {total} au total",
    "ebios.misc.ss_not_evaluated": "{n} SS non évalués (pas de SOP ou V résiduelle)",
    "ebios.misc.eleve_label": "Élevé",
    "ebios.misc.moyen_label": "Moyen",
    "ebios.misc.faible_label": "Faible",
    "ebios.misc.non_applique_label": "Non appliqué",
    "ebios.misc.partiel_label": "Partiel",
    "ebios.misc.applique_label": "Appliqué",

    // ── Synthesis évolution ──
    "ebios.synth.col_ss": "SS",
    "ebios.synth.col_scenario": "Scenario",
    "ebios.synth.col_risque_initial": "Risque initial",
    "ebios.synth.col_risque_residuel": "Risque résiduel",
    "ebios.synth.col_evolution": "Évolution",
    "ebios.synth.col_decision": "Decision",
    "ebios.synth.col_gravite": "Gravit\u00e9",
    "ebios.synth.col_vraisemblance": "Vraisemblance",
    "ebios.synth.ameliore": "Amélioré",
    "ebios.synth.identique": "Identique",
    "ebios.synth.degrade": "Degrade",

    // ── Synthesis measures table ──
    "ebios.synth.col_id": "ID",
    "ebios.synth.col_mesure": "Mesure",
    "ebios.synth.col_origine": "Origine",
    "ebios.synth.col_responsable": "Responsable",
    "ebios.synth.col_echeance": "Échéance",
    "ebios.synth.col_statut": "Statut",

    // ── Eco SVG labels ──
    "ebios.eco.clients": "Clients",
    "ebios.eco.partenaires": "Partenaires",
    "ebios.eco.prestataires": "Prestataires",
    "ebios.eco.zone_danger": "Zone de danger (seuil : 2.5)",
    "ebios.eco.zone_controle": "Zone de contrôle (seuil : 0.9)",
    "ebios.eco.zone_veille": "Zone de veille (seuil : 0.2)",
    "ebios.eco.fiabilite": "FIABILITÉ CYBER :",
    "ebios.eco.fiab_faible": "Faible",
    "ebios.eco.fiab_moyenne": "Moyenne",
    "ebios.eco.fiab_bonne": "Bonne",
    "ebios.eco.fiab_elevee": "Élevée",
    "ebios.eco.diametre": "DIAMETRE = exposition",
    "ebios.eco.map_after": "Cartographie (après mesures écosystème)",
    "ebios.eco.map_initial": "Cartographie de l'écosystème (menace initiale)",

    // ── Gravity defaults ──
    "ebios.grav.extreme": "Extrême",
    "ebios.grav.critique": "Critique",
    "ebios.grav.grave": "Grave",
    "ebios.grav.significatif": "Significatif",
    "ebios.grav.faible": "Faible",
    "ebios.grav.desc_extreme": "Conséquences catastrophiques menaçant la survie de l'organisme",
    "ebios.grav.desc_critique": "Conséquences inacceptables (impact majeur sur les missions essentielles)",
    "ebios.grav.desc_grave": "Conséquences graves (dégradation notable des activités)",
    "ebios.grav.desc_significatif": "Conséquences significatives mais maîtrisables (impact limité et temporaire)",
    "ebios.grav.desc_faible": "Conséquences limitées et acceptables",

    // ── SOP phase (MITRE ATT&CK tactics) ──
    "ebios.sop.phase_other": "Autre (texte libre)…",
    "ebios.sop.phase_free_prompt": "Nom de la phase (texte libre)",
    "ebios.attack.TA0043": "Reconnaissance",
    "ebios.attack.TA0042": "Développement de ressources",
    "ebios.attack.TA0001": "Accès initial",
    "ebios.attack.TA0002": "Exécution",
    "ebios.attack.TA0003": "Persistance",
    "ebios.attack.TA0004": "Élévation de privilèges",
    "ebios.attack.TA0005": "Contournement des défenses",
    "ebios.attack.TA0006": "Accès aux identifiants",
    "ebios.attack.TA0007": "Découverte",
    "ebios.attack.TA0008": "Déplacement latéral",
    "ebios.attack.TA0009": "Collecte",
    "ebios.attack.TA0011": "Commande et contrôle",
    "ebios.attack.TA0010": "Exfiltration",
    "ebios.attack.TA0040": "Impact",

    // ── Measure effects ──
    "ebios.m.renforcement_socle": "Renforcement mesure socle {ref}",
    "ebios.m.mesure_eco_pour": "Mesure écosystème pour {pp}",

    // ── Référentiels catalog descriptions (FR) ──
    "ebios.ref.lpm.desc": "Loi de Programmation Militaire (France) — règles de sécurité des arrêtés sectoriels ANSSI pour OIV",
    "ebios.ref.loi0520.desc": "Loi marocaine sur la cybersécurité — obligations des organismes soumis",
    "ebios.ref.dora.desc": "Digital Operational Resilience Act (UE 2022/2554) — résilience numérique du secteur financier",
    "ebios.ref.hds.desc": "Certification Hébergeur de Données de Santé (France) — exigences complémentaires ISO 27001",
    "ebios.ref.secnumcloud.desc": "Référentiel de qualification ANSSI pour les prestataires de services Cloud (v3.2)",
    "ebios.ref.nis2.desc": "Directive NIS 2 (UE 2022/2555) — mesures de cybersécurité pour entités essentielles et importantes",
    "ebios.ref.cra.desc": "Règlement UE sur la cyber-résilience (CRA 2024) — exigences pour produits comportant des éléments numériques",
    "ebios.ref.soc2.desc": "Trust Services Criteria (AICPA) — sécurité, disponibilité, intégrité, confidentialité, vie privée",

    // ── Help content ──
    "ebios.help.methodo": "<h1 class=\"heading-blue\">Guide méthodologique EBIOS Risk Manager</h1>\n<p class=\"text-muted\">Méthode d'analyse de risques publiée par l'ANSSI — 5 ateliers</p>\n\n<h2>Principe général</h2>\n<p>EBIOS RM est une méthode d'analyse de risques qui part des <strong>valeurs métier</strong> de l'organisation pour identifier les <strong>scénarios de risque</strong> les plus pertinents et définir un <strong>plan de traitement</strong> proportionné. Elle se déroule en 5 ateliers séquentiels, chacun alimentant le suivant.</p>\n\n<h2>Échelles d'évaluation</h2>\n<table><thead><tr><th>Échelle</th><th>Niveaux</th><th>Usage</th></tr></thead><tbody>\n<tr><td><strong>Gravité</strong></td><td>3 à 5 niveaux : Faible, Significatif, Grave, Critique, Extrême (selon l'échelle retenue)</td><td>Impact des événements redoutés et des scénarios</td></tr>\n<tr><td><strong>Vraisemblance</strong></td><td>V1 à V4</td><td>Probabilité de succès d'un scénario opérationnel</td></tr>\n<tr><td><strong>Niveau de risque</strong></td><td>Faible / Moyen / Élevé</td><td>Croisement Gravité &times; Vraisemblance dans la matrice de risque</td></tr>\n<tr><td><strong>Exposition écosystème</strong></td><td>Faible / Modérée / Élevée / Critique</td><td>Seuils sur le niveau de menace des parties prenantes</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Matrice ajustable</strong> : chaque cellule Gravité &times; Vraisemblance de la matrice peut être requalifiée (Faible / Moyen / Élevé) selon l'appétence au risque de l'organisation. La requalification se répercute sur toute l'analyse.</div>\n\n<h2>Atelier 1 — Cadrage et socle de sécurité</h2>\n<h3>Objectif</h3>\n<p>Définir le périmètre de l'étude, identifier les actifs critiques, les événements redoutés et évaluer le niveau de sécurité existant.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>DSI</strong>, <strong>Direction métier</strong>, <strong>DPO</strong> (si données personnelles)</p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Étape</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Contexte</td><td>Périmètre, réglementation, échelle de gravité</td><td>Définir l'organisation, l'objet de l'étude, la réglementation applicable et l'échelle de gravité (3 à 5 niveaux)</td></tr>\n<tr><td>Valeurs métier</td><td>Processus et informations essentiels</td><td>Identifier 5-10 VM, évaluer les besoins DICT de 1 à N (selon l'échelle)</td></tr>\n<tr><td>Biens supports</td><td>SI qui supporte les VM</td><td>Lister les serveurs, applications, réseaux, données et les rattacher aux VM</td></tr>\n<tr><td>Événements redoutés</td><td>Impacts redoutés par VM</td><td>Pour chaque VM, identifier les ER et coter leur gravité</td></tr>\n<tr><td>Socle de sécurité</td><td>Conformité aux référentiels</td><td>Évaluer chaque mesure (0-100%), identifier les écarts et les prioriser</td></tr>\n</tbody></table>\n<h3>Socle et référentiels</h3>\n<p>Le socle s'évalue par rapport au <strong>guide d'hygiène ANSSI</strong> (42 mesures) ou à l'<strong>ISO 27001 — Annexe A</strong> (93 mesures). Selon le contexte réglementaire, des <strong>référentiels complémentaires</strong> peuvent être ajoutés au périmètre : NIS 2, DORA, Cyber Resilience Act (CRA), SecNumCloud, HDS, LPM, Loi 05-20 (Maroc), SOC 2, GAMP 5. Les écarts constatés alimentent le plan de traitement de l'atelier 5.</p>\n\n<h2>Atelier 2 — Sources de risque et objectifs visés</h2>\n<h3>Objectif</h3>\n<p>Identifier <strong>qui</strong> pourrait attaquer (sources de risque) et <strong>pourquoi</strong> (objectifs visés). Évaluer la pertinence de chaque couple SR/OV.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Analyste CTI</strong> (si disponible), <strong>Direction</strong></p>\n<h3>Guide</h3>\n<ul>\n<li>Créer les sources de risque (cybercriminels, employés, états, concurrents...)</li>\n<li>Créer les objectifs visés (ransomware, vol de données, sabotage...)</li>\n<li>Combiner en couples et noter Motivation (0-4), Ressources (0-4), Activité (0-4)</li>\n<li>Pertinence = somme /12. Priorité : P1 (&gt;7), P2 (5-7), Non retenu (3-4), Écarté (&le;2)</li>\n</ul>\n\n<h2>Atelier 3 — Scénarios stratégiques</h2>\n<h3>Objectif</h3>\n<p>Identifier et évaluer les <strong>parties prenantes</strong> de l'écosystème, construire les <strong>chemins d'attaque stratégiques</strong> et définir les mesures de réduction de la menace écosystème.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Direction métier</strong>, <strong>Responsable des achats/partenariats</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Étape</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Parties prenantes</td><td>Acteurs de l'écosystème</td><td>Fournisseurs (prestataires), partenaires, clients — évaluer D/P/M/C (1-4), catégorie</td></tr>\n<tr><td>Scénarios stratégiques</td><td>Chemins d'attaque</td><td>Lier SR/OV + PP + BS + ER. La gravité du scénario est le MAX des gravités des ER associés</td></tr>\n<tr><td>Mesures écosystème</td><td>Réduction menace PP</td><td>Pour chaque PP, lister les mesures et réévaluer D/P/M/C résiduels. Cartographie de l'écosystème</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Règle PP</strong> : si l'objet de l'étude est l'entreprise entière, les collaborateurs internes ne sont PAS des PP. Seuls les acteurs externes sont des PP.</div>\n\n<h2>Atelier 4 — Scénarios opérationnels</h2>\n<h3>Objectif</h3>\n<p>Détailler chaque scénario stratégique en <strong>kill chain technique</strong> : phases d'attaque, contrôles existants, efficacité. Calculer la <strong>vraisemblance opérationnelle</strong> et le <strong>risque initial</strong>.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Équipe technique/SOC</strong>, <strong>Architecte sécurité</strong>, <strong>DevOps/Admin sys</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Étape</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Scénarios opérationnels</td><td>Kill chain par SOP</td><td>4-8 phases par SOP, contrôles, efficacité (Absent/Partiel/Efficace), mesures proposées</td></tr>\n<tr><td>Risques initiaux</td><td>Synthèse des risques</td><td>Pour chaque SS : gravité, efficacité des contrôles, taux de faiblesse, V opérationnelle, risque initial</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Formules</strong> : Taux de faiblesse = MAX(0, (Absent&times;2 + Partiel - Efficace&times;2)) / (Total&times;2). Chaque phase Efficace compense un Absent dans la kill chain. La vraisemblance opérationnelle en découle : V4 si taux &ge; 70%, V3 si &ge; 40%, V2 si &ge; 20%, V1 sinon.</div>\n\n<h2>Atelier 5 — Traitement du risque</h2>\n<h3>Objectif</h3>\n<p>Définir le <strong>plan de traitement</strong> : mesures de sécurité, responsables, échéances. Évaluer les <strong>risques résiduels</strong> et prendre les décisions de traitement.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Direction</strong>, <strong>DSI</strong>, <strong>Responsables métier</strong>, <strong>DPO</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Étape</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Référentiel mesures</td><td>Toutes les mesures</td><td>Consolider : socle appliqué (Terminé), socle à renforcer, écosystème, SOP, complémentaires</td></tr>\n<tr><td>Risques résiduels</td><td>Risque après traitement</td><td>Pour chaque SS, évaluer la V résiduelle (1-4) et choisir la décision (Accepter / Réduire / Transférer / Éviter)</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Priorité des mesures</strong> : proposer d'abord les mesures du socle manquantes, puis les mesures écosystème, puis des mesures complémentaires uniquement si nécessaire.</div>\n\n<h2>Intégration à la suite CISO Toolbox</h2>\n<p>En déploiement suite, les <strong>mesures de sécurité</strong> définies dans ce module remontent automatiquement dans le <strong>plan d'action de Pilot</strong> (le hub de gouvernance), où elles sont consolidées avec les items des autres modules sous le terme commun <strong>Action</strong> et peuvent être regroupées en <strong>projets</strong> pour piloter l'avancement transverse. Le module reste l'autorité de son domaine — Pilot ne fait que consolider.</p>\n\n<h2>Glossaire</h2>\n<table><thead><tr><th>Acronyme</th><th>Signification</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>VM</strong></td><td>Valeur Métier</td><td>Processus ou activité essentielle de l'organisation (ex : gestion des commandes, R&amp;D)</td></tr>\n<tr><td><strong>BS</strong></td><td>Bien Support</td><td>Composant du SI qui supporte une VM (serveur, application, réseau, données)</td></tr>\n<tr><td><strong>PP</strong></td><td>Partie Prenante</td><td>Acteur externe à l'objet d'étude (fournisseur, prestataire, partenaire, client)</td></tr>\n<tr><td><strong>SR</strong></td><td>Source de Risque</td><td>Acteur de menace potentiel (cybercriminel, employé malveillant, concurrent, état)</td></tr>\n<tr><td><strong>OV</strong></td><td>Objectif Visé</td><td>But poursuivi par la source de risque (extorsion, vol de données, sabotage)</td></tr>\n<tr><td><strong>SR/OV</strong></td><td>Couple Source/Objectif</td><td>Combinaison d'une SR et d'un OV évaluée en pertinence</td></tr>\n<tr><td><strong>ER</strong></td><td>Événement Redouté</td><td>Impact métier craint en termes de DICT (ex : fuite de données clients)</td></tr>\n<tr><td><strong>SS</strong></td><td>Scénario Stratégique</td><td>Chemin d'attaque : QUI (SR) attaque POURQUOI (OV) VIA QUI (PP) ciblant QUOI (BS) provoquant QUEL impact (ER)</td></tr>\n<tr><td><strong>SOP</strong></td><td>Scénario Opérationnel</td><td>Kill chain technique détaillant les phases d'attaque d'un SS</td></tr>\n<tr><td><strong>DICT</strong></td><td>Disponibilité, Intégrité, Confidentialité, Traçabilité</td><td>Les 4 critères de sécurité pour évaluer les besoins et les atteintes</td></tr>\n<tr><td><strong>PACS</strong></td><td>Plan d'Amélioration Continue de la Sécurité</td><td>Plan de traitement issu de l'analyse EBIOS RM</td></tr>\n</tbody></table>",

    "ebios.help.usage": "<h1 class=\"heading-blue\">Guide d'utilisation</h1>\n<p class=\"text-muted\">Comment utiliser l'application interactive EBIOS RM</p>\n\n<h2>Vue d'ensemble</h2>\n<p>L'application est organisée en <strong>3 zones</strong> : la <strong>barre d'application</strong> en haut (menu Fichier, langue, thème, réglages), le <strong>rail latéral</strong> à gauche (navigation par atelier, catalogue d'analyses, annuler/rétablir) et la <strong>zone de travail</strong> au centre (tableaux éditables).</p>\n<div class=\"help-tip\">Dans cette édition connectée, les analyses sont <strong>enregistrées automatiquement côté serveur</strong> après chaque modification. Le menu Fichier reste disponible pour échanger des fichiers locaux (JSON, Excel) et produire les livrables (PPTX, Word). Risk est un module de la suite CISO Toolbox, aux côtés de Pilot, Compliance, Vendor, Asset, AppSec (SAST/SCA), Surface et Access.</div>\n\n<h2>Navigation</h2>\n<table><thead><tr><th>Élément</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Rail latéral</strong></td><td>Une entrée par page, regroupée par atelier. Cliquer sur le titre d'un groupe pour le replier/déplier. Sur mobile, le menu s'ouvre via le bouton &#9776;.</td></tr>\n<tr><td><strong>Synthèse</strong></td><td>Vue consolidée : indicateurs, cartographies des risques initiaux et résiduels, conformité du socle, distribution et évolution des risques, mesures à mettre en œuvre. Se met à jour automatiquement.</td></tr>\n<tr><td><strong>Aide</strong></td><td>Les entrées Méthodologie et Utilisation ouvrent ce panneau d'aide (fermeture par le &times; ou un clic en dehors).</td></tr>\n</tbody></table>\n\n<h2>Catalogue d'analyses</h2>\n<p>La section <strong>Analyses</strong> en bas du rail latéral gère plusieurs analyses stockées côté serveur :</p>\n<ul>\n<li><strong>+</strong> : créer une nouvelle analyse</li>\n<li><strong>Recherche</strong> : filtrer la liste par nom</li>\n<li>Cliquer sur une carte pour basculer d'une analyse à l'autre</li>\n<li>Boutons de chaque carte : <strong>Dupliquer</strong>, <strong>Renommer</strong>, <strong>Exporter</strong> (téléchargement JSON), <strong>Supprimer</strong></li>\n</ul>\n<div class=\"help-tip\">L'enregistrement serveur est automatique quelques instants après chaque modification. Exportez régulièrement vos analyses importantes en JSON pour disposer d'une copie locale.</div>\n\n<h2>Édition des tableaux</h2>\n<h3>Modifier une cellule</h3>\n<p>Les cellules éditables contiennent un <strong>champ de saisie</strong> (texte ou nombre) ou une <strong>liste déroulante</strong>. Les modifications sont prises en compte dès que vous quittez le champ (tab, clic ailleurs).</p>\n<h3>Ajouter une ligne</h3>\n<p>Cliquer sur le bouton <strong class=\"text-green\">+ Ajouter</strong> en bas du tableau. L'identifiant (VM-XX, BS-XX, etc.) est généré automatiquement.</p>\n<h3>Supprimer une ligne</h3>\n<p>Cliquer sur le bouton <strong class=\"text-red\">X</strong> à droite de la ligne. Une confirmation est demandée si la ligne contient des données.</p>\n<h3>Valeurs calculées</h3>\n<p>Les colonnes sur fond gris sont calculées automatiquement et ne sont pas éditables :</p>\n<ul>\n<li><strong>Menace PP</strong> = (Pénétration &times; Dépendance) / (Maturité &times; Confiance)</li>\n<li><strong>Exposition PP</strong> = seuils sur la menace (&ge;4 Critique, &ge;2 Élevée, &ge;1 Modérée, &lt;1 Faible)</li>\n<li><strong>Pertinence SR/OV</strong> = (Motivation + Ressources + Activité) / 12</li>\n<li><strong>Gravité SS</strong> = maximum des gravités des ER associés</li>\n<li><strong>Taux de faiblesse SOP</strong> = MAX(0, (Absent&times;2 + Partiel - Efficace&times;2)) / (Total&times;2)</li>\n<li><strong>Vraisemblance SOP</strong> = dérivée du taux de faiblesse (V1 à V4)</li>\n<li><strong>Risque initial/résiduel</strong> = croisement Gravité &times; Vraisemblance dans la matrice (Faible / Moyen / Élevé)</li>\n</ul>\n\n<h2>Gestion des colonnes</h2>\n<table><thead><tr><th>Action</th><th>Comment</th></tr></thead><tbody>\n<tr><td><strong>Masquer une colonne</strong></td><td>Cliquer sur le <strong>&times;</strong> à droite du nom de la colonne dans l'en-tête du tableau</td></tr>\n<tr><td><strong>Restaurer une colonne</strong></td><td>Un bouton <strong>Colonnes masquées (N)</strong> apparaît au-dessus du tableau — cliquer pour choisir les colonnes à restaurer</td></tr>\n<tr><td><strong>Redimensionner</strong></td><td>Glisser le bord droit d'un en-tête de colonne</td></tr>\n</tbody></table>\n\n<h2>Références entre éléments</h2>\n<p>Les champs qui référencent d'autres éléments (VM dans les BS, PP dans les SS, ER dans les SS, etc.) utilisent un <strong>sélecteur avec recherche</strong> :</p>\n<ul>\n<li>Cliquer sur le champ pour ouvrir le sélecteur</li>\n<li>Taper pour filtrer les éléments disponibles</li>\n<li>Cocher/décocher pour sélectionner (multi-sélection possible)</li>\n<li>Cliquer en dehors pour fermer</li>\n</ul>\n<div class=\"help-tip\">Quand vous renommez un élément (VM, BS, PP, ER...), toutes les références dans les autres tableaux sont mises à jour automatiquement.</div>\n\n<h2>Menu Fichier</h2>\n<p>Le menu <strong>Fichier</strong> en haut de l'écran gère les fichiers locaux et les livrables :</p>\n<table><thead><tr><th>Action</th><th>Format</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Ouvrir</strong></td><td>.json / .enc</td><td>Charge un fichier JSON (ou chiffré) depuis le disque et remplace les données de l'analyse en cours. Validation automatique du format.</td></tr>\n<tr><td><strong>Enregistrer</strong></td><td>.json / .enc</td><td>Sauvegarde rapide dans le fichier ouvert. Nécessite un navigateur compatible File System Access (l'entrée est masquée sinon).</td></tr>\n<tr><td><strong>Enregistrer sous</strong></td><td>.json / .enc</td><td>Sauvegarde en JSON avec option de chiffrement AES-256 par mot de passe (extension .enc).</td></tr>\n<tr><td><strong>Import Excel</strong></td><td>.xlsx</td><td>Lit un fichier Excel EBIOS RM existant et charge les données. Compatible avec les fichiers générés par l'application.</td></tr>\n<tr><td><strong>Export Excel</strong></td><td>.xlsx</td><td>Génère un classeur complet : feuilles par atelier, formules et mise en forme conditionnelle.</td></tr>\n<tr><td><strong>Synthèse managériale</strong></td><td>.pptx</td><td>Génère une présentation de synthèse : indicateurs, matrices des risques initiaux et résiduels, tableaux clés — prête pour une restitution direction.</td></tr>\n<tr><td><strong>Export rapport</strong></td><td>.docx</td><td>Génère le rapport d'analyse complet à partir d'un modèle Word (français ou anglais selon la langue active), cartographies incluses.</td></tr>\n<tr><td><strong>Nouvelle analyse</strong></td><td>—</td><td>Crée une nouvelle analyse vierge dans le catalogue.</td></tr>\n</tbody></table>\n<div class=\"help-tip\">Les moteurs d'export (Excel, PPTX, Word) sont embarqués dans l'application : aucune connexion externe n'est nécessaire pour générer les livrables.</div>\n\n<h2>Import depuis Vendor</h2>\n<p>Sur la page <strong>Parties prenantes</strong>, le bouton <strong>Importer depuis Vendor</strong> charge un fichier JSON exporté depuis le module Vendor de la suite (export « PP » ou fichier de sauvegarde complet). Les fournisseurs sont créés comme parties prenantes avec leurs cotations D/P/M/C, leurs mesures de sécurité sont ajoutées au référentiel des mesures (avec la mention du fournisseur d'origine), et les doublons sont ignorés.</p>\n\n<h2>Historique et annulation</h2>\n<h3>Annuler / Rétablir</h3>\n<p>Chaque modification est enregistrée dans l'historique (50 niveaux maximum). Utilisez les boutons en bas du rail latéral ou les raccourcis :</p>\n<ul>\n<li><strong>Ctrl+Z</strong> (ou Cmd+Z sur Mac) : annuler la dernière modification</li>\n<li><strong>Ctrl+Y</strong> ou <strong>Ctrl+Maj+Z</strong> : rétablir la modification annulée</li>\n</ul>\n<h3>Points de sauvegarde</h3>\n<p>Dans cette édition connectée, la persistance est assurée par l'enregistrement automatique côté serveur ; les snapshots stockés dans le navigateur (édition autonome) ne sont pas disponibles. Pour créer des copies datées de l'analyse, utilisez <strong>Exporter</strong> dans le catalogue d'analyses ou <strong>Fichier &rarr; Enregistrer sous</strong>.</p>\n\n<h2>Réglages</h2>\n<p>La barre d'application propose trois boutons : <strong>globe</strong> (basculer français/anglais), <strong>lune</strong> (thème clair/sombre) et <strong>roue crantée</strong> (&#9881;) pour les réglages :</p>\n<ul>\n<li><strong>Langue</strong> : choix français / anglais</li>\n<li><strong>Assistant IA</strong> : activer/désactiver et, en mode direct, choisir le fournisseur (Anthropic, OpenAI, AWS Bedrock ou LLM personnalisé), le modèle, la clé API et éventuellement l'endpoint</li>\n<li><strong>Instructions méthodologiques</strong> : charger un fichier Markdown pour guider les suggestions de l'IA</li>\n</ul>\n<div class=\"help-tip\"><strong>Mode administré</strong> : quand l'IA est gérée de manière centralisée, seul l'interrupteur d'activation est proposé — fournisseur, modèle et clé API sont configurés par l'administrateur et les appels transitent par le serveur du module (aucune clé API dans le navigateur).</div>\n\n<h2>Assistant IA</h2>\n<p>L'assistant IA est un module optionnel qui propose des suggestions contextualisées à chaque étape de l'analyse. Il est <strong>désactivé par défaut</strong>.</p>\n<h3>Utilisation</h3>\n<p>Une fois activé dans les Réglages, un bouton <strong>&#10024; IA</strong> apparaît sur chaque page (Valeurs métier, Biens supports, Événements redoutés, Sources de risque, Parties prenantes, Scénarios, Socle, Mesures, Risques résiduels...). En cliquant dessus :</p>\n<ul>\n<li>L'assistant analyse les données déjà saisies dans l'analyse en cours</li>\n<li>Il propose des éléments supplémentaires (VM, BS, SR/OV, scénarios, mesures, kill chains...) ou la mise à jour d'éléments existants</li>\n<li>Chaque suggestion peut être <strong>acceptée</strong> (ajoutée à l'analyse) ou <strong>ignorée</strong></li>\n<li>Vous pouvez aussi donner vos propres instructions (ex : « propose des scénarios liés au ransomware »)</li>\n</ul>\n<h3>Instructions méthodologiques</h3>\n<p>Un fichier Markdown peut être chargé dans les Réglages pour enrichir le contexte de l'IA :</p>\n<ul>\n<li>Référentiel interne de l'organisation</li>\n<li>Consignes de rédaction ou de nommage</li>\n<li>Méthodologie spécifique ou compléments à EBIOS RM</li>\n<li>Politique de sécurité ou charte applicable</li>\n</ul>\n<p>Ce fichier est ajouté au prompt système de chaque requête IA.</p>\n<h3>Risques et précautions</h3>\n<ul>\n<li><strong>Partage de données</strong> : les données de l'analyse sont envoyées au fournisseur IA pour générer les suggestions. Vérifiez que votre politique de confidentialité et vos engagements contractuels le permettent.</li>\n<li><strong>Mode direct (clé personnelle)</strong> : la clé API est transmise dans les en-têtes HTTP depuis le navigateur. Elle est visible dans les DevTools, capturable par les extensions navigateur, et peut être journalisée par un proxy d'entreprise. Utilisez un profil navigateur dédié, sans extensions. La clé est stockée dans localStorage, jamais dans les fichiers sauvegardés.</li>\n<li><strong>Mode administré</strong> : les appels transitent par le serveur du module — aucune clé API dans le navigateur.</li>\n<li><strong>Suggestions non garanties</strong> : les propositions de l'IA sont à valider par l'analyste.</li>\n</ul>\n\n<h2>Sécurité des données</h2>\n<ul>\n<li><strong>Accès authentifié</strong> : quand l'authentification est activée, l'accès au module passe par la page de connexion de la suite ; la déconnexion est disponible dans la barre d'application</li>\n<li><strong>Stockage serveur</strong> : les analyses sont conservées en base de données côté serveur, avec enregistrement automatique</li>\n<li><strong>Chiffrement des exports JSON</strong> : AES-256-GCM avec clé dérivée par PBKDF2 (250 000 itérations)</li>\n<li><strong>Validation import</strong> : chaque fichier JSON importé est validé avant chargement (structure, types, bornes)</li>\n<li><strong>Clés API (mode direct)</strong> : stockées uniquement dans localStorage, jamais dans les fichiers sauvegardés</li>\n</ul>\n\n<h2>Raccourcis clavier</h2>\n<table><thead><tr><th>Raccourci</th><th>Action</th></tr></thead><tbody>\n<tr><td><strong>Ctrl+S</strong> / <strong>Cmd+S</strong></td><td>Enregistrer (fichier local)</td></tr>\n<tr><td><strong>Ctrl+Z</strong> / <strong>Cmd+Z</strong></td><td>Annuler</td></tr>\n<tr><td><strong>Ctrl+Y</strong> ou <strong>Ctrl+Maj+Z</strong></td><td>Rétablir</td></tr>\n<tr><td><strong>Tab</strong></td><td>Passer au champ suivant dans un tableau</td></tr>\n<tr><td><strong>Échap</strong></td><td>Fermer une boîte de dialogue</td></tr>\n</tbody></table>\n\n<h2>Bonnes pratiques</h2>\n<ul>\n<li><strong>Exporter régulièrement</strong> : l'enregistrement serveur est automatique, mais exportez vos analyses importantes en JSON (catalogue &rarr; Exporter ou Fichier &rarr; Enregistrer sous) pour disposer de copies locales</li>\n<li><strong>Suivre l'ordre des ateliers</strong> : les données des ateliers suivants dépendent des précédents (VM &rarr; BS &rarr; ER &rarr; SR/OV &rarr; PP &rarr; SS &rarr; SOP &rarr; Mesures)</li>\n<li><strong>Vérifier la synthèse</strong> : la page Synthèse donne une vue globale — les indicateurs et matrices se mettent à jour automatiquement</li>\n<li><strong>Livrables</strong> : Export Excel pour le classeur détaillé, Synthèse managériale (PPTX) pour la restitution direction, Export rapport (Word) pour le rapport formel</li>\n</ul>\n\n<h2>Fonctionnalités nécessitant l'IA</h2>\n<p>Ces fonctionnalités appellent un modèle de langage et ne sont disponibles qu'une fois l'IA configurée. Elles sont <strong>optionnelles</strong> : sans configuration, elles sont masquées ou inactives et le reste du module fonctionne normalement.</p>\n<ul>\n<li><strong>Assistant EBIOS RM</strong> : suggestions par atelier (valeurs métier, événements redoutés, sources de risque, scénarios stratégiques et opérationnels, mesures de traitement)</li>\n</ul>\n<p class=\"help-tip\">Où configurer : dans une installation autonome, via <strong>Réglages &rarr; IA</strong> du module (votre propre clé API). Dans la suite, les clés sont centralisées par <strong>Pilot</strong> et poussées aux modules &mdash; rien à saisir ici, et l'accès à l'IA se donne par utilisateur dans les habilitations.</p>",

    "matrix.low": "Faible",
    "matrix.moderate": "Modéré",
    "matrix.significant": "Significatif",
    "matrix.high": "Élevé",
    "matrix.critical": "Critique",
    "matrix.extreme": "Extrême",
    "matrix.x": "Impact",
    "matrix.y": "Vraisemblance",
    "settings.title": "Réglages",
    "settings.ai_section": "Assistant IA",
    "settings.saved": "Réglages enregistrés",
    "settings.language": "Langue",
    "settings.ai_privacy_warning": "En activant l'assistant IA :\n\n1. PARTAGE DE DONNÉES — Les données de votre analyse (contexte, exigences, mesures) seront envoyées au fournisseur IA sélectionné. Assurez-vous que votre politique de confidentialité et vos engagements contractuels autorisent ce partage.\n\n2. EXPOSITION DE LA CLÉ API — La clé API est transmise depuis votre navigateur. Elle est visible dans les outils de développement (DevTools) et peut être capturée par des extensions navigateur. Utilisez de préférence un navigateur sans extensions ou un profil dédié.\n\n3. RÉSEAU — Les échanges sont chiffrés (HTTPS) mais peuvent être journalisés par un proxy d'entreprise.\n\nVoulez-vous continuer ?",
    "settings.ai_enable": "Activer l'assistant IA",
    "settings.save": "Enregistrer",
});

// ═══════════════════════════════════════════════════════════════════════
// ENGLISH
// ═══════════════════════════════════════════════════════════════════════
