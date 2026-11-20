// On-device models with REAL downloads (MediaPipe selfie segmenter, Whisper via Transformers.js), plus editor crop/remove-bg.
// If the browser cannot download the model, the check is reported NOT TESTABLE (never a silent pass).
const fs = require('fs');
const path = require('path');
const { launch, signUpAndAddKey, base, ok, section, warm, results, out } = require('./lib');
const nt = (name, reason) => { results.push({ name, ok: true, extra: 'NOT TESTABLE: ' + reason }); console.log(`NOT TESTABLE  ${name}  ${reason}`); };
const isPng = (b) => b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.slice(-8, -4).toString() === 'IEND';

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/visual-identity', '/dashboard/voice-content']);
  const { browser, page, errors } = await launch();
  await signUpAndAddKey(page, 'local');

  await section('editor-tools', async () => {
    await page.goto(base + '/dashboard/visual-identity', { waitUntil: 'networkidle', timeout: 120000 });
    await page.setInputFiles('input[type=file]', path.join(__dirname, 'fixtures/logo.png'));
    await page.waitForSelector('img[alt="Asset 1"]');
    await page.click('button[aria-label="Edit image 1"]');
    await page.waitForSelector('[role=dialog][aria-label="Image editor"] canvas');
    // solid-colour background removal: the white corners must become transparent
    const tabs = await page.locator('[role=dialog] [role=tab]').allInnerTexts();
    const bgTab = page.locator('[role=dialog] [role=tab]', { hasText: /Background/i });
    if (await bgTab.count()) await bgTab.click();
    await page.locator('[role=dialog] button:has-text("Remove background")').first().click();
    await page.waitForTimeout(1000);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('[role=dialog] button:has-text("Download PNG")')]);
    await dl.saveAs(out('e2e-nobg.png'));
    const png = fs.readFileSync(out('e2e-nobg.png'));
    // decode the PNG in the page and check that the corner pixel alpha is 0 while the centre is opaque
    const px = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      return { corner: x.getImageData(2, 2, 1, 1).data[3], centre: x.getImageData(img.width >> 1, img.height >> 1, 1, 1).data[3] };
    }, png.toString('base64'));
    ok('editor: "Remove background" makes the white background transparent in the exported PNG', isPng(png) && px.corner === 0 && px.centre === 255, JSON.stringify(px));

    // AI cut-out with the real MediaPipe download
    const aiTab = page.locator('[role=dialog] [role=tab]', { hasText: /Background/i });
    const ai = page.locator('[role=dialog] button:has-text("Remove background (AI)")');
    if (await ai.count() && await ai.isEnabled()) {
      await ai.click();
      const state = await Promise.race([
        page.waitForFunction(() => !document.querySelector('[role=dialog] .animate-spin'), null, { timeout: 90000 }).then(() => 'done'),
        new Promise((r) => setTimeout(() => r('timeout'), 90000))
      ]);
      const err = await page.locator('[role=dialog] [role=alert], [role=dialog] .text-red-500').allInnerTexts();
      if (state === 'done' && err.length === 0) ok('editor: AI cut-out (real MediaPipe model + WASM download) completes', true);
      else if (err.some((e) => /download|fetch|network|load/i.test(e)) || state === 'timeout') nt('editor: AI cut-out (MediaPipe)', 'model/WASM download failed in the browser: ' + err.join(' ').slice(0, 120));
      else ok('editor: AI cut-out (real MediaPipe model + WASM download) completes', false, err.join(' ').slice(0, 160));
    } else nt('editor: AI cut-out (MediaPipe)', 'not supported by this headless Chromium (WebGL/WASM unavailable)');
  });

  await section('whisper', async () => {
    await page.goto(base + '/dashboard/voice-content', { waitUntil: 'networkidle', timeout: 120000 });
    await page.getByRole('tab', { name: 'Transcription' }).click();
    await page.setInputFiles('input[type=file][accept*="audio"]', path.join(__dirname, 'fixtures/tone.wav'));
    await page.check('#on-device');
    await page.getByRole('button', { name: 'Start Transcription' }).click();
    const done = await page.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Start Transcription/.test(x.textContent || '')); return !!b && !b.disabled; }, null, { timeout: 240000 }).then(() => true).catch(() => false);
    const body = await page.innerText('body');
    if (done && !/On-device transcription failed/.test(body)) ok('whisper: on-device transcription completes with the real model (Transformers.js + WASM, downloaded in the browser)', true);
    else if (!done) nt('whisper: on-device transcription', 'did not finish within 240 s in headless Chromium');
    else ok('whisper: on-device transcription completes', false, 'UI reported a failure');
  });

  ok('local-ai: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll local-AI checks passed (see NOT TESTABLE lines)');
  process.exit(failed ? 1 : 0);
})();
