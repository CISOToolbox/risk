/* ============================================================================
 * CISO Toolbox — ambient type declarations for vendored / CDN libraries
 * (frontend-ts migration)
 *
 * Covers ONLY the API surface actually exercised by the apps:
 *   - ExcelJS       → EBIOS_RM_app.js, TPRM_app.js, TPRM_dora_export.js,
 *                     Compliance_ai_assistant.js
 *   - JSZip         → ISO_Audit_app.js, ISO_Audit_export.js,
 *                     Compliance_ai_assistant.js
 *   - PizZip        → EBIOS_RM_app.js (Word report)
 *   - docxtemplater → EBIOS_RM_app.js (Word report)
 *   - PptxGenJS     → EBIOS_RM_app.js (managerial synthesis PPTX)
 *
 * XLSX / SheetJS is NOT used by any app (the DORA RoI "XLSX" export is
 * built with ExcelJS) — intentionally not declared here.
 *
 * Members the apps actually call carry precise signatures; everything else
 * is left open via `[k: string]: any` index signatures.
 * Globals only — no modules, no Window augmentation.
 * ========================================================================== */

/* ───────────────────────────── ExcelJS ─────────────────────────────────── */

declare namespace ExcelJS {
    interface CellColor {
        argb: string;
        [k: string]: any;
    }

    interface Font {
        bold?: boolean;
        italic?: boolean;
        size?: number;
        color?: CellColor;
        [k: string]: any;
    }

    interface Fill {
        type: "pattern";
        pattern: string;                 // "solid", ...
        fgColor?: CellColor;
        bgColor?: CellColor;
        [k: string]: any;
    }

    interface Alignment {
        horizontal?: "left" | "center" | "right" | "fill" | "justify";
        vertical?: "top" | "middle" | "bottom";
        wrapText?: boolean;
        [k: string]: any;
    }

    interface BorderSide {
        style?: string;                  // "thin", ...
        color?: CellColor;
        [k: string]: any;
    }

    interface Borders {
        top?: BorderSide;
        left?: BorderSide;
        bottom?: BorderSide;
        right?: BorderSide;
        [k: string]: any;
    }

    interface Protection {
        locked?: boolean;
        [k: string]: any;
    }

    interface DataValidation {
        type: string;                    // "list", ...
        allowBlank?: boolean;
        formulae?: string[];
        showErrorMessage?: boolean;
        errorStyle?: string;             // "warning", ...
        errorTitle?: string;
        error?: string;
        [k: string]: any;
    }

    /** Cell value: string | number | Date | null | rich object
     *  ({ richText: [{ text }] }, { result }, { text }, …). The apps probe the
     *  shape at runtime (_cv / _xlCellText), so it stays `any`. */
    type CellValue = any;

    interface Cell {
        value: CellValue;
        font: Font;
        fill: Fill;
        alignment: Alignment;
        border: Borders;
        numFmt: string;                  // e.g. "yyyy-mm-dd"
        protection: Protection;
        dataValidation: DataValidation;
        [k: string]: any;
    }

    interface Row {
        font: Font;
        fill: Fill;
        alignment: Alignment;
        getCell(col: number | string): Cell;
        eachCell(callback: (cell: Cell, colNumber: number) => void): void;
        eachCell(
            options: { includeEmpty?: boolean },
            callback: (cell: Cell, colNumber: number) => void
        ): void;
        [k: string]: any;
    }

    interface Column {
        header?: string;
        key?: string;
        width?: number;
        [k: string]: any;
    }

    interface WorksheetView {
        state?: "normal" | "frozen" | "split";
        xSplit?: number;
        ySplit?: number;
        [k: string]: any;
    }

    interface ConditionalFormattingRule {
        type: string;                    // "expression", ...
        formulae?: string[];
        style?: {
            fill?: Fill;
            font?: Font;
            border?: Borders;
            [k: string]: any;
        };
        [k: string]: any;
    }

    interface ConditionalFormattingOptions {
        ref: string;                     // "H2:H40 L2:L40"
        rules: ConditionalFormattingRule[];
        [k: string]: any;
    }

    interface Worksheet {
        name: string;
        state: "visible" | "hidden" | "veryHidden";
        readonly rowCount: number;
        columns: Array<Partial<Column>>;
        views: WorksheetView[];
        addRow(values: ReadonlyArray<CellValue> | Record<string, CellValue>): Row;
        getRow(rowNumber: number): Row;
        getCell(address: string): Cell;                 // "A1"
        getCell(row: number, col: number): Cell;        // (4, 3)
        getColumn(col: number | string): Column;
        eachRow(callback: (row: Row, rowNumber: number) => void): void;
        eachRow(
            options: { includeEmpty?: boolean },
            callback: (row: Row, rowNumber: number) => void
        ): void;
        addConditionalFormatting(options: ConditionalFormattingOptions): void;
        [k: string]: any;
    }

