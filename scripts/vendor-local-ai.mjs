#!/usr/bin/env node
/**
 * Self-host the on-device AI runtimes (Transformers.js + onnxruntime-web for Whisper) under public/vendor/ so the browser never
 * executes third-party code fetched at runtime. Every file is pinned by SHA-384 and the script FAILS on any mismatch.
 *   node scripts/vendor-local-ai.mjs          (runs automatically before `npm run build`; skips files already present and valid)
 * MediaPipe is not vendored here: lib/local/segment.ts loads it from the pinned CDN but verifies every file with SRI before use.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ORT = '1.31.0-dev.20260914-8d85527a0';
const FILES = [
  { url: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2', out: 'transformers/transformers.js', sha384: 'sha384-xFDNfwR3J/vPYzGjMr1VSM8LHIcA+ii2Ha4x+6WAuISKpT9I0dxgF/mVQW+I0kSd' },
  { url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT}/dist/ort-wasm-simd-threaded.asyncify.mjs`, out: 'transformers/ort-wasm-simd-threaded.asyncify.mjs', sha384: 'sha384-ik7L7J2uXfXmGuWHh3yOUDPpUslz/dJjcvZgdX5hcItLjxlkEpUF7mpCcATr3Dg8' },
  { url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT}/dist/ort-wasm-simd-threaded.asyncify.wasm`, out: 'transformers/ort-wasm-simd-threaded.asyncify.wasm', sha384: 'sha384-JuzrCV6BUmTUbsgNhgU94qo0vZ4l3w0VqgQAKPm0La2hXL9kmv8P9pGenfsWJY9c' }
];
const root = join(process.cwd(), 'public', 'vendor');
const hash = (buf) => 'sha384-' + createHash('sha384').update(buf).digest('base64');

let failed = 0;
for (const f of FILES) {
  const dest = join(root, f.out);
  if (existsSync(dest) && hash(readFileSync(dest)) === f.sha384) { console.log('ok (present)', f.out); continue; }
  try {
    const res = await fetch(f.url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (hash(buf) !== f.sha384) throw new Error(`hash mismatch (got ${hash(buf)})`);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log('vendored', f.out, `${(buf.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    failed++;
    console.error(`FAILED ${f.out}: ${e.message}`);
  }
}
if (failed) {
  console.error(`\n${failed} file(s) could not be vendored; on-device Whisper will report itself unavailable until they are (a hash mismatch is never ignored).`);
  process.exit(process.env.VENDOR_OPTIONAL === '1' ? 0 : 1);
}
