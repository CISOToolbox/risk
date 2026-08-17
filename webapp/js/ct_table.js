// ─────────────────────────────────────────────────────────────
// REPLICATED from the private shared repository — do not edit here.
// GENERATED from shared/ts/ (or shared/types/) by shared/ts-build.sh.
// Edit the shared source instead: any change made in this repository is
// overwritten by the next sync, and pull requests touching this file
// cannot be merged. See CONTRIBUTING.md § Replicated files.
// ─────────────────────────────────────────────────────────────
/**
 * ct_table — Declarative HTML table with sort, row click, and optional
 * bulk-selection checkbox column tied to ct_bulkbar.
 *
 * API:
 *   ct_table.render(opts) → HTML string
 *
 * Opts:
 *   columns    — [{ key, label, sortable?, render?(row,i)→HTML,
 *                   width?, className?, headerClassName? }]
 *                Key is also the sort field unless `sortKey` is set.
 *   rows       — array of row objects
 *   rowKey     — column key used as stable id (default "id"). When the
 *                bulk option is set, this key identifies a row in the
 *                ct_bulkbar scope.
 *   onRowClick — global function name (CSP-safe) invoked with the row
 *                object as single arg (via data-args). Omit for no-op.
 *   emptyHtml  — HTML shown when rows is empty (default "Aucun élément")
 *   bulk       — { scope } — enables the first checkbox column.
 *                ct_bulkbar selection is synced via data-bulk-scope /
 *                data-bulk-key attributes + data-bulk-all on the header.
 *   actions    — [{ icon, label, onClick, danger?, show?(row)→bool }]
 *                appended as a trailing column; each button is a
 *                data-click with the row object passed as its arg.
 *   rowClass   — function(row) → extra CSS class for the <tr>
 *   initialSort — { key, direction } — highlight the header state
 *                 (sorting itself is the caller's responsibility —
 *                 ct_table only fires a click event with scope/key)
 *   sortHandler — global function name invoked as fn(key) when a
 *                 sortable header is clicked
 *
 * Depends on esc(), _da() from cisotoolbox.js.
 */
