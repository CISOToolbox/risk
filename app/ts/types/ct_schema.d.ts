// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/ct_schema.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
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
