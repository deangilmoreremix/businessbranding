import type { BrandAnalysis } from '@/lib/services/brand-analyzer';

export interface HeaderTile { title: string; value: string }
const EMPTY = '\u2014'; // em dash: nothing measured yet

/**
 * Values for the four dashboard header tiles. Before an analysis exists every tile is the empty placeholder (never an invented
 * number); afterwards each value is derived from the analysis itself.
 */
export function headerTiles(a: BrandAnalysis | null | undefined): HeaderTile[] {
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const health = a && num(a.healthScore) ? `${Math.round(a.healthScore)}%` : EMPTY;
  const fit = a && num(a.marketFit) ? `${Math.round(a.marketFit * 100)}%` : EMPTY;

  // rank among the analysed competitors that carry a score on the same 0-100 scale as the health score
  let rank = EMPTY;
  if (a && num(a.healthScore)) {
    const scored = (a.competitors ?? []).filter((c) => num(c.score));
    if (scored.length) rank = `#${1 + scored.filter((c) => (c.score as number) > a.healthScore).length}`;
  }

  // projected growth relative to the current level
  let growth = EMPTY;
  const g = a?.growthTrajectory;
  if (g && num(g.current) && num(g.projected) && g.current > 0) {
    const pct = Math.round(((g.projected - g.current) / g.current) * 100);
    growth = `${pct >= 0 ? '+' : ''}${pct}%`;
  }
  return [
    { title: 'Brand Health Score', value: health },
    { title: 'Market Fit', value: fit },
    { title: 'Competitive Rank', value: rank },
    { title: 'Growth Rate', value: growth }
  ];
}
