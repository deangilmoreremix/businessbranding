#!/usr/bin/env node
/**
 * Minimal mock of the OpenAI endpoints this app uses. It rejects requests that break the GPT-6.2 /
 * Responses API rules (temperature/top_p, non-strict schemas, instructions-style system prompts, ...) so the
 * request shapes the app sends can be checked without a live API key.
 * Also mocks audio: /v1/audio/transcriptions, /v1/audio/speech, /v1/realtime/client_secrets and the Realtime WebSocket
 * (/v1/realtime) with GA event shapes (session.update, conversation.item.create, response.create -> output_audio.delta).
 *   node scripts/mock-openai-server.mjs [port]   (then set OPENAI_BASE_URL=http://127.0.0.1:<port>/v1)
 * Every request is appended to the in-memory log, readable at GET /__log (and cleared with DELETE /__log).
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';

const port = Number(process.argv[2] || 4999);
const log = [];
let bgPolls = 0;
let retryHit = false;

function fail(res, msg, status = 400) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'x-request-id': 'req_mock' });
  res.end(JSON.stringify({ error: { message: msg, type: 'invalid_request_error', code: 'mock_invalid' } }));
}

/** Strict-mode schema check: additionalProperties:false and required == all properties, recursively. */
function checkStrict(schema, path = '$') {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.type === 'object' || schema.properties) {
    if (schema.additionalProperties !== false) return `${path}: additionalProperties must be false`;
    const keys = Object.keys(schema.properties || {});
    const req = schema.required || [];
    if (keys.length !== req.length || keys.some((k) => !req.includes(k))) return `${path}: required must list every property`;
    for (const k of keys) { const e = checkStrict(schema.properties[k], `${path}.${k}`); if (e) return e; }
  }
  if (schema.items) return checkStrict(schema.items, `${path}[]`);
  return null;
}

/** Produce a value that satisfies the schema. */
function sample(schema) {
  const t = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (t === 'object') return Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, sample(v)]));
  if (t === 'array') return [sample(schema.items)];
  if (t === 'number') return 0.5;
  if (t === 'boolean') return true;
  return 'sample';
}

function validateResponsesBody(b) {
  if ('temperature' in b || 'top_p' in b || 'top_logprobs' in b) return 'temperature/top_p/top_logprobs are not supported on GPT-6.2';
  if (!/^gpt-6\.2-(sol|astra)$/.test(b.model)) return `unexpected model ${b.model}`;
  if ('reasoning_effort' in b) return 'use reasoning.effort, not reasoning_effort';
  if (b.reasoning && !['low', 'medium', 'high', 'xhigh'].includes(b.reasoning.effort)) return 'bad reasoning.effort';
  if (Array.isArray(b.input)) {
    const devIdx = b.input.findIndex((i) => i.role === 'developer');
    if (devIdx > 0) return 'developer message must be the first input item';
    if (b.input.some((i) => i.role === 'system')) return 'use developer, not system';
  }
  if (b.instructions && Array.isArray(b.input) && b.input[0]?.role === 'developer') { /* allowed but unusual */ }
  if (b.text?.format) {
    const f = b.text.format;
    if (f.type !== 'json_schema' || !f.name || f.strict !== true || !f.schema) return 'text.format must be {type:json_schema,name,schema,strict:true}';
    const e = checkStrict(f.schema); if (e) return `schema not strict: ${e}`;
    if (b.tools?.length) return 'mock: structured + tools in one request is not used by this app';
  }
  for (const t of b.tools || []) {
    if (t.type === 'function') {
      if (t.strict !== true || !t.name || !t.parameters) return 'function tool needs name, parameters, strict:true';
      const e = checkStrict(t.parameters); if (e) return `function parameters not strict: ${e}`;
    } else if (t.type !== 'web_search') return `unexpected tool ${t.type}`;
  }
  if (b.previous_response_id && b.store === false) return 'previous_response_id needs stored responses';
  if (b.background && b.stream) return 'background and stream cannot be combined here';
  return null;
}

const msg = (text, annotations = []) => ({ id: 'msg_1', type: 'message', status: 'completed', role: 'assistant', content: [{ type: 'output_text', text, annotations }] });
const usage = { input_tokens: 11, output_tokens: 7, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 3 } };

