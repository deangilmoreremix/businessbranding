import { NextResponse } from 'next/server';
import { analyzeMultimodal } from '@/lib/services/gemini';
import { analyzeVoiceContent } from '@/lib/services/eleven-labs';

export async function POST(request: Request) {
  try {
    const { text, voiceUrl } = await request.json();

    // Get voice analysis from ElevenLabs
    const voiceAnalysis = await analyzeVoiceContent(text);

    // Get multi-modal analysis from Gemini
    const multiModalAnalysis = await analyzeMultimodal({
      text,
      voiceUrl
    });

    // Combine analyses
    const combinedAnalysis = {
      voice: voiceAnalysis,
      multiModal: multiModalAnalysis,
      recommendations: [
        ...voiceAnalysis.audienceAlignment.recommendations,
        ...multiModalAnalysis.recommendations || []
      ]
    };

    return NextResponse.json(combinedAnalysis);
  } catch (error) {
    console.error('Voice analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze voice content' },
      { status: 500 }
    );
  }
}