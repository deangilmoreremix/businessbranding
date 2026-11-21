import { authFetch } from '@/lib/client/auth-fetch';

export interface Usage { requests: number; failed: number; inputTokens: number; outputTokens: number; byFeature: Record<string, number>; since: string }

/** The signed-in user's real AI usage (last 30 days). Null when signed out or the server has no database. */
export async function loadUsage(): Promise<Usage | null> {
  try {
    const res = await authFetch('/api/usage');
    if (!res.ok) return null;
    const body = await res.json();
    return body && typeof body.requests === 'number' && body.byFeature && typeof body.byFeature === 'object' ? (body as Usage) : null;
  } catch {
    return null;
  }
}
