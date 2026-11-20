import { NextResponse } from 'next/server';
import { IncompleteError, NotConfiguredError, OpenAIError, RefusalError } from '@/lib/openai';

/** Best-effort per-IP rate limit (in-memory: resets on deploy and is not shared across instances). */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(request: Request, bucket: string, limit = 20, windowMs = 60_000): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return null;
  }
  entry.count++;
  if (entry.count > limit) {
    return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.reset - now) / 1000)) } });
  }
  return null;
}

/** Map OpenAI/client errors to an HTTP response without leaking internals. */
export function errorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof NotConfiguredError) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured', demo: true }, { status: 503 });
  }
  if (error instanceof RefusalError) {
    return NextResponse.json({ error: 'The request was declined by the model', refusal: error.refusal }, { status: 422 });
  }
  if (error instanceof IncompleteError) {
    return NextResponse.json({ error: 'The response was cut off; try a shorter request', reason: error.reason }, { status: 502 });
  }
  if (error instanceof OpenAIError) {
    // 4xx from OpenAI (bad input, moderation, quota) surface as-is; 5xx/429 after retries become 502/429.
    const status = error.status === 429 ? 429 : error.status >= 500 ? 502 : 400;
    return NextResponse.json({ error: fallbackMessage, code: error.code, requestId: error.requestId }, { status });
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
