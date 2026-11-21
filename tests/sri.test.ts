import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fetchVerified, fetchVerifiedBytes, IntegrityError, sriDigest } from '@/lib/local/sri';

const bytes = new TextEncoder().encode('console.log("trusted module")');
const respond = (body: Uint8Array, init: ResponseInit = {}) => (async () => new Response(body, { status: 200, ...init })) as unknown as typeof fetch;

describe('SRI verification', () => {
  it('accepts bytes matching the pinned hash', async () => {
    const good = await sriDigest(bytes.buffer.slice(0) as ArrayBuffer);
    const out = await fetchVerifiedBytes('https://cdn.example/x.js', good, respond(bytes));
    expect(new Uint8Array(out)).toEqual(bytes);
    expect((await fetchVerified('https://cdn.example/x.js', good, respond(bytes))).size).toBe(bytes.length);
  });

  it('REJECTS a single flipped byte with an IntegrityError (tamper test)', async () => {
    const good = await sriDigest(bytes.buffer.slice(0) as ArrayBuffer);
    const tampered = bytes.slice();
    tampered[5] ^= 1;
    const p = fetchVerifiedBytes('https://cdn.example/x.js', good, respond(tampered));
    await expect(p).rejects.toBeInstanceOf(IntegrityError);
    await expect(p).rejects.toThrow(/did not match its expected hash/);
  });

  it('rejects when the hash is wrong even if the response is fine', async () => {
    await expect(fetchVerifiedBytes('https://cdn.example/x.js', 'sha384-AAAA', respond(bytes))).rejects.toBeInstanceOf(IntegrityError);
  });

  it('maps a browser-level integrity failure to IntegrityError, other failures stay ordinary errors', async () => {
    const browserReject = (async () => { throw new TypeError("Failed to find a valid digest in the 'integrity' attribute for resource"); }) as unknown as typeof fetch;
    await expect(fetchVerifiedBytes('https://cdn.example/x.js', 'sha384-x', browserReject)).rejects.toBeInstanceOf(IntegrityError);
    const offline = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    const err = await fetchVerifiedBytes('https://cdn.example/x.js', 'sha384-x', offline).catch((e) => e);
    expect(err).not.toBeInstanceOf(IntegrityError);
    const notFound = (async () => new Response('', { status: 404 })) as unknown as typeof fetch;
    await expect(fetchVerifiedBytes('https://cdn.example/x.js', 'sha384-x', notFound)).rejects.toThrow(/404/);
  });

  it('the cut-out loader cannot bypass verification (static guard)', () => {
    const seg = readFileSync('lib/local/segment.ts', 'utf8');
    expect(seg).toMatch(/importVerifiedModule\(FILES\.module/);
    expect(seg).toMatch(/fetchVerified\(FILES\.loader/);
    expect(seg).toMatch(/fetchVerified\(FILES\.binary/);
    expect(seg).toMatch(/fetchVerifiedBytes\(MODEL\.url, MODEL\.integrity\)/);
    expect(seg).not.toMatch(/\/latest\//); // the model URL is versioned
    expect(seg).not.toMatch(/modelAssetPath/); // never hand the library a bare URL to download unchecked
    expect(readFileSync('lib/local/sri.ts', 'utf8')).toMatch(/sriDigest\(bytes\) !== integrity|\(await sriDigest\(bytes\)\) !== integrity/); // explicit check, not only the fetch option
    const editor = readFileSync('components/local/image-editor.tsx', 'utf8');
    expect(editor).toMatch(/IntegrityError[\s\S]*Security check failed/);
  });

  // Live pins: run with SRI_LIVE=1 to confirm the hashes in the source still match the real CDN files.
  it.skipIf(!process.env.SRI_LIVE)('pinned hashes match the live CDN files', async () => {
    const seg = readFileSync('lib/local/segment.ts', 'utf8');
    const base = [...seg.matchAll(/url: `\$\{BASE\}([^`]+)`, integrity: '(sha384-[^']+)'/g)].map((m) => ({ url: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3${m[1]}`, hash: m[2] }));
    const model = /'(https:\/\/storage\.googleapis\.com[^']+)'[\s\S]*?integrity: '(sha384-[^']+)'/.exec(seg);
    const pairs = [...base, ...(model ? [{ url: model[1], hash: model[2] }] : [])];
    expect(pairs.length).toBe(4);
    for (const { url, hash } of pairs) expect(await sriDigest(await (await fetch(url)).arrayBuffer()), url).toBe(hash);
  }, 120_000);
});
