import { describe, expect, it } from 'vitest';
import { estimateBackground, extractPalette, fitWithin, readableTextColor, removeSolidBackground, type PixelBuffer } from '@/lib/local/image-utils';

function make(w: number, h: number, fill: (x: number, y: number) => [number, number, number]): PixelBuffer {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      data.set([r, g, b, 255], (y * w + x) * 4);
    }
  return { data, width: w, height: h };
}
const alpha = (img: PixelBuffer, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3];

describe('removeSolidBackground', () => {
  // white background, red square in the middle with a white "hole" inside it
  const scene = () =>
    make(20, 20, (x, y) => {
      const inSquare = x >= 5 && x < 15 && y >= 5 && y < 15;
      const inHole = x >= 9 && x < 11 && y >= 9 && y < 11;
      if (inHole) return [255, 255, 255];
      return inSquare ? [255, 0, 0] : [255, 255, 255];
    });

  it('clears the border-connected background and keeps the subject', () => {
    const img = removeSolidBackground(scene(), { tolerance: 30, feather: 0 });
    expect(alpha(img, 0, 0)).toBe(0);
    expect(alpha(img, 19, 19)).toBe(0);
    expect(alpha(img, 7, 7)).toBe(255);
  });

  it('keeps interior regions of the background colour (not connected to the border)', () => {
    const img = removeSolidBackground(scene(), { tolerance: 30, feather: 0 });
    expect(alpha(img, 9, 9)).toBe(255);
  });

  it('estimates the background from the corners', () => {
    expect(estimateBackground(scene())).toEqual([255, 255, 255]);
  });

  it('feathers pixels just outside the tolerance', () => {
    const img = make(3, 1, (x) => (x === 0 ? [255, 255, 255] : x === 1 ? [235, 235, 235] : [255, 255, 255]));
    removeSolidBackground(img, { tolerance: 10, feather: 40, background: [255, 255, 255] });
    const a = alpha(img, 1, 0); // distance ~34.6 -> partially transparent
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(255);
  });
});

describe('extractPalette', () => {
  it('finds the dominant colours, most common first', () => {
    const img = make(10, 10, (x) => (x < 7 ? [0, 0, 255] : [255, 0, 0]));
    const palette = extractPalette(img, 2);
    expect(palette[0]).toBe('#0000ff');
    expect(palette[1]).toBe('#ff0000');
  });
  it('ignores transparent pixels and handles empty images', () => {
    const img = make(2, 2, () => [10, 10, 10]);
    img.data.fill(0);
    expect(extractPalette(img)).toEqual([]);
  });
});

describe('helpers', () => {
  it('readableTextColor picks contrasting text', () => {
    expect(readableTextColor('#ffffff')).toBe('#000000');
    expect(readableTextColor('#101010')).toBe('#ffffff');
  });
  it('fitWithin never upscales', () => {
    expect(fitWithin(2000, 1000, 500, 500)).toEqual({ width: 500, height: 250, scale: 0.25 });
    expect(fitWithin(100, 50, 500, 500).scale).toBe(1);
  });
});
