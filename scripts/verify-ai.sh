#!/usr/bin/env bash
# Starts the mock Supabase + mock OpenAI + the production app, runs scripts/verify-ai.mjs, stops everything. Needs `npm run e2e:build` first.
set -u
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
free_port() { node -e "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close()})"; }
APP=$(free_port); OAI=$(free_port)
SBP=${E2E_SUPABASE_PORT:-5998}
if ! node -e "const s=require('net').createServer();s.once('error',()=>process.exit(1));s.listen($SBP,'127.0.0.1',()=>s.close())"; then echo "port $SBP (mock Supabase, baked into the build) is in use"; exit 3; fi
ln -s "$PWD/scripts/mock-supabase-server.mjs" "$OUT/bb-sb.mjs"; ln -s "$PWD/scripts/mock-openai-server.mjs" "$OUT/bb-oai.mjs"
node "$OUT/bb-sb.mjs" $SBP >/dev/null 2>&1 & P1=$!
node "$OUT/bb-oai.mjs" $OAI >/dev/null 2>&1 & P2=$!
PUBLIC_FORM_HOURLY_CAP=40 OPENAI_BASE_URL=http://127.0.0.1:$OAI/v1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$SBP NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key SUPABASE_SERVICE_ROLE_KEY=service-role-test-key KEY_ENCRYPTION_SECRET=$(openssl rand -base64 32) node scripts/e2e-app-server.mjs $APP >/dev/null 2>&1 & P3=$!
for i in $(seq 1 60); do curl -s -o /dev/null 127.0.0.1:$APP/api/models && break; sleep 1; done
node scripts/verify-ai.mjs http://127.0.0.1:$APP http://127.0.0.1:$OAI http://127.0.0.1:$SBP | tee "$OUT/va.out"
CODE=${PIPESTATUS[0]}
kill $P1 $P2 $P3 2>/dev/null
echo "pass=$(grep -c '^PASS' "$OUT/va.out") fail=$(grep -c '^FAIL' "$OUT/va.out")"
exit $CODE
