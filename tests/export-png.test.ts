import { describe, expect, it } from 'vitest';
import { renderBrandKit, renderPalette, renderSocialPost } from '@/lib/local/export-png';

/** Recording stand-in for CanvasRenderingContext2D. */
function recorder() {
  const calls: { fn: string; args: any[]; fill?: any }[] = [];
  const state: any = { fillStyle: '', font: '', textAlign: '', textBaseline: '' };
  const ctx: any = new Proxy(state, {
    get(t, p: string) {
      if (p in t) return t[p];
      if (p === 'measureText') return (s: string) => ({ width: s.length * 30 });
      if (p === 'createLinearGradient') return () => ({ addColorStop: (_o: number, c: string) => calls.push({ fn: 'stop', args: [c] }) });
      return (...args: any[]) => calls.push({ fn: p, args, fill: t.fillStyle });
    },
    set(t, p: string, v) { t[p] = v; return true; }
  });
  return { ctx, calls };
}

describe('renderPalette', () => {
  it('draws one swatch and one label per colour, with readable label colours', () => {
    const { ctx, calls } = recorder();
    renderPalette(ctx, { x: 0, y: 0, width: 300, height: 100, palette: ['#ffffff', '#000000', '#ff0000'] });
    const rects = calls.filter((c) => c.fn === 'fillRect');
    expect(rects).toHaveLength(3);
    expect(rects.map((r) => r.fill)).toEqual(['#ffffff', '#000000', '#ff0000']);
    expect(rects[1].args).toEqual([100, 0, 100, 100]);
    const labels = calls.filter((c) => c.fn === 'fillText');
    expect(labels.map((l) => l.args[0])).toEqual(['#FFFFFF', '#000000', '#FF0000']);
    expect(labels[0].fill).toBe('#000000');
    expect(labels[1].fill).toBe('#ffffff');
  });
  it('draws nothing for an empty palette', () => {
    const { ctx, calls } = recorder();
    renderPalette(ctx, { x: 0, y: 0, width: 100, height: 100, palette: [] });
    expect(calls).toHaveLength(0);
  });
});

describe('renderBrandKit', () => {
  it('draws the name, tagline and palette; logo is optional', () => {
    const { ctx, calls } = recorder();
    renderBrandKit(ctx, { width: 1600, height: 1000, name: 'Acme', tagline: 'Build better', palette: ['#111111', '#eeeeee'] });
    const texts = calls.filter((c) => c.fn === 'fillText').map((c) => c.args[0]);
    expect(texts).toContain('Acme');
    expect(texts).toContain('Build better');
    expect(texts).toContain('#111111'.toUpperCase());
    expect(calls.some((c) => c.fn === 'drawImage')).toBe(false);
  });
  it('draws the logo scaled to fit its box', () => {
    const { ctx, calls } = recorder();
    renderBrandKit(ctx, { width: 1600, height: 1000, name: 'A', palette: ['#000000'], logo: { naturalWidth: 400, naturalHeight: 100 } as any });
    const d = calls.find((c) => c.fn === 'drawImage')!;
    expect(d.args[3] / d.args[4]).toBeCloseTo(4);
  });
});

describe('renderSocialPost', () => {
  it('wraps the headline across lines and uses the first palette colours for the gradient', () => {
    const { ctx, calls } = recorder();
    renderSocialPost(ctx, { width: 1080, height: 1080, name: 'Acme', headline: 'Make your brand unforgettable with colour and voice', palette: ['#4f46e5', '#ec4899'] });
    expect(calls.filter((c) => c.fn === 'stop').map((c) => c.args[0])).toEqual(['#4f46e5', '#ec4899']);
    const lines = calls.filter((c) => c.fn === 'fillText').map((c) => c.args[0]);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.at(-1)).toBe('Acme');
  });
});
