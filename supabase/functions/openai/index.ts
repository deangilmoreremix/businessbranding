import { edgeHandler } from "../_shared/edge.ts";
import { createResponse, generateImage, isConfigured, NotConfiguredError } from "../_shared/openai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

// General-purpose endpoint.
// POST { prompt, type?: 'text' | 'image', effort?, size?, quality? }
//   text  -> { text, citations }   Responses API (gpt-6.2-sol by default)
//   image -> { images }            Images API (gpt-image-2.6-sunburst by default), data URLs
Deno.serve(edgeHandler(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!isConfigured()) {
      return json({ error: 'Add your OpenAI key in Settings to use this.', code: 'OPENAI_KEY_REQUIRED' }, 412);
    }

    const { prompt, type = 'text', effort, size, quality } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return json({ error: 'prompt is required' }, 400);
    }

    if (type === 'image') {
      const images = await generateImage({ prompt, size, quality });
      return json({ images: images.map((i) => i.dataUrl) });
    }

    const result = await createResponse({
      input: prompt,
      effort: ['low', 'medium', 'high', 'xhigh'].includes(effort) ? effort : 'low',
      feature: 'openai-function'
    });
    return json({ text: result.text, citations: result.citations });
  } catch (error) {
    if (error instanceof NotConfiguredError) return json({ error: 'Add your OpenAI key in Settings to use this.', code: 'OPENAI_KEY_REQUIRED' }, 412);
    return json({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, 500);
  }
}, { bucket: 'openai' }));
