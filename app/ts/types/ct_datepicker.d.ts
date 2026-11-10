// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * ct_datepicker — Shared date entry for CISO Toolbox.
 *
 * Equips every <input type="date"> and <input type="datetime-local"> on the
 * page, present or added later, with a field the date is typed into and a
 * calendar with month and year lists. No caller changes:
 *
 *   - the native input stays in the page, hidden, and keeps the value. Its
 *     id, data-*, min, max and handlers are untouched, and the value stays
 *     YYYY-MM-DD (YYYY-MM-DDTHH:MM for datetime-local, with :SS when the
 *     input's step is under a minute);
 *   - a valid entry is written to the native input, which then fires input
 *     and change: data-change / data-input handlers and getElementById()
 *     reads keep working;
 *   - a value set by code (el.value = …) refreshes the displayed text, and
 *     el.focus(), aria-invalid or ct-field-error set by code reach the field.
 *
 * Display: DD/MM/YYYY in French, YYYY-MM-DD in English (plus HH:MM for a
 * datetime). Typed entries accept either form, with or without separators.
 *
 * An entry that is not a valid date is refused: the field turns red with a
 * message, nothing reaches the native input, and the primary button (a modal's
 * main button, data-variant="primary", type=submit) of the modal or form that
 * holds it is held back until the entry is fixed or cleared. A page that
 * saves from its own button calls invalid() first.
 *
 * A field opts out with data-ct-date="native".
 *
 * Public API (window.ct_datepicker):
 *   parse(text, kind, lang) → ISO value, "" for an empty text, null if invalid
 *   format(iso, kind, lang) → displayed text
 *   enhance(root?)          → equip the date inputs under root (automatic)
 *   invalid(root?)          → true, and focus it, if a field under root holds
 *                             a refused entry
 *
 * Depends on t() and _locale from i18n.js (optional: falls back to English).
 */
type CtDateKind = "date" | "datetime";
declare var ct_datepicker: {
    parse: (text: string, kind: CtDateKind, lang?: string) => string | null;
    format: (iso: string, kind: CtDateKind, lang?: string) => string;
    enhance: (root?: ParentNode) => void;
    invalid: (root?: ParentNode) => boolean;
};
