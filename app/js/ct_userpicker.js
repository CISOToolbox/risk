// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/ct_userpicker.js).
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
(function () {
    "use strict";
    // pickerId → { users, value, onCreate, onChange } — registered by render()
    var _instances = {};
    function _userLabel(u) {
        if (!u)
            return "";
        return ((u.prenom || "") + " " + (u.nom || "")).trim() || u.email || u.id || "";
    }
    function _i18n(key, fallback) {
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
    // ──────────────────────────────────────────────────────────────
    // Low-level render — emit HTML + register instance
    // ──────────────────────────────────────────────────────────────
    function render(opts) {
        opts = opts || {};
        var id = opts.id;
        if (!id)
            throw new Error("ct_userpicker.render: id is required");
        _instances[id] = {
            users: Array.isArray(opts.users) ? opts.users : [],
            value: opts.value || "",
            onCreate: opts.onCreate || null,
            onChange: opts.onChange || null
        };
        var ph = opts.placeholder || "";
        return ''
            + '<div class="ct-userpicker" id="' + esc(id) + '-wrap" style="position:relative">'
            + '<input type="text" id="' + esc(id) + '-search" autocomplete="off"'
            + ' value="' + esc(opts.value || "") + '"'
            + ' placeholder="' + esc(ph) + '"'
            + ' data-input="_ctUpSearch" data-args=\'' + _da(id) + '\' data-pass-value'
            + ' data-click="_ctUpFocus"  data-args=\'' + _da(id) + '\' data-stop>'
            + '<div id="' + esc(id) + '-dd" class="ct-userpicker-dd" hidden></div>'
            + '</div>';
    }
    function _renderDropdown(id, query) {
        var inst = _instances[id];
        if (!inst)
            return;
        var dd = document.getElementById(id + "-dd");
        if (!dd)
            return;
        var q = (query || "").toLowerCase().trim();
        // No slice — show every matching user. The dropdown has its own
        // max-height + scroll so very large directories stay usable.
        var matches = inst.users.filter(function (u) {
            if (!q)
                return true;
            var lbl = _userLabel(u).toLowerCase();
            return lbl.indexOf(q) >= 0 || (u.email || "").toLowerCase().indexOf(q) >= 0;
        });
        var h = "";
        matches.forEach(function (u) {
            var lbl = _userLabel(u);
            h += '<div class="ct-userpicker-item" data-click="_ctUpPick" data-args=\''
                + _da(id, lbl, u.email || "") + '\' data-stop>'
                + '<div style="font-weight:600">' + esc(lbl) + '</div>'
                + (u.email ? '<div style="font-size:0.75em;color:var(--ct-ink-2)">' + esc(u.email) + '</div>' : '')
                + '</div>';
        });
        // "+ Créer" only when onCreate is wired AND the query doesn't
        // exactly match an existing entry.
        var exact = inst.users.some(function (u) {
            return _userLabel(u).toLowerCase() === q || (u.email || "").toLowerCase() === q;
        });
        if (inst.onCreate && q && !exact) {
            var tmpl = _i18n("ct.userpicker.create", 'Créer "{q}"');
            h += '<div class="ct-userpicker-create" data-click="_ctUpCreate" data-args=\''
                + _da(id, query) + '\' data-stop>'
                + '<span style="font-size:1.1em;color:var(--ct-ink);font-weight:700">+</span> '
                + esc(tmpl.replace("{q}", query))
                + '</div>';
        }
        if (!h) {
            h = '<div class="ct-userpicker-empty">'
                + esc(_i18n("ct.userpicker.empty", "Aucun utilisateur"))
                + '</div>';
        }
        dd.innerHTML = h;
        dd.hidden = false;
        _positionDropdown(id);
    }
    // Position the dropdown as an overlay-floating panel so it can escape
    // parent containers with overflow:auto (e.g. the measure modal body).
    // Uses position:fixed + coords computed from the search input's
    // bounding rect. Called on render, on window scroll, and on resize.
    function _positionDropdown(id) {
        var inp = document.getElementById(id + "-search");
        var dd = document.getElementById(id + "-dd");
        if (!inp || !dd || dd.hidden)
            return;
        var rect = inp.getBoundingClientRect();
        dd.style.position = "fixed";
        dd.style.left = rect.left + "px";
        dd.style.top = (rect.bottom + 2) + "px";
        dd.style.width = rect.width + "px";
        // Clamp height to the available space below the input; if it
        // wouldn't fit below, flip above.
        var spaceBelow = window.innerHeight - rect.bottom - 16;
        var spaceAbove = rect.top - 16;
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
            // Flip above: anchor the dropdown's BOTTOM to the input top so a
            // short list hugs the input — anchoring the top at (rect.top -
            // maxHeight) left short lists floating at the top of the window.
            dd.style.top = "auto";
            dd.style.bottom = (window.innerHeight - rect.top + 2) + "px";
            dd.style.maxHeight = Math.min(400, spaceAbove) + "px";
        }
        else {
            dd.style.bottom = "auto";
            dd.style.maxHeight = Math.min(400, spaceBelow) + "px";
        }
    }
    // Re-position any open dropdown on viewport change so it stays anchored
    // to its input (useful when the modal scrolls or the window resizes).
    window.addEventListener("scroll", function () {
        for (var id in _instances)
            _positionDropdown(id);
    }, true);
    window.addEventListener("resize", function () {
        for (var id in _instances)
            _positionDropdown(id);
    });
    // Close every open dropdown when the click is outside any picker wrap.
    document.addEventListener("click", function (e) {
        for (var id in _instances) {
            var wrap = document.getElementById(id + "-wrap");
            if (wrap && wrap.contains(e.target))
                return;
        }
        for (var id2 in _instances) {
            var dd = document.getElementById(id2 + "-dd");
            if (dd)
                dd.hidden = true;
        }
    });
    // Event dispatchers (CSP-safe) ───────────────────────────────
    window._ctUpFocus = function (id) {
        var inp = document.getElementById(id + "-search");
        _renderDropdown(id, inp ? inp.value : "");
    };
    window._ctUpSearch = function (id, query) {
        var inst = _instances[id];
        // On free input the "value" is the typed query — will be kept
        // if the user confirms without clicking an item (useful in
        // standalone / local mode where there's no directory to pick
        // from and the typed string IS the answer).
        if (inst)
            inst.value = (query || "").trim();
        _renderDropdown(id, query || "");
    };
    window._ctUpPick = function (id, label, email) {
        var inst = _instances[id];
        if (!inst)
            return;
        inst.value = label;
        var inp = document.getElementById(id + "-search");
        if (inp)
            inp.value = label;
        var dd = document.getElementById(id + "-dd");
        if (dd)
            dd.hidden = true;
        // Inline usage (e.g. _dirPicker cells): emit the selected email so the
        // caller can save immediately. Modal callers don't pass onChange.
        if (inst.onChange)
            inst.onChange(email || "");
    };
    window._ctUpCreate = function (id, query) {
        var inst = _instances[id];
        if (!inst || !inst.onCreate)
            return;
        var dd = document.getElementById(id + "-dd");
        if (dd)
            dd.hidden = true;
        Promise.resolve(inst.onCreate(query)).then(function (created) {
            // onCreate's promise resolves with the created user OR null
            // if cancelled. The caller's onCreateReopen is responsible
            // for re-opening its parent modal — here we only sync the
            // instance state so that if it survives (e.g. onCreate did
            // not close the surrounding modal) the picker reflects the
            // selection.
            if (!created)
                return;
            inst.users.push(created);
            var lbl = _userLabel(created);
            inst.value = lbl;
            var inp = document.getElementById(id + "-search");
            if (inp)
                inp.value = lbl;
            if (inst.onChange)
                inst.onChange(created.email || "");
        }).catch(function (e) {
            if (typeof showStatus === "function")
                showStatus(e.message || "Erreur", true);
        });
    };
    // ──────────────────────────────────────────────────────────────
    // Smart mount — swap slot with picker or plain input
    // ──────────────────────────────────────────────────────────────
    function _pickerHandle(pickerId) {
        return {
            mode: "picker",
            getValue: function () {
                var inst = _instances[pickerId];
                return inst ? inst.value : "";
            },
            setValue: function (label) {
                var inst = _instances[pickerId];
                if (inst)
                    inst.value = label;
                var inp = document.getElementById(pickerId + "-search");
                if (inp)
                    inp.value = label;
            }
        };
    }
    function _plainHandle(inputId) {
        return {
            mode: "input",
            getValue: function () {
                var el = document.getElementById(inputId);
                return el ? el.value : "";
            },
            setValue: function (val) {
                var el = document.getElementById(inputId);
                if (el)
                    el.value = val || "";
            }
        };
    }
    function _mountPicker(opts, users) {
        var pickerId = opts.pickerId || "ct-userpicker";
        var slot = document.getElementById(opts.slotId);
        if (!slot) {
            // No slot — nothing to mount. Return a static handle so the
            // caller's getValue() stays safe.
            return { mode: "none", getValue: function () { return opts.value || ""; }, setValue: function () { } };
        }
        slot.outerHTML = render({
            id: pickerId,
            value: opts.value || "",
            placeholder: opts.placeholder || "",
            users: users || [],
            onCreate: typeof opts.onCreate === "function" ? opts.onCreate : null
        });
        return _pickerHandle(pickerId);
    }
    function _mountPlain(opts) {
        var slot = document.getElementById(opts.slotId);
        if (!slot)
            return { mode: "none", getValue: function () { return opts.value || ""; }, setValue: function () { } };
        var inputId = (opts.pickerId || "ct-userpicker") + "-plain";
        slot.outerHTML = '<input type="text" id="' + esc(inputId) + '"'
            + ' autocomplete="off" class="ct-userpicker-plain"'
            + ' value="' + esc(opts.value || "") + '"'
            + ' placeholder="' + esc(opts.placeholder || "") + '">';
        return _plainHandle(inputId);
    }
    function mount(opts) {
        opts = opts || {};
        var directoryUrl = opts.directoryUrl || "api/directory";
        var sourceUrl = opts.sourceUrl === null
            ? null
            : (opts.sourceUrl || "api/settings/directory-source");
        function fetchUsers() {
            return fetch(directoryUrl, { credentials: "same-origin" })
                .then(function (r) { return r.ok ? r.json() : []; })
                .catch(function () { return []; });
        }
        if (sourceUrl === null) {
            return fetchUsers().then(function (users) { return _mountPicker(opts, users); });
        }
        return fetch(sourceUrl, { credentials: "same-origin" })
            .then(function (r) { return r.ok ? r.json() : { pilot_available: false }; })
            .catch(function () { return { pilot_available: false }; })
            .then(function (meta) {
            // Picker only makes sense when there's a writable directory
            // behind the proxy: the Pilot central directory (source=pilot)
            // OR the module's own local personnel base (local_writable, the
            // standalone case). Otherwise fall back to a plain text input.
            var effective = (meta && meta.source) || "local";
            if (effective === "pilot" || (meta && meta.local_writable)) {
                // FEAT-15 Lot 5: when the directory is the central Pilot hub,
                // identities are owned by Access (the source). Consuming
                // modules may search/select but NOT create here — drop the
                // "+ Créer" affordance. Local-writable directories keep it.
                var mountOpts = effective === "pilot"
                    ? Object.assign({}, opts, { onCreate: undefined })
                    : opts;
                return fetchUsers().then(function (users) { return _mountPicker(mountOpts, users); });
            }
            return _mountPlain(opts);
        });
    }
    // ──────────────────────────────────────────────────────────────
    // User creation modal (Nom*, Prénom*, Email*, Fonction?)
    // ──────────────────────────────────────────────────────────────
    function promptCreateUser(opts) {
        opts = opts || {};
        var query = (opts.query || "").trim();
        var apiUrl = opts.apiUrl || "api/directory";
        // Pre-fill: if query looks like an email → email; else split
        // "Prénom Nom" into prenom+nom.
        var prefEmail = "", prefNom = "", prefPrenom = "";
        if (query.indexOf("@") > 0) {
            prefEmail = query;
        }
        else if (query) {
            var parts = query.split(/\s+/);
            prefPrenom = parts.shift() || "";
            prefNom = parts.join(" ");
        }
        var body = ''
            + '<div class="ct-measure-form">'
            + '<div class="ct-measure-form__row">'
            + '<label>' + esc(_i18n("ct.userpicker.prenom", "Prénom")) + ' *'
            + '<input type="text" id="ctup-prenom" value="' + esc(prefPrenom) + '">'
            + '</label>'
            + '<label>' + esc(_i18n("ct.userpicker.nom", "Nom")) + ' *'
            + '<input type="text" id="ctup-nom" value="' + esc(prefNom) + '">'
            + '</label>'
            + '</div>'
            + '<label>' + esc(_i18n("ct.userpicker.email", "Email")) + ' *'
            + '<input type="email" id="ctup-email" value="' + esc(prefEmail) + '" placeholder="prenom.nom@example.com">'
            + '</label>'
            + '<label>' + esc(_i18n("ct.userpicker.fonction", "Fonction"))
            + '<input type="text" id="ctup-fonction">'
            + '</label>'
            + '</div>';
        return window.ct_modal.open({
            title: _i18n("ct.userpicker.new_title", "Nouvel utilisateur"),
            body: body,
            size: "md",
            onOpen: function () {
                var target = prefEmail ? "ctup-prenom" : (prefPrenom ? "ctup-nom" : "ctup-prenom");
                var el = document.getElementById(target);
                if (el) {
                    try {
                        el.focus();
                        el.select();
                    }
                    catch (e) { }
                }
            },
            buttons: [
                { id: "cancel", label: _i18n("btn_cancel", "Annuler") },
                { id: "save", primary: true,
                    label: _i18n("ct.userpicker.create", "Créer l'utilisateur"),
                    result: function () {
                        var prenom = ((document.getElementById("ctup-prenom") || {}).value || "").trim();
                        var nom = ((document.getElementById("ctup-nom") || {}).value || "").trim();
                        var email = ((document.getElementById("ctup-email") || {}).value || "").trim();
                        var fonction = ((document.getElementById("ctup-fonction") || {}).value || "").trim();
                        if (!email || email.indexOf("@") < 1) {
                            if (typeof showStatus === "function")
                                showStatus(_i18n("ct.userpicker.email_required", "Email valide requis"), true);
                            return false;
                        }
                        if (!nom && !prenom) {
                            if (typeof showStatus === "function")
                                showStatus(_i18n("ct.userpicker.name_required", "Nom ou prénom requis"), true);
                            return false;
                        }
                        return { email: email, nom: nom, prenom: prenom, fonction: fonction };
                    } }
            ]
        }).then(function (result) {
            if (!result)
                return null;
            var formData = result;
            return fetch(apiUrl, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            }).then(function (resp) {
                if (resp.status === 409) {
                    // Duplicate email — fetch existing and return it so
                    // the caller still gets a usable user object.
                    return fetch(apiUrl, { credentials: "same-origin" })
                        .then(function (r) { return r.ok ? r.json() : []; })
                        .then(function (all) {
                        var existing = (all || []).find(function (p) {
                            return (p.email || "").toLowerCase() === formData.email.toLowerCase();
                        });
                        if (typeof showStatus === "function") {
                            showStatus(_i18n("ct.userpicker.email_exists", "Email déjà existant : {email}").replace("{email}", formData.email));
                        }
                        return existing || null;
                    });
                }
                if (!resp.ok)
                    throw new Error("HTTP " + resp.status);
                return resp.json();
            }).catch(function (e) {
                if (typeof showStatus === "function")
                    showStatus(_i18n("ct.userpicker.create_error", "Erreur création utilisateur : {msg}")
                        .replace("{msg}", e.message || e), true);
                return null;
            });
        });
    }
    // ──────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────
    window.ct_userpicker = {
        render: render,
        mount: mount,
        promptCreateUser: promptCreateUser,
        getValue: function (id) {
            var inst = _instances[id];
            return inst ? inst.value : "";
        },
        setValue: function (id, label) {
            var inst = _instances[id];
            if (inst)
                inst.value = label;
            var inp = document.getElementById(id + "-search");
            if (inp)
                inp.value = label;
        },
        setUsers: function (id, users) {
            var inst = _instances[id];
            if (inst)
                inst.users = Array.isArray(users) ? users : [];
        },
        _label: _userLabel
    };
})();
