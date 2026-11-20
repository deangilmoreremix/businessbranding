import { describe, expect, it } from 'vitest';
import { computeLibraryStats, formatBytes, formatDuration } from '@/lib/library-stats';

const blob = (n: number) => new Blob([new Uint8Array(n)]);
const NOW = new Date('2026-11-20T15:00:00').getTime();

describe('library stats are computed from real items only', () => {
  it('is all zeros for an empty library (no invented numbers)', () => {
    expect(computeLibraryStats([], 0, NOW)).toEqual({ total: 0, images: 0, audio: 0, generatedToday: 0, storageBytes: 0, audioSeconds: 0, analyses: 0 });
  });
  it('counts kinds, today, bytes and audio seconds (ignoring bad durations)', () => {
    const y = NOW - 36 * 3600_000;
    const s = computeLibraryStats([
      { kind: 'image', blob: blob(1000), createdAt: NOW - 1000 },
      { kind: 'audio', blob: blob(2000), createdAt: NOW - 2000, meta: { durationSec: 90 } },
      { kind: 'audio', blob: blob(500), createdAt: y, meta: { durationSec: 'x' } },
      { kind: 'other', blob: blob(10), createdAt: y }
    ], 3, NOW);
    expect(s).toEqual({ total: 4, images: 1, audio: 2, generatedToday: 2, storageBytes: 3510, audioSeconds: 90, analyses: 3 });
  });
  it('formats sizes and durations', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 ** 2)).toBe('5.0 MB');
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(5400)).toBe('1.5 h');
  });
});
