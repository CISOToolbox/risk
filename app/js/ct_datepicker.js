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
var ct_datepicker = (function () {
    var MIN_YEAR = 1000, MAX_YEAR = 9999;
    var YEARS_BACK = 100, YEARS_AHEAD = 30;
    function _lang() {
        var l = typeof _locale === "string" ? _locale : (document.documentElement.lang || "en");
        return l.slice(0, 2) === "fr" ? "fr" : "en";
    }
    function _t(key, fallback) {
        if (typeof t !== "function")
            return fallback;
        var s = t(key);
        return s && s !== key ? s : fallback;
    }
    function _pad(n, w) {
        var s = String(n);
        while (s.length < (w || 2))
            s = "0" + s;
        return s;
    }
    function _daysIn(y, m) {
        return new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-12
    }
    function _iso(y, m, d) {
        return _pad(y, 4) + "-" + _pad(m) + "-" + _pad(d);
    }
    function _validYmd(y, m, d) {
        return y >= MIN_YEAR && y <= MAX_YEAR && m >= 1 && m <= 12 && d >= 1 && d <= _daysIn(y, m);
    }
    // Today in the browser's time zone (toISOString() would give the UTC day).
    function _todayIso() {
        var n = new Date();
        return _iso(n.getFullYear(), n.getMonth() + 1, n.getDate());
    }
    function _nowTime() {
        var n = new Date();
        return _pad(n.getHours()) + ":" + _pad(n.getMinutes());
    }
    // Two-digit years: the nearest one in [now - 70, now + 30).
    function _year(s) {
        var y = parseInt(s, 10);
        if (s.length > 2)
            return y;
        var now = new Date().getFullYear();
        var c = Math.floor(now / 100) * 100 + y;
        if (c >= now + YEARS_AHEAD)
            c -= 100;
        return c;
    }
    function _parseDate(s, lang) {
        var m;
        var y, mo, d;
        if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) {
            y = +m[1];
            mo = +m[2];
            d = +m[3];
        }
        else if ((m = s.match(/^(\d{1,2})[/.\- ](\d{1,2})(?:[/.\- ](\d{2}|\d{4}))?$/))) {
            d = +m[1];
            mo = +m[2];
            y = m[3] ? _year(m[3]) : new Date().getFullYear();
        }
        else if ((m = s.match(/^(\d{8})$/))) {
            if (lang === "fr") {
                d = +s.slice(0, 2);
                mo = +s.slice(2, 4);
                y = +s.slice(4);
            }
            else {
                y = +s.slice(0, 4);
                mo = +s.slice(4, 6);
                d = +s.slice(6);
            }
        }
        else if (lang === "fr" && (m = s.match(/^(\d{2})(\d{2})(\d{2})$/))) {
            // DDMMYY: French only, an English entry is year first.
            d = +m[1];
            mo = +m[2];
            y = _year(m[3]);
        }
        else {
            return null;
        }
        return _validYmd(y, mo, d) ? _iso(y, mo, d) : null;
    }
    // 9, 9h, 9:05, 9h05, 0905, 09:05:30.
    function _parseTime(s) {
        var m = s.match(/^(\d{1,2})(?:[:h.]?(\d{2}))?(?:[:.](\d{2}))?h?$/i);
        if (!m)
            return null;
        var h = +m[1], mi = m[2] ? +m[2] : 0, sec = m[3] ? +m[3] : 0;
        if (h > 23 || mi > 59 || sec > 59)
            return null;
        return _pad(h) + ":" + _pad(mi) + (m[3] ? ":" + _pad(sec) : "");
    }
    function parse(text, kind, lang) {
        var s = String(text == null ? "" : text).trim().replace(/\s+/g, " ");
        if (!s)
            return "";
        lang = lang || _lang();
        if (kind === "date")
            return _parseDate(s, lang);
        // A date alone is midnight; otherwise the time is the last part.
        var d = _parseDate(s, lang);
        if (d)
            return d + "T00:00";
        var m = s.match(/^(.+?)[ T,]+(\S+)$/i);
        if (!m || !(d = _parseDate(m[1], lang)))
            return null;
        var tm = _parseTime(m[2]);
        return tm ? d + "T" + tm : null;
    }
    function format(iso, kind, lang) {
        var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
        if (!m)
            return "";
        lang = lang || _lang();
        var d = lang === "fr" ? m[3] + "/" + m[2] + "/" + m[1] : m[1] + "-" + m[2] + "-" + m[3];
        if (kind === "datetime")
            d += " " + (m[4] ? m[4] + ":" + m[5] : "00:00") + (m[6] && m[6] !== "00" ? ":" + m[6] : "");
        return d;
    }
    function _placeholder(kind) {
        return kind === "datetime" ? _t("ct.date.placeholder_datetime", "YYYY-MM-DD HH:MM")
            : _t("ct.date.placeholder", "YYYY-MM-DD");
    }
    var _fields = [];
    var _errSeq = 0;
    // The native value accessor, read once the DOM exists (_init).
    var _valueDesc = {};
    function _nativeValue(f) { return _valueDesc.get.call(f.native); }
    function _fieldOf(el) {
        for (var i = 0; i < _fields.length; i++) {
            if (_fields[i].native === el || _fields[i].text === el)
                return _fields[i];
        }
        return null;
    }
    function _norm(v, kind) {
        // datetime-local carries seconds only when its step asks for them;
        // ISO strings compare in order with or without them.
        return kind === "datetime" ? v.slice(0, 19) : v.slice(0, 10);
    }
    function _withSeconds(f) {
        var st = parseFloat(f.native.step);
        return f.kind === "datetime" && st > 0 && st < 60;
    }
    function _bounds(f) {
        return { min: _norm(f.native.min || "", f.kind), max: _norm(f.native.max || "", f.kind) };
    }
    function _inBounds(f, v) {
        var b = _bounds(f);
        return (!b.min || v >= b.min) && (!b.max || v <= b.max);
    }
    function _syncText(f) {
        f.text.value = f.shown = format(_nativeValue(f), f.kind);
        _clearError(f);
    }
    // An invalid entry: red border plus a message under the field, read out
    // by screen readers (a title alone never shows on a phone).
    function _showError(f, msg) {
        f.text.setAttribute("aria-invalid", "true");
        f.native.setCustomValidity(msg);
        if (!f.err) {
            f.err = document.createElement("span");
            f.err.className = "ct-error ct-date-error";
            f.err.setAttribute("role", "alert");
            f.err.id = "ct-date-err-" + (++_errSeq);
            f.native.parentNode.insertBefore(f.err, f.native.nextSibling);
        }
        f.err.textContent = msg;
        var d = (f.text.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
        if (d.indexOf(f.err.id) < 0)
            f.text.setAttribute("aria-describedby", d.concat(f.err.id).join(" "));
    }
    function _clearError(f) {
        f.native.setCustomValidity("");
        if (f.err) {
            var id = f.err.id;
            var d = (f.text.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== id; });
            if (d.length)
                f.text.setAttribute("aria-describedby", d.join(" "));
            else
                f.text.removeAttribute("aria-describedby");
            f.err.remove();
            f.err = null;
        }
        _syncInvalid(f);
    }
    // An error the page marks on the native input shows on the field.
    function _syncInvalid(f) {
        f.text.classList.toggle("ct-field-error", f.native.classList.contains("ct-field-error"));
        if (f.err || f.native.getAttribute("aria-invalid") === "true")
            f.text.setAttribute("aria-invalid", "true");
        else
            f.text.removeAttribute("aria-invalid");
    }
    function _syncAttrs(f) {
        f.text.disabled = f.native.disabled;
        f.text.readOnly = f.native.readOnly;
        f.text.required = f.native.required;
        f.text.placeholder = _placeholder(f.kind);
        // A page may rewrite className. classList.add() rewrites the attribute
        // even when the class is there, which would wake the observer again.
        if (!f.native.classList.contains("ct-date-native"))
            f.native.classList.add("ct-date-native");
        _syncInvalid(f);
    }
    // Write a value to the native input and fire what a user edit fires.
    function _commit(f, v) {
        if (v === _norm(_nativeValue(f), f.kind)) {
            _syncText(f);
            return;
        }
        _valueDesc.set.call(f.native, v);
        _syncText(f);
        f.native.dispatchEvent(new Event("input", { bubbles: true }));
        f.native.dispatchEvent(new Event("change", { bubbles: true }));
    }
    // Typed text: commit when valid, flag it otherwise (nothing is saved).
    function _commitText(f) {
        if (f.text.value === f.shown) {
            _clearError(f);
            return true;
        } // untouched
        var v = parse(f.text.value, f.kind);
        if (v && v.length > 16 && !_withSeconds(f))
            v = v.slice(0, 16); // the field works at the minute
        if (v === null) {
            _showError(f, f.kind === "datetime" ? _t("ct.date.invalid_datetime", "Invalid date")
                : _t("ct.date.invalid", "Invalid date"));
            return false;
        }
        if (v && !_inBounds(f, v)) {
            var b = _bounds(f);
            var range = b.min && b.max ? format(b.min, f.kind) + " – " + format(b.max, f.kind)
                : b.min ? "≥ " + format(b.min, f.kind) : "≤ " + format(b.max, f.kind);
            _showError(f, _t("ct.date.out_of_range", "Date outside the allowed range") + " (" + range + ")");
            return false;
        }
        _commit(f, v);
        return true;
    }
    function _enhanceOne(native) {
        var mark = native.getAttribute("data-ct-date");
        if (mark === "native" || (mark && _fieldOf(native)))
            return; // opted out, or done
        if (mark) {
            // Markup copied from an equipped field: drop the dead copy of the
            // text field and equip this input afresh.
            var stale = native.previousElementSibling;
            if (stale && stale.classList.contains("ct-date-input"))
                stale.remove();
            var staleErr = native.nextElementSibling;
            if (staleErr && staleErr.classList.contains("ct-date-error"))
                staleErr.remove();
        }
        var kind = native.type === "datetime-local" ? "datetime" : "date";
        native.setAttribute("data-ct-date", "on");
        var text = document.createElement("input");
        text.type = "text";
        text.autocomplete = "off";
        text.className = (native.className ? native.className + " " : "") + "ct-date-input";
        if (native.hasAttribute("data-size"))
            text.setAttribute("data-size", native.getAttribute("data-size"));
        ["aria-label", "aria-describedby", "title"].forEach(function (a) {
            if (native.hasAttribute(a))
                text.setAttribute(a, native.getAttribute(a));
        });
        var label = native.id ? document.querySelector('label[for="' + CSS.escape(native.id) + '"]') : null;
        if (label && !text.hasAttribute("aria-label"))
            text.setAttribute("aria-label", (label.textContent || "").trim());
        // Combobox: the calendar opens on a click, ArrowDown or Alt+ArrowDown.
        text.setAttribute("role", "combobox");
        text.setAttribute("aria-autocomplete", "none");
        text.setAttribute("aria-haspopup", "dialog");
        text.setAttribute("aria-expanded", "false");
        native.classList.add("ct-date-native");
        native.tabIndex = -1;
        native.setAttribute("aria-hidden", "true");
        native.parentNode.insertBefore(text, native);
        var f = { native: native, text: text, kind: kind, err: null, shown: "" };
        _fields.push(f);
        // A value set by code refreshes the text.
        Object.defineProperty(native, "value", {
            configurable: true,
            get: function () { return _valueDesc.get.call(this); },
            set: function (v) { _valueDesc.set.call(this, v); _syncText(f); }
        });
        // So does a focus() aimed at the hidden input (first field in error).
        native.focus = function (opts) { text.focus(opts); };
        _syncAttrs(f);
        _syncText(f);
        // The text field's own events stay local: the native input carries
        // the value to the page's handlers.
        text.addEventListener("input", function (e) {
            e.stopPropagation();
            _clearError(f);
            if (_open && _open.f === f) {
                var v = parse(text.value, kind);
                if (v) {
                    _open.view = _ym(v);
                    _open.focus = v.slice(0, 10);
                    _render();
                }
            }
        });
        text.addEventListener("change", function (e) { e.stopPropagation(); });
        text.addEventListener("compositionend", function (e) { e.stopPropagation(); });
        text.addEventListener("blur", function (e) {
            var to = e.relatedTarget;
            if (_open && _open.f === f && to && _open.pop.contains(to))
                return;
            _commitText(f);
            if (_open && _open.f === f)
                _close(false);
        });
        text.addEventListener("click", function () { if (!_open || _open.f !== f)
            _openFor(f); });
        text.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (_commitText(f))
                    _close(false);
                e.preventDefault();
            }
            else if (e.key === "ArrowDown" && (e.altKey || (_open && _open.f === f))) {
                if (!_open || _open.f !== f)
                    _openFor(f);
                _focusDay();
                e.preventDefault();
            }
            else if (e.key === "ArrowDown" && !_open) {
                _openFor(f);
                e.preventDefault();
            }
        });
    }
    function enhance(root) {
        if (!_valueDesc.get)
            return; // before _init
        var scope = root || document;
        if (!scope.querySelectorAll)
            return;
        if (scope.matches && scope.matches('input[type="date"],input[type="datetime-local"]')) {
            _enhanceOne(scope);
            return;
        }
        scope.querySelectorAll('input[type="date"]:not([data-ct-date="native"]),input[type="datetime-local"]:not([data-ct-date="native"])')
            .forEach(_enhanceOne);
    }
    // Fields under root holding a refused entry: the first one gets the focus.
    function invalid(root) {
        for (var i = 0; i < _fields.length; i++) {
            var f = _fields[i];
            if (!f.err || !f.text.isConnected || !f.text.getClientRects().length)
                continue;
            if (root && root !== document && !root.contains(f.text))
                continue;
            f.text.focus();
            return true;
        }
        return false;
    }
    // Forget fields that left the page.
    function _prune() {
        _fields = _fields.filter(function (f) {
            if (f.native.isConnected)
                return true;
            if (f.text.isConnected)
                f.text.remove();
            if (f.err && f.err.isConnected)
                f.err.remove();
            if (_open && _open.f === f)
                _close(false);
            return false;
        });
    }
    var _open = null;
    var _rendering = false;
    function _ym(v) {
        return { y: +v.slice(0, 4), m: +v.slice(5, 7) };
    }
    function _monthNames() {
        var out = [];
        var fmt = new Intl.DateTimeFormat(_lang(), { month: "long", timeZone: "UTC" });
        for (var i = 0; i < 12; i++) {
            var s = fmt.format(new Date(Date.UTC(2020, i, 1)));
            out.push(s.charAt(0).toUpperCase() + s.slice(1));
        }
        return out;
    }
    function _weekdayNames() {
        var out = [];
        var fmt = new Intl.DateTimeFormat(_lang(), { weekday: "short", timeZone: "UTC" });
        for (var i = 0; i < 7; i++)
            out.push(fmt.format(new Date(Date.UTC(2024, 0, 1 + i)))); // 2024-01-01 is a Monday
        return out;
    }
    var _longFmt = null;
    function _longDate(iso) {
        if (!_longFmt || _longFmt.lang !== _lang()) {
            _longFmt = { lang: _lang(), fmt: new Intl.DateTimeFormat(_lang(), { dateStyle: "full", timeZone: "UTC" }) };
        }
        return _longFmt.fmt.format(new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))));
    }
    function _el(tag, cls, txt) {
        var e = document.createElement(tag);
        if (cls)
            e.className = cls;
        if (txt != null)
            e.textContent = txt;
        return e;
    }
    function _shiftDay(iso, n) {
        var d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n));
        return _iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    function _shiftMonth(iso, n) {
        var y = +iso.slice(0, 4), m = +iso.slice(5, 7) + n, d = +iso.slice(8, 10);
        y += Math.floor((m - 1) / 12);
        m = ((m - 1) % 12 + 12) % 12 + 1;
        return _iso(y, m, Math.min(d, _daysIn(y, m)));
    }
    function _dayAllowed(f, day) {
        var b = _bounds(f);
        return (!b.min || day >= b.min.slice(0, 10)) && (!b.max || day <= b.max.slice(0, 10));
    }
    function _timeOf(f) {
        var v = _nativeValue(f);
        return v.length >= 16 ? v.slice(11, _withSeconds(f) ? 19 : 16) : "";
    }
    function _openFor(f) {
        if (f.text.disabled || f.text.readOnly)
            return;
        _close(false);
        var cur = parse(f.text.value, f.kind) || _norm(_nativeValue(f), f.kind);
        var b = _bounds(f);
        var base = cur || _todayIso();
        if (b.min && base < b.min)
            base = b.min;
        if (b.max && base > b.max)
            base = b.max;
        var pop = document.createElement("div");
        pop.className = "ct-date-pop";
        pop.id = "ct-date-pop";
        pop.setAttribute("role", "dialog");
        pop.setAttribute("aria-label", _t("ct.date.choose", "Choose a date"));
        // Inside a modal overlay the calendar belongs to it: the modal's focus
        // trap then treats it as its own content.
        var host = f.text.closest(".ct-modal-overlay, [role=dialog], dialog") || document.body;
        host.appendChild(pop);
        _open = { f: f, pop: pop, view: _ym(base), focus: base.slice(0, 10) };
        f.text.setAttribute("aria-expanded", "true");
        f.text.setAttribute("aria-controls", pop.id);
        _wirePop(pop);
        _render();
        _position();
        _track(true);
    }
    function _close(refocus) {
        if (!_open)
            return;
        var f = _open.f;
        _open.pop.remove();
        _open = null;
        _track(false);
        f.text.setAttribute("aria-expanded", "false");
        f.text.removeAttribute("aria-controls");
        if (refocus && f.text.isConnected)
            f.text.focus();
    }
    function _render() {
        if (!_open)
            return;
        var o = _open, f = o.f, pop = o.pop;
        var keepFocus = pop.contains(document.activeElement) ? document.activeElement.getAttribute("data-ct-role") : null;
        // Emptying the calendar drops the focus of the control inside it:
        // that focusout is not the user leaving.
        _rendering = true;
        pop.textContent = "";
        var b = _bounds(f);
        var selected = _norm(_nativeValue(f), f.kind).slice(0, 10);
        var pending = parse(f.text.value, f.kind);
        if (pending)
            selected = pending.slice(0, 10);
        // Header: previous, month list, year list, next.
        var head = _el("div", "ct-date-pop__head");
        var prev = _el("button", "ct-date-pop__nav", "‹");
        prev.type = "button";
        prev.setAttribute("data-ct-role", "prev");
        prev.setAttribute("aria-label", _t("ct.date.prev_month", "Previous month"));
        var next = _el("button", "ct-date-pop__nav", "›");
        next.type = "button";
        next.setAttribute("data-ct-role", "next");
        next.setAttribute("aria-label", _t("ct.date.next_month", "Next month"));
        var msel = _el("select", "ct-date-pop__month");
        msel.setAttribute("data-ct-role", "month");
        msel.setAttribute("aria-label", _t("ct.date.month", "Month"));
        _monthNames().forEach(function (n, i) {
            var op = document.createElement("option");
            op.value = String(i + 1);
            op.textContent = n;
            if (i + 1 === o.view.m)
                op.selected = true;
            msel.appendChild(op);
        });
        var ysel = _el("select", "ct-date-pop__year");
        ysel.setAttribute("data-ct-role", "year");
        ysel.setAttribute("aria-label", _t("ct.date.year", "Year"));
        var yNow = new Date().getFullYear();
        var y0 = b.min ? +b.min.slice(0, 4) : Math.min(o.view.y, yNow) - YEARS_BACK;
        var y1 = b.max ? +b.max.slice(0, 4) : Math.max(o.view.y, yNow) + YEARS_AHEAD;
        y0 = Math.max(MIN_YEAR, Math.min(y0, o.view.y));
        y1 = Math.min(MAX_YEAR, Math.max(y1, o.view.y));
        for (var y = y1; y >= y0; y--) {
            var yo = document.createElement("option");
            yo.value = String(y);
            yo.textContent = String(y);
            if (y === o.view.y)
                yo.selected = true;
            ysel.appendChild(yo);
        }
        if (b.min && o.view.y === +b.min.slice(0, 4) && o.view.m <= +b.min.slice(5, 7))
            prev.disabled = true;
        if (b.max && o.view.y === +b.max.slice(0, 4) && o.view.m >= +b.max.slice(5, 7))
            next.disabled = true;
        head.appendChild(prev);
        head.appendChild(msel);
        head.appendChild(ysel);
        head.appendChild(next);
        pop.appendChild(head);
        // Day grid, Monday first.
        var grid = _el("div", "ct-date-pop__grid");
        _weekdayNames().forEach(function (n) {
            var h = _el("span", "ct-date-pop__wd", n);
            h.setAttribute("aria-hidden", "true");
            grid.appendChild(h);
        });
        var first = new Date(Date.UTC(o.view.y, o.view.m - 1, 1)).getUTCDay(); // 0 = Sunday
        var lead = (first + 6) % 7;
        for (var i = 0; i < lead; i++)
            grid.appendChild(_el("span", "ct-date-pop__blank"));
        var today = _todayIso();
        var n = _daysIn(o.view.y, o.view.m);
        if (o.focus.slice(0, 7) !== _iso(o.view.y, o.view.m, 1).slice(0, 7)) {
            o.focus = _iso(o.view.y, o.view.m, Math.min(+o.focus.slice(8, 10) || 1, n));
        }
        for (var d = 1; d <= n; d++) {
            var iso = _iso(o.view.y, o.view.m, d);
            var btn = _el("button", "ct-date-pop__day", String(d));
            btn.type = "button";
            btn.setAttribute("data-ct-day", iso);
            btn.setAttribute("aria-label", _longDate(iso));
            btn.tabIndex = iso === o.focus ? 0 : -1;
            if (iso === selected) {
                btn.classList.add("is-selected");
                btn.setAttribute("aria-pressed", "true");
            }
            if (iso === today) {
                btn.classList.add("is-today");
                btn.setAttribute("aria-current", "date");
            }
            if (!_dayAllowed(f, iso))
                btn.disabled = true;
            grid.appendChild(btn);
        }
        pop.appendChild(grid);
        // Time, for a datetime.
        if (f.kind === "datetime") {
            var trow = _el("label", "ct-date-pop__time");
            trow.appendChild(_el("span", "", _t("ct.date.time", "Time")));
            var tin = _el("input", "ct-date-pop__time-input");
            tin.type = "time";
            tin.step = _withSeconds(f) ? "1" : "60";
            tin.setAttribute("data-ct-role", "time");
            tin.value = (pending && pending.slice(11)) || _timeOf(f);
            trow.appendChild(tin);
            pop.appendChild(trow);
        }
        // Footer.
        var foot = _el("div", "ct-date-pop__foot");
        var tb = _el("button", "ct-date-pop__link", _t("ct.date.today", "Today"));
        tb.type = "button";
        tb.setAttribute("data-ct-role", "today");
        if (!_dayAllowed(f, today))
            tb.disabled = true;
        var cb = _el("button", "ct-date-pop__link", _t("ct.date.clear", "Clear"));
        cb.type = "button";
        cb.setAttribute("data-ct-role", "clear");
        if (f.native.required)
            cb.disabled = true;
        foot.appendChild(tb);
        foot.appendChild(cb);
        pop.appendChild(foot);
        if (keepFocus) {
            var again = pop.querySelector('[data-ct-role="' + keepFocus + '"]');
            if (again)
                again.focus();
        }
        _rendering = false;
    }
    function _focusDay() {
        if (!_open)
            return;
        var b = _open.pop.querySelector('[data-ct-day="' + _open.focus + '"]');
        if (b)
            b.focus();
    }
    function _pick(day) {
        if (!_open)
            return;
        var f = _open.f;
        var v = day;
        if (f.kind === "datetime") {
            var tin = _open.pop.querySelector('[data-ct-role="time"]');
            var tm = (tin && tin.value) || _timeOf(f) || (day === _todayIso() ? _nowTime() : "00:00");
            v = day + "T" + (_withSeconds(f) ? tm : tm.slice(0, 5));
        }
        if (!_inBounds(f, v)) {
            // A day allowed by min/max whose time is not: clamp to the bound.
            var bd = _bounds(f);
            v = bd.min && v < bd.min ? bd.min : bd.max;
        }
        _commit(f, v);
        _close(true);
    }
    function _wirePop(pop) {
        // Keep the field's focus on a mouse press in the calendar, except on
        // the controls that need it (lists, time).
        pop.addEventListener("mousedown", function (e) {
            var tg = e.target;
            if (!tg.closest("select, input"))
                e.preventDefault();
        });
        pop.addEventListener("click", function (e) {
            if (!_open)
                return;
            var tg = e.target.closest("button");
            if (!tg || tg.disabled)
                return;
            e.stopPropagation();
            var role = tg.getAttribute("data-ct-role");
            var day = tg.getAttribute("data-ct-day");
            if (day) {
                _pick(day);
                return;
            }
            if (role === "prev" || role === "next") {
                _open.focus = _shiftMonth(_open.focus, role === "prev" ? -1 : 1);
                _open.view = _ym(_open.focus);
                _render();
            }
            else if (role === "today") {
                _pick(_todayIso());
            }
            else if (role === "clear") {
                var f = _open.f;
                _commit(f, "");
                _close(true);
            }
        });
        pop.addEventListener("change", function (e) {
            e.stopPropagation();
            if (!_open)
                return;
            var tg = e.target;
            var role = tg.getAttribute("data-ct-role");
            if (role === "month" || role === "year") {
                var m = role === "month" ? +tg.value : _open.view.m;
                var y = role === "year" ? +tg.value : _open.view.y;
                _open.view = { y: y, m: m };
                _open.focus = _iso(y, m, Math.min(+_open.focus.slice(8, 10), _daysIn(y, m)));
                _render();
            }
            else if (role === "time") {
                // Shown in the field, saved when a day is picked or the
                // calendar closes: the time input fires change while typed.
                var f = _open.f;
                var tm = tg.value;
                var day = parse(f.text.value, f.kind) || _norm(_nativeValue(f), f.kind);
                if (tm && day)
                    f.text.value = format(day.slice(0, 10) + "T" + tm, f.kind);
            }
        });
        pop.addEventListener("input", function (e) { e.stopPropagation(); });
        pop.addEventListener("keydown", function (e) {
            if (!_open)
                return;
            var tg = e.target;
            var day = tg.getAttribute("data-ct-day");
            if (!day)
                return;
            var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
            var nd = null;
            if (step[e.key])
                nd = _shiftDay(day, step[e.key]);
            else if (e.key === "PageUp")
                nd = _shiftMonth(day, e.shiftKey ? -12 : -1);
            else if (e.key === "PageDown")
                nd = _shiftMonth(day, e.shiftKey ? 12 : 1);
            else if (e.key === "Home")
                nd = _shiftDay(day, -((new Date(day + "T00:00:00Z").getUTCDay() + 6) % 7));
            else if (e.key === "End")
                nd = _shiftDay(day, 6 - ((new Date(day + "T00:00:00Z").getUTCDay() + 6) % 7));
            if (!nd)
                return;
            e.preventDefault();
            // Stay on an allowed day.
            var b = _bounds(_open.f);
            if (b.min && nd < b.min.slice(0, 10))
                nd = b.min.slice(0, 10);
            if (b.max && nd > b.max.slice(0, 10))
                nd = b.max.slice(0, 10);
            _open.focus = nd;
            _open.view = _ym(nd);
            _render();
            _focusDay();
        });
        pop.addEventListener("focusout", function (e) {
            if (!_open || _rendering)
                return;
            var to = e.relatedTarget;
            if (to && (_open.pop.contains(to) || to === _open.f.text))
                return;
            // Focus left both the field and the calendar.
            var f = _open.f;
            _close(false);
            _commitText(f);
        });
    }
    // Under the field, or above it without room below; inside the viewport.
    function _position() {
        if (!_open)
            return;
        var r = _open.f.text.getBoundingClientRect();
        var pop = _open.pop;
        var w = pop.offsetWidth, h = pop.offsetHeight, gap = 4, margin = 8;
        // The visual viewport leaves out a phone's on-screen keyboard.
        var vv = window.visualViewport;
        var vTop = vv ? vv.offsetTop : 0, vH = vv ? vv.height : window.innerHeight;
        var left = Math.min(Math.max(margin, r.left), window.innerWidth - w - margin);
        var top = r.bottom + gap;
        if (top + h > vTop + vH - margin && r.top - gap - h >= vTop + margin)
            top = r.top - gap - h;
        pop.style.left = Math.round(Math.max(margin, left)) + "px";
        pop.style.top = Math.round(Math.max(vTop + margin, top)) + "px";
    }
    function _onScroll(e) {
        if (_open && e.target instanceof Node && _open.pop.contains(e.target))
            return;
        _position();
    }
    function _track(on) {
        var fn = on ? window.addEventListener : window.removeEventListener;
        fn.call(window, "scroll", _onScroll, true);
        fn.call(window, "resize", _position);
        if (window.visualViewport) {
            // iOS also pans the visual viewport when the keyboard opens.
            var vfn = on ? window.visualViewport.addEventListener : window.visualViewport.removeEventListener;
            vfn.call(window.visualViewport, "resize", _position);
            vfn.call(window.visualViewport, "scroll", _position);
        }
    }
    // ── Wiring ─────────────────────────────────────────────────────────
    function _init() {
        _valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        enhance(document);
        new MutationObserver(function (muts) {
            var removed = false;
            for (var i = 0; i < muts.length; i++) {
                var mu = muts[i];
                if (mu.type === "attributes") {
                    var f = mu.target.hasAttribute("data-ct-date") ? _fieldOf(mu.target) : null;
                    if (f && f.native === mu.target) {
                        if (mu.attributeName === "value")
                            _syncText(f);
                        else
                            _syncAttrs(f);
                    }
                    if (mu.target === document.documentElement && mu.attributeName === "lang") {
                        _fields.forEach(function (x) { _syncAttrs(x); _syncText(x); });
                        if (_open)
                            _render();
                    }
                    continue;
                }
                if (mu.removedNodes.length)
                    removed = true;
                mu.addedNodes.forEach(function (nd) {
                    if (nd.nodeType === 1)
                        enhance(nd);
                });
            }
            if (removed)
                _prune();
        }).observe(document.documentElement, {
            childList: true, subtree: true, attributes: true,
            attributeFilter: ["value", "min", "max", "disabled", "readonly", "required", "lang", "class", "aria-invalid"]
        });
        // A label pointing at the hidden native input focuses the field.
        document.addEventListener("click", function (e) {
            var lb = e.target.closest ? e.target.closest("label") : null;
            var ctl = lb ? lb.control : null;
            var f = ctl ? _fieldOf(ctl) : null;
            if (f && f.native === ctl) {
                e.preventDefault();
                f.text.focus();
            }
            // A click outside the field and the calendar closes it.
            if (_open && !_open.pop.contains(e.target) && e.target !== _open.f.text) {
                var of = _open.f;
                _close(false);
                if (document.activeElement !== of.text)
                    _commitText(of);
            }
        });
        // A refused entry holds back the main button of the modal or form
        // that holds both (capture on window: ahead of the data-click
        // dispatcher). Outside a modal or form, nothing is held: such pages
        // save field by field.
        window.addEventListener("click", function (e) {
            var btn = e.target.closest ? e.target.closest('.ct-modal-btn--primary, [data-variant="primary"], button[type="submit"]') : null;
            var scope = btn ? btn.closest(".ct-modal-overlay, .ct-pwd-overlay, [role=dialog], dialog, form") : null;
            if (scope && invalid(scope)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
        // Escape closes the calendar before any modal hears it (capture on
        // window runs ahead of a document capture listener).
        window.addEventListener("keydown", function (e) {
            if (!_open || e.key !== "Escape")
                return;
            e.preventDefault();
            e.stopPropagation();
            _syncText(_open.f);
            _close(true);
        }, true);
    }
    if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
        if (document.readyState === "loading")
            document.addEventListener("DOMContentLoaded", _init);
        else
            _init();
    }
    return { parse: parse, format: format, enhance: enhance, invalid: invalid };
})();
