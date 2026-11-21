// Playwright sign-in / sign-up / reset-password flows against the MOCK Supabase auth endpoints (5998) + mock OpenAI (5999) + next dev (5240).
// Run with fresh mocks: npm run e2e:auth
const { chromium } = require('playwright');
const { base, SB, PW } = require('./lib');
let failed = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n} ${x}`); if (!c) failed++; };

(async () => {
  const b = await chromium.launch();
  const logs = [];
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
    const page = await ctx.newPage();
    page.on('console', (m) => logs.push(m.text()));
    page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
    return page;
  };
  const warm = async () => { await fetch(base + '/login').then((r) => r.text()).catch(() => {}); await fetch(base + '/settings').then((r) => r.text()).catch(() => {}); await fetch(base + '/sign-up').then((r) => r.text()).catch(() => {}); await new Promise((r) => setTimeout(r, 2500)); };
  await warm();
  const signIn = async (page, email, password, next) => {
    await page.goto(base + '/login' + (next ? '?next=' + encodeURIComponent(next) : ''), { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type=submit]');
  };

  // 1. nav "Sign In" goes to /login
  let page = await fresh();
  await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await page.click('header >> text=Sign In, nav >> text=Sign In').catch(async () => { await page.click('text=Sign In >> nth=0'); });
  await page.waitForURL('**/login', { timeout: 20000 });
  ok('nav Sign In -> /login', page.url().endsWith('/login'));

  // 2. wrong password -> clear error, stays on /login
  await page.fill('#email', 'alice@example.test');
  await page.fill('#password', 'wrong-password-123');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=auth-error]');
  ok('wrong password: friendly error', /do not match/i.test(await page.innerText('[data-testid=auth-error]')));
  ok('wrong password: stays on /login', page.url().includes('/login'));

  // 3. first login (alice, no key yet): original page remembered, "Add your OpenAI key" step, then back to the original page
  await signIn(page, 'alice@example.test', PW, '/dashboard/planning');
  await page.waitForURL('**/settings**', { timeout: 30000 });
  await page.waitForSelector('[data-testid=welcome-key-prompt]');
  const u = new URL(page.url());
  ok('first login -> key prompt on Settings with next preserved', u.searchParams.get('welcome') === '1' && u.searchParams.get('next') === '/dashboard/planning');
  ok('welcome prompt says to add the OpenAI key', /Add your OpenAI key/i.test(await page.innerText('[data-testid=welcome-key-prompt]')));
  await page.fill('#openai-key', 'sk-test-ALICE000000000001111');
  await page.click('button:has-text("Validate & save")');
  await page.waitForSelector('[data-testid=key-masked]', { timeout: 15000 }).catch(async () => { console.log('DEBUG message:', await page.innerText('[data-testid=key-message]').catch(() => '(none)')); });
  ok('key saved from the welcome step (masked last 4)', (await page.innerText('[data-testid=key-masked]')).endsWith('1111'));
  ok('Skip becomes Continue once a key exists', (await page.innerText('[data-testid=welcome-continue]')) === 'Continue');
  await page.click('[data-testid=welcome-continue]');
  await page.waitForURL('**/dashboard/planning', { timeout: 30000 });
  ok('Continue returns to the originally requested page', page.url().endsWith('/dashboard/planning'));

  // 4. nav shows Sign Out when signed in; signing out works
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Sign Out');
  ok('nav shows Sign Out when signed in', true);
  await page.click('text=Sign Out >> nth=0');
  await page.waitForSelector('text=Sign In');
  ok('after Sign Out the nav shows Sign In again', true);
  await page.context().close();

  // 5. returning user with a key goes straight to the requested page; hostile next= is ignored
  page = await fresh();
  await signIn(page, 'alice@example.test', PW, '/dashboard/planning');
  await page.waitForURL('**/dashboard/planning', { timeout: 30000 });
  ok('user with a key: straight to the requested page', page.url().endsWith('/dashboard/planning'));
  await page.context().close();
  page = await fresh();
  await signIn(page, 'alice@example.test', PW, '//evil.example/steal');
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 });
  ok('open redirect (//evil.example) ignored', new URL(page.url()).host === new URL(base).host && new URL(page.url()).pathname === '/dashboard', page.url());
  await page.context().close();

  // 6. signed-out feature use -> "Sign in" notice linking to /login with next
  page = await fresh();
  await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee');
  await page.click('button:has-text("Analyze")');
  await page.waitForSelector('[data-testid=openai-key-notice]', { timeout: 30000 });
  const href = await page.getAttribute('[data-testid=openai-key-notice] a', 'href');
  ok('signed out: notice asks to sign in and links to /login with the current page', /Sign in/.test(await page.innerText('[data-testid=openai-key-notice]')) && href === '/login?next=%2Fdashboard%2Fbrand-analysis', String(href));
  await page.context().close();

  // 7. sign-up validation (min 12 chars), duplicate account, success without confirmation -> key step
  page = await fresh();
  await page.goto(base + '/sign-up', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('#email', 'new1@example.test');
  await page.fill('#password', 'short-pw');
  await page.fill('#confirm', 'short-pw');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=auth-error]');
  ok('sign-up: password under 12 characters rejected', /at least 12/.test(await page.innerText('[data-testid=auth-error]')));
  await page.fill('#password', 'long-enough-password');
  await page.fill('#confirm', 'different-password-1');
  await page.click('button[type=submit]');
  ok('sign-up: mismatched confirmation rejected', /do not match/.test(await page.innerText('[data-testid=auth-error]')));
  await page.fill('#email', 'alice@example.test');
  await page.fill('#confirm', 'long-enough-password');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => /already exists/.test(document.querySelector('[data-testid=auth-error]')?.textContent || ''));
  ok('sign-up: existing email gives a friendly message', true);
  await page.fill('#email', 'new1@example.test');
  await page.click('button[type=submit]');
  await page.waitForURL('**/settings**', { timeout: 30000 });
  await page.waitForSelector('[data-testid=welcome-key-prompt]');
  ok('sign-up (no email confirmation): lands on the "Add your OpenAI key" step', true);
  await page.context().close();

  // 8. sign-up with email confirmation required
  await fetch(SB + '/__config', { method: 'POST', body: JSON.stringify({ confirm: true }) });
  page = await fresh();
  await page.goto(base + '/sign-up', { waitUntil: 'networkidle' });
  await page.fill('#email', 'new2@example.test');
  await page.fill('#password', 'long-enough-password');
  await page.fill('#confirm', 'long-enough-password');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=confirm-sent]');
  ok('sign-up with confirmation: "Check your email" shown', /new2@example.test/.test(await page.innerText('[data-testid=confirm-sent]')));
  await fetch(SB + '/__config', { method: 'POST', body: JSON.stringify({ confirm: false }) });
  await page.context().close();

  // 9. password reset request
  page = await fresh();
  await page.goto(base + '/login', { waitUntil: 'networkidle' });
  await page.click('text=Forgot password?');
  await page.waitForURL('**/reset-password');
  await page.fill('#email', 'alice@example.test');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=reset-sent]');
  const rec = await (await fetch(SB + '/__recoveries')).json();
  ok('reset password: request sent with redirect to /reset-password/update', rec.some((r) => r.email === 'alice@example.test' && String(r.redirect).endsWith('/reset-password/update')), JSON.stringify(rec));
  await page.goto(base + '/reset-password/update', { waitUntil: 'networkidle' });
  ok('reset update page without a recovery session says the link expired', /expired/i.test(await page.innerText('body')));
  await page.context().close();

  // 10. no tokens or session objects in the browser console
  ok('console never prints tokens / sessions', !logs.some((l) => /eyJ[A-Za-z0-9_-]{5,}|access_token|refresh_token|tok-alice/.test(l)), logs.filter((l) => /eyJ|access_token|refresh_token/.test(l)).slice(0, 2).join(' | '));
  ok('no uncaught page errors', !logs.some((l) => l.startsWith('PAGEERROR')), logs.filter((l) => l.startsWith('PAGEERROR')).slice(0, 2).join(' | '));

  await b.close();
  console.log(failed ? `\n${failed} FAILED` : '\nAll sign-in browser checks passed');
  process.exit(failed ? 1 : 0);
})();
