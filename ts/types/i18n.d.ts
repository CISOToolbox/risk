/**
 * CISO Toolbox — Système i18n (FR/EN)
 *
 * Charger AVANT cisotoolbox.js et les fichiers app.
 * Chaque app ajoute ses traductions via _registerTranslations().
 */
declare var _locale: string;
declare var _translations: Record<string, CtI18nDict>;
declare function _registerTranslations(lang: string, dict: CtI18nDict): void;
declare function t(key: string, params?: Record<string, string | number>): string;
declare function _initLocale(): void;
declare var _i18nLoaded: Record<string, boolean>;
declare function _loadI18nFile(lang: string, cb?: () => void): void;
declare function switchLang(lang?: string, cb?: () => void): void;
declare function _applyStaticTranslations(): void;
declare function _getSettingsButtonHTML(): string;
declare function _getGithubLinkHTML(repoUrl: string): string;
declare function _rt(obj: Record<string, any>, field: string): string;