    class Workbook {
        constructor();
        creator: string;
        created: Date;
        readonly worksheets: Worksheet[];
        readonly xlsx: {
            load(data: ArrayBufferLike | Uint8Array | Blob | string): Promise<Workbook>;
            writeBuffer(options?: Record<string, any>): Promise<ArrayBuffer>;
            [k: string]: any;
        };
        addWorksheet(name?: string, options?: Record<string, any>): Worksheet;
        getWorksheet(nameOrIndex?: string | number): Worksheet | undefined;
        eachSheet(callback: (worksheet: Worksheet, sheetId: number) => void): void;
        [k: string]: any;
    }
}

/* ───────────────────────────── JSZip ───────────────────────────────────── */

declare class JSZip {
    constructor();

    /** Read entry — apps chain `.async("string")` directly on a known path. */
    file(path: string): JSZip.JSZipObject;
    /** Write entry (chainable). `{ base64: true }` used for embedded images. */
    file(
        path: string,
        data: string | ArrayBufferLike | Uint8Array | Blob,
        options?: { base64?: boolean; [k: string]: any }
    ): JSZip;

    /** Create/open a sub-folder (chainable: `zip.folder("word").file(...)`). */
    folder(name: string): JSZip;

    generateAsync(options: {
        type: "blob";
        mimeType?: string;
        [k: string]: any;
    }): Promise<Blob>;
    generateAsync(options: { type: string; [k: string]: any }): Promise<any>;

    static loadAsync(
        data: ArrayBufferLike | Uint8Array | Blob | string,
        options?: Record<string, any>
    ): Promise<JSZip>;

    [k: string]: any;
}

declare namespace JSZip {
    interface JSZipObject {
        name: string;
        async(type: "string"): Promise<string>;
        async(type: string): Promise<any>;
        [k: string]: any;
    }
}

/* ───────────────────────────── PizZip ──────────────────────────────────── */

declare class PizZip {
    constructor(
        data?: string | ArrayBufferLike | Uint8Array,
        options?: Record<string, any>
    );

    /** Read entry — apps both chain `.asText()` and truthy-test the result. */
    file(path: string): PizZip.PizZipObject;
    /** Write entry (string XML or ArrayBuffer for PNG media). */
    file(path: string, data: string | ArrayBufferLike | Uint8Array): PizZip;

    generate(options: {
        type: "blob";
        mimeType?: string;
        [k: string]: any;
    }): Blob;
    generate(options: { type: string; [k: string]: any }): any;

    [k: string]: any;
}

declare namespace PizZip {
    interface PizZipObject {
        name: string;
        asText(): string;
        [k: string]: any;
    }
}

/* ─────────────────────────── docxtemplater ─────────────────────────────── */

/** Global is lowercase in the vendored build (`new docxtemplater(...)`,
 *  reached as `window.docxtemplater` in the JS sources). */
declare class docxtemplater {
    constructor(
        zip: PizZip,
        options?: {
            paragraphLoop?: boolean;
            linebreaks?: boolean;
            nullGetter?: (part?: any) => any;
            [k: string]: any;
        }
    );
    render(data?: Record<string, any>): docxtemplater;
    getZip(): PizZip;
    [k: string]: any;
}

/* ───────────────────────────── PptxGenJS ───────────────────────────────── */

declare class PptxGenJS {
    constructor();

    /** e.g. "LAYOUT_WIDE" (13.33 × 7.5 in). */
    layout: string;

    /** Shape name tokens passed to `slide.addShape(pptx.ShapeType.rect, …)`. */
    readonly ShapeType: {
        rect: PptxGenJS.ShapeName;
        roundRect: PptxGenJS.ShapeName;
        line: PptxGenJS.ShapeName;
        [k: string]: PptxGenJS.ShapeName;
    };

    addSlide(options?: Record<string, any>): PptxGenJS.Slide;
    writeFile(options?: { fileName?: string; [k: string]: any }): Promise<string>;

    [k: string]: any;
}

declare namespace PptxGenJS {
    /** Opaque shape token (string enum value in the real lib). */
    type ShapeName = string;

    /** Hex color WITHOUT leading '#': "1E3A5F". */
    type HexColor = string;

    interface ShapeFill {
        color: HexColor;
        [k: string]: any;
    }

    interface ShapeLine {
        color?: HexColor;
        width?: number;
        [k: string]: any;
    }

    /** Options shared by addText / addShape as the apps use them. */
    interface TextOptions {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        fontSize?: number;
        bold?: boolean;
        italic?: boolean;
        color?: HexColor;
        align?: "left" | "center" | "right";
        valign?: "top" | "middle" | "bottom";
        fill?: ShapeFill;
        line?: ShapeLine;
        rectRadius?: number;
        [k: string]: any;
    }

    interface TextRun {
        text: string;
        options?: TextOptions;
        [k: string]: any;
    }

    type TableCell = string | number | TextRun;

    interface TableBorder {
        type?: string;                   // "solid"
        color?: HexColor;
        pt?: number;
        [k: string]: any;
    }

    interface TableOptions {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        fontSize?: number;
        valign?: "top" | "middle" | "bottom";
        border?: TableBorder;
        [k: string]: any;
    }

    interface Slide {
        addText(text: string | TextRun[], options?: TextOptions): Slide;
        addShape(shape: ShapeName, options?: TextOptions): Slide;
        addTable(rows: TableCell[][], options?: TableOptions): Slide;
        [k: string]: any;
    }
}
