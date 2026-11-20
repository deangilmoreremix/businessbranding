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
| vitest (unit, security, BYOK, auth-coverage over **every `route.*` file in the repo**, SRI, **whole-tree no-fake-data guard + its 41-fixture self-test**, report exports (PDF/XLSX/DOCX parsed back), contact limiter incl. direct-spoof / non-Netlify cases, stats, display, settings, workflow layout) | 290 (1 skipped: live SRI pins, opt-in `SRI_LIVE=1`) | 0 |
| `scripts/verify-ai.sh` -> `verify-ai.mjs` (API request shapes, BYOK, security, contact/newsletter incl. spoofed XFF, rotating X-Real-IP, global hourly cap, blog, case-studies, usage) | 139 | 0 |
| `scripts/edge-test.mjs` -> `verify-edge.ts` (the 4 remaining Edge Functions, Deno 2.9) | 16 | 0 |
| `scripts/db-test.sh` (**17 migrations applied twice**, RLS, table/function privileges; Postgres 16) | 148 | 0 |
| Playwright `auth` | 22 | 0 |
| Playwright `byok-settings` | 16 | 0 |
| Playwright `ui-fixes` | 11 | 0 |
| Playwright `features-visual` | 14 | 0 |
| Playwright `features-voice` | 17 | 0 |
| Playwright `features-assistant` | 14 | 0 |
| Playwright `features-analysis` | 18 | 0 |
| Playwright `features-errors-pages` | 61 | 0 |
| Playwright `features-local-ai` (real MediaPipe + Whisper downloads, SRI tamper test) | 5 | 0 |
| Playwright `features-dashboard` (real data, analysis display, planning, **competitive .xlsx and plan .ics/.docx parsed**) | 25 | 0 |
| Playwright `features-settings` | 15 | 0 |
| Playwright `public-pages` (empty states, seeded rows, newsletter, footer, contact, pricing/integrations/analytics, **brand-analysis PDF/XLSX/DOCX downloads are valid files**) | 37 | 0 |
| Playwright `failures` (**5xx + edge down, signed-in-without-key, on /dashboard/brand-analysis, /brand-strategy, planning and voice: real cause + Retry, no scores/plan/audio, no retry loop**) | 9 | 0 |
| Playwright `viewports` (30 routes x 3 widths, signed out and in; hero headline vs subtitle geometry; workflow steps) | 185 | 0 |
| **Total automated assertions** | **1042** | **0** |

NOT TESTABLE: exactly **1** is reported by the specs at run time: *live voice, the WebRTC SDP exchange and microphone audio with the Realtime model*
(needs a real OpenAI Realtime peer; the ephemeral-secret route is tested). `features-local-ai` prints "see NOT TESTABLE lines" in its footer and only
emits a NOT TESTABLE line if the MediaPipe/Whisper download fails in the browser; in the final run it did not. (An earlier version of this matrix said "2"; the
second one was that footer text, not a skipped check.) The full list of untested/untestable items is the table below.

Also: `tsc` 0 errors (app and edge config), `next lint` 0 errors, `next build` green **with type checking and lint enforced**.

### NOT TESTABLE / NOT TESTED (complete list)

| # | Item | Status | Why |
|---|---|---|---|
| 1 | Live voice: WebRTC SDP exchange + microphone audio with the model | NOT TESTABLE | needs a real OpenAI Realtime peer; a mock cannot answer the handshake (the ephemeral-secret route IS tested) |
| 2 | Password reset **completion** from a real recovery e-mail link | NOT TESTABLE | needs a real Supabase recovery token (the request, the redirect URL and the "expired link" state are tested) |
| 3 | The deployed `brand-analyzer` Edge Function HTTP hop from the browser | NOT TESTABLE | the mock Supabase has no Functions runtime (the function itself runs in the Deno suite; the app falls back to `/api/ai/task`, which is tested) |
| 5 | A successful `/api/scrape` of a real public website | NOT TESTED | no public fixture reachable by the SSRF-guarded fetcher in the sandbox; every refusal path and the analyzer fallback are tested |
| 6 | Smart-schedule **generation** (button click) on `/dashboard/planning` | NOT TESTED | the tab renders, the plan->calendar flow and the failure state are tested; a successful generation is not driven |
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
| Settings -> Profile: saved server-side to `user_settings` (owner row), invalid website rejected with a field error, survives reload, does not wipe the key/model settings | `features-settings` | PASS |
| Settings -> Notifications: preferences saved and restored; the card says plainly that e-mail is not sent yet | `features-settings` | PASS |
| Settings -> Security: real password change via Supabase auth after verifying the current password (wrong current / <12 chars / mismatch refused; old password stops working, new one signs in). Two-factor is stated as unavailable | `features-settings` | PASS |
| Settings -> Billing: honest BYOK note; the card number/CVV/zip inputs and the fake "Update Billing" button were removed | `features-settings` | PASS |
| Settings -> OpenAI tab | `byok-settings` | PASS |

