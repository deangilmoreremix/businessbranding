import '@/lib/openai'; // binds the runtime env reader used by the shared server modules
import { clientAddress } from '@/lib/contact';

/** Salted hash of the client identity (the raw address is never stored). */
export async function clientHash(request: Request): Promise<string> {
  const id = clientAddress(request.headers, { TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS });
  const salt = process.env.KEY_ENCRYPTION_SECRET || 'public-forms';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${id}`));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Optional e-mail/Slack-style notification: POSTs a short JSON note to CONTACT_NOTIFY_WEBHOOK_URL. Never fails the request. */
export async function notifyOwner(kind: 'contact' | 'newsletter', summary: Record<string, string>): Promise<boolean> {
  const url = process.env.CONTACT_NOTIFY_WEBHOOK_URL;
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const res = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `New ${kind} submission`, kind, ...summary }), signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
