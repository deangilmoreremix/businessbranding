// Failure modes: upstream 5xx, edge function down, missing key, signed out. Every analysis/planning/voice surface must show the REAL
// cause with Retry and must NEVER show scores, plans or audio (there is no fallback data anywhere).
const { launch, signUpAndAddKey, base, ok, section, warm, results } = require('./lib');

const SCORE = /\b\d{1,3}(\.\d)?%/; // any percentage in a results area would be a (fake) score

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/brand-analysis', '/brand-strategy', '/dashboard/planning', '/dashboard/voice-content']);
  const { browser, ctx, page, errors } = await launch();
  await signUpAndAddKey(page, 'fail'); // HAS a key: a failure must never be blamed on a missing key

  // Upstream 5xx on the AI route and the edge function unreachable
  await page.route('**/api/ai/task', (route) => (route.request().method() === 'POST' ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'The AI service is temporarily unavailable.', code: 'UPSTREAM' }) }) : route.continue()));
  await page.route('**/functions/v1/**', (route) => route.abort('failed'));

  await section('dashboard-brand-analysis', async () => {
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
    await page.click('main button:has-text("Analyze"), button[type=submit]:has-text("Analyze")');
    await page.waitForSelector('[data-testid=error-state]', { timeout: 40000 });
    const kind = await page.getAttribute('[data-testid=error-state]', 'data-error-kind');
    const text = await page.innerText('[data-testid=error-state]');
    ok('/dashboard/brand-analysis: 5xx + edge down -> service error (not "add your key") with Retry', kind === 'service' && /Try Again/.test(text) && !/add your OpenAI key/i.test(text), `${kind} | ${text.replace(/\s+/g, ' ').slice(0, 120)}`);
    ok('/dashboard/brand-analysis: no pillar breakdown, header tiles stay "—"', (await page.locator('[data-testid=pillar-breakdown]').count()) === 0 && (await page.locator('h3:text-is("—")').count()) === 4);
    ok('/dashboard/brand-analysis: no sample/demo label anywhere', !/sample data|demo/i.test(await page.innerText('body')));
    await page.waitForTimeout(2500);
    ok('/dashboard/brand-analysis: it does not retry in a loop', (await page.locator('[data-testid=error-state]').count()) === 1);
  });

  await section('brand-strategy', async () => {
    await page.goto(base + '/brand-strategy', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[type=url][placeholder="Business Website URL"]', 'https://acme-coffee.example');
    await page.click('button:has-text("Analyze Brand Strategy")');
    await page.waitForSelector('[data-testid=error-state]', { timeout: 40000 });
    const body = await page.innerText('body');
    ok('/brand-strategy: 5xx + edge down -> error state, no scores, no competitive analysis', (await page.locator('[data-testid=error-state][data-error-kind=service]').count()) === 1 && (await page.locator('[data-testid=competitive-analysis]').count()) === 0 && !/Brand Health Score\s*\n?\s*\d/.test(body) && !/\$1000M|Market Share|Competitive Edge/.test(body));
  });

  await section('planning', async () => {
    await page.goto(base + '/dashboard/planning', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('#plan-desc', 'Acme Coffee, small-batch roaster');
    await page.getByRole('button', { name: 'Generate plan' }).click();
    await page.waitForSelector('[data-testid=error-state]', { timeout: 40000 });
    ok('/dashboard/planning: 5xx -> error with Retry and no plan or budget', (await page.locator('[data-testid=error-state][data-error-kind=service]').count()) === 1 && (await page.getByRole('tab', { name: 'Budget' }).count()) === 0);
  });

  await section('voice', async () => {
    await page.route('**/api/voice/podcast', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Speech service unavailable' }) }));
    await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle', timeout: 120000 });
    await page.getByRole('tab', { name: 'Podcast' }).click();
    await page.waitForSelector('input[placeholder="Enter podcast title"]', { timeout: 60000 });
    await page.fill('input[placeholder="Enter podcast title"]', 'Ep1');
    await page.locator('textarea[placeholder="Enter segment script"]').first().fill('Welcome to the show.');
    await page.getByRole('button', { name: /Generate Podcast/ }).click();
    await page.waitForSelector('[data-testid=voice-error]', { timeout: 30000 });
    ok('voice: a failed podcast shows an error, no audio player and no download', (await page.locator('audio').count()) === 0 && /try again/i.test(await page.innerText('[data-testid=voice-error]')));
  });

  // Signed-in user WITHOUT a key: the correct cause is the key
  await section('no-key', async () => {
    await ctx.clearCookies();
    await page.unroute('**/api/ai/task');
    await page.unroute('**/functions/v1/**');
    await signUpAndAddKey(page, 'nokey2', null);
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme');
    await page.click('main button:has-text("Analyze"), button[type=submit]:has-text("Analyze")');
    await page.waitForSelector('[data-testid=error-state]', { timeout: 40000 });
    ok('/dashboard/brand-analysis: no key -> key error with Open Settings', (await page.getAttribute('[data-testid=error-state]', 'data-error-kind')) === 'key' && !!(await page.$('[data-testid=error-state] a[href="/settings#ai"]')));
  });

  ok('failures: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll failure-mode checks passed');
  process.exit(failed ? 1 : 0);
})();
