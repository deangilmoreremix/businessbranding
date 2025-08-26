import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RECRAFT_API_KEY = Deno.env.get('RECRAFT_API_KEY') || '26XV1YysQNKN80etbUotvcw86U6kf5F5cGRgJV4YDoRcibFtKtYUpVMHhETR7AMN';
const RECRAFT_API_URL = 'https://api.recraft.ai/v1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image_url, prompt, style_preset } = await req.json();

    const response = await fetch(`${RECRAFT_API_URL}/transform`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RECRAFT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url,
        prompt,
        style_preset,
        width: 1024,
        height: 1024,
        num_outputs: 2
      })
    });

    if (!response.ok) {
      throw new Error(`Recraft API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});