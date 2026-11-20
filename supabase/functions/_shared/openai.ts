// Deno entrypoint for Edge Functions: binds the shared core to Deno.env.
import { setEnvReader } from './openai-core.ts';

setEnvReader((name) => Deno.env.get(name));

export * from './openai-core.ts';
export { AI_SCHEMAS } from './schemas.ts';
