'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceInterface } from '@/components/voice-interface';
import { LibraryStatTiles } from '@/components/library-stat-tiles';
import { formatBytes, formatDuration, loadLibraryStats, type LibraryStats } from '@/lib/library-stats';
import { Clock, FileAudio, HardDrive, Plus, RefreshCw, Sparkles } from 'lucide-react';

export default function VoiceContentPage() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { setStats(await loadLibraryStats()); } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const s = stats;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2">VOICE CONTENT</Badge>
            <h1 className="text-3xl font-bold gradient-text">Voice Content Studio</h1>
            <p className="text-muted-foreground mt-1">Create and manage your brand&apos;s voice content</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => document.getElementById('voice-studio')?.scrollIntoView({ behavior: 'smooth' })}>
              <Plus className="mr-2 h-4 w-4" />New Content
            </Button>
          </div>
        </div>

        <LibraryStatTiles loading={loading} tiles={[
          { title: 'Saved audio', value: s ? s.audio : '—', icon: FileAudio, hint: s && s.audio === 0 ? 'Nothing saved yet' : 'On this device' },
          { title: 'Created today', value: s ? s.generatedToday : '—', icon: Sparkles },
          { title: 'Total duration', value: s ? formatDuration(s.audioSeconds) : '—', icon: Clock },
          { title: 'Storage used', value: s ? formatBytes(s.storageBytes) : '—', icon: HardDrive, hint: 'Browser storage' }
        ]} />

        <Card className="p-6 mb-8" id="voice-studio">
          <VoiceInterface />
        </Card>
      </div>
    </div>
  );
}
