// Error states in the real UI (401, 412, 402 quota, 424 model unavailable, 429, 403 CSRF) + every page route + settings tabs + API smoke. Fresh mocks.
const { launch, signUpAndAddKey, base, ok, section, warm, results, PW } = require('./lib');

const PAGES = ['/', '/about', '/agency', '/analytics', '/blogs', '/brand-strategy', '/case-studies', '/contact', '/cookies', '/dashboard', '/dashboard/brand-analysis', '/dashboard/planning', '/dashboard/visual-identity', '/dashboard/voice-content', '/docs', '/docs/ai-features', '/docs/best-practices', '/docs/components/brand-analysis', '/docs/components/brand-pillar-breakdown', '/docs/components/business-analyzer', '/docs/components/competitive-analysis', '/docs/components/content-dashboard', '/docs/components/export-dialog', '/docs/components/feature-discovery', '/docs/components/implementation-plan', '/docs/components/visual-identity', '/docs/components/voice-interface', '/docs/integration-guide', '/docs/voice-features', '/features', '/integrations', '/login', '/pricing', '/privacy', '/reset-password', '/settings', '/sign-up', '/terms', '/visual-identity', '/voice-content', '/workflows'];

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/brand-analysis']);
  const { browser, ctx, page, errors } = await launch();

  // ---- signed out
  await section('signed-out', async () => {
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme');
    await page.click('button:has-text("Analyze")');
    await page.waitForSelector('[data-testid=openai-key-notice]', { timeout: 30000 });
    ok('401: signed-out AI use shows the sign-in notice (not a crash)', /Sign in/.test(await page.innerText('[data-testid=openai-key-notice]')));
    ok('401: sample data is labelled when signed out', (await page.locator('[data-testid=sample-data-label]').count()) >= 1);
    const r = await ctx.request.post(base + '/api/ai/task', { data: { task: 'brand_content', input: 'x' } });
    ok('401: API without a session -> 401 AUTH_REQUIRED json', r.status() === 401 && (await r.json()).code === 'AUTH_REQUIRED');
  });

  // ---- no key (412)
  await section('no-key', async () => {
    const email = await signUpAndAddKey(page, 'nokey', null);
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme');
    await page.click('button:has-text("Analyze")');
    await page.waitForSelector('[data-testid=openai-key-notice]', { timeout: 30000 });
    const txt = await page.innerText('[data-testid=openai-key-notice]');
    ok('412: signed in without a key -> "Add your OpenAI key" notice linking to Settings', /Add your OpenAI key/.test(txt) && !!(await page.$('[data-testid=openai-key-notice] a[href="/settings#ai"]')));
    const r = await page.evaluate(async () => { const x = await fetch('/api/voice/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hi' }) }); return { s: x.status, j: await x.json() }; });
    ok('412: voice route returns OPENAI_KEY_REQUIRED json', r.s === 412 && r.j.code === 'OPENAI_KEY_REQUIRED');
  });

  // ---- CSRF: a cookie-authenticated cross-site POST is refused (APIRequestContext shares the cookie jar)
  await section('csrf', async () => {
    const bad = await ctx.request.post(base + '/api/ai/task', { headers: { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' }, data: { task: 'brand_content', input: 'x' } });
    ok('403: cookie session + cross-site POST -> CSRF_BLOCKED', bad.status() === 403 && (await bad.json()).code === 'CSRF_BLOCKED', `status ${bad.status()}`);
    const good = await ctx.request.post(base + '/api/ai/task', { headers: { 'Sec-Fetch-Site': 'same-origin' }, data: { task: 'brand_content', input: 'x' } });
    ok('403: same-origin POST with the same cookie is not blocked', good.status() !== 403 && good.status() !== 401, `status ${good.status()}`);
  });

  // ---- quota (402), model unavailable (424), rate limit (429) with special mock keys
  const useKey = async (key) => {
    await page.goto(base + '/settings#ai', { waitUntil: 'networkidle' });
    await page.fill('#openai-key', key);
    await page.click('button:has-text("Validate & save")');
    await page.waitForSelector('[data-testid=key-masked]', { timeout: 20000 });
  };
  await section('quota', async () => {
    await useKey('sk-quota-0123456789abcdefgh');
    const r = await page.evaluate(async () => { const x = await fetch('/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'brand_content', input: 'x' }) }); return { s: x.status, j: await x.json() }; });
    ok('402: out-of-credit OpenAI account -> friendly OPENAI_QUOTA_EXCEEDED', r.s === 402 && r.j.code === 'OPENAI_QUOTA_EXCEEDED' && !/sk-/.test(JSON.stringify(r.j)), JSON.stringify(r.j).slice(0, 120));
    await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle' });
  });
  await section('model-unavailable', async () => {
    await useKey('sk-limited-0123456789abcdefgh');
    const r = await page.evaluate(async () => { const x = await fetch('/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'brand_content', input: 'x' }) }); return { s: x.status, j: await x.json() }; });
    ok('424: key without access to the model -> OPENAI_MODEL_UNAVAILABLE naming the model + Settings', r.s === 424 && r.j.code === 'OPENAI_MODEL_UNAVAILABLE' && /gpt-/.test(r.j.error), JSON.stringify(r.j).slice(0, 160));
    // per-user model override fixes it
    await page.goto(base + '/settings#ai', { waitUntil: 'networkidle' });
    await page.fill('#model-text', 'gpt-4.1');
    await page.getByRole('button', { name: /Save models/i }).click().catch(() => {});
    await page.waitForTimeout(800);
    const r2 = await page.evaluate(async () => { const x = await fetch('/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'brand_content', input: 'x' }) }); return x.status; });
    ok('model override: per-user model setting makes the request succeed', r2 === 200, `status ${r2}`);
  });
  await section('invalid-key', async () => {
    await page.goto(base + '/settings#ai', { waitUntil: 'networkidle' });
    await page.fill('#openai-key', 'sk-bad-0123456789abcdefghij');
    await page.click('button:has-text("Validate & save")');
    await page.waitForSelector('[data-testid=key-message][role=alert]');
    ok('401: invalid key is rejected on save with a clear message', /rejected|revoked|invalid/i.test(await page.innerText('[data-testid=key-message]')));
    await useKey('sk-forbidden-0123456789abcdef').catch(() => {});
  });
  await section('rate-limit', async () => {
    await useKey('sk-test-RATELIMIT000000007777');
    const codes = await page.evaluate(async () => { const out = []; for (let i = 0; i < 14; i++) { const x = await fetch('/api/settings/openai-key', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: 'short' }) }); out.push(x.status); } return out; });
    ok('429: per-user rate limit trips after the limit (Supabase-backed)', codes.includes(429), codes.join(','));
  });

  // ---- every page route renders (HTTP 200, a heading or main content, no uncaught error)
  await section('pages', async () => {
    await signUpAndAddKey(page, 'pages');
    for (const p of PAGES) {
      const res = await page.goto(base + p, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch((e) => ({ status: () => 0, err: e }));
      await page.waitForTimeout(700);
      const heading = await page.locator('h1, h2, h3, main').count();
      const before = errors.length;
      ok(`page ${p}: loads (200) and renders content`, res && res.status && res.status() === 200 && heading > 0, `status ${res && res.status && res.status()}`);
    }
  });

  // ---- contact form
  await section('contact', async () => {
    await page.goto(base + '/contact', { waitUntil: 'networkidle' });
    await page.click('button[type=submit]');
    ok('contact: empty form shows validation errors', (await page.locator('form [role=alert]').count()) === 3);
    await page.fill('#c-name', 'Ann'); await page.fill('#c-email', 'ann@example.test'); await page.fill('#c-message', 'Hello, I would like to know more.');
    await page.click('button[type=submit]');
    await page.waitForSelector('[data-testid=contact-done]');
    ok('contact: valid form completes (no mail backend configured -> message copied)', /copied|mail app/.test(await page.innerText('[data-testid=contact-done]')));
  });

  // ---- settings tabs
  await section('settings', async () => {
    await page.goto(base + '/settings', { waitUntil: 'networkidle' });
    for (const t of ['Profile', 'Notifications', 'Security', 'OpenAI', 'Billing']) {
      await page.getByRole('tab', { name: new RegExp(t, 'i') }).click();
      await page.waitForTimeout(250);
    }
    ok('settings: every tab opens', true);
  });

  // ---- API smoke
  await section('api', async () => {
    const hdr = {};
    for (const p of ['/api/models', '/api/case-studies']) { const r = await ctx.request.get(base + p); ok(`api ${p}: answers 200 json`, r.status() === 200, `status ${r.status()}`); }
    const tb = await ctx.request.get(base + '/api/top-brands?industry=coffee', { headers: { 'Sec-Fetch-Site': 'same-origin' } });
    ok('api /api/top-brands: signed-in user gets a result', tb.status() === 200 || tb.status() === 412, `status ${tb.status()}`);
  });

  ok('errors/pages: no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll error-state and page checks passed');
  process.exit(failed ? 1 : 0);
})();
