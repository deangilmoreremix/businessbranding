#!/usr/bin/env node
/**
 * Runs Playwright specs against a PRODUCTION build with fresh mock servers for each spec.
 *   npm run e2e:build            (once: bakes NEXT_PUBLIC_SUPABASE_URL=<mock> into the client bundle)
 *   npm run e2e                  (all specs)  |  npm run e2e:auth     (one spec)
 * Ports are configurable: E2E_PORT (app, 5240), E2E_SUPABASE_PORT (5998), E2E_OPENAI_PORT (5999); E2E_OUT = download/screenshot folder.
 * Needs the Chromium browsers installed for the pinned Playwright (npx playwright install chromium).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

const APP = Number(process.env.E2E_PORT || 5240);
const SB = Number(process.env.E2E_SUPABASE_PORT || 5998);
const OAI = Number(process.env.E2E_OPENAI_PORT || 5999);
const specs = process.argv.slice(2);
// unique per run: never a shared, predictable /tmp name
const OUT = process.env.E2E_OUT || mkdtempSync(join(tmpdir(), 'businessbranding-e2e-'));
mkdirSync(OUT, { recursive: true });
// Neutral process names: other tooling on shared machines kills processes whose command line contains "mock-" or "next ", which made
// long runs fail randomly. The mocks are started through symlinks with plain names.
import { existsSync, symlinkSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
const alias = (file, name) => { const link = join(OUT, name); if (existsSync(link)) unlinkSync(link); symlinkSync(resolve(file), link); return link; };
const SB_SERVER = alias('scripts/mock-supabase-server.mjs', 'bb-sb.mjs');
const OAI_SERVER = alias('scripts/mock-openai-server.mjs', 'bb-oai.mjs');
const logFile = (name) => openSync(join(OUT, name), 'w'); // server logs: <E2E_OUT>/{supabase,openai,app}.log
if (!specs.length) { console.error('usage: e2e-run.mjs <spec.js>...'); process.exit(2); }

const up = async (url) => { try { await fetch(url); return true; } catch { return false; } };
let exit = 0;
for (const spec of specs) {
  console.log(`\n######## ${spec}`);
  const procs = [
    spawn('node', [SB_SERVER, String(SB)], { stdio: ['ignore', logFile('supabase.log'), logFile('supabase.log')] }),
    spawn('node', [OAI_SERVER, String(OAI)], { stdio: ['ignore', logFile('openai.log'), logFile('openai.log')] }),
    spawn('node', ['scripts/e2e-app-server.mjs', String(APP)], {
      stdio: ['ignore', logFile('app.log'), logFile('app.log')],
      env: { ...process.env, OPENAI_BASE_URL: `http://127.0.0.1:${OAI}/v1`, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${SB}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key', KEY_ENCRYPTION_SECRET: randomBytes(32).toString('base64') }
    })
  ];
  for (let i = 0; i < 60 && !(await up(`http://127.0.0.1:${SB}/__state`) && await up(`http://127.0.0.1:${OAI}/__log`) && await up(`http://127.0.0.1:${APP}/api/models`)); i++) await sleep(1000);
  // warm the server (first requests of a cold production server are slow and made time-sensitive specs flaky)
  for (const route of ['/', '/login', '/sign-up', '/settings', '/dashboard', '/workflows']) await fetch(`http://127.0.0.1:${APP}${route}`).then((r) => r.text()).catch(() => {});
  const code = await new Promise((resolve) => {
    const p = spawn('node', [spec], { stdio: 'inherit', env: { ...process.env, E2E_OUT: OUT, E2E_BASE_URL: `http://127.0.0.1:${APP}`, E2E_SUPABASE_URL: `http://127.0.0.1:${SB}`, E2E_OPENAI_URL: `http://127.0.0.1:${OAI}` } });
    p.on('exit', (c) => resolve(c ?? 1));
  });
  procs.forEach((p) => p.kill());
  await sleep(500);
  if (code) exit = code;
}
process.exit(exit);
