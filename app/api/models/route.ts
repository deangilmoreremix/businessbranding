import { NextResponse } from 'next/server';
import { API_KEYS } from '@/lib/api-config';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function GET() {
  try {
    if (API_KEYS.ELEVEN_LABS === 'demo-mode') {
      return NextResponse.json([
        { model_id: 'scribe-v1', name: 'Scribe V1', description: 'Standard transcription model' },
        { model_id: 'scribe-premium-v1', name: 'Scribe Premium V1', description: 'High-accuracy transcription model' }
      ]);
    }

    const response = await fetch(`${ELEVEN_LABS_API_URL}/models/speech-to-text`, {
      headers: {
        'xi-api-key': API_KEYS.ELEVEN_LABS,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If the API returns a 404, return demo data instead of throwing an error
      if (response.status === 404) {
        return NextResponse.json([
          { model_id: 'scribe-v1', name: 'Scribe V1', description: 'Standard transcription model' },
          { model_id: 'scribe-premium-v1', name: 'Scribe Premium V1', description: 'High-accuracy transcription model' }
        ]);
      }
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data.models);
  } catch (error) {
    console.error('Failed to fetch transcription models:', error);
    // Return demo data on error instead of error response
    return NextResponse.json([
      { model_id: 'scribe-v1', name: 'Scribe V1', description: 'Standard transcription model' },
      { model_id: 'scribe-premium-v1', name: 'Scribe Premium V1', description: 'High-accuracy transcription model' }
    ]);
  }
}