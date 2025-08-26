import { NextResponse } from 'next/server';
import { performEnhancedAnalysis } from '@/lib/services/gemini';
import { enhanceAudioQuality } from '@/lib/services/eleven-labs';

export async function POST(request: Request) {
  try {
    const { text, settings } = await request.json();

    // Analyze and enhance text content with Gemini
    const enhancedContent = await performEnhancedAnalysis(text);

    // Enhance audio quality with ElevenLabs
    const enhancedAudio = await enhanceAudioQuality({
      audio: new Blob([text], { type: 'text/plain' }),
      removeBackground: true,
      enhanceClarity: settings.clarity > 0.5,
      normalizeLevels: true,
      improveArticulation: settings.naturalness > 0.5
    });

    return NextResponse.json({
      enhancedContent,
      audioUrl: URL.createObjectURL(enhancedAudio)
    });
  } catch (error) {
    console.error('Voice enhancement failed:', error);
    return NextResponse.json(
      { error: 'Failed to enhance voice content' },
      { status: 500 }
    );
  }
}