## Authentication coverage (automatic)

`tests/auth-coverage.test.ts` enumerates every `app/api/**/route.ts` and every `supabase/functions/*/index.ts` from the file system: each must use
`withUser` / `edgeHandler`, and each protected route handler is called without credentials and must answer **401**. A new route without the wrapper
fails the test; `route.ts/.tsx/.js/.jsx/.mjs` are all enumerated, and an open route that gains an extra HTTP method fails too (mutation-tested). The only open routes are an explicit allow-list with reasons: `/api/models`, `/api/case-studies` (GET), `/api/contact` and the
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
| `/dashboard/brand-analysis` (analysis, tiles, pillar breakdown, key/auth/service error states) | `features-analysis`, `ui-fixes` | PASS |
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
| `/`, `/agency`, `/cookies`, `/features`, `/privacy`, `/terms` | smoke (200, content, no uncaught error) + viewport + fake-data guard | PASS (smoke, viewport and static guard only; no behavioural flow) |
| `/about`, `/blogs`, `/blogs/[slug]`, `/case-studies`, `/pricing`, `/integrations`, `/analytics`, `/contact`, footer newsletter | `public-pages` (empty states, seeded rows, saves to tables, computed status, no invented copy) | PASS |
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
| `/api/case-studies` (read), `/api/models` | `features-errors-pages`, `verify-ai` | PASS |
| `/api/top-brands`, `/api/update-brand-content`, `/api/case-studies/generate`, `/api/voice/optimize`, `/api/ai/analyze` | **deleted** (no UI called them; they returned sample data without a key) | removed |
| `/api/scrape` (SSRF-safe) | `verify-ai` (refusals, auth), analyzer flow | PASS (a successful scrape of a real public site is not tested: no public-site fixture; refusal paths are) |

## Edge functions (Deno, real handlers against mock OpenAI/Supabase)

| Function | Result |
|---|---|
| `brand-analyzer` (strict schema, developer message, 412 `OPENAI_KEY_REQUIRED` without a key, no demo payload) | PASS |
| `openai` (text, image), `voice-generator`, `voice-content` (voices, generate, podcast, audiobook, transcribe, legacy speech endpoint) | PASS |
| 401 without a session / 412 without a key / key never echoed (all functions share `withUser`) | PASS |

**Deleted Edge Functions** (the UI never called them; several returned `demo: true` payloads): `ai-analysis`, `brand-analysis`, `competitor-intelligence`, `market-analysis`, `social-media-analyzer`, `website-scanner`, `hello-world`.

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
| Without `20261121000100_rls_hardening.sql` the current test fails **33** checks (anyone with the anon key could read/write five tables and NULL-owner rows on six; privileges, defaults and the voice_profiles fix are gone too). An earlier version of this document said 24: that was the count at the time, before the privilege probes were added | verified by removing the file |
| Removing the `REVOKE` on `user_api_keys` (or the `voice_profiles.updated_at` fix) makes the suite FAIL (3 checks): the privilege and trigger probes are mutation-tested | verified |
| Table privileges: no client privileges on `user_api_keys`, `rate_limits`, `contact_submissions`; `ai_*` read-only for authenticated; no TRUNCATE/REFERENCES/TRIGGER for clients anywhere; `case_studies` SELECT-only for anon; no `public` function executable by clients; functions created later are not executable by anon/authenticated/PUBLIC | PASS |
| `voice_profiles` UPDATE works (the trigger referenced a column that did not exist) and is owner-scoped | PASS |

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

