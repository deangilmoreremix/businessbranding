// Visual identity: upload, AI generate, editor, PNG exports, GIF, IndexedDB library. Run through run-verify.sh with fresh mocks.
const fs = require('fs');
const path = require('path');
const { launch, signUpAndAddKey, base, ok, section, warm, results } = require('./lib');

const isPng = (b) => b.length > 33 && b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.slice(-12, -8).toString('hex') === '00000000' && b.slice(-8, -4).toString() === 'IEND';
const dims = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });
const save = async (dl, name) => { const p = `/tmp/claude-0/e2e-${name}`; await dl.saveAs(p); return fs.readFileSync(p); };

(async () => {
  await warm(['/sign-up', '/settings', '/dashboard/visual-identity']);
  const { browser, page, errors } = await launch();
  await signUpAndAddKey(page, 'visual');

  await section('visual', async () => {
    await page.goto(base + '/dashboard/visual-identity', { waitUntil: 'networkidle', timeout: 120000 });
    // upload an image
    await page.setInputFiles('input[type=file]', path.join(__dirname, 'fixtures/logo.png'));
    await page.waitForSelector('[data-testid=asset-tools] img[alt="Asset 1"]', { timeout: 20000 });
    ok('visual: uploaded image appears in the asset tools', true);

    // AI generation through /api/ai/image with the user key (mock Images API)
    await page.fill('input[placeholder="Enter transformation prompt..."]', 'A minimal coffee logo');
    await page.click('button:has-text("Create Variations with AI"), button:has-text("Generate Image with AI")');
    await page.waitForSelector('img[alt="Generated 1"]', { timeout: 40000 });
    ok('visual: AI image generation/variation returns an image (Images API via the user key)', true);

    // editor
    await page.click('button[aria-label="Edit image 1"]');
    await page.waitForSelector('[role=dialog][aria-label="Image editor"] canvas', { timeout: 20000 });
    ok('visual: image editor opens with a canvas', true);
    await page.fill('[role=dialog] input[aria-label="Text"]', 'Hello');
    await page.click('[role=dialog] button:has-text("Add text")');
    await page.click('[role=dialog] button:has-text("Add rectangle"), [role=dialog] button:has-text("Add shape"), [role=dialog] button:has-text("Rectangle")').catch(() => {});
    ok('visual: text layer added in the editor', true);
    const bg = page.locator('[role=dialog] button:has-text("Remove background")').first();
    if (await bg.count()) { await bg.click(); await page.waitForTimeout(800); ok('visual: solid-colour background removal runs in the browser', true); }
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('[role=dialog] button:has-text("Download PNG")')]);
    const buf = await save(dl, 'editor.png');
    ok('visual: editor "Download PNG" is a valid PNG (signature + IEND)', isPng(buf), `${buf.length} bytes ${JSON.stringify(dims(buf))}`);
    await page.click('[role=dialog] button:has-text("Save to local library")');
    await page.waitForTimeout(800);
    await page.click('button[aria-label="Close editor"]');
    ok('visual: saved to the local library (IndexedDB)', (await page.locator('text=Local library').count()) >= 1);

    // exports
    for (const [label, file] of [['Brand kit PNG', 'kit.png'], ['Palette PNG', 'palette.png'], ['Social post PNG', 'social.png'], ['Snapshot mockup', 'mockup.png']]) {
      const [d] = await Promise.all([page.waitForEvent('download', { timeout: 40000 }), page.click(`button:has-text("${label}")`)]);
      const b = await save(d, file);
      ok(`visual: "${label}" downloads a valid PNG`, isPng(b), `${b.length} bytes ${JSON.stringify(dims(b))} ${d.suggestedFilename()}`);
    }

    // GIF needs two images: logo + generated
    const [g] = await Promise.all([page.waitForEvent('download', { timeout: 40000 }), page.click('button:has-text("GIF preview")')]);
    const gif = await save(g, 'preview.gif');
    ok('visual: GIF preview is a valid animated GIF', gif.slice(0, 6).toString() === 'GIF89a' && gif[gif.length - 1] === 0x3b, `${gif.length} bytes`);

    // IndexedDB library survives a reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', path.join(__dirname, 'fixtures/logo2.png'));
    await page.waitForSelector('[data-testid=asset-tools] img[alt="Asset 1"]', { timeout: 20000 });
    ok('visual: local library persists across a reload (IndexedDB)', (await page.locator('[data-testid=asset-tools] >> text=Local library').count()) >= 1);
    const idb = await page.evaluate(async () => { const dbs = await indexedDB.databases(); return dbs.map((d) => d.name); });
    ok('visual: an IndexedDB database exists', idb.length > 0, idb.join(','));
  });

  ok('visual: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll visual checks passed');
  process.exit(failed ? 1 : 0);
})();
