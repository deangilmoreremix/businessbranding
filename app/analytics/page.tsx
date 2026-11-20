'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponsiveLine } from '@nivo/line';
import { Activity, BarChart, Brain, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LibraryStatTiles } from '@/components/library-stat-tiles';
import { getBusinessAnalyses, type BusinessAnalysis } from '@/lib/services/business-analyzer';
import { loadUsage, type Usage } from '@/lib/client/usage';
import { toPercent, formatDate } from '@/lib/format';

/**
 * Analytics of YOUR work: the brand-health scores of the analyses you saved (kept in this browser) and your own AI usage (from the
 * key-free usage log). There is no website/social traffic data source, so none is shown.
 */
export default function AnalyticsPage() {
  const [analyses, setAnalyses] = useState<BusinessAnalysis[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);

  useEffect(() => {
    getBusinessAnalyses().then(setAnalyses).catch(() => setAnalyses([]));
    loadUsage().then((u) => { setUsage(u); setUsageLoaded(true); });
  }, []);

  const points = (analyses ?? [])
    .slice()
    .reverse()
    .map((a) => ({ a, health: toPercent(a.analysisResults?.healthScore) }))
    .filter((p): p is { a: BusinessAnalysis; health: number } => p.health !== null);
  const latest = points.length ? points[points.length - 1] : null;
  const chart = [{ id: 'Brand health', data: points.map((p) => ({ x: formatDate(p.a.createdAt), y: Math.round(p.health) })) }];

  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="text-sm px-3 mb-2">ANALYTICS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Your analytics</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Brand-health scores from your saved analyses and your own AI usage.</p>
        </div>

        <LibraryStatTiles
          loading={analyses === null || !usageLoaded}
          tiles={[
            { title: 'Saved analyses', value: analyses?.length ?? 0, icon: BarChart, hint: analyses && analyses.length === 0 ? 'None yet' : 'In this browser' },
            { title: 'Latest brand health', value: latest ? `${Math.round(latest.health)}%` : '—', icon: Brain, hint: latest ? formatDate(latest.a.createdAt) : 'Run an analysis' },
            { title: 'AI requests (30 days)', value: usage ? usage.requests : '—', icon: Activity, hint: usage ? (usage.failed ? `${usage.failed} failed` : 'None failed') : 'Sign in to see usage' },
            { title: 'Tokens (30 days)', value: usage ? (usage.inputTokens + usage.outputTokens).toLocaleString() : '—', icon: Cpu, hint: usage ? `${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out` : undefined }
          ]}
        />

        <Card className="p-6 mb-8" data-testid="health-trend">
          <h2 className="text-xl font-semibold mb-4">Brand health over time</h2>
          {points.length === 0 ? (
            <div className="text-center py-10" data-testid="analytics-empty">
              <p className="text-muted-foreground mb-4">No saved analyses yet. Run one on Brand Strategy and its score will appear here.</p>
              <Link href="/brand-strategy"><Button>Run an analysis</Button></Link>
            </div>
          ) : points.length === 1 ? (
            <p className="text-muted-foreground">One analysis so far ({formatDate(points[0].a.createdAt)}: {Math.round(points[0].health)}%). A trend line appears after a second analysis.</p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveLine data={chart} margin={{ top: 20, right: 30, bottom: 50, left: 50 }} xScale={{ type: 'point' }} yScale={{ type: 'linear', min: 0, max: 100 }} pointSize={8} useMesh axisBottom={{ tickRotation: -30 }} />
            </div>
          )}
        </Card>

        {usage && Object.keys(usage.byFeature).length > 0 && (
          <Card className="p-6" data-testid="usage-by-feature">
            <h2 className="text-xl font-semibold mb-4">AI requests by feature (30 days)</h2>
            <ul className="divide-y">
              {Object.entries(usage.byFeature).sort((a, b) => b[1] - a[1]).map(([feature, n]) => (
                <li key={feature} className="py-2 flex justify-between text-sm"><span className="capitalize">{feature.replace(/[-_]/g, ' ')}</span><span className="font-medium">{n}</span></li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
