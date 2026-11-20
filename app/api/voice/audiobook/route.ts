import { synthesizeSegmentsDetailed } from '@/lib/openai';
import { withUser } from '@/lib/server/user';
import { badRequest, MAX_SCRIPT_CHARS, wavResponse } from '@/lib/voice-http';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** Audiobook. POST { title, author, narrator, chapters: [{ title, text, voiceId }] } -> audio/wav (chapters narrated in order) */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'voice-long', limit: 4 }, async () => {
    const { chapters } = await request.json();
    if (!Array.isArray(chapters) || chapters.length === 0 || chapters.length > 30) return badRequest('1-30 chapters are required');
    const total = chapters.reduce((n: number, c: any) => n + (typeof c?.text === 'string' ? c.text.length : 0), 0);
    if (total === 0 || total > MAX_SCRIPT_CHARS) return badRequest('chapter text is empty or too long');

    const { audio, durationsMs } = await synthesizeSegmentsDetailed(
      chapters.map((c: any) => ({ text: `${c.title ? `${c.title}. ` : ''}${c.text ?? ''}`, voice: c.voiceId }))
    );
    return wavResponse(audio, 'audiobook.wav', { 'X-Segment-Durations': durationsMs.join(',') });
  });
}
