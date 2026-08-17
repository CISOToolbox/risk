// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/ct_userpicker.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct_userpicker — Shared user assignment widget for CISO Toolbox.
 *
 * Single entry point for "pick a user or create one if missing", used
 * by every measure add/edit modal across modules.
 *
 * Public API:
 *   ct_userpicker.mount(opts)           → Promise<handle>
 *     Smart mount: detects Pilot reachability via opts.sourceUrl, then
 *     replaces opts.slotId with either a full picker (Pilot mode) or a
 *     plain text input (local mode). Returns a handle exposing a uniform
 *     getValue()/setValue() regardless of which branch was chosen.
 *
 *   ct_userpicker.render(opts)          → HTML string
 *     Low-level: emit the picker HTML + register the instance. Prefer
 *     mount() — use render() only if you need to inline the HTML.
 *
 *   ct_userpicker.promptCreateUser(opts) → Promise<user|null>
 *     Opens a ct_modal to create a user (Nom*, Prénom*, Email*, Fonction?)
 *     then POSTs to opts.apiUrl. Handles 409 (duplicate email) by fetching
 *     the existing user and returning it. Rejects silently to null on
 *     user cancel.
 *
 *   ct_userpicker.getValue(id) / setValue(id, label) / setUsers(id, users)
 *   ct_userpicker._label(user)  — canonical label helper
 *
 * Mount opts:
 *   slotId          — id of a <div> placeholder to be replaced (required)
 *   pickerId        — unique id for the picker instance (required in Pilot mode)
 *   value           — initial selected label
 *   placeholder     — input placeholder
 *   directoryUrl    — GET endpoint returning the user list (default "api/directory")
 *   sourceUrl       — GET endpoint returning {source, pilot_available}
 *                     (default "api/settings/directory-source"). Pass
 *                     null to skip detection and always render the picker
 *                     (e.g. in Pilot itself, which is the native directory).
 *   onCreate        — callback(query) → Promise<user|null>. Enables the
 *                     "+ Créer" option. Caller is responsible for the
 *                     snapshot-and-reopen pattern around promptCreateUser()
 *                     since ct_modal is a single overlay — see
 *                     ct_measure_modal for a reference implementation.
 *
 * Depends on esc(), _da() from cisotoolbox.js and ct_modal.
 */
interface CtUser {
    id?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    fonction?: string;
}
interface CtUserpickerHandle {
    mode: "picker" | "input" | "none";
    getValue(): string;
    setValue(label: string): void;
}
interface CtUserpickerRenderOpts {
    id: string;
    users?: CtUser[];
    value?: string;
    placeholder?: string;
    onCreate?: ((query: string) => Promise<CtUser | null> | CtUser | null) | null;
    /** Fired with the picked user's email on selection/creation. Lets the
     *  picker be used inline with immediate save (e.g. _dirPicker cells). */
    onChange?: ((email: string) => void) | null;
}
interface CtUserpickerMountOpts {
    slotId: string;
    pickerId?: string;
    value?: string;
    placeholder?: string;
    directoryUrl?: string;
    sourceUrl?: string | null;
    onCreate?: (query: string) => Promise<CtUser | null>;
}
interface CtUserpickerPromptOpts {
    query?: string;
    apiUrl?: string;
}
interface CtUserpickerApi {
    render(opts: CtUserpickerRenderOpts): string;
    mount(opts: CtUserpickerMountOpts): Promise<CtUserpickerHandle>;
    promptCreateUser(opts?: CtUserpickerPromptOpts): Promise<CtUser | null>;
    getValue(id: string): string;
    setValue(id: string, label: string): void;
    setUsers(id: string, users: CtUser[]): void;
    _label(u: CtUser | null | undefined): string;
}
interface Window {
    ct_userpicker?: CtUserpickerApi;
    _ctUpFocus?: (id: string) => void;
    _ctUpSearch?: (id: string, query: string) => void;
    _ctUpPick?: (id: string, label: string, email?: string) => void;
    _ctUpCreate?: (id: string, query: string) => void;
}
