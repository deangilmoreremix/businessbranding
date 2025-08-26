'use client';

import { useState, useEffect } from 'react';
import Joyride, { Step } from 'react-joyride';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Target,
  BarChart,
  Globe,
  Users,
  TrendingUp,
  MessageSquare,
  Palette,
  Sparkles,
  ArrowRight,
  Wand2
} from 'lucide-react';

interface FeatureDiscoveryProps {
  onComplete?: () => void;
}

export function BrandAnalysisFeatureDiscovery({ onComplete }: FeatureDiscoveryProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if tour has been shown before
    const tourShown = localStorage.getItem('brandAnalysisTourShown');
    if (!tourShown) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.brand-analysis-intro',
      content: 'Welcome to the enhanced Brand Analysis powered by Gemini 2.5! Let me show you our powerful new features.',
      placement: 'center',
      disableBeacon: true
    },
    {
      target: '.real-time-analysis',
      content: 'Experience instant brand analysis with our new Flash processing engine.',
      placement: 'bottom'
    },
    {
      target: '.multi-modal',
      content: 'Analyze text, images, and voice content together for comprehensive insights.',
      placement: 'bottom'
    },
    {
      target: '.competitive-intel',
      content: 'Get real-time competitive intelligence and market positioning data.',
      placement: 'bottom'
    },
    {
      target: '.smart-recommendations',
      content: 'Receive AI-powered, contextual recommendations for your brand.',
      placement: 'bottom'
    },
    {
      target: '.advanced-analytics',
      content: 'Explore detailed analytics with predictive insights and trend analysis.',
      placement: 'bottom'
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    
    if (['finished', 'skipped'].includes(status)) {
      setRun(false);
      localStorage.setItem('brandAnalysisTourShown', 'true');
      if (onComplete) onComplete();
    }
  };

  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            primaryColor: '#3B82F6',
            zIndex: 1000,
          }
        }}
      />

      <Card className="p-6 mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 brand-analysis-intro">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="font-medium">Enhanced Brand Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setRun(true)}
          >
            Take Feature Tour
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: 'Real-Time Analysis',
            description: 'Instant brand analysis with Flash processing',
            icon: Brain,
            className: 'real-time-analysis'
          },
          {
            title: 'Multi-Modal Analysis',
            description: 'Combined text, image, and voice analysis',
            icon: Palette,
            className: 'multi-modal'
          },
          {
            title: 'Competitive Intelligence',
            description: 'Live market positioning and competitor tracking',
            icon: Target,
            className: 'competitive-intel'
          },
          {
            title: 'Smart Recommendations',
            description: 'Contextual improvement suggestions',
            icon: Wand2,
            className: 'smart-recommendations'
          },
          {
            title: 'Advanced Analytics',
            description: 'Predictive insights and trend analysis',
            icon: BarChart,
            className: 'advanced-analytics'
          },
          {
            title: 'Performance Tracking',
            description: 'Monitor brand metrics and growth',
            icon: TrendingUp,
            className: 'performance-tracking'
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`p-6 hover:bg-accent/5 transition-colors ${feature.className}`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8"
      >
        <Badge className="mb-4">NEW</Badge>
        <h2 className="text-2xl font-bold mb-4">Ready to Experience Enhanced Analysis?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Start analyzing your brand with our powerful new features powered by Gemini 2.5 Flash
        </p>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          Begin Analysis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </>
  );
}