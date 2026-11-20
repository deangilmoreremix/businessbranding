// Playwright checks for the UI defects fixed after review. Needs fresh mocks (scratchpad/run-verify.sh).
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:5240';
let failed = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n} ${x}`); if (!c) failed++; };
const session = (token, id) => () => {};

(async () => {
  for (const p of ['/workflows', '/brand-strategy', '/dashboard/brand-analysis', '/settings']) await fetch(base + p).then((r) => r.text()).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  const b = await chromium.launch();
  const open = async (token, id) => {
    const ctx = await b.newContext({ viewport: { width: 1300, height: 1000 } });
    await ctx.addInitScript(([t, i]) => {
      const S = { access_token: t, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: i, email: 'x@example.test', aud: 'authenticated', role: 'authenticated' } };
      document.cookie = 'sb-127-auth-token=' + encodeURIComponent(JSON.stringify(S)) + '; path=/';
    }, [token, id]);
    return ctx.newPage();
  };
  const ALICE = '11111111-1111-4111-8111-111111111111', BOB = '22222222-2222-4222-8222-222222222222';

  // redirect
  const r = await fetch(base + '/docs/gemini-features', { redirect: 'manual' });
  ok('/docs/gemini-features -> permanent redirect to /docs/ai-features', (r.status === 308 || r.status === 301) && (r.headers.get('location') || '').endsWith('/docs/ai-features'), `${r.status} ${r.headers.get('location')}`);

  // /workflows: one nav only
  let page = await open('tok-alice', ALICE);
  await page.goto(base + '/workflows', { waitUntil: 'networkidle', timeout: 120000 });
  ok('/workflows renders exactly one site navigation', (await page.locator('[data-testid=site-nav]').count()) === 1);
  await page.context().close();

  // dashboard tiles: placeholders before an analysis (alice has NO key here -> sample data label after analysis)
  page = await open('tok-alice', ALICE);
  await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
  const tilesBefore = await page.locator('main, body').first().innerText();
  ok('header tiles: no invented 85% / 92% / #2 / +45% before an analysis', !/\b85%|\b92%|#2\b|\+45%/.test(tilesBefore));
  ok('header tiles show the empty placeholder', (await page.locator('h3:text-is("—")').count()) === 4);
  await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('[data-testid=sample-data-label]', { timeout: 40000 }).then(() => ok('no key: results are labelled "Sample data - add your OpenAI key"', true)).catch(() => ok('no key: results are labelled "Sample data - add your OpenAI key"', false));
  ok('  the label links to Settings', !!(await page.$('[data-testid=sample-data-label] a[href="/settings#ai"]')));
  await page.context().close();

  // with a key: real results, no sample label, tiles filled from the analysis
  await fetch(base + '/api/settings/openai-key', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-bob' }, body: JSON.stringify({ apiKey: 'sk-test-BOB0000000000002222' }) });
  page = await open('tok-bob', BOB);
  await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 60000 });
  ok('with a key: no sample-data label', (await page.locator('[data-testid=sample-data-label]').count()) === 0);
  ok('with a key: tiles are filled from the analysis', (await page.locator('h3:text-is("—")').count()) < 4);
  await page.context().close();

  // /brand-strategy: the analysis overview renders once
  page = await open('tok-bob', BOB);
  await page.goto(base + '/brand-strategy', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[type=url][placeholder="Business Website URL"]', 'https://acme-coffee.example');
  await page.click('button:has-text("Analyze Brand Strategy")');
  await page.waitForSelector('h3:has-text("Brand Health Score")', { timeout: 60000 });
  await page.waitForTimeout(1500);
  ok('/brand-strategy: "Brand Health Score" block appears exactly once', (await page.locator('h3:has-text("Brand Health Score")').count()) === 1);
  ok('/brand-strategy: "Brand Performance Across Pillars" appears exactly once', (await page.locator('text=Brand Performance Across Pillars').count()) === 1);
  ok('/brand-strategy: competitive analysis still shown (derived from the single analysis)', (await page.locator('h2:has-text("Competitive Analysis")').count()) === 1);
  await page.context().close();

  await b.close();
  console.log(failed ? `\n${failed} FAILED` : '\nAll UI fix checks passed');
  process.exit(failed ? 1 : 0);
})();
