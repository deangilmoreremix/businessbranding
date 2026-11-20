// Assistant (SSE streaming), read-aloud, dictation (OpenAI engine + mocked SpeechRecognition), workflows + email, error states. Fresh mocks.
const fs = require('fs');
const { launch, signUpAndAddKey, base, ok, section, warm, results } = require('./lib');
const save = async (dl, name) => { const p = `/tmp/claude-0/e2e-${name}`; await dl.saveAs(p); return fs.readFileSync(p); };

(async () => {
  await warm(['/sign-up', '/settings', '/workflows', '/dashboard']);
  const { browser, ctx, page, errors } = await launch();
  await signUpAndAddKey(page, 'assistant');

  await section('assistant', async () => {
    await page.goto(base + '/dashboard', { waitUntil: 'networkidle', timeout: 120000 });
    await page.getByRole('button', { name: 'Open support assistant' }).click();
    const box = page.getByPlaceholder('Ask the brand assistant…');
    await box.waitFor({ timeout: 20000 });
    await box.fill('Hello assistant');
    const resp = page.waitForResponse((r) => r.url().includes('/api/ai/assistant'), { timeout: 40000 });
    await page.getByRole('button', { name: 'Send message' }).click();
    const r = await resp;
    ok('assistant: /api/ai/assistant streams (SSE) with the user key', r.status() === 200 && (r.headers()['content-type'] || '').includes('text/event-stream'), `${r.status()} ${r.headers()['content-type']}`);
    await page.waitForSelector('button[aria-label="Read aloud"]', { timeout: 30000 });
    ok('assistant: streamed reply rendered with a Read-aloud button', true);
    const tts = page.waitForResponse((x) => x.url().includes('/api/voice/generate'), { timeout: 30000 });
    await page.click('button[aria-label="Read aloud"]');
    const tr = await tts;
    ok('assistant: Read aloud uses OpenAI TTS (/api/voice/generate, 200)', tr.status() === 200, `status ${tr.status()}`);
  });

  await section('dictation-openai', async () => {
    const tx = page.waitForResponse((x) => x.url().includes('/api/voice/transcribe'), { timeout: 30000 });
    await page.getByRole('button', { name: 'Start voice input' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Stop voice input' }).click();
    const r = await tx;
    ok('dictation: fake mic -> MediaRecorder -> /api/voice/transcribe 200', r.status() === 200, `status ${r.status()}`);
    await page.waitForFunction(() => [...document.querySelectorAll('input,textarea')].some((e) => /hello transcript/i.test(e.value)), null, { timeout: 15000 })
      .then(() => ok('dictation: transcript lands in the input', true)).catch(() => ok('dictation: transcript lands in the input', false));
  });

  await section('dictation-browser', async () => {
    const c2 = await browser.newContext({ viewport: { width: 1300, height: 1000 } });
    // browser engine: no MediaRecorder -> Web Speech API (mocked here: Chromium headless has no recogniser)
    await c2.addInitScript(() => {
      delete window.MediaRecorder;
      class FakeRec { constructor() { this.listeners = {}; } start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: Object.assign([Object.assign([{ transcript: 'spoken via web speech' }], { isFinal: true })], { length: 1 }) }); this.onend?.(); }, 200); } stop() { this.onend?.(); } abort() {} }
      window.SpeechRecognition = FakeRec; window.webkitSpeechRecognition = FakeRec;
    });
    const p2 = await c2.newPage();
    await signUpAndAddKey(p2, 'dictate', 'sk-test-DICTATE0000009999');
    await p2.goto(base + '/dashboard', { waitUntil: 'networkidle', timeout: 120000 });
    await p2.getByRole('button', { name: 'Open support assistant' }).click();
    await p2.getByPlaceholder('Ask the brand assistant…').waitFor();
    await p2.getByRole('button', { name: 'Start voice input' }).click();
    await p2.waitForFunction(() => [...document.querySelectorAll('input,textarea')].some((e) => /spoken via web speech/.test(e.value)), null, { timeout: 10000 })
      .then(() => ok('dictation: Web Speech API fallback (mock SpeechRecognition) fills the input', true)).catch(() => ok('dictation: Web Speech API fallback (mock SpeechRecognition) fills the input', false));
    await c2.close();
  });

  await section('workflows', async () => {
    await page.goto(base + '/workflows', { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('.react-flow__node', { timeout: 30000 });
    ok('workflows: React Flow canvas with the default nodes', (await page.locator('.react-flow__node').count()) >= 4);
    await page.locator('.react-flow__node').first().click();
    await page.locator('textarea').first().fill('Our coffee is good.');
    await page.getByRole('button', { name: 'Run workflow' }).click();
    await page.waitForSelector('[data-testid=workflow-results] audio', { timeout: 90000 })
      .then(() => ok('workflows: Run workflow executes every step (copy via Responses, email via /api/email/render, voice via TTS)', true))
      .catch(async () => ok('workflows: Run workflow executes every step', false, (await page.locator('[data-testid=workflow-results], [role=alert]').allInnerTexts()).join(' ').replace(/\s+/g, ' ').slice(0, 240)));
    const res = page.locator('[data-testid=workflow-results]');
    ok('workflows: results show the generated copy, a sandboxed email preview and an audio player', (await res.locator('iframe[title="Email preview"][sandbox=""]').count()) === 1 && (await res.locator('audio').count()) === 1 && (await res.locator('p.whitespace-pre-wrap').count()) >= 2);
    const html = await res.locator('iframe').getAttribute('srcdoc');
    ok('workflows: email output is full HTML', /<html/i.test(html) && html.length > 500, `${html.length} chars`);
    // autosave: the edited brief survives a reload (IndexedDB)
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.react-flow__node');
    ok('workflows: graph autosaved to IndexedDB and restored after a reload', (await page.locator('.react-flow__node').first().innerText()).includes('Our coffee is good.'));
    const [dj] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: 'Export' }).click()]);
    const json = JSON.parse((await save(dj, 'wf.json')).toString());
    ok('workflows: Export produces valid JSON with nodes and edges', Array.isArray(json.nodes) && Array.isArray(json.edges) && json.nodes.length >= 4);
  });

  await section('email-api', async () => {
    const r = await page.evaluate(async () => {
      const res = await fetch('/api/email/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'Hi', headline: 'Headline', body: 'Body text', ctaLabel: 'Go', ctaUrl: 'javascript:alert(1)' }) });
      return { status: res.status, body: await res.text() };
    });
    ok('email: render route answers (and never emits a javascript: link)', r.status < 500 && !/href="javascript:/i.test(r.body), `status ${r.status}`);
  });

  ok('assistant/workflows: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll assistant/workflow checks passed');
  process.exit(failed ? 1 : 0);
})();
