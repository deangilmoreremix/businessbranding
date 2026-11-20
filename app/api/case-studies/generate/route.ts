import { NextResponse } from 'next/server';
import { generateCaseStudyContent } from '@/lib/services/case-studies';
import { withUser } from '@/lib/server/user';
import { isConfigured } from '@/lib/openai';

export const runtime = 'nodejs';

/** POST case study fields -> generated content. Signed-in users only; sample data (flagged) without a key. */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'case-study', limit: 10, requireKey: false }, async () => {
    const caseStudy = await request.json();
    if (!caseStudy || typeof caseStudy !== 'object' || !caseStudy.industry || !caseStudy.challenge || !caseStudy.solution) {
      return NextResponse.json({ error: 'Missing required case study fields' }, { status: 400 });
    }
    const generated = await generateCaseStudyContent(caseStudy);
    return NextResponse.json(generated, { headers: { 'X-Sample-Data': isConfigured() ? 'false' : 'true' } });
  });
}
