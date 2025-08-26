import { NextResponse } from 'next/server';
import { getCaseStudies, getCaseStudyBySlug, getFeaturedCaseStudies, getCaseStudiesByIndustry } from '@/lib/services/case-studies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const industry = searchParams.get('industry');
    const featured = searchParams.get('featured');

    let data;

    if (slug) {
      data = await getCaseStudyBySlug(slug);
    } else if (industry) {
      data = await getCaseStudiesByIndustry(industry);
    } else if (featured === 'true') {
      data = await getFeaturedCaseStudies();
    } else {
      data = await getCaseStudies();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    );
  }
}