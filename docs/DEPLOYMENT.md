# Deployment notes

- **Keys:** there is no global OpenAI key. Users add their own in Settings -> OpenAI (stored encrypted, AES-256-GCM, `KEY_ENCRYPTION_SECRET`).
- **Public forms:** see the README section "Deployment requirements for the public forms": `NETLIFY`, `TRUST_PROXY_HEADERS`, `PUBLIC_FORM_HOURLY_CAP`,
  `CONTACT_NOTIFY_WEBHOOK_URL` (https only). Export stored submissions with `node scripts/export-submissions.mjs [contact|newsletter]`.
- **Edge Functions:** only `brand-analyzer`, `openai`, `voice-content` and `voice-generator` remain; all require a session and the caller's key.
- **Rotate leaked keys:** the original `.env` (live keys) was committed in `a4f5488` and is still in git history. Rotate every key that was in it.
