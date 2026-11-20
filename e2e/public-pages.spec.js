// Public/marketing surfaces tell the truth: honest empty states, real data when it exists, no invented socials/stats,
// working newsletter + contact storage, and report exports that are real files.
const fs = require('node:fs');
const { launch, signUpAndAddKey, base, SB, ok, section, warm, results, out } = require('./lib');

const state = () => fetch(SB + '/__state').then((r) => r.json());
const seed = (table, row) => fetch(`${SB}/rest/v1/${table}`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: 'service-role-test-key', authorization: 'Bearer service-role-test-key' }, body: JSON.stringify(row) });
const FAKE = [/Sarah Chen/, /John Smith/, /Alex Johnson/, /Michael Chen/, /David Anderson/, /Founded in 2023/, /\b10,000\+/, /\bthousands of\b/i, /\+45%/, /98%/, /\$150\/mo/, /125\.8K/, /Start Free Trial/i, /Join Discord/i, /Partner Program/i];

(async () => {
  await warm(['/', '/blogs', '/case-studies', '/analytics', '/integrations', '/pricing', '/about', '/features', '/agency', '/contact']);
  const { browser, page, errors } = await launch();
  const text = async (p) => { await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 }); return page.innerText('body'); };

  await section('no-fabricated-copy', async () => {
    for (const p of ['/', '/about', '/blogs', '/case-studies', '/pricing', '/features', '/integrations', '/agency', '/analytics', '/contact', '/docs']) {
      const t = await text(p);
      const hit = FAKE.find((re) => re.test(t));
      ok(`${p} (signed out): no invented names, stats, trials or partner programs`, !hit, hit ? String(hit) : '');
    }
  });

  await section('empty-states', async () => {
    await text('/blogs');
    ok('/blogs: honest empty state when no post is published', (await page.locator('[data-testid=blog-empty]').count()) === 1 && (await page.locator('[data-testid=blog-list]').count()) === 0);
    await text('/case-studies');
    ok('/case-studies: honest empty state when no case study is published', (await page.locator('[data-testid=case-studies-empty]').count()) === 1);
    const api = await (await fetch(base + '/api/case-studies')).json();
    ok('GET /api/case-studies returns [] when nothing is published', JSON.stringify(api.caseStudies ?? api.items ?? api) === '[]' || (Array.isArray(api.caseStudies ?? api.items) && (api.caseStudies ?? api.items).length === 0), JSON.stringify(api).slice(0, 80));
  });

  await section('published-rows-appear', async () => {
    await seed('blog_posts', { slug: 'hello-world', title: 'A Real Post', excerpt: 'Written by the operator.', content: 'Body text of the post.', author_name: 'The Operator', category: 'Notes', published: true, published_at: '2026-01-02T00:00:00Z' });
    await seed('blog_posts', { slug: 'draft', title: 'Hidden Draft', excerpt: 'x', content: 'x', author_name: 'x', category: 'x', published: false });
    await seed('case_studies', { id: 'cs-1', title: 'Real Case Study', industry: 'Coffee', challenge: 'Needed a name.', solution: 'We named it.', published: true });
    await seed('case_studies', { id: 'cs-2', title: 'Unpublished Study', industry: 'x', challenge: 'x', solution: 'x', published: false });
    const t = await text('/blogs');
    ok('/blogs lists published posts only', /A Real Post/.test(t) && !/Hidden Draft/.test(t));
    const t2 = await text('/blogs/hello-world');
    ok('/blogs/[slug] shows the stored post', /A Real Post/.test(t2) && /Body text of the post/.test(t2));
    await page.goto(base + '/blogs/draft', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=blog-missing]', { timeout: 15000 });
    ok('/blogs/[slug] of an unpublished post says it does not exist', true);
    ok('GET /api/blog/draft is a 404', (await fetch(base + '/api/blog/draft')).status === 404);
    const t3 = await text('/case-studies');
    ok('/case-studies lists published studies only', /Real Case Study/.test(t3) && !/Unpublished Study/.test(t3));
  });

  await section('newsletter', async () => {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const footerForm = page.locator('footer form').first();
    await footerForm.locator('input[type=email]').fill('reader@example.test');
    await footerForm.locator('button[type=submit]').click();
    await page.waitForSelector('[data-testid=newsletter-saved]', { timeout: 20000 });
    const txt = await page.locator('[data-testid=newsletter-saved]').innerText();
    ok('footer newsletter: confirms the address was SAVED (not "subscribed"/"sent")', /saved/i.test(txt) && !/subscribed|you.ll receive|welcome email/i.test(txt), txt);
    ok('footer newsletter: the address is stored in newsletter_subscriptions', (await state()).newsletter_subscriptions?.some((r) => r.email === 'reader@example.test'));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.locator('footer form').first().locator('input[type=email]').fill('READER@example.test');
    await page.locator('footer form').first().locator('button[type=submit]').click();
    await page.waitForSelector('[data-testid=newsletter-saved]', { timeout: 20000 });
    ok('footer newsletter: a duplicate address is not stored twice', (await state()).newsletter_subscriptions.filter((r) => r.email.toLowerCase() === 'reader@example.test').length === 1);
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.locator('footer form').first().locator('input[type=email]').fill('not-an-email');
    await page.locator('footer form').first().locator('button[type=submit]').click();
    await page.waitForSelector('[data-testid=newsletter-error]', { timeout: 10000 });
    ok('footer newsletter: an invalid address shows an error', true);
  });

  await section('footer-social-and-buttons', async () => {
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const hrefs = await page.$$eval('footer a', (as) => as.map((a) => a.getAttribute('href') || ''));
    ok('footer: no invented social-media accounts (hidden unless configured via NEXT_PUBLIC_SOCIAL_*)', !hrefs.some((h) => /(twitter|linkedin|github|facebook|instagram)\.com/.test(h)), hrefs.filter((h) => /^https?:/.test(h)).join(', '));
    ok('footer: no dead "#" links', !hrefs.includes('#'));
    const deadButtons = await page.$$eval('footer button:not([type=submit])', (bs) => bs.map((b) => b.innerText.trim()));
    ok('footer: no action-less buttons', deadButtons.length === 0, deadButtons.join(', '));
  });

  await section('pricing-integrations-analytics', async () => {
    const pr = await text('/pricing');
    ok('/pricing: honest bring-your-own-key page with no prices or checkout', /own OpenAI/i.test(pr) && !/\$\d/.test(pr) && !/subscribe now|checkout|per month/i.test(pr));
    const ig = await text('/integrations');
    ok('/integrations: signed out, nothing claims to be connected (status is computed, not hard-coded)', /Sign in to check/.test(ig) && !/\bConnected\b/.test(ig), ig.slice(0, 160).replace(/\n/g, ' '));
    const an = await text('/analytics');
    ok('/analytics: signed out shows an honest sign-in/empty state, no fabricated charts', !/\d{2,}(\.\d)?K\b/.test(an) && !/Export (CSV|PDF|Report)/i.test(an));
  });

  await section('contact', async () => {
    await page.goto(base + '/contact', { waitUntil: 'networkidle' });
    await page.fill('#c-name', 'Pat Tester');
    await page.fill('#c-email', 'pat@example.test');
    await page.fill('#c-message', 'A real question about the product, long enough.');
    await page.click('button[type=submit]');
    await page.waitForSelector('[data-testid=contact-done]', { timeout: 20000 });
    const d = await page.locator('[data-testid=contact-done]').innerText();
    ok('/contact: says the message was saved and does not promise a reply', /saved/i.test(d) && !/will reply|we.ll reply|within \d/i.test(d), d);
    ok('/contact: message stored in contact_submissions', (await state()).contact_submissions?.some((r) => r.email === 'pat@example.test'));
  });

  await section('signed-in-analytics-and-export', async () => {
    await signUpAndAddKey(page, 'pub');
    const ig2 = await text('/integrations');
    ok('/integrations: signed in with a saved key shows the key as added (computed from the real key state)', /Key added/.test(ig2), ig2.slice(0, 200).replace(/\n/g, ' '));
    const an = await text('/analytics');
    ok('/analytics (signed in, new user): empty state or real zero counts, never invented numbers', !/\d{2,}(\.\d)?K\b/.test(an));
    await page.goto(base + '/dashboard/brand-analysis', { waitUntil: 'networkidle', timeout: 120000 });
    await page.fill('input[aria-label="Business description or website"]', 'Acme Coffee, small-batch roaster');
    const resp = page.waitForResponse((r) => r.url().includes('/api/ai/task'), { timeout: 60000 });
    await page.click('main button:has-text("Analyze"), button:has-text("Analyze"):not(header button)');
    await resp;
    await page.waitForSelector('[data-testid=pillar-breakdown]', { timeout: 60000 });
    for (const [label, magic, name] of [['PDF', '%PDF-', 'pdf'], ['Excel', 'PK', 'xlsx'], ['Word', 'PK', 'docx']]) {
      await page.getByRole('button', { name: 'Export' }).first().click();
      await page.waitForSelector('text=Export Brand Analysis Report');
      await page.locator('[role=dialog], .fixed').getByText(label === 'PDF' ? 'PDF Report' : label === 'Excel' ? 'Excel' : 'Word Document').first().click();
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByRole('button', { name: 'Export Report' }).click()]);
      const file = out(`report.${name}`);
      await dl.saveAs(file);
      const buf = fs.readFileSync(file);
      ok(`export ${label}: downloads a real ${name} file (${buf.length} bytes, magic ${JSON.stringify(buf.subarray(0, magic.length).toString())})`, dl.suggestedFilename() === `brand-analysis-report.${name}` && buf.length > 1500 && buf.subarray(0, magic.length).toString() === magic);
    }
  });

  ok('public pages: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll public-page checks passed');
  process.exit(failed ? 1 : 0);
})();
