// Playwright BYOK flow against mock Supabase (5998) + mock OpenAI (5999) + next dev (5240).
// Run via scratchpad run-verify.sh; requires `playwright` resolvable.
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:5240';
const SB = process.env.SB || 'http://127.0.0.1:5998';
let failed = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n} ${x}`); if (!c) failed++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
  const page = await ctx.newPage();
  const urls = [];
  page.on('request', (r) => urls.push(r.url()));
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  // signed-in session for the mock user "alice" (the mock Supabase accepts tok-alice)
  // the AuthProvider keeps the session in a cookie (auth-helpers); seed it for the mock user "alice"
  await ctx.addInitScript(() => {
    const S = { access_token: 'tok-alice', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: '11111111-1111-4111-8111-111111111111', email: 'alice@example.test', aud: 'authenticated', role: 'authenticated' } };
    document.cookie = 'sb-127-auth-token=' + encodeURIComponent(JSON.stringify(S)) + '; path=/';
  });

  // 1. No key yet: an AI call surfaces 412 and the "Add your OpenAI key" notice linking to Settings
  // warm the dev server so the first compile finishes before the real run
  await fetch(base + '/settings').then((r) => r.text()).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  await page.goto(base + '/settings#ai', { waitUntil: 'networkidle', timeout: 120000 });
  if (!(await page.$('[data-testid=key-status]'))) await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=key-status]', { timeout: 90000 });
  ok('settings: shows "No key added yet"', /No key added yet/.test(await page.innerText('[data-testid=key-status]')));
  const gate = page.waitForResponse((r) => r.url().includes('/api/settings/openai-key'));
  await page.evaluate(() => window.dispatchEvent(new Event('openai-key-required')));
  await page.waitForSelector('[data-testid=openai-key-notice]');
  ok('notice: "Add your OpenAI key" with link to Settings', (await page.innerText('[data-testid=openai-key-notice]')).includes('Add your OpenAI key') && !!(await page.$('[data-testid=openai-key-notice] a[href="/settings#ai"]')));
  await page.click('[data-testid=openai-key-notice] button[aria-label=Dismiss]');

  // 2. Invalid key is rejected with a clear error and nothing is stored
  await page.fill('#openai-key', 'sk-bad-0123456789abcdefghij');
  await page.click('button:has-text("Validate & save")');
  await page.waitForSelector('[data-testid=key-message][role=alert]');
  ok('invalid key: friendly error', /invalid|rejected|not accepted|incorrect/i.test(await page.innerText('[data-testid=key-message]')), await page.innerText('[data-testid=key-message]'));
  ok('invalid key: still "No key added yet"', /No key added yet/.test(await page.innerText('[data-testid=key-status]')));

  // 3. Valid key: saved, masked to last 4, input cleared
  const KEY = 'sk-test-ABCDEFGH1234';
  await page.fill('#openai-key', KEY);
  await page.click('button:has-text("Validate & save")');
  await page.waitForSelector('[data-testid=key-masked]');
  const masked = await page.innerText('[data-testid=key-masked]');
  ok('valid key: masked display shows last 4 only', masked.endsWith('1234') && !masked.includes('ABCDEFGH'), masked);
  ok('valid key: input cleared', (await page.inputValue('#openai-key')) === '');
  ok('valid key: key not in page text', !(await page.content()).includes('ABCDEFGH'));

  // 4. Test key
  await page.click('button:has-text("Test key")');
  await page.waitForSelector('[data-testid=model-access]', { timeout: 20000 });
  ok('test key: per-model access list shown', (await page.locator('[data-testid=model-access] li').count()) > 0);

  // 5. Replace
  await page.fill('#openai-key', 'sk-test-ZZZZZZZZ9999');
  await page.click('button:has-text("Validate & save")');
  await page.waitForFunction(() => document.querySelector('[data-testid=key-masked]')?.textContent?.endsWith('9999'));
  ok('replace key: new last 4 shown', true);

  // 6. Key never in storage or URLs
  const storage = await page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage } }));
  ok('no key in localStorage/sessionStorage', !/sk-test|ZZZZZZZZ|ABCDEFGH/.test(storage));
  ok('no key in any request URL', !urls.some((u) => /sk-test|ZZZZZZZZ|ABCDEFGH/.test(u)));

  // 7. Remove
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Remove key")');
  await page.waitForFunction(() => /No key added yet/.test(document.querySelector('[data-testid=key-status]')?.textContent || ''));
  ok('remove key: back to "No key added yet"', true);

  // 8. A real AI call with no key -> 412 -> notice appears via authFetch
  const r = await page.evaluate(async () => {
    const res = await fetch('/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-alice' }, body: JSON.stringify({ task: 'x', input: 'y' }) });
    return { status: res.status, body: await res.json() };
  });
  ok('API without a key: 412 OPENAI_KEY_REQUIRED', r.status === 412 && r.body.code === 'OPENAI_KEY_REQUIRED', JSON.stringify(r));

  // 9. A real feature call through authFetch with no key shows the "Add your OpenAI key" state
  await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('[data-testid=openai-key-notice]', { timeout: 30000 }).then(() => ok('feature call without key -> "Add your OpenAI key" notice', true)).catch(() => ok('feature call without key -> "Add your OpenAI key" notice', false));

  // 10. With a key saved, the same feature works for this user
  await page.goto(base + '/settings#ai', { waitUntil: 'networkidle' });
  await page.fill('#openai-key', 'sk-test-ABCDEFGH1234');
  await page.click('button:has-text("Validate & save")');
  await page.waitForSelector('[data-testid=key-masked]');
  await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle' });
  await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 60000 }).then(() => ok('feature works with the saved key (pillar breakdown rendered)', true)).catch(() => ok('feature works with the saved key (pillar breakdown rendered)', false));

  await page.screenshot({ path: 'e2e-byok-settings.png' });
  ok('no uncaught page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(failed ? `\n${failed} FAILED` : '\nAll BYOK browser checks passed');
  process.exit(failed ? 1 : 0);
})();
