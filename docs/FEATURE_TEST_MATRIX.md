# Feature test matrix

Every user-facing feature of businessbranding, how it was exercised, and the result. All browser tests run in headless Chromium (Playwright)
against a **production build** (`next start`) with a mock OpenAI server (Responses incl. SSE and background jobs, Images, audio, Realtime WebSocket)
and a mock Supabase server (auth, REST, RLS simulation). Nothing talks to a real OpenAI or Supabase project.

Result key: **PASS** (asserted), **FAIL**, **NOT TESTABLE** (reason given). "smoke" = the route loads (HTTP 200) and renders content with no uncaught error, nothing deeper.

How to run: build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:5998 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key npm run build`, start the mocks
(`scripts/mock-supabase-server.mjs 5998`, `scripts/mock-openai-server.mjs 5999`) and `next start -p 5240`, then `node e2e/<spec>.spec.js` (fresh mocks per spec).
Database: `scripts/db-test.sh` (real Postgres 16). Edge functions: `scripts/verify-edge.ts` under Deno.

## Totals (final run)

| Suite | PASS | FAIL | NOT TESTABLE |
|---|---|---|---|
| vitest (unit, security, BYOK, contact, redirects, DB wrapper) | 153 | 0 | 0 |
| `scripts/verify-ai.mjs` (API request shapes, BYOK, security) | 124 | 0 | 0 |
| `scripts/verify-edge.ts` (all AI Edge Functions, Deno 2.9) | 15 | 0 | 0 |
| `scripts/db-test.sh` (14 migrations + RLS + rate limiter, Postgres 16) | 127 | 0 | 0 |
| Playwright: sign-in/up/reset (`auth`) | 22 | 0 | 0 |
| Playwright: Settings/BYOK (`byok-settings`) | 16 | 0 | 0 |
| Playwright: UI fixes (`ui-fixes`) | 11 | 0 | 0 |
| Playwright: visual identity (`features-visual`) | 14 | 0 | 0 |
| Playwright: voice (`features-voice`) | 16 | 0 | 1 |
| Playwright: assistant/dictation/workflows/email (`features-assistant`) | 14 | 0 | 0 |
| Playwright: analysis/research/planning (`features-analysis`) | 18 | 0 | 0 |
| Playwright: error states + every page + contact + settings + API smoke (`features-errors-pages`) | 60 | 0 | 0 |
| Playwright: on-device models, real downloads (`features-local-ai`) | 4 | 0 | 0 |
| **Total (automated assertions)** | **594** | **0** | **1** |

Beyond the automated counts, three items are documented as NOT TESTABLE (live-voice WebRTC, real recovery-link completion, the deployed Edge Function HTTP hop) and three as NOT TESTED (`/api/supabase/setup`, `real-time-analytics`, `hello-world`).

## Accounts and keys

| Feature | How exercised | Result |
|---|---|---|
| Sign up (email + password, min 12 chars, confirmation, duplicate email) | `auth`: real form against mock Supabase auth endpoints | PASS |
| Sign in (wrong password error, success, `next=` return, open-redirect `//evil` ignored) | `auth`, `auth-redirect` unit tests | PASS |
| Sign out (nav) / nav Sign In -> /login | `auth` | PASS |
| Password reset request + expired-link page | `auth` (recovery mail request verified at the mock) | PASS |
| Password reset **completion** from a real recovery e-mail link | needs a real Supabase recovery token; only the "no recovery session" state is tested | NOT TESTABLE |
| First login -> "Add your OpenAI key" step -> continue to the requested page | `auth` | PASS |
| Settings -> OpenAI: add / invalid / test per-model access / replace / remove, masked last 4, input cleared, no key in storage/URLs | `byok-settings` | PASS |
| Per-user model override fixes "model unavailable" | `features-errors-pages` | PASS |
| Session cookie survives a full page load (middleware) | `auth` (this was a bug, fixed) | PASS |
| Settings tabs (Profile, Notifications, Security, OpenAI, Billing) open | `features-errors-pages` | PASS (open only; Profile/Notifications/Security/Billing forms are static UI with no backend) |

## Error states (real UI + API)

| State | How exercised | Result |
|---|---|---|
| 401 signed out: sign-in notice, sample-data label, API 401 JSON | `features-errors-pages`, `verify-ai` | PASS |
| 412 no key: "Add your OpenAI key" notice + route JSON | `features-errors-pages`, `verify-ai` | PASS |
| 402 quota exhausted, 424 model unavailable (names the model), 401 invalid key | `features-errors-pages` | PASS |
| 429 per-user rate limit (Supabase-backed) and fail-closed 503 when the limiter store is down | `features-errors-pages`, `verify-ai`, `byok.test` | PASS |
| 403 CSRF (cookie + cross-site POST), Bearer exempt, same-origin allowed | `features-errors-pages`, `verify-ai`, `byok.test` | PASS |
| SSRF guard: private/loopback/link-local/CGNAT/mapped/ULA, redirects, size, timeout (scrape, image reference, website-scanner) | `security.test`, `verify-ai`, `verify-edge` | PASS |

