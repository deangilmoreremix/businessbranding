import { NextResponse } from 'next/server';
import { generateBrandingConcepts } from '@/lib/services/ai';
import { withUser } from '@/lib/server/user';
import { isConfigured } from '@/lib/openai';

export const runtime = 'nodejs';

/** POST { businessIdea, improvements[] } -> { updatedContent }. Signed-in users only; sample data (flagged) without a key. */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'update-brand-content', limit: 20, requireKey: false }, async () => {
    const { businessIdea, improvements } = await request.json();
    if (typeof businessIdea !== 'string' || !businessIdea.trim() || businessIdea.length > 4000) {
      return NextResponse.json({ error: 'businessIdea is required' }, { status: 400 });
    }
    const list = Array.isArray(improvements) ? improvements.filter((i) => typeof i === 'string').slice(0, 20).map((i) => i.slice(0, 300)) : [];

    const prompt = `Enhance and improve the following business concept: ${businessIdea}
    
    Focus on these improvement areas:
    ${list.join('\n')}
    
    Provide an enhanced and modernized version of the brand strategy.`;

    const updatedContent = await generateBrandingConcepts(prompt);
    return NextResponse.json({ updatedContent, sample: !isConfigured() });
  });
}
