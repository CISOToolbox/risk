# EBIOS RM -- Interactive Risk Assessment Web Application

A 100% client-side web application for conducting risk assessments following the **EBIOS Risk Manager** methodology (ANSSI, France).

> This tool is part of the **[CISO Toolbox](https://www.cisotoolbox.org)** suite -- a collection of open-source security tools designed for CISOs, risk analysts, and compliance officers. The suite is built to be modular and lightweight so that everyone can use only the tool(s) they need.
>
> To see the other tools in the suite, visit [cisotoolbox.org](https://www.cisotoolbox.org/#tools)

---

## Why this tool?

Many GRC platforms include risk assessment features -- such as the excellent [CISO Assistant](https://intuitem.com/fr/ciso-assistant/) -- but they have limitations for users who simply want to conduct risk assessments:

- Need to host, deploy, and manage a server application
- Public cloud hosting that may raise confidentiality concerns
- More comprehensive tools but therefore heavier to configure for a single use

This application was built around two simple principles:

**1) No data leaves the browser**

- No application server, no database, no user accounts
- All processing is done client-side in JavaScript
- Data stays on the analyst's machine
- The application works offline once loaded
- Encryption/decryption of saved files (AES-256-GCM) is performed locally

**2) No tool lock-in**

- Excel export at any time to continue the analysis in a spreadsheet
- Open tool and data format

---

## Features

### The 5 EBIOS RM workshops

1. **Scoping and security baseline** -- Context, business values, supporting assets, feared events, compliance baseline (ANSSI 42 controls or ISO 27001 Annex A 93 controls)
2. **Risk origins and target objectives** -- Identification and assessment of RO/TO pairs (Motivation, Resources, Activity)
3. **Strategic scenarios** -- Attack paths, ecosystem stakeholders, ecosystem controls
4. **Operational scenarios** -- Detailed kill chain, existing controls, effectiveness, operational likelihood
5. **Risk treatment** -- Treatment plan, security controls, residual risks

### Complementary frameworks (loaded on demand)

GAMP 5, LPM, Law 05-20 (Morocco), DORA, HDS, SecNumCloud, NIS 2, Cyber Resilience Act, SOC 2

### Summary dashboards

Initial/residual risk maps, distribution, evolution, baseline compliance

### Bilingual interface (FR/EN)

The application automatically detects the browser language and can be switched between French and English via Settings (gear icon in the toolbar). Regulatory content (ANSSI, ISO, DORA, NIS 2, etc.) is available in both languages with official English texts when they exist.

### AI Assistant (optional)

An AI assistant can be enabled in Settings to generate contextual suggestions for each workshop (business values, supporting assets, scenarios, controls, etc.). It supports **Anthropic (Claude)** and **OpenAI (GPT)** providers. See the [AI Assistant](#ai-assistant) section for details.

---

## Getting started

### Live demo

The application is available online: **https://ebiosrm.cisotoolbox.org/**

### Demo file

A demonstration file (`demo-en.json`) is included with the application. It contains a complete analysis for a fictional company (MedSecure) and lets you explore all features.

### Quick start

1. Open the application in a browser
2. Click **File > Open**
3. Select the `demo-en.json` file
4. Browse the 5 workshops using the sidebar

If you are using the online version at **https://ebiosrm.cisotoolbox.org/**, you can automatically load the demo data from Settings (gear icon in the top right corner).

---

## Import / Export

The application does not lock in your data. Everything can be imported and exported in open formats:

| Format | Import | Export | Usage |
|--------|--------|--------|-------|
| **JSON** | Open | Save (quick save of current file) / Save As | Native format, full backup. Save overwrites the current file without encryption. |
| **Encrypted JSON** | Open (password) | Save As (password) | Secure backup (AES-256-GCM, PBKDF2 250k iterations). Use Save As to enable encryption. |
| **Excel (.xlsx)** | Import | Export | Interoperability -- continue the analysis in a spreadsheet |

The generated Excel file contains one sheet per workshop with automatic formulas (criticality, relevance, likelihood, residual risk) that allow the Excel file to be used completely independently. **The analysis remains usable without the application.**

> **Note:** Excel import/export requires the [ExcelJS](https://github.com/exceljs/exceljs) library, loaded on demand from a CDN (`cdn.jsdelivr.net`). An Internet connection is therefore required for the first Excel import or export. All other features (JSON, encryption, analysis) work entirely offline.

---

## Architecture

### Design principles

| Principle | Detail |
|-----------|--------|
| 100% client-side | No backend, no database, no user accounts |
| Data sovereignty | All data stays in the browser (localStorage + files) |
| No build step | Vanilla JavaScript, no framework, no transpiler |
| Shared library | Common code (`cisotoolbox.js`, `i18n.js`, `ai_common.js`) shared across CISO Toolbox apps |
| Lazy loading | Heavy assets (descriptions, frameworks, Excel template) loaded on demand |
| CSP compliant | No inline scripts, no `eval`, no `unsafe-inline` for JS |

### File structure

```
index.html                    Entry point
css/
  cisotoolbox.css                Shared styles (toolbar, sidebar, tables, dialogs)
  EBIOS_RM.css                   App-specific styles
js/
  i18n.js                        i18n engine (t(), switchLang, data-i18n attributes)
  cisotoolbox.js                 Shared library (events, files, encryption, undo, snapshots)
  referentiels_catalog.js        Shared framework catalog (9 frameworks FR/EN)
  ai_common.js                   Shared AI module (providers, settings, API calls, panel UI)
  EBIOS_RM_data.js               Default data (empty analysis)
  EBIOS_RM_i18n.js               FR/EN translations (~300 keys + help content)
  EBIOS_RM_app.js                Main application logic (~3000 lines)
  EBIOS_RM_ai_assistant.js       AI suggestions for each workshop
  EBIOS_RM_descriptions.js       ANSSI/ISO descriptions (lazy-loaded)
  EBIOS_RM_template.js           Excel template (lazy-loaded, base64)
  EBIOS_RM_ref_cra.js            Cyber Resilience Act controls (lazy-loaded)
  EBIOS_RM_ref_dora.js           DORA controls (lazy-loaded)
  EBIOS_RM_ref_gamp.js           GAMP 5 controls (lazy-loaded)
  EBIOS_RM_ref_hds.js            HDS controls (lazy-loaded)
  EBIOS_RM_ref_loi0520.js        Law 05-20 controls (lazy-loaded)
  EBIOS_RM_ref_lpm.js            LPM controls (lazy-loaded)
  EBIOS_RM_ref_nis2.js           NIS 2 controls (lazy-loaded)
  EBIOS_RM_ref_secnumcloud.js    SecNumCloud controls (lazy-loaded)
  EBIOS_RM_ref_soc2.js           SOC 2 controls (lazy-loaded)
```

### Script loading order

Scripts are loaded synchronously in a strict order at the bottom of `index.html`. The order matters because each script depends on globals defined by the previous ones:

```
1. i18n.js                  The i18n engine must be available before any t() call
2. cisotoolbox.js            Shared library, uses t() for UI strings
3. referentiels_catalog.js   Defines window._REFERENTIELS_CATALOG
4. EBIOS_RM_data.js          Defines default D (empty analysis object)
5. EBIOS_RM_i18n.js          Registers FR/EN translation keys
6. EBIOS_RM_app.js           Main app -- reads CT_CONFIG, D, REFERENTIELS_META
7. ai_common.js              Reads AI_APP_CONFIG, provides shared AI functions
8. EBIOS_RM_ai_assistant.js  Wraps render functions with AI hooks
```

Loading a script in the wrong order will cause reference errors (`t()` undefined, `D` undefined, `CT_CONFIG` missing).

### Key patterns

**CT_CONFIG** -- Each application declares a configuration object before `cisotoolbox.js` executes:

```javascript
window.CT_CONFIG = {
    autosaveKey: "ebios_autosave",    // localStorage key for auto-save
    initDataVar: "EBIOS_INIT_DATA",   // name of the global containing initial data
    refNamespace: "EBIOS_REF",        // namespace for lazy-loaded framework files
    descNamespace: "EBIOS_DESCRIPTIONS", // namespace for descriptions
    label: "analysis",                // label for UI messages ("New analysis")
    filePrefix: "EBIOS_RM",           // default filename prefix
    getSociete: function() { ... },   // returns company name from D
    getDate: function() { ... }       // returns analysis date from D
};
```

**D** -- The global data object containing the entire analysis. All workshops read from and write to `D`. It is serialized to JSON for save/export and deserialized on open/import.

**Event delegation** -- No inline event handlers (`onclick`, `onchange`). All interactions use `data-click`, `data-change`, and `data-input` attributes dispatched by `_safeDispatch()`. This is CSP-compliant and avoids `unsafe-inline`.

**Lazy loading** -- `_loadAsset(namespace, path, callback)` dynamically loads JS files (descriptions, framework controls, Excel template) only when needed, avoiding a heavy initial payload.

**Ref select** -- Multi-select widget with search for cross-references between frameworks. Each supporting asset can reference controls from any loaded framework.

**_rt()** -- Bilingual helper for reference data. Returns `field_en` when locale is EN, `field` otherwise. Used for framework descriptions that exist in both languages.

**_REFERENTIELS_CATALOG / REFERENTIELS_META** -- The catalog (`referentiels_catalog.js`) provides metadata for the 9 frameworks. It is copied into `REFERENTIELS_META` at initialization, then enriched with actual controls when a framework is loaded on demand.

### Data flow

```
User interaction
    |
    v
updateField(path, value)  -- writes to D
    |
    v
_saveState()              -- pushes to the undo stack
    |
    v
_autoSave()               -- writes D to localStorage
```

**File operations:**

```
Open    --> _loadBuffer() --> handles encryption (AES-256-GCM) --> JSON.parse --> D
Save    --> _serializeForSave() --> JSON or encrypted blob --> File System Access API or download
```

**AI flow:**

```
openSettings() --> user configures prompt
    |
    v
_aiCallAPI()   --> sends context + prompt to provider API
    |
    v
_aiParseJSON() --> extracts structured JSON from response
    |
    v
_normalizeSuggestions() --> validates structure
    |
    v
_renderCards() --> displays suggestion cards in the panel
    |
    v
User accepts --> ACCEPT_HANDLERS --> writes to D
```

### Shared library architecture

Five files are shared between the application and other applications in the cisotoolbox.org suite:

| File | Purpose |
|------|---------|
| `cisotoolbox.js` | Event delegation, file I/O, encryption, undo/redo, auto-save, snapshots, toolbar, sidebar |
| `i18n.js` | Translation engine: `t(key)`, `switchLang()`, `data-i18n` attribute scanning |
| `ai_common.js` | AI provider configuration, API call wrapper, settings panel, suggestion panel UI, CSS injection |
| `referentiels_catalog.js` | Metadata for 9 complementary frameworks (id, label, description, control count) in FR and EN |
| `cisotoolbox.css` | Shared styles for toolbar, sidebar, tables, dialogs, forms, ref-select widget |

Each application lives in its own git repository. The shared files are kept identical across both applications.

---

## Security

| Measure | Detail |
|---------|--------|
| **CSP** | `script-src 'self' https://cdn.jsdelivr.net` -- no inline scripts, no `eval` |
| **X-Frame-Options** | `DENY` -- prevents clickjacking via iframe |
| **X-Content-Type-Options** | `nosniff` -- prevents the browser from guessing Content-Type |
| **Permissions-Policy** | Disables camera, microphone, geolocation, payment, USB, sensors |
| **Encryption** | AES-256-GCM with PBKDF2 derivation (250,000 iterations) |
| **API Keys** | Stored only in localStorage, never included in saved files |
| **Dispatch blocklist** | `_safeDispatch` refuses to call dangerous internal/native functions |
| **HTML sanitization** | User input is escaped before DOM insertion |
| **SRI** | Integrity verified for libraries loaded from CDN (ExcelJS) |
| **HTTPS** | HTTPS should be enforced at the server/hosting level |
| **No server** | No data transits through a third-party server (except AI assistant if enabled) |

---

## AI Assistant

### How it works

The AI assistant provides a suggestion panel for each workshop. When opened, it sends the current analysis context (organization, scope, existing elements) along with a prompt to the selected AI provider.

Two prompt modes are available:

- **Auto** -- The assistant generates a prompt based on the current workshop and analysis context
- **Custom** -- The analyst writes a free-form prompt; the analysis context is added automatically

### Supported providers

| Provider | Models | API Endpoint |
|----------|--------|-------------|
| Anthropic | Claude (Sonnet, Haiku) | `https://api.anthropic.com` |
| OpenAI | GPT-4o, GPT-4o-mini | `https://api.openai.com` |

It is very easy to add other providers such as Gemini, but we are looking for users of these solutions to test them before publishing. Feel free to contact us if you would like to test.

### Configuration

1. Click the gear icon in the toolbar
2. Enter an API key for the chosen provider
3. Enable the "AI Assistant" toggle
4. A detailed security warning is displayed (see below)

### Methodology instructions file

A Markdown file can be loaded in Settings to guide the AI suggestions (internal framework, writing conventions, sector-specific vocabulary). The file content is prepended to each prompt.

### Update mode

When the analysis already contains elements (e.g., business values), the assistant switches to "update mode": it sends existing elements as context and asks the AI to suggest additions or improvements, avoiding duplicates.

### Privacy and security warnings

> By enabling the AI assistant, you accept the following:
>
> 1. **Data sharing** -- Your analysis data (organization context, requirements, controls, scenarios) is sent to the selected AI provider to generate suggestions. Make sure your privacy policy and contractual obligations (subcontracting clauses, GDPR, NDA) allow sharing with a third-party service.
>
> 2. **API key exposure** -- The application works without a backend server. The API key is therefore transmitted directly from your browser to the provider's API. This means:
>    - The key is visible in the browser developer tools (Network tab)
>    - Browser extensions with the `webRequest` permission can capture it
>    - A corporate proxy may log HTTP headers (even though content is encrypted via HTTPS)
>
>    **Recommendation:** use a dedicated browser profile without extensions for analyses containing sensitive data.
>
> 3. **Key storage** -- The API key is stored in the browser's `localStorage`. It is never included in saved JSON files. Anyone with access to the browser (same session, same profile) can read it via DevTools.
>
> 4. **No guarantee on responses** -- AI-generated suggestions are proposals to be validated by the analyst. They do not replace human expertise.

---

## Deployment

The application is a set of static files. No application server is required.

### Hosting options

- **Web server** (Apache, Nginx, static hosting) -- drop in the files
- **Local machine** -- open `index.html` in a browser (JS assets must be in the same directory tree)
- **Intranet** -- no Internet connection required after initial load

### Offline operation

The application works offline once loaded, with two exceptions:

- **Excel import/export** requires the ExcelJS library from the CDN on first use
- **AI Assistant** requires an Internet connection to communicate with the provider API

### Live instances

| Environment | URL |
|-------------|-----|
| Production | https://ebiosrm.cisotoolbox.org |
| Staging | https://staging.ebiosrm.cisotoolbox.org |

---

## Contributing

This project is open source. Contributions are welcome: bug reports, feature suggestions, adding frameworks, translations, code improvements.

GitHub repository: **https://github.com/CollectiveMakers/ebiosrm.cisotoolbox.org**

---

## License

MIT
