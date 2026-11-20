import { NextResponse } from 'next/server';
import { analyzeMultimodal } from '@/lib/services/ai';
import { analyzeVoiceContent } from '@/lib/services/voice';
import { withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withUser(request, { bucket: 'voice-analyze', limit: 20 }, async () => {
    const { text, voiceUrl } = await request.json();
    if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    // Both analyses use Structured Outputs; run them in parallel.
    const [voiceAnalysis, multiModalAnalysis] = await Promise.all([
      analyzeVoiceContent(text),
      analyzeMultimodal({ text, voiceUrl })
    ]);

    return NextResponse.json({
      voice: voiceAnalysis,
      multiModal: multiModalAnalysis,
      recommendations: [...voiceAnalysis.audienceAlignment.recommendations, ...(multiModalAnalysis.recommendations || [])]
    });
  });
}
