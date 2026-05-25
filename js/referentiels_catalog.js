/**
 * CISO Toolbox — Référentiels complémentaires (catalogue)
 *
 * Source unique pour les deux apps (EBIOS RM + Compliance).
 * Chaque app copie ce fichier dans son répertoire js/.
 *
 * Label, description FR/EN, couleur pour chaque référentiel.
 * Les mesures détaillées sont chargées à la demande via _ensureFramework().
 */
window._REFERENTIELS_CATALOG = {
    "anssi": {
        "label": "ANSSI Hygi\u00e8ne",
        "description": "Renforcer la s\u00e9curit\u00e9 de son syst\u00e8me d\u2019information en 42 mesures\n https://cyber.gouv.fr/sites/default/files/2017/01/guide_hygiene_informatique_anssi.pdf",
        "description_en": "Strengthen Information System Security in 42 Measures\nhttps://cyber.gouv.fr/sites/default/files/2013/01/guideline-for-a-healthy-information-system-in-42-measures_v2.pdf",
        "color": "#cf4520"
    },
    "iso": {
        "label": "ISO 27001:2022",
        "description": "S\u00e9curit\u00e9 de l'information, cybers\u00e9curit\u00e9 et protection de la vie priv\u00e9e \u2014 Information syst\u00e8me de management de la s\u00e9curit\u00e9 \u2014 Exigences",
        "description_en": "Information security, cybersecurity and privacy protection \u2014 Information security management systems \u2014 Requirements",
        "color": "#2563eb"
    },
    "soc2": {
        "label": "SOC 2",
        "description": "TSP Section 100\n2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus \u2013 2022)\n\nTSC presents control criteria established by the AICPA\u2019s Assurance Services Executive Committee (ASEC) for use in attestation or consulting engagements to evaluate and report on controls over the security, availability, processing integrity, confidentiality, or privacy of information and systems used to provide products or services (a) across an entire entity; (b) at a subsidiary, division, or operating unit level; (c) within a function relevant to the entity\u2019s operational, reporting, or compliance objectives; and (d) for a particular type of information used by the entity. Link: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022",
        "description_en": "TSP Section 100\n2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus \u2013 2022)\n\nTSC presents control criteria established by the AICPA\u2019s Assurance Services Executive Committee (ASEC) for use in attestation or consulting engagements to evaluate and report on controls over the security, availability, processing integrity, confidentiality, or privacy of information and systems used to provide products or services (a) across an entire entity; (b) at a subsidiary, division, or operating unit level; (c) within a function relevant to the entity\u2019s operational, reporting, or compliance objectives; and (d) for a particular type of information used by the entity. Link: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022",
        "color": "#0891b2"
    },
    "secnumcloud": {
        "label": "SecNumCloud",
        "description": "Premier ministre\nAgence nationale de la s\u00e9curit\u00e9 des syst\u00e8mes d\u2019information\nPrestataires de services d\u2019informatique en nuage (SecNumCloud)\nr\u00e9f\u00e9rentiel d\u2019exigences\nVersion 3.2 du 8 mars 202",
        "description_en": "Premier ministre\nAgence nationale de la s\u00e9curit\u00e9 des syst\u00e8mes d\u2019information\nPrestataires de services d\u2019informatique en nuage (SecNumCloud)\nr\u00e9f\u00e9rentiel d\u2019exigences\nVersion 3.2 du 8 mars 202",
        "color": "#dc2626"
    },
    "lpm": {
        "label": "LPM",
        "description": "R\u00c8GLES DE S\u00c9CURIT\u00c9 RELATIVES AU SECTEUR D'ACTIVIT\u00c9S D'IMPORTANCE VITALE \" ACTIVIT\u00c9S CIVILES DE L'\u00c9TAT \"\nArr\u00eat\u00e9 du 29 mai 2019 fixant les r\u00e8gles de s\u00e9curit\u00e9 et les modalit\u00e9s de d\u00e9claration des syst\u00e8mes d'information d'importance vitale et des incidents de s\u00e9curit\u00e9 relatives au secteur d'activit\u00e9s d'importance vitale \u00ab Activit\u00e9s civiles de l'Etat \u00bb et pris en application des articles R. 1332-41-1, R. 1332-41-2 et R. 1332-41-10 du code de la d\u00e9fense\nhttps://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038565011",
        "description_en": "R\u00c8GLES DE S\u00c9CURIT\u00c9 RELATIVES AU SECTEUR D'ACTIVIT\u00c9S D'IMPORTANCE VITALE \" ACTIVIT\u00c9S CIVILES DE L'\u00c9TAT \"\nArr\u00eat\u00e9 du 29 mai 2019 fixant les r\u00e8gles de s\u00e9curit\u00e9 et les modalit\u00e9s de d\u00e9claration des syst\u00e8mes d'information d'importance vitale et des incidents de s\u00e9curit\u00e9 relatives au secteur d'activit\u00e9s d'importance vitale \u00ab Activit\u00e9s civiles de l'Etat \u00bb et pris en application des articles R. 1332-41-1, R. 1332-41-2 et R. 1332-41-10 du code de la d\u00e9fense\nhttps://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038565011",
        "color": "#1e3a5f"
    },
    "loi0520": {
        "label": "Loi 05-20 (Maroc)",
        "description": "Loi n\u00b0 05-20 fixant le cadre l\u00e9gislatif de la cybers\u00e9curit\u00e9 au Maroc",
        "description_en": "Loi n\u00b0 05-20 fixant le cadre l\u00e9gislatif de la cybers\u00e9curit\u00e9 au Maroc",
        "color": "#b45309"
    },
    "hds": {
        "label": "HDS",
        "description": "R\u00e9f\u00e9rentiel de certification H\u00e9bergeur de donn\u00e9es de sant\u00e9 (HDS) - Exigences\nVersion publi\u00e9e par l\u2019arr\u00eat\u00e9 du 26 avril 2024 portant approbation du r\u00e9f\u00e9rentiel d'accr\u00e9ditation des organismes de certification et du r\u00e9f\u00e9rentiel de certification pour l'h\u00e9bergement de donn\u00e9es de sant\u00e9 \u00e0 caract\u00e8re personnel.",
        "description_en": "R\u00e9f\u00e9rentiel de certification H\u00e9bergeur de donn\u00e9es de sant\u00e9 (HDS) - Exigences\nVersion publi\u00e9e par l\u2019arr\u00eat\u00e9 du 26 avril 2024 portant approbation du r\u00e9f\u00e9rentiel d'accr\u00e9ditation des organismes de certification et du r\u00e9f\u00e9rentiel de certification pour l'h\u00e9bergement de donn\u00e9es de sant\u00e9 \u00e0 caract\u00e8re personnel.",
        "color": "#7c3aed"
    },
    "nis2": {
        "label": "NIS 2",
        "description": "Article 21 de la directive (UE) 2022/2555 du Parlement europ\u00e9en et du Conseil du 14 d\u00e9cembre 2022 concernant des mesures destin\u00e9es \u00e0 assurer un niveau \u00e9lev\u00e9 commun de cybers\u00e9curit\u00e9 dans l\u2019ensemble de l\u2019Union, modifiant le r\u00e8glement (UE) no 910/2014 et la directive (UE) 2018/1972, et abrogeant la directive (UE) 2016/1148 (directive SRI 2) (Texte pr\u00e9sentant de l\u2019int\u00e9r\u00eat pour l\u2019EEE)",
        "description_en": "Requirements from article 21 of directive 2022/2555 of the european parliament and of the council of 14 December 2022 on measures for a high common level of cybersecurity across the Union.",
        "color": "#7c3aed"
    },
    "recyf": {
        "label": "ReCyF (NIS2)",
        "description": "RECYF constitue le r\u00e9f\u00e9rentiel de cybers\u00e9curit\u00e9 mentionn\u00e9 au 6\u00e8me alin\u00e9a de l\u2019article 14 du projet de loi relatif \u00e0 la r\u00e9silience des infrastructures critiques et au renforcement de la cybers\u00e9curit\u00e9 (PJL). Il se compose d\u2019objectifs de s\u00e9curit\u00e9 et, pour chacun d\u2019eux, de moyens acceptables de conformit\u00e9.",
        "description_en": "RECYF constitue le r\u00e9f\u00e9rentiel de cybers\u00e9curit\u00e9 mentionn\u00e9 au 6\u00e8me alin\u00e9a de l\u2019article 14 du projet de loi relatif \u00e0 la r\u00e9silience des infrastructures critiques et au renforcement de la cybers\u00e9curit\u00e9 (PJL). Il se compose d\u2019objectifs de s\u00e9curit\u00e9 et, pour chacun d\u2019eux, de moyens acceptables de conformit\u00e9.",
        "color": "#059669"
    },
    "cra": {
        "label": "Cyber Resilience Act",
        "description": "Annexes to the REGULATION (EU) 2024/2847 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL of 23 October 2024 on horizontal cybersecurity requirements for products with digital elements and amending Regulations (EU) No 168/2013 and (EU) No 2019/1020 and Directive (EU) 2020/1828 (Cyber Resilience Act)",
        "description_en": "Annexes to the REGULATION (EU) 2024/2847 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL of 23 October 2024 on horizontal cybersecurity requirements for products with digital elements and amending Regulations (EU) No 168/2013 and (EU) No 2019/1020 and Directive (EU) 2020/1828 (Cyber Resilience Act)",
        "color": "#ea580c"
    },
    "dora": {
        "label": "DORA",
        "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 r\u00e9silience num\u00e9rique du secteur financier (39 exigences par article)",
        "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 digital resilience for the financial sector (39 article-level requirements)",
        "color": "#3a7ca5"
    },
    "dora_detailed": {
        "label": "DORA (d\u00e9taill\u00e9)",
        "description": "Digital Operational Resilience Act (UE 2022/2554) \u2014 211 exigences au niveau paragraphe",
        "description_en": "Digital Operational Resilience Act (EU 2022/2554) \u2014 211 paragraph-level requirements",
        "color": "#3a7ca5"
    }
};
