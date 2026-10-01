# EBIOS RM -- Interactive Risk Assessment

> Part of [CISO Toolbox](https://www.cisotoolbox.org) -- open-source security tools for CISOs.


> **This is the browser-only version** — everything runs in your browser,
> data never leaves it (localStorage + JSON export). Perfect for solo use,
> evaluation, consulting on client data, or air-gapped contexts. Need
> accounts, a shared database, an API and multi-user work? The **standalone
> backend** of the same module lives at the [root of this repository](../)
> — same features, same data format, a JSON export moves your work from one
> to the other. See *One repository, two versions* in the main README.

## Features

- 5 EBIOS RM workshops in accordion sidebar (scoping, risk origins, strategic scenarios, operational scenarios, risk treatment)
- 4x4 risk matrix with gravity/likelihood scales (initial and residual)
- Ecosystem mapping with SVG visualization
- Multi-analysis catalog stored in IndexedDB
- Built-in security baselines: ANSSI hygiene guide (42 measures) or ISO 27001 Annex A (93 controls)
- Import from Vendor (TPRM) with measures and threat levels
- Excel import/export with standalone formulas
- Managerial synthesis export (PowerPoint) and EBIOS RM report export (Word)
- AI assistant (Anthropic Claude, OpenAI GPT, Google Gemini or AWS Bedrock) with auto and custom prompts
- AES-256-GCM encrypted snapshots (PBKDF2 250k iterations)
- Bilingual FR/EN (both dictionaries loaded at startup)

## Quick Start

1. Visit [risk.cisotoolbox.org](https://risk.cisotoolbox.org) or clone this repo
2. Open `index.html` in a browser
3. Start a new analysis — or load the fictional demo dataset (MedSecure, `demo-fr.json` / `demo-en.json`) from *Settings → Load demonstration*
4. No backend, no account required

## Architecture

- 100% client-side, no framework. The module-specific code is written in TypeScript (`ts/`) and the compiled JavaScript (`js/`) is committed: there is nothing to compile to run the app
- Data stored in browser (localStorage autosave + IndexedDB for multi-analysis catalog)
- Event delegation via `data-click` attributes (CSP compliant, no inline handlers)
- Lazy-loaded assets: ANSSI/ISO measure descriptions, Excel template, and the vendored libraries under `js/vendor/` (ExcelJS, PptxGenJS, PizZip + docxtemplater)
- Shared libraries: `cisotoolbox.js`, `cisotoolbox_local.js`, `i18n.js`, `ai_common.js`, `ct_settings.js`, `ct_refselect.js`, `ct_schema.js`

## Import / Export

| Format | Import | Export |
|--------|--------|--------|
| JSON | Yes | Yes |
| Encrypted JSON (AES-256-GCM) | Yes | Yes |
| Excel (.xlsx) | Yes | Yes |
| Vendor (TPRM) JSON | Yes | -- |
| PowerPoint synthesis (.pptx) | -- | Yes |
| Word report (.docx) | -- | Yes |

## Screenshots

_Coming soon_

## Links

- Website: https://risk.cisotoolbox.org
- GitHub: https://github.com/CISOToolbox/risk
- CISO Toolbox: https://www.cisotoolbox.org

## Need more than a browser app?

This app is intentionally **100% browser-local** — your data never leaves
your machine. If you outgrow it, the same module exists in two server-backed
flavours:

- **Standalone backend** (accounts, PostgreSQL, REST API, Docker):
  the `-standalone` distribution of this repo — see `STANDALONE.md` /
  `ghcr.io/cisotoolbox/ciso-risk:latest`.
- **Governance suite**: all CISO Toolbox modules integrated behind Pilot
  (SSO, shared user directory, consolidated action plan, centralized
  backups and point-in-time restore) — see https://www.cisotoolbox.org.

Your JSON exports from this app import as-is into both.

## Running it locally

This is a static, frontend-only application — no backend, no account. The
module-specific code is written in TypeScript (`ts/`) and the compiled
JavaScript (`js/`) is committed: there is nothing to compile to run the app.

```bash
git clone https://github.com/CISOToolbox/risk.git
cd risk/webapp
python3 -m http.server 8080      # any static file server will do
```

Then open <http://127.0.0.1:8080/>.

Opening `index.html` directly from the filesystem (`file://`) works for the
basic UI, but the browser blocks `fetch()` on local files, so `demo-*.json` and
the Word report templates (`templates/*.docx`) will not load. Prefer a static
server.

## Deploying behind a web server

The app ships with **no security headers of its own** — they belong to the web
server that serves the files. Two ready-to-use configs are included so a
deployment is never published bare:

- **Apache**: copy `.htaccess.example` to `.htaccess`. It sets a strict
  Content-Security-Policy (`script-src 'self'`, no framing), `X-Frame-Options`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  blocks dotfiles, and redirects HTTP to HTTPS. `.htaccess` itself is
  git-ignored because the HTTP→HTTPS rule is host-specific — the `.example` is
  the versioned source.
- **nginx**: `include` the provided `nginx-security.conf.example` inside the
  `server{}` block that serves the app (see the header of that file). Same CSP
  and headers as the Apache config — keep the two in sync if you edit the CSP.

Without one of these, the browser runs the app with no CSP: do not expose the
static files directly. The `python3 -m http.server` above is for local use only.

## Where your data lives

| What | Where | Lifetime |
|------|-------|----------|
| Work in progress (autosave) | `localStorage["ebios_rm_autosave"]` | Until you clear the browser storage |
| Multi-analysis catalog | IndexedDB database `ebios_rm_catalog` | Same |
| Snapshots | `localStorage["ebios_rm_autosave_snapshots"]` (optionally AES-256-GCM encrypted) | Same |
| UI preferences | `localStorage["ct_lang"]`, `localStorage["ct_theme"]` | Same |
| Your real deliverable | **A file on your own disk**, via *File → Save* | Yours |
| AI provider API key (optional) | `localStorage`, sent only to the provider you configured | Until you clear it |

**Persistence is file-based.** The browser copy is a convenience buffer, not a
backup: a cleared profile, an incognito window or a different machine means an
empty app. Save to a `.json` (or AES-256-GCM encrypted `.enc`) file and keep
that file wherever you keep your other security deliverables. Nothing is ever
sent to a server — there is no server.

## Repository layout

```
css/                  # 2 files
e2e/                  # 5 files
fonts/                # 6 files (embedded, no external font request)
js/                   # 21 files
templates/            # 2 files
tools/                # 1 file
ts/                   # 20 files
.gitignore
.htaccess.example
ARCHITECTURE.md
CONTRIBUTING.md
LICENSE
README-FR.md
README.md
SECURITY.md
demo-en.json
demo-fr.json
favicon.svg
index.html
logo.svg
nginx-security.conf.example
tsconfig.json
```

## Generated files

The design system and the cross-module libraries (`js/cisotoolbox*.js`,
`js/i18n.js`, `js/i18n_core_*.js`, `js/ai_common.js`, `js/ct_*.js`,
`css/cisotoolbox.css`, `ts/types/*.d.ts`) are shared files, identical across
the CISO Toolbox apps: they carry a "Generated file - do not edit" header and
are rewritten at every release — see
[CONTRIBUTING.md](CONTRIBUTING.md) for what to do if you find a bug in one of
them.

## Tests

```bash
cd e2e && npm install && npx playwright install chromium && npm test
```

See [`e2e/README.md`](e2e/README.md).

## Contributing / Security

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md) — never report a vulnerability in a public issue
- Licence: MIT, see [LICENSE](LICENSE)
