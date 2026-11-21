import { readableTextColor } from './image-utils';

/**
 * PNG export of brand kits, palettes and social mockups.
 *  - Canvas API drawing (renderBrandKit / renderPalette / renderSocialPost): deterministic, no DOM needed.
 *  - html-to-image (exportNodeToPng): snapshots any DOM node; the library is imported lazily on first use.
 */

type Ctx = CanvasRenderingContext2D;
export type DrawableImage = CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };

export interface KitOptions {
  width: number;
  height: number;
  name: string;
  tagline?: string;
  palette: string[];
  logo?: DrawableImage;
  font?: string;
}

const FONT = 'Inter, system-ui, -apple-system, Segoe UI, sans-serif';

function imageSize(img: DrawableImage) {
  return { w: (img.naturalWidth ?? img.width ?? 0) as number, h: (img.naturalHeight ?? img.height ?? 0) as number };
}

function drawContained(ctx: Ctx, img: DrawableImage, x: number, y: number, w: number, h: number) {
  const { w: iw, h: ih } = imageSize(img);
  if (!iw || !ih) return;
  const s = Math.min(w / iw, h / ih);
  ctx.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
}

function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Palette strip: one labelled swatch per colour. */
export function renderPalette(ctx: Ctx, opts: { x: number; y: number; width: number; height: number; palette: string[]; font?: string }) {
  const { x, y, width, height, palette } = opts;
  if (!palette.length) return;
  const sw = width / palette.length;
  palette.forEach((hex, i) => {
    ctx.fillStyle = hex;
    ctx.fillRect(x + i * sw, y, sw, height);
    ctx.fillStyle = readableTextColor(hex);
    ctx.font = `600 ${Math.max(12, Math.round(height / 9))}px ${opts.font ?? FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(hex.toUpperCase(), x + i * sw + sw / 2, y + height - Math.round(height / 12));
  });
}

/** Brand kit sheet: name, tagline, logo and colour palette. */
export function renderBrandKit(ctx: Ctx, o: KitOptions) {
  const { width: W, height: H } = o;
  const font = o.font ?? FONT;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const pad = Math.round(W * 0.05);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(H * 0.08)}px ${font}`;
  ctx.fillText(o.name, pad, pad + Math.round(H * 0.08));
  if (o.tagline) {
    ctx.fillStyle = '#555555';
    ctx.font = `400 ${Math.round(H * 0.035)}px ${font}`;
    ctx.fillText(o.tagline, pad, pad + Math.round(H * 0.08) + Math.round(H * 0.06));
  }
  if (o.logo) drawContained(ctx, o.logo, W - pad - Math.round(W * 0.28), pad, Math.round(W * 0.28), Math.round(H * 0.38));

  renderPalette(ctx, { x: pad, y: Math.round(H * 0.55), width: W - pad * 2, height: Math.round(H * 0.33), palette: o.palette, font });
}

/** Square social media post mockup (1080x1080 by default): palette gradient, logo and a headline. */
export function renderSocialPost(ctx: Ctx, o: KitOptions & { headline: string }) {
  const { width: W, height: H } = o;
  const font = o.font ?? FONT;
  const [c1 = '#4f46e5', c2 = c1] = o.palette;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const text = readableTextColor(c1);
  if (o.logo) drawContained(ctx, o.logo, Math.round(W * 0.08), Math.round(H * 0.08), Math.round(W * 0.22), Math.round(H * 0.16));

  ctx.fillStyle = text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${Math.round(H * 0.09)}px ${font}`;
  const lines = wrapText(ctx, o.headline, W * 0.84);
  const lh = Math.round(H * 0.105);
  lines.forEach((line, i) => ctx.fillText(line, Math.round(W * 0.08), Math.round(H * 0.5) + i * lh));

  ctx.font = `600 ${Math.round(H * 0.035)}px ${font}`;
  ctx.fillText(o.name, Math.round(W * 0.08), Math.round(H * 0.92));
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));
}

/** Load an image from a URL for drawing; resolves null on failure so exports still succeed without a logo. */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Snapshot a DOM node to PNG with html-to-image (lazy). */
export async function exportNodeToPng(node: HTMLElement, opts: { pixelRatio?: number; backgroundColor?: string } = {}): Promise<Blob> {
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { pixelRatio: opts.pixelRatio ?? 2, backgroundColor: opts.backgroundColor });
  if (!blob) throw new Error('Could not render the preview to an image');
  return blob;
}
