# Risk (EBIOS RM) — standalone

Single-module deployment. Runs without Pilot or other backend modules.

For the integrated governance suite (with Pilot's consolidated action plan and single sign-on), see the CISO Toolbox suite repository.

## Run

```bash
cp .env.example .env
# edit .env — every variable is documented there
docker compose up -d
```

Available on http://localhost:8085

## Security

### Sessions

This module issues **and** verifies its own sessions — there is no Pilot here.
`JWT_SECRET` is a **root secret, not a signing key**: the actual key is derived
from it at startup with HKDF-SHA256, using the token audience as the info
string:

```
key = HKDF(JWT_SECRET, salt="ciso-suite/jwt-key/v1", info="ciso-module:risk")
```

and tokens carry `iss=ciso-risk` / `aud=ciso-module:risk`. A session minted by
any other module — another standalone deployment that happens to share the
secret, or a suite module — fails both audience *and* signature verification
here.

`MODULE_NAME=risk` in `docker-compose.yml` is what selects that key and that
audience. Do not remove it: without it every standalone module collapses onto
the same `ciso-module:module` key, which is exactly the cross-module replay the
derivation exists to prevent. `MODULE_COOKIE=risk_token` likewise keeps the
cookie distinct — cookies are not port-scoped, so several modules served from
`localhost` would otherwise overwrite each other's session.

Changing `JWT_SECRET` rotates the key and logs everyone out.

### Session cookie

The cookie is `Secure` **by default**. It is only sent over plain HTTP when
`APP_URL` explicitly starts with `http://` — an empty or malformed value fails
secure instead of silently downgrading the session.

### Login

`AUTH_MODE=standalone` (the default in `docker-compose.yml`) enables the local
token login: `AUTH_TOKEN` is the shared bootstrap secret, the first account
that uses it becomes admin, later ones are plain users an admin promotes.
OAuth/OIDC providers can be configured on top — see `.env.example`.

`AUTH_MODE=none` disables authentication entirely and serves every route as
admin. Dev/test only. It is the **only** way to run without a credential: in
any other mode an empty credential stops the app at boot instead of silently
opening it up.

## Backup & restore

Standalone deployments use a **system-level** backup: a scheduled logical
dump of the PostgreSQL database plus a documented restore procedure. No
extra container, no daemon.

```bash
# Manual backup (compressed dump + rotation, default keep=14)
./backup.sh                      # → backups/risk_<date>.sql.gz
./backup.sh --dir /srv/backups --keep 30

# Scheduled (cron) — daily at 02:00
0 2 * * *  cd /path/to/risk && ./backup.sh >> backups/backup.log 2>&1

# Restore (typed confirmation; takes a safety dump of the CURRENT state
# first, stops the app during the reload, checks /api/health after)
./restore.sh backups/risk_2026-08-13_0200.sql.gz
```

Notes:

- **RPO = your backup frequency** (daily by default). If you need
  point-in-time restore (to the second), automatic restore-tests and a
  restore UI, that is what the CISO Toolbox **suite** provides (pgBackRest
  + Pilot) — see the suite repository.
- A dump taken on an **older** application version restores fine (Alembic
  migrations replay at app start). Never restore a dump from a **newer**
  version than the running code — upgrade the app first (check
  `/api/version`).
- Volume snapshots of `risk-db-data` (VM/SAN level) also work as a
  coarse alternative, but prefer the logical dump: it is portable across
  PostgreSQL major versions and easy to verify.
- The application's own JSON export/import remains a second, portable
  safety net — those files also import into the suite.

Systemd timer alternative to cron:

```ini
# /etc/systemd/system/risk-backup.service
[Service]
Type=oneshot
WorkingDirectory=/path/to/risk
ExecStart=/path/to/risk/backup.sh

# /etc/systemd/system/risk-backup.timer
[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
[Install]
WantedBy=timers.target
```
