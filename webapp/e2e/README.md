# End-to-end tests — EBIOS RM

Playwright tests for the CISO Toolbox **EBIOS RM** module. They run against a
**local static server that Playwright starts itself** (`python3 -m http.server`
on the repository root) — nothing is deployed and no external site is
contacted.

## Requirements

- Node.js 20+
- Python 3 (used as the static file server)

## Install

```bash
cd e2e
npm install
npx playwright install chromium
```

## Run

```bash
npm test               # headless
npm run test:headed    # watch it in a real browser
npm run report         # open the HTML report of the last run
```

Run a single journey:

```bash
npx playwright test -g "page load"
```

Use another port if `8184` is taken:

```bash
E2E_PORT=9090 npm test
```

## What is covered

| # | Journey | What it proves |
|---|---------|----------------|
| 1 | Page load | The shell boots, the title and navigation rail render, no uncaught JS error |
| 2 | No external request | Every rail panel renders without a single request leaving `127.0.0.1` — the "no backend" promise |
| 3 | Navigation | Each rail entry opens a non-empty panel |
| 4 | File menu | `File` opens, exposes open/save, and the hidden `#file-input` exists |
| 5 | Language | The FR/EN toggle is stored in `localStorage["ct_lang"]` and survives a reload |
| 6 | Theme | The light/dark toggle is stored in `localStorage["ct_theme"]` and survives a reload |
| 7 | Local persistence | An analysis created **by the test itself** through the workshop-1 "Contexte" form autosaves to `localStorage` and is still there after a reload — no fixture file, no server |
| + | Module-specific | See the last test(s) of the spec file |

> The repository ships **no dataset**: the `demo-*.json` files were removed and
> new ones will be generated later. Every journey that needs data builds it
> through the application UI, which is what a self-contained e2e suite should
> do anyway.

These are deliberately **smoke-level journeys for a local frontend app**: they
check that the page boots, that navigation and the shared UI shell work, that
the i18n and theme preferences persist, and that an analysis created in the app
survives a reload through `localStorage`. They are not a functional test suite for the
methodology itself — that belongs in the module's own regression tests.

## Notes

- The suite is intentionally **specific to this module**. It is not a copy of a
  suite-wide test run; each repository owns and evolves its own journeys.
- Artefacts (`playwright-report/`, `test-results/`, `screenshots/`) are
  gitignored.
