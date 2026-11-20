// Minimal fetch-based Supabase access for server code (Next.js routes and Edge Functions): verify a user's access token and
// use the service role for the BYOK tables. Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
// The service role key never leaves the server.
import { getEnv } from './openai-core.ts';

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

const baseUrl = () => (getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || '').replace(/\/$/, '');
const serviceKey = () => getEnv('SUPABASE_SERVICE_ROLE_KEY') || '';

function config(): { url: string; key: string } {
  const url = baseUrl();
  const key = serviceKey();
  if (!url || !key) throw new SupabaseConfigError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server.');
  return { url, key };
}

/** Verify a user's access token with Supabase Auth. Returns null when the token is missing, invalid or expired. */
export async function verifyAccessToken(token: string): Promise<{ id: string; email?: string } | null> {
  const { url, key } = config();
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user?.id ? { id: user.id, email: user.email } : null;
}

async function rest(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<any> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {})
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  });
  if (!res.ok) throw new Error(`Supabase request failed (${res.status}) for ${path.split('?')[0]}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const q = (v: string) => encodeURIComponent(v);

// ---- API key rows (ciphertext only) ---------------------------------------------------------
export interface KeyRow {
  ciphertext: string;
  iv: string;
  last4: string;
  updated_at: string;
}

export async function getKeyRow(userId: string, provider = 'openai'): Promise<KeyRow | null> {
  const rows = await rest(`user_api_keys?user_id=eq.${q(userId)}&provider=eq.${q(provider)}&select=ciphertext,iv,last4,updated_at`);
  return rows?.[0] ?? null;
}

export async function upsertKeyRow(userId: string, row: { ciphertext: string; iv: string; last4: string }, provider = 'openai'): Promise<void> {
  await rest('user_api_keys?on_conflict=user_id,provider', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: userId, provider, ...row, updated_at: new Date().toISOString() }
  });
}

export async function deleteKeyRow(userId: string, provider = 'openai'): Promise<void> {
  await rest(`user_api_keys?user_id=eq.${q(userId)}&provider=eq.${q(provider)}`, { method: 'DELETE', prefer: 'return=minimal' });
}

// ---- settings --------------------------------------------------------------------------------
export async function getSettings(userId: string): Promise<Record<string, any>> {
  const rows = await rest(`user_settings?user_id=eq.${q(userId)}&select=settings`);
  return rows?.[0]?.settings ?? {};
}

export async function saveSettings(userId: string, settings: Record<string, any>): Promise<void> {
  await rest('user_settings?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { user_id: userId, settings, updated_at: new Date().toISOString() }
  });
}

// ---- rate limiting, usage log, jobs ----------------------------------------------------------
/** True while the user is within `limit` requests per `windowSeconds`. Throws when the store is unreachable (callers fail closed). */
export async function consumeRateLimit(userId: string, bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const allowed = await rest('rpc/consume_rate_limit', { method: 'POST', body: { p_user: userId, p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds } });
  return allowed !== false;
}

export async function insertUsage(rows: Record<string, unknown>[]): Promise<void> {
  if (!rows.length) return;
  await rest('ai_usage_log', { method: 'POST', prefer: 'return=minimal', body: rows });
}

export async function insertJob(userId: string, id: string, kind: string): Promise<void> {
  await rest('ai_jobs', { method: 'POST', prefer: 'return=minimal', body: { id, user_id: userId, kind } });
}

export async function getJob(userId: string, id: string): Promise<{ id: string; kind: string } | null> {
  const rows = await rest(`ai_jobs?id=eq.${q(id)}&user_id=eq.${q(userId)}&select=id,kind`);
  return rows?.[0] ?? null;
}

// ---- contact form ------------------------------------------------------------------------------
export async function countRecentContacts(clientHash: string, sinceIso: string): Promise<number> {
  const rows = await rest(`contact_submissions?select=id&client_hash=eq.${q(clientHash)}&created_at=gte.${q(sinceIso)}`);
  return Array.isArray(rows) ? rows.length : 0;
}

/** Number of rows (any client) created since `sinceIso`, counted up to `cap + 1`. */
export async function countRecentRows(table: 'contact_submissions' | 'newsletter_subscriptions', sinceIso: string, cap: number): Promise<number> {
  const rows = await rest(`${table}?select=id&created_at=gte.${q(sinceIso)}&limit=${cap + 1}`);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function insertContact(row: { name: string; email: string; subject: string; message: string; client_hash: string; user_id?: string | null }): Promise<void> {
  await rest('contact_submissions', { method: 'POST', prefer: 'return=minimal', body: row });
}

export const supabaseConfigured = (): boolean => !!(baseUrl() && serviceKey());

// ---- public content (published rows) and the newsletter list -------------------------------------
/** Published rows of a public-content table (`blog_posts`, `case_studies`), newest first. Empty when nothing is published. */
export async function listPublished(table: 'blog_posts' | 'case_studies', limit = 50): Promise<Record<string, any>[]> {
  const rows = await rest(`${table}?select=*&published=eq.true&order=${table === 'blog_posts' ? 'published_at' : 'created_at'}.desc&limit=${Math.min(Math.max(limit, 1), 100)}`);
  return Array.isArray(rows) ? rows : [];
}

export async function countRecentNewsletter(clientHash: string, sinceIso: string): Promise<number> {
  const rows = await rest(`newsletter_subscriptions?select=id&client_hash=eq.${q(clientHash)}&created_at=gte.${q(sinceIso)}`);
  return Array.isArray(rows) ? rows.length : 0;
}

/** Saves an address; resolves false when it was already on the list (unique index). */
export async function insertNewsletter(row: { email: string; client_hash: string }): Promise<boolean> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/newsletter_subscriptions`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error(`Supabase request failed (${res.status}) for newsletter_subscriptions`);
  return true;
}

// ---- usage summary (the caller's own ai_usage_log rows) -------------------------------------------
export interface UsageSummary { requests: number; failed: number; inputTokens: number; outputTokens: number; byFeature: Record<string, number>; since: string }

/** Aggregates one user's key-free usage rows since `sinceIso` (at most the latest 2000 rows are read). */
export async function getUsageSummary(userId: string, sinceIso: string): Promise<UsageSummary> {
  const rows = await rest(`ai_usage_log?select=feature,status,input_tokens,output_tokens&user_id=eq.${q(userId)}&created_at=gte.${q(sinceIso)}&limit=2000`);
  const list: any[] = Array.isArray(rows) ? rows : [];
  const out: UsageSummary = { requests: list.length, failed: 0, inputTokens: 0, outputTokens: 0, byFeature: {}, since: sinceIso };
  for (const r of list) {
    if (!/^2/.test(String(r.status))) out.failed++;
    out.inputTokens += Number(r.input_tokens) || 0;
    out.outputTokens += Number(r.output_tokens) || 0;
    const f = String(r.feature || 'other').split(':')[0];
    out.byFeature[f] = (out.byFeature[f] || 0) + 1;
  }
  return out;
}
