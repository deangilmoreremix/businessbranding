// Every static page at 1280 / 768 / 390 px, signed out and signed in: no horizontal page scroll and no content clipped past the right edge.
const { launch, signUpAndAddKey, base, ok, section, warm, results } = require('./lib');
const fs = require('node:fs');

const routes = (fs.readFileSync(__dirname + '/../docs/ROUTES.txt', 'utf8')).split('\n').map((s) => s.trim()).filter(Boolean);
const SIZES = [[1280, 900], [768, 1024], [390, 844]];

const measure = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const doc = document.documentElement;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 && !el.closest('[data-scroll-ok], pre, table, .overflow-x-auto, .overflow-auto, .overflow-hidden, [role=tablist], .react-flow, svg')) {
      offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 3).join('.') : ''} "${(el.innerText || '').trim().slice(0, 30)}" right=${Math.round(r.right)}`);
    }
  }
  return { overflow: doc.scrollWidth - vw, offenders: offenders.slice(0, 3) };
});

(async () => {
  await warm(['/sign-up', '/dashboard']);
  const { browser, page, errors } = await launch();
  const check = async (label) => {
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      for (const r of routes) {
        await page.goto(base + r, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(350);
        const m = await measure(page);
        ok(`${label} ${r} @${w}px: no horizontal overflow`, m.overflow <= 1 && m.offenders.length === 0, m.overflow > 1 || m.offenders.length ? `overflow=${m.overflow} ${m.offenders.join(' | ')}` : '');
      }
    }
  };
  await section('signed-out', () => check('out'));
  await signUpAndAddKey(page, 'vp');
  await section('signed-in', () => check('in'));
  await section('workflow-steps', async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base + '/workflows', { waitUntil: 'networkidle' });
    await page.waitForSelector('.react-flow__node');
    const boxes = await page.$$eval('.react-flow__node', (ns) => ns.map((n) => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, n.innerText.split('\n')[0]]; }));
    let clash = '';
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) clash += `${a[4]}/${b[4]} `;
    }
    ok('/workflows: default steps do not overlap', boxes.length >= 4 && !clash, clash);
  });
  ok('viewports: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll viewport checks passed');
  process.exit(failed ? 1 : 0);
})();
