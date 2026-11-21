import { NextResponse } from 'next/server';
import { validateContact } from '@/lib/contact';
import { countRecentContacts, countRecentRows, insertContact, supabaseConfigured } from '@/lib/server/user';
import { clientHash, globalHourlyCap, notifyOwner } from '@/lib/server/public-forms';

export const runtime = 'nodejs';

const HOURLY_LIMIT = 5;
const MAX_BODY = 20_000;
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Public contact form. Stores the message in `contact_submissions` using the service role (no client has table access), and, when
 * CONTACT_NOTIFY_WEBHOOK_URL is set, posts a short note to that HTTPS webhook so a person actually sees it. Nothing is answered
 * automatically. Defended instead of authenticated: strict validation, 20 KB cap, honeypot, 5 per hour per client identity.
 */
export async function POST(request: Request) {
  if (!supabaseConfigured()) return json({ error: 'Messages cannot be received right now: this site has no database configured.', code: 'CONTACT_UNAVAILABLE' }, 503);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Message too large.', code: 'TOO_LARGE' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.', code: 'BAD_REQUEST' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.', code: 'BAD_REQUEST' }, 400);
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true, stored: false }, 200); // honeypot: neutral reply, nothing stored

  const form = { name: String(body.name ?? ''), email: String(body.email ?? ''), message: String(body.message ?? '') };
  const errors = validateContact(form);
  if (Object.keys(errors).length) return json({ error: 'Please check the form.', code: 'VALIDATION', fields: errors }, 400);
  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 300) : '';

  try {
    const hash = await clientHash(request);
    if ((await countRecentContacts(hash, new Date(Date.now() - 3600_000).toISOString())) >= HOURLY_LIMIT) return json({ error: 'You have sent several messages recently. Please try again later.', code: 'RATE_LIMITED' }, 429);
    if ((await countRecentRows('contact_submissions', new Date(Date.now() - 3600_000).toISOString(), globalHourlyCap('contact'))) >= globalHourlyCap('contact')) return json({ error: 'The contact form is receiving a lot of messages right now. Please try again later.', code: 'BUSY' }, 429);
    await insertContact({ name: form.name.trim().slice(0, 200), email: form.email.trim().slice(0, 320), subject, message: form.message.trim(), client_hash: hash });
    const notified = await notifyOwner('contact', { name: form.name.trim().slice(0, 200), email: form.email.trim().slice(0, 320), message: form.message.trim().slice(0, 500) });
    return json({ ok: true, stored: true, notified }, 200);
  } catch {
    console.error('contact submission failed');
    return json({ error: 'Your message could not be saved. Please try again later.', code: 'CONTACT_FAILED' }, 502);
  }
}
