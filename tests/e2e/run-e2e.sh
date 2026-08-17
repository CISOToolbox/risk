#!/usr/bin/env bash
# -----------------------------------------------------------------------------
#  run-e2e.sh - end-to-end tests for the Risk standalone deployment
# -----------------------------------------------------------------------------
#
#  Brings the Compose stack up, waits for it to answer healthy, runs the tests
#  against it, then tears it down.
#
#  Usage:
#      bash tests/e2e/run-e2e.sh              # up -> test -> down
#      bash tests/e2e/run-e2e.sh --keep       # leave the stack running
#      bash tests/e2e/run-e2e.sh --no-up      # test an already running instance
#
#  Environment:
#      E2E_BASE_URL     default http://localhost:8085
#      E2E_AUTH_TOKEN   defaults to AUTH_TOKEN read from ./.env
#      COMPOSE          "docker compose" or "podman-compose" (auto-detected)
#
#  Exit code: 0 = green, non-zero = a test failed or the stack never booted.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
BASE_URL="${E2E_BASE_URL:-http://localhost:8085}"
KEEP=0
DO_UP=1
for arg in "$@"; do
    case "$arg" in
        --keep)  KEEP=1 ;;
        --no-up) DO_UP=0; KEEP=1 ;;
        *) echo "unknown option: $arg" >&2; exit 2 ;;
    esac
done

command -v python3 >/dev/null || { echo "ERROR: python3 is required" >&2; exit 2; }
python3 -c 'import pytest' 2>/dev/null || {
    echo "ERROR: pytest is required - pip install pytest (no other dependency needed)" >&2
    exit 2
}

if [ -n "${COMPOSE:-}" ]; then
    :
elif docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v podman-compose >/dev/null 2>&1; then
    COMPOSE="podman-compose"
else
    COMPOSE=""
fi

cleanup() {
    if [ "$DO_UP" = "1" ] && [ "$KEEP" = "0" ] && [ -n "$COMPOSE" ]; then
        echo "== tearing the stack down"
        (cd "$REPO_ROOT" && $COMPOSE down -v >/dev/null 2>&1) || true
    fi
}
trap cleanup EXIT

if [ "$DO_UP" = "1" ]; then
    [ -n "$COMPOSE" ] || { echo "ERROR: no docker compose / podman-compose found" >&2; exit 2; }
    [ -f "$REPO_ROOT/.env" ] || {
        echo "ERROR: $REPO_ROOT/.env is missing - copy .env.example and fill it in" >&2
        exit 2
    }
    echo "== starting the Risk stack"
    (cd "$REPO_ROOT" && $COMPOSE up -d --build)
fi

echo "== waiting for $BASE_URL/api/health"
for _ in $(seq 1 60); do
    if python3 - "$BASE_URL" <<'PY' 2>/dev/null
import ssl, sys, urllib.request
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
urllib.request.urlopen(sys.argv[1].rstrip("/") + "/api/health", timeout=5, context=ctx)
PY
    then
        echo "   healthy"
        break
    fi
    sleep 2
done

echo "== running the end-to-end tests"
cd "$HERE"
E2E_BASE_URL="$BASE_URL" python3 -m pytest -v .
