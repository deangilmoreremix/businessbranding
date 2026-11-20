// Loads each AI edge function under Deno (remote imports stubbed) and calls its handler against the mock OpenAI server.
//   node scripts/mock-openai-server.mjs 4999
//   OPENAI_API_KEY=sk-test OPENAI_BASE_URL=http://127.0.0.1:4999/v1 SUPABASE_URL=http://x SUPABASE_SERVICE_ROLE_KEY=k \
//     deno run -A --import-map scripts/deno-stubs/import_map.json scripts/verify-edge.ts
const mock = 'http://127.0.0.1:4999';
let failed = 0;
const ok = (n: string, c: boolean, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n} ${x}`); if (!c) failed++; };

let handler: (r: Request) => Promise<Response>;
(Deno as any).serve = (h: any) => { handler = h; };

async function call(fn: string, body: unknown) {
  await import(`../supabase/functions/${fn}/index.ts?${Math.random()}`);
  const res = await handler(new Request('http://edge/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  return { status: res.status, json: await res.json() };
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

console.log(failed ? `\n${failed} FAILED` : '\nAll edge checks passed');
Deno.exit(failed ? 1 : 0);
