'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, HelpCircle, Zap } from 'lucide-react';
import { BRAND_PILLARS } from '@/lib/services/brand-analyzer';
import { levelFor, splitPillars, type PillarLevel as Level } from '@/lib/services/pillar-levels';

interface PillarScore {
  name: string;
  /** 0-1 */
  score: number | null;
  insights: string[];
}

interface BrandPillarBreakdownProps {
  pillarScores: PillarScore[];
  onImprovementSelected?: (name: string) => void;
}

const LEVEL_UI: Record<Level, { label: string; badge: string; bar: string; Icon: typeof CheckCircle }> = {
  strong: { label: 'Strong', badge: 'bg-green-500/15 text-green-500', bar: '[&>div]:bg-green-500', Icon: CheckCircle },
  fair: { label: 'Needs work', badge: 'bg-amber-500/15 text-amber-500', bar: '[&>div]:bg-amber-500', Icon: HelpCircle },
  weak: { label: 'Weak', badge: 'bg-red-500/15 text-red-500', bar: '[&>div]:bg-red-500', Icon: AlertTriangle }
};

const INITIAL_VISIBLE = 8;

/** Breakdown of the 20 brand pillars: weakest first, expandable insights, and an improvement action per pillar. */
export default function BrandPillarBreakdownClient({ pillarScores, onImprovementSelected }: BrandPillarBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { rows, missing, average } = useMemo(() => {
    const { sorted, missing: m, average: avg } = splitPillars(pillarScores, BRAND_PILLARS);
    return { rows: sorted, missing: m, average: avg };
  }, [pillarScores]);

  const visible = showAll ? rows : rows.slice(0, INITIAL_VISIBLE);
  const counts = { strong: 0, fair: 0, weak: 0 } as Record<Level, number>;
  rows.forEach((r) => counts[levelFor(r.score)]++);

  return (
    <Card className="p-6" data-testid="pillar-breakdown">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xl font-semibold">Brand Pillar Breakdown</h3>
          <p className="text-sm text-muted-foreground">Weakest pillars first, so you know where to focus.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{average === null ? 'Not measured' : `${Math.round(average * 100)}%`}</p>
          <p className="text-xs text-muted-foreground">{average === null ? 'no pillar scores were returned' : `average across ${rows.length} pillars`}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(counts) as Level[]).map((l) => (
          <Badge key={l} variant="outline" className={LEVEL_UI[l].badge}>{counts[l]} {LEVEL_UI[l].label.toLowerCase()}</Badge>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Run a brand analysis to see your pillar scores.</p>
      ) : (
        <ScrollArea className={showAll ? 'h-[560px]' : undefined}>
          <ul className="space-y-3">
            {visible.map((p) => {
              const level = levelFor(p.score);
              const ui = LEVEL_UI[level];
              const open = expanded === p.name;
              return (
                <li key={p.name} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <ui.Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <button type="button" className="flex-1 text-left font-medium" onClick={() => setExpanded(open ? null : p.name)} aria-expanded={open}>
                      {p.name}
                    </button>
                    <Badge variant="outline" className={ui.badge}>{Math.round(p.score * 100)}%</Badge>
                    <button type="button" aria-label={open ? 'Hide insights' : 'Show insights'} onClick={() => setExpanded(open ? null : p.name)}>
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  <Progress value={Math.round(p.score * 100)} className={`mt-2 h-2 ${ui.bar}`} />
                  {open && (
                    <div className="mt-3 space-y-2">
                      {p.insights.length ? (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {p.insights.map((i, n) => <li key={n}>{i}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No insights recorded for this pillar.</p>
                      )}
                      {level !== 'strong' && onImprovementSelected && (
                        <Button type="button" size="sm" variant="outline" onClick={() => onImprovementSelected(p.name)}>
                          <Zap className="h-4 w-4 mr-1" />Improve this pillar
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      {rows.length > INITIAL_VISIBLE && (
        <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${rows.length} pillars`}
        </Button>
      )}

      {missing.length > 0 && rows.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">Not yet analysed: {missing.join(', ')}.</p>
      )}
    </Card>
  );
}
