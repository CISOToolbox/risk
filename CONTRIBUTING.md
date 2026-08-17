# Contributing to CISO Toolbox - Risk

Thanks for taking the time to contribute. A few things about this repository
are unusual, so please read this before opening a pull request.

## This repository is partly replicated and partly generated

Risk is developed in a private monorepo and published here. Three categories
of file coexist:

| Category | Where | Editable here? |
|----------|-------|----------------|
| Module code | `src/`, `alembic/`, `app/ts/`, `app/index.html`, `Dockerfile`, `docker-compose.yml` | **Yes** |
| Replicated Python helpers | `src/*_common.py`, `src/ssrf_guard.py`, `src/default_project.py` | **No** |
| Generated frontend assets | `app/js/*.js` and `app/css/*.css` carrying a `GENERATED` header | **No** |

### Replicated Python helpers

Files such as `auth_common.py`, `ai_proxy_common.py`, `directory_common.py`,
`upload_common.py`, `connectors_common.py`, `csv_common.py`,
`evidence_common.py`, `mailer_common.py`, `default_project.py` and
`ssrf_guard.py` are **verbatim copies** of a single master kept in the private
shared repository (`shared/python/`). Each one carries this banner:

```
# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/<name>).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# -----------------------------------------------------------------------------
```

Every module ships the same copy. A patch applied here would be silently
reverted on the next propagation *and* would leave the other modules unfixed -
which is exactly the class of bug (a fix landing in one module only) the shared
master exists to prevent. **Open an issue describing the change instead**, and
it will be applied to the master and propagated to every module at once.

### Generated frontend assets

`shared/ts-build.sh` in the private monorepo compiles the shared TypeScript
sources (`shared/ts/`) and the shared stylesheets (`shared/css/`) once, then
distributes the emitted `.js` / `.css` into each module's `app/js/` and
`app/css/`, prefixing each file with:

```
// -------------------------------------------------------------
// GENERATED from shared/ts/ - do NOT edit here.
// Edit the shared TypeScript source and run shared/ts-build.sh.
// -------------------------------------------------------------
```

(the stylesheet variant reads `GENERATED from shared/css/`). Same rule: the
build is the single writer of those files.

Module-specific TypeScript lives in `app/ts/` and **is** editable - it is
compiled in place into `app/js/`. A file in `app/js/` without a `GENERATED`
header is module-specific build output, not a shared asset.

### Why two different banners

`GENERATED` marks build output, `REPLICATED` marks a verbatim copy. The wording
differs because the mechanisms differ, and the `GENERATED` banner is emitted by
the existing build script - it is left exactly as the build writes it so the
build is not broken. In both cases the practical rule is identical: **the file
is overwritten on the next run, so do not edit it here.**

One of the end-to-end tests asserts that the shared frontend assets still carry
their `GENERATED` header, so a hand-edit is caught before it is silently lost.

## Development

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f
```

The module answers on <http://localhost:8085>.

## Before opening a pull request

```bash
# 1. Python syntax
python3 -m compileall -q src

# 2. Lint (if you have ruff)
ruff check src

# 3. Dependency pins stay aligned with constraints.txt
bash tests/check-deps-drift.sh
#    DRIFT and UNPINNED are failures. LOOSE and STALE are warnings:
#    constraints.txt is a verbatim copy of the suite-wide file, so it pins
#    packages that no requirements file in *this* repository uses.

# 4. Known vulnerabilities
osv-scanner --recursive .
pip-audit -r requirements.txt

# 5. End-to-end tests against a real stack
bash tests/e2e/run-e2e.sh
```

## Dependencies

- Pin exact versions (`==`) in `requirements*.txt`.
- Any new shared package must also be pinned in `constraints.txt`, at the same
  version as in the other modules.
- Justify new dependencies in the pull request description: what it does, why
  the standard library is not enough, and how actively it is maintained.

## Commit messages

Conventional commits - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
`chore:`, `perf:`, `build:`. One concern per commit.

## Security issues

Do **not** open a public issue or pull request for a vulnerability. Follow
[`SECURITY.md`](./SECURITY.md).

## License

By contributing you agree that your contribution is licensed under the licence
of this repository (see [`LICENSE`](./LICENSE)).

> The licence is **not settled yet** — see [`LICENSE.TODO`](./LICENSE.TODO).
> Please do not send a substantial contribution until it is.
