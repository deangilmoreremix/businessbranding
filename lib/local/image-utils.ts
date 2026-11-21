/**
 * Pure, dependency-free image helpers (work on ImageData-like objects, so they run in the browser and in tests).
 */

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

type RGB = [number, number, number];

const dist = (a: RGB, b: RGB) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
const pixel = (img: PixelBuffer, x: number, y: number): RGB => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

/** Average colour of the four corners; used as the "background" colour guess. */
export function estimateBackground(img: PixelBuffer): RGB {
  const pts: [number, number][] = [[0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]];
  const cols = pts.map(([x, y]) => pixel(img, x, y));
  return [0, 1, 2].map((c) => Math.round(cols.reduce((s, p) => s + p[c], 0) / cols.length)) as RGB;
}

/**
 * Remove a (near-)solid background by flood-filling inward from the image border. Pixels connected to the border whose
 * colour is within `tolerance` (0-441) of the background become transparent; `feather` softens the edge by
 * partially clearing pixels just outside the tolerance. Interior areas of the same colour (e.g. a white eye on a white
 * background logo) are kept because they are not connected to the border.
 * Mutates and returns `img`.
 */
export function removeSolidBackground(img: PixelBuffer, opts: { tolerance?: number; feather?: number; background?: RGB } = {}): PixelBuffer {
  const { width: w, height: h, data } = img;
  const tolerance = opts.tolerance ?? 40;
  const feather = opts.feather ?? 20;
  const bg = opts.background ?? estimateBackground(img);
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];

  const push = (x: number, y: number) => {
    const idx = y * w + x;
    if (!seen[idx]) {
      seen[idx] = 1;
      stack.push(idx);
    }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % w;
    const y = (idx - x) / w;
    const d = dist(pixel(img, x, y), bg);
    if (d > tolerance + feather) continue;
    const alphaIndex = idx * 4 + 3;
    if (d <= tolerance) data[alphaIndex] = 0;
    else data[alphaIndex] = Math.round(Math.min(data[alphaIndex], ((d - tolerance) / feather) * 255));
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  return img;
}

const toHex = (c: RGB) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/**
 * Dominant-colour palette via k-means on a subsample (transparent pixels are ignored).
 * Deterministic: centroids are seeded from evenly spaced samples.
 */
export function extractPalette(img: PixelBuffer, count = 5): string[] {
  const samples: RGB[] = [];
  const step = Math.max(1, Math.floor((img.width * img.height) / 4000));
  for (let p = 0; p < img.width * img.height; p += step) {
    const i = p * 4;
    if (img.data[i + 3] < 128) continue;
    samples.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
  }
  if (samples.length === 0) return [];
  const k = Math.min(count, samples.length);
  let centroids: RGB[] = Array.from({ length: k }, (_, i) => samples[Math.floor((i * samples.length) / k)]);
  const sizes = new Array(k).fill(0);

  for (let iter = 0; iter < 12; iter++) {
    const sums: number[][] = centroids.map(() => [0, 0, 0]);
    sizes.fill(0);
    for (const s of samples) {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = dist(s, c);
        if (d < bestD) { bestD = d; best = i; }
      });
      sizes[best]++;
      sums[best][0] += s[0]; sums[best][1] += s[1]; sums[best][2] += s[2];
    }
    centroids = centroids.map((c, i) => (sizes[i] ? ([sums[i][0] / sizes[i], sums[i][1] / sizes[i], sums[i][2] / sizes[i]] as RGB) : c));
  }
  return centroids
    .map((c, i) => ({ hex: toHex(c), size: sizes[i] }))
    .sort((a, b) => b.size - a.size)
    .map((c) => c.hex);
}

/** Best text colour (black or white) for a background hex colour (WCAG relative luminance). */
export function readableTextColor(hex: string): '#000000' | '#ffffff' {
  const n = parseInt(hex.replace('#', ''), 16);
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.179 ? '#000000' : '#ffffff';
}

/** Fit (w,h) inside (maxW,maxH) preserving aspect ratio. */
export function fitWithin(w: number, h: number, maxW: number, maxH: number): { width: number; height: number; scale: number } {
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
}
