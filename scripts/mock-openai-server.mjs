#!/usr/bin/env node
/**
 * Minimal mock of the OpenAI endpoints this app uses. It rejects requests that break the GPT-6.2 /
 * Responses API rules (temperature/top_p, non-strict schemas, instructions-style system prompts, ...) so the
 * request shapes the app sends can be checked without a live API key.
 *   node scripts/mock-openai-server.mjs [port]   (then set OPENAI_BASE_URL=http://127.0.0.1:<port>/v1)
 * Every request is appended to the in-memory log, readable at GET /__log (and cleared with DELETE /__log).
 */
import http from 'node:http';

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
  fail(res, 'not found: ' + req.method + ' ' + url.pathname, 404);
});
server.listen(port, '127.0.0.1', () => console.log(`mock OpenAI on http://127.0.0.1:${port}/v1`));
