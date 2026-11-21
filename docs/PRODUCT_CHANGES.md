# Product changes (user-visible)

## Behaviour
- **No fallback data anywhere.** Without a saved OpenAI key an analysis/plan/voice request shows "OpenAI key needed" with a link to Settings; signed-out shows "Sign in required"; a service error, rate limit or lost connection shows the real cause and **Try Again**. Nothing is ever generated from built-in sample data, and the "Sample data" banner no longer exists.
- **Exports are real files.** Brand analysis, competitive analysis and implementation plans export PDF, Excel and Word (plans also export an `.ics` calendar) with the sections you choose; failures are shown in the dialog.
- **Progress is honest.** Long requests show a spinner with elapsed seconds instead of a percentage bar.
- Competitive analysis shows *Brand health*, *Market fit* and *Uniqueness* under their true names, plus the competitors the analysis returned.
- Footer newsletter and contact form save to the database ("saved, nothing automated yet"); blog posts and case studies come from the `blog_posts` / `case_studies` tables and show an empty state when none are published.
- Navigation switches to the mobile menu below 1024 px (the bar overflowed at 768 px); the hero headline reserves space for the typewriter text.

## Removed
Sample/demo data and its banner; the legacy export dialog; the "Digital Presence Score 85%" card; Best Practices status badges ("Optimized", "Real-time", ...); the competitor Opportunity Gaps / Disruption Risk / Competitive Advantage blocks;
the implementation-plan timeline chart; `/api/top-brands`, `/api/update-brand-content`, `/api/case-studies/generate`, `/api/voice/optimize`, `/api/ai/analyze`; Edge Functions `ai-analysis`, `brand-analysis`, `competitor-intelligence`, `market-analysis`, `social-media-analyzer`, `website-scanner`, `hello-world`.
Earlier rounds: trend analysis, sentiment dashboard, real-time analytics, partner program, pricing plans, invented team/blog/social accounts.

## Operations
- Public forms need a trustworthy client address: see the README ("Deployment requirements for the public forms"), `NETLIFY`, `TRUST_PROXY_HEADERS`, `PUBLIC_FORM_HOURLY_CAP`.
- Git history contains the original `.env` with live keys (commit `a4f5488`): rotate them.
- Dependencies: `next` 14.2.35, `jspdf` 4.2.1, `xlsx` 0.20.3 (vendor tarball); `@genkit-ai/ai` and `axios` removed. See the audit notes in `docs/FEATURE_TEST_MATRIX.md`.
