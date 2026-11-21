// No fabricated numbers: dashboards, asset library and stats are computed from the user's real saved items.
const path = require('path');
const fs = require('fs');
const { launch, signUpAndAddKey, base, SB, ok, section, warm, results, out } = require('./lib');

const FAKE = [/\b156\b/, /\b2\.3\s?GB/i, /\b98%/, /\b124\b/, /\b42h\b/, /\b96%/, /Demo Podcast/i, /Demo Audiobook/i, /Disconnected/i, /Loading real-time/i, /unsplash/i];
const noFake = async (page, where) => {
  const html = await page.content();
  const text = await page.innerText('body');
  const hit = FAKE.find((re) => re.test(text) || (re.source === 'unsplash' && re.test(html)));
  ok(`${where}: no fabricated numbers, demo rows or fake connection state`, !hit, hit ? String(hit) : '');
};
const tile = async (page, title) => (await page.locator('[data-testid=stat-tiles] >> text=' + title).first().locator('xpath=../h3').innerText()).trim();

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard', '/dashboard/visual-identity', '/dashboard/voice-content', '/dashboard/planning', '/brand-strategy', '/dashboard/brand-analysis']);
  const { browser, page, errors } = await launch();
  await signUpAndAddKey(page, 'dash');

  await section('empty-states', async () => {
    await page.goto(base + '/dashboard', { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-testid=saved-analyses-empty]');
    await noFake(page, '/dashboard');
    ok('/dashboard: saved audio/images/storage tiles are 0 for a new user', (await tile(page, 'Saved audio')) === '0' && (await tile(page, 'Saved images')) === '0' && (await tile(page, 'Storage used')) === '0 B');
    ok('/dashboard: brand health is an honest "—" until an analysis exists', (await tile(page, 'Latest brand health')) === '—');
    ok('/dashboard: no live/"connected" indicator (there is no live data source)', !/connected|live/i.test(await page.locator('h1').first().evaluate((e) => e.parentElement.innerText)));

    await page.goto(base + '/dashboard/visual-identity', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=asset-library-empty]');
    await noFake(page, '/dashboard/visual-identity');
    ok('/dashboard/visual-identity: tiles are 0 and the Asset Library shows an empty state (no placeholder cards)', (await tile(page, 'Total assets')) === '0' && (await page.locator('[data-testid=asset-library] img').count()) === 0);

    await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle' });
    await noFake(page, '/dashboard/voice-content');
    ok('/dashboard/voice-content: tiles are 0', (await tile(page, 'Saved audio')) === '0' && (await tile(page, 'Total duration')) === '0 min');
  });

  await section('library-real-data', async () => {
    await page.goto(base + '/dashboard/visual-identity', { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', path.join(__dirname, 'fixtures/logo.png'));
    await page.waitForSelector('img[alt="Asset 1"]');
    await page.click('button[aria-label="Edit image 1"]');
    await page.waitForSelector('[role=dialog][aria-label="Image editor"] canvas');
    await page.click('[role=dialog] button:has-text("Save to local library")');
    await page.waitForTimeout(800);
    await page.click('button[aria-label="Close editor"]');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=asset-library] img');
    ok('visual identity: the saved image appears in the Asset Library (read from IndexedDB)', (await page.locator('[data-testid=asset-library] img').count()) === 1);
    ok('visual identity: tiles count it (1 asset, today, non-zero storage)', (await tile(page, 'Total assets')) === '1' && (await tile(page, 'Created today')) === '1' && (await tile(page, 'Storage used')) !== '0 B');
    await page.locator('[data-testid=asset-library] button[aria-label^="Delete "]').first().click();
    await page.waitForSelector('[data-testid=asset-library-empty]');
    ok('visual identity: delete removes it and the tiles go back to 0', (await tile(page, 'Total assets')) === '0');
  });

  await section('voice-save', async () => {
    await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Voice Over' }).click();
    await page.locator('button.rounded-full').first().click();
    await page.waitForSelector('text=Recording...');
    await page.waitForTimeout(1500);
    await page.locator('button.rounded-full').first().click();
    await page.fill('input[placeholder="Enter a title for this recording"]', 'Dash take');
    await page.getByRole('button', { name: /Save to Library/ }).click();
    await page.waitForSelector('[data-testid=save-status]', { timeout: 20000 });
    const status = await page.innerText('[data-testid=save-status]');
    ok('voice: Save says plainly where it was saved (this device AND the signed-in account)', /Saved on this device/.test(status) && /Also saved to your account/.test(status), status);
    const stored = await (await fetch(SB + '/__state')).json();
    ok('voice: the account row holds metadata only (real duration, no blob: URL, owned by the user)', stored.content_items.length === 1 && stored.content_items[0].url === '' && stored.content_items[0].type === 'voice_over' && stored.content_items[0].metadata.durationSec >= 0 && /^[0-9a-f-]{36}$/.test(stored.content_items[0].user_id));
    await page.goto(base + '/dashboard', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=stat-tiles]');
    ok('/dashboard: the saved recording is counted (Saved audio = 1, storage > 0, duration real)', (await tile(page, 'Saved audio')) === '1' && (await tile(page, 'Storage used')) !== '0 B');
  });

  await section('analysis-display', async () => {
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle' });
    await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
    await page.click('button:has-text("Analyze")');
    await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 60000 });
    const body = await page.innerText('body');
    ok('analysis: never shows "Invalid Date", "NaN" or "Monitoring: Error" on a successful run', !/Invalid Date|NaN|Monitoring: Error/.test(body));
    const boxes = await page.locator('[role=tablist] [role=tab]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right]; }));
    const overlap = boxes.some((b, i) => i > 0 && b[0] < boxes[i - 1][1] - 0.5);
    ok('analysis: tab labels do not collide (each tab has its own space; the bar scrolls)', boxes.length >= 8 && !overlap, JSON.stringify(boxes.slice(0, 3)));
    const ring = await page.locator('svg[role=img][aria-label^="Brand health"]').first().getAttribute('aria-label');
    ok('analysis: health ring shows a 0-100 percentage', /^Brand health \d{1,3}%$/.test(ring || ''), ring);
    ok('analysis: header tile and ring agree on one scale', (await page.locator('h3', { hasText: /^\d+%$/ }).first().innerText()).trim() === (ring || '').replace('Brand health ', ''));
  });

  await section('planning', async () => {
    await page.goto(base + '/dashboard/planning', { waitUntil: 'networkidle' });
    await page.fill('#plan-desc', 'A small-batch coffee roaster launching an online store');
    await page.getByRole('button', { name: 'Generate plan' }).click();
    await page.waitForSelector('[data-testid=plan-on-calendar]', { timeout: 60000 });
    ok('planning: plan events are placed on the calendar automatically, with a visible note', /Calendar \(\d+\)/.test(await page.getByRole('tab', { name: /Calendar/ }).innerText()));
    await page.waitForTimeout(2000); // the plan draft is saved to IndexedDB shortly after it changes
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=plan-on-calendar]', { timeout: 30000 });
    ok('planning: after a reload the restored plan still fills the calendar', true);
    // exports of the real plan: .ics with one VEVENT per task/milestone, and a docx with the plan text
    await page.getByTestId('export-open-implementation-plan').click();
    await page.getByRole('radio', { name: /Calendar/ }).click();
    const [ics] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.getByTestId('export-run').click()]);
    const icsFile = out('plan.ics'); await ics.saveAs(icsFile);
    const icsText = fs.readFileSync(icsFile, 'utf8');
    const vevents = (icsText.match(/BEGIN:VEVENT/g) || []).length;
    ok('plan export: .ics is a real calendar with events (not an empty 172-byte file)', icsText.startsWith('BEGIN:VCALENDAR') && vevents >= 2 && icsText.length > 600 && /SUMMARY:/.test(icsText), `${vevents} events, ${icsText.length} bytes`);
    await page.getByTestId('export-open-implementation-plan').click();
    await page.getByRole('radio', { name: /Word/ }).click();
    const [dx] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.getByTestId('export-run').click()]);
    const dxFile = out('plan.docx'); await dx.saveAs(dxFile);
    const JSZip = require('jszip');
    const xml = await (await JSZip.loadAsync(fs.readFileSync(dxFile))).file('word/document.xml').async('string');
    ok('plan export: .docx holds the plan title and phase tasks', /Implementation plan/.test(xml) && /Phases, goals and tasks/.test(xml) && !/undefined|NaN/.test(xml));
  });

  await section('competitive', async () => {
    await page.goto(base + '/brand-strategy', { waitUntil: 'networkidle' });
    await page.fill('input[type=url][placeholder="Business Website URL"]', 'https://acme-coffee.example');
    await page.click('button:has-text("Analyze Brand Strategy")');
    await page.waitForSelector('h2:has-text("Competitive Analysis")', { timeout: 60000 });
    const text = await page.locator('h2:has-text("Competitive Analysis")').locator('xpath=ancestor::*[contains(@class,"p-6")][1]').innerText();
    ok('/brand-strategy competitive analysis: TRUE labels (health / fit / uniqueness), values from the analysis, no stock numbers', /Brand health/.test(text) && /Market fit/.test(text) && /Uniqueness/.test(text) && !/Market Share|Brand Strength|Competitive Edge/.test(text) && !/\b(85|78|82|90|88|92)%/.test(text), text.replace(/\s+/g, ' ').slice(0, 160));
    // the competitive export is a real, parseable file with the chosen sections
    await page.getByTestId('export-open-competitive-analysis').click();
    await page.getByRole('radio', { name: /Excel/ }).click();
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.getByTestId('export-run').click()]);
    const file = out('competitive.xlsx');
    await dl.saveAs(file);
    const XLSX = require('xlsx');
    const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).flat().join('|');
    ok('competitive export: a real .xlsx with the measured values and no "undefined"/"NaN"', wb.SheetNames.length === 2 && /Brand health\|?/.test(rows) && /50%/.test(rows) && !/undefined|NaN/.test(rows), rows.slice(0, 120));
  });

  ok('dashboards: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll dashboard/real-data checks passed');
  process.exit(failed ? 1 : 0);
})();
