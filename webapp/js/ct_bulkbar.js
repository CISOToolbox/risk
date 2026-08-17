// ─────────────────────────────────────────────────────────────
// REPLICATED from the private shared repository — do not edit here.
// GENERATED from shared/ts/ (or shared/types/) by shared/ts-build.sh.
// Edit the shared source instead: any change made in this repository is
// overwritten by the next sync, and pull requests touching this file
// cannot be merged. See CONTRIBUTING.md § Replicated files.
// ─────────────────────────────────────────────────────────────
/**
 * ct_bulkbar — Fixed bottom bulk-action bar for CISO Toolbox tables.
 *
 * One reusable .ct-bulkbar DOM node. Selection state kept in a
 * module-level Map<scope, Set<key>> that survives table re-renders.
 * CSP-safe (data-click everywhere).
 *
 * Public API:
 *   ct_bulkbar.attach({scope, label, actions, onClear})
 *     Register the actions to display for a given scope. Safe to call
 *     repeatedly — the latest attach() for a scope wins.
 *   ct_bulkbar.update(scope, count?)
 *     Re-render the bar for scope (defaults to getSelection().size).
 *   ct_bulkbar.getSelection(scope) → Set<key>
 *   ct_bulkbar.count(scope) → number
 *   ct_bulkbar.isSelected(scope, key) → bool
 *   ct_bulkbar.toggle(scope, key)     — flip membership + auto-update
 *   ct_bulkbar.select(scope, key)
 *   ct_bulkbar.deselect(scope, key)
 *   ct_bulkbar.setSelection(scope, keys)  — replace selection
 *   ct_bulkbar.clear(scope)               — empty selection, hide bar
 *
 * Action spec:
 *   { id, icon?, label, onClick, variant?, confirm? }
 *     onClick  — global function name, invoked as fn(scope, actionId).
 *     variant  — primary | success | warning | info | muted | danger.
 *                (danger is also the short-hand: `danger:true`)
 *     confirm  — { title, message } opens ct_modal.confirm before firing.
 *                Both strings support "{n}" = selection count.
 *     label    — supports "{n}" too.
 *
 * Depends on esc(), _da(), _icon() from cisotoolbox.js. Optional
 * ct_modal for confirm dialogs (falls back to window.confirm).
 */
