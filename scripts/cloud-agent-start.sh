#!/usr/bin/env bash
# Per-boot: Postgres online + local DB/user + schema/guest seed.
set -euo pipefail

cd "$(dirname "$0")/.."

if command -v pg_lsclusters >/dev/null 2>&1; then
  if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    sudo service postgresql start 2>/dev/null || sudo pg_ctlcluster 16 main start 2>/dev/null || true
  fi
fi

for _ in $(seq 1 20); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null 2>&1 || true
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='internet_bank'" | grep -q 1 \
    || sudo -u postgres createdb internet_bank
fi

if [[ -f .env.local ]]; then
  npx tsx --env-file=.env.local scripts/ensure-db.ts || true
fi

echo "[cloud-agent-start] ready"
