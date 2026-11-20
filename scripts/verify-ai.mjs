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
let failed = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!cond) failed++; };
const post = (path, body) => fetch(app + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const getLog = async () => (await fetch(mock + '/__log')).json();
const clear = () => fetch(mock + '/__log', { method: 'DELETE' });

// 1. Structured task (no web) -> strict json_schema, developer first, effort, no temperature
await clear();
let r = await post('/api/ai/task', { task: 'brand_evolution', input: 'Evolve Acme' });
let j = await r.json();
let log = await getLog();
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
ok('research start -> 202 + id, background:true, store:true, high effort', r.status === 202 && j.id === 'resp_bg1' && log[0]?.body.background === true && log[0].body.store === true && log[0].body.reasoning.effort === 'high');
let poll = await (await fetch(`${app}/api/ai/research?kind=market&id=resp_bg1`)).json();
ok('research poll -> in_progress', poll.status === 'in_progress', JSON.stringify(poll));
poll = await (await fetch(`${app}/api/ai/research?kind=market&id=resp_bg1`)).json();
ok('research poll -> completed + structured data + citations', poll.status === 'completed' && poll.data && poll.citations?.[0]?.url === 'https://example.com/b', JSON.stringify(poll).slice(0, 120));

// 10. Config probe
r = await fetch(app + '/api/ai/task');
ok('GET /api/ai/task -> configured', (await r.json()).configured === true);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
