#!/usr/bin/env node
/**
 * Minimal in-memory mock of the Supabase endpoints used by the BYOK server code (no real Supabase project is contacted):
 *   GET  /auth/v1/user                      verify access token (tok-alice, tok-bob; tok-expired -> 401)
 *   /rest/v1/user_api_keys                  service-role only (any other caller is rejected, like RLS with no policies)
 *   /rest/v1/user_settings, ai_usage_log, ai_jobs
 *   POST /rest/v1/rpc/consume_rate_limit    fixed-window counter
 *   GET|DELETE /__state                     inspect / reset the in-memory tables (tests only)
 *   POST /auth/v1/token?grant_type=password|refresh_token, POST /auth/v1/signup, POST /auth/v1/recover, PUT /auth/v1/user, POST /auth/v1/logout
 *     (email+password accounts; alice@example.test / bob@example.test with password 'correct-horse-battery'; CORS enabled for the browser client;
 *      access tokens are JWT-shaped like real ones, as the auth-helpers cookie storage decodes them; POST /__config {confirm:true} makes sign-up require email confirmation)
 *   node scripts/mock-supabase-server.mjs [port]
 */
import http from 'node:http';

const port = Number(process.argv[2] || 4998);
export const SERVICE_KEY = 'service-role-test-key';
const USERS = {
  'tok-alice': { id: '11111111-1111-4111-8111-111111111111', email: 'alice@example.test' },
  'tok-bob': { id: '22222222-2222-4222-8222-222222222222', email: 'bob@example.test' }
};

