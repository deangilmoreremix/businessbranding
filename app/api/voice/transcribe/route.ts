import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { errorResponse, rateLimit } from '@/lib/ai-http';
import { badRequest } from '@/lib/voice-http';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_BYTES = 25 * 1024 * 1024; // /v1/audio/transcriptions file limit

/**
 * Speech-to-text. multipart: file, language?, prompt?, keywords? (repeatable), model?
 * -> { text, languages }   (gpt-transcribe by default; OPENAI_TRANSCRIBE_MODEL to change)
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'transcribe', 10);
  if (limited) return limited;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) return badRequest('An audio file is required');
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Audio files must be 25 MB or smaller' }, { status: 413 });

    const language = form.get('language');
    const prompt = form.get('prompt');
    const result = await transcribeAudio({
      data: new Uint8Array(await file.arrayBuffer()),
      mime: file.type || 'audio/webm',
      filename: file.name || 'audio.webm',
      prompt: typeof prompt === 'string' && prompt ? prompt.slice(0, 1000) : undefined,
      keywords: form.getAll('keywords').filter((k): k is string => typeof k === 'string').slice(0, 50),
      languages: typeof language === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(language) ? [language] : undefined
      // model is intentionally not client-selectable; set OPENAI_TRANSCRIBE_MODEL on the server
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, 'Failed to transcribe audio');
  }
}
