import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getEdgeSecret } from '../../lib/edge-secrets.ts';

const ELEVEN_LABS_API_KEY = getEdgeSecret('ELEVEN_LABS_API_KEY');
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface PodcastSegment {
  text: string;
  voiceId: string;
}

interface AudiobookChapter {
  title: string;
  text: string;
  voiceId: string;
}

interface TranscriptionOptions {
  language?: string;
  speaker_count?: number;
  word_timing?: boolean;
  model?: string;
}

async function generateVoiceOver(text: string, voiceId: string, settings?: VoiceSettings) {
  if (ELEVEN_LABS_API_KEY === 'demo-mode') {
    return new Uint8Array(0); // Empty audio for demo mode
  }

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
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function createPodcast(segments: PodcastSegment[]) {
  if (ELEVEN_LABS_API_KEY === 'demo-mode') {
    return new Uint8Array(0);
  }

  // Generate audio for each segment
  const segmentAudios = await Promise.all(
    segments.map(segment => generateVoiceOver(segment.text, segment.voiceId))
  );

  // Combine audio segments
  // Note: In a real implementation, you'd want to properly concatenate the audio buffers
  return concatenateAudioBuffers(segmentAudios);
}

async function createAudiobook(chapters: AudiobookChapter[]) {
  if (ELEVEN_LABS_API_KEY === 'demo-mode') {
    return new Uint8Array(0);
  }

  // Generate audio for each chapter
  const chapterAudios = await Promise.all(
    chapters.map(chapter => generateVoiceOver(chapter.text, chapter.voiceId))
  );

  // Combine chapter audio
  return concatenateAudioBuffers(chapterAudios);
}

async function transcribeAudio(audioData: Uint8Array, options?: TranscriptionOptions) {
  if (ELEVEN_LABS_API_KEY === 'demo-mode') {
    return {
      text: "This is a demo transcription.",
      words: [],
      speakers: []
    };
  }

  const formData = new FormData();
  formData.append('audio', new Blob([audioData]));
  if (options?.language) formData.append('language', options.language);
  if (options?.speaker_count) formData.append('speaker_count', options.speaker_count.toString());
  if (options?.word_timing !== undefined) formData.append('word_timing', options.word_timing.toString());
  if (options?.model) formData.append('model', options.model);

  const response = await fetch(`${ELEVEN_LABS_API_URL}/speech-to-text`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_LABS_API_KEY
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getAvailableVoices() {
  if (ELEVEN_LABS_API_KEY === 'demo-mode') {
    return {
      voices: [
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'professional' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'casual' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Antoni', category: 'professional' }
      ]
    };
  }

  const response = await fetch(`${ELEVEN_LABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': ELEVEN_LABS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Helper function to concatenate audio buffers
function concatenateAudioBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  
  return result;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    switch (endpoint) {
      case 'voices':
        const voices = await getAvailableVoices();
        return new Response(JSON.stringify(voices), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'generate':
        const { text, voiceId, settings } = await req.json();
        const audioData = await generateVoiceOver(text, voiceId, settings);
        return new Response(audioData, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' }
        });

      case 'podcast':
        const { segments } = await req.json();
        const podcastAudio = await createPodcast(segments);
        return new Response(podcastAudio, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' }
        });

      case 'audiobook':
        const { chapters } = await req.json();
        const audiobookData = await createAudiobook(chapters);
        return new Response(audiobookData, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' }
        });

      case 'transcribe':
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;
        const options: TranscriptionOptions = {
          language: formData.get('language') as string,
          speaker_count: parseInt(formData.get('speaker_count') as string),
          word_timing: formData.get('word_timing') === 'true',
          model: formData.get('model') as string
        };
        
        const audioBuffer = await audioFile.arrayBuffer();
        const transcription = await transcribeAudio(new Uint8Array(audioBuffer), options);
        return new Response(JSON.stringify(transcription), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid endpoint');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        demo: ELEVEN_LABS_API_KEY === 'demo-mode'
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