import { NextResponse } from 'next/server';
import { optimizeContent } from '@/lib/services/voice';
import { generateBrandingConcepts } from '@/lib/services/ai';
import { withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

const PLATFORMS = ['podcast', 'audiobook', 'advertisement', 'training'] as const;

export async function POST(request: Request) {
  return withUser(request, { bucket: 'voice-optimize', limit: 20 }, async () => {
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
  });
}
