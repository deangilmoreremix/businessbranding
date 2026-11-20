import { synthesizeSpeech } from '@/lib/openai';
import { errorResponse, rateLimit } from '@/lib/ai-http';
import { badRequest, MAX_SCRIPT_CHARS, wavResponse } from '@/lib/voice-http';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Text-to-speech. POST { text, voiceId?, instructions? } -> audio/wav
 * Runs on the Realtime API (gpt-realtime-2.1-mini by default; OPENAI_TTS_MODEL to change).
 * Disclose to end users that the voice is AI-generated (OpenAI usage policy).
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'voice', 10);
  if (limited) return limited;
  try {
    const { text, voiceId, instructions } = await request.json();
    if (typeof text !== 'string' || !text.trim()) return badRequest('text is required');
    if (text.length > MAX_SCRIPT_CHARS) return badRequest('text is too long');

    const { audio } = await synthesizeSpeech({
      text,
      voice: voiceId,
      instructions: typeof instructions === 'string' ? instructions.slice(0, 500) : undefined
    });
    return wavResponse(audio);
  } catch (error) {
    return errorResponse(error, 'Failed to generate voice content');
  }
}
