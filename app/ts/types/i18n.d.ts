// -----------------------------------------------------------------------------
// REPLICATED from the private shared repository (shared/types/gen/i18n.d.ts).
// DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
// Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
/**
 * CISO Toolbox — Système i18n (FR/EN)
 *
 * Charger AVANT cisotoolbox.js et les fichiers app.
 * Chaque app ajoute ses traductions via _registerTranslations().
 */
declare var _baseLang: string;
declare var _locale: string;
declare var _translations: Record<string, CtI18nDict>;
declare function _registerTranslations(lang: string, dict: CtI18nDict): void;
declare function t(key: string, params?: Record<string, string | number>): string;
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
declare function tEsc(key: string, params?: Record<string, string | number>): string;
declare function _initLocale(): void;
declare var _LANG_NAMES: Record<string, string>;
declare function _availableLangs(): string[];
declare function _langName(lang: string): string;
declare var _i18nLoaded: Record<string, boolean>;
declare function _loadI18nFile(lang: string, cb?: () => void): void;
declare function switchLang(lang?: string, cb?: () => void): void;
declare function _applyStaticTranslations(): void;
declare function _getSettingsButtonHTML(): string;
declare function _getGithubLinkHTML(repoUrl: string): string;
declare function _rt(obj: Record<string, any>, field: string): string;
