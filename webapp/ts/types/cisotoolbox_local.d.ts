// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/cisotoolbox_local.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Frontend persistence layer (localStorage)
 *
 * Autosave, file I/O (open/save with encryption), session restore banner, snapshots.
 * Load AFTER cisotoolbox.js. Used by standalone frontend apps only.
 * Backend apps load cisotoolbox_backend.js instead.
 */
interface CtSnapshot {
    name: string;
    date: string;
    societe?: string;
    organization?: string;
    data: string;
    [k: string]: any;
}
interface CtSnapshotsPanelKeys {
    create: string;
    encrypt: string;
    decrypt: string;
    encryption_active?: string;
    none: string;
    col_name: string;
    col_date: string;
    col_org: string;
    col_actions: string;
    restore: string;
    export: string;
    hint?: string;
}
interface CtSnapshotsPanelOpts {
    target: string | HTMLElement;
    orgField?: string;
    keys: CtSnapshotsPanelKeys;
}
type CtAutoSaveFn = {
    (): void;
    __ctUndoHooked?: boolean;
};
declare var _fileHandle: FileSystemFileHandle | null;
declare function _obj(k: string, v: any): Record<string, any>;
declare function _persist(entityType: string, entityId: string | number, fields: Record<string, any>): void;
declare function _persistCreate(entityType: string, data: Record<string, any>): void;
declare function _persistDelete(entityType: string, entityId: string | number): void;
declare function _renderSnapshotsPanel(opts: CtSnapshotsPanelOpts): Promise<void>;
declare function _installUndoHook(): void;
declare function _loadAutoSave(): boolean;
declare function _checkAutoSaveBanner(): void;
declare function _restoreSession(): void;
declare function _discardSession(): void;
declare function _dismissBanner(): void;
declare function newAnalysis(): void;
declare var _filePwd: string | null;
declare function _resetFileBinding(): void;
declare function _decodeBuffer(buffer: ArrayBuffer): Promise<string | null>;
declare function _applyLoadedJson(jsonStr: string): true;
declare function _loadBuffer(buffer: ArrayBuffer, filename?: string): Promise<boolean | null>;
declare function loadJSON(event: Event): void;
declare function openFile(): Promise<void>;
declare function _serializeForSave(): Promise<Blob>;
declare function quickSaveJSON(): Promise<void>;
declare function saveJSON(): Promise<void>;
declare function enableFileEncryption(): Promise<void>;
declare function disableFileEncryption(): void;
declare var _snapPwd: string | null;
declare var SNAP_ENC_PREFIX: string;
declare var SNAP_MAX: number;
declare function _getSnapKey(): string;
declare function _getSnapshots(): Promise<CtSnapshot[]>;
declare function _saveSnapshots(snaps: CtSnapshot[]): Promise<void>;
declare function _isSnapEncrypted(): boolean;
declare function createSnapshot(): Promise<void>;
declare function restoreSnapshot(idx: number): Promise<void>;
declare function deleteSnapshot(idx: number): Promise<void>;
declare function exportSnapshot(idx: number): Promise<void>;
declare function enableSnapEncryption(): Promise<void>;
declare function disableSnapEncryption(): Promise<void>;
declare function _demoSettingsHTML(): string;
declare function _wireDemoSettings(): void;
