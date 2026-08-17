#!/bin/sh
# Run database migrations, then hand off to uvicorn.
#
# Fresh database (no alembic history): the app's create_all() at FastAPI
# startup builds the full current schema, so alembic is only STAMPED at
# head — running the migrations from zero would fail because some of them
# assume a pre-existing schema. Existing database: pending migrations are
# applied normally.
set -e

if [ -n "$DATABASE_URL" ]; then
    # Wait until the database accepts connections.
    tries=0
    until alembic current >/dev/null 2>&1; do
        tries=$((tries + 1))
        if [ "$tries" -ge 30 ]; then
            echo "[entrypoint] database unreachable after 60s — aborting"
            exit 1
        fi
        echo "[entrypoint] waiting for database... ($tries)"
        sleep 2
    done

    if [ -z "$(alembic current 2>/dev/null)" ]; then
        echo "[entrypoint] fresh database — stamping alembic at head (create_all builds the schema)"
        alembic stamp head
    else
        echo "[entrypoint] existing database — applying pending migrations"
        alembic upgrade head
    fi
fi

exec python -m uvicorn src.main:app --host 0.0.0.0 --port 8080
