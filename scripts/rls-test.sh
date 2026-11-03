#!/usr/bin/env bash
# Applies stubs + core migrations to a scratch Postgres DB, runs supabase/schema_rls_test.sql
# and diffs the result against supabase/rls_expected.txt. NEVER point this at Supabase.
# Usage: PGURL=postgres://postgres:postgres@localhost:5432/postgres scripts/rls-test.sh
set -euo pipefail
export PGOPTIONS="-c client_min_messages=warning"
cd "$(dirname "$0")/.."
: "${PGURL:?set PGURL to a scratch Postgres database}"
psql "$PGURL" -q -f supabase/test-stubs.sql >/dev/null 2>&1 || true
cat supabase/migrations/0001_*.sql supabase/migrations/0002_*.sql supabase/migrations/0004_*.sql supabase/migrations/0006_*.sql \
  | psql "$PGURL" -q -v ON_ERROR_STOP=1 >/dev/null
psql "$PGURL" -At -F' | ' -f supabase/schema_rls_test.sql 2>&1 \
  | grep -v -E '^(SET|RESET|INSERT|UPDATE 1)' | sed -E 's/^psql:[^:]+:[0-9]+: //' > /tmp/rls_actual.txt
if diff -u supabase/rls_expected.txt /tmp/rls_actual.txt; then echo "RLS test: all checks match expected"; else echo "RLS test: MISMATCH"; exit 1; fi
