/**
 * EBIOS RM — types du modèle de données D + globals d'app.
 * Fichier de types pur (pas d'emit). Formes déduites des usages réels de
 * EBIOS_RM_app.js / EBIOS_RM_ai_assistant.js / EBIOS_RM_catalog.js.
 */

/** Valeur numérique ou champ vide (convention des champs de saisie). */
type EbNum = number | "";

interface EbiosContext {
    societe: string;
    objet_etude?: string;
    date: string;
    analyste: string;
    reglementation: string;
    socle: string;
    commentaires: string;
    date_precedente?: string;
    evolutions?: string;
    contributeurs?: string;
    /** Option page ER : gravité saisie par catégorie d'impact. */
    gravite_par_categorie?: boolean;
    [k: string]: unknown;
}

interface EbiosGravityLevel {
    niveau: EbNum;
    label: string;
    description: string;
    impact_financier?: string;
    impact_reputation?: string;
    impact_reglementaire?: string;
    impact_donnees_perso?: string;
    impact_operationnel?: string;
    [k: string]: unknown;
}

interface EbiosRiskMatrixRow {
    g: EbNum;
    /** Niveaux de risque par vraisemblance V1..V4 (clés canoniques FR). */
    levels: string[];
}

interface EbiosVM {
    id: string;
    nom: string;
    nature: string;
    description: string;
    responsable: string;
}

interface EbiosBS {
    id: string;
    nom: string;
    type: string;
    vm: string;
    localisation: string;
    proprietaire: string;
    /** Ancien format (skill) — migré vers vm par ensureKeys. */
    vm_associees?: string;
}

interface EbiosPP {
    id: string;
    nom: string;
    categorie: string;
    type: string;
    dependance: EbNum;
    penetration: EbNum;
    maturite: EbNum;
    confiance: EbNum;
    bs: string;
    /** Ancien format (skill) — migré vers bs par ensureKeys. */
    bs_concernes?: string;
}

interface EbiosER {
    id: string;
    evenement: string;
    vm: string;
    dict: string;
    impacts: string;
    gravite: EbNum;
    /** Gravité par catégorie d'impact (option). */
    gravite_cat?: Record<string, EbNum>;
}

interface EbiosSS {
    id: string;
    scenario: string;
    couple_id: string;
    couple_desc: string;
    pp: string;
    bs: string;
    er: string;
}

interface EbiosSROV {
    couple: string;
    sr_id: string;
    ov_id: string;
    motivation: EbNum;
    ressources: EbNum;
    activite: EbNum;
    justification: string;
    /** Anciens formats (skill) — migrés par ensureKeys. */
    sr?: string;
    ov?: string;
    sr_nom?: string;
    ov_nom?: string;
}

interface EbiosEco {
    pp_id: string;
    mesures_existantes: string;
    mesures_complementaires: string;
    categorie: string;
    dep_resid: EbNum;
    pen_resid: EbNum;
    mat_resid: EbNum;
    conf_resid: EbNum;
    /** Anciens formats — migrés/supprimés par ensureKeys. */
    mesure?: string;
    menace_resid?: unknown;
}

interface EbiosSOPDetail {
    sop: string;
    ss: string;
    phase: string;
    action: string;
    bs: string;
    controle: string;
    ref: string;
    efficacite: string;
    commentaire: string;
    mesure_proposee: string;
    type_mesure: string;
}

interface EbiosSOPSummary {
    sop: string;
    ss: string;
}

interface EbiosMeasure {
    id: string;
    mesure: string;
    /** Absent des mesures créées par addSocleMeasure/addEcoMeasure/addSOPMeasure (backfillé par ensureKeys). */
    details?: string;
    origine: string;
    type: string;
    sop: string;
    phase: string;
    effet: string;
    ref_socle: string;
    responsable: string;
    echeance: string;
    cout: string;
    statut: string;
}

interface EbiosResidual {
    mesures?: string;
    v_resid?: EbNum;
    decision?: string;
}

