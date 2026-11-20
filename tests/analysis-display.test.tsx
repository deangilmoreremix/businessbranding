import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatDate, formatPercent, toPercent } from '@/lib/format';
import { normalizeAnalysis } from '@/lib/services/brand-analyzer';
import { headerTiles } from '@/lib/brand-metrics';
import { CompetitiveAnalysis } from '@/components/competitive-analysis';

describe('score scales', () => {
  it('toPercent accepts fractions and percentages, rejects junk, clamps', () => {
    expect(toPercent(0.5)).toBe(50);
    expect(toPercent(1)).toBe(100);
    expect(toPercent(0)).toBe(0);
    expect(toPercent(72)).toBe(72);
    expect(toPercent('0.25')).toBe(25);
    expect(toPercent(250)).toBe(100);
    expect(toPercent(-5)).toBe(0);
    for (const bad of [NaN, Infinity, null, undefined, '', 'abc', {}, []]) expect(toPercent(bad as any)).toBeNull();
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(undefined)).toBe('—');
  });
  it('formatDate never prints "Invalid Date"', () => {
    expect(formatDate('not a date')).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('2026-11-20T10:00:00Z')).toMatch(/2026/);
  });
});

describe('normalizeAnalysis handles odd model output', () => {
  const odd: any = {
    healthScore: 0.5, marketFit: 78, uniquenessScore: '0.62', lastUpdated: 'yesterday-ish', monitoringStatus: 'error',
    implementationStatus: { completed: 2.6, inProgress: '1', planned: -3, total: 'x', progressPercentage: 0.5 },
    growthTrajectory: { current: 0.4, projected: 55, trend: 'up', timeframe: '12 months' }
  };
  const n = normalizeAnalysis(odd);
  it('puts every score on one scale', () => {
    expect(n.healthScore).toBe(50);
    expect(n.marketFit).toBeCloseTo(0.78);
    expect(n.uniquenessScore).toBeCloseTo(0.62);
    expect(n.implementationStatus).toMatchObject({ completed: 3, inProgress: 1, planned: 0, total: 0, progressPercentage: 50 });
    expect(n.growthTrajectory).toMatchObject({ current: 40, projected: 55 });
  });
  it('drops an invalid timestamp and a bogus "error" monitoring status', () => {
    expect(n.lastUpdated).toBeUndefined();
    expect(n.monitoringStatus).toBeUndefined();
    expect(normalizeAnalysis({ lastUpdated: '2026-11-20T10:00:00Z', monitoringStatus: 'active' } as any)).toMatchObject({ monitoringStatus: 'active' });
  });
  it('survives an empty object', () => {
    expect(normalizeAnalysis({} as any)).toMatchObject({ healthScore: 0, marketFit: 0, uniquenessScore: 0 });
  });
  it('header tiles show placeholders, then real values on one scale', () => {
    expect(headerTiles(null).map((t) => t.value)).toEqual(['—', '—', '—', '—']);
    const t = headerTiles({ ...n, competitors: [{ name: 'A', score: 90 }, { name: 'B', score: 20 }] } as any);
    expect(t[0].value).toBe('50%');
    expect(t[1].value).toBe('78%');
    expect(t[2].value).toBe('#2');
  });
});

describe('CompetitiveAnalysis shows only measured values', () => {
  it('renders "Not measured" instead of stock numbers when data is missing', () => {
    const html = renderToStaticMarkup(<CompetitiveAnalysis analysis={{ marketShare: 0.4, brandStrength: 'n/a' }} />);
    expect(html).toContain('Not measured');
    expect(html).toContain('40%'); // 0.4 -> 40%
    for (const fake of ['85%', '78%', '82%', '90%', '88%', '25%', '80%', '75%', '92%']) expect(html).not.toContain(`>${fake}<`);
  });
  it('renders without any analysis at all', () => {
    const html = renderToStaticMarkup(<CompetitiveAnalysis analysis={undefined} />);
    expect(html).not.toMatch(/\d+%</);
    expect(html).toContain('Not measured');
  });
});
