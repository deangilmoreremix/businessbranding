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
 * The address used to rate-limit anonymous submissions. A client controls the LEFT side of X-Forwarded-For, so it is never trusted:
 * prefer headers the hosting platform sets itself (Netlify's x-nf-client-connection-ip, then x-real-ip) and, failing that, the RIGHTMOST
 * forwarded hop (the one appended by the nearest proxy).
 */
export function clientAddress(headers: { get(name: string): string | null }): string {
  const platform = headers.get('x-nf-client-connection-ip') || headers.get('x-real-ip');
  if (platform && platform.trim()) return platform.trim();
  const hops = (headers.get('x-forwarded-for') || '').split(',').map((h) => h.trim()).filter(Boolean);
  return hops.length ? hops[hops.length - 1] : 'unknown';
}
