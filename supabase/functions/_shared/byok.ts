// Per-request, per-user OpenAI key resolution (bring-your-own-key) shared by Next.js routes and Edge Functions.
//
// Flow: verify the caller's Supabase session -> per-user rate limit -> load + decrypt that user's key (service role)
// -> run the handler with the key available ONLY through AsyncLocalStorage (never a global, never logged or returned).
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  NotConfiguredError,
  IncompleteError,
  RefusalError,
  describeOpenAIError,
  getEnv,
  serverKeyFallbackAllowed,
  setKeyResolver,
  setModelResolver,
  setUsageLogger,
  type ModelSlot,
  type UsageRecord
} from './openai-core.ts';
import { aadFor, decryptSecret, KeyEncryptionConfigError } from './key-crypto.ts';
import { consumeRateLimit, getKeyRow, getSettings, insertUsage, SupabaseConfigError, verifyAccessToken } from './supabase-rest.ts';

export interface UserContext {
  userId: string;
  /** The user's OpenAI key (decrypted for this request only). */
  key?: string;
  models: Partial<Record<ModelSlot, string>>;
  usage: UsageRecord[];
  /** Write buffered usage rows (key-free) to ai_usage_log. Safe to call more than once. */
  flush: () => Promise<void>;
}

const als = new AsyncLocalStorage<UserContext>();
let installed = false;

/** Install the resolvers into the OpenAI core (idempotent). */
export function installByok() {
  if (installed) return;
  installed = true;
  setKeyResolver(() => als.getStore()?.key);
  setModelResolver((slot) => als.getStore()?.models[slot]);
  setUsageLogger((r) => {
    // Key-free by construction: UsageRecord has no prompt, key or user text.
    console.info('ai_usage', JSON.stringify(r));
    als.getStore()?.usage.push(r);
  });
}

export function currentUser(): UserContext | undefined {
  return als.getStore();
}

export const bearerToken = (req: Request): string | null => {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : null;
};

const MODEL_SLOTS: ModelSlot[] = ['text', 'reasoning', 'image', 'transcribe', 'tts', 'realtime'];
const MODEL_ID = /^[A-Za-z0-9._:/-]{1,80}$/;

/** Keep only well-formed model overrides. */
export function cleanModelOverrides(input: unknown): Partial<Record<ModelSlot, string>> {
  const out: Partial<Record<ModelSlot, string>> = {};
  if (input && typeof input === 'object') {
    for (const slot of MODEL_SLOTS) {
      const v = (input as any)[slot];
      if (typeof v === 'string' && MODEL_ID.test(v.trim())) out[slot] = v.trim();
    }
  }
  return out;
}

/** Decrypt the user's stored key (null if none). */
export async function readUserKey(userId: string): Promise<string | null> {
  const row = await getKeyRow(userId);
  if (!row) return null;
  return decryptSecret(row, getEnv('KEY_ENCRYPTION_SECRET'), aadFor(userId, 'openai'));
}

export async function loadContext(userId: string): Promise<UserContext> {
  const [key, settings] = await Promise.all([readUserKey(userId).catch((e) => { if (e instanceof KeyEncryptionConfigError) throw e; console.error('stored key could not be decrypted for a user'); return null; }), getSettings(userId).catch(() => ({}))]);
  const usage: UsageRecord[] = [];
  const ctx: UserContext = {
    userId,
    key: key ?? undefined,
    models: cleanModelOverrides((settings as any)?.models),
    usage,
    flush: async () => {
      const rows = usage.splice(0).map((r) => ({
        user_id: userId,
        feature: r.feature,
        endpoint: r.endpoint,
        model: r.model ?? null,
        status: String(r.status),
        attempts: r.attempts,
        duration_ms: r.durationMs,
        input_tokens: r.inputTokens ?? null,
        output_tokens: r.outputTokens ?? null,
        reasoning_tokens: r.reasoningTokens ?? null,
        request_id: r.requestId ?? null
      }));
      try {
        await insertUsage(rows);
      } catch {
        /* usage logging must never break a request */
      }
    }
  };
  return ctx;
}

