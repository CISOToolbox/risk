# Security Policy

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for a security
problem.**

Report it privately through GitHub's private vulnerability reporting:
**Security -> Report a vulnerability** on this repository. That channel is
private between you and the maintainers and produces a tracked advisory.

If you cannot use that channel, write to **security@cisotoolbox.org**.

<!-- MAINTAINER: enable "Private vulnerability reporting" in the repository
     settings before publishing. -->

Please include:

- the affected version or commit, and the deployment mode (`AUTH_MODE`)
- a description of the impact
- reproduction steps or a proof of concept
- any suggested mitigation

### What to expect

| Stage | Target |
|-------|--------|
| Acknowledgement of your report | 5 business days |
| Initial assessment and severity | 10 business days |
| Fix or documented mitigation for high/critical issues | 90 days |

We follow **coordinated disclosure**: please give us a reasonable window to ship
a fix before publishing. We will credit you in the advisory unless you prefer to
remain anonymous.

## Supported versions

Only the latest released version of this repository receives security fixes.
There are no long-term-support branches.

## Scope

**In scope** - everything in this repository: the FastAPI backend (`src/`), the
frontend (`app/`), the database migrations (`alembic/`), the container image
(`Dockerfile`) and the deployment defaults (`docker-compose.yml`).

**Out of scope**

- Deployments running with `AUTH_MODE=none`. That mode disables authentication
  by design and is documented as development/test only.
- Findings that require the attacker to already control the host, the container
  runtime, or the `.env` file.
- Vulnerabilities in third-party dependencies with no exploitable path in this
  code - report those upstream. We track them with `osv-scanner` and
  `pip-audit`.
- Missing hardening headers on a deployment where the operator terminates TLS
  themselves.

## Security model of this module

- **Sessions are issued and verified by this module alone.** `JWT_SECRET` is a
  root secret and never signs anything directly: the signing key is
  `HKDF-SHA256(JWT_SECRET, salt="ciso-suite/jwt-key/v1", info="ciso-module:risk")`
  and tokens carry `aud=ciso-module:risk`. A token minted by another module -
  even one sharing the same `JWT_SECRET` - fails both the audience and the
  signature check here, and HKDF being one-way, this module's key reveals
  nothing about `JWT_SECRET`.
- **The session cookie is `Secure` by default** and is only sent over plain HTTP
  when `APP_URL` explicitly starts with `http://`. An empty or malformed value
  fails secure.
- **Fail-closed boot.** With its credential missing the module refuses to start
  rather than serving unauthenticated. `AUTH_MODE=none` is the single, explicit
  way to run without one.
- **SSRF guard.** Every outbound URL the module fetches on a user's behalf goes
  through `src/ssrf_guard.py`, which rejects loopback, link-local, cloud
  metadata and container-network addresses, and pins the resolved IP against DNS
  rebinding.

## Hardening checklist for operators

1. Generate every secret separately with `openssl rand -hex 32`. Never reuse a
   value across `JWT_SECRET`, `AUTH_TOKEN` and `DB_PASSWORD`.
2. Keep `.env` out of version control and `chmod 600`.
3. Serve the module over HTTPS and set `APP_URL` to the `https://` URL.
4. Do not expose the container port directly to the Internet - put a reverse
   proxy in front of it and restrict administrative access.
5. Keep the image up to date; migrations run automatically at start.
6. Back up the database volume before every upgrade.
