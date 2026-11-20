/**
 * SSRF-safe fetching of client-supplied URLs (ported from the analyzer reference implementation).
 *  - only http(s); the hostname is RESOLVED and every address must be public (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16,
 *    100.64/10, ::1, ::, ::ffff:*, fc00::/7, fe80::/10 ... are refused); literal IPs are checked too
 *  - the validated address is PINNED for the connection (custom `lookup`), so DNS rebinding between check and connect
 *    cannot swap in a private address; TLS still uses the original hostname (SNI/cert)
 *  - redirects are refused by default; when allowed (`maxRedirects`), EVERY hop is re-validated and re-pinned
 *  - response size (default 15 MB) and total time (default 15 s) are capped
 */
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { checkUrlSyntax, isPrivateAddress, UnsafeUrlError } from '../../supabase/functions/_shared/ssrf';

export { isPrivateAddress, UnsafeUrlError };

export type Resolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

export const defaultResolver: Resolver = async (hostname) => {
  const r = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return r.map((x) => ({ address: x.address, family: x.family }));
};

/** Validate the URL and return the single address to connect to. Every resolved address must be public. */
export async function resolvePublicAddress(source: string, resolver: Resolver = defaultResolver): Promise<{ url: URL; address: string; family: number }> {
  const { url, host, literal } = checkUrlSyntax(source);
  if (literal) return { url, address: host, family: net.isIPv4(host) ? 4 : 6 };
  let records: Array<{ address: string; family: number }>;
  try {
    records = await resolver(host);
  } catch {
    throw new UnsafeUrlError('Could not resolve the URL host');
  }
  if (!records.length) throw new UnsafeUrlError('Could not resolve the URL host');
  // ALL records must be public: a hostname that also resolves to a private address is refused outright
  if (records.some((r) => isPrivateAddress(r.address))) throw new UnsafeUrlError();
  return { url, address: records[0].address, family: records[0].family || (net.isIPv4(records[0].address) ? 4 : 6) };
}

export const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 15_000;

export interface SafeFetchOptions {
  resolver?: Resolver;
  maxBytes?: number;
  timeoutMs?: number;
  /** Follow up to this many redirects, re-validating each hop (default 0: any redirect is an error). */
  maxRedirects?: number;
  headers?: Record<string, string>;
  /** Test hook: skip the private-address refusal (never set by routes). */
  allowPrivateForTests?: boolean;
}

export interface SafeResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  url: string;
}

function once(source: string, opts: SafeFetchOptions, deadline: number): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer; url: URL }> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  return (async () => {
    let target: { url: URL; address: string; family: number };
    if (opts.allowPrivateForTests) {
      const url = new URL(source);
      target = { url, address: url.hostname.replace(/^\[|\]$/g, ''), family: net.isIPv4(url.hostname) ? 4 : 6 };
    } else {
      target = await resolvePublicAddress(source, opts.resolver);
    }
    const { url, address, family } = target;
    const mod = url.protocol === 'https:' ? https : http;
    const remaining = Math.max(1, deadline - Date.now());

    return await new Promise((resolve, reject) => {
      const req = mod.request(
        {
          protocol: url.protocol,
          hostname: url.hostname.replace(/^\[|\]$/g, ''),
          port: url.port || undefined,
          path: `${url.pathname}${url.search}`,
          method: 'GET',
          headers: { 'User-Agent': 'brand-creator-fetch', Accept: '*/*', ...(opts.headers ?? {}) },
          // pin the validated address; the connection can only go where we checked
          lookup: ((_host: string, options: any, cb: any) => {
            if (options && options.all) cb(null, [{ address, family }]);
            else cb(null, address, family);
          }) as any,
          timeout: remaining
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400) {
            res.resume();
            return resolve({ status, headers: res.headers, body: Buffer.alloc(0), url });
          }
          const declared = Number(res.headers['content-length'] || 0);
          if (declared > maxBytes) {
            res.destroy();
            return reject(new UnsafeUrlError('The response is too large'));
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on('data', (c: Buffer) => {
            size += c.length;
            if (size > maxBytes) {
              res.destroy();
              reject(new UnsafeUrlError('The response is too large'));
            } else chunks.push(c);
          });
          res.on('end', () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks), url }));
          res.on('error', () => reject(new UnsafeUrlError('Failed to fetch the URL')));
        }
      );
      const timer = setTimeout(() => req.destroy(new Error('timeout')), remaining);
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', (e) => {
        clearTimeout(timer);
        reject(e instanceof UnsafeUrlError ? e : new UnsafeUrlError(e.message === 'timeout' ? 'The URL timed out' : 'Failed to fetch the URL'));
      });
      req.on('close', () => clearTimeout(timer));
      req.end();
    });
  })();
}

/** GET a client-supplied URL safely. Non-2xx statuses are returned (not thrown) so callers can report them. */
export async function safeFetch(source: string, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
  const deadline = Date.now() + (opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const maxRedirects = opts.maxRedirects ?? 0;
  let current = source;
  for (let hop = 0; ; hop++) {
    const r = await once(current, opts, deadline);
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.location;
      if (hop >= maxRedirects || !loc) throw new UnsafeUrlError('Redirects are not allowed');
      current = new URL(String(loc), r.url).toString(); // validated again on the next hop
      continue;
    }
    return { status: r.status, headers: r.headers, body: r.body, url: r.url.toString() };
  }
}

/** Fetch an image; redirects are refused and only 2xx is accepted. */
export async function safeFetchBlob(source: string, opts: SafeFetchOptions = {}): Promise<Blob> {
  const r = await safeFetch(source, { ...opts, headers: { Accept: 'image/*,*/*;q=0.5', ...(opts.headers ?? {}) } });
  if (r.status < 200 || r.status >= 300) throw new UnsafeUrlError(`Failed to fetch the image (${r.status})`);
  return new Blob([r.body], { type: String(r.headers['content-type'] || 'application/octet-stream') });
}
