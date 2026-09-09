# Contributing to EBIOS RM

Thanks for taking the time to contribute. This repository is one module of the
[CISO Toolbox](https://www.cisotoolbox.org) suite. It is a **frontend-only** application: vanilla
JavaScript, no framework, no bundler, no `node_modules` needed to run it.

## Running it

```bash
git clone <this repo>
cd risk
python3 -m http.server 8080     # any static server works
# then open http://127.0.0.1:8080/
```

Opening `index.html` straight from the filesystem (`file://`) mostly works, but
`fetch()`-based features (loading `demo-*.json`, lazy-loaded frameworks) are
blocked by the browser's origin rules. Use a static server.

## Generated files

> **Read this before editing anything under `js/`, `css/` or `ts/types/`.**

Part of this repository is **generated** — the design system and the
cross-module libraries that all CISO Toolbox modules have in common. Those
files carry this banner:

```
// ─────────────────────────────────────────────────────────────
// Generated file - do not edit.
// It is overwritten at every release; a change made here is lost.
// ─────────────────────────────────────────────────────────────
```

**A pull request that modifies one of them cannot be merged**: the next
release would silently overwrite your change, and the same change would be
missing from the other modules. Open an issue describing the change instead;
it is applied at the source and reaches every module in the next release.

## TypeScript sources

`ts/` holds the TypeScript sources for the module-specific code; `js/` holds the
compiled output that the browser actually loads. Both are committed, because the
app must run with no build step. If you change a `.ts` file, regenerate the
matching `.js` (`tsc -p .`) and commit both, keeping them consistent.

## Coding conventions

- Vanilla ES5-compatible JavaScript, no framework, no external runtime
  dependency (the few bundled libraries under `js/vendor/` are third-party and
  are not modified here).
- **No inline event handlers.** The app is written to run under
  `script-src 'self'`; wire events with `data-click` / `data-change` /
  `data-input` attributes handled by the shared delegation layer.
- **Always escape** anything that comes from user or imported data with the
  shared `esc()` helper before injecting it into HTML.
- Every user-visible string goes through the i18n layer (`data-i18n` attribute
  or `t("key")`), with an entry in both `*_i18n_fr.js` and `*_i18n_en.js`.
- Keep it accessible: real `<button>` elements, `aria-label` on icon-only
  controls, visible focus.

## Tests

End-to-end tests live in [`e2e/`](e2e/) and use Playwright against a local
static server. See [`e2e/README.md`](e2e/README.md) for how to run them. Any
behaviour change should come with, or update, a test.

## Demo data

The repository currently ships **no demo dataset** — the previous
`demo-*.json` files were removed and new ones will be generated later. Until
then, build the data you need from the application itself.

When demo datasets come back, they must describe a **fictional** company.
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