/**
 * Ligne de socle ANSSI (num/thematique) ou ISO 27001 (ref/theme/applicable).
 * Interface unique pour éviter les unions de tableaux dans renderSocle &co.
 */
interface EbiosSocleRow {
    /** ANSSI : numéro de mesure (1..42). */
    num?: EbNum | string;
    /** ISO : référence Annexe A (A.x.y). */
    ref?: string;
    thematique?: string;
    thematique_en?: string;
    theme?: string;
    theme_en?: string;
    mesure: string;
    mesure_en?: string;
    applicable?: string;
    conformite: EbNum;
    ecart: string;
    mesures_prevues: string;
    [k: string]: unknown;
}

interface EbiosSrOv {
    id: string;
    nom: string;
    /** Ancien format — recopié dans nom par ensureKeys. */
    description?: string;
}

interface EbiosFair {
    lef_min: EbNum; lef_likely: EbNum; lef_max: EbNum;
    lm_min: EbNum; lm_likely: EbNum; lm_max: EbNum;
    ale_p10: EbNum; ale_p50: EbNum; ale_p90: EbNum; ale_mean: EbNum;
    [k: string]: unknown;
}

/** Modèle de données complet d'une analyse EBIOS RM. */
interface EbiosData {
    context: EbiosContext;
    gravity_scale: EbiosGravityLevel[];
    risk_matrix: EbiosRiskMatrixRow[];
    vm: EbiosVM[];
    bs: EbiosBS[];
    pp: EbiosPP[];
    socle_anssi: EbiosSocleRow[];
    socle_iso: EbiosSocleRow[];
    sr_list: EbiosSrOv[];
    ov_list: EbiosSrOv[];
    srov: EbiosSROV[];
    er: EbiosER[];
    ss: EbiosSS[];
    eco: EbiosEco[];
    sop_detail: EbiosSOPDetail[];
    sop_summary: EbiosSOPSummary[];
    measures: EbiosMeasure[];
    residuals: EbiosResidual[];
    fair: EbiosFair[];
    socle_type: "anssi" | "iso";
    /** Accès indexé générique (updateField / toggleDICT / delRow…). */
    [k: string]: any;
}

/* ── Globals fournis par les fichiers de données lazy / compagnons ── */

interface Window {
    /** FEAT-41 — vide les écritures débouncées et resout quand elles sont
     *  parties. L'assistant IA doit l'attendre : le serveur relit l'analyse
     *  en base pour composer le prompt. */
    _riskFlushPending?: () => Promise<void>;
    EBIOS_INIT_DATA?: EbiosData;
    EBIOS_DESCRIPTIONS?: { anssi: Record<string, string>; iso: Record<string, string>;
                           anssi_en?: Record<string, string>; iso_en?: Record<string, string>; };
    EBIOS_TEMPLATE?: { templateB64: string };
    /** Hook d'init posé par EBIOS_RM_catalog.js (mode catalogue IndexedDB). */
    _appInitCallback?: () => void;
    /** Utilisateur connecté (variante backend uniquement). */
    _currentUser?: { name?: string; email?: string; role?: string };
    /** Persistance backend (variante demo-docker) — absente en opensource. */
    _persistSettings?: () => void;
    /* Globals d'app exposés sur window (catalog + ai_assistant) */
    renderSocle?: EbAiWrappedRender;
    renderEco?: EbAiWrappedRender;
    renderSOP?: EbAiWrappedRender;
    /* Variante demo-docker : les ids d'analyses backend sont string | number
       (PostgreSQL serial) — params élargis vs opensource (string seul). */
    catalogOpen?: (id: string | number) => void;
    catalogDuplicate?: (id: string | number) => void;
    catalogRename?: (id: string | number) => void;
    catalogDelete?: (id: string | number) => void;
    catalogExport?: (id: string | number) => void;
    catalogExportAll?: () => void;
    catalogImport?: () => void;
    catalogSearch?: (val: string) => void;
    _renderCatalog?: () => void;
    _buildEcoSVG?: (ppList: EbEcoPoint[], title: string) => string;
    /* AI assistant */
    _aiSuggestions?: any[];
    _aiAcceptFn?: ((s: any) => string) | undefined;
    _aiRestart?: () => void;
    _aiIgnore?: (idx: number) => void;
    _aiRegenerate?: () => void;
    _aiAccept?: (type: string, idx: number) => void;
    _aiAcceptAll?: (type: string) => void;
    _aiRunSuggest?: (type: string, mode: string) => Promise<void>;
    _aiGenSOP?: (ssId: string) => void;
    _aiRunSOP?: (ssId: string, mode: string) => Promise<void>;
    suggestFor?: (type: string) => Promise<void>;
    suggestSocleMeasure?: (socleIdx: number) => Promise<void>;
    suggestEcoMeasure?: (ecoIdx: number) => Promise<void>;
    suggestSOPMeasure?: (sopIdx: number) => Promise<void>;
    suggestResidualMeasures?: (ssIdx: number, avecMesures?: boolean) => Promise<void>;
    _aiResidualForSS?: (ssIdx: number) => void;
    _aiAcceptResidual?: () => void;
    _aiResidualResult?: any;
    _aiResidualSSIdx?: number;
    /** Index dynamique : wrappers IA (window[fn]) et renderers par nom. */
    [k: string]: any;
}

