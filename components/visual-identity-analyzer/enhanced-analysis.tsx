'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Eye, Sticker as ColorPicker, Type, Layout, Grid, CheckCircle, AlertTriangle } from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';

interface EnhancedAnalysisProps {
  analysis: {
    colors: string[];
    fonts: string[];
    layout: {
      score: number;
      issues: string[];
    };
    accessibility: {
      score: number;
      issues: string[];
    };
    consistency: {
      score: number;
      elements: {
        name: string;
        score: number;
      }[];
    };
  };
}

export function EnhancedAnalysis({ analysis }: EnhancedAnalysisProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            Visual Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Color Harmony</h4>
              <div className="flex gap-2">
                {analysis.colors.map((color, i) => (
                  <div key={i} className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-md mb-1"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Typography</h4>
              <p className="text-sm text-muted-foreground">{analysis.fonts.join(', ')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="h-5 w-5 text-purple-400" />
            Layout Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">Layout Score</h4>
                <Badge variant={analysis.layout.score > 80 ? 'default' : 'secondary'}>
                  {analysis.layout.score}%
                </Badge>
              </div>
              <Progress value={analysis.layout.score} className="h-2 mb-4" />
              <div className="space-y-2">
                {analysis.layout.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span className="text-muted-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Grid className="h-5 w-5 text-indigo-400" />
          Visual Consistency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-4">Element Consistency</h4>
            <div className="h-[300px]">
              <ResponsivePie
                data={analysis.consistency.elements.map(el => ({
                  id: el.name,
                  value: el.score
                }))}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={true}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                arcLabelsSkipAngle={10}
              />
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Accessibility</h4>
            <div>
              <div className="flex justify-between mb-2">
                <span>Overall Score</span>
                <Badge variant={analysis.accessibility.score > 80 ? 'default' : 'secondary'}>
                  {analysis.accessibility.score}%
                </Badge>
              </div>
              <Progress value={analysis.accessibility.score} className="h-2 mb-4" />
              <div className="space-y-2">
                {analysis.accessibility.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <span className="text-muted-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}