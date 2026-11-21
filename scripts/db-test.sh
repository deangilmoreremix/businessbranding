#!/usr/bin/env bash
# Real-Postgres test of every Supabase migration + row-level security + consume_rate_limit().
# Starts a throwaway cluster (no docker), stubs the Supabase scaffolding (roles, auth schema, auth.uid()), applies every
# migration in order, then runs scripts/db-test.sql with SET ROLE. Exits non-zero on any failure.
#   scripts/db-test.sh            (needs Postgres 16 binaries; set PGBIN if they are elsewhere)
set -uo pipefail
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${DB_TEST_PORT:-54329}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -x "$PGBIN/initdb" ] || { echo "SKIP: Postgres binaries not found at $PGBIN"; exit 77; }
TMP="$(mktemp -d)"
RUN_AS=""
if [ "$(id -u)" = "0" ]; then   # postgres refuses to run as root
  id postgres >/dev/null 2>&1 || { echo "need a non-root 'postgres' user"; exit 1; }
  chown postgres "$TMP"; chmod 755 "$TMP"
  RUN_AS="runuser -u postgres --"
fi
cleanup() { $RUN_AS "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1; rm -rf "$TMP"; }
trap cleanup EXIT
$RUN_AS "$PGBIN/initdb" -D "$TMP/data" -U postgres --auth=trust >/dev/null || exit 1
$RUN_AS "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/pg.log" -w start >/dev/null || { cat "$TMP/pg.log"; exit 1; }
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -d postgres -c "create database app" || exit 1
PSQL+=(-d app)

echo "== scaffolding"
"${PSQL[@]}" -f "$ROOT/scripts/db-supabase-stub.sql" || exit 1
echo "== migrations (first run)"
for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  if ! "${PSQL[@]}" -f "$f" >"$TMP/mig.out" 2>&1; then echo "FAIL migration $(basename "$f")"; cat "$TMP/mig.out"; exit 1; fi
  echo "  applied $(basename "$f")"
done
echo "== migrations (second run: every migration must be re-runnable)"
for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  if ! "${PSQL[@]}" -f "$f" >"$TMP/mig.out" 2>&1; then echo "FAIL re-running migration $(basename "$f")"; cat "$TMP/mig.out"; exit 1; fi
done
echo "  all $(ls "$ROOT"/supabase/migrations/*.sql | wc -l) migrations re-ran cleanly"
echo "== tests"
"${PSQL[@]}" -f "$ROOT/scripts/db-test.sql" 2>&1 | grep -v "^$" | tee "$TMP/test.out"
if ! grep -q "ALL DB CHECKS PASSED" "$TMP/test.out"; then echo "DB TESTS FAILED"; exit 1; fi
echo "DB TESTS PASSED"
