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
    expect(n.growthTrajectory).toMatchObject({ current: 0.4, projected: 0.55 });
  });
  it('drops an invalid timestamp and a bogus "error" monitoring status', () => {
    expect(n.lastUpdated).toBeUndefined();
    expect(n.monitoringStatus).toBeUndefined();
    expect(normalizeAnalysis({ lastUpdated: '2026-11-20T10:00:00Z', monitoringStatus: 'active' } as any)).toMatchObject({ monitoringStatus: 'active' });
  });
  it('survives an empty object', () => {
    expect(normalizeAnalysis({} as any)).toMatchObject({ healthScore: null, marketFit: null, uniquenessScore: null });
  });
  it('header tiles show placeholders, then real values on one scale', () => {
    expect(headerTiles(null).map((t) => t.value)).toEqual(['—', '—', '—', '—']);
    const t = headerTiles({ ...n, competitors: [{ name: 'A', score: 90 }, { name: 'B', score: 20 }] } as any);
    expect(t[0].value).toBe('50%');
    expect(t[1].value).toBe('78%');
    expect(t[2].value).toBe('#2');
  });
});

describe('CompetitiveAnalysis shows only measured values under their TRUE names', () => {
  it('shows brand health / market fit / uniqueness (not relabelled as market share, strength or edge)', () => {
    const html = renderToStaticMarkup(<CompetitiveAnalysis analysis={{ healthScore: 72, marketFit: 0.4, uniquenessScore: null, competitors: [{ name: 'Rival', marketPosition: 'leader', strengths: ['Reach'], weaknesses: [], growthRate: 0 } as any] }} />);
    expect(html).toContain('Brand health');
    expect(html).toContain('Market fit');
    expect(html).toContain('Uniqueness');
    expect(html).toContain('>72%<');
    expect(html).toContain('>40%<');
    expect(html).toContain('Not measured'); // uniqueness is null
    for (const wrong of ['Market Share', 'Brand Strength', 'Competitive Edge']) expect(html).not.toContain(wrong);
    expect(html).toContain('Rival');
  });
  it('shows nothing invented when there is no data', () => {
    const html = renderToStaticMarkup(<CompetitiveAnalysis analysis={{ healthScore: null, marketFit: null, uniquenessScore: null, competitors: [] }} />);
    expect(html).not.toMatch(/>\d+%</);
    expect(html).toContain('No competitors were returned');
  });
});

import { GrowthTrajectoryCard } from '@/components/brand-analysis/growth-trajectory';
import { formatFraction } from '@/lib/format';

describe('growth trajectory is never double-scaled', () => {
  const show = (current: unknown, projected: unknown) => {
    const n: any = normalizeAnalysis({ growthTrajectory: { current, projected, trend: 'up', timeframe: '12 months' } } as any);
    return renderToStaticMarkup(<GrowthTrajectoryCard growth={n.growthTrajectory} />);
  };
  it('current = 0.5 (fraction) shows 50.0%', () => {
    const html = show(0.5, 0.6);
    expect(html).toContain('>50.0%<');
    expect(html).toContain('>60.0%<');
  });
  it('current = 50 (percentage) also shows 50.0%, never 5000.0%', () => {
    const html = show(50, 60);
    expect(html).toContain('>50.0%<');
    expect(html).toContain('>60.0%<');
    expect(html).not.toMatch(/\d{4,}\.\d%/);
  });
  it('keeps negative growth and renders placeholders for junk', () => {
    expect(show(-0.05, -5)).toContain('>-5.0%<');
    expect(show('abc', undefined)).toContain('>Not measured<'); // junk is shown as not measured, never an invented 0.0%
    expect(formatFraction(NaN)).toBe('—');
  });
  it('every normalised rate/score is a fraction in the analysis object', () => {
    const n: any = normalizeAnalysis({
      performanceMetrics: { engagement: { rate: 4.5 }, conversion: { rate: 0.03 }, roi: { score: 80 }, customerSatisfaction: { score: 0.9 }, brandLoyalty: { score: 70 } },
      marketAnalysis: { marketDynamics: { growthRate: 12 }, customerSegments: [{ segment: 'a', size: 40, growth: 0.1 }] },
      brandFactors: [{ name: 'x', score: 85 }], bestPractices: { dataCollection: { score: 60 } }
    } as any);
    expect(n.performanceMetrics.engagement.rate).toBeCloseTo(0.045);
    expect(n.performanceMetrics.roi.score).toBeCloseTo(0.8);
    expect(n.marketAnalysis.marketDynamics.growthRate).toBeCloseTo(0.12);
    expect(n.marketAnalysis.customerSegments[0]).toMatchObject({ size: 0.4, growth: 0.1 });
    expect(n.brandFactors[0].score).toBeCloseTo(0.85);
    expect(n.bestPractices.dataCollection.score).toBeCloseTo(0.6);
  });
});
