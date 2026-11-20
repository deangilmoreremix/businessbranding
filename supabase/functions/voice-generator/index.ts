import { isConfigured, synthesizeSpeech, NotConfiguredError } from "../_shared/openai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Text-to-speech on the OpenAI Realtime API (gpt-realtime-2.1-mini by default; OPENAI_TTS_MODEL).
// POST { text, voiceId?, instructions? } -> audio/wav
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, voiceId, instructions } = await req.json();
    if (typeof text !== 'string' || !text.trim()) {
      return json({ error: 'Text is required for voice generation' }, 400);
    }

    if (!isConfigured()) {
      return json({ demo: true, error: 'OPENAI_API_KEY is not configured' }, 503);
    }

    const { audio } = await synthesizeSpeech({ text, voice: voiceId, instructions });
    return new Response(audio, { headers: { ...corsHeaders, 'Content-Type': 'audio/wav' } });
  } catch (error) {
    if (error instanceof NotConfiguredError) return json({ demo: true, error: error.message }, 503);
    return json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, 500);
  }
});
