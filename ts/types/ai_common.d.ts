/**
 * CISO Toolbox — AI Common Module
 *
 * Shared AI infrastructure: providers, API calls, settings panel, panel UI, CSS.
 * Each app adds its own AI assistant that uses these shared functions.
 *
 * Load AFTER i18n.js and cisotoolbox.js, BEFORE app-specific AI assistant:
 *   <script src="js/ai_common.js"></script>
 *
 * Each app must set window.AI_APP_CONFIG before loading this file:
 *   window.AI_APP_CONFIG = {
 *       storagePrefix: "ebios" | "compliance",
 *       onSettingsSaved: function() { ... } // called after settings are saved
 *   };
 */
interface CtAiModel {
    id: string;
    label: string;
}
interface CtAiProvider {
    label: string;
    models: CtAiModel[];
    defaultModel: string;
    placeholder: string;
    endpoint: string;
}
/** Forme retournée par _aiEnsurePanel (panel inclus pour les usages internes). */
interface CtAiPanel {
    panel: HTMLElement;
    title: HTMLElement;
    body: HTMLElement;
    footer: HTMLElement;
}
interface Window {
    _AI_PROVIDERS?: Record<string, CtAiProvider>;
    _aiK?: (suffix: string) => string;
    _aiGetApiKey?: () => string;
    _aiSetApiKey?: (key: string) => void;
    _aiClearApiKey?: () => void;
    _aiGetProvider?: () => string;
    _aiSetProvider?: (p: string) => void;
    _aiGetEndpoint?: () => string;
    _aiSetEndpoint?: (url: string) => void;
    _aiGetSecretKey?: () => string;
    _aiSetSecretKey?: (key: string) => void;
    _aiGetRegion?: () => string;
    _aiSetRegion?: (r: string) => void;
    _aiGetModel?: () => string;
    _aiSetModel?: (m: string) => void;
    _aiIsEnabled?: () => boolean;
    _aiSetEnabled?: (v: boolean) => void;
    _aiGetContext?: () => string;
    _aiSetContext?: (text: string) => void;
    _aiGetContextName?: () => string;
    _aiSetContextName?: (name: string) => void;
    _aiValidateKey?: (provider: string, apiKey: string, model: string) => Promise<boolean>;
    _aiCallAPI?: (systemPrompt: string, userPrompt: string) => Promise<string>;
    _aiParseJSON?: (raw: string) => any;
    _aiEnsurePanel?: () => {
        title: HTMLElement;
        body: HTMLElement;
        footer: HTMLElement;
    };
    _aiOpenPanel?: () => void;
    _aiClosePanel?: () => void;
    _aiShowLoading?: (title: string) => void;
    _aiShowError?: (title: string, errMsg: string) => void;
    _aiPromptContext?: (autoUser: string) => string;
    _aiPromptSchema?: (autoUser: string) => string;
    _aiRenderCards?: (opts: CtAiCardsOpts) => void;
}
interface CtAiCardsOpts {
    suggestions: any[];
    title?: string;
    renderCard: (s: any, i: number) => string;
    onAccept: (s: any, i: number) => void;
    onChange?: () => void;
    acceptLabel?: string;
    ignoreLabel?: string;
    acceptAllLabel?: string;
    closeLabel?: string;
    doneLabel?: string;
    extraHTML?: string;
    onRendered?: () => void;
}