(function() {
    "use strict";

    var _registry = {};  // scope → {label, actions, onClear}
    var _selections = {}; // scope → Set<key>
    var _activeScope = null;
    var _barEl = null;

    function _set(scope) {
        if (!_selections[scope]) _selections[scope] = new Set();
        return _selections[scope];
    }

    function _interp(str, n) {
        return String(str == null ? "" : str).replace(/\{n\}/g, String(n));
    }

    function _ensureBar() {
        if (_barEl && document.body.contains(_barEl)) return _barEl;
        _barEl = document.createElement("div");
        _barEl.className = "ct-bulkbar";
        _barEl.hidden = true;
        document.body.appendChild(_barEl);
        return _barEl;
    }

    function attach(opts) {
        opts = opts || {};
        if (!opts.scope) return;
        _registry[opts.scope] = {
            label: opts.label || "{n} sélectionné(s)",
            actions: Array.isArray(opts.actions) ? opts.actions : [],
            onClear: opts.onClear || null
        };
    }

    function getSelection(scope) { return _set(scope); }
    function count(scope) { return _set(scope).size; }
    function isSelected(scope, key) { return _set(scope).has(key); }

    function select(scope, key)   { _set(scope).add(key); update(scope); }
    function deselect(scope, key) { _set(scope)["delete"](key); update(scope); }
    function toggle(scope, key) {
        var s = _set(scope);
        if (s.has(key)) s["delete"](key); else s.add(key);
        update(scope);
    }
    function setSelection(scope, keys) {
        _selections[scope] = new Set(Array.isArray(keys) ? keys : []);
        update(scope);
    }
    function clear(scope) {
        _selections[scope] = new Set();
        if (_activeScope === scope && _barEl) {
            _barEl.hidden = true;
            _barEl.innerHTML = "";
            _activeScope = null;
        }
        _syncDOM(scope);
    }

    // Sync any DOM checkboxes bound to this scope with the current
    // selection state (after external add/remove / clear).
    function _syncDOM(scope) {
        var boxes = document.querySelectorAll('input[type="checkbox"][data-bulk-scope="' + scope + '"]');
        var sel = _selections[scope] || new Set();
        var totalRows = 0, checkedRows = 0;
        for (var i = 0; i < boxes.length; i++) {
            var b = boxes[i];
            if (b.hasAttribute("data-bulk-all")) continue;
            totalRows++;
            var k = b.getAttribute("data-bulk-key");
            var isChecked = k != null && sel.has(k);
            if (isChecked) checkedRows++;
            b.checked = isChecked;
        }
        // Header "select all" reflects partial/full state.
        var headerBox = document.querySelector('input[type="checkbox"][data-bulk-scope="' + scope + '"][data-bulk-all]');
        if (headerBox) {
            headerBox.checked = totalRows > 0 && checkedRows === totalRows;
            headerBox.indeterminate = checkedRows > 0 && checkedRows < totalRows;
        }
    }

    function update(scope, countOverride) {
        var reg = _registry[scope];
        var n = countOverride != null ? countOverride : _set(scope).size;
        var bar = _ensureBar();

        if (!n || !reg) {
            if (_activeScope === scope || n === 0) {
                bar.hidden = true;
                bar.innerHTML = "";
                _activeScope = null;
            }
            _syncDOM(scope);
            return;
        }

        _activeScope = scope;

        var h = '';
        h += '<span class="ct-bulkbar__count">' + esc(_interp(reg.label, n)) + '</span>';
        h += '<div class="ct-bulkbar__actions">';
        (reg.actions || []).forEach(function(a) {
            if (!a || !a.onClick) return;
            var cls = "ct-bulkbar__btn";
            if (a.danger) cls += " ct-bulkbar__btn--danger";
            else if (a.variant) cls += " ct-bulkbar__btn--" + a.variant;
            h += '<button type="button" class="' + esc(cls) + '"'
              +  ' data-click="_ctBulkbarDispatch"'
              +  ' data-args=\'' + _da(scope, a.id) + '\''
              +  (a.label ? ' title="' + esc(_interp(a.label, n)) + '"' : "")
              +  '>'
              +  (a.icon && typeof _icon === "function" ? _icon(a.icon, 14) + " " : "")
              +  esc(_interp(a.label || a.id || "", n))
              +  '</button>';
        });
        h += '</div>';
        h += '<button type="button" class="ct-bulkbar__btn ct-bulkbar__clear"'
          +  ' data-click="_ctBulkbarClear" data-args=\'' + _da(scope) + '\'>'
          +  esc("×")
          +  '</button>';

        bar.innerHTML = h;
        bar.hidden = false;
        _syncDOM(scope);
    }

    // Dispatchers (CSP-safe) ──────────────────────────────────────

    window._ctBulkbarDispatch = function(scope, actionId) {
        var reg = _registry[scope];
        if (!reg) return;
        var action = null;
        for (var i = 0; i < reg.actions.length; i++) {
            if (reg.actions[i].id === actionId) { action = reg.actions[i]; break; }
        }
        if (!action || !action.onClick) return;
        var n = _set(scope).size;

        function run() {
            var fn = window[action.onClick];
            if (typeof fn === "function") fn(scope, actionId);
        }

        if (action.confirm) {
            var title = _interp(action.confirm.title || "", n);
            var message = _interp(action.confirm.message || "", n);
            if (window.ct_modal && typeof window.ct_modal.confirm === "function") {
                window.ct_modal.confirm({
                    title: title, message: message, danger: !!action.danger
                }).then(function(ok) { if (ok) run(); });
                return;
            }
            if (!window.confirm((title ? title + "\n\n" : "") + message)) return;
        }
        run();
    };

    window._ctBulkbarClear = function(scope) {
        var reg = _registry[scope];
        clear(scope);
        if (reg && reg.onClear && typeof window[reg.onClear] === "function") {
            window[reg.onClear](scope);
        }
    };

    window.ct_bulkbar = {
        attach: attach,
        update: update,
        getSelection: getSelection,
        count: count,
        isSelected: isSelected,
        toggle: toggle,
        select: select,
        deselect: deselect,
        setSelection: setSelection,
        clear: clear
    };
})();
