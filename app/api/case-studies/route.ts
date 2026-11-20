import { NextResponse } from 'next/server';
import { getPublishedCaseStudies } from '@/lib/services/case-studies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET -> published rows of `case_studies` only ([] when none are published or no database is configured). */
export async function GET() {
  try {
    return NextResponse.json(await getPublishedCaseStudies());
  } catch {
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 502 });
  }
}
