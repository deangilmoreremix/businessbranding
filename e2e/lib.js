// Shared helpers for the feature e2e suite (mock Supabase 5998, mock OpenAI 5999, next dev 5240).
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:5240';
const PW = 'correct-horse-battery';

const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, ok: !!cond, extra }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const apiLog = [];
const section = async (name, fn) => { try { await fn(); } catch (e) { ok(name + ' (script error)', false, String(e.message).split('\n')[0].slice(0, 200) + ' | last api: ' + apiLog.slice(-4).join(' ')); } };

async function warm(paths) {
  for (const p of paths) await fetch(base + p).then((r) => r.text()).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
}

/** Launch Chromium with fake media + a context whose File System Access pickers are removed (download fallback). */
async function launch(extra = {}) {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1300, height: 1100 }, permissions: ['microphone'], ...extra });
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; delete window.showOpenFilePicker; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('response', (r) => { if (/\/api\//.test(r.url())) apiLog.push(`${r.request().method()} ${r.url().replace(base, '')} ${r.status()}`); });
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  return { browser, ctx, page, errors };
}

/** Real UI flow: sign up -> (key step) add key -> continue. Returns the unique email. */
async function signUpAndAddKey(page, tag, key = 'sk-test-FEATURESUITE00001234') {
  const email = `${tag}-${Date.now()}@example.test`;
  await page.goto(base + '/sign-up?next=%2Fsettings', { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('#email', email);
  await page.fill('#password', PW + '-long');
  await page.fill('#confirm', PW + '-long');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=welcome-key-prompt]', { timeout: 40000 });
  if (key) {
    await page.fill('#openai-key', key);
    await page.click('button:has-text("Validate & save")');
    await page.waitForSelector('[data-testid=key-masked]', { timeout: 20000 });
  }
  return email;
}

module.exports = { base, PW, ok, section, results, warm, launch, signUpAndAddKey };
