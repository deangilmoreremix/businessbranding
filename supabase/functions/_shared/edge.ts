// Entry helper for AI Edge Functions: answers CORS preflight, then requires a signed-in user and runs the handler with that
// user's own OpenAI key (see byok.ts). Secrets needed on the function: KEY_ENCRYPTION_SECRET (SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase).
import './openai.ts'; // binds Deno.env and the WebSocket factory to the OpenAI core
import { withUser } from './byok.ts';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey'
};

export function edgeHandler(handler: (req: Request) => Promise<Response>, opts: { bucket: string; limit?: number; requireKey?: boolean }) {
  return (req: Request): Promise<Response> | Response =>
    req.method === 'OPTIONS'
      ? new Response(null, { status: 200, headers: CORS_HEADERS })
      : withUser(req, { limit: 20, ...opts, headers: CORS_HEADERS }, () => handler(req));
}
