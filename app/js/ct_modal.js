// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/ct_modal.js).
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
(function () {
    "use strict";
    var overlay = null; // single overlay DOM node, created lazily
    var currentResolve = null; // resolver for the active promise
    var currentOpts = null; // options for the active modal
    var prevFocus = null; // element to restore focus to on close
    var keyHandler = null; // attached keydown listener
    function _ensureOverlay() {
        if (overlay && document.body.contains(overlay))
            return overlay;
        overlay = document.createElement("div");
        overlay.className = "ct-modal-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.hidden = true;
        overlay.style.display = "none";
        // Backdrop click → dispatched via data-click, only fires when the
        // click target IS the overlay (not a child). data-click-self is
        // a custom attribute the shared dispatcher honours.
        overlay.setAttribute("data-click", "_ctModalBackdrop");
        overlay.setAttribute("data-click-self", "_ctModalBackdrop");
        document.body.appendChild(overlay);
        return overlay;
    }
    function _focusables(root) {
        var sel = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return Array.prototype.slice.call(root.querySelectorAll(sel));
    }
    function _onKey(e) {
        if (!overlay || overlay.style.display === "none")
            return;
        if (e.key === "Escape") {
            e.preventDefault();
            _finish(null);
            return;
        }
        if (e.key === "Tab") {
            var list = _focusables(overlay);
            if (!list.length) {
                e.preventDefault();
                return;
            }
            var first = list[0];
            var last = list[list.length - 1];
            var active = document.activeElement;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    function _finish(value) {
        if (!overlay || overlay.style.display === "none")
            return;
        overlay.hidden = true;
        overlay.style.display = "none";
        overlay.innerHTML = "";
        if (keyHandler) {
            document.removeEventListener("keydown", keyHandler, true);
            keyHandler = null;
        }
        var resolve = currentResolve;
        currentResolve = null;
        currentOpts = null;
        try {
            if (prevFocus && prevFocus.focus)
                prevFocus.focus();
        }
        catch (e) { }
        prevFocus = null;
        if (resolve)
            resolve(value);
    }
    // Backdrop dispatch — fires only when the click target is the overlay
    // itself (the inner box has data-click="_ctNoop" data-stop to swallow).
    window._ctModalBackdrop = function () {
        if (!currentOpts || currentOpts.closeOnBackdrop === false)
            return;
        _finish(null);
    };
    // Button dispatch — see header docstring for result resolution rules.
    window._ctModalBtn = function (btnId) {
        if (!currentOpts)
            return;
        var btn = (currentOpts.buttons || []).find(function (b) { return b.id === btnId; });
        if (!btn) {
            _finish(null);
            return;
        }
        var val = null;
        try {
            if (typeof btn.result === "function")
                val = btn.result();
            else if (btn.result !== undefined)
                val = btn.result;
            else
                val = null;
        }
        catch (e) {
            val = null;
        }
        if (val === false)
            return; // validation hook: keep modal open
        _finish(val);
    };
    // No-op dispatch used by the inner box to swallow backdrop clicks.
    window._ctNoop = function () { };
    function open(opts) {
        opts = opts || {};
        // If another modal is currently open, close it silently (resolves
        // its promise with null). Callers relying on survive-reopen must
        // wrap their own Promise with a `willReopen` flag.
        if (overlay && overlay.style.display !== "none" && currentResolve)
            _finish(null);
        _ensureOverlay();
        currentOpts = opts;
        prevFocus = document.activeElement;
        var sizeCls = opts.size === "sm" ? " ct-modal-box--sm"
            : opts.size === "lg" ? " ct-modal-box--lg"
                : "";
        var bodyHtml = typeof opts.body === "function" ? opts.body() : (opts.body || "");
        var titleHtml = opts.title
            ? '<div class="ct-modal-header">' + esc(opts.title) + '</div>'
            : "";
        var btns = Array.isArray(opts.buttons) ? opts.buttons : [];
        var footer = "";
        if (btns.length) {
            footer = '<div class="ct-modal-footer">';
            btns.forEach(function (b) {
                var cls = "ct-modal-btn";
                if (b.primary)
                    cls += " ct-modal-btn--primary";
                if (b.danger)
                    cls += " ct-modal-btn--danger";
                footer += '<button type="button" class="' + esc(cls) + '"'
                    + ' data-click="_ctModalBtn"'
                    + ' data-args=\'' + _da(b.id) + '\'>'
                    + esc(b.label || b.id)
                    + '</button>';
            });
            footer += '</div>';
        }
        overlay.innerHTML =
            '<div class="ct-modal-box' + sizeCls + '" data-click="_ctNoop" data-stop>'
                + titleHtml
                + '<div class="ct-modal-body">' + bodyHtml + '</div>'
                + footer
                + '</div>';
        overlay.hidden = false;
        overlay.removeAttribute("hidden");
        overlay.style.display = "flex";
        keyHandler = _onKey;
        document.addEventListener("keydown", keyHandler, true);
        // onOpen + auto-focus on next tick so the DOM is fully rendered.
        setTimeout(function () {
            if (typeof opts.onOpen === "function") {
                try {
                    opts.onOpen(overlay);
                }
                catch (e) { }
            }
            if (overlay && !overlay.contains(document.activeElement)) {
                var list = _focusables(overlay);
                if (list.length)
                    list[0].focus();
            }
        }, 0);
        return new Promise(function (resolve) {
            currentResolve = resolve;
        });
    }
    // i18n lookup with literal-key fallback detection. t() from the
    // shared i18n.js returns the key verbatim when no translation is
    // registered, so a plain `t(k) || fallback` always picks the key —
    // we must explicitly check `v !== key` to fall through.
    function _t(key, fallback) {
        try {
            if (typeof t === "function") {
                var v = t(key);
                if (v && v !== key)
                    return v;
            }
        }
        catch (e) { }
        return fallback;
    }
    function confirm(opts) {
        opts = opts || {};
        var cancelLabel = opts.cancelLabel || _t("btn_cancel", "Annuler");
        var okLabel = opts.confirmLabel
            || _t(opts.danger ? "btn_confirm" : "btn_ok", opts.danger ? "Confirmer" : "OK");
        return open({
            title: opts.title || "",
            body: '<div>' + esc(opts.message || "") + '</div>',
            size: "sm",
            closeOnBackdrop: opts.closeOnBackdrop !== false,
            buttons: [
                { id: "cancel", label: cancelLabel },
                { id: "ok", label: okLabel, primary: !opts.danger, danger: !!opts.danger, result: true }
            ]
        }).then(function (v) { return v === true; });
    }
    function alertBox(opts) {
        opts = opts || {};
        var okLabel = opts.okLabel || _t("btn_ok", "OK");
        return open({
            title: opts.title || "",
            body: '<div>' + esc(opts.message || "") + '</div>',
            size: "sm",
            buttons: [
                { id: "ok", label: okLabel, primary: true, result: true }
            ]
        }).then(function () { });
    }
    function close() { _finish(null); }
    window.ct_modal = {
        open: open,
        confirm: confirm,
        alert: alertBox,
        close: close
    };
})();
