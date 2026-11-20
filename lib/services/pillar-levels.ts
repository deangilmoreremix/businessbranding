export type PillarLevel = 'strong' | 'fair' | 'weak';

/** Score bands used by the Brand Pillar Breakdown (scores are 0-1). */
export const levelFor = (score: number): PillarLevel => (score >= 0.75 ? 'strong' : score >= 0.5 ? 'fair' : 'weak');

/** Weakest first; pillars missing from `analysed` are reported separately. */
export function splitPillars<T extends { name: string; score: number }>(analysed: T[], allNames: readonly string[]) {
  const have = new Set(analysed.map((p) => p.name));
  return {
    sorted: [...analysed].sort((a, b) => a.score - b.score),
    missing: allNames.filter((n) => !have.has(n)),
    average: analysed.length ? analysed.reduce((s, p) => s + p.score, 0) / analysed.length : 0
  };
}
