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
