/** Subresource-integrity helpers for code and models loaded from a CDN at runtime. */

export class IntegrityError extends Error {
  constructor(public file: string) {
    super(`The downloaded file "${file}" did not match its expected hash and was refused.`);
    this.name = 'IntegrityError';
  }
}

const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** SRI-format digest ("sha384-<base64>") of some bytes. */
export async function sriDigest(bytes: ArrayBuffer, algo: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-384'): Promise<string> {
  return `${algo.replace('SHA-', 'sha')}-${toBase64(await crypto.subtle.digest(algo, bytes))}`;
}

/**
 * Fetch `url` and resolve its bytes ONLY if their SHA-384 equals `integrity`; a mismatch always raises IntegrityError.
 */
export async function fetchVerifiedBytes(url: string, integrity: string, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  const file = url.split('/').pop() || url;
  let res: Response;
  try {
    // No `integrity` fetch option on purpose: browsers report a mismatch as a bare "Failed to fetch" that cannot be told apart from being
    // offline. The hash is compared explicitly below, so a mismatch is always an IntegrityError.
    res = await fetchImpl(url, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
  } catch (e) {
    // browsers reject a hash mismatch as a network-style TypeError mentioning "integrity" / "digest"
    if (/integrity|digest/i.test((e as Error)?.message ?? '')) throw new IntegrityError(file);
    throw e;
  }
  if (!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
  const bytes = await res.arrayBuffer();
  if ((await sriDigest(bytes)) !== integrity) throw new IntegrityError(file);
  return bytes;
}

export async function fetchVerified(url: string, integrity: string, fetchImpl: typeof fetch = fetch): Promise<Blob> {
  return new Blob([await fetchVerifiedBytes(url, integrity, fetchImpl)]);
}

/** Import an ES module from a CDN, after verifying its bytes against `integrity`. */
export async function importVerifiedModule<T = any>(url: string, integrity: string): Promise<T> {
  const blob = await fetchVerified(url, integrity);
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: 'text/javascript' }));
  try {
    return await import(/* webpackIgnore: true */ objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
