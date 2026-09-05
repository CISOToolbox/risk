/**
 * EBIOS RM — types for the D data model + app globals.
 * Pure type file (no emit). Shapes inferred from the actual usage in
 * EBIOS_RM_app.js / EBIOS_RM_ai_assistant.js / EBIOS_RM_catalog.js.
 */

/** Numeric value or empty field (input-field convention). */
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
    /** ER page option: gravity entered per impact category. */
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
    /** Risk levels by likelihood V1..V4 (canonical FR keys). */
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
    /** Legacy format (skill) — migrated to vm by ensureKeys. */
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
    /** Legacy format (skill) — migrated to bs by ensureKeys. */
    bs_concernes?: string;
}

interface EbiosER {
    id: string;
    evenement: string;
    vm: string;
    dict: string;
    impacts: string;
    gravite: EbNum;
    /** Gravity per impact category (option). */
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
    /** Legacy formats (skill) — migrated by ensureKeys. */
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
    /** Legacy formats — migrated/removed by ensureKeys. */
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
    /** Absent from measures created by addSocleMeasure/addEcoMeasure/addSOPMeasure (backfilled by ensureKeys). */
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
 * ANSSI baseline row (num/thematique) or ISO 27001 (ref/theme/applicable).
 * Single interface to avoid array unions in renderSocle & co.
 */
interface EbiosSocleRow {
    /** ANSSI: measure number (1..42). */
    num?: EbNum | string;
    /** ISO: Annex A reference (A.x.y). */
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
    /** Legacy format — copied into nom by ensureKeys. */
    description?: string;
}

interface EbiosFair {
    lef_min: EbNum; lef_likely: EbNum; lef_max: EbNum;
    lm_min: EbNum; lm_likely: EbNum; lm_max: EbNum;
    ale_p10: EbNum; ale_p50: EbNum; ale_p90: EbNum; ale_mean: EbNum;
    [k: string]: unknown;
}

/** Complete data model of an EBIOS RM analysis. */
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
    /** Generic indexed access (updateField / toggleDICT / delRow…). */
    [k: string]: any;
}

/* ── Globals provided by the lazy data / companion files ── */

interface Window {
    /** FEAT-41 — flushes the debounced writes and resolves once they are
     *  gone. The AI assistant must await it: the server re-reads the
     *  analysis from the DB to compose the prompt. */
    _riskFlushPending?: () => Promise<void>;
    EBIOS_INIT_DATA?: EbiosData;
    EBIOS_DESCRIPTIONS?: { anssi: Record<string, string>; iso: Record<string, string>;
                           anssi_en?: Record<string, string>; iso_en?: Record<string, string>; };
    EBIOS_TEMPLATE?: { templateB64: string };
    /** Init hook installed by EBIOS_RM_catalog.js (IndexedDB catalog mode). */
    _appInitCallback?: () => void;
    /** Logged-in user (backend variant only). */
    _currentUser?: { name?: string; email?: string; role?: string };
    /** Backend persistence (demo-docker variant) — absent in opensource. */
    _persistSettings?: () => void;
    /* App globals exposed on window (catalog + ai_assistant) */
    renderSocle?: EbAiWrappedRender;
    renderEco?: EbAiWrappedRender;
    renderSOP?: EbAiWrappedRender;
    /* demo-docker variant: backend analysis ids are string | number
       (PostgreSQL serial) — params widened vs opensource (string only). */
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
    /** Dynamic index: AI wrappers (window[fn]) and renderers by name. */
    [k: string]: any;
}

/** Render function possibly wrapped by the AI assistant. */
type EbAiWrappedRender = { (): void; _aiWrapped?: boolean; _aiInlineWrapped?: boolean };

/** PP point for the ecosystem map (_buildEcoSVG). */
interface EbEcoPoint {
    id: string;
    nom: string;
    cat: string;
    menace: number;
    fiab: number;
    expo: number;
}

/* ── Synthesis / report utility types ───────────────────────────── */

/** Position of an SS in the synthesis matrices. */
interface EbSynthPos {
    id: string;
    gNum: EbNum;
    vInit: number;
    vResid: number;
}

/** Synthesis row (one SS) produced by _synthesisData(). */
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

/** Return value of _synthesisData(). */
type EbSynthData = ReturnType<typeof _synthesisData>;

/** PNG image captured for the Word report. */
interface EbReportImg {
    buf: ArrayBuffer;
    w: number;
    h: number;
}

/* ── Local override: the generated decl of cisotoolbox_local requires 3
   args for _persist, but the opensource app calls it with the section alone
   (no-op localStorage; the backend variant reads this 1st argument). To be
   raised with the coordinator (entityId/fields should be optional). ── */
declare function _persist(entityType: string): void;
/** Refreshes the "ID - label" references frozen in the other sections
 *  when an item is renamed (EBIOS_RM_app.ts). */
declare function propagateNameChange(id: string, newName: string): void;
// Lives in cisotoolbox_local.js (not loaded by backend apps; snapshots managed
// by Pilot in suite mode). Possibly-undefined + called with ! — same pattern as vendor.
declare var _renderSnapshotsPanel: ((opts: any) => Promise<void>) | undefined;
/** Installed by directory_picker.js (window._dirPicker) — generated decl empty (IIFE). */
declare var _dirPicker: (currentValue: string | null | undefined, handler: string, argsJson: string) => string;

/** Analysis record in the IndexedDB catalog (EBIOS_RM_catalog). */
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

/* ── Demo hooks (defined by cisotoolbox_local.js, never loaded in backend
   mode): declared undefined-able, the code guards them with typeof. ── */
declare var _demoSettingsHTML: (() => string) | undefined;
declare var _wireDemoSettings: (() => void) | undefined;
