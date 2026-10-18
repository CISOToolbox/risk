// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — users section of the settings drawer (FEAT-58).
 *
 * For the backend modules. In standalone the module's admin runs its own
 * accounts through /api/users: approve a new account with a role of the
 * module's ladder, change a role, put an account back to pending, disable it,
 * allow the AI assistant. In the suite, accounts and roles are Pilot's and the
 * section says so. A non-admin sees that the section is reserved to admins.
 *
 * Load after ct_settings.js:
 *   <script src="js/ct_settings.js"></script>
 *   <script src="js/ai_backend.js"></script>
 *   <script src="js/ct_users_settings.js"></script>
 *
 * A module opts in from its AI_APP_CONFIG:
 *   settingsExtraHTML:  … + _ctUsersSettingsHTML()
 *   onSettingsRendered: … _ctUsersSettingsLoad()
 * A module that lays its sections out itself puts _ctUsersSettingsBody()
 * under its own title (t("settings.users.title")).
 */
(function () {
    "use strict";
    var HOLDER = "ct-users-settings";
    var STATE_TONES = { active: "low", pending: "medium", disabled: "neutral" };
    async function _detail(r, fallbackKey) {
        try {
            var body = await r.json();
            if (body && typeof body.detail === "string")
                return body.detail;
        }
        catch (e) { /* not a JSON error body */ }
        return t(fallbackKey);
    }
    function _roleLabel(role) {
        return t("settings.users.role." + role);
    }
    function _when(iso) {
        if (!iso)
            return t("settings.users.never");
        var d = new Date(iso);
        return isNaN(d.getTime()) ? "" : d.toLocaleString();
    }
    function _row(u, roles) {
        var options = roles.concat(["pending", "disabled"]).map(function (r) {
            return '<option value="' + esc(r) + '"' + (r === u.role ? " selected" : "") + '>' + esc(_roleLabel(r)) + '</option>';
        }).join("");
        var key = esc(u.id);
        return '<div class="settings-section">' +
            '<div class="ct-flex ct-items-center ct-gap-1">' +
            '<strong>' + esc(u.name || u.email) + '</strong>' +
            '<span class="ct-badge" data-size="sm" data-tone="' + esc(STATE_TONES[u.state] || "neutral") + '">' +
            esc(t("settings.users.state." + u.state)) + '</span>' +
            '</div>' +
            '<p class="ct-muted fs-xs">' + esc(u.email) + ' · ' + esc(t("settings.users.last_login")) + ' ' + esc(_when(u.last_login)) + '</p>' +
            '<div class="ct-form-grid">' +
            '<div class="ct-field">' +
            '<label class="ct-label" for="ct-user-role-' + key + '">' + esc(t("settings.users.role")) + '</label>' +
            '<select class="ct-select" id="ct-user-role-' + key + '">' + options + '</select>' +
            '</div>' +
            '<label class="ct-check"><input type="checkbox" id="ct-user-ai-' + key + '"' + (u.ai_enabled ? " checked" : "") + '>' +
            '<span class="ct-check-box">' + _icon("check", 12) + '</span>' + esc(t("settings.users.ai")) + '</label>' +
            '</div>' +
            '<div class="ct-actions mt-8">' +
            '<button class="ct-btn" data-write data-click="_ctUsersSave" data-args=\'' + _da(u.id) + '\'>' + esc(t("settings.users.save")) + '</button>' +
            '</div>' +
            '</div>';
    }
    function _render(list) {
        if (list.managed)
            return '<p class="ct-muted fs-sm">' + esc(t("settings.users.managed")) + '</p>';
        var pending = list.users.filter(function (u) { return u.state === "pending"; }).length;
        return '<p class="ct-muted fs-xs">' + esc(t("settings.users.help")) + '</p>' +
            (pending ? '<p class="fs-sm">' + esc(t("settings.users.pending_count", { n: pending })) + '</p>' : '') +
            list.users.map(function (u) { return _row(u, list.roles); }).join("");
    }
    window._ctUsersSettingsBody = function () {
        return '<div id="' + HOLDER + '"><p class="ct-muted fs-sm">' + esc(t("settings.users.loading")) + '</p></div>';
    };
    window._ctUsersSettingsHTML = function () {
        return '<div class="settings-section">' +
            '<div class="settings-label">' + esc(t("settings.users.title")) + '</div>' +
            window._ctUsersSettingsBody() +
            '</div>';
    };
    window._ctUsersSettingsLoad = async function () {
        var holder = document.getElementById(HOLDER);
        if (!holder)
            return;
        try {
            var r = await fetch("api/users", { credentials: "same-origin" });
            if (r.status === 403) {
                holder.innerHTML = '<p class="ct-muted fs-sm">' + esc(t("settings.users.admin_only")) + '</p>';
                return;
            }
            if (!r.ok)
                throw new Error(String(r.status));
            holder.innerHTML = _render(await r.json());
        }
        catch (e) {
            holder.innerHTML = '<p class="ct-muted fs-sm">' + esc(t("settings.users.load_error")) + '</p>';
        }
    };
    window._ctUsersSave = async function (id) {
        var role = document.getElementById("ct-user-role-" + id);
        var ai = document.getElementById("ct-user-ai-" + id);
        if (!role || !ai)
            return;
        try {
            var r = await fetch("api/users/" + encodeURIComponent(id), {
                method: "PUT", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: role.value, ai_enabled: ai.checked })
            });
            if (r.ok) {
                showStatus(t("settings.users.saved"));
                window._ctUsersSettingsLoad();
            }
            else if (r.status === 403) {
                showStatus(t("settings.users.admin_only"), true);
            }
            else if (r.status === 409) {
                showStatus(t("settings.users.last_admin"), true);
            }
            else if (r.status === 400) {
                showStatus(t("settings.users.invalid_role"), true);
            }
            else {
                showStatus(await _detail(r, "settings.users.save_error"), true);
            }
        }
        catch (e) {
            showStatus(t("settings.users.save_error"), true);
        }
    };
    _registerTranslations("fr", {
        "settings.users.title": "Utilisateurs",
        "settings.users.loading": "Chargement…",
        "settings.users.load_error": "Impossible de charger les utilisateurs.",
        "settings.users.managed": "En mode suite, les utilisateurs et leurs rôles se gèrent dans Pilot.",
        "settings.users.admin_only": "Réservé aux administrateurs du module",
        "settings.users.help": "Le premier compte connecté est l'administrateur du module ; tout autre compte attend votre approbation : donnez-lui un rôle pour qu'il puisse se connecter. Un changement de rôle s'applique à sa requête suivante. Un compte désactivé ne peut plus se connecter ; son historique est conservé. Sans fournisseur d'identité, la connexion se fait par le jeton partagé (AUTH_TOKEN) : quiconque le détient peut se connecter sous n'importe quelle adresse ; réservez-le à des personnes de confiance et changez-le après avoir désactivé un compte.",
        "settings.users.pending_count": "{n} compte(s) en attente d'approbation",
        "settings.users.last_login": "Dernière connexion :",
        "settings.users.never": "jamais",
        "settings.users.role": "Rôle",
        "settings.users.ai": "Assistant IA autorisé",
        "settings.users.save": "Enregistrer",
        "settings.users.saved": "Utilisateur mis à jour",
        "settings.users.save_error": "Échec de la mise à jour de l'utilisateur",
        "settings.users.last_admin": "Le dernier administrateur ne peut être ni rétrogradé ni désactivé",
        "settings.users.invalid_role": "Rôle non disponible dans ce module",
        "settings.users.state.active": "Actif",
        "settings.users.state.pending": "En attente",
        "settings.users.state.disabled": "Désactivé",
        "settings.users.role.viewer": "Lecteur",
        "settings.users.role.editor": "Éditeur",
        "settings.users.role.contributor": "Contributeur",
        "settings.users.role.triager": "Analyste (tri)",
        "settings.users.role.manager": "Gestionnaire",
        "settings.users.role.control": "Contrôle",
        "settings.users.role.admin": "Administrateur",
        "settings.users.role.pending": "En attente d'approbation",
        "settings.users.role.disabled": "Désactivé"
    });
    _registerTranslations("en", {
        "settings.users.title": "Users",
        "settings.users.loading": "Loading…",
        "settings.users.load_error": "Could not load the users.",
        "settings.users.managed": "In the suite, users and their roles are managed in Pilot.",
        "settings.users.admin_only": "Reserved to the module's administrators",
        "settings.users.help": "The first account to sign in is the module's administrator; any other account awaits your approval: give it a role so it can sign in. A role change applies to its next request. A disabled account can no longer sign in; its history is kept. Without an identity provider, sign-in uses the shared token (AUTH_TOKEN): whoever holds it can sign in as any address; share it with trusted people only and change it after disabling an account.",
        "settings.users.pending_count": "{n} account(s) awaiting approval",
        "settings.users.last_login": "Last sign-in:",
        "settings.users.never": "never",
        "settings.users.role": "Role",
        "settings.users.ai": "AI assistant allowed",
        "settings.users.save": "Save",
        "settings.users.saved": "User updated",
        "settings.users.save_error": "Could not update the user",
        "settings.users.last_admin": "The last administrator cannot be demoted nor disabled",
        "settings.users.invalid_role": "This role is not available in this module",
        "settings.users.state.active": "Active",
        "settings.users.state.pending": "Pending",
        "settings.users.state.disabled": "Disabled",
        "settings.users.role.viewer": "Viewer",
        "settings.users.role.editor": "Editor",
        "settings.users.role.contributor": "Contributor",
        "settings.users.role.triager": "Triager",
        "settings.users.role.manager": "Manager",
        "settings.users.role.control": "Control",
        "settings.users.role.admin": "Administrator",
        "settings.users.role.pending": "Awaiting approval",
        "settings.users.role.disabled": "Disabled"
    });
})();
