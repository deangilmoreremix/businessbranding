import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY') || 'sk_fb7727a3bf18505f7fc589c1c1c02a599635c3344a754423';
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
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
    // Parse request data
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM', settings } = await req.json();
    
    if (!text) {
      throw new Error('Text is required for voice generation');
    }

    // Return empty audio for demo mode
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'demo-mode') {
      console.log('Running in demo mode - returning empty audio');
      return new Response(
        new Uint8Array(0),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg'
          }
        }
      );
    }

    console.log('Generating voice content for:', text.substring(0, 50) + '...');

    // Make request to ElevenLabs API
    const response = await fetch(`${ELEVEN_LABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: settings || {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    // Get audio blob from response
    const audioBlob = await response.arrayBuffer();

    return new Response(
      audioBlob,
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg'
        }
      }
    );
  } catch (error) {
    console.error('Voice generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
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