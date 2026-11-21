/**
 * Server-side OpenAI helpers for Next.js (Responses API + Images API).
 * Re-exports the shared core (also used by Supabase Edge Functions) bound to process.env.
 *
 * Server-only: OPENAI_API_KEY is never exposed to the browser. Browser code calls /api/ai/*.
 *
 * Env:
 *   OPENAI_API_KEY          required
 *   OPENAI_TEXT_MODEL       default gpt-6.2-sol
 *   OPENAI_REASONING_MODEL  default gpt-6.2-astra (heavy reasoning / research)
 *   OPENAI_IMAGE_MODEL      default gpt-image-2.6-sunburst (gpt-image-2.6-flare = fast)
 *   OPENAI_TRANSCRIBE_MODEL default gpt-transcribe
 *   OPENAI_TTS_MODEL        default gpt-realtime-2.1-mini (Realtime-based text-to-speech)
 *   OPENAI_REALTIME_MODEL   default gpt-realtime-2.1 (live voice)
 *   OPENAI_TTS_ENDPOINT     'realtime' (default) | 'speech' (legacy /v1/audio/speech, uses OPENAI_SPEECH_MODEL)
 */
import WebSocket from 'ws';
import { setEnvReader, setWebSocketFactory } from '../supabase/functions/_shared/openai-core.ts';

setEnvReader((name) => process.env[name]);
// The Realtime WebSocket (used for text-to-speech) needs an Authorization header, which `ws` supports.
setWebSocketFactory((url, headers) => new WebSocket(url, { headers }) as any);

export * from '../supabase/functions/_shared/openai-core.ts';
export { AI_SCHEMAS } from '../supabase/functions/_shared/schemas.ts';
