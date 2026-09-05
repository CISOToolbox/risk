// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/js/i18n.js).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — i18n system (FR/EN)
 *
 * Load BEFORE cisotoolbox.js and the app files.
 * Each app registers its own translations via _registerTranslations().
 */
// Base language (t() fallback AND default on first load). Always bundled.
// Overridable at packaging time via window._CT_BASE_LANG.
var _baseLang = (typeof window !== "undefined" && window._CT_BASE_LANG) || "en";
var _locale = _baseLang;
var _translations = { en: {}, fr: {} };
function _registerTranslations(lang, dict) {
    var existing = _translations[lang] || {};
    for (var k in dict)
        existing[k] = dict[k];
    _translations[lang] = existing;
}
function t(key, params) {
    var s = (_translations[_locale] && _translations[_locale][key])
        || (_translations[_baseLang] && _translations[_baseLang][key])
        || key;
    if (params) {
        for (var k in params) {
            s = s.replace(new RegExp("\\{" + k + "\\}", "g"), String(params[k]));
        }
    }
    return s;
}
/**
 * tEsc — HTML-escaped variant of t().
 *
 * SECURITY: t() falls back to returning the key verbatim when no translation
 * exists (useful for debugging missing keys). When the key is built from a
 * dynamic value (e.g. t("status." + item.status)) and the result is
 * interpolated into an HTML string, that fallback becomes an XSS sink.
 * Use tEsc() for every dynamic-key lookup rendered via innerHTML.
 * Do NOT use it for textContent / alert() sinks (entities would show as text).
 */
function tEsc(key, params) {
    return esc(t(key, params));
}
function _initLocale() {
    // Precedence: explicit stored preference > browser language (when it is
    // one of the available languages) > base language (English) as fallback.
    var stored = localStorage.getItem("ct_lang");
    if (stored && _translations[stored]) {
        _locale = stored;
    }
    else {
        var nav = (navigator.language || _baseLang).slice(0, 2);
        _locale = _translations[nav] ? nav : _baseLang;
    }
}
// Languages available in this deployment: injected at packaging time via
// window._CT_LANGS (e.g. ["en","fr"]), else derived from the loaded dicts.
// Names are displayed in their own language.
var _LANG_NAMES = {
    en: "English", fr: "Français", de: "Deutsch", es: "Español",
    it: "Italiano", pt: "Português", nl: "Nederlands"
};
function _availableLangs() {
    var w = (typeof window !== "undefined") ? window._CT_LANGS : null;
    if (w && w.length)
        return w;
    var k = Object.keys(_translations);
    return k.length ? k : [_baseLang];
}
function _langName(lang) { return _LANG_NAMES[lang] || lang.toUpperCase(); }
// Track loaded i18n files to avoid double-loading
var _i18nLoaded = {};
function _loadI18nFile(lang, cb) {
    if (_i18nLoaded[lang]) {
        if (cb)
            cb();
        return;
    }
    // A lazily loaded language = the core dict (i18n_core_<lang>.js) plus the
    // module dict (_ASSET_BASE + "_i18n_" + lang + ".js"). The core dict lives
    // in the same js/ directory as the module.
    var base = (typeof _ASSET_BASE !== "undefined") ? _ASSET_BASE : "";
    var dir = base.replace(/[^/]*$/, ""); // "js/Surface" -> "js/"
    var files = [dir + "i18n_core_" + lang + ".js"];
    if (base)
        files.push(base + "_i18n_" + lang + ".js");
    var pending = files.length;
    files.forEach(function (f) {
        var s = document.createElement("script");
        s.src = f;
        // Carry on even when a file is missing (partially deployed language).
        s.onload = s.onerror = function () {
            if (--pending === 0) {
                _i18nLoaded[lang] = true;
                if (cb)
                    cb();
            }
        };
        document.head.appendChild(s);
    });
}
function switchLang(lang, cb) {
    if (!lang)
        lang = _locale === "fr" ? "en" : "fr";
    _loadI18nFile(lang, function () {
        _locale = lang;
        localStorage.setItem("ct_lang", lang);
        _applyStaticTranslations();
        if (typeof renderAll === "function")
            renderAll();
        if (cb)
            cb();
    });
}
function _applyStaticTranslations() {
    document.documentElement.lang = _locale;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    // SECURITY: data-i18n-html injects raw HTML. Only use for developer-authored
    // translation keys (help content). Never use with user-supplied or external data.
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
        var html = t(el.getAttribute("data-i18n-html"));
        // Sanitization: strip dangerous tags, attributes, and URL schemes
        html = html.replace(/<(script|iframe|object|embed|form|base|link|meta|svg|math|template|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
            .replace(/<(script|iframe|object|embed|form|base|link|meta|svg|math|template|style)[^>]*\/?>/gi, "")
            .replace(/\bon\w+\s*=/gi, "data-blocked=")
            .replace(/javascript\s*:/gi, "blocked:")
            .replace(/data\s*:\s*[a-z]+\/[a-z]+/gi, "blocked:")
            .replace(/expression\s*\(/gi, "blocked(")
            .replace(/vbscript\s*:/gi, "blocked:");
        el.innerHTML = html;
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
        el.title = t(el.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
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
        if (obj[enField])
            return obj[enField];
    }
    return obj[field] || "";
}
// The shared core translations now live in i18n_core_<lang>.js (one file per
// language, loaded right after i18n.js). The split makes it possible to bundle
// only the languages selected at packaging time.
// Init locale on load. Today both languages are loaded through static
// <script> tags (Phase 3 will keep only the base core, lazy-loading the rest).
_i18nLoaded["fr"] = true;
_i18nLoaded["en"] = true;
_initLocale();
// Language selector: hidden when a single language is deployed.
if (typeof document !== "undefined" && _availableLangs().length <= 1) {
    document.querySelectorAll('[data-click="ct_toggleLang"]').forEach(function (b) { b.style.display = "none"; });
}
// When the resolved locale is not the base one (stored preference / browser)
// and is not loaded yet, load it then refresh.
if (_locale !== _baseLang && !_i18nLoaded[_locale]) {
    _loadI18nFile(_locale, function () {
        _applyStaticTranslations();
        if (typeof renderAll === "function")
            renderAll();
    });
}
