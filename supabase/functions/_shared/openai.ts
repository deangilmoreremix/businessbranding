// Deno entrypoint for Edge Functions: binds the shared core to Deno.env.
import { setEnvReader, setWebSocketFactory } from './openai-core.ts';

setEnvReader((name) => Deno.env.get(name));
// Deno's WebSocket accepts a `headers` option, which the Realtime API needs for Authorization.
setWebSocketFactory((url, headers) => new (WebSocket as any)(url, { headers }));

export * from './openai-core.ts';
export { AI_SCHEMAS } from './schemas.ts';
