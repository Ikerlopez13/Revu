#!/usr/bin/env bash
# Postgres local para desarrollo (Homebrew), en .devdb/ y puerto 5544.
# Primera vez: crea la BD, aplica migraciones y carga datos de prueba.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=5544
DIR=.devdb
export DATABASE_URL="postgres://postgres@localhost:${PORT}/revu"

PG_BIN="$(dirname "$(command -v pg_ctl || echo /opt/homebrew/opt/postgresql@14/bin/pg_ctl)")"
[ -x "$PG_BIN/pg_ctl" ] || { echo "Necesitas Postgres: brew install postgresql@14"; exit 1; }

first=0
if [ ! -d "$DIR" ]; then
  "$PG_BIN/initdb" -D "$DIR" -U postgres -A trust >/dev/null
  first=1
fi

if ! "$PG_BIN/pg_ctl" -D "$DIR" status >/dev/null 2>&1; then
  # Solo TCP: la ruta del socket Unix puede ser demasiado larga.
  "$PG_BIN/pg_ctl" -D "$DIR" -o "-p ${PORT} -k ''" -l "$DIR/postgres.log" -w start >/dev/null
fi

if [ "$first" = 1 ]; then
  "$PG_BIN/createdb" -h localhost -p "$PORT" -U postgres revu
fi

npx drizzle-kit migrate >/dev/null
if [ "$first" = 1 ]; then
  SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-lopezalegreiker@gmail.com}" SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-revutags-local}" npx tsx scripts/seed.mts
fi
echo "Postgres local listo en ${DATABASE_URL}"
