'use client';

import { useState, useEffect } from 'react';
import Joyride, { Step } from 'react-joyride';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Wand2, 
  Image as ImageIcon, 
  Palette, 
  Download, 
  Calendar,
  FileText,
  Settings,
  BarChart,
  Target,
  Star
} from 'lucide-react';

interface FeatureDiscoveryProps {
  onComplete?: () => void;
}

export function FeatureDiscovery({ onComplete }: FeatureDiscoveryProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour has been shown before
    const tourShown = localStorage.getItem('visualIdentityTourShown');
    if (!tourShown) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.visual-identity-analyzer',
      content: 'Welcome to the Visual Identity Studio! Let me show you all the powerful features available.',
      placement: 'center',
      disableBeacon: true
    },
    {
      target: '.image-analysis',
      content: 'Advanced image analysis powered by AI helps you understand your visual content better.',
      placement: 'bottom'
    },
    {
      target: '.style-transfer',
      content: 'Transform images between different styles while maintaining brand consistency.',
      placement: 'bottom'
    },
    {
      target: '.color-analysis',
      content: 'Extract and analyze color palettes from your brand assets.',
      placement: 'bottom'
    },
    {
      target: '.brand-consistency',
      content: 'Check visual consistency across all your brand assets.',
      placement: 'bottom'
    },
    {
      target: '.asset-generation',
      content: 'Generate new brand assets like logos, patterns, and marketing materials.',
      placement: 'bottom'
    },
    {
      target: '.export-options',
      content: 'Export your assets in multiple formats and organize them efficiently.',
      placement: 'bottom'
    },
    {
      target: '.calendar-integration',
      content: 'Plan and schedule your visual content with our calendar integration.',
      placement: 'bottom'
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status, type } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('visualIdentityTourShown', 'true');
      if (onComplete) onComplete();
    }

    if (type === 'step:after') {
      setStepIndex(stepIndex + 1);
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

      <Card className="p-6 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="font-medium">New Features Available!</h3>
              <p className="text-sm text-muted-foreground">
                Discover powerful new tools for your brand identity
              </p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setRun(true)}
          >
            Take Tour
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Advanced Analysis',
            description: 'AI-powered image and brand analysis',
            icon: Brain,
            className: 'image-analysis'
          },
          {
            title: 'Style Transfer',
            description: 'Transform images between styles',
            icon: Wand2,
            className: 'style-transfer'
          },
          {
            title: 'Color Analysis',
            description: 'Extract and analyze color palettes',
            icon: Palette,
            className: 'color-analysis'
          },
          {
            title: 'Asset Generation',
            description: 'Create new brand assets',
            icon: ImageIcon,
            className: 'asset-generation'
          },
          {
            title: 'Export Options',
            description: 'Multiple format export support',
            icon: Download,
            className: 'export-options'
          },
          {
            title: 'Calendar Integration',
            description: 'Plan and schedule content',
            icon: Calendar,
            className: 'calendar-integration'
          },
          {
            title: 'Brand Guidelines',
            description: 'Generate comprehensive guidelines',
            icon: FileText,
            className: 'brand-guidelines'
          },
          {
            title: 'Quality Control',
            description: 'Ensure brand consistency',
            icon: Settings,
            className: 'quality-control'
          },
          {
            title: 'Performance Tracking',
            description: 'Monitor brand metrics',
            icon: BarChart,
            className: 'performance-tracking'
          },
          {
            title: 'Competitor Analysis',
            description: 'Compare with competitors',
            icon: Target,
            className: 'competitor-analysis'
          },
          {
            title: 'Brand Health',
            description: 'Track brand performance',
            icon: Star,
            className: 'brand-health'
          }
        ].map((feature, index) => (
          <Card 
            key={index}
            className={`p-4 hover:bg-accent/5 transition-colors ${feature.className}`}
          >
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
        ))}
      </div>
    </>
  );
}