(function() {
    "use strict";

    function render(opts) {
        opts = opts || {};
        var cols = Array.isArray(opts.columns) ? opts.columns : [];
        var rows = Array.isArray(opts.rows) ? opts.rows : [];
        var rowKey = opts.rowKey || "id";
        var bulkScope = opts.bulk && opts.bulk.scope;
        var actions = Array.isArray(opts.actions) ? opts.actions : [];
        var sortInit = opts.initialSort || {};

        var h = '<table class="ct-table">';

        // ── Header ─────────────────────────────────────────────────
        h += '<thead><tr>';
        if (bulkScope) {
            h += '<th class="ct-bulk-col">'
              +  '<input type="checkbox" data-bulk-scope="' + esc(bulkScope) + '" data-bulk-all'
              +  ' data-click="_ctTableBulkToggleAll" data-args=\'' + _da(bulkScope) + '\'>'
              +  '</th>';
        }
        cols.forEach(function(col) {
            var cls = "";
            if (col.sortable) cls += " sortable";
            if (sortInit.key === col.key) cls += " sort-active";
            if (col.headerClassName) cls += " " + col.headerClassName;
            var attrs = col.width ? ' style="width:' + esc(col.width) + '"' : "";
            if (col.sortable && opts.sortHandler) {
                attrs += ' data-click="' + esc(opts.sortHandler) + '"'
                      +  ' data-args=\'' + _da(col.key) + '\'';
            }
            h += '<th class="' + esc(cls.trim()) + '"' + attrs + '>'
              +  esc(col.label || col.key);
            if (col.sortable) {
                var ind = "";
                if (sortInit.key === col.key) ind = sortInit.direction === "desc" ? "▼" : "▲";
                else ind = "↕";
                h += ' <span class="sort-indicator">' + ind + '</span>';
            }
            h += '</th>';
        });
        if (actions.length) h += '<th class="ct-actions-col"></th>';
        h += '</tr></thead>';

        // ── Body ───────────────────────────────────────────────────
        h += '<tbody>';
        if (!rows.length) {
            var emptySpan = cols.length + (bulkScope ? 1 : 0) + (actions.length ? 1 : 0);
            h += '<tr><td colspan="' + emptySpan + '" class="ct-table-empty">'
              +  (opts.emptyHtml || '<div class="ct-empty-state">Aucun élément</div>')
              +  '</td></tr>';
        } else {
            rows.forEach(function(row, i) {
                var key = row[rowKey] != null ? String(row[rowKey]) : String(i);
                var cls = opts.rowClass ? (opts.rowClass(row) || "") : "";
                var clickAttr = "";
                if (opts.onRowClick) {
                    clickAttr = ' data-click="' + esc(opts.onRowClick) + '"'
                              + ' data-args=\'' + _da(row) + '\' style="cursor:pointer"';
                }
                h += '<tr class="' + esc(cls) + '"' + clickAttr + '>';
                if (bulkScope) {
                    // data-click="_ctNoop" data-stop on the TD prevents the
                    // row click from firing when clicking the checkbox.
                    h += '<td class="ct-bulk-col" data-click="_ctNoop" data-stop>'
                      +  '<input type="checkbox"'
                      +  ' data-bulk-scope="' + esc(bulkScope) + '"'
                      +  ' data-bulk-key="' + esc(key) + '"'
                      +  ' data-click="_ctTableBulkToggle"'
                      +  ' data-args=\'' + _da(bulkScope, key) + '\' data-stop'
                      +  '></td>';
                }
                cols.forEach(function(col) {
                    var cellCls = col.className ? ' class="' + esc(col.className) + '"' : '';
                    var val = col.render ? col.render(row, i) : (row[col.key] != null ? esc(row[col.key]) : "");
                    h += '<td' + cellCls + '>' + val + '</td>';
                });
                if (actions.length) {
                    h += '<td class="ct-actions-col" data-click="_ctNoop" data-stop>';
                    actions.forEach(function(a) {
                        if (a.show && !a.show(row)) return;
                        var btnCls = "ct-action-btn";
                        if (a.danger) btnCls += " ct-action-btn--danger";
                        h += '<button type="button" class="' + esc(btnCls) + '"'
                          +  ' data-click="' + esc(a.onClick) + '"'
                          +  ' data-args=\'' + _da(row) + '\' data-stop'
                          +  (a.label ? ' title="' + esc(a.label) + '"' : '')
                          +  '>'
                          +  (a.icon && typeof _icon === "function" ? _icon(a.icon, 14) : esc(a.label || ""))
                          +  '</button>';
                    });
                    h += '</td>';
                }
                h += '</tr>';
            });
        }
        h += '</tbody></table>';

        return h;
    }

    // ──────────────────────────────────────────────────────────────
    // Bulk checkbox dispatchers (CSP-safe)
    // ──────────────────────────────────────────────────────────────

    window._ctNoop = window._ctNoop || function() {};

    window._ctTableBulkToggle = function(scope, key) {
        if (!window.ct_bulkbar) return;
        window.ct_bulkbar.toggle(scope, key);
    };

    window._ctTableBulkToggleAll = function(scope) {
        if (!window.ct_bulkbar) return;
        // Collect every row key currently rendered under this scope.
        var boxes = document.querySelectorAll(
            'input[type="checkbox"][data-bulk-scope="' + scope + '"][data-bulk-key]'
        );
        var headerBox = document.querySelector(
            'input[type="checkbox"][data-bulk-scope="' + scope + '"][data-bulk-all]'
        );
        var checked = headerBox ? headerBox.checked : true;
        var keys = [];
        for (var i = 0; i < boxes.length; i++) {
            keys.push(boxes[i].getAttribute("data-bulk-key"));
        }
        if (checked) {
            window.ct_bulkbar.setSelection(scope, keys);
        } else {
            window.ct_bulkbar.clear(scope);
        }
    };

    window.ct_table = { render: render };
})();
