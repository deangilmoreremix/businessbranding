import { deleteDraft, listDrafts, loadDraft, saveDraft } from '@/lib/local/store';

/**
 * Business analyses saved locally in IndexedDB (via lib/local/store, with an in-memory fallback), so finished analyses
 * can be reopened from the Brand Strategy page. Nothing is sent to a server.
 */

export interface BusinessAnalysis {
  id: number;
  businessName: string;
  industry: string;
  websiteUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  analysisResults: any;
  createdAt: string;
}

const PREFIX = 'business-analysis:';
const MAX_SAVED = 25;
const key = (id: number) => `${PREFIX}${id}`;

export function hostnameOf(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function saveBusinessAnalysis(analysis: Omit<BusinessAnalysis, 'id' | 'createdAt'>): Promise<BusinessAnalysis> {
  const record: BusinessAnalysis = { ...analysis, id: Date.now(), createdAt: new Date().toISOString() };
  await saveDraft(key(record.id), record);
  // keep only the newest MAX_SAVED
  const all = await getBusinessAnalyses();
  for (const old of all.slice(MAX_SAVED)) await deleteDraft(key(old.id));
  return record;
}

/** Newest first. */
export async function getBusinessAnalyses(): Promise<BusinessAnalysis[]> {
  const drafts = await listDrafts(PREFIX);
  return drafts.map((d) => d.value as BusinessAnalysis).sort((a, b) => b.id - a.id);
}

export async function getBusinessAnalysis(id: number): Promise<BusinessAnalysis | null> {
  return (await loadDraft<BusinessAnalysis>(key(id))) ?? null;
}

export async function updateBusinessAnalysis(id: number, updates: Partial<BusinessAnalysis>): Promise<BusinessAnalysis | null> {
  const current = await getBusinessAnalysis(id);
  if (!current) return null;
  const next = { ...current, ...updates, id: current.id, createdAt: current.createdAt };
  await saveDraft(key(id), next);
  return next;
}

export async function deleteBusinessAnalysis(id: number): Promise<void> {
  await deleteDraft(key(id));
}