/** Render function éventuellement enveloppée par l'assistant IA. */
type EbAiWrappedRender = { (): void; _aiWrapped?: boolean; _aiInlineWrapped?: boolean };

/** Point PP pour la cartographie écosystème (_buildEcoSVG). */
interface EbEcoPoint {
    id: string;
    nom: string;
    cat: string;
    menace: number;
    fiab: number;
    expo: number;
}

/* ── Types utilitaires synthèse / rapport ───────────────────────── */

/** Position d'un SS dans les matrices de synthèse. */
interface EbSynthPos {
    id: string;
    gNum: EbNum;
    vInit: number;
    vResid: number;
}

/** Ligne de synthèse (un SS) produite par _synthesisData(). */
interface EbSynthRow {
    id: string;
    scenario: string;
    gNum: EbNum;
    vInit: number;
    vResid: number;
    riskInit: string;
    riskResid: string;
    decision: string;
}

/** Retour de _synthesisData(). */
type EbSynthData = ReturnType<typeof _synthesisData>;

/** Image PNG capturée pour le rapport Word. */
interface EbReportImg {
    buf: ArrayBuffer;
    w: number;
    h: number;
}

/* ── Surcharge locale : la décl gen de cisotoolbox_local impose 3 args à
   _persist, mais l'app opensource l'appelle avec la section seule (no-op
   localStorage ; la variante backend lit ce 1er argument). À remonter au
   coordinateur (entityId/fields devraient être optionnels). ── */
declare function _persist(entityType: string): void;
/** Rafraîchit les références "ID - libellé" figées dans les autres sections
 *  quand un élément est renommé (EBIOS_RM_app.ts). */
declare function propagateNameChange(id: string, newName: string): void;
// Lives in cisotoolbox_local.js (not loaded by backend apps; snapshots managed
// by Pilot in suite mode). Possibly-undefined + called with ! — same pattern as vendor.
declare var _renderSnapshotsPanel: ((opts: any) => Promise<void>) | undefined;
/** Posé par directory_picker.js (window._dirPicker) — decl générée vide (IIFE). */
declare var _dirPicker: (currentValue: string | null | undefined, handler: string, argsJson: string) => string;

/** Enregistrement d'analyse dans le catalogue IndexedDB (EBIOS_RM_catalog). */
interface EbCatalogRecord {
    id: string;
    name: string;
    date: string;
    /** JSON.stringify(D) */
    data: string;
    createdAt?: string;
    updatedAt: string;
    stats?: { vm: number; bs: number; ss: number; measures: number };
}

/* ── Hooks démo (définis par cisotoolbox_local.js, jamais chargé en mode
   backend) : déclarés undefined-ables, le code les garde par typeof. ── */
declare var _demoSettingsHTML: (() => string) | undefined;
declare var _wireDemoSettings: (() => void) | undefined;
