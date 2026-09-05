#!/usr/bin/env bash
# Restore the risk database (standalone) from a backup.sh dump.
#   ./restore.sh backups/risk_2026-08-13_0200.sql.gz
#
# WARNING: replaces the WHOLE database. The application is stopped during
# the operation. A safety dump of the current state is taken beforehand.
set -euo pipefail

MODULE="risk"
DUMP="${1:?usage: $0 <backups/...sql.gz>}"
[ -f "$DUMP" ] || { echo "ERREUR: $DUMP introuvable" >&2; exit 1; }

echo "Ce dump va REMPLACER la base '$MODULE'."
read -r -p "Tapez le nom du module ($MODULE) pour confirmer : " CONFIRM
[ "$CONFIRM" = "$MODULE" ] || { echo "Annulé."; exit 1; }

# 1. Safety dump of the CURRENT state (the undo for this restore).
SAFETY="backups/${MODULE}_pre-restore_$(date +%Y-%m-%d_%H%M).sql.gz"
mkdir -p backups
docker compose exec -T "${MODULE}-db" pg_dump -U "$MODULE" "$MODULE" | gzip > "$SAFETY"
echo "Sauvegarde de sécurité : $SAFETY"

# 2. Stop the app (the database stays up).
docker compose stop "${MODULE}-app"

# 3. Drop/create + reload.
# Two separate commands: DROP DATABASE refuses to run inside the implicit
# transaction of a multi-statement -c.
docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d postgres \
    -c "DROP DATABASE ${MODULE} WITH (FORCE);"
docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d postgres \
    -c "CREATE DATABASE ${MODULE} OWNER ${MODULE};"
gunzip -c "$DUMP" | docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d "$MODULE" -v ON_ERROR_STOP=1 -q

# 4. Restart — the docker-entrypoint replays `alembic upgrade head` if the
#    dump comes from an earlier schema (FEAT-29: a dump produced by a NEWER
#    version than the code must be refused — update the application
#    first).
docker compose start "${MODULE}-app"

# 5. Verification.
sleep 5
for i in $(seq 1 12); do
    if docker compose exec -T "${MODULE}-app" python3 -c \
        "import urllib.request;urllib.request.urlopen('http://localhost:8080/api/health',timeout=3)" 2>/dev/null; then
        echo "OK — application saine. Vérifiez /api/version (révision de schéma) puis vos données."
        exit 0
    fi
    sleep 5
done
echo "ATTENTION: l'application ne répond pas encore — consultez ses logs (docker compose logs ${MODULE}-app)." >&2
exit 1
