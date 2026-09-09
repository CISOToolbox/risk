// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
declare class CtSchemaFutureRevError extends Error {
    fileRev: number;
    appRev: number;
    constructor(fileRev: number, appRev: number);
}
declare function _ctSchemaAppRev(): number;
declare function _ctSchemaNormalize(data: Record<string, any>): void;
declare function ctSchemaMigrate(data: Record<string, any>): void;
declare function ctSchemaStamp(data: Record<string, any>): void;
