import { NextResponse } from 'next/server';
import { AUDIO_MODELS } from '@/lib/openai';

export const dynamic = 'force-dynamic';

/** Transcription models offered in the UI (configure with OPENAI_TRANSCRIBE_MODEL). */
export async function GET() {
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || AUDIO_MODELS.transcribe;
  return NextResponse.json([{ model_id: model, name: model, description: 'OpenAI speech-to-text (file transcription)' }]);
}
