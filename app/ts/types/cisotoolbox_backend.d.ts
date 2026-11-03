// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Backend persistence layer
 *
 * No-op stubs for localStorage autosave (data is in PostgreSQL).
 * File I/O (open/save/import/export) still works for JSON import/export.
 * Snapshots disabled (use database backups instead).
 * Load AFTER cisotoolbox.js. Used by backend apps only.
 *
 * FACTORED SOURCE — replaces the historical variants with a
 * single file parameterised by a runtime flag, read at action time (never
 * at load time):
 *
 *   window._CT_IMPORT_NO_UNWRAP = true
 *       → disables detection/unwrapping of the Pilot backup format
 *         {"module":...,"data":[{"id":...,"data":{...}}]} on import.
 *         To be set by the PILOT module's front end (it must not unwrap
 *         its own backups). Default: unwrap enabled (8/9 modules).
 *
 * The newAnalysis → window.catalogCreate delegation stays guarded by a
 * runtime typeof: modules with no catalog (pilot, appsec, watch) do not
 * define catalogCreate, behaviour unchanged.
 */
declare function _loadAutoSave(): boolean;
declare function _checkAutoSaveBanner(): void;
declare function _restoreSession(): void;
declare function _discardSession(): void;
declare var _fileHandle: FileSystemFileHandle | null;
declare function newAnalysis(): void;
declare var _filePwd: string | null;
declare function _loadBuffer(buffer: ArrayBuffer, filename: string): Promise<true | null>;
declare function loadJSON(event: Event): void;
declare function openFile(): Promise<void>;
declare function _serializeForSave(): Promise<Blob>;
declare function quickSaveJSON(): Promise<void>;
declare function saveJSON(): Promise<void>;
declare function enableFileEncryption(): Promise<void>;
declare function disableFileEncryption(): void;
interface CtApiError extends Error {
    status: number;
    /** The server's reason (the `detail` of the JSON body, else the raw body). */
    detail: string;
    /** FEAT-33: the data changed server-side since this tab loaded. */
    stale: boolean;
}
declare function _ctDetailText(detail: unknown): string;
declare function ct_apiError(resp: Response, body: string): CtApiError;
declare function _ctRefusal(err: any): boolean;
/**
 * The whole-project save failed. A version conflict keeps its own message;
 * any other refusal (400 / 409 / 422) says the server's reason, then reloads what
 * the server keeps — every later save would fail the same way. A 403 is only
 * said, in red: reloading would not change it, and a read-only user would
 * get it on every visit. Returns false for any other failure (the caller
 * logs it).
 */
declare function ct_projectSaveFailed(err: any): boolean;
/**
 * A targeted change (PATCH, section PUT, create, delete) failed: a refusal
 * shows the server's reason in red — a 404 too (the record was deleted
 * meanwhile, e.g. from another tab) — and any other failure (server error,
 * network) is said too: the change was not saved.
 */
declare function ct_changeFailed(err: any): void;
declare function createSnapshot(): void;
declare function restoreSnapshot(): void;
declare function deleteSnapshot(): void;
declare function exportSnapshot(): void;
declare function enableSnapEncryption(): void;
declare function disableSnapEncryption(): void;
declare function _isSnapEncrypted(): boolean;
declare function _getSnapshots(): Promise<unknown[]>;
