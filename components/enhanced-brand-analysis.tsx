'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Globe, Users, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { BrandAnalysis } from '@/lib/services/brand-analyzer';

interface EnhancedBrandAnalysisProps {
  analysis: BrandAnalysis;
}

export function EnhancedBrandAnalysis({ analysis }: EnhancedBrandAnalysisProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            AI Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Brand Health</span>
                <Badge variant={analysis.healthScore > 80 ? 'default' : 'secondary'}>
                  {analysis.healthScore}%
                </Badge>
              </div>
              <Progress value={analysis.healthScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Market Fit</span>
                <span>{Math.round(analysis.marketFit * 100)}%</span>
              </div>
              <Progress value={analysis.marketFit * 100} className="h-2" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Market Position
          </h3>
          <div className="h-[200px]">
            <ResponsivePie
              data={[
                { id: 'Current Market', value: analysis.marketFit * 100 },
                { id: 'Growth Potential', value: 100 - (analysis.marketFit * 100) }
              ]}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.6}
              colors={['#3B82F6', '#8B5CF6']}
            />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" />
          Competitive Analysis
        </h3>
        <div className="space-y-4">
          {analysis.competitors.slice(0, 3).map((competitor, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{competitor.name}</span>
                <span>{Math.round(competitor.score * 100)}%</span>
              </div>
              <Progress value={competitor.score * 100} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Brand Protection
        </h3>
        <div className="space-y-4">
          {Object.entries(analysis.toxicity).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              {value ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="capitalize">{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}