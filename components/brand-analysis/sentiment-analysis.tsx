'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, AlertTriangle, Minus } from 'lucide-react';

interface SentimentAnalysisProps {
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export function SentimentAnalysis({ sentiment }: SentimentAnalysisProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="font-medium">Brand Sentiment Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-green-500" />
                <span>Positive</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {Math.round(sentiment.positive * 100)}%
              </Badge>
            </div>
            <Progress value={sentiment.positive * 100} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Negative</span>
              </div>
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                {Math.round(sentiment.negative * 100)}%
              </Badge>
            </div>
            <Progress value={sentiment.negative * 100} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-gray-500" />
                <span>Neutral</span>
              </div>
              <Badge variant="outline">
                {Math.round(sentiment.neutral * 100)}%
              </Badge>
            </div>
            <Progress value={sentiment.neutral * 100} className="h-2" />
          </div>
        </div>
      </div>
    </Card>
  );
}