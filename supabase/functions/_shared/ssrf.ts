// Runtime-agnostic SSRF address classification (no Node/Deno imports): shared by the Next server and the Deno Edge Functions.
// Ported from the analyzer reference implementation (safe-fetch.ts).

export class UnsafeUrlError extends Error {
  status = 400;
  constructor(message = 'URL must be a public http(s) address') {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const isIPv4Literal = (s: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every((p) => Number(p) <= 255);
const isIPv6Literal = (s: string) => s.includes(':') && /^[0-9a-fA-F:.%]+$/.test(s);
export const isIPLiteral = (s: string) => isIPv4Literal(s) || isIPv6Literal(s);

// ---- address classification --------------------------------------------------------------------------------

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.some((n) => !(n >= 0 && n <= 255)) ? null : nums;
}

/** Parse an IPv6 literal (no brackets/zone) into 16 bytes, or null. Supports `::` and a trailing dotted IPv4. */
function parseIPv6(input: string): number[] | null {
  let ip = input.split('%')[0];
  let tail: number[] = [];
  const dotted = ip.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const v4 = parseIPv4(dotted[2]);
    if (!v4) return null;
    tail = v4;
    ip = dotted[1] + '0:0';
  }
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const toWords = (s: string) => (s === '' ? [] : s.split(':'));
  const head = toWords(halves[0]);
  const rest = halves.length === 2 ? toWords(halves[1]) : [];
  const total = head.length + rest.length;
  if (halves.length === 1 ? total !== 8 : total > 7) return null;
  const words = [...head, ...Array(8 - total).fill('0'), ...rest];
  const bytes: number[] = [];
  for (const w of words) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(w)) return null;
    const n = parseInt(w, 16);
    bytes.push(n >> 8, n & 0xff);
  }
  if (tail.length) bytes.splice(12, 4, ...tail);
  return bytes;
}

function isPrivateIPv4(b: number[]): boolean {
  const [a, c] = b;
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10/8
    a === 127 || // loopback
    (a === 100 && c >= 64 && c <= 127) || // CGNAT 100.64/10
    (a === 169 && c === 254) || // link-local (cloud metadata)
    (a === 172 && c >= 16 && c <= 31) ||
    (a === 192 && c === 168) ||
    (a === 192 && c === 0 && b[2] === 0) || // 192.0.0/24
    (a === 198 && (c === 18 || c === 19)) || // benchmarking
    a >= 224 // multicast + reserved + broadcast
  );
}

/** True when `ip` is NOT a public unicast address (or isn't an IP at all). */
export function isPrivateAddress(ipInput: string): boolean {
  const ip = ipInput.replace(/^\[|\]$/g, '');
  if (isIPv4Literal(ip)) {
    const b = parseIPv4(ip);
    return !b || isPrivateIPv4(b);
  }
  const b = parseIPv6(ip);
  if (!b) return true; // unparseable -> refuse
  const allZero = (from: number, to: number) => b.slice(from, to).every((x) => x === 0);
  if (allZero(0, 15) && (b[15] === 0 || b[15] === 1)) return true; // :: and ::1
  if (allZero(0, 10) && b[10] === 0xff && b[11] === 0xff) return true; // ::ffff:0:0/96 IPv4-mapped (any)
  if (allZero(0, 12)) return true; // ::/96 IPv4-compatible (deprecated)
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && allZero(4, 12)) return isPrivateIPv4(b.slice(12)); // NAT64
  if ((b[0] & 0xfe) === 0xfc) return true; // fc00::/7 unique local
  if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return true; // fe80::/10 link-local
  if (b[0] === 0xfe && (b[1] & 0xc0) === 0xc0) return true; // fec0::/10 site-local
  if (b[0] === 0xff) return true; // multicast
  if (b[0] === 0x20 && b[1] === 0x02) return isPrivateIPv4(b.slice(2, 6)); // 6to4 embeds an IPv4
  return false;
}


/** Syntax-level checks shared by every fetcher: scheme, credentials, obviously internal host names, literal IPs. Returns the URL and (for literals) its address. */
export function checkUrlSyntax(source: string): { url: URL; host: string; literal: boolean } {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    throw new UnsafeUrlError('Invalid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UnsafeUrlError();
  if (url.username || url.password) throw new UnsafeUrlError();
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new UnsafeUrlError();
  const literal = isIPLiteral(host);
  if (literal && isPrivateAddress(host)) throw new UnsafeUrlError();
  return { url, host, literal };
}
