# Feature test matrix

Every user-facing feature of businessbranding, how it was exercised, and the result. All browser tests run in headless Chromium (Playwright)
against a **production build** (`next start`) with a mock OpenAI server (Responses incl. SSE and background jobs, Images, audio, Realtime WebSocket)
and a mock Supabase server (auth, REST, RLS simulation). Nothing talks to a real OpenAI or Supabase project.

Result key: **PASS** (asserted), **FAIL**, **NOT TESTABLE** (reason given). "smoke" = the route loads (HTTP 200) and renders content with no uncaught error, nothing deeper.

How to run: `npm run e2e:build` once (bakes the mock Supabase URL into the client bundle), then `npm run e2e` (all browser specs) or
`npm run e2e:<spec>`; ports/paths are configurable (`E2E_PORT`, `E2E_SUPABASE_PORT`, `E2E_OPENAI_PORT`, `E2E_OUT`). Each spec gets fresh mocks.
Database: `npm run test:db` (real Postgres 16). Edge functions: `npm run test:edge` (Deno). Everything else: `npm test`, `npx tsc --noEmit`, `npx next lint`.

## Totals (final run)

| Suite | PASS | FAIL |
|---|---|---|
| vitest (unit, security, BYOK, auth-coverage enumeration, contact, stats, display, redirects, DB wrapper) | 219 | 0 |
| `scripts/verify-ai.mjs` (API request shapes, BYOK, security, contact API) | 131 | 0 |
| `scripts/edge-test.mjs` -> `verify-edge.ts` (all AI Edge Functions, Deno 2.9) | 38 | 0 |
| `scripts/db-test.sh` (**16 migrations applied twice**, RLS, rate limiter, future-table privileges, contact table; Postgres 16) | 133 | 0 |
| Playwright `auth` (sign-in/up/reset) | 22 | 0 |
| Playwright `byok-settings` | 16 | 0 |
| Playwright `ui-fixes` | 11 | 0 |
| Playwright `features-visual` | 14 | 0 |
| Playwright `features-voice` | 16 | 0 |
| Playwright `features-assistant` | 14 | 0 |
| Playwright `features-analysis` | 18 | 0 |
| Playwright `features-errors-pages` (error states, every page, contact, settings, API smoke) | 61 | 0 |
| Playwright `features-local-ai` (real MediaPipe + Whisper downloads) | 4 | 0 |
| Playwright `features-dashboard` (real data, no fabricated numbers, analysis display, planning/calendar) | 22 | 0 |
| **Total automated assertions** | **719** | **0** |

Also: `tsc` 0 errors (app and edge config), `next lint` 0 errors, `next build` green **with type checking and lint now enforced**
(`ignoreBuildErrors`/`ignoreDuringBuilds` are `false`). Shared JS 127 kB (baseline 134 kB); every route is at or below baseline except
`/contact` (+39 kB: it was an empty stub, it is now a real form).

### NOT TESTABLE / NOT TESTED (complete list)

