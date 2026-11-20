// SSRF-safe fetch for Deno Edge Functions. Resolves DNS (A + AAAA), refuses any private/loopback/link-local/CGNAT/mapped/ULA
// address, re-validates every redirect hop, and caps size (15 MB) and time (15 s). Deno's fetch cannot pin the connection
// address, so the check-to-connect window is narrower than the Node version (which pins); no redirect is ever followed unchecked.
import { checkUrlSyntax, isPrivateAddress, UnsafeUrlError } from './ssrf.ts';

export { UnsafeUrlError };

const MAX_BYTES = 15 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

async function assertPublicHost(source: string): Promise<URL> {
  const { url, host, literal } = checkUrlSyntax(source);
  if (literal) return url;
  const records: string[] = [];
  for (const type of ['A', 'AAAA'] as const) {
    try {
      records.push(...((await (Deno as any).resolveDns(host, type)) as string[]));
    } catch {
      /* no records of this type */
    }
  }
  if (!records.length) throw new UnsafeUrlError('Could not resolve the URL host');
  if (records.some((a) => isPrivateAddress(a))) throw new UnsafeUrlError();
  return url;
}

/** GET `source` and return its text (max 15 MB, 15 s, up to 4 re-validated redirects). */
export async function safeFetchText(source: string, headers: Record<string, string> = {}): Promise<{ status: number; text: string }> {
  const deadline = Date.now() + TIMEOUT_MS;
  let current = source;
  for (let hop = 0; hop <= 4; hop++) {
    const url = await assertPublicHost(current);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), Math.max(1, deadline - Date.now()));
    try {
      const res = await fetch(url, { headers, redirect: 'manual', signal: ctl.signal });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        await res.body?.cancel();
        if (!loc) throw new UnsafeUrlError('Redirects are not allowed');
        current = new URL(loc, url).toString();
        continue;
      }
      if (Number(res.headers.get('content-length') || 0) > MAX_BYTES) throw new UnsafeUrlError('The response is too large');
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) {
          await reader.cancel();
          throw new UnsafeUrlError('The response is too large');
        }
        chunks.push(value);
      }
      const all = new Uint8Array(size);
      let off = 0;
      for (const c of chunks) {
        all.set(c, off);
        off += c.length;
      }
      return { status: res.status, text: new TextDecoder().decode(all) };
    } catch (e) {
      if (e instanceof UnsafeUrlError) throw e;
      throw new UnsafeUrlError((e as Error).name === 'AbortError' ? 'The URL timed out' : 'Failed to fetch the URL');
    } finally {
      clearTimeout(timer);
    }
  }
  throw new UnsafeUrlError('Too many redirects');
}
