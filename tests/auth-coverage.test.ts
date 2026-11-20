import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Every API route and every Edge Function must sit behind the BYOK session wrapper (withUser / edgeHandler) unless it is listed here on
 * purpose. The routes are enumerated from the file system, so a NEW route without the wrapper (or an existing one that loses it) fails.
 */
const OPEN_ROUTES: Record<string, string> = {
  'app/api/models/route.ts': 'static list of default model ids; contains no user data',
  'app/api/case-studies/route.ts': 'GET only: published marketing case studies (public read); the POST generator is /api/case-studies/generate',
  'app/api/contact/route.ts': 'public contact form: validated, size-capped and rate-limited per client; writes with the service role only'
};
const OPEN_EDGE: Record<string, string> = {
  'supabase/functions/hello-world/index.ts': 'trivial health-check function without AI or data access'
};

// every file Next.js treats as a route handler (route.ts / .tsx / .js / .jsx / .mjs)
const isRoute = (f: string) => /^route\.(ts|tsx|js|jsx|mjs)$/.test(f);
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : isRoute(f) ? [p] : [];
  });
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
/** HTTP methods a route module exports (function, const, or re-export forms). */
const exportedMethods = (src: string): string[] => METHODS.filter((m) => new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+(const|let|var)\\s+${m}\\b|export\\s*\\{[^}]*\\b${m}\\b[^}]*\\}`).test(src));
// the ONLY methods an open route may expose
const OPEN_METHODS: Record<string, string[]> = {
  'app/api/models/route.ts': ['GET'],
  'app/api/case-studies/route.ts': ['GET'],
  'app/api/contact/route.ts': ['POST']
};
const rel = (p: string) => relative(process.cwd(), p).split('\\').join('/');

const routes = walk('app/api').map(rel).sort();
const edges = readdirSync('supabase/functions').filter((d) => !d.startsWith('_') && statSync(join('supabase/functions', d)).isDirectory()).map((d) => `supabase/functions/${d}/index.ts`);

describe('auth coverage', () => {
  it('finds the routes (guards against the enumeration silently returning nothing)', () => {
    expect(routes.length).toBeGreaterThan(15);
    expect(edges.length).toBeGreaterThan(8);
  });

  it.each(routes)('%s uses withUser or is an explicitly allowed open route', (route) => {
    const src = readFileSync(route, 'utf8');
    if (OPEN_ROUTES[route]) return;
    expect(src, `${route} has no withUser() wrapper and is not in OPEN_ROUTES`).toMatch(/withUser\(/);
    // every exported HTTP handler must go through it
    const handlers = exportedMethods(src);
    expect(handlers.length).toBeGreaterThan(0);
    for (const h of handlers) {
      expect(src, `${route} exports ${h} as a non-function form; wrap it in withUser() and use a function declaration`).toMatch(new RegExp(`export\\s+async\\s+function\\s+${h}\\b`));
      const body = src.slice(src.search(new RegExp(`export\\s+async\\s+function\\s+${h}\\b`))).split(/\nexport (async function|const|\{)/)[0];
      expect(body, `${route} ${h} does not call withUser()`).toMatch(/withUser\(/);
    }
  });

  it.each(edges)('%s uses edgeHandler or is an explicitly allowed open function', (fn) => {
    if (OPEN_EDGE[fn]) return;
    expect(readFileSync(fn, 'utf8'), `${fn} is not wrapped with edgeHandler()`).toMatch(/edgeHandler\(/);
  });

  it.each(Object.keys(OPEN_ROUTES))('open route %s exposes exactly its documented HTTP methods', (route) => {
    expect(OPEN_METHODS[route], `${route} needs an OPEN_METHODS entry`).toBeTruthy();
    expect(exportedMethods(readFileSync(route, 'utf8')).sort(), `${route} gained (or lost) an HTTP method; review it, then update OPEN_METHODS`).toEqual([...OPEN_METHODS[route]].sort());
  });

  it('the route detector recognises every file form and every export form', () => {
    for (const f of ['route.ts', 'route.tsx', 'route.js', 'route.jsx', 'route.mjs']) expect(isRoute(f)).toBe(true);
    expect(isRoute('page.tsx')).toBe(false);
    expect(exportedMethods('export async function POST() {}\nexport const DELETE = () => {};\nexport { GET };').sort()).toEqual(['DELETE', 'GET', 'POST']);
    expect(exportedMethods('const x = 1')).toEqual([]);
  });

  it('every allow-list entry still exists (no stale exceptions)', () => {
    for (const r of Object.keys(OPEN_ROUTES)) expect(routes, r).toContain(r);
    for (const e of Object.keys(OPEN_EDGE)) expect(edges, e).toContain(e);
  });

  // Behavioural check: call every protected handler without credentials; each must answer 401 (never run the handler, never 200/500).
  it.each(routes.filter((r) => !OPEN_ROUTES[r]))('%s answers 401 without a session', async (route) => {
    const mod = await import(/* @vite-ignore */ '../' + route.replace(/\.ts$/, ''));
    const methods = METHODS.filter((m) => typeof mod[m] === 'function');
    expect(methods.length).toBeGreaterThan(0);
    for (const m of methods) {
      const res: Response = await mod[m](new Request('http://localhost/' + route, { method: m, body: m === 'GET' ? undefined : '{}', headers: { 'content-type': 'application/json' } }), { params: {} });
      expect(res.status, `${route} ${m}`).toBe(401);
    }
  });
});
