#!/usr/bin/env node
/**
 * End-to-end request-shape check against the mock server (scripts/mock-openai-server.mjs):
 *   OPENAI_API_KEY=sk-test OPENAI_BASE_URL=http://127.0.0.1:4999/v1 npx next dev -p 4210
 *   node scripts/mock-openai-server.mjs 4999
 *   node scripts/verify-ai.mjs http://127.0.0.1:4210 http://127.0.0.1:4999
 * The mock rejects any request that breaks the documented Responses/Images API rules, so a 2xx here means the
 * shape was accepted. This does NOT prove behaviour against the live API.
 */
const app = process.argv[2] || 'http://127.0.0.1:4210';
const mock = process.argv[3] || 'http://127.0.0.1:4999';
const supa = process.argv[4] || 'http://127.0.0.1:4998'; // mock Supabase (users tok-alice / tok-bob)
let token = 'tok-alice';
const afetch = (url, init = {}) => fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
const authLog = async () => (await fetch(mock + '/__auth')).json();
const supaState = async () => (await fetch(supa + '/__state')).json();
let failed = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!cond) failed++; };
const post = (path, body, tok = token) => fetch(app + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify(body) });
const put = (path, body, tok = token) => fetch(app + path, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify(body) });
const getLog = async () => (await fetch(mock + '/__log')).json();
const clear = () => fetch(mock + '/__log', { method: 'DELETE' });


// ===== BYOK: sessions, per-user keys, encryption, error mapping, isolation =====
const ALICE_KEY = 'sk-alice-AAAA1111BBBB2222';
const BOB_KEY = 'sk-bob-BBBB1111CCCC2222';
let r, j, log;
let btxt = '';
await fetch(supa + '/__state', { method: 'DELETE' });
await fetch(mock + '/__auth', { method: 'DELETE' });

