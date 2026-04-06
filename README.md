# EBIOS RM -- Interactive Risk Assessment

> Part of [CISO Toolbox](https://www.cisotoolbox.org) -- open-source security tools for CISOs.

## Features

- 5 EBIOS RM workshops in accordion sidebar (scoping, risk origins, strategic scenarios, operational scenarios, risk treatment)
- 4x4 risk matrix with gravity/likelihood scales (initial and residual)
- Ecosystem mapping with SVG visualization
- Multi-analysis catalog stored in IndexedDB
- Built-in referentials: ANSSI 42 measures, ISO 27001 93 measures, + 9 complementary frameworks loaded on demand
- Import from Vendor (TPRM) with measures and threat levels
- Excel import/export with standalone formulas
- AI assistant (Anthropic Claude / OpenAI GPT) with auto and custom prompts
- AES-256-GCM encrypted snapshots (PBKDF2 250k iterations)
- Bilingual FR/EN with lazy-loaded translations

## Quick Start

1. Visit [risk.cisotoolbox.org](https://risk.cisotoolbox.org) or clone this repo
2. Open `index.html` in a browser
3. Load `demo-en.json` from File > Open to explore a complete analysis (MedSecure)
4. No backend, no account required

## Architecture

- 100% client-side vanilla JS -- no framework, no build step
- Data stored in browser (localStorage autosave + IndexedDB for multi-analysis catalog)
- Event delegation via `data-click` attributes (CSP compliant, no inline handlers)
- Lazy-loaded assets: framework descriptions, Excel template, complementary referentials
- Shared libraries: `cisotoolbox.js`, `i18n.js`, `ai_common.js`, `referentiels_catalog.js`

## Import / Export

| Format | Import | Export |
|--------|--------|--------|
| JSON | Yes | Yes |
| Encrypted JSON (AES-256-GCM) | Yes | Yes |
| Excel (.xlsx) | Yes | Yes |
| Vendor (TPRM) JSON | Yes | -- |

## Screenshots

_Coming soon_

## License

MIT

## Links

- Website: https://risk.cisotoolbox.org
- GitHub: https://github.com/CollectiveMakers/ebiosrm.cisotoolbox.org
- CISO Toolbox: https://www.cisotoolbox.org
