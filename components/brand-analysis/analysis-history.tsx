'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, GitCompare as Compare, Clock } from 'lucide-react';
import type { StoredAnalysis } from '@/lib/services/storage';

interface AnalysisHistoryProps {
  analyses: StoredAnalysis[];
  onCompare: (analysis: StoredAnalysis) => void;
  onDelete: (analysis: StoredAnalysis) => void;
  onExport: (analysis: StoredAnalysis) => void;
}

export function AnalysisHistory({
  analyses,
  onCompare,
  onDelete,
  onExport
}: AnalysisHistoryProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Analysis History</h3>
          <Button variant="outline" size="sm" onClick={() => onExport(analyses[0])}>
            <Download className="h-4 w-4 mr-2" />
            Export Latest
          </Button>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {analyses.map((analysis, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(analysis.lastUpdated), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm truncate max-w-[200px]">{analysis.websiteUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCompare(analysis)}>
                      <Compare className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onExport(analysis)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(analysis)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}