/**
 * Animated GIF previews with gifenc (MIT, pure JS; loaded lazily).
 * Used for brand asset previews: cycle through generated variations or edit steps.
 */
export interface GifFrame {
  data: Uint8ClampedArray; // RGBA
  width: number;
  height: number;
}

/** Encode same-sized RGBA frames to a GIF. `delayMs` is the time each frame is shown. */
export async function framesToGif(frames: GifFrame[], delayMs = 800): Promise<Uint8Array> {
  if (!frames.length) throw new Error('At least one frame is required');
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const { width, height } = frames[0];
  const gif = GIFEncoder();
  for (const f of frames) {
    if (f.width !== width || f.height !== height) throw new Error('All frames must have the same size');
    const palette = quantize(f.data, 256);
    gif.writeFrame(applyPalette(f.data, palette), width, height, { palette, delay: delayMs });
  }
  gif.finish();
  return gif.bytes();
}

/** Draw images (contain-fit on a white background) into equal frames of `size` x `size`. Browser only. */
export async function imagesToFrames(urls: string[], size = 360): Promise<GifFrame[]> {
  const frames: GifFrame[] = [];
  for (const url of urls) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not load an image for the GIF'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const s = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    ctx.drawImage(img, (size - img.naturalWidth * s) / 2, (size - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    frames.push({ data: ctx.getImageData(0, 0, size, size).data, width: size, height: size });
  }
  return frames;
}
