/**
 * CISO Toolbox — Bibliothèque JS commune
 *
 * Chaque application doit définir avant de charger ce fichier :
 *   window.CT_CONFIG = {
 *     autosaveKey: "compliance_autosave",  // clé localStorage
 *     initDataVar: "COMPLIANCE_INIT_DATA", // variable globale des données initiales
 *     refNamespace: "COMPLIANCE_REF",      // namespace des référentiels lazy
 *     descNamespace: "COMPLIANCE_DESCRIPTIONS", // namespace des descriptions
 *     label: "évaluation",                 // label pour les messages ("Nouvelle évaluation")
 *     filePrefix: "Conformite",            // préfixe par défaut du nom de fichier
 *     getSociete: function() { return D.meta?.societe || ""; },
 *     getDate: function() { return D.meta?.date_evaluation || ""; }
 *   };
 *
 * Et les globales :
 *   D                  — objet de données
 *   REFERENTIELS_META  — catalogue des référentiels
 *   _ASSET_BASE        — préfixe des fichiers assets
 *   ensureKeys()       — migration/init des données (app-specific)
 *   renderAll()        — rendu complet (app-specific)
 */
declare function _autoSave(): void;
interface Window {
    _noop: () => void;
    _svgGauge: typeof _svgGauge;
    _svgSparkline: typeof _svgSparkline;
    _svgBar: typeof _svgBar;
    _svgDonut: typeof _svgDonut;
    _svgHeatmap: typeof _svgHeatmap;
    _svgTimeline: typeof _svgTimeline;
    _svgBreakdown: typeof _svgBreakdown;
    _postureColor: typeof _postureColor;
    _postureLabel: typeof _postureLabel;
}
declare var _CT: CtConfig;
declare function _ctInit(): void;
declare function _ct(): CtConfig;
declare function esc(v: unknown): string;
declare function _da(...args: unknown[]): string;
declare function badge(text: string | null | undefined, color: string): string;
declare var CT_ICONS: Record<string, string>;
declare function _icon(name: string, size?: number, extraClass?: string): string;
declare var CT_COLORS: {
    green: {
        bg: string;
        txt: string;
        vivid: string;
    };
    orange: {
        bg: string;
        txt: string;
        vivid: string;
    };
    red: {
        bg: string;
        txt: string;
        vivid: string;
    };
    yellow: {
        bg: string;
        txt: string;
        vivid: string;
    };
    redDark: {
        bg: string;
        txt: string;
        vivid: string;
    };
    redMax: {
        bg: string;
        txt: string;
        vivid: string;
    };
    blue: {
        bg: string;
        txt: string;
        vivid: string;
    };
    indigo: {
        bg: string;
        txt: string;
        vivid: string;
    };
    violet: {
        bg: string;
        txt: string;
        vivid: string;
    };
    purple: {
        bg: string;
        txt: string;
        vivid: string;
    };
    pink: {
        bg: string;
        txt: string;
        vivid: string;
    };
    cyan: {
        bg: string;
        txt: string;
        vivid: string;
    };
    teal: {
        bg: string;
        txt: string;
        vivid: string;
    };
    gray: {
        bg: string;
        txt: string;
        vivid: string;
    };
    dark: {
        bg: string;
        txt: string;
        vivid: string;
    };
    scale3: string[];
    scale4: string[];
    scale5: string[];
    scale6: string[];
    matrix5: string[][];
    matrix4: string[][];
    sliderGreen: string;
    sliderOrange: string;
    sliderRed: string;
};
/**
 * Get a color object {bg, txt, vivid} by scale name.
 * @param {string} name — one of: green, orange, red, yellow, redDark, redMax, blue, gray
 * @returns {{bg:string, txt:string, vivid:string}}
 */
declare function ctColor(name: string): CtColor;
/**
 * Get color by numeric level (1-based) in a scale.
 * @param {number} level — 1 to N
 * @param {number} maxLevel — max level (3, 4, 5, or 6)
 * @returns {{bg:string, txt:string, vivid:string}}
 */
declare function ctColorLevel(level: number, maxLevel?: number): CtColor;
/**
 * Render a styled badge with pastel background and dark text.
 * @param {string} text — badge label
 * @param {string} colorName — CT_COLORS key (green, orange, red, yellow, blue, gray...)
 * @returns {string} HTML
 */
