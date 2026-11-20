// Loads each AI edge function under Deno (remote imports stubbed) and calls its handler against the mock OpenAI server.
// BYOK: every function requires a Supabase session and uses the signed-in user's own stored OpenAI key (no global key).
//   node scripts/mock-openai-server.mjs 4999
//   node scripts/mock-supabase-server.mjs 4998
//   OPENAI_BASE_URL=http://127.0.0.1:4999/v1 SUPABASE_URL=http://127.0.0.1:4998 SUPABASE_SERVICE_ROLE_KEY=service-role-test-key \
//   KEY_ENCRYPTION_SECRET=$(openssl rand -base64 32) \
//     deno run -A --import-map scripts/deno-stubs/import_map.json scripts/verify-edge.ts
import { aadFor, encryptSecret, last4Of } from '../supabase/functions/_shared/key-crypto.ts';
import { upsertKeyRow } from '../supabase/functions/_shared/supabase-rest.ts';

const mock = 'http://127.0.0.1:4999';
const ALICE = '11111111-1111-4111-8111-111111111111';
const AUTH = { Authorization: 'Bearer tok-alice' };
const USER_KEY = 'sk-test';
{
  const enc = await encryptSecret(USER_KEY, Deno.env.get('KEY_ENCRYPTION_SECRET'), aadFor(ALICE, 'openai'));
  await upsertKeyRow(ALICE, { ...enc, last4: last4Of(USER_KEY) });
}
let failed = 0;
const ok = (n: string, c: boolean, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n} ${x}`); if (!c) failed++; };

let handler: (r: Request) => Promise<Response>;
(Deno as any).serve = (h: any) => { handler = h; };

async function call(fn: string, body: unknown, path = fn) {
  await import(`../supabase/functions/${fn}/index.ts?${Math.random()}`);
  const res = await handler(new Request('http://edge/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...AUTH }, body: JSON.stringify(body) }));
  return { status: res.status, json: await res.json() };
}
async function callRaw(fn: string, path: string, init: RequestInit) {
  await import(`../supabase/functions/${fn}/index.ts?${Math.random()}`);
  return handler(new Request('http://edge/' + path, init));
}
const log = async () => (await fetch(mock + '/__log')).json();
const clear = () => fetch(mock + '/__log', { method: 'DELETE' });

for (const [fn, body, web, schemaName] of [
  ['brand-analysis', { businessDescription: 'Acme coffee' }, false, 'brand_analysis_edge'],
  ['brand-analyzer', { businessIdea: 'Acme coffee' }, false, 'brand_analyzer_edge'],
  ['competitor-intelligence', { industry: 'coffee', brandDescription: 'Acme' }, true, 'competitor_intelligence'],
  ['market-analysis', { industry: 'coffee', brandDescription: 'Acme' }, true, 'market_analysis'],
  ['social-media-analyzer', { platform: 'twitter', handle: 'acme', profileUrl: 'https://twitter.com/acme' }, true, 'social_media_analysis'],
  ['website-scanner', { url: mock + '/__log' }, false, 'website_scan'],
  ['ai-analysis', { content: 'Acme brand strategy', type: 'brand' }, false, 'analysis_brand'],
] as const) {
  await clear();
  const r = await call(fn, body);
  const l = await log();
  const bodies = l.filter((e: any) => e.path === '/responses').map((e: any) => e.body);
  const last = bodies.at(-1);
  ok(`${fn}: 200`, r.status === 200, `status ${r.status} ${r.status !== 200 ? JSON.stringify(r.json) : ''}`);
  ok(`${fn}: strict schema '${schemaName}'`, last?.text?.format?.name === schemaName && last.text.format.strict === true);
  ok(`${fn}: developer msg first, no temperature`, last?.input?.[0]?.role === 'developer' && !('temperature' in last));
  if (web) ok(`${fn}: web_search research step precedes structuring`, bodies.length === 2 && bodies[0].tools?.[0]?.type === 'web_search' && !bodies[0].text && (r.json.citations?.length ?? 0) > 0);
}

// Generic openai function: text and image
await clear();
let r = await call('openai', { prompt: 'hi', effort: 'low' });
ok('openai fn text', r.status === 200 && r.json.text === 'hello from mock');
r = await call('openai', { prompt: 'logo', type: 'image' });
ok('openai fn image', r.status === 200 && r.json.images?.[0]?.startsWith('data:image/png;base64,'));

// Voice edge functions (Realtime TTS over Deno's WebSocket, gpt-transcribe)
const isWav = (b: Uint8Array) => new TextDecoder().decode(b.slice(0, 4)) === 'RIFF' && b.length > 44;
await clear();
let res = await callRaw('voice-generator', 'voice-generator', { method: 'POST', headers: { 'Content-Type': 'application/json', ...AUTH }, body: JSON.stringify({ text: 'Hello from the edge.', voiceId: 'cedar' }) });
let bytes = new Uint8Array(await res.arrayBuffer());
let l = await log();
ok('voice-generator: WAV via Realtime WebSocket (Deno WebSocket headers)', res.status === 200 && isWav(bytes) && l.some((e: any) => e.path === 'ws connect' && e.auth === `Bearer ${USER_KEY}`), `status ${res.status}`);
ok('  session voice cedar, no ws errors', l.find((e: any) => e.path === 'ws session.update')?.event.session.audio.output.voice === 'cedar' && !l.some((e: any) => e.path === 'ws error'));

for (const [path, body, label] of [
  ['voices', {}, 'voices'],
  ['generate', { text: 'Generate this.', voiceId: 'marin' }, 'generate'],
  ['podcast', { segments: [{ text: 'One.', voiceId: 'marin' }, { text: 'Two.', voiceId: 'alloy' }] }, 'podcast'],
  ['audiobook', { chapters: [{ title: 'Ch 1', text: 'Text.', voiceId: 'cedar' }] }, 'audiobook']
] as const) {
  await clear();
  res = await callRaw('voice-content', `voice-content/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...AUTH }, body: JSON.stringify(body) });
  const ct = res.headers.get('content-type');
  const ok1 = path === 'voices' ? ct === 'application/json' && (await res.json()).length === 10 : isWav(new Uint8Array(await res.arrayBuffer()));
  ok(`voice-content/${label}`, res.status === 200 && ok1, `status ${res.status}`);
}
await clear();
const form = new FormData();
form.append('audio', new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' }), 'a.wav');
form.append('language', 'en');
res = await callRaw('voice-content', 'voice-content/transcribe', { method: 'POST', headers: AUTH, body: form });
l = await log();
ok('voice-content/transcribe -> gpt-transcribe with languages[]', res.status === 200 && (await res.json()).text === 'hello transcript' && l[0]?.fields.includes('languages[]=en') && l[0].fields.includes('model=gpt-transcribe'));

// Legacy Speech API mode (OPENAI_TTS_ENDPOINT=speech)
Deno.env.set('OPENAI_TTS_ENDPOINT', 'speech');
await clear();
res = await callRaw('voice-generator', 'voice-generator', { method: 'POST', headers: { 'Content-Type': 'application/json', ...AUTH }, body: JSON.stringify({ text: 'Legacy mode.', voiceId: 'marin' }) });
bytes = new Uint8Array(await res.arrayBuffer());
l = await log();
ok('OPENAI_TTS_ENDPOINT=speech -> POST /audio/speech (gpt-4o-mini-tts, wav)', res.status === 200 && isWav(bytes) && l[0]?.path === '/audio/speech' && l[0].body.model === 'gpt-4o-mini-tts' && l[0].body.response_format === 'wav', `status ${res.status}`);
Deno.env.delete('OPENAI_TTS_ENDPOINT');

// BYOK gates: no session -> 401, session without a stored key -> 412 OPENAI_KEY_REQUIRED, key never echoed
{
  const anon = await callRaw('openai', 'openai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'hi' }) });
  ok('edge: no session -> 401 AUTH_REQUIRED', anon.status === 401 && (await anon.json()).code === 'AUTH_REQUIRED');
  const bob = await callRaw('openai', 'openai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-bob' }, body: JSON.stringify({ prompt: 'hi' }) });
  const bj = await bob.json();
  ok('edge: user without a key -> 412 OPENAI_KEY_REQUIRED', bob.status === 412 && bj.code === 'OPENAI_KEY_REQUIRED');
  ok('edge: responses never contain the key', !JSON.stringify(bj).includes(USER_KEY));
}

console.log(failed ? `\n${failed} FAILED` : '\nAll edge checks passed');
Deno.exit(failed ? 1 : 0);
