# CISO Toolbox - Risk (standalone)

EBIOS RM risk analysis: business values, feared events, strategic and operational scenarios, MITRE ATT&CK phases, risk matrix, treatment measures.

This repository is the **standalone** packaging of the Risk module: one
`docker compose up` brings up the module and its database, with its own login.
It runs on its own - no Pilot, no reverse proxy, no other module required.

Part of the [CISO Toolbox](https://cisotoolbox.org) suite. The integrated
multi-module deployment (Pilot SSO + nginx + every module behind a single
domain) lives in the CISO Toolbox suite repository.
Prefer **no server at all**? This repo also ships the module as a
browser-only webapp (see [`webapp/`](./webapp/) and *One repository, two
versions* below), hosted at <https://risk.cisotoolbox.org> — data never leaves your browser.

## One repository, two versions

This repository ships the same module in two forms. **The features and the
data format are the same** — a JSON file exported from one can be opened in
the other — what changes is where your data lives and who can work on it.

| | Browser-only webapp ([`webapp/`](./webapp/)) | Standalone backend (this directory) |
|---|---|---|
| Install | None — open the hosted page or serve the static files | `docker compose up -d` |
| Data | **Never leaves your browser**: localStorage autosave + JSON file export (optional AES-256 encryption) | PostgreSQL on your server, automatic persistence |
| Accounts | None | Login, roles, per-user permissions |
| Collaboration | One person at a time (share the JSON file) | Multi-user, concurrent |
| API | None | Full REST API |
| Backups | Your exported files | Scheduled dumps + restore scripts |
| Upgrade path | Export JSON → import into the standalone or the suite | Join the suite later (same backend) |

**Choose the webapp** when you work alone or want zero infrastructure and
total data sovereignty: nothing is ever sent to a server, which makes it
ideal for a quick evaluation, a consultant working on a client's data, or
an air-gapped context. **Choose the standalone backend** when a team needs
a shared, durable store with accounts, concurrent editing, an API, and
server-side backups — or as a stepping stone to the full suite.

## What you get

- **EBIOS RM end to end**: business values & supporting assets, feared
  events, risk sources, strategic and operational scenarios (with MITRE
  ATT&CK phases), gravity/likelihood scales, risk matrix and residual risk.
- **Treatment plan**: security measures with owner, due date and status,
  plus ANSSI and ISO 27002 baseline catalogues to bootstrap the plan.
- **Catalogues & search**: reusable catalogues (risk sources, feared events…)
  with full-text search.
- **AI assistant** (optional): scenario and measure suggestions grounded in
  the EBIOS RM method — bring your own Anthropic / OpenAI / compatible key.
- **Interoperable data**: JSON import/export compatible with the browser-only
  app; MedSecure demo dataset included.

## Requirements

- Docker Engine 24+ (or Podman 4+) with the Compose plugin
- ~2 GB RAM and 2 CPU for a single-module stack
- **Disk**: a Docker volume for the PostgreSQL data directory
- Python 3.11+ and `pytest` **only** if you want to run the end-to-end tests
  from the host

## Install and run

```bash
cp .env.example .env
# Edit .env - every variable is documented inline.
# Generate each secret separately:  openssl rand -hex 32
docker compose up -d
```

The module is then served on <http://localhost:8085>.

Database migrations (Alembic) run automatically at container start.

```bash
docker compose logs -f          # follow the logs
docker compose down             # stop
docker compose down -v          # stop and DESTROY the data volume
```

## Authentication

`AUTH_MODE=standalone` (the default in `docker-compose.yml`) enables the local
token login. `AUTH_TOKEN` is the bootstrap secret: the **first** account that
uses it becomes admin, later ones are plain users an admin promotes. OAuth /
OIDC providers can be layered on top - see `.env.example`.

`AUTH_MODE=none` disables authentication entirely and serves every route as
admin. **Development and test only.** It is the only way to run without a
credential: in any other mode an empty credential stops the app at boot rather
than silently opening it up.

Sessions are issued **and** verified by this module alone. `JWT_SECRET` is a
*root secret, not a signing key*: the actual key is derived at startup with

```
key = HKDF-SHA256(JWT_SECRET, salt="ciso-suite/jwt-key/v1", info="ciso-module:risk")
```

and tokens carry `iss=ciso-risk` / `aud=ciso-module:risk`. A session minted by
any other module - another standalone deployment sharing the same secret, or a
suite module - fails both the audience *and* the signature check here.
`MODULE_NAME=risk` and `MODULE_COOKIE=risk_token` in `docker-compose.yml` are
what select that key and keep the cookie distinct; **do not remove them**.

The session cookie is `Secure` by default. It is only sent over plain HTTP when
`APP_URL` explicitly starts with `http://` - an empty or malformed value fails
secure rather than silently downgrading the session.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | yes | Root secret, min 32 chars. Never signs anything directly (see above). |
| `DB_PASSWORD` | yes | PostgreSQL password. |
| `APP_URL` | yes | Public URL of the deployment. Also decides the `Secure` cookie flag. |
| `AUTH_MODE` | no | `standalone` for a local deploy. `none` disables authentication (dev only). |
| `AUTH_TOKEN` | yes | Bootstrap secret for the standalone login endpoint. |

The full list, with comments, is in `.env.example`. Runtime settings (AI
assistant, SMTP, integrations) are configured in the UI and persisted in the
database - environment variables are for deploy-time bootstrap only.

Deeper operational and security notes: [`STANDALONE.md`](./STANDALONE.md).

## Languages

**English (default)** and **French** both ship in the image; the UI opens in
the browser's language when available and users can switch at runtime (globe
icon, per-browser persistence). Missing translations fall back to English.

## Tests

End-to-end tests live in [`tests/e2e/`](./tests/e2e/) and drive a real running
stack over HTTP (standard library only, no browser required):

```bash
bash tests/e2e/run-e2e.sh          # up -> test -> down
```

See [`tests/e2e/README.md`](./tests/e2e/README.md) for running against an
instance you already started, and for the environment variables involved.

Dependency pins are checked against `constraints.txt`:

```bash
bash tests/check-deps-drift.sh
```

## Contributing

Part of this repository is **replicated** from a private shared repository and
must not be edited here - read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before
opening a pull request.

## Security

Please report vulnerabilities privately - see [`SECURITY.md`](./SECURITY.md).
Do not open a public issue for a security problem.

## License

See [`LICENSE`](./LICENSE).

> **Not settled yet.** The sources this repository was assembled from
> contradict each other (an MIT `LICENSE` file, READMEs announcing MIT).
> [`LICENSE.TODO`](./LICENSE.TODO) states the conflict; it must be resolved
> before this repository is published.
