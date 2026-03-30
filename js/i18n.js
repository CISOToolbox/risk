/**
 * CISO Toolbox — Système i18n (FR/EN)
 *
 * Charger AVANT cisotoolbox.js et les fichiers app.
 * Chaque app ajoute ses traductions via _registerTranslations().
 */

var _locale = "fr";
var _translations = { fr: {}, en: {} };

function _registerTranslations(lang, dict) {
    var existing = _translations[lang] || {};
    for (var k in dict) existing[k] = dict[k];
    _translations[lang] = existing;
}

function t(key, params) {
    var s = (_translations[_locale] && _translations[_locale][key])
         || (_translations.fr && _translations.fr[key])
         || key;
    if (params) {
        for (var k in params) {
            s = s.replace(new RegExp("\\{" + k + "\\}", "g"), params[k]);
        }
    }
    return s;
}

function _initLocale() {
    var stored = localStorage.getItem("ct_lang");
    if (stored && _translations[stored]) {
        _locale = stored;
    } else {
        var nav = (navigator.language || "fr").slice(0, 2);
        _locale = _translations[nav] ? nav : "fr";
    }
}

// Track loaded i18n files to avoid double-loading
var _i18nLoaded = {};

function _loadI18nFile(lang, cb) {
    if (_i18nLoaded[lang]) { if (cb) cb(); return; }
    // App-specific i18n file naming convention: _ASSET_BASE + "_i18n_" + lang + ".js"
    var base = (typeof _ASSET_BASE !== "undefined") ? _ASSET_BASE : "";
    var file = base + "_i18n_" + lang + ".js";
    var s = document.createElement("script");
    s.src = file;
    s.onload = function() { _i18nLoaded[lang] = true; if (cb) cb(); };
    s.onerror = function() { if (cb) cb(); }; // proceed even if file not found
    document.head.appendChild(s);
}

function switchLang(lang) {
    if (!lang) lang = _locale === "fr" ? "en" : "fr";
    _loadI18nFile(lang, function() {
        _locale = lang;
        localStorage.setItem("ct_lang", lang);
        _applyStaticTranslations();
        if (typeof renderAll === "function") renderAll();
    });
}

