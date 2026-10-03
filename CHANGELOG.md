# Changelog

Every release has its section here, written at release time from the
changes since the previous one and published as the GitHub release notes.

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
