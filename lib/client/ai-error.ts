import { ApiError } from '@/lib/client/auth-fetch';
import { UnreadableResponseError } from '@/lib/client/validate';

export type ErrorKind = 'key' | 'auth' | 'rate' | 'service' | 'network' | 'unreadable';
export interface ErrorInfo { kind: ErrorKind; title: string; message: string }

/** Find the ApiError behind a wrapped error (AnalysisError keeps the original in `details`). */
export function underlying(error: unknown): unknown {
  const d = (error as any)?.details;
  return d instanceof Error ? d : error;
}

/** The real cause of a failed AI request, in words a user can act on. Never a made-up result. */
export function describeError(error: unknown): ErrorInfo {
  const e = underlying(error);
  if (e instanceof ApiError) {
    if (e.code === 'OPENAI_KEY_REQUIRED' || e.status === 412) return { kind: 'key', title: 'OpenAI key needed', message: 'Add your own OpenAI API key in Settings to run this.' };
    if (e.code === 'AUTH_REQUIRED' || e.status === 401) return { kind: 'auth', title: 'Sign in required', message: 'Sign in to use AI features with your OpenAI key.' };
    if (e.status === 429 || e.code === 'RATE_LIMITED' || e.code === 'OPENAI_RATE_LIMITED') return { kind: 'rate', title: 'Too many requests', message: e.message || 'Please wait a moment and try again.' };
    return { kind: 'service', title: 'The service had a problem', message: e.message ? `${e.message}` : `The request failed (${e.status}). Your key is fine; try again in a moment.` };
  }
  const msg = (e as Error)?.message ?? '';
  if (e instanceof UnreadableResponseError || e instanceof SyntaxError || /JSON|Unexpected token|Unexpected end|Failed to execute|Cannot read prop|is not iterable|undefined/i.test(msg)) return { kind: 'unreadable', title: 'Unreadable response', message: 'The service returned an unreadable response. Try again.' };
  if (e instanceof TypeError || /failed to fetch|network|load failed/i.test(msg)) return { kind: 'network', title: 'Connection problem', message: 'The service could not be reached. Check your connection and try again.' };
  return { kind: 'service', title: 'Something went wrong', message: (e as Error)?.message || 'The request failed. Try again.' };
}
