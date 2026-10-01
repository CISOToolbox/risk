# Contributing to EBIOS RM

Thanks for taking the time to contribute. This repository is one module of the
[CISO Toolbox](https://www.cisotoolbox.org) suite. It is a **frontend-only** application: no
framework, no bundler, no `node_modules` needed to run it. The module-specific
code is written in TypeScript (`ts/`) and the compiled JavaScript (`js/`) is
committed: there is nothing to compile to run the app.

## Running it

```bash
git clone https://github.com/CISOToolbox/risk.git
cd risk/webapp
python3 -m http.server 8080     # any static server works
# then open http://127.0.0.1:8080/
```

Opening `index.html` straight from the filesystem (`file://`) mostly works, but
`fetch()`-based features (loading `demo-*.json`, the Word report templates under
`templates/`) are blocked by the browser's origin rules. Use a static server.

## Generated files

> **Read this before editing anything under `js/`, `css/` or `ts/types/`.**

Part of this repository is **generated** — the design system and the
cross-module libraries that all CISO Toolbox modules have in common. These
shared files, identical across the CISO Toolbox apps, carry a "Generated file -
do not edit" header and are rewritten at every release:

```
// -----------------------------------------------------------------------------
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// See CONTRIBUTING.md.
// -----------------------------------------------------------------------------
```

**A pull request that modifies one of them cannot be merged**: the next
release would silently overwrite your change, and the same change would be
missing from the other modules. Open an issue describing the change instead;
it is applied at the source and reaches every module in the next release.

## TypeScript sources

The module-specific code is written in TypeScript (`ts/`); `js/` holds the
compiled JavaScript that the browser actually loads. Both are committed: there
is nothing to compile to run the app. If you change a `.ts` file, regenerate the
matching `.js` (`tsc -p .`, see `tsconfig.json`) and commit both, keeping them
consistent.

## Coding conventions

- TypeScript compiled to ES2021 JavaScript (`tsconfig.json`), no framework, no
  external runtime dependency (the few bundled libraries under `js/vendor/` are
  third-party and are not modified here).
- **No inline event handlers.** The app is written to run under
  `script-src 'self'`; wire events with `data-click` / `data-change` /
  `data-input` attributes handled by the shared delegation layer.
- **Always escape** anything that comes from user or imported data with the
  shared `esc()` helper before injecting it into HTML.
- Every user-visible string goes through the i18n layer (`data-i18n` attribute
  or `t("key")`), with an entry in both `ts/EBIOS_RM_i18n_fr.ts` and
  `ts/EBIOS_RM_i18n_en.ts` (then recompile).
- Keep it accessible: real `<button>` elements, `aria-label` on icon-only
  controls, visible focus.

## Tests

End-to-end tests live in [`e2e/`](e2e/) and use Playwright against a local
static server. See [`e2e/README.md`](e2e/README.md) for how to run them. Any
behaviour change should come with, or update, a test.

## Demo data

The repository ships a demo dataset, `demo-fr.json` and `demo-en.json`, which
describes the fictional company MedSecure. It can be loaded from
*Settings → Load demonstration* (the file matching the current language).

Demo datasets must describe a **fictional** company.
Never add real organisation data — no real company, person, email address or
site. Pull requests containing real assessment data will be closed.

## Pull requests

1. One concern per pull request.
2. Conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`,
   `test:`, `chore:`).
3. Run the e2e suite before pushing.
4. Do not commit build artefacts, deployment scripts, `.htaccess`, or anything
   matching `.gitignore`.

## Reporting security issues

Do **not** open a public issue. See [SECURITY.md](SECURITY.md).

## Licence

By contributing you agree that your contribution is licensed under the MIT
licence of this repository ([LICENSE](LICENSE)).
