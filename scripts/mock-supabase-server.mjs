#!/usr/bin/env node
/**
 * Minimal in-memory mock of the Supabase endpoints used by the BYOK server code (no real Supabase project is contacted):
 *   GET  /auth/v1/user                      verify access token (tok-alice, tok-bob; tok-expired -> 401)
 *   /rest/v1/user_api_keys                  service-role only (any other caller is rejected, like RLS with no policies)
 *   /rest/v1/user_settings, ai_usage_log, ai_jobs
 *   POST /rest/v1/rpc/consume_rate_limit    fixed-window counter
 *   GET|DELETE /__state                     inspect / reset the in-memory tables (tests only)
 *   node scripts/mock-supabase-server.mjs [port]
 */
import http from 'node:http';

const port = Number(process.argv[2] || 4998);
export const SERVICE_KEY = 'service-role-test-key';
const USERS = {
  'tok-alice': { id: '11111111-1111-4111-8111-111111111111', email: 'alice@example.test' },
  'tok-bob': { id: '22222222-2222-4222-8222-222222222222', email: 'bob@example.test' }
};

let failRpc = false; // test hook: make the rate-limit RPC fail (POST /__fail {rpc:true})
const db = { user_api_keys: [], user_settings: [], ai_usage_log: [], ai_jobs: [], limits: new Map(), requests: [] };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const parseFilters = (url) => {
  const f = {};
  for (const [k, v] of url.searchParams) if (v.startsWith('eq.')) f[k] = decodeURIComponent(v.slice(3));
  return f;
};
const matches = (row, f) => Object.entries(f).every(([k, v]) => String(row[k]) === v);

const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  const url = new URL(req.url, 'http://x');
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  db.requests.push({ method: req.method, path: url.pathname });

  if (url.pathname === '/__fail' && req.method === 'POST') { failRpc = !!JSON.parse(raw || '{}').rpc; return send(res, 200, { failRpc }); }
  if (url.pathname === '/__state') {
    if (req.method === 'DELETE') { for (const k of ['user_api_keys', 'user_settings', 'ai_usage_log', 'ai_jobs']) db[k] = []; db.limits.clear(); db.requests = []; return send(res, 200, {}); }
    return send(res, 200, { ...db, limits: [...db.limits.entries()] });
  }

  if (url.pathname === '/auth/v1/user') {
    const user = USERS[bearer];
    if (!user || req.headers.apikey !== SERVICE_KEY) return send(res, 401, { message: 'invalid JWT' });
    return send(res, 200, user);
  }

  if (url.pathname.startsWith('/rest/v1/')) {
    const table = url.pathname.slice('/rest/v1/'.length);
    // RLS: user_api_keys has no policies, so only the service role may touch it
    if (bearer !== SERVICE_KEY) return send(res, 401, { code: '42501', message: 'permission denied' });

    if (table === 'rpc/consume_rate_limit') {
      if (failRpc) return send(res, 500, { message: 'simulated outage' });
      const { p_user, p_bucket, p_limit, p_window_seconds } = JSON.parse(raw);
      const w = Math.floor(Date.now() / 1000 / p_window_seconds);
      const key = `${p_user}|${p_bucket}|${w}`;
      const n = (db.limits.get(key) ?? 0) + 1;
      db.limits.set(key, n);
      return send(res, 200, n <= p_limit);
    }

    if (!['user_api_keys', 'user_settings', 'ai_usage_log', 'ai_jobs'].includes(table)) return send(res, 404, { message: 'unknown table' });
    const rows = db[table];
    const f = parseFilters(url);

    if (req.method === 'GET') return send(res, 200, rows.filter((r) => matches(r, f)));
    if (req.method === 'DELETE') { db[table] = rows.filter((r) => !matches(r, f)); return send(res, 204); }
    if (req.method === 'POST') {
      const body = JSON.parse(raw);
      const list = Array.isArray(body) ? body : [body];
      const conflict = url.searchParams.get('on_conflict')?.split(',');
      for (const row of list) {
        const existing = conflict ? rows.find((r) => conflict.every((c) => r[c] === row[c])) : null;
        if (existing) Object.assign(existing, row);
        else if (table === 'ai_jobs' && rows.some((r) => r.id === row.id)) return send(res, 409, { message: 'duplicate' });
        else rows.push({ created_at: new Date().toISOString(), ...row });
      }
      return send(res, 201);
    }
  }
  send(res, 404, { message: 'not found' });
});

server.listen(port, '127.0.0.1', () => console.log(`mock Supabase on http://127.0.0.1:${port}`));
