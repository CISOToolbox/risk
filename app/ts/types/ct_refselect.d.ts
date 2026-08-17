// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/ct_refselect.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
interface CtRefOption {
    id: string;
    label?: string;
}
interface CtRefSelectOpts {
    hideId?: boolean;
    /** Truthy → tags become clickable (dispatched to the registered cfg.tagClick). */
    tagClick?: boolean | ((uid: string, optionId: string) => void);
    emptyText?: string;
    single?: boolean;
    placeholder?: string;
}
interface CtRefConfig {
    single?: boolean;
    hideId?: boolean;
    emptyText?: string;
    onToggle?: (uid: string, ids: string[], el: HTMLInputElement) => void;
    onFlush?: (uid: string) => void;
    onRemove?: (uid: string, optionId: string) => void;
    tagClick?: (uid: string, optionId: string) => void;
    labelFor?: (id: string) => string;
}
interface Window {
    ctRefSelect?: (uid: string | null | undefined, value: string | null | undefined, options: CtRefOption[], opts?: CtRefSelectOpts) => string;
    ctRefOpen?: (uid: string) => void;
    ctRefFilter?: (uid: string, query: string) => void;
    ctRefToggle?: (uid: string, el: HTMLInputElement) => void;
    ctRefRemove?: (uid: string, optionId: string) => void;
    ctRefTagClick?: (uid: string, optionId: string) => void;
    ctRefRegister?: (uid: string, cfg: CtRefConfig) => void;
}
declare var _ctRefCounter: number;
declare function ctRefSelect(uid: string | null | undefined, value: string | null | undefined, options: CtRefOption[], opts?: CtRefSelectOpts): string;
declare function ctRefOpen(uid: string): void;
declare function ctRefFilter(uid: string, query: string): void;
declare function ctRefToggle(uid: string, el: HTMLInputElement): void;
declare function ctRefRemove(uid: string, optionId: string): void;
declare function ctRefTagClick(uid: string, optionId: string): void;
declare var _ctRefRegistry: Record<string, CtRefConfig>;
declare function ctRefRegister(uid: string, cfg: CtRefConfig): void;
declare function _ctRefUpdateTags(uid: string, selectedIds: string[], cfg: CtRefConfig): void;
declare function _ctRefFlush(dd: Element): void;