## Bugs found and fixed in the second gate round

1. **5000% growth:** `normalizeAnalysis` converted growth to a percentage and the UI multiplied by 100 again. Every rate/score is now normalised to a fraction in one place and shown via `formatFraction`; `GrowthTrajectoryCard` is tested with `current = 0.5` and `= 50` (both show `50.0%`).
2. **Settings forms were fake** (a 1.5 s timer; a Billing tab collecting card details): Profile/Notifications/Security save for real, Billing is an honest note.
3. **Random/invented numbers**: removed from competitor intelligence (stock competitors, random radar/heatmap/bar values, hard-coded segment, growth and regional charts), case-study generation (random metrics, "Client Name / CEO" testimonial) and the Edge Function demo fixtures; unused fabricating modules were deleted (sentiment dashboard, trend analysis, competitor-analysis, the lib social/website scanners, `transformAndSaveImage`, `lib/supabase/index.ts`). A guard test fails on any `Math.random()` outside two allow-listed id/jitter uses.
4. Contact rate limiting trusted the first (client-controlled) `X-Forwarded-For` value: platform headers, then the rightmost hop.
5. SRI: the integrity option made a tampered file indistinguishable from "offline" in the browser (the editor said "download blocked"); the hash is now compared explicitly and an integrity-specific message is shown. The segmenter model is pinned to a versioned URL with a hash and loaded from verified bytes.
6. `voice_profiles` could never be updated; table/function privileges tightened (see Database).
7. Invented marketing statistics (98 % satisfaction, 2,500+ brands, 30+ countries, 185 %, "+45 % revenue" ...) replaced by factual, non-numeric copy. The `/docs/case-studies` link pointed to a 404.
8. Remote Lottie animations (third-party downloads, 403 in restricted networks) replaced by local decorative panels.

## Round 4: systematic purge (corrections to earlier claims)

Earlier rounds of this matrix said fabricated competitor charts and "+45 % revenue" style copy had been removed. That was **incomplete**: the
landing parallax section, `/about`, `/blogs`, `/case-studies`, `/analytics`, `/integrations`, `/pricing`, `/features`, the footer, the
competitor Market/Overview tabs (Competitive Advantage, Opportunity Gaps, Disruption Risk with invented competitors), the implementation-plan
timeline chart, the `75%` social bars and the fake export dialog still showed fabricated numbers or fake success. All of these are now removed
or computed; see `docs/FAKE_DATA_AUDIT.md` for the per-route / per-component inventory and `tests/no-fake-data.test.ts` for the guard
(which also fails on literal progress bars and hard-coded metric properties outside the labelled sample fixtures).

- `/analytics` was rated "PASS (smoke only)" while showing an invented dashboard; it is now a real-data/empty-state page covered by `public-pages`.
- **Features removed** (they only displayed fabricated data): trend analysis, sentiment dashboard, real-time analytics (client service and Edge Function),
  the competitor-analysis module, geo-performance analysis, feature-discovery tour, branding wizard, partner program, pricing plans, invented team and
  blog posts, invented social accounts. Case studies and blog posts now come from the `case_studies` / `blog_posts` tables and show an empty state when none are published.
- Brand analysis no longer invents `healthScore 75 / marketFit 0.7 / uniquenessScore 0.65`, a stock competitor or stock recommendations; missing values
  show "Not measured".
- The Export dialog downloads real PDF, XLSX and DOCX files of the analysis (tested by parsing them back, in vitest and in the browser).
- Git history still contains the original `.env` with live keys (first added in commit `a4f5488`; also in `2ff6c7f`, `ba0d981`). **Rotate** those keys; see `/docs/integration-guide`.

## Round 5: the demo-data pattern is gone (root cause)

