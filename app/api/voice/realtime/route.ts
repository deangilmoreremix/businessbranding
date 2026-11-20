import { NextResponse } from 'next/server';
import { createRealtimeClientSecret, isConfigured, realtimeCallsUrl } from '@/lib/openai';
import { errorResponse, rateLimit } from '@/lib/ai-http';

export const runtime = 'nodejs';

const DEFAULT_INSTRUCTIONS =
  'You are a friendly voice assistant for a brand-building app. Help with brand strategy, naming, messaging and voice. Keep answers short and conversational.';

/**
 * Live voice (Realtime API over WebRTC).
 * POST { voiceId?, instructions? } -> { value, model, callsUrl }
 * `value` is a short-lived client secret; the browser sends its SDP offer to `callsUrl` with
 * `Authorization: Bearer <value>`. The real API key never leaves the server.
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'realtime', 6);
  if (limited) return limited;
  try {
    if (!isConfigured()) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured', demo: true }, { status: 503 });
    const body = await request.json().catch(() => ({}));
    const secret = await createRealtimeClientSecret({
      voice: body.voiceId,
      instructions: typeof body.instructions === 'string' ? body.instructions.slice(0, 2000) : DEFAULT_INSTRUCTIONS
    });
    return NextResponse.json({ value: secret.value, expiresAt: secret.expires_at, model: secret.model, callsUrl: realtimeCallsUrl() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Failed to start a live voice session');
  }
}
