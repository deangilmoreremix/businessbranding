import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { content, type } = await request.json();

    if (!content || !type) {
      return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
    }

    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-analysis`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, type })
      }
    );

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Try to parse the text field as JSON for structured analysis
    // `analysis` is the structured result when the model returned JSON, otherwise the raw text.
    let parsed: unknown = undefined;
    if (typeof data.text === 'string') {
      try {
        parsed = JSON.parse(data.text);
      } catch {
        // Plain-text analysis; keep the raw text
      }
    }

    return NextResponse.json({ ...data, parsed, analysis: parsed ?? data.text ?? data });
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze content',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}