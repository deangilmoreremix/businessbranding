import { edgeHandler } from "../_shared/edge.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { isConfigured, REALTIME_VOICES, synthesizeSegments, synthesizeSpeech, transcribeAudio } from "../_shared/openai.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const wav = (audio: Uint8Array) => new Response(audio, { headers: { ...corsHeaders, 'Content-Type': 'audio/wav' } });

// Voice content router on OpenAI audio (Realtime text-to-speech, gpt-transcribe speech-to-text).
//   GET/POST .../voices      -> built-in voices
//   POST     .../generate    { text, voiceId?, instructions? }          -> audio/wav (+ history row)
//   POST     .../podcast     { segments: [{ text, voiceId }] }          -> audio/wav
//   POST     .../audiobook   { chapters: [{ title, text, voiceId }] }   -> audio/wav
//   POST     .../transcribe  multipart { audio, language?, prompt? }    -> { text, languages }
Deno.serve(edgeHandler(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const endpoint = new URL(req.url).pathname.split('/').pop();

    if (endpoint === 'voices') {
      return json(REALTIME_VOICES.map((v) => ({ voice_id: v, name: v[0].toUpperCase() + v.slice(1), category: 'builtin' })));
    }
    if (!isConfigured()) {
      return json({ demo: true, error: 'OPENAI_API_KEY is not configured' }, 503);
    }

    switch (endpoint) {
      case 'generate': {
        const { text, voiceId, instructions } = await req.json();
        const { audio } = await synthesizeSpeech({ text, voice: voiceId, instructions });

        // Save content generation to the database (best effort)
        try {
          await supabase.from('content_generation_history').insert({
            content_type: 'voice',
            prompt: text,
            generated_content: { voiceId, audioBytes: audio.byteLength },
            metadata: { voiceId, timestamp: new Date().toISOString() }
          });
        } catch (dbError) {
          console.error('Failed to save voice generation to database:', dbError);
        }
        return wav(audio);
      }

      case 'podcast': {
        const { segments } = await req.json();
        return wav(await synthesizeSegments(segments.map((s: any) => ({ text: s.text, voice: s.voiceId }))));
      }

      case 'audiobook': {
        const { chapters } = await req.json();
        return wav(await synthesizeSegments(chapters.map((c: any) => ({ text: `${c.title ? `${c.title}. ` : ''}${c.text}`, voice: c.voiceId }))));
      }

      case 'transcribe': {
        const form = await req.formData();
        const file = form.get('audio') as File;
        const language = form.get('language') as string | null;
        const prompt = form.get('prompt') as string | null;
        const result = await transcribeAudio({
          data: new Uint8Array(await file.arrayBuffer()),
          mime: file.type || 'audio/webm',
          filename: file.name || 'audio.webm',
          prompt: prompt || undefined,
          languages: language ? [language] : undefined
        });
        return json(result);
      }

      default:
        return json({ error: 'Invalid endpoint' }, 404);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, 500);
  }
}, { bucket: 'voice-content' }));
