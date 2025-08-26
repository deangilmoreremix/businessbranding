import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/voice-generator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, voiceId })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Voice generation failed:", errorText);
      throw new Error(`Voice generation failed: ${response.status} ${response.statusText}`);
    }

    // For audio responses, we need to handle them differently
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('audio')) {
      // Get the audio data as blob
      const audioBlob = await response.blob();
      
      // Create a URL for the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return NextResponse.json({ audioUrl });
    } else {
      // For JSON responses
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Voice generation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate voice content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}