// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/ct_modal.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct_modal — Promise-based modal overlay for CISO Toolbox.
 *
 * Single reusable overlay element, created lazily and shared across
 * every `ct_modal.open()` call. CSP-safe — no inline onclick, all
 * button clicks go through a global `_ctModalBtn(id)` dispatcher
 * via data-click.
 *
 * Public API:
 *   ct_modal.open({ title, body, size, buttons, onOpen, closeOnBackdrop })
 *     → Promise resolving to the clicked button's `result` value,
 *       or null if dismissed (ESC / backdrop / unknown button).
 *
 *   ct_modal.confirm({ title, message, danger, confirmLabel, cancelLabel })
 *     → Promise<boolean>
 *
 *   ct_modal.alert({ title, message, okLabel })
 *     → Promise<void>
 *
 *   ct_modal.close()
 *     → Programmatically close and resolve with null.
 *
 * Button spec:
 *   { id, label, primary?, danger?, result? }
 *     result = function → called on click; returning `false` keeps the
 *       modal open (validation hook). Any other return value becomes
 *       the resolved value of the outer promise.
 *     result = non-function → resolved directly.
 *     result = undefined → resolves with null (dismissal semantics —
 *       lets Cancel / Close buttons work out of the box without having
 *       to spell `result: null` every time).
 *
 * Keyboard:
 *   Escape  → close with null
 *   Tab     → cycled through focusable elements within the modal
 *
 * Depends on `esc()` and `_da()` from cisotoolbox.js.
 */
interface CtModalButton {
    id: string;
    label?: string;
    primary?: boolean;
    danger?: boolean;
    /** Function → called on click (`false` keeps the modal open); any other value resolved directly; undefined → resolves null. */
    result?: unknown;
}
interface CtModalOpenOpts {
    title?: string;
    body?: string | (() => string);
    size?: "sm" | "md" | "lg";
    buttons?: CtModalButton[];
    onOpen?: (overlay: HTMLElement) => void;
    closeOnBackdrop?: boolean;
}
interface CtModalConfirmOpts {
    title?: string;
    message?: string;
    danger?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    closeOnBackdrop?: boolean;
}
interface CtModalAlertOpts {
    title?: string;
    message?: string;
    okLabel?: string;
}
interface CtModalApi {
    open(opts?: CtModalOpenOpts): Promise<unknown>;
    confirm(opts?: CtModalConfirmOpts): Promise<boolean>;
    alert(opts?: CtModalAlertOpts): Promise<void>;
    close(): void;
}
interface Window {
    ct_modal?: CtModalApi;
    _ctModalBackdrop?: () => void;
    _ctModalBtn?: (btnId: string) => void;
    _ctNoop?: () => void;
}
