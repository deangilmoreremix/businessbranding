import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/eleven-labs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const speakerCount = parseInt(formData.get('speakerCount') as string);
    const wordTiming = formData.get('wordTiming') === 'true';
    const model = formData.get('model') as string;

    const result = await transcribeAudio({
      audio: file,
      language,
      speaker_count: speakerCount,
      word_timing: wordTiming,
      model
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription failed:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}