#!/usr/bin/env bash
# Starts the mock Supabase + mock OpenAI + the production app, runs scripts/verify-ai.mjs, stops everything. Needs `npm run e2e:build` first.
set -u
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
ln -s "$PWD/scripts/mock-supabase-server.mjs" "$OUT/bb-sb.mjs"; ln -s "$PWD/scripts/mock-openai-server.mjs" "$OUT/bb-oai.mjs"
node "$OUT/bb-sb.mjs" 5998 >/dev/null 2>&1 & P1=$!
node "$OUT/bb-oai.mjs" 5999 >/dev/null 2>&1 & P2=$!
PUBLIC_FORM_HOURLY_CAP=40 OPENAI_BASE_URL=http://127.0.0.1:5999/v1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:5998 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key SUPABASE_SERVICE_ROLE_KEY=service-role-test-key KEY_ENCRYPTION_SECRET=$(openssl rand -base64 32) node scripts/e2e-app-server.mjs 5240 >/dev/null 2>&1 & P3=$!
for i in $(seq 1 60); do curl -s -o /dev/null localhost:5240/api/models && break; sleep 1; done
node scripts/verify-ai.mjs http://127.0.0.1:5240 http://127.0.0.1:5999 http://127.0.0.1:5998 | tee "$OUT/va.out"
CODE=${PIPESTATUS[0]}
kill $P1 $P2 $P3 2>/dev/null
echo "pass=$(grep -c '^PASS' "$OUT/va.out") fail=$(grep -c '^FAIL' "$OUT/va.out")"
exit $CODE