| # | Item | Status | Why |
|---|---|---|---|
| 1 | Live voice: WebRTC SDP exchange + microphone audio with the model | NOT TESTABLE | needs a real OpenAI Realtime peer; a mock cannot answer the handshake (the ephemeral-secret route IS tested) |
| 2 | Password reset **completion** from a real recovery e-mail link | NOT TESTABLE | needs a real Supabase recovery token (the request, the redirect URL and the "expired link" state are tested) |
| 3 | `/api/ai/analyze` -> deployed `ai-analysis` Edge Function HTTP hop | NOT TESTABLE | the mock Supabase has no Functions runtime (the function itself runs in the Deno suite; the route's auth gate is tested) |
| 4 | `supabase/functions/hello-world` | NOT TESTED | trivial scaffold; explicitly listed as open in `tests/auth-coverage.test.ts` |
| 5 | A successful `/api/scrape` of a real public website | NOT TESTED | no public fixture reachable by the SSRF-guarded fetcher in the sandbox; every refusal path and the analyzer fallback are tested |
| 6 | Smart-schedule **generation** (button click) on `/dashboard/planning` | NOT TESTED | the tab renders and the plan->calendar flow is tested; the generator button is not driven |
| 7 | Anything on a real OpenAI or Supabase project (live model output, hosted RLS, real e-mail confirmation) | NOT TESTABLE | no credentials / by instruction; mocks verify request shapes and our handling only |

Removed (not tested because they no longer exist): `/api/supabase/setup` and its component (it reported success while doing nothing),
`real-time-analytics` (client service and Edge Function; it fabricated visitor/MRR numbers), and the ElevenLabs/Recraft/Gemini-specific
features that were dropped earlier with those providers: ElevenLabs **voice IDs, voice cloning and dubbing**, Recraft-specific image
styles, and Gemini model options. Voices are now OpenAI's; images use the Images API.

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

## Authentication coverage (automatic)

`tests/auth-coverage.test.ts` enumerates every `app/api/**/route.ts` and every `supabase/functions/*/index.ts` from the file system: each must use
`withUser` / `edgeHandler`, and each protected route handler is called without credentials and must answer **401**. A new route without the wrapper
fails the test. The only open routes are an explicit allow-list with reasons: `/api/models`, `/api/case-studies` (GET), `/api/contact` and the
`hello-world` function. | PASS (23 routes, 11 functions)

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
| `/dashboard/planning` (plan, **events placed on the calendar automatically**, `.ics` export validated, smart-schedule tab renders) | `features-analysis`, `features-dashboard` | PASS (smart-schedule generation not driven: NOT TESTED #6) |
| `/dashboard/visual-identity` (upload, AI image, editor, exports; **Asset Library from IndexedDB with delete; tiles from real items**) | `features-visual`, `features-local-ai`, `features-dashboard` | PASS |
| `/visual-identity` (marketing page) | smoke only | PASS (smoke only) |
| `/dashboard/voice-content` (studio + stat tiles from real saved audio) | `features-voice`, `features-dashboard` | PASS |
| `/voice-content` (marketing page) | smoke only | PASS (smoke only) |
| `/workflows` | `features-assistant`, `ui-fixes` | PASS |
| `/settings`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update` | `auth`, `byok-settings`, smoke | PASS |
| `/contact` (was an empty stub; now a validated form that **stores the message** in `contact_submissions` via `POST /api/contact`: honeypot, size cap, 5/hour per client, service-role write only) | `features-errors-pages`, `verify-ai`, `contact.test`, `db-test` | PASS |
| `/dashboard` (real saved items: audio, images, analyses; honest empty states; no live indicator) | `features-dashboard` | PASS |
| `/`, `/about`, `/agency`, `/analytics`, `/blogs`, `/case-studies`, `/cookies`, `/features`, `/integrations`, `/pricing`, `/privacy`, `/terms` | smoke (200, content, no uncaught error) | PASS (smoke only) |
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
| `/api/update-brand-content`, `/api/case-studies/generate` | auth gate and validation (`verify-ai`, `auth-coverage.test`); no UI calls them, so generation is not driven end to end | PASS (gate and validation only) |
| `/api/scrape` (SSRF-safe) | `verify-ai` (refusals, auth), analyzer flow | PASS (a successful scrape of a real public site is not tested: no public-site fixture; refusal paths are) |
| `/api/ai/analyze` -> `ai-analysis` edge function forwarding | auth gate in `verify-ai`; the edge function itself in `verify-edge`; the HTTP hop to a deployed function cannot be exercised (the mock Supabase has no Functions runtime) | PASS (parts) / hop **NOT TESTABLE** |

## Edge functions (Deno, real handlers against mock OpenAI/Supabase)

| Function | Result |
|---|---|
| `ai-analysis`, `brand-analysis`, `brand-analyzer`, `competitor-intelligence`, `market-analysis`, `social-media-analyzer` (strict schema, developer message, web_search step where applicable) | PASS |
| `website-scanner` (SSRF refusals of loopback, metadata address, localhost, `file:`) | PASS |
| `openai` (text, image), `voice-generator`, `voice-content` (voices, generate, podcast, audiobook, transcribe, legacy speech endpoint) | PASS |
| 401 without a session / 412 without a key / key never echoed (all functions share `withUser`) | PASS |
| `hello-world` | not exercised (see NOT TESTED #4) | **NOT TESTED** |

## Database (real Postgres 16, `scripts/db-test.sh`)

| Check | Result |
|---|---|
| All **16** migrations apply in order on a clean database **and re-run a second time without error** (policies/triggers made idempotent) | PASS |
| User A cannot read/update/delete user B's rows on any owned table; reads their own | PASS |
| `anon` sees nothing and writes nothing on any table (except published `case_studies` read) | PASS |
| `authenticated` has no access to `user_api_keys` (select/insert/update/delete); `service_role` has full access; provider restricted | PASS |
| `ai_usage_log` / `ai_jobs`: read own rows only, no client writes | PASS |
| `consume_rate_limit`: counts, blocks over the limit, per user and per bucket, window rolls, not executable by clients | PASS |
| Tables created after the migrations are not reachable by `anon`/`authenticated` (default privileges revoked; explicit grants for owner tables) | PASS |
| `contact_submissions`: no client access, service role only, length constraints | PASS |
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

## Bugs found and fixed in the latest round

1. **Fabricated numbers shown as live** on `/dashboard/visual-identity` (156 assets / 12 today / 2.3 GB / 98 %), `/dashboard/voice-content` (124 / 8 / 42 h / 96 %), three unlabeled placeholder cards dated 2025-03-19..21, `/brand-strategy` competitive metrics (85/78/90/88/85 %) and `ContentDashboard` "sample data" fallbacks: all replaced by values computed from the user's real saved items, or honest empty states / "Not measured".
2. `/dashboard` hung on "Loading real-time data... / Disconnected" and listed "Demo Podcast / Demo Audiobook": rewritten around real data; the fabricated analytics service and its Edge Function were deleted.
3. `lib/supabase.ts` silently returned demo rows on any error and **fabricated "saved" items on failed inserts** (also writing `user_id: 'user-id'`, a `blob:` URL and a mock 180 s duration). Now it throws honest errors, uses the signed-in session and the real user id. (The first version of the fix also used the wrong Supabase client, which always looked signed out; the e2e check that the row reaches the account caught it.)
4. `/api/supabase/setup` claimed "Database setup completed successfully" while doing nothing: deleted with its caller.
5. Brand analysis: scales (0.5 shown as "1%"), "Invalid Date", "Monitoring: Error" on success, clipped ring text, colliding tab labels: normalised in one place (`normalizeAnalysis`) with tests on odd values; the tab bar scrolls.
6. Calendar tab was empty after generating a plan: plan events are placed on it automatically (also after a reload) with a visible note.
7. Contact form no longer silently copies to the clipboard: messages are stored server-side; without a database the UI says plainly that messages cannot be received.
8. Migrations were not re-runnable (policies/triggers); the DB test now applies all of them twice. Default privileges for future tables are revoked.
9. Build was hiding errors (`ignoreBuildErrors`, `ignoreDuringBuilds`): both are off now; 18 lint errors (unescaped entities, hooks called inside a `map` callback in `parallax-features`) were fixed, and `eslint` + `eslint-config-next` were added (they were missing, so `next lint` could not even run).
10. Third-party code at runtime: MediaPipe files are loaded from a pinned CDN URL and verified against SHA-384 hashes before use; Transformers.js and ONNX Runtime are self-hosted under `public/vendor/` by `scripts/vendor-local-ai.mjs` (SHA-384-pinned, runs before `npm run build`; WASM only, the WebGPU bundle is not vendored).
11. e2e infrastructure: specs take configurable ports/paths (`E2E_*`), run via `npm run e2e*` against a production build with the mocks started under neutral process names (other tooling on shared machines was killing "mock-"/"next" processes mid-run); the rate-limit check no longer depends on earlier sections.

## Known gaps (stated plainly)

- See the NOT TESTABLE / NOT TESTED table above; nothing there is hidden in the totals.
- Pages marked "smoke only" were only loaded.
- The MediaPipe/Transformers model **weights** are still fetched from Google/Hugging Face at use time (data, not code; Hugging Face serves them with its own integrity checks).
- `/contact` grew from an empty stub to a real form (+39 kB First Load JS on that route).
- `package-lock.json` was regenerated (`npm install --legacy-peer-deps`) to add eslint; the project already had unresolved peer-dependency conflicts.