function respond(b) {
  const lastText = JSON.stringify(b.input);
  let output;
  if (b.text?.format) output = [msg(JSON.stringify(sample(b.text.format.schema)))];
  else if (b.tools?.some((t) => t.type === 'function') && !lastText.includes('function_call_output') && /weak/i.test(lastText)) {
    output = [{ id: 'fc_1', type: 'function_call', call_id: 'call_1', name: 'list_weak_factors', arguments: '{"below":0.8}' }];
  } else if (b.tools?.some((t) => t.type === 'function') && lastText.includes('function_call_output')) {
    output = [msg('Your weakest factor is Visual Identity.')];
  } else if (b.tools?.some((t) => t.type === 'web_search')) {
    output = [{ id: 'ws_1', type: 'web_search_call', status: 'completed', action: { type: 'search', query: 'q' } }, msg('Findings about the market.', [{ type: 'url_citation', url: 'https://example.com/a', title: 'Example A', start_index: 0, end_index: 5 }])];
  } else output = [msg('hello from mock')];
  return { id: 'resp_' + Math.random().toString(36).slice(2, 10), object: 'response', status: 'completed', model: b.model, output, usage };
}


/** Tiny valid 24 kHz mono 16-bit WAV with `n` samples of silence. */
function wavBytes(n) {
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(24000, 24); b.writeUInt32LE(48000, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
const VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];

const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__log') { if (req.method === 'DELETE') log.length = 0; res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(log)); }
  if (req.headers.authorization !== 'Bearer sk-test') return fail(res, 'bad key', 401);

  if (url.pathname === '/v1/responses' && req.method === 'POST') {
    const b = JSON.parse(raw.toString());
    log.push({ path: '/responses', body: b });
    if (JSON.stringify(b.input).includes('RETRY429') && !retryHit) { retryHit = true; res.writeHead(429, { 'retry-after-ms': '20', 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'rate limited', code: 'rate_limit_exceeded' } })); }
    const err = validateResponsesBody(b); if (err) return fail(res, err);
    if (JSON.stringify(b.input).includes('REFUSE')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ id: 'resp_r', status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] })); }
    if (b.background) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ id: 'resp_bg1', status: 'queued', model: b.model, output: [] })); }
    const r = respond(b);
    if (b.stream) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'x-request-id': 'req_stream' });
      const send = (e) => res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
      send({ type: 'response.created', response: { id: r.id } });
      for (const item of r.output) if (item.type === 'message') for (const w of item.content[0].text.split(/(?<= )/)) send({ type: 'response.output_text.delta', delta: w });
      send({ type: 'response.completed', response: r });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'x-request-id': 'req_ok' });
    return res.end(JSON.stringify(r));
  }
  if (url.pathname === '/v1/responses/resp_bg1' && req.method === 'GET') {
    log.push({ path: '/responses/resp_bg1 (GET)' });
    bgPolls++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (bgPolls < 2) return res.end(JSON.stringify({ id: 'resp_bg1', status: 'in_progress' }));
    return res.end(JSON.stringify({ id: 'resp_bg1', status: 'completed', model: 'gpt-6.2-astra', output: [msg('Long report', [{ type: 'url_citation', url: 'https://example.com/b', title: 'B' }])], usage }));
  }
  if (url.pathname === '/v1/images/generations' && req.method === 'POST') {
    const b = JSON.parse(raw.toString()); log.push({ path: '/images/generations', body: b });
    if (!/^gpt-image-2\.6-(sunburst|flare)$/.test(b.model)) return fail(res, `unexpected image model ${b.model}`);
    if (b.response_format) return fail(res, 'response_format is not used with GPT Image models');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ data: [{ b64_json: Buffer.from('PNGDATA').toString('base64') }], usage: { input_tokens: 5, output_tokens: 5 } }));
  }
  if (url.pathname === '/v1/images/edits' && req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    const text = raw.toString('latin1');
    const fields = [...text.matchAll(/name="([^"]+)"(?:; filename="([^"]*)")?/g)].map((m) => m[1] + (m[2] ? `(file:${m[2]})` : ''));
    log.push({ path: '/images/edits', contentType: ct.split(';')[0], fields, model: /name="model"\r\n\r\n([^\r]+)/.exec(text)?.[1] });
    if (!ct.startsWith('multipart/form-data')) return fail(res, 'edits must be multipart');
    if (!fields.some((f) => f.startsWith('image[](file:'))) return fail(res, 'missing image[] file');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ data: [{ b64_json: Buffer.from('EDITED').toString('base64') }] }));
  }
  if (url.pathname === '/v1/audio/transcriptions' && req.method === 'POST') {
    const text = raw.toString('latin1');
    const fields = [...text.matchAll(/name="([^"]+)"(?:; filename="([^"]*)")?\r\n(?:Content-Type: [^\r]+\r\n)?\r\n([^\r]*)/g)].map((m) => ({ name: m[1], filename: m[2], value: m[3] }));
    log.push({ path: '/audio/transcriptions', fields: fields.map((f) => (f.filename ? `${f.name}(file:${f.filename})` : `${f.name}=${f.value}`)) });
    const get = (n) => fields.find((f) => f.name === n)?.value;
    if (!get('model')) return fail(res, 'model is required');
    if (!fields.some((f) => f.name === 'file' && f.filename)) return fail(res, 'file is required');
    if (fields.some((f) => f.name === 'language')) return fail(res, 'gpt-transcribe: use languages[] instead of language');
    if (fields.filter((f) => f.name === 'keywords[]').some((f) => /[<>]/.test(f.value))) return fail(res, 'keywords must not contain < or >');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ text: 'hello transcript', languages: [{ code: 'en' }] }));
  }
  if (url.pathname === '/v1/audio/speech' && req.method === 'POST') {
    const b = JSON.parse(raw.toString()); log.push({ path: '/audio/speech', body: b });
    if (!b.model || !b.voice || !b.input) return fail(res, 'model, voice and input are required');
    if (b.response_format !== 'wav') return fail(res, 'expected wav');
    res.writeHead(200, { 'Content-Type': 'audio/wav' });
    return res.end(Buffer.from(wavBytes(2400)));
  }
  if (url.pathname === '/v1/realtime/client_secrets' && req.method === 'POST') {
    const b = JSON.parse(raw.toString()); log.push({ path: '/realtime/client_secrets', body: b });
    const sess = b.session;
    if (!sess || sess.type !== 'realtime' || !sess.model) return fail(res, 'session.type realtime and session.model are required');
    if (!sess.audio?.output?.voice) return fail(res, 'session.audio.output.voice is required');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ value: 'ek_mock_secret', expires_at: 1800000000, session: sess }));
  }
  fail(res, 'not found: ' + req.method + ' ' + url.pathname, 404);
});
// ---- Realtime WebSocket (text-to-speech flow) ----
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/v1/realtime') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    const model = url.searchParams.get('model');
    log.push({ path: 'ws connect', model, auth: req.headers.authorization, sub: !req.headers['openai-beta'] });
    const send = (e) => ws.send(JSON.stringify(e));
    const bad = (msg) => { log.push({ path: 'ws error', msg }); send({ type: 'error', error: { message: msg, code: 'mock_invalid' } }); };
    if (req.headers.authorization !== 'Bearer sk-test') { bad('bad key'); return ws.close(); }
    if (!/^gpt-realtime/.test(model || '')) { bad('unexpected realtime model ' + model); return ws.close(); }
    send({ type: 'session.created', session: { id: 'sess_mock', model } });
    let updated = false;
    ws.on('message', (data) => {
      const e = JSON.parse(data.toString());
      log.push({ path: 'ws ' + e.type, event: e });
      if (e.type === 'session.update') {
        const sn = e.session || {};
        if (sn.type !== 'realtime') return bad('session.type must be "realtime"');
        if (JSON.stringify(sn.output_modalities) !== '["audio"]') return bad('output_modalities must be ["audio"]');
        const o = sn.audio?.output;
        if (o?.format?.type !== 'audio/pcm' || o.format.rate !== 24000) return bad('audio.output.format must be audio/pcm 24000');
        if (!VOICES.includes(o.voice)) return bad('invalid voice ' + o.voice);
        if (typeof sn.instructions !== 'string') return bad('instructions required');
        updated = true;
        return send({ type: 'session.updated', session: sn });
      }
      if (e.type === 'conversation.item.create') {
        const c = e.item?.content?.[0];
        if (e.item?.type !== 'message' || e.item.role !== 'user' || c?.type !== 'input_text' || !c.text) return bad('bad conversation item');
        return send({ type: 'conversation.item.created', item: e.item });
      }
      if (e.type === 'response.create') {
        if (!updated) return bad('session not configured');
        if (JSON.stringify(e.response?.output_modalities) !== '["audio"]') return bad('response.output_modalities must be ["audio"]');
        send({ type: 'response.created', response: { id: 'resp_a' } });
        for (let i = 0; i < 3; i++) send({ type: 'response.output_audio.delta', delta: Buffer.alloc(1600, i + 1).toString('base64') });
        send({ type: 'response.output_audio.done' });
        return send({ type: 'response.done', response: { status: 'completed', output: [] } });
      }
      bad('unexpected client event ' + e.type);
    });
  });
});

server.listen(port, '127.0.0.1', () => console.log(`mock OpenAI on http://127.0.0.1:${port}/v1`));