declare function ctBadge(text: string | null | undefined, colorName: string): string;
/**
 * Render a styled badge by numeric level.
 * @param {string} text — badge label
 * @param {number} level — 1 to N
 * @param {number} maxLevel — max level (3, 4, 5)
 * @returns {string} HTML
 */
declare function ctBadgeLevel(text: string | null | undefined, level: number, maxLevel?: number): string;
declare function confColor(v: string | number | null | undefined): string;
declare function _noop(): void;
interface CtGaugeOpts {
    size?: number;
    thickness?: number;
    color?: string;
    label?: string | number;
    sublabel?: string;
}
interface CtSparklineOpts {
    width?: number;
    height?: number;
    color?: string;
    fill?: boolean;
}
interface CtBarSegment {
    value: number;
    color?: string;
}
interface CtBarBucket {
    label: string;
    value?: number;
    color?: string;
    segments?: CtBarSegment[];
}
interface CtBarData {
    buckets?: CtBarBucket[];
    scale?: number;
    unit?: string;
}
interface CtBarOpts {
    rowHeight?: number;
    labelWidth?: number;
    valueWidth?: number;
    width?: number;
}
interface CtDonutSegment {
    label: string;
    value: number;
    color?: string;
}
interface CtDonutData {
    segments?: CtDonutSegment[];
    center_label?: string | number;
    center_sublabel?: string;
}
interface CtDonutOpts {
    size?: number;
    thickness?: number;
}
interface CtHeatmapData {
    matrix?: number[][];
    x_label?: string;
    y_label?: string;
}
interface CtHeatmapOpts {
    size?: number;
}
interface CtTimelineEvent {
    date: string;
    label: string;
    status: string;
}
interface CtTimelineData {
    events?: CtTimelineEvent[];
}
interface CtTimelineOpts {
    width?: number;
}
interface CtGaugeData {
    value?: number;
    max?: number;
    label?: string;
    color?: string;
}
interface CtBreakdown {
    type?: string;
    data?: CtGaugeData | CtBarData | CtDonutData | CtHeatmapData | CtTimelineData;
}
interface CtBreakdownOpts extends CtBarOpts, CtHeatmapOpts, CtTimelineOpts {
}
declare function _svgEsc(v: unknown): string;
declare function _svgGauge(value: number, max: number, opts?: CtGaugeOpts): string;
declare function _svgSparkline(points?: number[] | null, opts?: CtSparklineOpts): string;
declare function _svgBar(data?: CtBarData | null, opts?: CtBarOpts): string;
declare function _svgDonut(data?: CtDonutData | null, opts?: CtDonutOpts): string;
declare function _svgHeatmap(data?: CtHeatmapData | null, opts?: CtHeatmapOpts): string;
declare function _svgTimeline(data?: CtTimelineData | null, opts?: CtTimelineOpts): string;
declare function _postureColor(value: number, max?: number): string;
declare function _postureLabel(score: number | null | undefined): string;
declare function _svgBreakdown(breakdown: CtBreakdown | null | undefined, opts?: CtBreakdownOpts): string;
/**
 * Update sidebar: set active item + open the right accordion group.
 * Call this from each app's selectPanel().
 * @param {string} panelId — the panel being selected
 */
declare function _updateSidebarAccordion(panelId: string): void;
/**
 * Toggle a sidebar group open/closed. If opening, select its first panel.
 * Used via data-click="toggleGroup" data-pass-el on sidebar-toggle elements.
 */
