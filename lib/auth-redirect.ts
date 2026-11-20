/** Shared sign-in helpers (pure, unit-tested). */

export const MIN_PASSWORD_LENGTH = 12;
export const DEFAULT_AFTER_LOGIN = '/dashboard';

/**
 * Only same-site relative paths are accepted as a post-login destination (blocks open redirects such as
 * `//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:`). Anything else falls back to the default.
 */
export function safeNextPath(raw: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN): string {
  if (!raw || typeof raw !== 'string') return fallback;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return fallback;
  // never bounce back into the auth pages
  if (/^\/(login|sign-up|reset-password)(\/|\?|#|$)/.test(value)) return fallback;
  return value;
}

export const loginUrl = (next?: string) => (next ? `/login?next=${encodeURIComponent(safeNextPath(next, '/'))}` : '/login');

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

/** Where to send a user right after signing in: straight on if they already have an OpenAI key, otherwise to the key prompt. */
export function postLoginDestination(hasKey: boolean, next: string): string {
  return hasKey ? next : `/settings?welcome=1&next=${encodeURIComponent(next)}#ai`;
}
