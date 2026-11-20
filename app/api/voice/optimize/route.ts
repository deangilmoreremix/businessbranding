import { NextResponse } from 'next/server';
import { optimizeContent } from '@/lib/services/voice';
import { generateBrandingConcepts } from '@/lib/services/ai';
import { errorResponse, rateLimit } from '@/lib/ai-http';

export const runtime = 'nodejs';

const PLATFORMS = ['podcast', 'audiobook', 'advertisement', 'training'] as const;

export async function POST(request: Request) {
  const limited = rateLimit(request, 'voice-optimize', 20);
  if (limited) return limited;
  try {
    const { text, type } = await request.json();
    if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    // Generate brand-aligned copy, then optimize it for the target platform (both via the Responses API).
    const brandingConcepts = await generateBrandingConcepts(text);
    const optimizedContent = await optimizeContent(brandingConcepts.content, {
      text: brandingConcepts.content,
      platform: PLATFORMS.includes(type) ? type : 'podcast',
      preserveKeyMessages: brandingConcepts.keyMessages
    });

    return NextResponse.json({ optimizedContent, brandingConcepts });
  } catch (error) {
    return errorResponse(error, 'Failed to optimize content');
  }
}
