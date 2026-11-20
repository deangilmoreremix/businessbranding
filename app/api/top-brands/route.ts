import { NextResponse } from 'next/server';
import { getTopBrandsInIndustry } from '@/lib/services/ai';
import { withUser } from '@/lib/server/user';
import { isConfigured } from '@/lib/openai';

export const runtime = 'nodejs';

/** GET ?industry=... -> top brands. Signed-in users only; without an OpenAI key the response is sample data and says so. */
export async function GET(request: Request) {
  return withUser(request, { bucket: 'top-brands', limit: 20, requireKey: false }, async () => {
    const industry = new URL(request.url).searchParams.get('industry');
    if (!industry || industry.length > 200) return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    const brands = await getTopBrandsInIndustry(industry);
    return NextResponse.json(brands, { headers: { 'X-Sample-Data': isConfigured() ? 'false' : 'true' } });
  });
}
