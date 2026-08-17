// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/i18n_core_en.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Traductions socle partagees (EN).
 * _registerTranslations() est defini dans i18n.js ; charger APRES i18n.js.
 * Genere depuis i18n.ts (decoupage i18n multilingue).
 */
_registerTranslations("en", {
    "matrix.critical": "Critical", // pilot
    "matrix.extreme": "Extreme", // pilot
    "matrix.high": "High", // pilot
    "matrix.low": "Low", // pilot
    "matrix.moderate": "Medium", // pilot
    "matrix.significant": "Significant", // pilot
    "matrix.x": "Impact", // pilot
    "matrix.y": "Likelihood", // pilot
    "notif.appsec.alert_enabled": "Alert on every scan discovering new findings", // notif (FEAT-34/35)
    "notif.appsec.alert_threshold": "Minimum severity for alerts", // notif (FEAT-34/35)
    "notif.appsec.weekly_day": "Recap send day", // notif (FEAT-34/35)
    "notif.appsec.weekly_enabled": "Weekly recap of open findings", // notif (FEAT-34/35)
    "notif.appsec.weekly_threshold": "Minimum severity for the recap", // notif (FEAT-34/35)
    "notif.cancel": "Cancel", // notif (FEAT-34/35)
    "notif.day.friday": "Friday", // notif (FEAT-34/35)
    "notif.day.monday": "Monday", // notif (FEAT-34/35)
    "notif.day.saturday": "Saturday", // notif (FEAT-34/35)
    "notif.day.sunday": "Sunday", // notif (FEAT-34/35)
    "notif.day.thursday": "Thursday", // notif (FEAT-34/35)
    "notif.day.tuesday": "Tuesday", // notif (FEAT-34/35)
    "notif.day.wednesday": "Wednesday", // notif (FEAT-34/35)
    "notif.day_label": "Send day", // notif (FEAT-34/35)
    "notif.days_unit": "days", // notif (FEAT-34/35)
    "notif.enabled": "Receive the weekly deadline digest by email", // notif (FEAT-34/35)
    "notif.include_overdue": "Include overdue deadlines", // notif (FEAT-34/35)
    "notif.lang_global": "Language of all notifications", // notif (FEAT-34/35)
    "notif.lang_global_hint": "Applies to every notification email you receive, whatever the module (Pilot deadlines, AppSec findings…).", // notif (FEAT-34/35)
    "notif.section.general": "General preferences", // notif (FEAT-34/35)
    "notif.hint.appsec": "AppSec notifications follow the recipients configured on each application.", // notif (FEAT-34/35)
    "notif.hint.general": "No email is sent when there is nothing to report, whatever the module.", // notif (FEAT-34/35)
    "notif.hint.pilot": "An action concerns you when its owner matches your email or your name.", // notif (FEAT-34/35)
    "notif.hint.surface": "No per-host recipients: enabling this is enough to receive every alert of the platform, filtered at your floor.", // notif (FEAT-34/35)
    "notif.section.surface": "Surface alerts", // notif (FEAT-34/35)
    "notif.surface.alert_enabled": "Receive alerts for new findings on the attack surface", // notif (FEAT-34/35)
    "notif.surface.alert_threshold": "Minimum severity", // notif (FEAT-34/35)
    "notif.lang": "Email language", // notif (FEAT-34/35)
    "notif.modules": "Included modules", // notif (FEAT-34/35)
    "notif.prefix": "Module email subject prefix", // notif (FEAT-34/35)
    "notif.save": "Save", // notif (FEAT-34/35)
    "notif.run_test": "Run a test", // notif (FEAT-34/35)
    "notif.test_launched": "Test launched", // notif (FEAT-34/35)
    "notif.test_res.failed": "failed", // notif (FEAT-34/35)
    "notif.test_res.sent": "email sent", // notif (FEAT-34/35)
    "notif.test_res.skipped": "skipped (disabled)", // notif (FEAT-34/35)
    "notif.saved": "Notification preferences saved", // notif (FEAT-34/35)
    "notif.scope": "Scope", // notif (FEAT-34/35)
    "notif.scope.all": "All actions (admin)", // notif (FEAT-34/35)
    "notif.scope.mine": "My actions only", // notif (FEAT-34/35)
    "notif.section.appsec": "AppSec findings", // notif (FEAT-34/35)
    "notif.section.pilot": "Deadline digest (Pilot)", // notif (FEAT-34/35)
    "notif.send_test": "Send me a preview", // notif (FEAT-34/35)
    "notif.sev.critical": "Critical", // notif (FEAT-34/35)
    "notif.sev.high": "High", // notif (FEAT-34/35)
    "notif.sev.low": "Low (everything)", // notif (FEAT-34/35)
    "notif.sev.medium": "Medium", // notif (FEAT-34/35)
    "notif.test_sent": "Preview sent \u2014 check your inbox", // notif (FEAT-34/35)
    "notif.title": "Notifications", // notif (FEAT-34/35)
    "notif.window": "\u201cUpcoming\u201d window", // notif (FEAT-34/35)
    "schema.file_newer": "This file was created by a newer version of the application (schema {file_rev} > {app_rev}). Update the application to open it.", // FEAT-36
    "settings.title": "Settings", // pilot
    // File menu
    "menu_file": "File",
    "menu_open": "Open",
    "menu_save": "Save",
    "menu_save_as": "Save as",
    "menu_new": "New {label}",
    "save_encrypt_prompt": "Do you want to encrypt the file with a password?",
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
    "btn_save": "Save",
    "btn_close": "Close",
    "btn_delete": "Delete",
    "btn_edit": "Edit",
    "btn_add": "Add",
    "btn_confirm": "Confirm",
    "btn_yes": "Yes",
    "btn_no": "No",
    "misc.search": "Search...",
    "misc.loading": "Loading...",
    "misc.error": "Error",
    "misc.confirm_delete": "Confirm deletion?",
    "misc.no_data": "No data",
    "misc.low": "Low",
    "misc.medium": "Medium",
    "misc.high": "High",
    "misc.critical": "Critical",
    "misc.info": "Info",
    "nav.dashboard": "Dashboard",
    "ct.search.placeholder": "Search...",
    "ct.search.clear": "Clear",
    "ct.pills.clear_all": "Clear all",
    "ct.bulk.selected": "{n} selected",
    "ct.bulk.clear": "Deselect",
    "ct.empty.title": "No items",
    "measure.status.planifie": "Planned",
    "measure.status.en_cours": "In progress",
    "measure.status.termine": "Completed",
    "measure.status.backlog": "Backlog",
    "measure.status.annule": "Cancelled",
    "measure.field.title": "Title",
    "measure.field.description": "Details",
    "measure.field.type": "Type",
    "measure.field.statut": "Status",
    "measure.field.responsable": "Owner",
    "measure.field.echeance": "Due date",
    "measure.field.progress_log": "Progress log",
    "measure.field.progress_log_ph": "Add a progress note…",
    "measure.field.progress_log_empty": "No notes yet.",
    "measure.field.progress_log_add": "Add",
    "measure.field.progress_log_history": "View history",
    "measure.field.progress_log_add_err": "Failed to add the note",
    "measure.type.contractuelle": "Contractual",
    "measure.type.technique": "Technical",
    "measure.type.organisationnelle": "Organisational",
    "measure.type.surveillance": "Monitoring",
    "measure.type.prevention": "Prevention",
    "measure.overdue": "{n} days overdue",
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
    "err_not_encrypted": "File not encrypted",
    // Chrome UI v2 (SPEC §11)
    "ct.posture.weak": "Weak",
    "ct.posture.moderate": "Moderate",
    "ct.posture.good": "Good",
    "ct.posture.excellent": "Excellent",
    "chrome.modules": "Modules",
    "chrome.deeplink_not_found": "Measure not found in this module (it may have been deleted).",
    "chrome.stale_conflict": "Your data was modified server-side (Pilot or a scheduled task) while this tab was open. The page will reload — your last bulk operation was not saved.",
    "chrome.stale_refreshed": "Data refreshed (server-side changes)",
    "chrome.switch_module": "Switch module",
    "chrome.search_all": "Go to a module, an analysis, a measure…",
    "chrome.theme_dark": "Dark theme",
    "chrome.theme_light": "Light theme",
    "chrome.lang": "Language",
    "chrome.saved_at": "Saved {time}",
    "chrome.saved_local": "Saved locally {time}",
    "chrome.export_json": "Export (JSON)",
    "chrome.import_json": "Import (JSON)",
    "chrome.settings": "Settings",
    "chrome.columns": "Columns",
    "chrome.empty.title": "Nothing to show",
    "module.risk": "Risk", "module.compliance": "Compliance", "module.audit": "Audit",
    "module.vendor": "Vendor", "module.asset": "Asset", "module.access": "Access",
    "module.surface": "Surface", "module.appsec": "AppSec", "module.watch": "Watch", "module.pilot": "Pilot"
});
