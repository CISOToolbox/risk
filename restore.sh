#!/usr/bin/env bash
# Restauration de la base risk (standalone) depuis un dump backup.sh.
#   ./restore.sh backups/risk_2026-08-13_0200.sql.gz
#
# ATTENTION : remplace TOUTE la base. L'application est arrêtée pendant
# l'opération. Un dump de sécurité de l'état actuel est pris avant.
set -euo pipefail

MODULE="risk"
DUMP="${1:?usage: $0 <backups/...sql.gz>}"
[ -f "$DUMP" ] || { echo "ERREUR: $DUMP introuvable" >&2; exit 1; }

echo "Ce dump va REMPLACER la base '$MODULE'."
read -r -p "Tapez le nom du module ($MODULE) pour confirmer : " CONFIRM
[ "$CONFIRM" = "$MODULE" ] || { echo "Annulé."; exit 1; }

# 1. Dump de sécurité de l'état ACTUEL (l'annulation de la restauration).
SAFETY="backups/${MODULE}_pre-restore_$(date +%Y-%m-%d_%H%M).sql.gz"
mkdir -p backups
docker compose exec -T "${MODULE}-db" pg_dump -U "$MODULE" "$MODULE" | gzip > "$SAFETY"
echo "Sauvegarde de sécurité : $SAFETY"

# 2. Arrêt de l'app (la base reste up).
docker compose stop "${MODULE}-app"

# 3. Drop/create + rechargement.
# Deux commandes séparées : DROP DATABASE refuse de tourner dans la
# transaction implicite d'un -c multi-ordres.
docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d postgres \
    -c "DROP DATABASE ${MODULE} WITH (FORCE);"
docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d postgres \
    -c "CREATE DATABASE ${MODULE} OWNER ${MODULE};"
gunzip -c "$DUMP" | docker compose exec -T "${MODULE}-db" psql -U "$MODULE" -d "$MODULE" -v ON_ERROR_STOP=1 -q

# 4. Redémarrage — le docker-entrypoint rejoue `alembic upgrade head` si le
#    dump provient d'un schéma antérieur (FEAT-29 : un dump issu d'une
#    version PLUS RÉCENTE que le code doit être refusé — mettez d'abord
#    l'application à jour).
docker compose start "${MODULE}-app"

# 5. Vérification.
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
