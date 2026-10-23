# Changelog

Every release has its section here, written at release time from the
changes since the previous one and published as the GitHub release notes.

## 1.2.1 — 2026-10-23

### Fixed

- A composed character is dispatched once in the Firefox and Safari event order too (socle)
- A character composed with a dead key or an IME is dispatched once, complete (socle)

### Maintenance

- Socle composition dedup (propagation)

## 1.2.0 — 2026-10-20

### Added

- The AI assistant toggle and the module's AI provider in one section, fields usable once the assistant is on (settings)
- One Save button for every section, sections in an exclusive accordion, unsaved changes guarded (settings)
- Remove a provider's saved keys from the settings drawer (ai)
- The settings drawer lets a standalone module's admin set its AI provider, model and keys (ai)
- A standalone module runs its AI on its server, set by its admin; Pilot's in the suite (ai)
- The local account is shown fixed; without an identity provider the section says the module has one account (users)
- The module's key opens one local account, its admin; other accounts come from an identity provider (auth)
- One shared sign-in router for the nine backend modules — identity providers everywhere (auth)
- Users section in the settings of the backend modules (settings)
- User administration router for standalone modules — module roles, pending, disabled, last admin kept (users)
- Standalone accounts await approval, and their role is read from the module on every request (auth)
- Outbound proxy section in the settings of the backend modules (settings)
- The outbound proxy is settable in the module itself when Pilot is absent (proxy)
- SMTP settings in the standalone modules (shared)
- Redirect policy in the target dialog
- Export_proxy, for a proxy kept outside the proxy.* rows (Pilot's own) (shared)
- Distinguish "not assessed" from 0 in the criticality formula
- Refresh the AI model catalogue (ai)
- One SOP phase = one elementary action with exactly one ATT&CK technique, no 'or' alternatives
- W5 — trim contexts (eco, measures, residual), demand concrete measures over baseline restatements
- SOP uses the full study context (comments included) and demands concrete per-phase measures, not baseline restatements
- Forbid only downward (operational) drift in SS; allow broad groupings (several origins, unspecified target)
- Keep strategic scenarios at the business-asset level, not the hosting infrastructure or a product; trim context
- Explain the four PP threat criteria and their direction, trim the context
- Trim the study context in the SROV prompt
- Tailor the BS prompt — socle in context, cover uncovered VMs first, add cross-cutting assets, enumerated types
- Tailor the VM prompt — trimmed context, dedup on descriptions, adaptive count toward ~10, VM/BS guidance

### Fixed

- No multi-tenant Entra default — an unset tenant is empty, and the README says it is required (auth)
- A module menu opened before the module learns it is standalone is closed (chrome)
- A standalone module lists only itself in the module switcher (chrome)
- A given-up section drops its error; AI provider input typed while the assistant is off is discarded (settings)
- Every way out of the panel asks before unsaved edits go; one save at a time; a refused or declined change stays pending (settings)
- The module honours ALLOW_INSECURE_CUSTOM_LLM_ENDPOINT at call and at save (ai)
- AI settings are stored as they were checked (ai)
- Pilot's push is stored as Pilot checked it; a module admin's endpoint is checked as the call checks it; keys in clear without ENCRYPTION_KEY (ai)
- One email_verified rule for Google and OIDC; tests for OIDC and the account lock (auth)
- An address the identity provider has not verified is refused (auth)
- Only the key's own account is local; the key never revives an account; account creation serialised (auth)
- Every module's write journal records what a route says changed; one journal implementation
- A provider sign-in marks the account as the provider's; the token closes once such an admin exists (auth)
- A role change says what changed to the module's write journal (users)
- The last-admin guard locks the admin rows; one journal entry per change (users)
- A refused sign-in says why — awaiting approval, disabled, domain not allowed (login)
- Exact masking docstring; contract checks proxy_common never forces allow_private (proxy)
- Mask a token user name with an empty password, redact credentials in any case, contract reads the validator's AST (proxy)
- Mask a token-only proxy userinfo, keep credentials out of refusals, leave omitted fields as they are (proxy)
- The settings router reads proxy_common at call time (proxy)
- SMTP credentials from the environment never go to a host saved in the app (shared)
- SMTP host checked with ssrf_guard; an empty host clears the saved config (shared)
- SMTP settings help says what an empty host really does (shared)
- Honour hideAI in the managed settings drawer (shared)
- The custom LLM endpoint check follows the proxy, Watch's assistant reaches the custom LLM
- The AI agent reaches a custom LLM through the outbound proxy
- Status line errors are styled and stay long enough to read
- Pilot's proxy exempts every registry host once normalized, never '*' or a list, and the default modules even when the database is not ready
- A database not ready at start-up still leaves a readable NO_PROXY
- A database not ready at start-up still leaves a readable NO_PROXY (shared)
- A lowercase deployment proxy exempts the internal services too
- A lowercase deployment proxy exempts the internal services too (shared)
- An IPv6 range in the deployment's NO_PROXY is left out, it breaks httpx
- An IPv6 range in the deployment's NO_PROXY is left out, it breaks httpx (shared)
- APP_URL is not internal, a deployment's range is kept as written
- APP_URL is not internal, a deployment's range is kept as written (shared)
- The deployment's own proxy is the base Pilot overrides, never erased
- The deployment's own proxy is the base Pilot overrides, never erased (shared)
- A clear message for an IPv6 exception with a port
- A clear message for an IPv6 exception with a port (shared)
- Proxy exceptions take a port or an underscore, refuse ranges, log an unreadable one
- Proxy exceptions take a port or an underscore, refuse ranges, log an unreadable one (shared)
- Validate proxy exceptions, match ranges and wildcards, keep the deployment's NO_PROXY
- Validate proxy exceptions, match ranges and wildcards, keep the deployment's NO_PROXY (shared)
- Internal services bypass the pushed proxy, and an empty push clears a stale row
- Internal services bypass the pushed proxy, and an empty push clears a stale row (shared)
- Refuse a proxy value that is not one URL, and say when a stored one cannot be decrypted
- A proxy value is one URL, and an unreadable one is not announced restored (shared)
- Keep the pushed proxy across restarts, and let Pilot clear it
- Store the outbound proxy pushed by Pilot and restore it at start-up (shared)
- Store the custom LLM label sent with the AI keys (ai)
- Tolerate only the missing suite-only file
- Start without the suite-only routes
- Reposition modal dropdowns on scroll; drop audit webapp orphan (ui)
- Actions filter, project form and action modal UX
- Distinguish the most-severe level from the next on charts (ui)
- Remove a connector's dashboard footprint when its config is cleared
- Count "À étudier" measures as remaining work in the dashboards
- Exact-id BS coverage match and refresh a stale prompt comment
- Force every AI field (names/titles included) into the chosen language; translate the SOP card title
- The ER prompt passes the severity scale meaning in both modes (single and per-category)
- Scope the AI system prompt to the current workshop, fix the RO/OV relevance formula

### Changed

- The region check at save reuses _safe_bedrock_region (ai)
- One proxy URL validator in proxy_common, shared by the internal routes and Pilot (proxy)
- Drop pushed_proxy, the scanners no longer need it
- Drop pushed_proxy, the scanners no longer need it (shared)
- Drop bypasses_proxy, and read the deployment's NO_PROXY at start-up in the test
- Drop bypasses_proxy, only the scanners would use it (shared)

### Documentation

- What the shared token allows, translated refusals in the users section (users)

### Tests

- Every proxy_common copy, Pilot's included, passes allow_private on to ssrf_guard (contracts)
- Proxy exception refusals name the entry at fault
- A database not ready at start-up leaves a readable NO_PROXY, external URLs are not internal
- A restart starts from the stored rows, a lowercase deployment proxy exempts the internal services
- An IPv6 range in the deployment's NO_PROXY is left out, logged
- APP_URL is not internal, a deployment's range is kept, the shell's proxy never leaks in
- The deployment's own proxy is the base Pilot overrides, http_proxy covered too
- Proxy exceptions with a port or an underscore are kept, ranges are refused, an unreadable one is logged
- Proxy exceptions are validated, matched with ranges and wildcards, and the deployment's kept
- Internal services bypass the pushed proxy, a stale row clears, logs hold the host only
- A proxy value is one URL, and an unreadable one is not announced restored
- The pushed proxy is stored, restored at start-up and clearable

### Maintenance

- Proxy_common gains export_proxy (unused here)

## 1.1.2 — 2026-10-05

### Maintenance

- `constraints.txt` no longer pins semgrep (dropped with the AppSec Opengrep migration); the image content is unchanged.

## 1.1.1 — 2026-10-03

### Maintenance

- `constraints.txt` pins semgrep 1.179.0 and `tests/check-deps-drift.sh` no longer carries a PyJWT exception; the image content is unchanged.

## 1.1.0 — 2026-10-03

### Added

- A strategic scenario carries every feared event its path reaches and every risk-origin / target-objective pair it serves.
- An update by id shows what it replaces before it is accepted.

### Fixed

- The AI assistant fills what the screen holds and no longer re-proposes what the analyst set aside; strategic scenarios stay out of the kill chain.
- Operational-scenario controls read the baseline assessment; no untitled measures, and "accept all" never overwrites.
- The stakeholder category reaches the screen; the template tool reports in English.
- The AI audit report prompt is composed on the server.
- Forms lay out on the shared form grid and collapse to one column below 768 px; checkboxes sit on the line of their label.
- Muted text keeps AA contrast on every background; one shared signed-in user block in the toolbar.
- Picking a person closes the result list.
- Security updates: PyJWT 2.15.0 (GHSA-42vr-xj54-vc7v), anyio 4.14.2 (GHSA-82r6-8w77-94w6).

### Changed

- The image installs a complete dependency lock with hashes (`requirements-lock.txt`), transitive dependencies included; the unit tests run on that same lock.

### Documentation

- Comments and documentation point only at files shipped in this repository.
