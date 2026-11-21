'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentDashboard } from '@/components/content-dashboard';
import { LibraryStatTiles } from '@/components/library-stat-tiles';
import { formatBytes, loadLibraryStats, type LibraryStats } from '@/lib/library-stats';
import { getBusinessAnalyses, type BusinessAnalysis } from '@/lib/services/business-analyzer';
import { toPercent, formatDate } from '@/lib/format';
import { Brain, FileAudio, HardDrive, Image as ImageIcon, Plus, RefreshCw } from 'lucide-react';

/**
 * Dashboard of the user's own saved work: files kept in this browser (IndexedDB), saved analyses, and content rows stored in their
 * account. Everything shown is read from those stores; nothing is simulated, and there is no "live" indicator because there is no
 * live data source.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [analyses, setAnalyses] = useState<BusinessAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([loadLibraryStats(), getBusinessAnalyses().catch(() => [])]);
      setStats(s);
      setAnalyses(a);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const latest = analyses[0];
  const health = latest ? toPercent(latest.analysisResults?.healthScore) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Badge className="mb-2">DASHBOARD</Badge>
            <h1 className="text-3xl font-bold gradient-text">Content Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your saved audio, images and analyses{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Link href="/dashboard/voice-content"><Button className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="mr-2 h-4 w-4" />New Content</Button></Link>
          </div>
        </div>

        <LibraryStatTiles loading={loading} tiles={[
          { title: 'Saved audio', value: stats ? stats.audio : '—', icon: FileAudio, hint: stats && stats.audio === 0 ? 'Nothing saved yet' : 'On this device' },
          { title: 'Saved images', value: stats ? stats.images : '—', icon: ImageIcon },
          { title: 'Latest brand health', value: health === null ? '—' : `${Math.round(health)}%`, icon: Brain, hint: latest ? `From ${latest.businessName || 'your last analysis'}` : 'Run an analysis to see it' },
          { title: 'Storage used', value: stats ? formatBytes(stats.storageBytes) : '—', icon: HardDrive, hint: 'Browser storage' }
        ]} />

        <Card className="p-6" data-testid="saved-analyses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Saved analyses</h2>
            <Link href="/brand-strategy" className="text-sm underline">Run a new analysis</Link>
          </div>
          {analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="saved-analyses-empty">No analyses saved yet. Analyses you run on Brand Strategy appear here (kept in this browser).</p>
          ) : (
            <ul className="divide-y">
              {analyses.slice(0, 8).map((a) => {
                const h = toPercent(a.analysisResults?.healthScore);
                return (
                  <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{a.businessName || a.websiteUrl}</span>
                    <span className="text-muted-foreground">{formatDate(a.createdAt)}{h === null ? '' : ` · health ${Math.round(h)}%`}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <ContentDashboard />
      </div>
    </div>
  );
}
