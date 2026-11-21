import { describe, expect, it } from 'vitest';
import { computePeaks, encodeWav16, formatTime, trimChannels } from '@/lib/local/audio';
import { framesToGif } from '@/lib/local/gif';
import { wavToPcm } from '../supabase/functions/_shared/openai-core.ts';

describe('computePeaks', () => {
  it('returns min/max per bucket', () => {
    const peaks = computePeaks(new Float32Array([0, 0.5, -0.25, 1, -1, 0.1, 0, 0]), 4);
    expect(peaks).toHaveLength(4);
    expect(peaks[0]).toEqual({ min: 0, max: 0.5 });
    expect(peaks[1]).toEqual({ min: -0.25, max: 1 });
    expect(peaks[2].min).toBe(-1);
    expect(peaks[2].max).toBeCloseTo(0.1, 5);
  });
  it('handles empty input', () => {
    expect(computePeaks(new Float32Array(0), 3)).toEqual([{ min: 0, max: 0 }, { min: 0, max: 0 }, { min: 0, max: 0 }]);
  });
});

describe('trimChannels', () => {
  const ch = [Float32Array.from({ length: 10 }, (_, i) => i), Float32Array.from({ length: 10 }, (_, i) => -i)];
  it('cuts every channel to the range', () => {
    const [l, r] = trimChannels(ch, 10, 0.2, 0.5);
    expect(Array.from(l)).toEqual([2, 3, 4]);
    expect(Array.from(r)).toEqual([-2, -3, -4]);
  });
  it('clamps out-of-range and inverted values', () => {
    expect(trimChannels(ch, 10, -5, 99)[0]).toHaveLength(10);
    expect(trimChannels(ch, 10, 0.8, 0.2)[0]).toHaveLength(0);
  });
});

describe('encodeWav16', () => {
  it('writes a valid mono WAV that the shared parser can read back', () => {
    const wav = encodeWav16([new Float32Array([0, 0.5, -0.5, 1, -1])], 16000);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
    const { pcm, sampleRate } = wavToPcm(wav);
    expect(sampleRate).toBe(16000);
    const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    expect(view.getInt16(2, true)).toBe(16383); // 0.5 * 32767, truncated
    expect(view.getInt16(4, true)).toBe(-0x4000);
    expect(view.getInt16(8, true)).toBe(-0x8000);
  });
  it('interleaves stereo', () => {
    const wav = encodeWav16([new Float32Array([1]), new Float32Array([-1])], 8000);
    const v = new DataView(wav.buffer);
    expect(v.getUint16(22, true)).toBe(2);
    expect(v.getInt16(44, true)).toBe(0x7fff);
    expect(v.getInt16(46, true)).toBe(-0x8000);
  });
});

describe('formatTime', () => {
  it('formats m:ss.s', () => {
    expect(formatTime(65.43)).toBe('1:05.4');
    expect(formatTime(-1)).toBe('0:00.0');
  });
});

describe('framesToGif', () => {
  const frame = (r: number, g: number, b: number) => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < 16; i++) data.set([r, g, b, 255], i * 4);
    return { data, width: 4, height: 4 };
  };
  it('produces a GIF89a with one image descriptor per frame', async () => {
    const gif = await framesToGif([frame(255, 0, 0), frame(0, 255, 0), frame(0, 0, 255)], 300);
    expect(String.fromCharCode(...gif.slice(0, 6))).toBe('GIF89a');
    expect(gif[gif.length - 1]).toBe(0x3b); // trailer
    expect(gif.filter((b) => b === 0x2c).length).toBeGreaterThanOrEqual(3);
  });
  it('rejects empty input and mismatched frame sizes', async () => {
    await expect(framesToGif([])).rejects.toThrow();
    await expect(framesToGif([frame(0, 0, 0), { data: new Uint8ClampedArray(4), width: 1, height: 1 }])).rejects.toThrow(/same size/);
  });
});
