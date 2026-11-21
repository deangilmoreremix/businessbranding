#!/usr/bin/env node
// Runs the Deno edge-function suite (scripts/verify-edge.ts) against fresh mock servers. Needs `deno` on PATH (or DENO=/path/to/deno).
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
const DENO = process.env.DENO || 'deno';
if (spawnSync(DENO, ['--version']).status !== 0) { console.error('deno not found (set DENO=/path/to/deno)'); process.exit(77); }
import net from 'node:net';
const freePort = () => new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const SB = Number(process.env.E2E_SUPABASE_PORT || await freePort()), OAI = Number(process.env.E2E_OPENAI_PORT || await freePort()); // free ports: parallel runs never collide
const mocks = [spawn('node', ['scripts/mock-supabase-server.mjs', String(SB)], { stdio: 'ignore' }), spawn('node', ['scripts/mock-openai-server.mjs', String(OAI)], { stdio: 'ignore' })];
await sleep(1500);
const r = spawnSync(DENO, ['run', '-A', '--import-map', 'scripts/deno-stubs/import_map.json', 'scripts/verify-edge.ts'], {
  stdio: 'inherit',
  env: { ...process.env, MOCK_OPENAI: `http://127.0.0.1:${OAI}`, OPENAI_BASE_URL: `http://127.0.0.1:${OAI}/v1`, SUPABASE_URL: `http://127.0.0.1:${SB}`, SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key', KEY_ENCRYPTION_SECRET: randomBytes(32).toString('base64') }
});
mocks.forEach((m) => m.kill());
process.exit(r.status ?? 1);
