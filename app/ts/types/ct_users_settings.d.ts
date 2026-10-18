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
interface CtUserRow {
    id: string;
    email: string;
    name: string;
    role: string;
    state: string;
    local: boolean;
    ai_enabled: boolean;
    last_login: string | null;
}
interface CtUsersList {
    users: CtUserRow[];
    roles: string[];
    identity_provider: boolean;
    managed: boolean;
}
interface Window {
    _ctUsersSettingsHTML?: () => string;
    _ctUsersSettingsBody?: () => string;
    _ctUsersSettingsLoad?: () => void;
    _ctUsersSave?: (id: string) => void;
}
