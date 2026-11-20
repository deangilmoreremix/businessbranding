import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { isPrivateAddress, resolvePublicAddress, safeFetch, safeFetchBlob, UnsafeUrlError } from '@/lib/server/safe-fetch';

describe('isPrivateAddress', () => {
  const blocked = [
    '127.0.0.1', '127.255.255.254', '0.0.0.0', '10.0.0.1', '10.255.255.255', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '100.127.255.255', '224.0.0.1', '255.255.255.255', '::1', '::', '::ffff:127.0.0.1', '::ffff:8.8.8.8', '::ffff:7f00:1',
    'fc00::1', 'fd12:3456::1', 'fe80::1', 'febf::1', 'fec0::1', 'ff02::1', '2002:7f00:1::1', '64:ff9b::a00:1', '[::1]', 'not-an-ip'
  ];
  const allowed = ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '100.63.255.255', '100.128.0.1', '169.253.0.1', '93.184.216.34', '2606:4700:4700::1111', '2001:4860:4860::8888'];
  it.each(blocked)('blocks %s', (ip) => expect(isPrivateAddress(ip)).toBe(true));
  it.each(allowed)('allows %s', (ip) => expect(isPrivateAddress(ip)).toBe(false));
});

describe('resolvePublicAddress', () => {
  const resolver = (map: Record<string, string[]>) => async (h: string) => (map[h] ?? []).map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
  it('refuses non-http schemes, credentials, localhost-style names and private literals', async () => {
    for (const u of ['file:///etc/passwd', 'ftp://example.com/x', 'gopher://x', 'http://user:pw@example.com/', 'http://localhost/', 'http://foo.localhost/', 'http://db.internal/', 'http://printer.local/',
      'http://127.0.0.1/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/', 'http://2130706433/', 'http://0x7f.1/', 'http://[::ffff:10.0.0.1]/']) {
      await expect(resolvePublicAddress(u, resolver({}))).rejects.toBeInstanceOf(UnsafeUrlError);
    }
  });
  it('refuses a hostname that resolves to ANY private address (rebinding / mixed records)', async () => {
    await expect(resolvePublicAddress('http://evil.test/', resolver({ 'evil.test': ['10.0.0.5'] }))).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(resolvePublicAddress('http://evil.test/', resolver({ 'evil.test': ['93.184.216.34', '127.0.0.1'] }))).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(resolvePublicAddress('http://evil.test/', resolver({ 'evil.test': ['::ffff:127.0.0.1'] }))).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(resolvePublicAddress('http://nx.test/', resolver({}))).rejects.toBeInstanceOf(UnsafeUrlError);
  });
  it('accepts a public hostname and returns the address to pin', async () => {
    const r = await resolvePublicAddress('https://ok.test/a?b=1', resolver({ 'ok.test': ['93.184.216.34'] }));
    expect(r.address).toBe('93.184.216.34');
    expect(r.family).toBe(4);
  });
});

describe('safeFetch (local server, private-address check disabled for the test only)', () => {
  let server: http.Server;
  let base = '';
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/redir') { res.writeHead(302, { Location: 'http://169.254.169.254/' }); return res.end(); }
      if (req.url === '/hop') { res.writeHead(302, { Location: '/ok' }); return res.end(); }
      if (req.url === '/big') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(Buffer.alloc(2048)); }
      if (req.url === '/slow') return; // never answers
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html>hello</html>');
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => { server.close(); });

  it('fetches text and refuses the private address by default', async () => {
    const ok = await safeFetch(base + '/ok', { allowPrivateForTests: true });
    expect(ok.status).toBe(200);
    expect(ok.body.toString()).toContain('hello');
    await expect(safeFetch(base + '/ok')).rejects.toBeInstanceOf(UnsafeUrlError); // 127.0.0.1 is refused without the test hook
  });
  it('refuses redirects by default and follows (re-validating) only when allowed', async () => {
    await expect(safeFetch(base + '/redir', { allowPrivateForTests: true })).rejects.toThrow(/Redirects/);
    const r = await safeFetch(base + '/hop', { allowPrivateForTests: true, maxRedirects: 2 });
    expect(r.body.toString()).toContain('hello');
    // a redirect into a private address is refused on the hop (no test hook => the hop target is validated)
    await expect(safeFetch(base + '/redir', { maxRedirects: 2, resolver: async () => [{ address: '93.184.216.34', family: 4 }], allowPrivateForTests: false })).rejects.toBeInstanceOf(UnsafeUrlError);
  });
  it('caps the response size and the time', async () => {
    await expect(safeFetchBlob(base + '/big', { allowPrivateForTests: true, maxBytes: 1024 })).rejects.toThrow(/too large/);
    await expect(safeFetch(base + '/slow', { allowPrivateForTests: true, timeoutMs: 300 })).rejects.toThrow(/timed out/);
  });
});
