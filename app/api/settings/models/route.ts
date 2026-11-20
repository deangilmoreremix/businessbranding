import { NextResponse } from 'next/server';
import { cleanModelOverrides, getSettings, saveSettings, withUser } from '@/lib/server/user';
import { AUDIO_MODELS, MODELS } from '@/lib/openai';

export const runtime = 'nodejs';

const SLOTS = ['text', 'reasoning', 'image', 'transcribe', 'tts', 'realtime'] as const;

const DEFAULTS = {
  text: MODELS.text,
  reasoning: MODELS.reasoning,
  image: MODELS.image,
  transcribe: AUDIO_MODELS.transcribe,
  tts: AUDIO_MODELS.tts,
  realtime: AUDIO_MODELS.realtime
};

/**
 * Per-user model overrides (for accounts without access to the default models).
 *  GET -> { overrides, defaults }
 *  PUT { text?, reasoning?, image?, transcribe?, tts?, realtime? }  (empty string clears a slot)
 */
export async function GET(request: Request) {
  return withUser(request, { bucket: 'settings', limit: 60, requireKey: false }, async (ctx) => {
    const settings = await getSettings(ctx.userId);
    return NextResponse.json({ overrides: cleanModelOverrides(settings.models), defaults: DEFAULTS });
  });
}

export async function PUT(request: Request) {
  return withUser(request, { bucket: 'settings-write', limit: 20, requireKey: false }, async (ctx) => {
    const body = await request.json();
    const settings = await getSettings(ctx.userId);
    const next = { ...cleanModelOverrides(settings.models) } as Record<string, string>;
    for (const slot of SLOTS) {
      if (!(slot in (body ?? {}))) continue;
      const incoming = body[slot];
      if (incoming === '' || incoming === null) delete next[slot];
      else if (typeof incoming === 'string') {
        const clean = cleanModelOverrides({ [slot]: incoming });
        if (!(slot in clean)) return NextResponse.json({ error: `"${incoming}" is not a valid model id.`, code: 'INVALID_MODEL_ID' }, { status: 400 });
        next[slot] = clean[slot]!;
      }
    }
    await saveSettings(ctx.userId, { ...settings, models: next });
    return NextResponse.json({ overrides: next, defaults: DEFAULTS });
  });
}
