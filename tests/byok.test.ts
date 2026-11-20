import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import '@/lib/openai';
import { aadFor, decryptSecret, encryptSecret, last4Of, parseMasterKey } from '../supabase/functions/_shared/key-crypto.ts';
import { getApiKey, isConfigured, textModel, describeOpenAIError, OpenAIError, NotConfiguredError, redactKeys, imageModel } from '../supabase/functions/_shared/openai-core.ts';
import { cleanModelOverrides, withUser } from '../supabase/functions/_shared/byok.ts';
import { getKeyRow, upsertKeyRow } from '../supabase/functions/_shared/supabase-rest.ts';

const MASTER = randomBytes(32).toString('base64');
const PORT = 4977;
const SERVICE_KEY = 'service-role-test-key';
const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
let mock: ChildProcess;

const state = async () => (await fetch(`http://127.0.0.1:${PORT}/__state`)).json() as Promise<any>;
const req = (token?: string) => new Request('http://app/api/x', { headers: token ? { authorization: `Bearer ${token}` } : {} });

async function storeKey(userId: string, key: string) {
  const enc = await encryptSecret(key, MASTER, aadFor(userId, 'openai'));
  await upsertKeyRow(userId, { ...enc, last4: last4Of(key) });
}

beforeAll(async () => {
  mock = spawn('node', ['scripts/mock-supabase-server.mjs', String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/__state`); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  process.env.SUPABASE_URL = `http://127.0.0.1:${PORT}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
  process.env.KEY_ENCRYPTION_SECRET = MASTER;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ALLOW_SERVER_OPENAI_KEY;
});
afterAll(() => { mock?.kill(); });
beforeEach(async () => { await fetch(`http://127.0.0.1:${PORT}/__state`, { method: 'DELETE' }); });

describe('AES-256-GCM key encryption', () => {
  const aad = aadFor(ALICE, 'openai');
  it('round-trips and never contains the plaintext', async () => {
    const enc = await encryptSecret('sk-test-1234567890abcd', MASTER, aad);
    expect(enc.ciphertext).not.toContain('sk-test');
    expect(atob(enc.ciphertext)).not.toContain('sk-test');
    expect(await decryptSecret(enc, MASTER, aad)).toBe('sk-test-1234567890abcd');
  });
  it('uses a fresh IV each time', async () => {
    const a = await encryptSecret('same', MASTER, aad);
    const b = await encryptSecret('same', MASTER, aad);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
  it('rejects tampering, another owner (AAD) and the wrong master key', async () => {
    const enc = await encryptSecret('secret', MASTER, aad);
    const bytes = Uint8Array.from(atob(enc.ciphertext), (c) => c.charCodeAt(0));
    bytes[0] ^= 1;
    await expect(decryptSecret({ ...enc, ciphertext: btoa(String.fromCharCode(...bytes)) }, MASTER, aad)).rejects.toBeTruthy();
    await expect(decryptSecret(enc, MASTER, aadFor(BOB, 'openai'))).rejects.toBeTruthy();
    await expect(decryptSecret(enc, randomBytes(32).toString('base64'), aad)).rejects.toBeTruthy();
  });
  it('validates the master key (base64 or hex, exactly 32 bytes)', () => {
    expect(parseMasterKey(MASTER)).toHaveLength(32);
    expect(parseMasterKey(randomBytes(32).toString('hex'))).toHaveLength(32);
    expect(() => parseMasterKey(undefined)).toThrow(/KEY_ENCRYPTION_SECRET/);
    expect(() => parseMasterKey('short')).toThrow(/32 random bytes/);
    expect(() => parseMasterKey(randomBytes(16).toString('base64'))).toThrow(/32 random bytes/);
  });
  it('keeps only the last four characters for display', () => expect(last4Of(' sk-abcdEFGH ')).toBe('EFGH'));
});

describe('withUser (session, rate limit, key, isolation)', () => {
  it('401 without a token and with an invalid/expired token', async () => {
    const a = await withUser(req(), { bucket: 't' }, async () => new Response('ok'));
    expect(a.status).toBe(401);
    expect((await a.json()).code).toBe('AUTH_REQUIRED');
    const b = await withUser(req('tok-expired'), { bucket: 't' }, async () => new Response('ok'));
    expect(b.status).toBe(401);
  });

  it('412 OPENAI_KEY_REQUIRED when the user has no key (and no stack trace)', async () => {
    const r = await withUser(req('tok-alice'), { bucket: 't' }, async () => new Response('ok'));
    const body = await r.json();
    expect(r.status).toBe(412);
    expect(body.code).toBe('OPENAI_KEY_REQUIRED');
    expect(body.settingsUrl).toBe('/settings');
    expect(JSON.stringify(body)).not.toMatch(/at \w+|node_modules/);
  });

  it('lets handlers that do not need a key run without one', async () => {
    const r = await withUser(req('tok-alice'), { bucket: 't', requireKey: false }, async () => new Response('free'));
    expect(await r.text()).toBe('free');
  });

  it("resolves each user's own key per request, with no shared state", async () => {
    await storeKey(ALICE, 'sk-alice-AAAA1111');
    await storeKey(BOB, 'sk-bob-BBBB2222');
    const seen: string[] = [];
    const run = (token: string) => withUser(req(token), { bucket: 't' }, async () => {
      await new Promise((r) => setTimeout(r, Math.random() * 20));
      seen.push(`${token}:${getApiKey()}`);
      return new Response('ok');
    });
    await Promise.all([run('tok-alice'), run('tok-bob'), run('tok-alice'), run('tok-bob')]);
    expect(seen.sort()).toEqual(['tok-alice:sk-alice-AAAA1111', 'tok-alice:sk-alice-AAAA1111', 'tok-bob:sk-bob-BBBB2222', 'tok-bob:sk-bob-BBBB2222']);
    expect(isConfigured()).toBe(false); // outside a request there is no key
    expect(getApiKey()).toBeUndefined();
  });

  it('stores only ciphertext (never the key) in the database', async () => {
    await storeKey(ALICE, 'sk-alice-AAAA1111');
    const row = await getKeyRow(ALICE);
    expect(row!.last4).toBe('1111');
    expect(JSON.stringify(await state())).not.toContain('sk-alice');
  });

  it('applies per-user model overrides (user > env > default)', async () => {
    await storeKey(ALICE, 'sk-alice-AAAA1111');
    await fetch(`http://127.0.0.1:${PORT}/rest/v1/user_settings?on_conflict=user_id`, { method: 'POST', headers: { authorization: `Bearer ${SERVICE_KEY}` }, body: JSON.stringify({ user_id: ALICE, settings: { models: { text: 'gpt-4.1', image: 'bad model!' } } }) });
    let inside = '';
    let image = '';
    await withUser(req('tok-alice'), { bucket: 't' }, async () => { inside = textModel(); image = imageModel(); return new Response('ok'); });
    expect(inside).toBe('gpt-4.1');
    expect(image).toBe('gpt-image-2.6-sunburst'); // malformed override ignored
    expect(textModel()).toBe('gpt-6.2-sol');
  });

  it('rate-limits per user (not per IP) and tells the client when to retry', async () => {
    await storeKey(ALICE, 'sk-alice-AAAA1111');
    await storeKey(BOB, 'sk-bob-BBBB2222');
    const call = (t: string) => withUser(req(t), { bucket: 'limited', limit: 2, windowSeconds: 3600 }, async () => new Response('ok'));
    expect((await call('tok-alice')).status).toBe(200);
    expect((await call('tok-alice')).status).toBe(200);
    const limited = await call('tok-alice');
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('3600');
    expect((await call('tok-bob')).status).toBe(200); // another user is unaffected
  });

  it('writes key-free usage rows for the user', async () => {
    await storeKey(ALICE, 'sk-alice-AAAA1111');
    const { createResponse } = await import('../supabase/functions/_shared/openai-core.ts');
    // stand in for an OpenAI call by pushing through the logger path
    await withUser(req('tok-alice'), { bucket: 't' }, async (ctx) => {
      ctx.usage.push({ feature: 'test', endpoint: '/responses', model: 'gpt-6.2-sol', status: 200, attempts: 1, durationMs: 5, inputTokens: 3, outputTokens: 4 });
      void createResponse;
      return new Response('ok');
    });
    const log = (await state()).ai_usage_log;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ user_id: ALICE, feature: 'test', model: 'gpt-6.2-sol', input_tokens: 3 });
    expect(JSON.stringify(log)).not.toMatch(/sk-/);
  });

  it('only falls back to a server key when ALLOW_SERVER_OPENAI_KEY=true', async () => {
    process.env.OPENAI_API_KEY = 'sk-server-ZZZZ9999';
    expect(isConfigured()).toBe(false);
    process.env.ALLOW_SERVER_OPENAI_KEY = 'true';
    expect(getApiKey()).toBe('sk-server-ZZZZ9999');
    delete process.env.ALLOW_SERVER_OPENAI_KEY;
    delete process.env.OPENAI_API_KEY;
  });
});

describe('friendly OpenAI errors', () => {
  const err = (status: number, code?: string, message = 'x') => new OpenAIError(message, { status, code });
  it('maps 401/403/404 model/429 quota/429 rate/5xx', () => {
    expect(describeOpenAIError(err(401))).toMatchObject({ status: 401, code: 'OPENAI_KEY_INVALID' });
    expect(describeOpenAIError(err(403))).toMatchObject({ status: 403, code: 'OPENAI_FORBIDDEN' });
    const m = describeOpenAIError(err(404, 'model_not_found'), 'gpt-6.2-sol')!;
    expect(m).toMatchObject({ status: 424, code: 'OPENAI_MODEL_UNAVAILABLE' });
    expect(m.message).toContain('gpt-6.2-sol');
    expect(m.message).toContain('Settings');
    expect(describeOpenAIError(err(429, 'insufficient_quota'))).toMatchObject({ status: 402, code: 'OPENAI_QUOTA_EXCEEDED' });
    expect(describeOpenAIError(err(429, 'rate_limit_exceeded'))).toMatchObject({ status: 429, code: 'OPENAI_RATE_LIMITED' });
    expect(describeOpenAIError(err(503))).toMatchObject({ status: 502, code: 'OPENAI_UNAVAILABLE' });
    expect(describeOpenAIError(new NotConfiguredError())).toMatchObject({ status: 412, code: 'OPENAI_KEY_REQUIRED' });
    expect(describeOpenAIError(new Error('boom'))).toBeNull();
  });
  it('never echoes key fragments from upstream messages', () => {
    expect(redactKeys('Incorrect API key provided: sk-proj-abc***xyz. You can find it')).not.toMatch(/sk-proj/);
    expect(describeOpenAIError(err(401, 'invalid_api_key', 'Incorrect API key provided: sk-abc***'))!.message).not.toMatch(/sk-/);
  });
});

describe('cleanModelOverrides', () => {
  it('keeps valid ids only', () => {
    expect(cleanModelOverrides({ text: ' gpt-6.2-astra ', image: 'x y', tts: 5, bogus: 'a', realtime: 'gpt-realtime-2.1' })).toEqual({ text: 'gpt-6.2-astra', realtime: 'gpt-realtime-2.1' });
    expect(cleanModelOverrides(null)).toEqual({});
  });
});
