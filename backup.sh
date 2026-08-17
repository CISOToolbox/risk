#!/usr/bin/env bash
# Sauvegarde de la base risk (déploiement standalone) — dump logique
# compressé + rotation. Conçu pour le cron / systemd-timer :
#   0 2 * * *  cd /path/to/risk && ./backup.sh
# Exemple d'unité systemd (timer) en bas de STANDALONE.md.
#
# RPO = fréquence d'exécution. Besoin d'un retour à la seconde, de
# restore-tests automatiques et d'une UI de restauration ? C'est la suite
# CISO Toolbox (voir README).
set -euo pipefail

MODULE="risk"
DIR="./backups"
KEEP=14
while [ $# -gt 0 ]; do
    case "$1" in
        --dir)  DIR="$2"; shift 2 ;;
        --keep) KEEP="$2"; shift 2 ;;
        *) echo "usage: $0 [--dir DIR] [--keep N]" >&2; exit 2 ;;
    esac
done

mkdir -p "$DIR"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="$DIR/${MODULE}_${STAMP}.sql.gz"

# -T : pas de TTY (cron). Le dump passe par le conteneur db du compose.
docker compose exec -T "${MODULE}-db" pg_dump -U "$MODULE" "$MODULE" | gzip > "$OUT"

# Un dump vide signale un problème (mauvais service, base absente).
if [ ! -s "$OUT" ] || [ "$(stat -c%s "$OUT")" -lt 200 ]; then
    echo "ERREUR: dump vide ou suspect ($OUT)" >&2
    exit 1
fi
echo "OK: $OUT ($(du -h "$OUT" | cut -f1))"

# Rotation : conserver les $KEEP plus récents.
ls -1t "$DIR/${MODULE}_"*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    rm -f "$old" && echo "rotation: $old supprimé"
done