function _applyStaticTranslations() {
    document.documentElement.lang = _locale;
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    // SECURITY: data-i18n-html injects raw HTML. Only use for developer-authored
    // translation keys (help content). Never use with user-supplied or external data.
    document.querySelectorAll("[data-i18n-html]").forEach(function(el) {
        var html = t(el.getAttribute("data-i18n-html"));
        // Sanitization: strip dangerous tags and attributes
        html = html.replace(/<(script|iframe|object|embed|form|base|link|meta|svg)[^>]*>[\s\S]*?<\/\1>/gi, "")
                    .replace(/<(script|iframe|object|embed|form|base|link|meta|svg)[^>]*\/?>/gi, "")
                    .replace(/\bon\w+\s*=/gi, "data-blocked=")
                    .replace(/javascript\s*:/gi, "blocked:")
                    .replace(/data\s*:\s*text\/html/gi, "blocked:");
        el.innerHTML = html;
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
        el.title = t(el.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
        el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
}

function _getSettingsButtonHTML() {
    return '<button class="btn-settings" id="btn-settings" data-click="openSettings"'
        + ' title="' + t("settings.title") + '">'
        + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<circle cx="12" cy="12" r="3"/>'
        + '<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'
        + '</svg></button>';
}

function _getGithubLinkHTML(repoUrl) {
    return '<a href="' + repoUrl + '" target="_blank" rel="noopener noreferrer"'
        + ' title="GitHub" class="btn-github">'
        + '<svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">'
        + '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>'
        + '</svg></a>';
}

// Helper for bilingual ref data (theme, mesure, description fields)
// Usage: _rt(measureObj, "theme") returns theme_en if locale is EN, else theme
function _rt(obj, field) {
    if (_locale === "en") {
        var enField = field + "_en";
        if (obj[enField]) return obj[enField];
    }
    return obj[field] || "";
}

// ═══════════════════════════════════════════════════════════════════════
// TRADUCTIONS PARTAGÉES (cisotoolbox.js)
// ═══════════════════════════════════════════════════════════════════════

_registerTranslations("fr", {
    // Menu fichier
    "menu_file": "Fichier",
    "menu_open": "Ouvrir",
    "menu_save": "Enregistrer",
    "menu_save_as": "Enregistrer sous",
    "menu_new": "Nouvelle {label}",

    // Status
    "status_session_restored": "Session restaurée",
    "status_new": "Nouvelle {label}",
    "status_file_opened": "Fichier ouvert : {name}",
    "status_saved": "Enregistré",
    "status_saved_name": "Enregistré : {name}",
    "status_saved_encrypted": " (chiffré)",
    "status_downloaded": "Fichier téléchargé",
    "status_encryption_on": "Chiffrement activé — le prochain enregistrement sera chiffré",
    "status_encryption_off": "Chiffrement désactivé",
    "status_snap_created": "Snapshot créé : {name}",
    "status_snap_deleted": "Snapshot supprimé",
    "status_snap_encrypted": "Snapshots chiffrés",

    // Confirm / Alert
    "confirm_new": "Créer une nouvelle {label} ? Les données non sauvegardées seront perdues.",
    "confirm_restore_snap": "Restaurer le snapshot \"{name}\" ?\nLes modifications non sauvegardées seront perdues.",
    "confirm_delete_snap": "Supprimer le snapshot \"{name}\" ?",
    "confirm_decrypt_snaps": "Déchiffrer tous les snapshots ?",
    "alert_wrong_password": "Mot de passe incorrect ou fichier corrompu.",
    "alert_wrong_snap_password": "Mot de passe incorrect ou données corrompues.",
    "alert_load_error": "Erreur de chargement : {msg}",
    "alert_open_error": "Erreur ouverture : {msg}",
    "alert_save_error": "Erreur sauvegarde : {msg}",
    "alert_storage_full": "Espace de stockage insuffisant. Supprimez des snapshots anciens.",

    // Password dialog
    "pwd_title_encrypted_file": "Fichier chiffré — entrez le mot de passe",
    "pwd_title_choose_file": "Choisissez un mot de passe pour chiffrer le fichier",
    "pwd_title_choose_snap": "Choisissez un mot de passe pour chiffrer les snapshots",
    "pwd_title_snap_encrypted": "Les snapshots sont chiffrés. Entrez le mot de passe",
    "pwd_placeholder": "Mot de passe",
    "pwd_confirm_placeholder": "Confirmer le mot de passe",
    "pwd_err_empty": "Veuillez saisir un mot de passe.",
    "pwd_err_mismatch": "Les mots de passe ne correspondent pas.",
    "btn_cancel": "Annuler",
    "btn_ok": "OK",
    "btn_validate": "Valider",
    "btn_yes": "Oui",
    "btn_no": "Non",

    // Session banner
    "session_found": "Session précédente trouvée : <strong>{label}</strong>",
    "session_no_name": "Sans nom",
    "btn_restore": "Restaurer",
    "btn_discard": "Ignorer",

    // Columns
    "col_hide_title": "Masquer cette colonne",
    "cols_all_visible": "Toutes les colonnes sont affichées",
    "cols_hidden_btn": "+ Colonnes masquées",

    // Sidebar
    "sidebar_hide": "Masquer le menu",
    "sidebar_show": "Afficher le menu",
    "btn_undo_title": "Annuler (Ctrl+Z)",
    "btn_redo_title": "Rétablir (Ctrl+Y)",

    // Snapshots
    "snap_prompt_name": "Nom du point de sauvegarde :",

    // Error
    "err_not_encrypted": "Fichier non chiffré"
});

_registerTranslations("en", {
    // File menu
    "menu_file": "File",
    "menu_open": "Open",
    "menu_save": "Save",
    "menu_save_as": "Save as",
    "menu_new": "New {label}",

    // Status
    "status_session_restored": "Session restored",
    "status_new": "New {label}",
    "status_file_opened": "File opened: {name}",
    "status_saved": "Saved",
    "status_saved_name": "Saved: {name}",
    "status_saved_encrypted": " (encrypted)",
    "status_downloaded": "File downloaded",
    "status_encryption_on": "Encryption enabled — next save will be encrypted",
    "status_encryption_off": "Encryption disabled",
    "status_snap_created": "Snapshot created: {name}",
    "status_snap_deleted": "Snapshot deleted",
    "status_snap_encrypted": "Snapshots encrypted",

    // Confirm / Alert
    "confirm_new": "Create a new {label}? Unsaved data will be lost.",
    "confirm_restore_snap": "Restore snapshot \"{name}\"?\nUnsaved changes will be lost.",
    "confirm_delete_snap": "Delete snapshot \"{name}\"?",
    "confirm_decrypt_snaps": "Decrypt all snapshots?",
    "alert_wrong_password": "Incorrect password or corrupted file.",
    "alert_wrong_snap_password": "Incorrect password or corrupted data.",
    "alert_load_error": "Loading error: {msg}",
    "alert_open_error": "Open error: {msg}",
    "alert_save_error": "Save error: {msg}",
    "alert_storage_full": "Insufficient storage space. Delete old snapshots.",

    // Password dialog
    "pwd_title_encrypted_file": "Encrypted file — enter password",
    "pwd_title_choose_file": "Choose a password to encrypt the file",
    "pwd_title_choose_snap": "Choose a password to encrypt snapshots",
    "pwd_title_snap_encrypted": "Snapshots are encrypted. Enter password",
    "pwd_placeholder": "Password",
    "pwd_confirm_placeholder": "Confirm password",
    "pwd_err_empty": "Please enter a password.",
    "pwd_err_mismatch": "Passwords do not match.",
    "btn_cancel": "Cancel",
    "btn_ok": "OK",
    "btn_validate": "Validate",
    "btn_yes": "Yes",
    "btn_no": "No",

    // Session banner
    "session_found": "Previous session found: <strong>{label}</strong>",
    "session_no_name": "Unnamed",
    "btn_restore": "Restore",
    "btn_discard": "Discard",

    // Columns
    "col_hide_title": "Hide this column",
    "cols_all_visible": "All columns are visible",
    "cols_hidden_btn": "+ Hidden columns",

    // Sidebar
    "sidebar_hide": "Hide menu",
    "sidebar_show": "Show menu",
    "btn_undo_title": "Undo (Ctrl+Z)",
    "btn_redo_title": "Redo (Ctrl+Y)",

    // Snapshots
    "snap_prompt_name": "Snapshot name:",

    // Error
    "err_not_encrypted": "File not encrypted"
});

// Init locale on load — FR is loaded synchronously via <script> tag
_i18nLoaded["fr"] = true;
_initLocale();

// If saved locale is EN, lazy-load EN translations at startup
if (_locale === "en") {
    _loadI18nFile("en", function() {
        _applyStaticTranslations();
        if (typeof renderAll === "function") renderAll();
    });
}
