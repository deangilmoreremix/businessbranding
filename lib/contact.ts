export interface ContactForm { name: string; email: string; message: string }
export type ContactErrors = Partial<Record<keyof ContactForm, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(f: ContactForm): ContactErrors {
  const e: ContactErrors = {};
  if (!f.name.trim()) e.name = 'Please tell us your name.';
  if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
  if (f.message.length > 5000) e.message = 'Please keep the message under 5000 characters.';
  return e;
}

/**
 * The client identity used to rate-limit anonymous submissions. Request headers are attacker-controlled unless a trusted proxy sets
 * them, so:
 *  1. `x-nf-client-connection-ip` (set by the Netlify edge itself) is used first;
 *  2. `x-real-ip` ONLY when TRUST_PROXY_HEADERS=true (you run behind a proxy that overwrites it), otherwise a client could mint a new
 *     identity per request;
 *  3. otherwise the RIGHTMOST `x-forwarded-for` hop (appended by the nearest proxy; the left side is client-supplied);
 *  4. with no usable address at all, a fingerprint of the request headers, so unidentifiable clients do not share one global bucket.
 */
export function clientAddress(headers: { get(name: string): string | null }, env: { TRUST_PROXY_HEADERS?: string } = {}): string {
  const platform = headers.get('x-nf-client-connection-ip');
  if (platform && platform.trim()) return platform.trim();
  const real = headers.get('x-real-ip');
  if (real && real.trim() && env.TRUST_PROXY_HEADERS === 'true') return real.trim();
  const hops = (headers.get('x-forwarded-for') || '').split(',').map((h) => h.trim()).filter(Boolean);
  if (hops.length) return hops[hops.length - 1];
  return 'fp:' + ['user-agent', 'accept-language', 'accept-encoding', 'accept'].map((h) => headers.get(h) || '').join('|');
}
