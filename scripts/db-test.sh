#!/usr/bin/env bash
# Runs the database tests against the local Supabase stack (npx supabase start).
set -euo pipefail
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
for f in "$(dirname "$0")"/../supabase/tests/*.sql; do
  echo "== $f"
  psql "$DB_URL" -q -v ON_ERROR_STOP=1 -f "$f" -o /dev/null 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /  /'
done
