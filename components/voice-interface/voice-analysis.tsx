'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  MessageSquare, 
  Globe, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Wand2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';

interface VoiceAnalysisProps {
  analysis: {
    tone: {
      formal: number;
      casual: number;
      emotional: number;
      professional: number;
    };
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    culturalSensitivity: {
      issues: string[];
      score: number;
    };
    emotionalResonance: {
      primary: string;
      secondary: string[];
      intensity: number;
    };
    audienceAlignment: {
      score: number;
      recommendations: string[];
    };
  };
}

export function VoiceAnalysis({ analysis }: VoiceAnalysisProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Tone Analysis
          </h3>
          <div className="h-[200px]">
            <ResponsivePie
              data={[
                { id: 'Formal', value: analysis.tone.formal * 100 },
                { id: 'Casual', value: analysis.tone.casual * 100 },
                { id: 'Emotional', value: analysis.tone.emotional * 100 },
                { id: 'Professional', value: analysis.tone.professional * 100 }
              ]}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.6}
              colors={['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']}
              enableArcLinkLabels={false}
              arcLabelsSkipAngle={10}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Sentiment Analysis
          </h3>
          <div className="space-y-4">
            {Object.entries(analysis.sentiment).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{key}</span>
                  <span>{Math.round(value * 100)}%</span>
                </div>
                <Progress value={value * 100} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-400" />
          Cultural Sensitivity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Overall Score</span>
            <Badge variant={analysis.culturalSensitivity.score > 0.8 ? 'default' : 'secondary'}>
              {Math.round(analysis.culturalSensitivity.score * 100)}%
            </Badge>
          </div>
          <Progress value={analysis.culturalSensitivity.score * 100} className="h-2 mb-4" />
          {analysis.culturalSensitivity.issues.length > 0 ? (
            <div className="space-y-2">
              {analysis.culturalSensitivity.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{issue}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">No cultural sensitivity issues detected</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-400" />
          Audience Alignment
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>Alignment Score</span>
              <Badge variant={analysis.audienceAlignment.score > 0.8 ? 'default' : 'secondary'}>
                {Math.round(analysis.audienceAlignment.score * 100)}%
              </Badge>
            </div>
            <Progress value={analysis.audienceAlignment.score * 100} className="h-2" />
          </div>
          
          <div className="space-y-2">
            {analysis.audienceAlignment.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 mt-0.5" />
                <p className="text-sm text-muted-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-amber-400" />
          Emotional Resonance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Primary Emotion</p>
              <p className="text-sm text-muted-foreground capitalize">{analysis.emotionalResonance.primary}</p>
            </div>
            <div>
              <p className="font-medium">Intensity</p>
              <Badge variant={analysis.emotionalResonance.intensity > 0.7 ? 'default' : 'secondary'}>
                {Math.round(analysis.emotionalResonance.intensity * 100)}%
              </Badge>
            </div>
          </div>
          
          <div>
            <p className="font-medium mb-2">Secondary Emotions</p>
            <div className="flex flex-wrap gap-2">
              {analysis.emotionalResonance.secondary.map((emotion, i) => (
                <Badge key={i} variant="outline" className="capitalize">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}