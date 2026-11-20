#!/usr/bin/env node
// Owner-only export of contact + newsletter submissions (the tables have no client access; this uses the service role).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/export-submissions.mjs [contact|newsletter] > out.csv
const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const which = process.argv[2] === 'newsletter' ? 'newsletter_subscriptions' : 'contact_submissions';
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
const res = await fetch(`${url}/rest/v1/${which}?select=*&order=created_at.desc&limit=10000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
const rows = await res.json();
const cols = rows.length ? Object.keys(rows[0]).filter((c) => c !== 'client_hash') : [];
const esc = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
console.log([cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'));
