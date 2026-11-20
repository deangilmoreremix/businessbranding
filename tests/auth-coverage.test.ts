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

const walk = (dir: string, name: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p, name) : f === name ? [p] : [];
  });
const rel = (p: string) => relative(process.cwd(), p).split('\\').join('/');

const routes = walk('app/api', 'route.ts').map(rel).sort();
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
    const handlers = [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
    expect(handlers.length).toBeGreaterThan(0);
    for (const h of handlers) {
      const body = src.slice(src.indexOf(`export async function ${h}`)).split(/\nexport async function /)[0];
      expect(body, `${route} ${h} does not call withUser()`).toMatch(/withUser\(/);
    }
  });

  it.each(edges)('%s uses edgeHandler or is an explicitly allowed open function', (fn) => {
    if (OPEN_EDGE[fn]) return;
    expect(readFileSync(fn, 'utf8'), `${fn} is not wrapped with edgeHandler()`).toMatch(/edgeHandler\(/);
  });

  it('every allow-list entry still exists (no stale exceptions)', () => {
    for (const r of Object.keys(OPEN_ROUTES)) expect(routes, r).toContain(r);
    for (const e of Object.keys(OPEN_EDGE)) expect(edges, e).toContain(e);
  });

  // Behavioural check: call every protected handler without credentials; each must answer 401 (never run the handler, never 200/500).
  it.each(routes.filter((r) => !OPEN_ROUTES[r]))('%s answers 401 without a session', async (route) => {
    const mod = await import(/* @vite-ignore */ '../' + route.replace(/\.ts$/, ''));
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter((m) => typeof mod[m] === 'function');
    expect(methods.length).toBeGreaterThan(0);
    for (const m of methods) {
      const res: Response = await mod[m](new Request('http://localhost/' + route, { method: m, body: m === 'GET' ? undefined : '{}', headers: { 'content-type': 'application/json' } }), { params: {} });
      expect(res.status, `${route} ${m}`).toBe(401);
    }
  });
});
