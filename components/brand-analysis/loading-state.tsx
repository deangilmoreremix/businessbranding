'use client';

import { Card } from '@/components/ui/card';
import { ElapsedStatus } from '@/components/elapsed-status';
import { Brain } from 'lucide-react';

export function LoadingState({ message = 'Analyzing your brand...' }: { message?: string }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-medium">Brand Analysis in Progress</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <ElapsedStatus active label="Working…" />
      </div>
    </Card>
  );
}
