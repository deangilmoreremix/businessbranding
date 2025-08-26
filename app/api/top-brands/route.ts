import { NextResponse } from 'next/server';
import { getTopBrandsInIndustry } from '@/lib/services/gemini';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');

  if (!industry) {
    return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
  }

  try {
    // Use Gemini to generate top brands in the industry
    const brands = await getTopBrandsInIndustry(industry);
    
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching top brands:', error);
    return NextResponse.json({ error: 'Failed to fetch top brands' }, { status: 500 });
  }
}