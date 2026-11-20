import { NextResponse } from 'next/server';
import { countRecentNewsletter, countRecentRows, insertNewsletter, supabaseConfigured } from '@/lib/server/user';
import { clientHash, globalHourlyCap, notifyOwner } from '@/lib/server/public-forms';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Newsletter sign-up: SAVES the address in `newsletter_subscriptions` (service role only). Nothing is sent automatically; the response
 * and the UI say so. Public on purpose: validated, honeypot, 10 per hour per client identity.
 */
export async function POST(request: Request) {
  if (!supabaseConfigured()) return json({ error: 'Sign-ups cannot be saved right now: this site has no database configured.', code: 'NEWSLETTER_UNAVAILABLE' }, 503);
  const raw = await request.text();
  if (raw.length > 2000) return json({ error: 'Request too large.', code: 'TOO_LARGE' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.', code: 'BAD_REQUEST' }, 400); }
  if (typeof body?.website === 'string' && body.website.trim()) return json({ ok: true }, 200); // honeypot
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 320) : '';
  if (!EMAIL.test(email)) return json({ error: 'Enter a valid email address.', code: 'VALIDATION' }, 400);
  try {
    const hash = await clientHash(request);
    if ((await countRecentNewsletter(hash, new Date(Date.now() - 3600_000).toISOString())) >= 10) return json({ error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' }, 429);
    if ((await countRecentRows('newsletter_subscriptions', new Date(Date.now() - 3600_000).toISOString(), globalHourlyCap('newsletter'))) >= globalHourlyCap('newsletter')) return json({ error: 'Sign-ups are very busy right now. Please try again later.', code: 'BUSY' }, 429);
    const added = await insertNewsletter({ email, client_hash: hash });
    if (added) await notifyOwner('newsletter', { email });
    return json({ ok: true, alreadySubscribed: !added }, 200);
  } catch {
    console.error('newsletter sign-up failed');
    return json({ error: 'Your address could not be saved. Please try again later.', code: 'NEWSLETTER_FAILED' }, 502);
  }
}
