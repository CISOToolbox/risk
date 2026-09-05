#!/usr/bin/env bash
# Back up the risk database (standalone deployment) — compressed logical
# dump + rotation. Designed for cron / a systemd timer:
#   0 2 * * *  cd /path/to/risk && ./backup.sh
# Example systemd unit (timer) at the bottom of STANDALONE.md.
#
# RPO = how often it runs. Need second-level recovery, automatic restore
# tests and a restore UI? That is the CISO Toolbox suite (see README).
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

# -T: no TTY (cron). The dump goes through the compose db container.
docker compose exec -T "${MODULE}-db" pg_dump -U "$MODULE" "$MODULE" | gzip > "$OUT"

# An empty dump signals a problem (wrong service, missing database).
if [ ! -s "$OUT" ] || [ "$(stat -c%s "$OUT")" -lt 200 ]; then
    echo "ERREUR: dump vide ou suspect ($OUT)" >&2
    exit 1
fi
echo "OK: $OUT ($(du -h "$OUT" | cut -f1))"

# Rotation: keep the $KEEP most recent ones.
ls -1t "$DIR/${MODULE}_"*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    rm -f "$old" && echo "rotation: $old supprimé"
done
