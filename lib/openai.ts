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
 */
import { setEnvReader } from '../supabase/functions/_shared/openai-core.ts';

setEnvReader((name) => process.env[name]);

export * from '../supabase/functions/_shared/openai-core.ts';
export { AI_SCHEMAS } from '../supabase/functions/_shared/schemas.ts';
