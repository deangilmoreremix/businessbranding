import { NextResponse } from 'next/server';
import { isConfigured, synthesizeSpeech, transcribeAudio } from '@/lib/openai';
import { performEnhancedAnalysis } from '@/lib/services/ai';
import { errorResponse, rateLimit } from '@/lib/ai-http';
import { badRequest, MAX_SCRIPT_CHARS, wavDataUrl, wavResponse } from '@/lib/voice-http';

export const runtime = 'nodejs';
export const maxDuration = 180;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/** Turn slider settings (0-1) into delivery guidance for the narrator. */
function deliveryFrom(settings: any): string {
  const emotion = settings?.emotion ?? 0.5;
  const pacing = settings?.pacing ?? 0.5;
  return [
    emotion > 0.66 ? 'expressive and warm' : emotion < 0.33 ? 'calm and understated' : 'natural and friendly',
    pacing > 0.66 ? 'brisk pace' : pacing < 0.33 ? 'slow, measured pace' : 'moderate pace',
    'clear articulation'
  ].join(', ');
}

/**
 * Voice enhancement without third-party audio tools: polish the script with the Responses API, then re-narrate it
 * with OpenAI text-to-speech.
 *  - JSON  { text, settings } -> { enhancedContent, audioUrl (data: URL) }
 *  - multipart { audio }      -> audio/wav  (the recording is transcribed with gpt-transcribe, polished, re-narrated)
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'voice-enhance', 4);
  if (limited) return limited;
  try {
    if (!isConfigured()) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured', demo: true }, { status: 503 });

    if ((request.headers.get('content-type') || '').startsWith('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('audio');
      if (!(file instanceof File) || file.size === 0) return badRequest('An audio recording is required');
      if (file.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'Recordings must be 25 MB or smaller' }, { status: 413 });

      const { text } = await transcribeAudio({ data: new Uint8Array(await file.arrayBuffer()), mime: file.type || 'audio/webm', filename: file.name || 'recording.webm' });
      if (!text.trim()) return badRequest('No speech was detected in the recording');
      const enhanced = await performEnhancedAnalysis(text);
      const { audio } = await synthesizeSpeech({ text: enhanced.enhancedContent, instructions: deliveryFrom(undefined) });
      return wavResponse(audio, 'enhanced.wav');
    }

    const { text, settings } = await request.json();
    if (typeof text !== 'string' || !text.trim()) return badRequest('text is required');
    if (text.length > MAX_SCRIPT_CHARS) return badRequest('text is too long');

    const enhancedContent = await performEnhancedAnalysis(text);
    const { audio } = await synthesizeSpeech({ text: enhancedContent.enhancedContent, instructions: deliveryFrom(settings) });
    return NextResponse.json({ enhancedContent, audioUrl: wavDataUrl(audio) });
  } catch (error) {
    return errorResponse(error, 'Failed to enhance voice content');
  }
}
