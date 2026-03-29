// EBIOS RM — French translations
// ═══════════════════════════════════════════════════════════════════════
// EBIOS RM — Traductions FR / EN
// ═══════════════════════════════════════════════════════════════════════

_registerTranslations("fr", {

    // ── Label app ──
    "ebios.label": "analyse",

    // ── Navigation (sidebar) ──
    "ebios.sidebar.synth": "Synthese",
    "ebios.sidebar.section_cadrage": "Cadrage",
    "ebios.sidebar.a1": "Atelier 1 - Cadrage et socle de securite",
    "ebios.sidebar.section_risques": "Risques",
    "ebios.sidebar.a2": "Atelier 2 - Sources de risques",
    "ebios.sidebar.a3": "Atelier 3 - Scenarios strategiques",
    "ebios.sidebar.a4": "Atelier 4 - Scenarios operationnels",
    "ebios.sidebar.section_traitement": "Traitement",
    "ebios.sidebar.a5": "Atelier 5 - Traitement du risque",
    "ebios.sidebar.section_aide": "Aide",
    "ebios.sidebar.methodo": "Methodologie",
    "ebios.sidebar.usage": "Utilisation",
    "ebios.sidebar.section_historique": "Historique",
    "ebios.sidebar.snapshots": "Snapshots",

    // ── NAV subtabs ──
    "ebios.nav.synth": "Synthese",
    "ebios.nav.context": "Contexte",
    "ebios.nav.vm": "Valeurs Metier",
    "ebios.nav.bs": "Biens Supports",
    "ebios.nav.er": "Evenements Redoutes",
    "ebios.nav.socle": "Socle de securite",
    "ebios.nav.srov": "Couples SR/OV",
    "ebios.nav.pp": "Parties Prenantes",
    "ebios.nav.ss": "Scenarios Strategiques",
    "ebios.nav.eco": "Mesures Ecosysteme",
    "ebios.nav.sop": "Scenarios Operationnels",
    "ebios.nav.sop_synth": "Risques initiaux",
    "ebios.nav.measures": "Referentiel Mesures",
    "ebios.nav.residuals": "Risques Residuels",
    "ebios.nav.history": "Historique",

    // ── Toolbar menu ──
    "ebios.menu.file": "Fichier",
    "ebios.menu.open": "Ouvrir",
    "ebios.menu.save": "Enregistrer",
    "ebios.menu.save_as": "Enregistrer sous",
    "ebios.menu.import_excel": "Import Excel",
    "ebios.menu.export_excel": "Export Excel",
    "ebios.menu.new_analysis": "Nouvelle analyse",

    // ── Panel descriptions ──
    "ebios.desc.synth": "Vue consolidee de l'analyse : indicateurs cles, cartographies des risques, evolution et conformite du socle.",
    "ebios.desc.context": "Informations generales sur l'organisation, le perimetre de l'etude et le cadre reglementaire.",
    "ebios.desc.vm": "Valeurs metier essentielles de l'organisation : processus ou informations critiques. Preciser la nature (Information ou Processus) et le responsable.",
    "ebios.desc.bs": "Composants du systeme d'information qui supportent les valeurs metier : applications, serveurs, reseaux, donnees.",
    "ebios.desc.pp": "Acteurs externes a l'objet d'etude (fournisseurs, prestataires, partenaires). Evaluer leur niveau de menace via 4 criteres : Dependance, Penetration, Maturite cyber, Confiance.",
    "ebios.desc.socle": "Evaluation de la conformite au referentiel de securite (ANSSI 42 mesures ou ISO 27001 93 mesures). Saisir le pourcentage de conformite et les ecarts identifies.",
    "ebios.desc.srov": "Identification des sources de risque (acteurs de menace) et de leurs objectifs. Chaque couple SR/OV est evalue sur 3 criteres (Motivation, Ressources, Activite) pour determiner sa pertinence.",
    "ebios.desc.er": "Événements redoutés en termes d'impact métier pour chaque valeur métier. La gravité détermine l'importance de l'événement sur une échelle de 1 à {max}.",
    "ebios.desc.ss": "Chemins d'attaque strategiques : QUI (SR) attaque POURQUOI (OV), VIA QUI (PP), ciblant QUOI (BS), provoquant QUEL evenement (ER). La gravite est calculee automatiquement (MAX des ER).",
    "ebios.desc.eco": "Mesures de securite appliquees aux parties prenantes de l'ecosysteme pour reduire leur niveau de menace. Les mesures sont referencees dans le referentiel 5a.",
    "ebios.desc.sop": "Detail des phases d'attaque (kill chain) pour chaque scenario operationnel. Pour chaque phase, identifier le controle existant, son efficacite, et proposer des mesures de traitement.",
    "ebios.desc.sop_synth": "Synthese des risques initiaux : pour chaque scenario strategique, la gravite (issue des ER) croisee avec la vraisemblance operationnelle (issue des SOP) donne le niveau de risque initial.",
    "ebios.desc.measures": "Referentiel complet des mesures de securite : mesures du socle (appliquees et manquantes), mesures ecosysteme, mesures SOP et mesures complementaires. Chaque mesure est tracee vers son origine.",
    "ebios.desc.residuals": "Evaluation du risque residuel apres application des mesures. Pour chaque scenario strategique, definir la vraisemblance residuelle et la decision de traitement.",
    "ebios.desc.history": "Points de sauvegarde et historique des modifications. Les snapshots sont stockes dans le navigateur.",

    // ── Footer ──
    "ebios.footer": "Rapport interactif EBIOS RM — Donnees modifiables, sauvegarde JSON",

    // ── Synthesis cards ──
    "ebios.synth.initial_map": "Cartographie des risques initiaux",
    "ebios.synth.residual_map": "Cartographie des risques residuels",
    "ebios.synth.socle_compliance": "Conformite du socle",
    "ebios.synth.risk_dist": "Distribution des risques residuels",
    "ebios.synth.risk_evolution": "Evolution des risques",
    "ebios.synth.measures_todo": "Mesures a mettre en oeuvre",

    // ── Buttons ──
    "ebios.btn.add_vm": "+ Ajouter une valeur metier",
    "ebios.btn.add_bs": "+ Ajouter un bien support",
    "ebios.btn.add_pp": "+ Ajouter une partie prenante",
    "ebios.btn.add_er": "+ Ajouter un evenement redoute",
    "ebios.btn.add_srov": "+ Ajouter un couple SR/OV",
    "ebios.btn.add_ss": "+ Ajouter un scenario strategique",
    "ebios.btn.add_eco": "+ Ajouter une mesure ecosysteme",
    "ebios.btn.add_sop": "+ Nouveau SOP",
    "ebios.btn.add_measure": "+ Ajouter une mesure",
    "ebios.btn.add_phase": "+ Phase",
    "ebios.btn.new_measure": "+ Nouvelle mesure",
    "ebios.btn.new_sr": "+ Nouvelle SR",
    "ebios.btn.new_ov": "+ Nouvel OV",
    "ebios.btn.new_socle_measure": "+ Nouvelle mesure",

    // ── Help tabs ──
    "ebios.help.tab_methodo": "Methodologie EBIOS RM",
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
    "ebios.col.ref_complementaires": "Référentiels complémentaires",
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
    "ebios.gravity.col_impact_reglementaire": "Impact reglementaire",
    "ebios.gravity.col_impact_donnees_perso": "Impact donnees personnelles",
    "ebios.gravity.col_impact_operationnel": "Impact operationnel",

    // ── Risk matrix ──
    "ebios.matrix.heading": "Matrice de risque (Gravité × Vraisemblance)",
    "ebios.matrix.hint": "Cliquer sur un niveau pour modifier la valeur. Les changements se repercutent sur toute l'analyse.",

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
    "ebios.socle.non_evalue": "Socle non evalue",
    "ebios.socle.conformite_moyenne": "Conformite moyenne : <strong>{avg}%</strong> ({count} mesures evaluees)",

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

    // ── Column headers: Referentiels complementaires ──
    "ebios.col.ref_title": "Référentiels complémentaires",
    "ebios.col.ref_ref": "Réf.",
    "ebios.col.ref_theme": "Thématique",
    "ebios.col.ref_mesure": "Mesure / Attendu",
    "ebios.col.ref_conformite": "Conformité",
    "ebios.col.ref_statut": "Statut",
    "ebios.col.ref_ecart": "Écart identifié",
    "ebios.col.ref_priorite": "Priorité",
    "ebios.col.ref_mesures_prevues": "Mesures prévues",
    "ebios.col.ref_exigences": "{n} exigences",

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
    "ebios.col.sopsynth_efficacite": "Efficacite des mesures",
    "ebios.col.sopsynth_taux": "Taux faiblesse",
    "ebios.col.sopsynth_vinit": "V init.",
    "ebios.col.sopsynth_risque": "Risque initial",
    "ebios.col.sopsynth_no_sop": "Pas de SOP associe",

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
    "ebios.history.create": "+ Creer un point de sauvegarde",
    "ebios.history.decrypt": "Dechiffrer les snapshots",
    "ebios.history.encrypt": "Chiffrer les snapshots",
    "ebios.history.encryption_active": "Chiffrement actif",
    "ebios.history.none": "Aucun snapshot enregistre.",
    "ebios.history.col_name": "Nom",
    "ebios.history.col_date": "Date",
    "ebios.history.col_societe": "Societe",
    "ebios.history.col_actions": "Actions",
    "ebios.history.restore": "Restaurer",
    "ebios.history.export": "Exporter",
    "ebios.history.hint": "Les snapshots sont stockes dans le navigateur (localStorage). Ils sont perdus si vous effacez les donnees du navigateur. Utilisez \"Exporter\" pour les sauvegarder en fichier.",

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
    "ebios.validate.must_be_object": "Le fichier doit contenir un objet JSON.",
    "ebios.validate.missing_key": "Cle manquante : {key}",
    "ebios.validate.context_object": "context doit etre un objet.",
    "ebios.validate.must_be_array": "{key} doit etre un tableau.",
    "ebios.validate.max_size": "{key} depasse la taille maximale ({max}).",
    "ebios.validate.must_be_item_object": "{key}[{i}] doit etre un objet.",
    "ebios.validate.forbidden_key": "{key}[{i}] contient une cle interdite.",
    "ebios.validate.invalid_socle_type": "socle_type invalide (anssi ou iso).",
    "ebios.validate.must_be_number": "{path} doit etre un nombre.",
    "ebios.validate.out_of_bounds": "{path} hors limites.",
    "ebios.validate.string_too_long": "{path} depasse {max} caracteres.",

    // ── Misc ──
    "ebios.misc.click_choose": "Cliquer pour choisir...",
    "ebios.misc.filter": "Filtrer...",
    "ebios.misc.phases": "phases",
    "ebios.misc.measures_indicator": "Mesures",
    "ebios.misc.show_terminated": "Afficher aussi les mesures terminées",
    "ebios.misc.no_measures": "Aucune mesure",
    "ebios.misc.measures_todo_count": "{todo} mesures a mettre en oeuvre sur {total} au total",
    "ebios.misc.ss_not_evaluated": "{n} SS non evalues (pas de SOP ou V residuelle)",
    "ebios.misc.eleve_label": "Eleve",
    "ebios.misc.moyen_label": "Moyen",
    "ebios.misc.faible_label": "Faible",
    "ebios.misc.non_applique_label": "Non applique",
    "ebios.misc.partiel_label": "Partiel",
    "ebios.misc.applique_label": "Applique",

    // ── Synthesis evolution ──
    "ebios.synth.col_ss": "SS",
    "ebios.synth.col_scenario": "Scenario",
    "ebios.synth.col_risque_initial": "Risque initial",
    "ebios.synth.col_risque_residuel": "Risque residuel",
    "ebios.synth.col_evolution": "Evolution",
    "ebios.synth.col_decision": "Decision",
    "ebios.synth.ameliore": "Ameliore",
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

    // ── SOP new phase ──
    "ebios.sop.initial_phase": "1. Phase initiale",
    "ebios.sop.new_phase": "Nouvelle phase",

    // ── Measure effects ──
    "ebios.m.renforcement_socle": "Renforcement mesure socle {ref}",
    "ebios.m.mesure_eco_pour": "Mesure écosystème pour {pp}",

    // ── Referentiels catalog descriptions (FR) ──
    "ebios.ref.gamp.desc": "Good Automated Manufacturing Practice — exigences cybersécurité pour systèmes validés",
    "ebios.ref.lpm.desc": "Loi de Programmation Militaire (France) — règles de sécurité des arrêtés sectoriels ANSSI pour OIV",
    "ebios.ref.loi0520.desc": "Loi marocaine sur la cybersécurité — obligations des organismes soumis",
    "ebios.ref.dora.desc": "Digital Operational Resilience Act (UE 2022/2554) — résilience numérique du secteur financier",
    "ebios.ref.hds.desc": "Certification Hébergeur de Données de Santé (France) — exigences complémentaires ISO 27001",
    "ebios.ref.secnumcloud.desc": "Référentiel de qualification ANSSI pour les prestataires de services Cloud (v3.2)",
    "ebios.ref.nis2.desc": "Directive NIS 2 (UE 2022/2555) — mesures de cybersécurité pour entités essentielles et importantes",
    "ebios.ref.cra.desc": "Règlement UE sur la cyber-résilience (CRA 2024) — exigences pour produits comportant des éléments numériques",
    "ebios.ref.soc2.desc": "Trust Services Criteria (AICPA) — sécurité, disponibilité, intégrité, confidentialité, vie privée",

    // ── Help content ──
    "ebios.help.methodo": "<h1 class=\"heading-blue\">Guide méthodologique EBIOS Risk Manager</h1>\n<p class=\"text-muted\">Méthode d'analyse de risques publiée par l'ANSSI — 5 ateliers</p>\n\n<h2>Principe général</h2>\n<p>EBIOS RM est une méthode d'analyse de risques qui part des <strong>valeurs métier</strong> de l'organisation pour identifier les <strong>scénarios de risque</strong> les plus pertinents et définir un <strong>plan de traitement</strong> proportionné. Elle se déroule en 5 ateliers séquentiels, chacun alimentant le suivant.</p>\n\n<h2>Atelier 1 — Cadrage et socle de sécurité</h2>\n<h3>Objectif</h3>\n<p>Définir le périmètre de l'étude, identifier les actifs critiques, les événements redoutés et évaluer le niveau de sécurité existant.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>DSI</strong>, <strong>Direction métier</strong>, <strong>DPO</strong> (si données personnelles)</p>\n<h3>Étapes dans l'application</h3>\n<table><thead><tr><th>Onglet</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Contexte</td><td>Périmètre, réglementation, échelle de gravité</td><td>Renseigner le nom, la date, le socle choisi, configurer les niveaux de gravité (3, 4 ou 5)</td></tr>\n<tr><td>Valeurs Métier</td><td>Processus essentiels</td><td>Identifier 5-10 VM, évaluer DICT de 1 à N (selon l'échelle)</td></tr>\n<tr><td>Biens Supports</td><td>SI qui supporte les VM</td><td>Lister les serveurs, applis, réseaux, données et les associer aux VM</td></tr>\n<tr><td>Événements Redoutés</td><td>Impacts redoutés par VM</td><td>Pour chaque VM, identifier les ER et évaluer la gravité</td></tr>\n<tr><td>Socle de sécurité</td><td>Conformité ANSSI ou ISO</td><td>Évaluer chaque mesure (0-100%), identifier les écarts</td></tr>\n</tbody></table>\n\n<h2>Atelier 2 — Sources de risque et objectifs visés</h2>\n<h3>Objectif</h3>\n<p>Identifier <strong>qui</strong> pourrait attaquer (sources de risque) et <strong>pourquoi</strong> (objectifs visés). Évaluer la pertinence de chaque couple SR/OV.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Analyste CTI</strong> (si disponible), <strong>Direction</strong></p>\n<h3>Guide</h3>\n<ul>\n<li>Créer les sources de risque (cybercriminels, employés, états, concurrents...)</li>\n<li>Créer les objectifs visés (ransomware, vol de données, sabotage...)</li>\n<li>Combiner en couples et noter Motivation (0-4), Ressources (0-4), Activité (0-4)</li>\n<li>Pertinence = somme /12. Priorité : P1 (&gt;7), P2 (5-7), Non retenu (3-4), Écarté (&le;2)</li>\n</ul>\n\n<h2>Atelier 3 — Scénarios stratégiques</h2>\n<h3>Objectif</h3>\n<p>Identifier et évaluer les <strong>parties prenantes</strong> de l'écosystème, construire les <strong>chemins d'attaque stratégiques</strong> et définir les mesures de réduction de la menace écosystème.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Direction métier</strong>, <strong>Responsable des achats/partenariats</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Onglet</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Parties Prenantes</td><td>Acteurs de l'écosystème</td><td>Fournisseurs (prestataires), partenaires, clients — évaluer D/P/M/C (1-4), catégorie</td></tr>\n<tr><td>Scénarios Stratégiques</td><td>Chemins d'attaque</td><td>Lier SR/OV + PP + BS + ER. La gravité est calculée automatiquement (MAX des ER)</td></tr>\n<tr><td>Mesures Écosystème</td><td>Réduction menace PP</td><td>Pour chaque PP, lister les mesures et reévaluer D/P/M/C résiduels. Cartographie de l'écosystème</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Règle PP</strong> : si l'objet de l'étude est l'entreprise entière, les collaborateurs internes ne sont PAS des PP. Seuls les acteurs externes sont des PP.</div>\n\n<h2>Atelier 4 — Scénarios opérationnels</h2>\n<h3>Objectif</h3>\n<p>Détailler chaque scénario stratégique en <strong>kill chain technique</strong> : phases d'attaque, contrôles existants, efficacité. Calculer la <strong>vraisemblance opérationnelle</strong> et le <strong>risque initial</strong>.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Équipe technique/SOC</strong>, <strong>Architecte sécurité</strong>, <strong>DevOps/Admin sys</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Onglet</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Scénarios Opérationnels</td><td>Kill chain par SOP</td><td>4-8 phases par SOP, contrôles, efficacité (Absent/Partiel/Efficace), mesures proposées</td></tr>\n<tr><td>Risques initiaux</td><td>Synthèse des risques</td><td>Pour chaque SS : gravite, efficacité des contrôles, taux de faiblesse, V opérationnelle, risque initial</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Formule</strong> : Taux de faiblesse = MAX(0, (Absent&times;2 + Partiel - Efficace&times;2)) / (Total&times;2). Chaque phase Efficace compense un Absent dans la kill chain.</div>\n\n<h2>Atelier 5 — Traitement du risque</h2>\n<h3>Objectif</h3>\n<p>Définir le <strong>plan de traitement</strong> : mesures de sécurité, responsables, échéances. Évaluer les <strong>risques résiduels</strong> et prendre les décisions de traitement.</p>\n<h3>Participants</h3>\n<p><strong>RSSI</strong>, <strong>Direction</strong>, <strong>DSI</strong>, <strong>Responsables métier</strong>, <strong>DPO</strong></p>\n<h3>Étapes</h3>\n<table><thead><tr><th>Onglet</th><th>Contenu</th><th>Guide</th></tr></thead><tbody>\n<tr><td>Référentiel Mesures</td><td>Toutes les mesures</td><td>Consolider : socle appliqué (Terminé), socle à renforcer, écosystème, SOP, complémentaires</td></tr>\n<tr><td>Risques Résiduels</td><td>Risque après traitement</td><td>Pour chaque SS, évaluer la V résiduelle (1-4) et choisir la décision (Accepter/Réduire/Transférer)</td></tr>\n</tbody></table>\n<div class=\"help-tip\"><strong>Priorité des mesures</strong> : proposer d'abord les mesures du socle manquantes, puis les mesures écosystème, puis des mesures complémentaires uniquement si nécessaire.</div>\n\n<h2>Glossaire</h2>\n<table><thead><tr><th>Acronyme</th><th>Signification</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>VM</strong></td><td>Valeur Métier</td><td>Processus ou activité essentielle de l'organisation (ex : gestion des commandes, R&amp;D)</td></tr>\n<tr><td><strong>BS</strong></td><td>Bien Support</td><td>Composant du SI qui supporte une VM (serveur, application, réseau, données)</td></tr>\n<tr><td><strong>PP</strong></td><td>Partie Prenante</td><td>Acteur externe à l'objet d'étude (fournisseur, prestataire, partenaire, client)</td></tr>\n<tr><td><strong>SR</strong></td><td>Source de Risque</td><td>Acteur de menace potentiel (cybercriminel, employé malveillant, concurrent, état)</td></tr>\n<tr><td><strong>OV</strong></td><td>Objectif Visé</td><td>But poursuivi par la source de risque (extorsion, vol de données, sabotage)</td></tr>\n<tr><td><strong>SR/OV</strong></td><td>Couple Source/Objectif</td><td>Combinaison d'une SR et d'un OV évaluée en pertinence</td></tr>\n<tr><td><strong>ER</strong></td><td>Événement Redouté</td><td>Impact métier craint en termes de DICT (ex : fuite de données clients)</td></tr>\n<tr><td><strong>SS</strong></td><td>Scénario Stratégique</td><td>Chemin d'attaque : QUI (SR) attaque POURQUOI (OV) VIA QUI (PP) ciblant QUOI (BS) provoquant QUEL impact (ER)</td></tr>\n<tr><td><strong>SOP</strong></td><td>Scénario Opérationnel</td><td>Kill chain technique détaillant les phases d'attaque d'un SS</td></tr>\n<tr><td><strong>DICT</strong></td><td>Disponibilité, Intégrité, Confidentialité, Traçabilité</td><td>Les 4 critères de sécurité pour évaluer les besoins et les atteintes</td></tr>\n<tr><td><strong>PACS</strong></td><td>Plan d'Amélioration Continue de la Sécurité</td><td>Plan de traitement issu de l'analyse EBIOS RM</td></tr>\n</tbody></table>",

    "ebios.help.usage": "<h1 class=\"heading-blue\">Guide d'utilisation</h1>\n<p class=\"text-muted\">Comment utiliser l'application interactive EBIOS RM</p>\n\n<h2>Vue d'ensemble</h2>\n<p>L'application est organisée en <strong>3 zones</strong> : la <strong>barre d'outils</strong> en haut (menu Fichier), le <strong>menu latéral</strong> à gauche (navigation par atelier) et la <strong>zone de travail</strong> au centre (tableaux éditables).</p>\n<div class=\"help-tip\">Toutes les données restent dans votre navigateur. Aucune information n'est envoyée à un serveur (sauf si l'assistant IA est actif). Pensez à sauvegarder régulièrement en JSON.</div>\n\n<h2>Navigation</h2>\n<table><thead><tr><th>Élément</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Menu latéral</strong></td><td>Cliquer sur un atelier pour afficher ses sous-onglets. Le menu se replie automatiquement sur mobile.</td></tr>\n<tr><td><strong>Sous-onglets</strong></td><td>Les ateliers avec plusieurs sections (ex : Atelier 1) affichent des sous-onglets en haut de la zone de travail.</td></tr>\n<tr><td><strong>Synthèse</strong></td><td>Vue d'ensemble avec indicateurs, matrices de risque et cartographies. Se met à jour automatiquement.</td></tr>\n</tbody></table>\n\n<h2>Édition des tableaux</h2>\n<h3>Modifier une cellule</h3>\n<p>Les cellules éditables contiennent un <strong>champ de saisie</strong> (texte ou nombre) ou une <strong>liste déroulante</strong>. Les modifications sont prises en compte dès que vous quittez le champ (tab, clic ailleurs).</p>\n<h3>Ajouter une ligne</h3>\n<p>Cliquer sur le bouton <strong class=\"text-green\">+ Ajouter</strong> en bas du tableau. L'identifiant (VM-XX, BS-XX, etc.) est généré automatiquement.</p>\n<h3>Supprimer une ligne</h3>\n<p>Cliquer sur le bouton <strong class=\"text-red\">X</strong> à droite de la ligne. Une confirmation est demandée si la ligne contient des données.</p>\n<h3>Valeurs calculées</h3>\n<p>Les colonnes sur fond gris sont calculées automatiquement et ne sont pas éditables :</p>\n<ul>\n<li><strong>Menace PP</strong> = (Pénétration &times; Dépendance) / (Maturité &times; Confiance)</li>\n<li><strong>Exposition PP</strong> = seuils sur la menace (&ge;4 Critique, &ge;2 Élevée, &ge;1 Modérée, &lt;1 Faible)</li>\n<li><strong>Pertinence SR/OV</strong> = (Motivation + Ressources + Activité) / 12</li>\n<li><strong>Gravite SS</strong> = maximum des gravités des ER associés</li>\n<li><strong>Taux de faiblesse SOP</strong> = MAX(0, (Absent&times;2 + Partiel - Efficace&times;2)) / (Total&times;2)</li>\n<li><strong>Vraisemblance SOP</strong> = dérivée du taux de faiblesse (1 à 4)</li>\n<li><strong>Risque initial/résiduel</strong> = croisement Gravite &times; Vraisemblance dans la matrice</li>\n</ul>\n\n<h2>Gestion des colonnes</h2>\n<table><thead><tr><th>Action</th><th>Comment</th></tr></thead><tbody>\n<tr><td><strong>Masquer une colonne</strong></td><td>Cliquer sur le <strong>&times;</strong> à droite du nom de la colonne dans l'en-tête du tableau</td></tr>\n<tr><td><strong>Restaurer une colonne</strong></td><td>Un bouton <strong>Colonnes masquées (N)</strong> apparaît au-dessus du tableau — cliquer pour choisir les colonnes à restaurer</td></tr>\n<tr><td><strong>Redimensionner</strong></td><td>Glisser le bord droit d'un en-tete de colonne</td></tr>\n</tbody></table>\n\n<h2>Références entre éléments</h2>\n<p>Les champs qui référencent d'autres éléments (VM dans les BS, PP dans les SS, ER dans les SS, etc.) utilisent un <strong>sélecteur avec recherche</strong> :</p>\n<ul>\n<li>Cliquer sur le champ pour ouvrir le sélecteur</li>\n<li>Taper pour filtrer les éléments disponibles</li>\n<li>Cocher/décocher pour sélectionner (multi-sélection possible)</li>\n<li>Cliquer en dehors pour fermer</li>\n</ul>\n<div class=\"help-tip\">Quand vous renommez un élément (VM, BS, PP, ER...), toutes les références dans les autres tableaux sont mises à jour automatiquement.</div>\n\n<h2>Gestion des fichiers</h2>\n<p>Le menu <strong>Fichier</strong> en haut à droite donne accès à toutes les options :</p>\n<table><thead><tr><th>Action</th><th>Format</th><th>Description</th></tr></thead><tbody>\n<tr><td><strong>Ouvrir</strong></td><td>.json / .json.enc</td><td>Charge un fichier JSON (ou chiffré) depuis le disque et remplace toutes les données. Validation automatique du format.</td></tr>\n<tr><td><strong>Enregistrer</strong></td><td>.json</td><td>Sauvegarde rapide du fichier actuellement ouvert. Incompatible avec le chiffrement (utiliser Enregistrer sous pour chiffrer).</td></tr>\n<tr><td><strong>Enregistrer sous</strong></td><td>.json / .json.enc</td><td>Sauvegarde en JSON avec option de chiffrement AES-256 par mot de passe.</td></tr>\n<tr><td><strong>Import Excel</strong></td><td>.xlsx</td><td>Lit un fichier Excel EBIOS RM existant et charge les données. Compatible avec les fichiers générés par l'application ou créés manuellement.</td></tr>\n<tr><td><strong>Export Excel</strong></td><td>.xlsx</td><td>Génère un fichier Excel avec formules, mise en forme conditionnelle et feuilles structurées. Nécessite une connexion internet (chargement ExcelJS).</td></tr>\n</tbody></table>\n\n<h2>Historique et annulation</h2>\n<h3>Annuler / Rétablir</h3>\n<p>Chaque modification est enregistrée dans l'historique (50 niveaux maximum). Utilisez les boutons du menu latéral ou les raccourcis :</p>\n<ul>\n<li><strong>Ctrl+Z</strong> (ou Cmd+Z sur Mac) : annuler la dernière modification</li>\n<li><strong>Ctrl+Y</strong> (ou Cmd+Y sur Mac) : rétablir la modification annulée</li>\n</ul>\n<h3>Snapshots</h3>\n<p>Les snapshots sont des points de sauvegarde nommés stockés dans le navigateur :</p>\n<ul>\n<li><strong>Créer un snapshot</strong> : cliquer sur \"+ Créer un point de sauvegarde\" dans l'onglet Snapshots</li>\n<li><strong>Restaurer</strong> : revenir à l'état exact du snapshot (l'état actuel est sauvegardé dans l'undo)</li>\n<li><strong>Exporter</strong> : télécharger un snapshot en fichier JSON indépendant</li>\n<li><strong>Chiffrer</strong> : activer le chiffrement de tous les snapshots dans le navigateur</li>\n</ul>\n<div class=\"help-tip\"><strong>Attention</strong> : les snapshots sont stockés dans localStorage. Si vous videz les données du navigateur, ils seront perdus. Exportez régulièrement vos snapshots importants en fichier.</div>\n\n<h2>Réglages</h2>\n<p>Cliquer sur l'icône <strong>roue crantée</strong> (&#9881;) dans la barre d'outils pour accéder aux réglages :</p>\n<ul>\n<li><strong>Langue</strong> : basculer entre français et anglais</li>\n<li><strong>Assistant IA</strong> : activer/désactiver, choisir le fournisseur (Anthropic/OpenAI), le modèle et la clé API</li>\n<li><strong>Instructions méthodologiques</strong> : charger un fichier Markdown pour guider les suggestions de l'IA</li>\n</ul>\n<div class=\"help-tip\"><strong>Important</strong> : l'activation de l'assistant IA implique l'envoi de données d'analyse au fournisseur IA choisi. Vérifiez que votre politique de confidentialité le permet.</div>\n\n<h2>Assistant IA</h2>\n<p>L'assistant IA est un module optionnel qui propose des suggestions contextualisées à chaque étape de l'analyse. Il est <strong>désactivé par défaut</strong>.</p>\n<h3>Utilisation</h3>\n<p>Une fois activé dans les Réglages, un bouton <strong>&#10024; IA</strong> apparaît sur chaque onglet (Valeurs Métier, Biens Supports, Scenarios, Mesures, etc.). En cliquant dessus :</p>\n<ul>\n<li>L'assistant analyse les données déjà saisies dans l'analyse en cours</li>\n<li>Il propose des éléments supplémentaires (VM, BS, SR/OV, scénarios, mesures, kill chains...)</li>\n<li>Chaque suggestion peut être <strong>acceptée</strong> (ajoutée à l'analyse) ou <strong>ignorée</strong></li>\n<li>Les suggestions sont adaptées au contexte de l'organisation et aux données existantes</li>\n</ul>\n<h3>Instructions méthodologiques</h3>\n<p>Un fichier Markdown peut être chargé dans les Réglages pour enrichir le contexte de l'IA :</p>\n<ul>\n<li>Référentiel interne de l'organisation</li>\n<li>Consignes de rédaction ou de nommage</li>\n<li>Méthodologie spécifique ou compléments à EBIOS RM</li>\n<li>Politique de sécurité ou charte applicable</li>\n</ul>\n<p>Ce fichier est ajouté au prompt système de chaque requête IA.</p>\n<h3>Risques et précautions</h3>\n<ul>\n<li><strong>Partage de données</strong> : les données de l'analyse sont envoyées au fournisseur IA. Vérifiez que votre politique de confidentialité et vos engagements contractuels le permettent.</li>\n<li><strong>Clé API dans les headers HTTP</strong> : la clé API est transmise dans les en-têtes HTTP depuis le navigateur. Elle est visible dans les DevTools, capturable par les extensions navigateur, et peut être journalisée par un proxy d'entreprise. Utilisez un profil navigateur dédié, sans extensions.</li>\n<li><strong>Clé API dans localStorage</strong> : la clé est stockée dans le navigateur, jamais dans les fichiers sauvegardés.</li>\n<li><strong>Suggestions non garanties</strong> : les propositions de l'IA sont à valider par l'analyste.</li>\n</ul>\n\n<h2>Sécurité des données</h2>\n<ul>\n<li><strong>Aucun envoi serveur</strong> : toutes les données restent dans votre navigateur (sauf si l'assistant IA est actif)</li>\n<li><strong>Chiffrement JSON</strong> : AES-256-GCM avec clé dérivée par PBKDF2 (250 000 itérations)</li>\n<li><strong>Chiffrement snapshots</strong> : option de chiffrement des données localStorage</li>\n<li><strong>Validation import</strong> : chaque fichier JSON importé est validé avant chargement (structure, types, bornes)</li>\n</ul>\n\n<h2>Raccourcis clavier</h2>\n<table><thead><tr><th>Raccourci</th><th>Action</th></tr></thead><tbody>\n<tr><td><strong>Ctrl+S</strong> / <strong>Cmd+S</strong></td><td>Enregistrer</td></tr>\n<tr><td><strong>Ctrl+Z</strong> / <strong>Cmd+Z</strong></td><td>Annuler</td></tr>\n<tr><td><strong>Ctrl+Y</strong> / <strong>Cmd+Y</strong></td><td>Rétablir</td></tr>\n<tr><td><strong>Tab</strong></td><td>Passer au champ suivant dans un tableau</td></tr>\n<tr><td><strong>Échap</strong></td><td>Fermer le panneau d'aide ou un sélecteur ouvert</td></tr>\n</tbody></table>\n\n<h2>Bonnes pratiques</h2>\n<ul>\n<li><strong>Sauvegarder souvent</strong> : utilisez Fichier &rarr; Enregistrer régulièrement, surtout avant de fermer le navigateur</li>\n<li><strong>Utiliser les snapshots</strong> : créez un snapshot avant chaque session de travail ou modification importante</li>\n<li><strong>Suivre l'ordre des ateliers</strong> : les données des ateliers suivants dépendent des précédents (VM &rarr; BS &rarr; PP &rarr; SR/OV &rarr; ER &rarr; SS &rarr; SOP &rarr; Mesures)</li>\n<li><strong>Vérifier la synthèse</strong> : l'onglet Synthèse donne une vue globale — les indicateurs et matrices se mettent à jour automatiquement</li>\n<li><strong>Export Excel</strong> : pour un livrable formel, utilisez Fichier &rarr; Export Excel — le fichier contient les formules et la mise en forme professionnelle</li>\n</ul>"
});

// ═══════════════════════════════════════════════════════════════════════
// ENGLISH
// ═══════════════════════════════════════════════════════════════════════
