import { NextResponse } from 'next/server';
import { generateCaseStudyContent } from '@/lib/services/case-studies';

export async function POST(request: Request) {
  try {
    const caseStudy = await request.json();
    
    // Validate required fields
    if (!caseStudy.industry || !caseStudy.challenge || !caseStudy.solution) {
      return NextResponse.json(
        { error: 'Missing required case study fields' },
        { status: 400 }
      );
    }
    
    // Generate content using the service
    const generatedContent = await generateCaseStudyContent(caseStudy);

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Error generating case study content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate case study content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}