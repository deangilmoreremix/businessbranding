import { NextResponse } from 'next/server';
import { generateBrandingConcepts } from '@/lib/services/gemini';

export async function POST(request: Request) {
  try {
    const { businessIdea, improvements } = await request.json();

    const prompt = `Enhance and improve the following business concept: ${businessIdea}
    
    Focus on these improvement areas:
    ${improvements.join('\n')}
    
    Provide an enhanced and modernized version of the brand strategy.`;

    const updatedContent = await generateBrandingConcepts(prompt);
    
    return NextResponse.json({ updatedContent });
  } catch (error) {
    console.error('Error updating brand content:', error);
    return NextResponse.json({ error: 'Failed to update brand content' }, { status: 500 });
  }
}