'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VisualIdentityAnalyzer } from '@/components/visual-identity-analyzer';
import { LibraryStatTiles } from '@/components/library-stat-tiles';
import { formatBytes, loadLibraryStats, type LibraryStats } from '@/lib/library-stats';
import { deleteAsset, listAssets, type AssetRecord } from '@/lib/local/store';
import {
  Palette,
  Image as ImageIcon,
  Download,
  Plus,
  LayoutGrid,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  Upload,
  Trash2,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VisualIdentityPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'audio'>('all');
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [assets, setAssets] = useState<{ record: AssetRecord; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [st, list] = await Promise.all([loadLibraryStats(), listAssets(60)]);
      setStats(st);
      setAssets((prev) => { prev.forEach((a) => URL.revokeObjectURL(a.url)); return list.map((record) => ({ record, url: URL.createObjectURL(record.blob) })); });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); return () => setAssets((prev) => { prev.forEach((a) => URL.revokeObjectURL(a.url)); return []; }); }, []);

  const remove = async (id: string) => { await deleteAsset(id); await refresh(); };
  const visible = assets.filter(({ record }) => (selectedFilter === 'all' || record.kind === selectedFilter) && record.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const s = stats;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2">VISUAL IDENTITY</Badge>
            <h1 className="text-3xl font-bold gradient-text">Visual Asset Studio</h1>
            <p className="text-muted-foreground mt-1">Create and manage your brand&apos;s visual identity</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={() => document.getElementById('asset-studio')?.scrollIntoView({ behavior: 'smooth' })}>
              <Plus className="mr-2 h-4 w-4" />New Asset
            </Button>
          </div>
        </div>

        <LibraryStatTiles loading={loading} tiles={[
          { title: 'Total assets', value: s?.total ?? 0, icon: ImageIcon, hint: s && s.total === 0 ? 'Nothing saved yet' : 'On this device' },
          { title: 'Created today', value: s?.generatedToday ?? 0, icon: Sparkles },
          { title: 'Storage used', value: formatBytes(s?.storageBytes ?? 0), icon: Download, hint: 'Browser storage' },
          { title: 'Saved analyses', value: s?.analyses ?? 0, icon: CheckCircle }
        ]} />

        <Card className="p-6 mb-8" id="asset-studio">
          <VisualIdentityAnalyzer  />
        </Card>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Asset Library</h2>
              <p className="text-xs text-muted-foreground">Your own images and audio, stored in this browser (the newest 60 are kept).</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search assets..." className="h-9 sm:w-60" />
              <div className="flex-shrink-0 border rounded-md">
                <Button variant="ghost" size="icon" aria-label="Grid view" className={`h-9 w-9 rounded-l-md ${viewMode === 'grid' ? 'bg-accent' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="List view" className={`h-9 w-9 rounded-r-md border-l ${viewMode === 'list' ? 'bg-accent' : ''}`} onClick={() => setViewMode('list')}><Filter className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {([['all', 'All'], ['image', 'Images'], ['audio', 'Audio']] as const).map(([value, label]) => (
              <Badge key={value} variant={selectedFilter === value ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSelectedFilter(value)}>{label}</Badge>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : visible.length > 0 ? (
            <div data-testid="asset-library" className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {visible.map(({ record, url }) => (
                <Card key={record.id} className={viewMode === 'grid' ? 'overflow-hidden' : 'p-4 flex items-center gap-4'}>
                  {record.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={record.name} className={viewMode === 'grid' ? 'object-cover w-full aspect-square' : 'w-20 h-20 rounded-lg object-cover'} />
                  ) : (
                    <audio controls src={url} className="w-full" />
                  )}
                  <div className={viewMode === 'grid' ? 'p-4 flex justify-between items-center' : 'flex-grow flex justify-between items-center'}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{record.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleString()} · {formatBytes(record.blob.size)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Download ${record.name}`} asChild><a href={url} download={record.name}><Download className="h-4 w-4" /></a></Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${record.name}`} onClick={() => remove(record.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center" data-testid="asset-library-empty">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{assets.length ? 'No assets match' : 'No assets yet'}</h3>
              <p className="text-muted-foreground mb-6">{assets.length ? 'Try another search or filter.' : 'Upload or generate an image above, then edit or save it to your library.'}</p>
              <Button onClick={() => document.getElementById('asset-studio')?.scrollIntoView({ behavior: 'smooth' })}><Upload className="mr-2 h-4 w-4" />Go to the studio</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