// ---- email+password accounts (browser sign-in flow) ----
const ALICE_ID = '11111111-1111-4111-8111-111111111111';
const BOB_ID = '22222222-2222-4222-8222-222222222222';
const accounts = new Map([
  ['alice@example.test', { id: ALICE_ID, email: 'alice@example.test', password: 'correct-horse-battery' }],
  ['bob@example.test', { id: BOB_ID, email: 'bob@example.test', password: 'correct-horse-battery' }]
]);
const recoveries = [];
let requireConfirm = false;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const issueSession = (acct) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: acct.id, email: acct.email, aud: 'authenticated', role: 'authenticated', exp })}.mock-signature`;
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'refresh-' + acct.id, user: userObj(acct) };
};
const userObj = (a) => ({ id: a.id, email: a.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
const userForBearer = (token) => {
  if (USERS[token]) return USERS[token];
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    const a = [...accounts.values()].find((x) => x.id === p.sub);
    return a ? { id: a.id, email: a.email } : null;
  } catch { return null; }
};
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' };

let failRpc = false; // test hook: make the rate-limit RPC fail (POST /__fail {rpc:true})
const db = { content_items: [], voice_profiles: [], image_assets: [], user_api_keys: [], user_settings: [], ai_usage_log: [], ai_jobs: [], contact_submissions: [], newsletter_subscriptions: [], blog_posts: [], case_studies: [], limits: new Map(), requests: [] };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const parseFilters = (url) => {
  const f = {};
  for (const [k, v] of url.searchParams) {
    if (v.startsWith('eq.')) f[k] = { op: 'eq', v: decodeURIComponent(v.slice(3)) };
    else if (v.startsWith('gte.')) f[k] = { op: 'gte', v: decodeURIComponent(v.slice(4)) };
  }
  return f;
};
const matches = (row, f) => Object.entries(f).every(([k, c]) => (c.op === 'gte' ? String(row[k]) >= c.v : String(row[k]) === c.v));

const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  const url = new URL(req.url, 'http://x');
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  db.requests.push({ method: req.method, path: url.pathname });

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (url.pathname === '/__config' && req.method === 'POST') { requireConfirm = !!JSON.parse(raw || '{}').confirm; return send(res, 200, { requireConfirm }); }
  if (url.pathname === '/__recoveries') return send(res, 200, recoveries);

  if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
    const body = JSON.parse(raw || '{}');
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const a = accounts.get(String(body.email || '').toLowerCase());
      if (!a || a.password !== body.password) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials', message: 'Invalid login credentials' });
      return send(res, 200, issueSession(a));
    }
    if (grant === 'refresh_token') {
      const a = [...accounts.values()].find((x) => 'refresh-' + x.id === body.refresh_token);
      return a ? send(res, 200, issueSession(a)) : send(res, 400, { message: 'Invalid Refresh Token' });
    }
    return send(res, 400, { message: 'unsupported grant' });
  }
  if (url.pathname === '/auth/v1/signup' && req.method === 'POST') {
    const body = JSON.parse(raw || '{}');
    const email = String(body.email || '').toLowerCase();
    if (String(body.password || '').length < 12) return send(res, 422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least 12 characters.', message: 'Password should be at least 12 characters.' });
    if (accounts.has(email)) return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered', message: 'User already registered' });
    const a = { id: crypto.randomUUID(), email, password: body.password };
    accounts.set(email, a);
    return send(res, 200, requireConfirm ? userObj(a) : issueSession(a));
  }
  if (url.pathname === '/auth/v1/recover' && req.method === 'POST') {
    const body = JSON.parse(raw || '{}');
    recoveries.push({ email: body.email, redirect: url.searchParams.get('redirect_to') });
    return send(res, 200, {});
  }
  if (url.pathname === '/auth/v1/logout') return send(res, 204);
  if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
    const u = userForBearer(bearer);
    if (!u) return send(res, 401, { message: 'invalid JWT' });
    const a = [...accounts.values()].find((x) => x.id === u.id);
    const body = JSON.parse(raw || '{}');
    if (a && body.password) { if (String(body.password).length < 12) return send(res, 422, { message: 'Password should be at least 12 characters.' }); a.password = body.password; }
    return send(res, 200, userObj(a ?? { ...u }));
  }

  if (url.pathname === '/__fail' && req.method === 'POST') { failRpc = !!JSON.parse(raw || '{}').rpc; return send(res, 200, { failRpc }); }
  if (url.pathname === '/__state') {
    if (req.method === 'DELETE') { for (const k of ['content_items', 'voice_profiles', 'image_assets', 'user_api_keys', 'user_settings', 'ai_usage_log', 'ai_jobs', 'contact_submissions', 'newsletter_subscriptions', 'blog_posts', 'case_studies']) db[k] = []; db.limits.clear(); db.requests = []; return send(res, 200, {}); }
    return send(res, 200, { ...db, limits: [...db.limits.entries()] });
  }

  if (url.pathname === '/auth/v1/user') {
    const user = userForBearer(bearer);
    if (!user || !req.headers.apikey) return send(res, 401, { message: 'invalid JWT' });
    return send(res, 200, user);
  }

  if (url.pathname.startsWith('/rest/v1/')) {
    const table = url.pathname.slice('/rest/v1/'.length);
    // owner-scoped user tables (RLS: authenticated users reach only rows whose user_id is theirs)
    if (['content_items', 'voice_profiles', 'image_assets'].includes(table)) {
      const me = userForBearer(bearer);
      if (!me) return send(res, 401, { code: '42501', message: 'permission denied' });
      const rows = db[table];
      const f = parseFilters(url);
      if (req.method === 'GET') return send(res, 200, rows.filter((r) => r.user_id === me.id && matches(r, f)));
      if (req.method === 'DELETE') { db[table] = rows.filter((r) => !(r.user_id === me.id && matches(r, f))); return send(res, 204); }
      if (req.method === 'POST') {
        const list = [].concat(JSON.parse(raw));
        if (list.some((r) => r.user_id !== me.id)) return send(res, 403, { code: '42501', message: 'new row violates row-level security policy' });
        const made = list.map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...r }));
        rows.push(...made);
        return send(res, 201, made[0]);
      }
    }
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

    if (!['user_api_keys', 'user_settings', 'ai_usage_log', 'ai_jobs', 'contact_submissions', 'newsletter_subscriptions', 'blog_posts', 'case_studies'].includes(table)) return send(res, 404, { message: 'unknown table' });
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
        else if (table === 'newsletter_subscriptions' && rows.some((r) => String(r.email).toLowerCase() === String(row.email).toLowerCase())) return send(res, 409, { message: 'duplicate' });
        else rows.push({ created_at: new Date().toISOString(), ...row });
      }
      return send(res, 201);
    }
  }
  send(res, 404, { message: 'not found' });
});

server.listen(port, '127.0.0.1', () => console.log(`mock Supabase on http://127.0.0.1:${port}`));
