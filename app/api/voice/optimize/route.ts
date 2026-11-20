import { NextResponse } from 'next/server';
import { optimizeContent } from '@/lib/services/eleven-labs';
import { generateBrandingConcepts } from '@/lib/services/ai';

export async function POST(request: Request) {
  try {
    const { text, type, brandGuidelines } = await request.json();

    // Generate optimized content with OpenAI
    const brandingConcepts = await generateBrandingConcepts(text);

    // Optimize for voice with ElevenLabs
    const optimizedContent = await optimizeContent(brandingConcepts.content, {
      text: brandingConcepts.content,
      platform: type,
      preserveKeyMessages: brandingConcepts.keyMessages
    });

    return NextResponse.json({
      optimizedContent,
      brandingConcepts
    });
  } catch (error) {
    console.error('Content optimization failed:', error);
    return NextResponse.json(
      { error: 'Failed to optimize content' },
      { status: 500 }
    );
  }
}