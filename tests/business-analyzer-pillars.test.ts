import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteBusinessAnalysis, getBusinessAnalyses, getBusinessAnalysis, hostnameOf, saveBusinessAnalysis, updateBusinessAnalysis } from '@/lib/services/business-analyzer';
import { levelFor, splitPillars } from '@/lib/services/pillar-levels';
import { resetStoreForTests } from '@/lib/local/store';

const links = { facebook: '', twitter: '', instagram: '', linkedin: '' };
const sample = (url: string) => ({ businessName: hostnameOf(url), industry: '', websiteUrl: url, socialLinks: links, analysisResults: { healthScore: 80 } });

beforeEach(() => resetStoreForTests());

describe('business analyses (IndexedDB)', () => {
  it('saves, lists newest first, reads, updates and deletes', async () => {
    const a = await saveBusinessAnalysis(sample('https://www.one.example/path'));
    await new Promise((r) => setTimeout(r, 3));
    const b = await saveBusinessAnalysis(sample('https://two.example'));
    expect(a.businessName).toBe('one.example');
    expect((await getBusinessAnalyses()).map((x) => x.id)).toEqual([b.id, a.id]);
    expect((await getBusinessAnalysis(a.id))!.analysisResults.healthScore).toBe(80);
    const upd = await updateBusinessAnalysis(a.id, { industry: 'Coffee', id: 999 as any });
    expect(upd!.industry).toBe('Coffee');
    expect(upd!.id).toBe(a.id); // id and createdAt are immutable
    await deleteBusinessAnalysis(a.id);
    expect(await getBusinessAnalysis(a.id)).toBeNull();
    expect(await updateBusinessAnalysis(12345, { industry: 'x' })).toBeNull();
  });

  it('keeps only the newest 25', async () => {
    for (let i = 0; i < 27; i++) {
      await saveBusinessAnalysis(sample(`https://s${i}.example`));
      await new Promise((r) => setTimeout(r, 2));
    }
    const all = await getBusinessAnalyses();
    expect(all).toHaveLength(25);
    expect(all[0].websiteUrl).toBe('https://s26.example');
  });

  it('derives a hostname from loose input', () => {
    expect(hostnameOf('acme.com')).toBe('acme.com');
    expect(hostnameOf('not a url at all')).toBe('not a url at all');
  });
});

describe('pillar levels', () => {
  it('bands scores', () => {
    expect(levelFor(0.9)).toBe('strong');
    expect(levelFor(0.75)).toBe('strong');
    expect(levelFor(0.6)).toBe('fair');
    expect(levelFor(0.2)).toBe('weak');
  });
  it('sorts weakest first and reports missing pillars and the average', () => {
    const r = splitPillars([{ name: 'B', score: 0.8 }, { name: 'A', score: 0.4 }], ['A', 'B', 'C']);
    expect(r.sorted.map((p) => p.name)).toEqual(['A', 'B']);
    expect(r.missing).toEqual(['C']);
    expect(r.average).toBeCloseTo(0.6);
    expect(splitPillars([], ['A']).average).toBeNull(); // no data is not 0%
    expect(splitPillars([{ name: 'A', score: null }], ['A']).missing).toEqual(['A']);
  });
});
