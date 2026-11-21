'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ReportExportMenu } from '@/components/report-export-menu';
import { COMPETITIVE_SECTIONS, buildCompetitiveReportModel } from '@/lib/report-export';
import { formatFraction, formatPercent, toPercent } from '@/lib/format';
import type { BrandAnalysis } from '@/lib/services/brand-analyzer';

/**
 * Competitive view of a finished brand analysis. Every number comes from that analysis and carries its TRUE name:
 * brand health, market fit and uniqueness are not relabelled as market share / brand strength / competitive edge.
 */
export function CompetitiveAnalysis({ analysis }: { analysis: Pick<BrandAnalysis, 'healthScore' | 'marketFit' | 'uniquenessScore' | 'competitors'> }) {
  const measures = [
    { name: 'Brand health', value: toPercent(analysis.healthScore), text: formatPercent(analysis.healthScore, 'Not measured') },
    { name: 'Market fit', value: toPercent(analysis.marketFit), text: formatFraction(analysis.marketFit, 0, 'Not measured') },
    { name: 'Uniqueness', value: toPercent(analysis.uniquenessScore), text: formatFraction(analysis.uniquenessScore, 0, 'Not measured') }
  ];
  const competitors = analysis.competitors ?? [];

  return (
    <Card className="p-6" data-testid="competitive-analysis">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Competitive Analysis</h2>
          <p className="text-muted-foreground">Scores and competitors from your brand analysis</p>
        </div>
        <ReportExportMenu
          sections={COMPETITIVE_SECTIONS}
          buildModel={(ids) => buildCompetitiveReportModel(analysis, ids)}
          filenameBase="competitive-analysis"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {measures.map((m) => (
          <Card key={m.name} className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{m.name}</span>
              <span className="font-medium" data-testid={m.value === null ? 'metric-unmeasured' : 'metric-value'}>{m.text}</span>
            </div>
            <Progress value={m.value === null ? 0 : m.value} className="h-1" />
          </Card>
        ))}
      </div>

      <h3 className="font-medium mb-3">Competitors</h3>
      {competitors.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="no-competitors">No competitors were returned for this analysis.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map((c) => (
            <Card key={c.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{c.name}</span>
                {c.marketPosition && <Badge variant="outline">{c.marketPosition}</Badge>}
              </div>
              <p className="text-sm"><span className="text-muted-foreground">Strengths: </span>{c.strengths?.length ? c.strengths.join('; ') : 'Not measured'}</p>
              <p className="text-sm"><span className="text-muted-foreground">Weaknesses: </span>{c.weaknesses?.length ? c.weaknesses.join('; ') : 'Not measured'}</p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
