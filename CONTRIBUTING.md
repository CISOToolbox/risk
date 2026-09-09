# Contributing to CISO Toolbox - Risk

Thanks for taking the time to contribute. A few things about this repository
are unusual, so please read this before opening a pull request.

## Generated files

Some files in this repository are generated and must not be edited here — the
next release overwrites them and the change is lost. They carry a header that
says so ("Generated file - do not edit"):

| Category | Where | Editable here? |
|----------|-------|----------------|
| Module code | `src/`, `alembic/`, `app/ts/`, `app/index.html`, `Dockerfile`, `docker-compose.yml` | **Yes** |
| Shared Python helpers | `src/*_common.py`, `src/ssrf_guard.py`, `src/default_project.py` | **No** |
| Generated frontend assets | `app/js/*.js` and `app/css/*.css` carrying the generated-file header | **No** |

The shared Python helpers (`auth_common.py`, `ai_proxy_common.py`, `directory_common.py`, `upload_common.py`, `connectors_common.py`, `csv_common.py`, `evidence_common.py`, `mailer_common.py`, `default_project.py` and `ssrf_guard.py`) are identical in every CISO Toolbox
module on purpose: a fix that lands in one module only is exactly the class of
bug they exist to prevent. The shared frontend (design system, i18n runtime,
common widgets) is compiled once and shipped into `app/js/` and `app/css/`.
Module-specific TypeScript lives in `app/ts/` and **is** editable; a file in
`app/js/` without the header is module-specific build output.

**To change a generated file, open an issue describing the change**: it is
applied at the source and reaches every module in the next release. One of the
end-to-end tests asserts that the shared frontend assets still carry their
header, so a hand-edit is caught before it is silently lost.

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
