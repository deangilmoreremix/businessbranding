import { NextResponse } from 'next/server';
import { validateContact } from '@/lib/contact';
import '@/lib/openai'; // binds the runtime env reader used by the shared server modules
import { countRecentContacts, insertContact, supabaseConfigured } from '@/lib/server/user';

export const runtime = 'nodejs';

const HOURLY_LIMIT = 5;
const MAX_BODY = 20_000;
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function clientHash(request: Request): Promise<string> {
  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  const salt = process.env.KEY_ENCRYPTION_SECRET || 'contact';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${ip}`));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Public contact form. Stores the message in `contact_submissions` using the service role (no client has table access).
 * Public on purpose, so it is defended instead of authenticated: strict validation, 20 KB body cap, a honeypot field, and
 * 5 messages per hour per client (salted hash of the address; the raw address is never stored).
 */
export async function POST(request: Request) {
  if (!supabaseConfigured()) return json({ error: 'Messages cannot be received right now: this site has no database configured.', code: 'CONTACT_UNAVAILABLE' }, 503);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Message too large.', code: 'TOO_LARGE' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.', code: 'BAD_REQUEST' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.', code: 'BAD_REQUEST' }, 400);

  // honeypot: real visitors never fill the hidden "website" field; pretend success to bots
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true }, 200);

  const form = { name: String(body.name ?? ''), email: String(body.email ?? ''), message: String(body.message ?? '') };
  const errors = validateContact(form);
  if (Object.keys(errors).length) return json({ error: 'Please check the form.', code: 'VALIDATION', fields: errors }, 400);
  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 300) : '';

  try {
    const hash = await clientHash(request);
    const recent = await countRecentContacts(hash, new Date(Date.now() - 3600_000).toISOString());
    if (recent >= HOURLY_LIMIT) return json({ error: 'You have sent several messages recently. Please try again later.', code: 'RATE_LIMITED' }, 429);
    await insertContact({ name: form.name.trim().slice(0, 200), email: form.email.trim().slice(0, 320), subject, message: form.message.trim(), client_hash: hash });
    return json({ ok: true }, 200);
  } catch {
    console.error('contact submission failed');
    return json({ error: 'Your message could not be saved. Please try again later.', code: 'CONTACT_FAILED' }, 502);
  }
}
