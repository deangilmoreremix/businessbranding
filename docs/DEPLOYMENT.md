# Deployment notes

- **Keys:** there is no global OpenAI key. Users add their own in Settings -> OpenAI (stored encrypted, AES-256-GCM, `KEY_ENCRYPTION_SECRET`).
- **Public forms:** see the README section "Deployment requirements for the public forms": `NETLIFY`, `TRUST_PROXY_HEADERS`, `PUBLIC_FORM_HOURLY_CAP`,
  `CONTACT_NOTIFY_WEBHOOK_URL` (https only). Export stored submissions with `node scripts/export-submissions.mjs [contact|newsletter]`.
- **Edge Functions:** only `brand-analyzer`, `openai`, `voice-content` and `voice-generator` remain; all require a session and the caller's key.
- **Rotate leaked keys:** the original `.env` (live keys) was committed in `a4f5488` and is still in git history. Rotate every key that was in it.

## Required environment for the public forms
- `KEY_ENCRYPTION_SECRET` is **required** (also used as the salt for stored client hashes). Without it `/api/contact` and `/api/newsletter` refuse to store anything (they answer 502) instead of using a guessable fallback salt.
- A trustworthy client address needs `NETLIFY=true` (set automatically on Netlify) or `TRUST_PROXY_HEADERS=true` behind a proxy that overwrites `X-Real-IP`, or a proxy that appends the real peer to `X-Forwarded-For`. Otherwise the per-client limit can be bypassed by forging headers; the global cap (`PUBLIC_FORM_HOURLY_CAP`) is the backstop.
- A honeypot hit returns a neutral "Thanks." and stores nothing.

## Runtime
Next.js 15.5 with React 19. Route handlers receive `params` as a Promise.
