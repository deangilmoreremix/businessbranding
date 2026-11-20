import { authFetch } from '@/lib/client/auth-fetch';

export interface Usage { requests: number; failed: number; inputTokens: number; outputTokens: number; byFeature: Record<string, number>; since: string }

/** The signed-in user's real AI usage (last 30 days). Null when signed out or the server has no database. */
export async function loadUsage(): Promise<Usage | null> {
  try {
    const res = await authFetch('/api/usage');
    return res.ok ? ((await res.json()) as Usage) : null;
  } catch {
    return null;
  }
}