The recurring fakes had one cause: code paths that return invented data when a key is missing or a call fails (`isDemoMode()` fixtures, `catch { return demo }`).
All of it was deleted: `getDemoAnalysis`, every `isDemoMode()` branch and sample fixture in `lib/services/*`, the `sample` flag, the `X-Sample-Data`
headers, the sample-data banner/label and its events, `demo: true` payloads and the "This is a demo response" string in the Edge Functions, the
Supabase "demo client" that pretended writes succeeded, the local schedule planner used as an AI fallback, and the unused routes/functions that carried them.
A signed-in user without a key gets the add-key state; every failure shows its real cause (key / sign-in / rate limit / service / network) with Retry and
never a result. Proven by `e2e/failures.spec.js` (5xx + edge down + no key) and by the guard, which no longer allow-lists `lib/**`.

- The legacy `ExportDialog`, `pdf-generator.ts` and `excel-generator.ts` (PDF "element not found", `Health Score undefined%`, empty `.ics`) were deleted; plan,
  competitive and brand-analysis exports now use `lib/report-export.ts` (PDF/XLSX/DOCX, plus .ics for plans) with chosen sections and visible errors.
- Competitive view uses true labels (brand health / market fit / uniqueness); Best Practices no longer shows status badges as measurements, generic advice is labelled
  "General guidance"; the "Top Recommendation" comes from the analysis; the invented "Digital Presence Score 85%" card was removed.
- Fake progress (time-based bars capped at 90-95 %, the 4x3 s artificial wait in schedule generation) was replaced by indeterminate status with real elapsed time.
- Public forms: `x-nf-client-connection-ip` is trusted only when `NETLIFY=true`; a global hourly cap (`PUBLIC_FORM_HOURLY_CAP`) backs up the per-client limit;
  deployment requirements are in the README and `docs/DEPLOYMENT.md`.
- Guard: scans `.ts .tsx .js .jsx .mjs .mdx` in `app/ components/ lib/ supabase/functions/`; content-based rules (JSX text re-joined incl. `{98}%` and split lines),
  numeric data in arrays, trig series, literal style percentages, empty/toast-only/console-only handlers, artificial delays, interval counters,
  `Name, Title` attributions, dead hrefs. The allow-list contains documentation only. `tests/guard-fixtures/` plants 41 fakes and evasions; each must be caught.
- `npm audit --omit=dev`: 52 -> 15 findings (critical 5 -> 1). Removed unused `@genkit-ai/ai` and `axios`; upgraded `next` to 14.2.35, `jspdf` to 4.2.1, `xlsx` to SheetJS 0.20.3
  (installed from the vendor CDN tarball, as SheetJS documents). Remaining, assessed: `next` critical (Image Optimizer DoS): not reachable, `images.unoptimized` is on and `next/image` is unused; `postcss` (bundled in next),
  `lodash`/`lodash-es`, `d3-color`, `glob`/`minimatch`/`brace-expansion`/`picomatch`/`cross-spawn`/`yaml`, `postcss-selector-parser`, `moment`: build-time or transitive
  (nivo, tailwind, eslint/mdx toolchains), no untrusted input reaches them at runtime; `@supabase/ssr`/`cookie` (low): upgrading `@supabase/ssr` past 0.1 changes the cookie API and was not attempted. Next 15 was not attempted (React 19 / async request APIs).

## Known gaps (stated plainly)

- See the NOT TESTABLE / NOT TESTED table above; nothing there is hidden in the totals.
- Pages marked "smoke only" were only loaded.
- The MediaPipe/Transformers model **weights** are still fetched from Google/Hugging Face at use time (data, not code; Hugging Face serves them with its own integrity checks).
- `/contact` grew from an empty stub to a real form (+39 kB First Load JS on that route).
- `/pricing` is now an honest bring-your-own-key page (no plans, prices or trial); earlier rounds left invented plan prices there.
- Test scratch files use per-run unique directories (`mkdtemp`); the e2e runner no longer writes to predictable shared `/tmp` names.
- `package-lock.json` was regenerated (`npm install --legacy-peer-deps`) to add eslint; the project already had unresolved peer-dependency conflicts.
