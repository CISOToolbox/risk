# Security Policy

## Threat model in one paragraph

EBIOS RM is a **100 % client-side web application**. There is no backend, no
account, no server-side storage and no telemetry. Everything you type stays in
your browser (`localStorage` for autosave, IndexedDB for the multi-analysis
catalog)
until you explicitly save a file to your own disk. As a consequence, the
security boundary is your browser and the machine hosting the files — the
project itself never sees your data.

## Supported versions

Only the tip of the `main` branch is supported. Fixes are shipped by publishing
a new commit; there are no long-lived maintenance branches.

## Reporting a vulnerability

Please report security issues **confidentially**, not through a public issue:

- GitHub Security Advisories ("Report a vulnerability" tab of this repository), or
- email **security@cisotoolbox.org**

Include a description, affected file(s), reproduction steps and, if possible, a
proof of concept. Please allow up to **10 working days** for a first response
and up to **90 days** before public disclosure.

Out of scope (and already known / accepted by design):

- Data readable from `localStorage` / IndexedDB by anyone with access to the
  same browser profile — this is the storage model, documented above.
- Missing authentication: there is none, by design.
- Findings that require the user to paste hostile content into their own
  assessment and then open it themselves.
- Reports produced by an automated scanner without a working proof of concept.

## What we do care about

- Cross-site scripting through imported data (`demo-*.json`, saved analyses,
  Excel and Vendor (TPRM) JSON imports) — all rendering must go through the
  `esc()` helper.
- Weaknesses in the AES-256-GCM / PBKDF2 file-encryption path in
  `js/cisotoolbox.js` or `js/cisotoolbox_local.js`.
- Leakage of an AI provider API key entered in the settings panel (the key is
  kept in `localStorage` and sent only to the provider endpoint you chose).
- Content-Security-Policy bypasses (the app is written to run with
  `script-src 'self'`, no inline handlers).

## Secrets and personal data

Never attach a real assessment, a real audit or a real vendor register to an
issue or a pull request — they contain client data. Use the fictional demo
dataset shipped with the repository instead (`demo-fr.json` / `demo-en.json`,
company MedSecure, loadable from *Settings → Load demonstration*), or build a
small fictional example from the application.
