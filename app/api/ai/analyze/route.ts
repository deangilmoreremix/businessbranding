import { NextResponse } from 'next/server';
import { bearerToken, withUser } from '@/lib/server/user';

/**
 * POST { content, type } -> analysis. Authenticates the caller, then forwards THEIR session token to the `ai-analysis`
 * Edge Function, which resolves the caller's own OpenAI key (the key never passes through this route).
 */
export async function POST(request: Request) {
  const token = bearerToken(request);
  return withUser(request, { bucket: 'ai-analyze', limit: 20, requireKey: false }, async () => {
    const { content, type } = await request.json();
    if (!content || !type) return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-analysis`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data.error || 'Analysis failed', code: data.code }, { status: response.status });

    // `analysis` is the structured result when the model returned JSON, otherwise the raw text.
    let parsed: unknown = undefined;
    if (typeof data.text === 'string') {
      try {
        parsed = JSON.parse(data.text);
      } catch {
        // Plain-text analysis; keep the raw text
      }
    }
    return NextResponse.json({ ...data, parsed, analysis: parsed ?? data.text ?? data });
  });
}
