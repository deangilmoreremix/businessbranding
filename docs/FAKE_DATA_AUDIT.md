# Fake-data audit (systematic purge, round 4)

Scope: every page route (`app/**/page.tsx|mdx`), every route handler, and every component under `app/` and `components/`.
Classification: **R** = real (derived from the user's data / model output / real state), **E** = honest empty state or
"Not measured", **F→fixed** = was fabricated and is now removed or replaced. Enforced by `tests/no-fake-data.test.ts` (whole-tree
scan, see "Guard" at the end) plus the Playwright specs `public-pages`, `features-dashboard`, `viewports`.

## Page routes

| Route | Class | Notes |
|---|---|---|
| `/` (landing, hero, parallax features, industries) | F→fixed | Parallax section had invented testimonials, ROI/impact metrics with fake citations, a "COST SAVINGS" block, "+45% revenue" and dead *Explore* buttons: replaced with factual, non-numeric copy of what each tool does. |
| `/about` | F→fixed | Invented team and "Founded in 2023", fake blog teasers: removed; page now describes the tool. |
| `/blogs`, `/blogs/[slug]` | F→fixed / E | Hard-coded posts removed. Posts are read from the `blog_posts` table (published rows only, via `/api/blog`); empty state when none. Subscribe saves the address (`/api/newsletter`) and says "saved, nothing automated yet". |
| `/case-studies` | F→fixed / E | Reads `GET /api/case-studies` (published rows only, `[]` when none); empty state. |
| `/analytics` | F→fixed / E | Fabricated dashboard and dead Export buttons removed. Shows the user's real saved analyses/usage (`/api/usage`, IndexedDB) or an empty/sign-in state. |
| `/integrations` | F→fixed / R | Status badges are computed (signed in? key saved? database configured?); no "always Connected", no dead Configure buttons. |
| `/pricing` | F→fixed | Invented plans/prices/"Start Free Trial" removed: honest bring-your-own-key page. |
| `/features` | F→fixed | Unbacked claims and trial CTA removed. |
| `/agency` | F→fixed | "Increased revenue / high-margin / faster results" outcome claims replaced by what the tools do. |
| `/contact` | R / E | Stores the message (`contact_submissions`), optional webhook notification, honest wording (no promise of a reply). |
| `/privacy`, `/terms`, `/cookies` | F→fixed | Invented address ("123 AI Street") and mailboxes removed (email only if `NEXT_PUBLIC_CONTACT_EMAIL` is set, otherwise the contact form). Legal text otherwise unchanged. |
| `/login`, `/sign-up`, `/reset-password`, `/reset-password/update` | R | Real auth flows. |
| `/settings` | R | Profile/notifications/security persist; OpenAI key + models real; billing is an honest note. |
| `/dashboard` | R / E | Tiles computed from IndexedDB; "—" until data exists. Header wraps at 390 px. |
| `/dashboard/brand-analysis`, `/brand-strategy` | R / E | Model output only; missing scores show "Not measured" (no `?? 75` defaults any more). |
| `/dashboard/visual-identity`, `/visual-identity` | R / E | Asset library from IndexedDB; empty state. |
| `/dashboard/voice-content`, `/voice-content` | R / E | Saved audio from IndexedDB; voice settings persist (`lib/local/voice-prefs.ts`). |
| `/dashboard/planning` | R | Model-generated plan; calendar events are the user's. |
| `/workflows` | R | User-built graph; default steps no longer overlap. |
| `/docs`, `/docs/ai-features`, `/docs/voice-features`, `/docs/best-practices`, `/docs/integration-guide`, `/docs/api/openai`, `/docs/api/voice`, `/docs/components/*` (9 pages) | F→fixed | Removed: Feature Discovery page (component deleted), "real-time" monitoring/dashboard claims, an invented Discord/support mailbox, invented daily request quota (now describes the real per-user limiter). Code samples/example payloads in docs are illustrative and allow-listed in the guard. |

## Route handlers (`route.*` anywhere in the repo)

All 20+ handlers are enumerated by `tests/auth-coverage.test.ts` (every `route.*` file in the repository, not only `app/api`). Open
routes are an explicit allow-list with the allowed HTTP methods: `/api/models` GET, `/api/case-studies` GET, `/api/blog` GET,
`/api/blog/[slug]` GET, `/api/newsletter` POST, `/api/contact` POST. Everything else is behind `withUser` and answers 401 without a session.

## Components (`components/`, excluding `components/ui/*` primitives)

| Component(s) | Class | Notes |
|---|---|---|
| `parallax-features`, `hero-section`, `industries-section`, `industry-tile`, `landing-page`, `particle-background` | F→fixed / R | Marketing copy is factual and numeric-free. |
| `footer`, `newsletter-form` | F→fixed | Social links come from `NEXT_PUBLIC_SOCIAL_*` and are hidden when unset; dead *Join Discord / Contact Support / Partner Program* buttons removed; newsletter really saves. |
| `nav-header` | F→fixed | CTA is "Get started" / "Open dashboard" (signed in); breakpoint moved to `lg` (it overflowed at 768 px). |
| `brand-analysis/*` (`brand-analysis-client`, `competitor-intelligence`, `growth-trajectory`, `assistant-chat`, `error-state`, `loading-state`) | F→fixed | Export dialog now builds real PDF/XLSX/DOCX files (`lib/report-export.ts`); hard-coded "23% growth opportunity", "18% above industry average", `$8.7B +12% YoY`, `14.8%`, "Top 3 hold 65%", "7% above industry average" and `industry="Technology"` removed or derived from the analysis. Growth card shows "Not measured" for missing values. |
| `brand-analysis.tsx`, `brand-pillar-breakdown/*`, `competitive-analysis`, `business-analyzer/*`, `brand-presence-analyzer`, `implementation-plan` | R / E | Render model output; unmeasured values show "Not measured". |
| `content-dashboard`, `library-stat-tiles`, `export-dialog`, `calendar-view`, `schedule-models` | R | Real library data; export/schedule actions produce real files. |
| `voice-interface/*` (`voice-settings`, `voice-transcription`, `podcast-studio`, `audiobook-creator`, `live-voice`, `voice-recorder`, `voice-analysis`, `voice-enhancement`, `audio-visualizer`) | F→fixed / R | Settings persist and are consumed by the studios; usage comes from `/api/usage`; no fake save/backup options. |
| `visual-identity-analyzer/*` | R | Generation/variations via the user's key. |
| `local/*` (`image-editor`, `audio-trimmer`, `caption-player`, `asset-tools`, `workflow-builder`, `deep-research-panel`) | R | In-browser tools. |
| `settings/*`, `auth/*`, `openai-key-notice`, `error-boundary`, `loading-spinner`, `client-provider`, `documentation-links`, `support-agent*`, `sample-data-badge` | R | Real behaviour; sample data is always labelled. |

**Deleted as fabricating or dead (round 5 adds `export-dialog`, `pdf-generator`, `excel-generator`, `sample-data-badge`, the demo Supabase client and 7 Edge Functions):** `geo-performance-analysis`, `feature-discovery`, `branding-wizard` (hard-coded 75% platform
bars), `auth-required`, `voice-controls`, the duplicate `components/brand-analysis-client.tsx`, the sentiment dashboard, trend
analysis, real-time analytics, competitor-analysis modules, and ~30 earlier dead components (see git history).

## Data model changes (no invented defaults)

`validateAndCleanAnalysis` (`lib/services/brand-analyzer.ts`) no longer invents `healthScore ?? 75`, `marketFit ?? 0.7`,
`uniquenessScore ?? 0.65`, a stock "Generic Competitor", stock recommendations or 0.7 best-practice scores. Missing values are `null`/absent
and rendered as "Not measured" or "—" (`healthScore`, `marketFit`, `uniquenessScore`, `growthTrajectory.*`; `performanceMetrics`,
`bestPractices`, `implementationStatus` are optional). Sample-mode analyses (no key) carry `sample: true` and are labelled everywhere,
including in exported reports.

## Known remaining (stated plainly)

- There are no sample fixtures, demo payloads or fallback results in `app/`, `components/`, `lib/` or `supabase/functions/` (round 5 deleted the pattern: see
  `docs/FEATURE_TEST_MATRIX.md`). The only fixture is `tests/fixtures/plan.ts`, imported by tests, never by app code.
- `supabase/functions/_shared/schemas.ts` is now hand-maintained (its generator read the deleted fixtures). It still holds strict schemas for tasks whose
  consumers were deleted (e.g. `market_analysis`, `competitor_intelligence`); they are inert.
- The Best Practices tab keeps generic do/don't advice, now labelled "General guidance".
- `app/docs/**` and `*.mdx` are exempt from the numeric-claim rules only (version numbers, limits, example payloads); every other rule still applies there.

## Guard (`tests/no-fake-data.test.ts`, rules in `tests/guard/scanner.ts`)

Scans `app/`, `components/`, `lib/`, `supabase/functions/` (`.ts .tsx .js .jsx .mjs .mdx`). Content rules run on JSX text (children re-joined, so `{98}%` and
numbers split over lines are seen), string and template literals: percentages, prices, `125.8K`, `12 000`/`12000 teams`, `4.9/5 stars`, `3x`, "thousands of", "Over N",
free-trial/partner claims, unsourced citations, known fake names and ANY `Firstname Lastname, Title` attribution. Structure rules (AST): numeric properties >= 10 in arrays of
objects (any name outside a layout/config list), empty / toast-only / alert-only / console-only handlers, inert buttons, awaited fixed waits outside polling loops,
`setInterval` counters, `Math.sin/cos`, literal style/class percentages and `<Progress value={N}>`, `href` of `""`, `#`, `javascript:`, `Math.random`, demo/sample fixtures and flags.
The allow-list is empty for application code (documentation only skips the numeric rules). `tests/guard-fixtures/*.fixture` are 41 planted fakes/evasions; each must trigger its expected rule.
