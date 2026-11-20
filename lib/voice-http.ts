import { NextResponse } from 'next/server';

/** Narration/instructions guard: keep prompts to a sane size. */
export const MAX_SCRIPT_CHARS = 20_000;

export function wavResponse(audio: Uint8Array, filename = 'speech.wav', extraHeaders: Record<string, string> = {}): Response {
  return new Response(audio as BodyInit, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(audio.byteLength),
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** data: URL for a WAV (used where the UI expects a URL string in JSON). */
export function wavDataUrl(audio: Uint8Array): string {
  return `data:audio/wav;base64,${Buffer.from(audio).toString('base64')}`;
}
