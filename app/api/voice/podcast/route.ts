import { synthesizeSegmentsDetailed } from '@/lib/openai';
import { withUser } from '@/lib/server/user';
import { badRequest, MAX_SCRIPT_CHARS, wavResponse } from '@/lib/voice-http';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** Multi-voice podcast. POST { title?, segments: [{ text, voiceId }] } -> audio/wav */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'voice-long', limit: 4 }, async () => {
    const { segments } = await request.json();
    if (!Array.isArray(segments) || segments.length === 0 || segments.length > 30) return badRequest('1-30 segments are required');
    const total = segments.reduce((n: number, s: any) => n + (typeof s?.text === 'string' ? s.text.length : 0), 0);
    if (total === 0 || total > MAX_SCRIPT_CHARS) return badRequest('segment text is empty or too long');

    const { audio, durationsMs } = await synthesizeSegmentsDetailed(segments.map((s: any) => ({ text: String(s.text ?? ''), voice: s.voiceId })));
    return wavResponse(audio, 'podcast.wav', { 'X-Segment-Durations': durationsMs.join(',') });
  });
}
