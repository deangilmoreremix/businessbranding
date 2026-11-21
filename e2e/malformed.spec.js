// Malformed / partial server replies on every AI- and data-driven page: never a white screen ("Application error"), never raw parser
// errors, never "undefined"/"NaN", never an invented 0%; always the "unreadable response" message with Try Again.
const { launch, signUpAndAddKey, base, ok, section, warm, results } = require('./lib');

const BAD = {
  'empty object': { status: 200, body: '{}' },
  'data empty object': { status: 200, body: '{"data":{}}' },
  'data null': { status: 200, body: '{"data":null}' },
  'html body': { status: 200, body: '<html><body>Bad gateway</body></html>', contentType: 'text/html' },
  'truncated json': { status: 200, body: '{"data":{"overview":' }
};
const fulfill = (b) => (route) => route.fulfill({ status: b.status, contentType: b.contentType || 'application/json', body: b.body });
const noCrash = async (page, where) => {
  const t = await page.innerText('body');
  const bad = [/Application error/i, /client-side exception/i, /Unexpected token/i, /Expected ','/i, /Cannot read prop/i, /Failed to execute/i, /\bundefined\b/, /\bNaN\b/].find((re) => re.test(t));
  ok(`${where}: no white screen, no raw parser error, no "undefined"/"NaN"`, !bad, bad ? String(bad) + ' | ' + t.replace(/\s+/g, ' ').slice(0, 120) : '');
};

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/brand-analysis', '/brand-strategy', '/dashboard/planning', '/workflows', '/dashboard/voice-content']);
  const { browser, ctx, page } = await launch();
  await signUpAndAddKey(page, 'mal');
  const task = '**/api/ai/task';

  await section('planning', async () => {
    for (const [name, b] of Object.entries(BAD)) {
      await page.route(task, (r) => (r.request().method() === 'POST' ? fulfill(b)(r) : r.continue()));
      await page.goto(base + '/dashboard/planning', { waitUntil: 'networkidle', timeout: 120000 });
      await page.fill('#plan-desc', 'Acme Coffee');
      await page.getByRole('button', { name: 'Generate plan' }).click();
      await page.waitForSelector('[data-testid=error-state]', { timeout: 30000 });
      ok(`/dashboard/planning (${name}): "unreadable response" + Try Again, no plan`, (await page.getAttribute('[data-testid=error-state]', 'data-error-kind')) === 'unreadable' && /Try Again/.test(await page.innerText('[data-testid=error-state]')) && (await page.getByRole('tab', { name: 'Budget' }).count()) === 0);
      await noCrash(page, `/dashboard/planning (${name})`);
      await page.unroute(task);
    }
  });

  await section('analysis', async () => {
    for (const path of ['/dashboard/brand-analysis', '/brand-strategy']) {
      for (const [name, b] of Object.entries(BAD)) {
        await page.route(task, (r) => (r.request().method() === 'POST' ? fulfill(b)(r) : r.continue()));
        await page.route('**/functions/v1/**', (r) => r.abort('failed'));
        await page.goto(base + path, { waitUntil: 'networkidle', timeout: 120000 });
        if (path === '/brand-strategy') { await page.fill('input[type=url][placeholder="Business Website URL"]', 'https://acme-coffee.example'); await page.click('button:has-text("Analyze Brand Strategy")'); }
        else { await page.fill('input[aria-label="Business description or website"]', 'Acme'); await page.click('main button:has-text("Analyze"), button[type=submit]:has-text("Analyze")'); }
        await page.waitForSelector('[data-testid=error-state]', { timeout: 30000 });
        ok(`${path} (${name}): says "unreadable response" (not "Connection problem"), with Try Again`, (await page.getAttribute('[data-testid=error-state]', 'data-error-kind')) === 'unreadable');
        await noCrash(page, `${path} (${name})`);
        await page.unroute(task); await page.unroute('**/functions/v1/**');
      }
    }
    // a well-formed but sparse analysis (bestPractices:{}, no scores): the results render, missing values say "Not measured", nothing crashes
    const sparse = { data: { brandFactors: [{ name: 'Brand Purpose', insights: [], priority: 'high', trend: 'stable' }], bestPractices: {}, performanceMetrics: {}, implementationStatus: {}, marketAnalysis: {}, growthTrajectory: {} }, citations: [] };
    await page.route(task, (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sparse) }) : r.continue()));
    await page.route('**/functions/v1/**', (r) => r.abort('failed'));
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme');
    await page.click('main button:has-text("Analyze"), button[type=submit]:has-text("Analyze")');
    await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 30000 });
    for (const tabName of [/Best Practices/, /Overview/, /Market/]) { const tab = page.getByRole('tab', { name: tabName }); if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(300); } }
    ok('sparse analysis: no error boundary, no white screen', (await page.locator('[data-testid=error-boundary]').count()) === 0 && !/Application error/.test(await page.innerText('body')));
    await noCrash(page, 'sparse analysis');
    ok('sparse analysis: missing scores read "Not measured", never 0%', /Not measured/.test(await page.innerText('body')) && !/\b0%/.test(await page.innerText('[data-testid=pillar-breakdown]')));
    await page.unroute(task); await page.unroute('**/functions/v1/**');
  });

  await section('workflows', async () => {
    for (const [name, b] of Object.entries(BAD)) {
      await page.route(task, (r) => (r.request().method() === 'POST' ? fulfill(b)(r) : r.continue()));
      await page.goto(base + '/workflows', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForSelector('.react-flow__node');
      await page.getByRole('button', { name: 'Run workflow' }).click();
      await page.waitForSelector('[data-testid=workflow-error]', { timeout: 30000 });
      ok(`/workflows (${name}): unreadable-response message with Try Again, no "undefined undefined", no audio player`, /unreadable/i.test(await page.innerText('[data-testid=workflow-error]')) && /Try Again/.test(await page.innerText('[data-testid=workflow-error]')) && (await page.locator('audio').count()) === 0);
      await noCrash(page, `/workflows (${name})`);
      await page.unroute(task);
    }
  });

  await section('settings', async () => {
    for (const [name, b] of [...Object.entries(BAD), ['503 text', { status: 503, body: 'down', contentType: 'text/plain' }]]) {
      await page.route('**/api/settings/profile', (r) => (r.request().method() === 'GET' ? fulfill(b)(r) : r.continue()));
      await page.goto(base + '/settings', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForSelector('[data-testid=settings-load-error]', { timeout: 30000 });
      const t = await page.innerText('[data-testid=settings-load-error]');
      ok(`/settings profile (${name}): friendly message + Try Again (no raw text like "down"/"Failed to fetch")`, /Try Again/.test(t) && !/^down\b|Failed to fetch|Unexpected/.test(t), t.replace(/\s+/g, ' '));
      await noCrash(page, `/settings (${name})`);
      await page.unroute('**/api/settings/profile');
    }
    await page.route('**/api/settings/openai-key', (r) => (r.request().method() === 'GET' ? r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }) : r.continue()));
    await page.goto(base + '/settings', { waitUntil: 'networkidle', timeout: 120000 });
    await noCrash(page, '/settings (openai-key {})');
    await page.unroute('**/api/settings/openai-key');
  });

  await section('public-pages', async () => {
    await page.route('**/api/blog', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"posts":[{"slug":1}]}' }));
    await page.goto(base + '/blogs', { waitUntil: 'networkidle' });
    await noCrash(page, '/blogs (garbage posts)');
    await page.unroute('**/api/blog');
    await page.route('**/api/case-studies', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"x":1}' }));
    await page.goto(base + '/case-studies', { waitUntil: 'networkidle' });
    await noCrash(page, '/case-studies (garbage)');
    await page.unroute('**/api/case-studies');
    await page.route('**/api/usage', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.goto(base + '/analytics', { waitUntil: 'networkidle' });
    await noCrash(page, '/analytics (usage {})');
    await page.unroute('**/api/usage');
  });

  await section('voice', async () => {
    for (const [name, b] of [['html 200', { status: 200, contentType: 'text/html', body: '<html>oops</html>' }], ['json 200', { status: 200, contentType: 'application/json', body: '{}' }], ['tiny audio', { status: 200, contentType: 'audio/wav', body: 'abc' }]]) {
      await page.route('**/api/voice/podcast', fulfill(b));
      await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle', timeout: 120000 });
      await page.getByRole('tab', { name: 'Podcast' }).click();
      await page.waitForSelector('input[placeholder="Enter podcast title"]', { timeout: 60000 });
      await page.fill('input[placeholder="Enter podcast title"]', 'Ep1');
      await page.locator('textarea[placeholder="Enter segment script"]').first().fill('Welcome.');
      await page.getByRole('button', { name: 'Generate Podcast' }).click();
      await page.waitForSelector('[data-testid=voice-error]', { timeout: 30000 });
      ok(`voice podcast (${name}): error shown, no audio player, nothing saved`, (await page.locator('audio').count()) === 0 && (await page.locator('[data-testid=save-status]').count()) === 0);
      await page.unroute('**/api/voice/podcast');
    }
  });

  ok('malformed: context still alive', true);
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll malformed-response checks passed');
  process.exit(failed ? 1 : 0);
})();
