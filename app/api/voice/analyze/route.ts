import { NextResponse } from 'next/server';
import { analyzeMultimodal } from '@/lib/services/ai';
import { analyzeVoiceContent } from '@/lib/services/voice';
import { errorResponse, rateLimit } from '@/lib/ai-http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const limited = rateLimit(request, 'voice-analyze', 20);
  if (limited) return limited;
  try {
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
  } catch (error) {
    return errorResponse(error, 'Failed to analyze voice content');
  }
}
