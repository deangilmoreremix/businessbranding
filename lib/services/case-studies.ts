import { generateBrandingConcepts } from './ai';
import { listPublished, supabaseConfigured } from '@/lib/server/user';

/** A published case study as stored in `case_studies` (server-side data; nothing is invented here). */
export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  results: Record<string, unknown>;
  featured: boolean;
  created_at: string;
}

/** Published case studies from the database; an empty list when none are published or no database is configured. */
export async function getPublishedCaseStudies(): Promise<CaseStudy[]> {
  if (!supabaseConfigured()) return [];
  const rows = await listPublished('case_studies', 50);
  return rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, industry: r.industry, challenge: r.challenge, solution: r.solution, results: r.results ?? {}, featured: !!r.featured, created_at: r.created_at }));
}

/** AI-drafted case-study content for the caller's own details. Returns only what the model produced; errors propagate (no stock fallback). */
export async function generateCaseStudyContent(caseStudy: Partial<CaseStudy>) {
  const concepts = await generateBrandingConcepts(`
      Industry: ${caseStudy.industry}
      Challenge: ${caseStudy.challenge}
      Solution: ${caseStudy.solution}
    `);
  return {
    ...caseStudy,
    results: {
      concepts,
      ...(concepts && typeof (concepts as any).testimonial === 'string' && (concepts as any).testimonial
        ? { testimonialDraft: (concepts as any).testimonial } // an AI-written DRAFT, not a real client quote
        : {})
    }
  };
}
