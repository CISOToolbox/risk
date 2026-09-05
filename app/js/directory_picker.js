// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/backend/directory_picker.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * Directory Picker — shared component for user/personnel selection.
 *
 * Fetches the directory source setting and caches the personnel list.
 * Provides _dirPicker(fieldId, currentValue, onChangeHandler, onChangeArgs)
 * that renders either a text input (local mode) or a dropdown (pilot mode).
 *
 * Load AFTER cisotoolbox.js and the module's *_api.js.
 *
 * Canonical source of the TS port: demo-docker/risk/app/js/directory_picker.js
 * (identical ×5: risk, vendor, compliance, asset, access).
 */
(function () {
    "use strict";
    var _dirSource = "local"; // "local" or "pilot"
    var _dirPeople = []; // cached personnel list
    var _dirLoaded = false;
    var _dirPilotAvailable = false;
    var _dirLocalWritable = false; // module exposes a writable local personnel base
    function _dirInit() {
        fetch("api/settings/directory-source", { credentials: "same-origin" })
            .then(function (r) { return r.ok ? r.json() : { source: "local", pilot_available: false }; })
            .then(function (data) {
            _dirSource = data.source || "local";
            _dirPilotAvailable = data.pilot_available || false;
            _dirLocalWritable = data.local_writable || false;
            // Both pilot and a writable local directory have a people list to load.
            if (_dirSource === "pilot" || _dirLocalWritable)
                _dirFetchPeople();
        })
            .catch(function () { });
    }
    function _dirFetchPeople() {
        fetch("api/directory", { credentials: "same-origin" })
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (list) { _dirPeople = list || []; _dirLoaded = true; })
            .catch(function () { _dirPeople = []; _dirLoaded = true; });
    }
    var _dpCounter = 0;
    /**
     * Render a person picker for an inline cell. Thin adapter over the shared
     * ct_userpicker (the SAME search component used by the measure modals): it is
     * fed with the cached directory and saves the picked EMAIL immediately via the
     * app's data-change handler (onChange). Falls back to a text input when there
     * is no directory or ct_userpicker isn't loaded.
     *
     * @param currentValue - current email
     * @param handler - app save handler name (called as handler(...args, email))
     * @param argsJson - _da() encoded args for the handler
     */
    window._dirPicker = function (currentValue, handler, argsJson) {
        var writable = _dirSource === "pilot" || _dirLocalWritable;
        var up = window.ct_userpicker;
        if ((!_dirPeople.length && !writable) || !up || !up.render) {
            // No directory / ct_userpicker not loaded → plain text input.
            return '<input type="text" value="' + esc(currentValue || "") + '" data-change="' + handler + '" data-args=\'' + argsJson + '\' data-pass-value style="width:100%;padding:6px 10px;border:1px solid var(--ct-line);border-radius:4px;font-size:0.85em">';
        }
        var uid = "dp" + (_dpCounter++);
        var args = JSON.parse((argsJson || "[]").replace(/&#39;/g, "'"));
        // FEAT-15 option B: identity creation is centralised in Access. "+ Create"
        // stays only for a writable LOCAL directory (standalone), not the Pilot hub.
        var canCreate = _dirLocalWritable;
        var display = window._dirResolve ? window._dirResolve(currentValue) : (currentValue || "");
        return up.render({
            id: uid,
            users: _dirPeople,
            value: display,
            placeholder: "Rechercher...",
            onCreate: canCreate
                ? function (q) { return up.promptCreateUser({ query: q, apiUrl: "api/directory" }); }
                : null,
            onChange: function (email) {
                var fn = window[handler];
                if (typeof fn === "function")
                    fn.apply(null, args.concat([email]));
            }
        });
    };
    /**
     * Render a multi-person picker (for reviewers, etc.)
     * @param currentIds - current list of emails
     * @param addHandler - data-click handler for adding
     * @param removeHandler - data-click handler for removing
     * @returns HTML
     */
    window._dirMultiPicker = function (currentIds, addHandler, removeHandler) {
        var ids = currentIds || [];
        var h = '';
        if (_dirSource === "pilot" && _dirPeople.length) {
            ids.forEach(function (email) {
                var p = _dirPeople.find(function (x) { return x.email === email; });
                var label = p ? (p.prenom + " " + p.nom).trim() : email;
                if (p && p.fonction)
                    label += " (" + p.fonction + ")";
                h += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.85em">';
                h += '<span style="font-weight:600">' + esc(label) + '</span>';
                h += '<span style="cursor:pointer;color:var(--ct-critical);font-weight:700;margin-left:auto" data-click="' + removeHandler + '" data-args=\'' + _da(email) + '\'>&times;</span>';
                h += '</div>';
            });
            h += '<select style="margin-top:6px;padding:4px 8px;border:1px solid var(--ct-line);border-radius:4px;font-size:0.82em" data-change="' + addHandler + '" data-pass-value>';
            h += '<option value="">+ Ajouter</option>';
            _dirPeople.forEach(function (p) {
                if (ids.indexOf(p.email) >= 0)
                    return;
                var label = (p.prenom + " " + p.nom).trim();
                if (p.fonction)
                    label += " (" + p.fonction + ")";
                h += '<option value="' + esc(p.email) + '">' + esc(label) + '</option>';
            });
            h += '</select>';
        }
        else {
            // Local mode: comma-separated text
            h += '<input type="text" value="' + esc(ids.join(", ")) + '" placeholder="Noms separes par des virgules" data-change="' + addHandler + '" data-pass-value style="width:100%;padding:6px 10px;border:1px solid var(--ct-line);border-radius:4px;font-size:0.85em">';
        }
        return h;
    };
    /**
     * Resolve an email to a display name from the directory.
     */
    window._dirResolve = function (email) {
        if (!email)
            return "";
        var p = _dirPeople.find(function (x) { return x.email === email; });
        return p ? (p.prenom + " " + p.nom).trim() : email;
    };
    /**
     * Admin toggle HTML for the settings panel.
     */
    window._dirAdminToggle = function () {
        if (!_dirPilotAvailable)
            return '';
        var h = '<div style="margin:16px 0;padding:12px;background:var(--ct-canvas);border:1px solid var(--ct-line);border-radius:8px">';
        h += '<label style="font-weight:600;font-size:0.85em;display:block;margin-bottom:8px">Source de l\'annuaire</label>';
        h += '<select data-change="_dirSetSource" data-pass-value style="padding:6px 10px;border:1px solid var(--ct-line);border-radius:4px;font-size:0.85em">';
        h += '<option value="local"' + (_dirSource === "local" ? ' selected' : '') + '>Base locale du module</option>';
        h += '<option value="pilot"' + (_dirSource === "pilot" ? ' selected' : '') + '>Annuaire central (Pilot)</option>';
        h += '</select>';
        if (_dirSource === "pilot")
            h += '<div style="font-size:0.78em;color:var(--ct-ink-2);margin-top:4px">' + _dirPeople.length + ' personne(s) dans l\'annuaire Pilot</div>';
        h += '</div>';
        return h;
    };
    window._dirSetSource = function (val) {
        fetch("api/settings/directory-source", {
            method: "PUT", credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: val })
        }).then(function (r) { return r.json(); }).then(function (data) {
            _dirSource = data.source;
            if (_dirSource === "pilot" && !_dirLoaded)
                _dirFetchPeople();
            if (typeof showStatus === "function")
                showStatus("Source annuaire : " + (_dirSource === "pilot" ? "Pilot" : "locale"));
            if (typeof renderAll === "function")
                setTimeout(renderAll, 300);
            else if (typeof renderPanel === "function")
                setTimeout(renderPanel, 300);
        }).catch(function (e) {
            if (typeof showStatus === "function")
                showStatus(e.message, true);
        });
    };
    window._dirGetSource = function () { return _dirSource; };
    window._dirGetPeople = function () { return _dirPeople; };
    // Init on load
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", _dirInit);
    else
        _dirInit();
})();