declare function toggleGroup(el: Element | null): void;
declare function _sliderColor(val: number, max: number): string;
declare function _applySliderStyle(el: HTMLInputElement): void;
declare function _initSliders(): void;
declare function _toggleSidebarMobile(): void;
declare function _menuAction(fnName: string): void;
declare function toggleHelp(tab?: string): void;
declare function switchHelpTab(tab: string): void;
declare function _autoHeight(el: HTMLElement): void;
declare var _BLOCKED_DISPATCH: Record<string, number>;
declare function _safeDispatch(fn: string, args: unknown[]): void;
declare var _mouseDownTarget: EventTarget | null;
declare function hd(key: string): string;
declare var _userHiddenCols: Record<string, string[]>;
declare var _userColWidths: Record<string, Record<string, string>>;
declare function _setupTable(tableId: string, defaultHidden?: string[]): void;
declare function _updateColsBtn(tableId: string): void;
declare function hideCol(tableId: string, col: string, silent?: boolean): void;
declare function showCol(tableId: string, col: string): void;
declare function _updateColsPopup(tableId: string): void;
declare function toggleColsPopup(tableId: string): void;
declare function colsButton(tableId: string): string;
declare var RESIZE_EDGE: number;
interface CtResizing {
    th: HTMLElement;
    startX: number;
    startW: number;
    table: HTMLTableElement;
}
declare var _resizing: CtResizing | null;
declare function _doResize(e: MouseEvent): void;
declare function _stopResize(): void;
declare function _loadAsset(filename: string, cb: () => void): void;
declare var _scriptPromises: Record<string, Promise<void> | undefined>;
declare function _loadScript(url: string, opts?: {
    integrity?: string;
    crossOrigin?: string;
    onStart?: () => void;
    onDone?: () => void;
}): Promise<void>;
declare function _safeFileName(name: string, max?: number): string;
declare function _downloadBlob(blob: Blob, filename: string): void;
declare function _downloadCSV(filename: string, headerLine: string, exampleRows?: string[]): void;
declare function _parseCSV(text: string): {
    headers: string[];
    rows: string[][];
};
declare function ctDateStatus(dateStr: string | null | undefined, soonDays: number): "expired" | "soon" | "valid" | "";
declare function _csvAppendRef(current: string, id: string, label: string): string;
declare var _descriptionsLoaded: boolean;
declare function _ensureDescriptions(cb: () => void): void;
declare function _ensureFramework(fwId: string, cb: () => void): void;
declare function _initDataAndRender(afterFn?: () => void): void;
declare function _getAnssDesc(num: string | number): string;
declare function _getIsoDesc(ref: string): string;
declare function _sliderInput(el: HTMLInputElement): void;
declare function showStatus(msg: string, isError?: boolean): void;
declare function toggleMenu(): void;
declare function toggleSidebar(): void;
declare var _undoStack: string[];
declare var _redoStack: string[];
declare function _saveState(): void;
declare function _updateUndoButtons(): void;
declare function _replaceD(json: string): void;
declare function undo(): void;
declare function redo(): void;
declare function _confirmDialog(title: string, body?: string): Promise<boolean>;
declare function _deriveKey(password: string, salt: BufferSource): Promise<CryptoKey>;
declare function _encryptData(jsonStr: string, password: string): Promise<Uint8Array<ArrayBuffer>>;
declare function _decryptData(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>, password: string): Promise<string>;
declare function _isEncrypted(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>): boolean;
declare function _promptPassword(title: string, confirmMode?: boolean): Promise<string | null>;
declare var _ctMatrixCounter: number;
interface CtMatrixItem {
    id?: string | number;
    label?: string;
    detail?: string;
}
interface CtMatrixOpts {
    levels?: number;
    xLevels?: number;
    yLevels?: number;
    xLabel?: string;
    yLabel?: string;
    xLabels?: string[];
    yLabels?: string[];
    grid?: Record<string, CtMatrixItem[]>;
    tooltipFn?: (items: CtMatrixItem[]) => string;
    colors?: string[][];
    colorFn?: (x: number, y: number) => string;
    legend?: {
        label: string;
        color: string;
    }[];
}
/**
 * Render a parametrable risk matrix (SVG heatmap with dots and tooltips).
 *
 * @param {Object} opts
 * @param {number} opts.levels       Number of levels per axis (4 or 5, default 5)
 * @param {string} opts.xLabel       X-axis label (default "Impact")
 * @param {string} opts.yLabel       Y-axis label (default "Vraisemblance")
 * @param {string[]} [opts.xLabels]  Per-level X labels (e.g. ["Neg.","Min.","Mod.","Maj.","Crit."])
 * @param {string[]} [opts.yLabels]  Per-level Y labels
 * @param {Object} opts.grid         Data: { "x-y": [{id, label, detail}], ... }
 * @param {Function} [opts.tooltipFn] Custom tooltip renderer: fn(items) → HTML string
 * @param {string[][]} [opts.colors] Custom color matrix (levels×levels), bottom-left to top-right
 * @param {Function}  [opts.colorFn] Custom color function: fn(x, y) → color string (overrides colors matrix)
 * @param {Object[]} [opts.legend]   Custom legend: [{label, color}]
 * @returns {string} HTML string (SVG + legend + tooltip div)
 */
declare function ctRenderMatrix(opts: CtMatrixOpts): string;
