// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/backend/cisotoolbox_backend.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Backend persistence layer
 *
 * No-op stubs for localStorage autosave (data is in PostgreSQL).
 * File I/O (open/save/import/export) still works for JSON import/export.
 * Snapshots disabled (use database backups instead).
 * Load AFTER cisotoolbox.js. Used by backend apps only.
 *
 * FACTORED MASTER (TS migration) — replaces the historical variants with a
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
declare function createSnapshot(): void;
declare function restoreSnapshot(): void;
declare function deleteSnapshot(): void;
declare function exportSnapshot(): void;
declare function enableSnapEncryption(): void;
declare function disableSnapEncryption(): void;
declare function _isSnapEncrypted(): boolean;
declare function _getSnapshots(): Promise<unknown[]>;
