
/** Fired when a request fails because the signed-in user has not added an OpenAI key yet. */
export const KEY_REQUIRED_EVENT = 'openai-key-required';
/** Fired when built-in sample data was shown instead of a real AI result (no key). */
export const SAMPLE_DATA_EVENT = 'sample-data-used';
/** Fired when the user's key is confirmed, so any 'sample data' label can go away. */
export const SAMPLE_CLEARED_EVENT = 'sample-data-cleared';
/** Fired when a request fails because there is no (valid) session. */
export const AUTH_REQUIRED_EVENT = 'auth-required';

/** The signed-in user's Supabase access token (a short-lived session JWT, never the OpenAI key), or null. */
export async function accessToken(): Promise<string | null> {
  // The AuthProvider signs users in through the auth-helpers client (cookie session); the plain client is a fallback.
  // Both are imported lazily so pages that only call authFetch do not pay for them up front.
  const getters: Array<() => Promise<any>> = [
    async () => (await import('@supabase/auth-helpers-nextjs')).createClientComponentClient(),
    async () => (await import('@/lib/supabase')).supabase
  ];
  for (const get of getters) {
    try {
      const { data } = await (await get()).auth.getSession();
      const token = data?.session?.access_token;
      if (token) return token;
    } catch {
      /* try the next client */
    }
  }
  return null;
}

/**
 * fetch() that attaches the user's session so the server can verify who is calling and use THEIR OpenAI key.
 * The OpenAI key itself never reaches the browser. Dispatches window events when a key or sign-in is required so the
 * UI can show an "Add your OpenAI key" state without every call site handling it.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // Supabase Edge Functions also expect the project's public (anon) key
  if (typeof input === 'string' && input.includes('/functions/v1/') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    headers.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  const res = await fetch(input, { ...init, headers });

  if ((res.status === 412 || res.status === 401) && typeof window !== 'undefined') {
    const body = await res.clone().json().catch(() => null);
    if (body?.code === 'OPENAI_KEY_REQUIRED') window.dispatchEvent(new CustomEvent(KEY_REQUIRED_EVENT));
    else if (body?.code === 'AUTH_REQUIRED') window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
  }
  return res;
}

/** Error carrying the server's friendly message and machine-readable code. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Read a failed response into an ApiError with the server's friendly message. */
export async function toApiError(res: Response, fallback: string): Promise<ApiError> {
  const body = await res.json().catch(() => ({}));
  return new ApiError(body.error || `${fallback} (${res.status})`, res.status, body.code);
}
