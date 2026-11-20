/** Subresource-integrity helpers for code loaded from a CDN at runtime. */

/** Fetch `url` and resolve its bytes only if they match the SHA-384 `integrity` value (the browser enforces it). */
export async function fetchVerified(url: string, integrity: string): Promise<Blob> {
  const res = await fetch(url, { integrity, mode: 'cors', credentials: 'omit', cache: 'force-cache' });
  if (!res.ok) throw new Error(`Could not load ${url.split('/').pop()} (${res.status})`);
  return res.blob();
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