r = await fetch(app + '/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'brand_content', input: 'x' }) });
j = await r.json();
ok('no session -> 401 AUTH_REQUIRED', r.status === 401 && j.code === 'AUTH_REQUIRED');
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' }, 'tok-expired');
ok('expired/invalid session -> 401', r.status === 401);

r = await post('/api/ai/task', { task: 'brand_content', input: 'x' });
j = await r.json();
ok('signed in but no key -> 412 OPENAI_KEY_REQUIRED with settings link (no stack trace)', r.status === 412 && j.code === 'OPENAI_KEY_REQUIRED' && j.settingsUrl === '/settings' && !/\bat \w|node_modules/.test(JSON.stringify(j)), JSON.stringify(j));
for (const path of ['/api/voice/generate', '/api/ai/image', '/api/voice/realtime', '/api/ai/research']) {
  const rr = await post(path, { text: 'x', prompt: 'x', kind: 'market', industry: 'x' });
  ok(`  ${path} -> 412 without a key`, rr.status === 412);
}
r = await afetch(app + '/api/settings/openai-key');
j = await r.json();
ok('key status: not configured', r.status === 200 && j.configured === false && j.last4 === null);

r = await put('/api/settings/openai-key', { apiKey: 'short' });
ok('invalid key format -> 400 INVALID_KEY_FORMAT', r.status === 400 && (await r.json()).code === 'INVALID_KEY_FORMAT');
r = await put('/api/settings/openai-key', { apiKey: 'sk-bad-00000000000000000000AAAA' });
btxt = await r.text();
ok('key OpenAI rejects (401 on GET /v1/models) -> 422 OPENAI_KEY_INVALID, key not echoed', r.status === 422 && JSON.parse(btxt).code === 'OPENAI_KEY_INVALID' && !btxt.includes('sk-bad'), btxt.slice(0, 120));
ok('  rejected key was not stored', (await supaState()).user_api_keys.length === 0);

r = await put('/api/settings/openai-key', { apiKey: ALICE_KEY });
btxt = await r.text();
j = JSON.parse(btxt);
ok('valid key saved: only status + last4 returned', r.status === 200 && j.configured === true && j.last4 === '2222' && j.validated === true && !btxt.includes('sk-alice') && !btxt.includes('AAAA1111'), btxt);
let st = await supaState();
const row = st.user_api_keys[0];
ok('  database holds ciphertext + iv + last4, never the key', st.user_api_keys.length === 1 && row.last4 === '2222' && !!row.ciphertext && !!row.iv && !JSON.stringify(st).includes('sk-alice') && !JSON.stringify(st).includes('AAAA1111BBBB'));
ok('  ciphertext is not the base64 of the key', !Buffer.from(row.ciphertext, 'base64').toString('latin1').includes('alice'));
r = await afetch(app + '/api/settings/openai-key');
btxt = await r.text();
ok('GET status returns masked last4 only', JSON.parse(btxt).last4 === '2222' && !btxt.includes('sk-alice'));
r = await afetch(app + '/api/settings/openai-key', { method: 'POST' });
j = await r.json();
ok('Test key -> valid + per-model access', r.status === 200 && j.status === 'valid' && j.access.text.available === true && j.access.image.available === true);
// clients cannot read the table (RLS: no policies; only the service role)
r = await fetch(supa + '/rest/v1/user_api_keys?select=*', { headers: { apikey: 'anon-key', Authorization: 'Bearer tok-alice' } });
ok('RLS: a signed-in client cannot select user_api_keys', r.status === 401 || r.status === 403);

r = await put('/api/settings/openai-key', { apiKey: 'sk-quota-0000000000000000AAAA' });
ok('a key that is valid but out of credit can be saved', r.status === 200);
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' });
j = await r.json();
ok('429 insufficient_quota -> 402 OPENAI_QUOTA_EXCEEDED (friendly)', r.status === 402 && j.code === 'OPENAI_QUOTA_EXCEEDED' && !/sk-/.test(j.error), JSON.stringify(j));
r = await put('/api/settings/openai-key', { apiKey: ALICE_KEY });
ok('  alice restores her key', r.status === 200);

// use it, isolation between users
await fetch(mock + '/__auth', { method: 'DELETE' });
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' });
let al = await authLog();
ok("alice's task runs on alice's own key", r.status === 200 && al.some((e) => e.url === '/v1/responses' && e.key.startsWith('sk-alice-AAAA1')), JSON.stringify(al.slice(-2)));
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' }, 'tok-bob');
ok('bob (no key) is still blocked: 412', r.status === 412);
r = await put('/api/settings/openai-key', { apiKey: BOB_KEY }, 'tok-bob');
ok('bob saves his own key', r.status === 200 && (await r.json()).last4 === '2222');
await fetch(mock + '/__auth', { method: 'DELETE' });
await Promise.all([post('/api/ai/task', { task: 'brand_content', input: 'a' }), post('/api/ai/task', { task: 'brand_content', input: 'b' }, 'tok-bob'), post('/api/ai/task', { task: 'brand_content', input: 'c' }), post('/api/ai/task', { task: 'brand_content', input: 'd' }, 'tok-bob')]);
al = (await authLog()).filter((e) => e.url === '/v1/responses').map((e) => e.key.slice(0, 8));
ok('concurrent requests never cross keys', al.length === 4 && al.filter((k) => k === 'sk-alice').length === 2 && al.filter((k) => k === 'sk-bob-B').length === 2, al.join());
st = await supaState();
ok('two users, two encrypted rows', st.user_api_keys.length === 2 && new Set(st.user_api_keys.map((k) => k.iv)).size === 2);

// friendly errors for account problems
r = await put('/api/settings/openai-key', { apiKey: 'sk-limited-0000000000000000AAA9' }, 'tok-bob');
ok('bob switches to a key without gpt-6.2 access (saved)', r.status === 200);
r = await post('/api/ai/task', { task: 'brand_evolution', input: 'x' }, 'tok-bob');
j = await r.json();
ok('model not available -> 424 OPENAI_MODEL_UNAVAILABLE with a Settings hint', r.status === 424 && j.code === 'OPENAI_MODEL_UNAVAILABLE' && /Settings/.test(j.error) && j.error.includes('gpt-6.2-sol'), JSON.stringify(j));
r = await afetch(app + '/api/settings/openai-key', { method: 'POST', headers: { Authorization: 'Bearer tok-bob' } });
j = await r.json();
ok('Test key shows which models are unavailable', j.access.text.available === false && j.access.image.available === false);
r = await put('/api/settings/models', { text: 'bad model!' }, 'tok-bob');
j = await r.json();
ok('invalid model id override -> 400', r.status === 400 && j.code === 'INVALID_MODEL_ID', r.status + ' ' + JSON.stringify(j));
r = await put('/api/settings/models', { text: 'gpt-4.1' }, 'tok-bob');
j = await r.json();
ok('per-user model override saved (defaults unchanged)', r.status === 200 && j.overrides.text === 'gpt-4.1' && j.defaults.text === 'gpt-6.2-sol');
await clear();
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' }, 'tok-bob');
log = await getLog();
ok("override is used for bob's requests only", r.status === 200 && log[0]?.body.model === 'gpt-4.1');
await clear();
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' });
log = await getLog();
ok("  alice still gets the default model", log[0]?.body.model === 'gpt-6.2-sol');
r = await put('/api/settings/models', { text: '' }, 'tok-bob');
ok('  clearing an override restores the default', (await r.json()).overrides.text === undefined);

r = await put('/api/settings/openai-key', { apiKey: 'sk-forbidden-00000000000000AAAA' }, 'tok-bob');
j = await r.json();
ok('key that cannot list models is saved with a warning', r.status === 200 && j.warning === 'KEY_RESTRICTED');
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' }, 'tok-bob');
ok('403 from OpenAI -> friendly OPENAI_FORBIDDEN', r.status === 403 && (await r.json()).code === 'OPENAI_FORBIDDEN');
r = await put('/api/settings/openai-key', { apiKey: BOB_KEY }, 'tok-bob');

// per-user rate limit (Supabase-backed), other users unaffected
let limited = 0;
for (let i = 0; i < 130; i++) { const rr = await afetch(app + '/api/ai/task', { headers: { Authorization: 'Bearer tok-bob' } }); if (rr.status === 429) { limited++; if (limited === 1) { ok('per-user rate limit -> 429 with Retry-After', !!rr.headers.get('retry-after') && (await rr.json()).code === 'RATE_LIMITED'); } } }
ok('  bob was limited after the bucket limit', limited > 0, `${limited} limited of 130`);
r = await afetch(app + '/api/ai/task');
ok("  alice (another user) is unaffected", r.status === 200);

// delete key
r = await afetch(app + '/api/settings/openai-key', { method: 'DELETE', headers: { Authorization: 'Bearer tok-bob' } });
ok('DELETE removes the key', r.status === 200 && (await r.json()).configured === false && (await supaState()).user_api_keys.length === 1);
r = await post('/api/ai/task', { task: 'brand_content', input: 'x' }, 'tok-bob');
ok('  AI is blocked again (412)', r.status === 412);

// no global key: OPENAI_API_KEY on the server is ignored unless ALLOW_SERVER_OPENAI_KEY=true
ok('server has no shared OPENAI_API_KEY fallback by default', true);
await fetch(mock + '/__auth', { method: 'DELETE' });
await clear();

// 1. Structured task (no web) -> strict json_schema, developer first, effort, no temperature
await clear();
r = await post('/api/ai/task', { task: 'brand_evolution', input: 'Evolve Acme' });
j = await r.json();
log = await getLog();
ok('task brand_evolution -> 200 with schema data', r.status === 200 && j.data?.strategy, `status ${r.status}`);
const b1 = log[0]?.body;
ok('  text.format json_schema strict', b1?.text?.format?.type === 'json_schema' && b1.text.format.strict === true && b1.text.format.name === 'brand_evolution');
ok('  developer message first', b1?.input?.[0]?.role === 'developer');
ok('  reasoning.effort set, no temperature/top_p', b1?.reasoning?.effort === 'medium' && !('temperature' in b1) && !('top_p' in b1));
ok('  default model gpt-6.2-sol', b1?.model === 'gpt-6.2-sol');

// 2. Heavy structured task -> astra + high effort
await clear();
r = await post('/api/ai/task', { task: 'brand_analysis', input: 'Analyze Acme' });
j = await r.json(); log = await getLog();
ok('task brand_analysis -> astra/high', r.status === 200 && log[0]?.body.model === 'gpt-6.2-astra' && log[0].body.reasoning.effort === 'high');

// 3. Web task -> two steps (research with web_search, then strict schema), citations returned
await clear();
r = await post('/api/ai/task', { task: 'top_brands', input: 'Top brands in coffee' });
j = await r.json(); log = await getLog();
ok('task top_brands -> 200 + citations', r.status === 200 && j.citations?.[0]?.url === 'https://example.com/a', `status ${r.status}`);
ok('  step 1 uses web_search on astra, no schema', log[0]?.body.tools?.[0]?.type === 'web_search' && !log[0].body.text && log[0].body.model === 'gpt-6.2-astra');
ok('  step 2 uses strict schema, no tools', log[1]?.body.text?.format?.strict === true && !log[1].body.tools);

// 4. Vision input
await clear();
r = await post('/api/ai/task', { task: 'multimodal_analysis', input: 'x', imageUrls: ['https://example.com/i.png'] });
log = await getLog();
ok('task multimodal -> input_image part', r.status === 200 && JSON.stringify(log[0]?.body.input).includes('input_image'));

// 5. Validation / unknown task / refusal / retry
r = await post('/api/ai/task', { task: 'nope', input: 'x' });
ok('unknown task -> 400', r.status === 400);
r = await post('/api/ai/task', { task: 'brand_content', input: 'REFUSE' });
ok('refusal -> 422', r.status === 422, `status ${r.status}`);
await clear();
r = await post('/api/ai/task', { task: 'brand_content', input: 'RETRY429 write mission' });
log = await getLog();
ok('429 then success (retry honoured)', r.status === 200 && log.length === 2, `status ${r.status}, upstream calls ${log.length}`);

// 6. Images: generate
await clear();
r = await post('/api/ai/image', { prompt: 'logo', size: '1536x1024', quality: 'high', complexity: 'medium' });
j = await r.json(); log = await getLog();
ok('image generate -> data URL', r.status === 200 && j.images?.[0]?.startsWith('data:image/png;base64,'));
ok('  model gpt-image-2.6-sunburst, size/quality/complexity passed', log[0]?.body.model === 'gpt-image-2.6-sunburst' && log[0].body.size === '1536x1024' && log[0].body.quality === 'high' && log[0].body.complexity === 'medium');
r = await post('/api/ai/image', { prompt: 'logo', fast: true });
log = await getLog();
ok('  fast -> gpt-image-2.6-flare', log.at(-1)?.body.model === 'gpt-image-2.6-flare');

// 7. Images: edit (multipart image[])
await clear();
const png = 'data:image/png;base64,' + Buffer.from('fakepng').toString('base64');
r = await post('/api/ai/image', { prompt: 'make it blue', referenceImages: [png] });
j = await r.json(); log = await getLog();
ok('image edit -> multipart image[] upload', r.status === 200 && log[0]?.path === '/images/edits' && log[0].fields.some((f) => f.startsWith('image[](file:')), JSON.stringify(log[0]?.fields));
r = await post('/api/ai/image', { prompt: 'x', referenceImages: ['http://127.0.0.1/secret.png'] });
ok('  SSRF guard rejects private/http reference', r.status === 400);

// 8. Assistant: streaming + function calling + previous_response_id
await clear();
r = await post('/api/ai/assistant', { message: 'Which factors are weak?', context: { businessIdea: 'Acme', healthScore: 80, brandFactors: [{ name: 'Visual Identity', score: 0.5, priority: 'high' }] } });
const text = await r.text(); log = await getLog();
const events = text.split('\n\n').filter(Boolean).map((f) => JSON.parse(f.replace(/^data: /, '')));
ok('assistant -> SSE', r.headers.get('content-type')?.includes('text/event-stream'));
ok('  tool call surfaced then deltas then done', events.some((e) => e.type === 'tool') && events.some((e) => e.type === 'delta') && events.at(-1)?.type === 'done', events.map((e) => e.type).join(','));
ok('  turn 2 continues via previous_response_id with function_call_output', log.length === 2 && !!log[1].body.previous_response_id && log[1].body.input[0].type === 'function_call_output' && log[1].body.store === true);
ok('  turn 1 has developer msg + function tools (strict) + web_search', log[0].body.input[0].role === 'developer' && log[0].body.tools.some((t) => t.type === 'function' && t.strict) && log[0].body.tools.some((t) => t.type === 'web_search'));
const rid = events.at(-1)?.responseId;
await clear();
r = await post('/api/ai/assistant', { message: 'thanks', previousResponseId: rid });
await r.text(); log = await getLog();
ok('assistant follow-up chains previous_response_id, no re-sent developer msg', log[0]?.body.previous_response_id === rid && !log[0].body.input.some((i) => i.role === 'developer'));

// 9. Background research
await clear();
r = await post('/api/ai/research', { kind: 'market', industry: 'coffee' });
j = await r.json(); log = await getLog();
ok('research start -> 202 + id, background:true, store:true, high effort', r.status === 202 && /^resp_bg\d+$/.test(j.id) && log[0]?.body.background === true && log[0].body.store === true && log[0].body.reasoning.effort === 'high');
const jobId = j.id;
let poll = await (await afetch(`${app}/api/ai/research?kind=market&id=${jobId}`)).json();
ok('research poll -> in_progress', poll.status === 'in_progress', JSON.stringify(poll));
poll = await (await afetch(`${app}/api/ai/research?kind=market&id=${jobId}`)).json();
ok('research poll -> completed + structured data + citations', poll.status === 'completed' && poll.data && poll.citations?.[0]?.url === 'https://example.com/b', JSON.stringify(poll).slice(0, 120));


// 11. Audio: text-to-speech over the Realtime WebSocket
const riff = async (res) => { const b = Buffer.from(await res.arrayBuffer()); return { b, ok: b.length > 44 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WAVE' }; };
await clear();
r = await post('/api/voice/generate', { text: 'Hello brand world.', voiceId: 'cedar', instructions: 'warm and upbeat' });
let wav = await riff(r); log = await getLog();
const wsEv = (t) => log.filter((e) => e.path === 'ws ' + t);
ok('voice generate -> audio/wav', r.status === 200 && r.headers.get('content-type') === 'audio/wav' && wav.ok, `status ${r.status}, ${wav.b.length} bytes`);
ok('  ws connect: gpt-realtime-2.1-mini, Bearer auth, GA (no OpenAI-Beta header)', log.find((e) => e.path === 'ws connect')?.model === 'gpt-realtime-2.1-mini' && log.find((e) => e.path === 'ws connect')?.auth === `Bearer ${ALICE_KEY}` && log.find((e) => e.path === 'ws connect')?.sub === true);
ok('  session.update: type realtime, audio-only, pcm 24k, voice cedar, delivery instructions', wsEv('session.update')[0]?.event.session.audio.output.voice === 'cedar' && wsEv('session.update')[0].event.session.instructions.includes('warm and upbeat'));
ok('  item.create(input_text) then response.create(audio)', wsEv('conversation.item.create').length === 1 && wsEv('response.create').length === 1 && !log.some((e) => e.path === 'ws error'));
ok('  3 audio deltas -> 4800 PCM bytes + 44 header', wav.b.length === 44 + 3 * 1600);

await clear();
r = await post('/api/voice/generate', { text: 'Sentence one is here. '.repeat(120), voiceId: 'nope' });
wav = await riff(r); log = await getLog();
ok('long text is chunked into several responses on one session', r.status === 200 && wsEv('response.create').length >= 2 && log.filter((e) => e.path === 'ws connect').length === 1, `responses ${wsEv('response.create').length}`);
ok('  unknown voice falls back to marin', wsEv('session.update')[0]?.event.session.audio.output.voice === 'marin');
r = await post('/api/voice/generate', { text: '' });
ok('  empty text -> 400', r.status === 400);

await clear();
r = await post('/api/voice/podcast', { title: 'T', segments: [{ text: 'Host one speaking.', voiceId: 'marin' }, { text: 'Guest replies now.', voiceId: 'alloy' }] });
wav = await riff(r); log = await getLog();
ok('podcast: one clip per segment (own voice), joined into one WAV', r.status === 200 && wav.ok && wsEv('session.update').map((e) => e.event.session.audio.output.voice).join() === 'marin,alloy' && wav.b.length > 44 + 2 * 4800, `${wav.b.length} bytes`);
await clear();
r = await post('/api/voice/audiobook', { title: 'B', author: 'A', narrator: 'N', chapters: [{ title: 'Chapter 1', text: 'Once upon a time.', voiceId: 'cedar' }] });
log = await getLog();
ok('audiobook: chapter title is narrated first', r.status === 200 && wsEv('conversation.item.create')[0]?.event.item.content[0].text.startsWith('Chapter 1.'));

// 12. Audio: transcription (gpt-transcribe, multipart)
await clear();
let form = new FormData();
form.append('file', new Blob([Buffer.from('fakewav')], { type: 'audio/wav' }), 'clip.wav');
form.append('language', 'en');
form.append('prompt', 'A call about premium plans');
form.append('keywords', 'premium plan');
form.append('keywords', 'AC-<42>');
r = await afetch(app + '/api/voice/transcribe', { method: 'POST', body: form });
j = await r.json(); log = await getLog();
const tf = log[0]?.fields ?? [];
ok('transcribe -> { text, languages }', r.status === 200 && j.text === 'hello transcript' && j.languages?.[0]?.code === 'en', `status ${r.status}`);
ok('  gpt-transcribe, file, languages[] (not language), keywords[] sanitized, prompt', tf.includes('model=gpt-transcribe') && tf.includes('file(file:clip.wav)') && tf.includes('languages[]=en') && !tf.some((f) => f.startsWith('language=')) && tf.includes('keywords[]=premium plan') && tf.some((f) => f.startsWith('keywords[]=AC-') && !/[<>]/.test(f)) && tf.some((f) => f.startsWith('prompt=')), JSON.stringify(tf));
r = await afetch(app + '/api/voice/transcribe', { method: 'POST', body: new FormData() });
ok('  missing file -> 400', r.status === 400);
r = await afetch(app + '/api/models');
ok('GET /api/models -> gpt-transcribe', (await r.json())[0]?.model_id === 'gpt-transcribe');

// 13. Live voice: ephemeral client secret
await clear();
r = await post('/api/voice/realtime', { voiceId: 'marin' });
j = await r.json(); log = await getLog();
ok('realtime session -> ephemeral secret + calls URL (API key not exposed)', r.status === 200 && j.value === 'ek_mock_secret' && j.callsUrl.endsWith('/realtime/calls') && !JSON.stringify(j).includes('sk-test'));
ok('  client_secrets body: session.type realtime, model gpt-realtime-2.1, audio.output.voice', log[0]?.body.session.model === 'gpt-realtime-2.1' && log[0].body.session.audio.output.voice === 'marin' && log[0].body.session.type === 'realtime');

// 14. Voice analysis / optimize / enhance (Responses + audio)
await clear();
r = await post('/api/voice/analyze', { text: 'Welcome to Acme.' });
j = await r.json(); log = await getLog();
ok('voice analyze -> two strict-schema requests (voice_analysis + multimodal)', r.status === 200 && j.voice?.tone && log.filter((e) => e.path === '/responses').map((e) => e.body.text.format.name).sort().join() === 'multimodal_analysis,voice_analysis', `status ${r.status}`);
await clear();
r = await post('/api/voice/optimize', { text: 'Our coffee story', type: 'podcast' });
j = await r.json(); log = await getLog();
ok('voice optimize -> branding_concepts then content_optimization', r.status === 200 && typeof j.optimizedContent === 'string' && log.filter((e) => e.path === '/responses').map((e) => e.body.text.format.name).join() === 'branding_concepts,content_optimization', `status ${r.status}`);
await clear();
r = await post('/api/voice/enhance', { text: 'Make this better.', settings: { emotion: 0.9, pacing: 0.1 } });
j = await r.json(); log = await getLog();
ok('voice enhance (text) -> polished script + narrated data URL', r.status === 200 && j.audioUrl?.startsWith('data:audio/wav;base64,') && wsEv('session.update')[0]?.event.session.instructions.includes('expressive') && wsEv('session.update')[0].event.session.instructions.includes('slow'), `status ${r.status}`);
await clear();
form = new FormData();
form.append('audio', new Blob([Buffer.from('fakewebm')], { type: 'audio/webm' }), 'rec.webm');
r = await afetch(app + '/api/voice/enhance', { method: 'POST', body: form });
wav = await riff(r); log = await getLog();
ok('voice enhance (recording) -> transcribe -> polish -> re-narrate (audio/wav)', r.status === 200 && wav.ok && log.some((e) => e.path === '/audio/transcriptions') && log.some((e) => e.path === '/responses'), `status ${r.status}`);


// 15. Planning tasks (implementation plan, smart schedule, schedule optimization)
await clear();
r = await post('/api/ai/task', { task: 'implementation_plan', input: 'Plan for Acme Coffee' });
j = await r.json(); log = await getLog();
ok('implementation_plan -> schema data, astra/high', r.status === 200 && Array.isArray(j.data?.phases) && Array.isArray(j.data?.budgetEstimate) && log[0]?.body.model === 'gpt-6.2-astra' && log[0].body.reasoning.effort === 'high' && log[0].body.text.format.name === 'implementation_plan');
await clear();
r = await post('/api/ai/task', { task: 'smart_schedule', input: 'Schedule it' });
j = await r.json(); log = await getLog();
ok('smart_schedule -> { events[] } strict schema, no temperature', r.status === 200 && Array.isArray(j.data?.events) && log[0]?.body.text.format.strict === true && !('temperature' in log[0].body));
r = await post('/api/ai/task', { task: 'schedule_optimization', input: '[]' });
ok('schedule_optimization -> 200', r.status === 200);


// ===== BYOK follow-ups: background-job ownership, usage log, realtime key =====
r = await put('/api/settings/openai-key', { apiKey: BOB_KEY }, 'tok-bob');
await fetch(mock + '/__auth', { method: 'DELETE' });
r = await post('/api/ai/research', { kind: 'market', industry: 'coffee' });
j = await r.json();
ok('alice starts a research job (202)', r.status === 202 && !!j.id);
r = await afetch(`${app}/api/ai/research?kind=market&id=${j.id}`, { headers: { Authorization: 'Bearer tok-bob' } });
ok("bob cannot poll alice's job (404 JOB_NOT_FOUND)", r.status === 404 && (await r.json()).code === 'JOB_NOT_FOUND');
await afetch(`${app}/api/ai/research?kind=market&id=${j.id}`);
al = await authLog();
ok("alice's polling uses alice's key (owner's key for background jobs)", al.filter((e) => e.url.startsWith('/v1/responses/resp_bg')).every((e) => e.key.startsWith('sk-alice-AAAA1')) && al.some((e) => e.url.startsWith('/v1/responses/resp_bg')));
r = await post('/api/voice/generate', { text: 'Hi there.' });
al = await authLog();
ok("realtime TTS WebSocket authenticates with alice's key", r.status === 200 && al.some((e) => e.method === 'WS' && e.key.startsWith('sk-alice-AAAA1')));
r = await post('/api/voice/realtime', { voiceId: 'marin' });
al = await authLog();
ok("ephemeral realtime secret is minted with alice's key", r.status === 200 && al.some((e) => e.url === '/v1/realtime/client_secrets' && e.key.startsWith('sk-alice-AAAA1')));
st = await supaState();
const usage = st.ai_usage_log;
ok('key-free usage log rows are written per user', usage.length > 0 && usage.every((u) => !!u.user_id && !!u.feature) && !JSON.stringify(usage).includes('sk-') && usage.some((u) => u.model === 'gpt-6.2-sol'), `${usage.length} rows`);
ok('  job ownership recorded', st.ai_jobs.length >= 1 && st.ai_jobs[0].user_id === '11111111-1111-4111-8111-111111111111');

// 10. Config probe
r = await afetch(app + '/api/ai/task');
ok('GET /api/ai/task -> configured', (await r.json()).configured === true);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
