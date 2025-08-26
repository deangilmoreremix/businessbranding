'use client';

import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  progress: number;
  message?: string;
}

export function LoadingState({ progress, message = 'Analyzing your brand...' }: LoadingStateProps) {
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

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Analysis Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing brand data...</span>
        </div>
      </div>
    </Card>
  );
}