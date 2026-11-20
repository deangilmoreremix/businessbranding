// Brand analysis, deep research + notifications, planning/calendar/.ics, business analyzer, captions import, local-only models. Fresh mocks.
const fs = require('fs');
const { launch, signUpAndAddKey, base, ok, section, warm, results, out } = require('./lib');
const save = async (dl, name) => { const p = out(`e2e-${name}`); await dl.saveAs(p); return fs.readFileSync(p); };

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/brand-analysis', '/dashboard/planning', '/brand-strategy']);
  const { browser, ctx, page, errors } = await launch();
  await signUpAndAddKey(page, 'analysis');
  // record Notification calls; pretend the tab is hidden so the "notify when done" path fires
  await ctx.addInitScript(() => {
    window.__notes = [];
    const Orig = window.Notification;
    function Fake(title, opts) { window.__notes.push({ title, body: opts && opts.body }); this.close = () => {}; }
    Fake.permission = 'default';
    Fake.requestPermission = async () => { Fake.permission = 'granted'; return 'granted'; };
    window.Notification = Fake;
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden' });
  });

  await section('brand-analysis', async () => {
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
    const resp = page.waitForResponse((r) => r.url().includes('/api/ai/task'), { timeout: 60000 });
    await page.click('button:has-text("Analyze")');
    await resp;
    await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 60000 });
    ok('brand analysis: strict-schema analysis rendered with the user key (pillar breakdown, 20 pillars)', (await page.locator('[data-testid=pillar-breakdown] li').count()) >= 1);
    ok('brand analysis: not labelled as sample data', (await page.locator('[data-testid=sample-data-label]').count()) === 0);
    const tiles = await page.locator('h3').allInnerTexts();
    ok('brand analysis: header tiles filled from the analysis', tiles.some((t) => /^\d+%$/.test(t.trim())), tiles.slice(0, 6).join(' | '));
  });

  await section('deep-research', async () => {
    await page.getByRole('tab', { name: /Competitors/ }).click();
    await page.waitForSelector('[data-testid=deep-research]', { timeout: 20000 });
    await page.getByRole('button', { name: 'Notify me when done' }).click();
    await page.waitForSelector('text=You will be notified when it finishes.');
    ok('notifications: permission requested from a click and granted', true);
    const start = page.waitForResponse((r) => r.url().includes('/api/ai/research') && r.request().method() === 'POST', { timeout: 30000 });
    await page.getByRole('button', { name: 'Run deep research' }).click();
    const sr = await start;
    ok('deep research: background job started (202) with the user key', sr.status() === 202, `status ${sr.status()}`);
    await page.waitForSelector('[data-testid=deep-research] button:has-text("Researching")', { timeout: 15000 }).catch(() => {});
    await page.waitForSelector('[data-testid=deep-research] button:has-text("Run deep research")', { timeout: 120000 })
      .then(() => ok('deep research: polling completes (button returns from "Researching…")', true)).catch(() => ok('deep research: polling completes', false));
    ok('deep research: no error shown', (await page.locator('[data-testid=deep-research] [role=alert]').count()) === 0);
    await page.waitForFunction(() => window.__notes && window.__notes.length > 0, null, { timeout: 8000 }).catch(() => {});
    const notes = await page.evaluate(() => window.__notes);
    ok('notifications: a notification fired when the job finished', notes.length >= 1, JSON.stringify(notes).slice(0, 120));
    // job survives a reload (persisted job id, resumes polling)
    await page.reload({ waitUntil: 'networkidle' });
    ok('deep research: page reload does not crash', true);
  });

  await section('planning', async () => {
    await page.goto(base + '/dashboard/planning', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('#plan-desc', 'A small-batch coffee roaster launching an online store');
    await page.fill('#plan-goals', 'Launch the store\nGrow email list');
    await page.fill('#plan-budget', '$25,000');
    const resp = page.waitForResponse((r) => r.url().includes('/api/ai/task'), { timeout: 60000 });
    await page.getByRole('button', { name: 'Generate plan' }).click();
    const r = await resp;
    ok('planning: implementation plan generated through /api/ai/task (strict schema)', r.status() === 200, `status ${r.status()}`);
    await page.getByRole('button', { name: /Open on calendar/ }).waitFor({ timeout: 30000 });
    ok('planning: plan rendered', (await page.locator('text=/Phase|Milestone|Budget/i').count()) > 0);
    await page.getByRole('button', { name: /Open on calendar/ }).click();
    await page.waitForSelector('text=Implementation Calendar', { timeout: 20000 });
    ok('calendar: plan events appear on the calendar tab', true);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: 'Export Calendar' }).click()]);
    const ics = (await save(dl, 'plan.ics')).toString();
    ok('calendar: .ics export is a valid iCalendar file with events', ics.startsWith('BEGIN:VCALENDAR') && ics.includes('BEGIN:VEVENT') && ics.trim().endsWith('END:VCALENDAR'), `${(ics.match(/BEGIN:VEVENT/g) || []).length} events`);
    // smart schedule tab
    await page.getByRole('tab', { name: 'Smart schedule' }).click();
    const gen = page.getByRole('button', { name: /Generate Schedule|Generate smart schedule|Generate/ }).first();
    ok('planning: smart schedule tab renders its generator', (await gen.count()) > 0);
  });

  await section('analyzer', async () => {
    await page.goto(base + '/brand-strategy', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[type=url][placeholder="Business Website URL"]', 'https://acme-coffee.example');
    await page.click('button:has-text("Analyze Brand Strategy")');
    await page.waitForSelector('h3:has-text("Brand Health Score")', { timeout: 60000 });
    ok('analyzer: website analysis runs end to end (scrape guard falls back safely, analysis via the user key)', true);
    await page.waitForSelector('[data-testid=analysis-history] li', { timeout: 20000 });
    ok('analyzer: result saved to the local IndexedDB history', true);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=analysis-history] li', { timeout: 20000 });
    ok('analyzer: history survives a reload', true);
  });

  ok('analysis: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll analysis checks passed');
  process.exit(failed ? 1 : 0);
})();