export interface WithUserOptions {
  /** Rate-limit bucket name. */
  bucket: string;
  limit?: number;
  windowSeconds?: number;
  /** Reject with 412 OPENAI_KEY_REQUIRED when the user has no key (default true). */
  requireKey?: boolean;
  /** Extra headers for every response (CORS for Edge Functions). */
  headers?: Record<string, string>;
}

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/** Map any thrown error to a clean JSON response (no stack traces, no key fragments). */
export function errorToResponse(error: unknown, extraHeaders: Record<string, string> = {}, fallback = 'Something went wrong. Please try again.'): Response {
  const friendly = describeOpenAIError(error);
  if (friendly) return json({ error: friendly.message, code: friendly.code, ...(friendly.code === 'OPENAI_KEY_REQUIRED' ? { settingsUrl: '/settings' } : {}) }, friendly.status, extraHeaders);
  if (error instanceof RefusalError) return json({ error: 'The request was declined by the model.', code: 'MODEL_REFUSAL' }, 422, extraHeaders);
  if (error instanceof IncompleteError) return json({ error: 'The response was cut off; try a shorter request.', code: 'RESPONSE_INCOMPLETE' }, 502, extraHeaders);
  if (error instanceof SyntaxError) return json({ error: 'The request body is not valid JSON.', code: 'BAD_REQUEST' }, 400, extraHeaders);
  if (error instanceof KeyEncryptionConfigError || error instanceof SupabaseConfigError) {
    console.error('server configuration error:', (error as Error).message);
    return json({ error: 'The server is not configured for stored API keys yet.', code: 'SERVER_NOT_CONFIGURED' }, 503, extraHeaders);
  }
  console.error('request failed:', error instanceof Error ? error.name : 'unknown error');
  return json({ error: fallback, code: 'INTERNAL_ERROR' }, 500, extraHeaders);
}

/**
 * Run `handler` for an authenticated user with their own OpenAI key available. Responds with:
 *  401 AUTH_REQUIRED (no/invalid session), 429 RATE_LIMITED, 412 OPENAI_KEY_REQUIRED, or the handler's response.
 */
export async function withUser(req: Request, opts: WithUserOptions, handler: (ctx: UserContext) => Promise<Response>): Promise<Response> {
  installByok();
  const h = opts.headers ?? {};
  try {
    const token = bearerToken(req);
    if (!token) return json({ error: 'Please sign in to use this feature.', code: 'AUTH_REQUIRED' }, 401, h);
    const user = await verifyAccessToken(token);
    if (!user) return json({ error: 'Your session has expired. Please sign in again.', code: 'AUTH_REQUIRED' }, 401, h);

    const window = opts.windowSeconds ?? 60;
    if (!(await consumeRateLimit(user.id, opts.bucket, opts.limit ?? 30, window))) {
      return json({ error: 'You are doing that too often. Please wait a moment.', code: 'RATE_LIMITED' }, 429, { 'Retry-After': String(window), ...h });
    }

    const ctx = await loadContext(user.id);
    if ((opts.requireKey ?? true) && !ctx.key && !serverKeyFallbackAllowed()) return errorToResponse(new NotConfiguredError(), h);

    try {
      const res = await als.run(ctx, () => handler(ctx));
      await ctx.flush();
      for (const [k, v] of Object.entries(h)) if (!res.headers.has(k)) res.headers.set(k, v);
      return res;
    } catch (error) {
      await ctx.flush();
      return errorToResponse(error, h);
    }
  } catch (error) {
    return errorToResponse(error, h);
  }
}

/** Run a function inside a user context (used by streaming handlers that outlive the handler return). */
export function runInContext<T>(ctx: UserContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}