## Pages

| Route | How exercised | Result |
|---|---|---|
| `/dashboard/brand-analysis` (analysis, tiles, pillar breakdown, sample label) | `features-analysis`, `ui-fixes` | PASS |
| `/brand-strategy` (business analyzer, one overview, IndexedDB history, reload) | `features-analysis`, `ui-fixes` | PASS |
| `/dashboard/planning` (plan, calendar tab, `.ics` export validated, smart-schedule tab) | `features-analysis` | PASS (smart-schedule *generation* click not driven; tab renders) |
| `/dashboard/visual-identity`, `/visual-identity` (upload, AI image, editor, exports) | `features-visual`, `features-local-ai` | PASS |
| `/dashboard/voice-content`, `/voice-content` | `features-voice` (dashboard studio); `/voice-content` smoke | PASS |
| `/workflows` | `features-assistant`, `ui-fixes` | PASS |
| `/settings`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update` | `auth`, `byok-settings`, smoke | PASS |
| `/contact` (was an empty stub; now a validated form) | `features-errors-pages`, `contact.test` | PASS |
| `/dashboard`, `/`, `/about`, `/agency`, `/analytics`, `/blogs`, `/case-studies`, `/cookies`, `/features`, `/integrations`, `/pricing`, `/privacy`, `/terms` | smoke (200, content, no uncaught error) | PASS (smoke only) |
| `/docs`, `/docs/ai-features`, `/docs/best-practices`, `/docs/voice-features`, `/docs/integration-guide`, 11 `/docs/components/*`, `/docs/api/openai`, `/docs/api/voice` | smoke (the two API pages were unroutable before; fixed) | PASS (smoke only) |
| `/docs/gemini-features` -> `/docs/ai-features` (308) | `ui-fixes` | PASS |

## Features

| Feature | How exercised | Result |
|---|---|---|
| Brand analysis via Responses strict schema (user key) | `features-analysis`, `verify-ai` | PASS |
| Sample-data labelling when there is no key | `features-errors-pages`, `ui-fixes` | PASS |
| Deep research (background job start, polling, report, ownership, notification when finished) | `features-analysis`, `verify-ai` | PASS |
| Notifications (permission from a click, fired on completion; `Notification` mocked, tab reported hidden) | `features-analysis` | PASS |
| Implementation plan + calendar + `.ics` | `features-analysis` | PASS |
| Image generation / variation (Images API, user key) | `features-visual`, `verify-ai` | PASS |
| Image editor: add text/shape, solid background removal (alpha asserted), crop tab, Download PNG, Save to library | `features-visual`, `features-local-ai` | PASS |
| PNG validity (signature + IEND, dimensions): editor, brand kit 1600x1000, palette 1200x300, social 1080x1080, mockup | `features-visual` | PASS |
| GIF preview (valid GIF89a) | `features-visual` | PASS |
| Local asset library + drafts in IndexedDB (persist across reload) | `features-visual`, `features-analysis`, `features-assistant` | PASS |
| AI person cut-out with the **real** MediaPipe model + WASM downloaded in the browser | `features-local-ai` | PASS (after a fix, below) |
| Voice recorder with Chromium's fake microphone; waveform; trim -> valid WAV of the right length | `features-voice` | PASS |
| Enhance audio, voice-over download | `features-voice` | PASS |
| Podcast and audiobook generation (Realtime TTS over WebSocket), valid WAV downloads | `features-voice`, `verify-ai`, `verify-edge` | PASS |
| Captions: `.vtt` (WEBVTT, cues, text) and `.srt` (numbered cues, comma timestamps) | `features-voice` | PASS |
| Transcription (gpt-transcribe, upload + waveform) | `features-voice`, `verify-ai`, `verify-edge` | PASS |
| On-device Whisper transcription with the **real** model (Transformers.js, WASM) | `features-local-ai` | PASS (after a fix, below) |
| Live voice: ephemeral client secret minted with the user key | `features-voice`, `verify-ai` | PASS |
| Live voice: WebRTC SDP exchange and audio with the model | needs a real OpenAI Realtime peer; a mock cannot answer the handshake | **NOT TESTABLE** |
| Assistant chat (SSE streaming), read-aloud (OpenAI TTS) | `features-assistant` | PASS |
| Dictation: fake mic -> MediaRecorder -> gpt-transcribe; Web Speech API fallback (mock `SpeechRecognition`) | `features-assistant` | PASS |
| Content workflows: run (copy -> email -> voice), sandboxed email preview, autosave/restore, JSON export | `features-assistant` | PASS |
| Email render route (no `javascript:` links) | `features-assistant`, `verify-ai` | PASS |
| `/api/top-brands`, `/api/case-studies` (read), `/api/models` | `features-errors-pages`, `verify-ai` (auth gates) | PASS |
| `/api/update-brand-content`, `/api/case-studies/generate` (content generation) | auth gate and validation only (`verify-ai`); generation path shares `withUser`/`ai.ts` which are covered | PASS (gate), generation not driven from a UI (no UI calls them) |
| `/api/scrape` (SSRF-safe) | `verify-ai` (refusals, auth), analyzer flow | PASS (a successful scrape of a real public site is not tested: no public-site fixture; refusal paths are) |
| `/api/ai/analyze` -> `ai-analysis` edge function forwarding | auth gate in `verify-ai`; the edge function itself in `verify-edge`; the HTTP hop to a deployed function cannot be exercised (the mock Supabase has no Functions runtime) | PASS (parts) / hop **NOT TESTABLE** |
| `/api/supabase/setup` | not exercised | **NOT TESTED** |

## Edge functions (Deno, real handlers against mock OpenAI/Supabase)

| Function | Result |
|---|---|
| `ai-analysis`, `brand-analysis`, `brand-analyzer`, `competitor-intelligence`, `market-analysis`, `social-media-analyzer` (strict schema, developer message, web_search step where applicable) | PASS |
| `website-scanner` (SSRF refusals of loopback, metadata address, localhost, `file:`) | PASS |
| `openai` (text, image), `voice-generator`, `voice-content` (voices, generate, podcast, audiobook, transcribe, legacy speech endpoint) | PASS |
| 401 without a session / 412 without a key / key never echoed (all functions share `withUser`) | PASS |
| `real-time-analytics`, `hello-world` | not exercised (not AI functions; the UI's call to `real-time-analytics` 404s against the mock and the UI falls back) | **NOT TESTED** |

## Database (real Postgres 16, `scripts/db-test.sh`)

| Check | Result |
|---|---|
| All 14 migrations apply in order on a clean database | PASS (historic migrations needed `DROP POLICY IF EXISTS`; fixed) |
| User A cannot read/update/delete user B's rows on any owned table; reads their own | PASS |
| `anon` sees nothing and writes nothing on any table (except published `case_studies` read) | PASS |
| `authenticated` has no access to `user_api_keys` (select/insert/update/delete); `service_role` has full access; provider restricted | PASS |
| `ai_usage_log` / `ai_jobs`: read own rows only, no client writes | PASS |
| `consume_rate_limit`: counts, blocks over the limit, per user and per bucket, window rolls, not executable by clients | PASS |
| Without `20261121000100_rls_hardening.sql` the same test fails 24 checks (anyone with the anon key could read/write five tables and NULL-owner rows on six) | verified |

## Bugs found and fixed while testing

1. `components/voice-interface.tsx` was a truncated stub (`{/* Rest of the existing TabsContent ... */}`) that shadowed the complete `components/voice-interface/` module: the Voice Content studio showed tabs with **no content**.
2. `app/contact/page.tsx` was an empty placeholder: replaced by a validated contact form.
3. Image editor: `Download PNG` / `Save` / `Use this image` crashed (`stageRef` null) after visiting the Crop or Background tab; the Konva stage is now kept mounted.
4. AI background removal always failed in the production build (`Super constructor null of oE is not a constructor`: the minified MediaPipe bundle); it is now loaded from the pinned CDN build.
5. On-device Whisper hung forever in browsers that expose `navigator.gpu` without an adapter; WebGPU is only chosen when an adapter exists, with a WASM fallback.
6. Middleware used `@supabase/ssr` cookies while the app signs in with auth-helpers: the session cookie was discarded on the first full page load (users were signed out). Uses `createMiddlewareClient` now.
7. `/docs/api/openai` and `/docs/api/voice` (linked from several pages) did not exist (`openai.mdx` is not a route); moved to `page.mdx`.
8. RLS: `USING (true)` "full access" policies and `OR user_id IS NULL` policies exposed data to anyone with the anon key (hardening migration).
9. Earlier in this round: SSRF in `/api/scrape`, image references and `website-scanner`; unauthenticated AI routes; fail-open limiter; token-printing `console.log`; duplicate NavHeader, duplicate analysis block, hard-coded dashboard tiles.

## Known gaps (stated plainly)

- Anything that needs a real OpenAI or Supabase project (live model behaviour, real e-mail confirmation/recovery links, deployed Edge Function hop, RLS on a hosted project) is untested; the mocks verify request shapes and our handling, not the services.
- WebRTC live voice media negotiation cannot be tested without a real Realtime peer.
- Pages marked "smoke only" were not driven beyond loading.
- `real-time-analytics`, `hello-world`, `/api/supabase/setup` are not exercised.
- `/contact` grew from an empty stub to a real form (+40 kB First Load JS on that route versus the old empty page); every other route is at or below the original baseline and shared JS is 128 kB (baseline 134 kB).
