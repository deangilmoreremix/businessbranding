'use client';

import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface Tile { title: string; value: string | number; hint?: string; icon: LucideIcon }

/** Stat tiles that only ever show values passed in from real data. `value === null` renders an honest placeholder. */
export function LibraryStatTiles({ tiles, loading }: { tiles: Tile[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="stat-tiles">
      {tiles.map((t) => (
        <Card key={t.title} className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <t.icon className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.title}</p>
              <h3 className="text-2xl font-bold">{loading ? '…' : t.value}</h3>
              {t.hint && !loading && <p className="text-xs text-muted-foreground">{t.hint}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
