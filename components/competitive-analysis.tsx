'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportDialog } from '@/components/export-dialog';
import {
  BarChart,
  Globe,
  Users,
  FileText,
  Layers,
  Target,
  DollarSign,
  Brain,
  Heart,
  Shield,
  TrendingUp,
  Settings,
  UserCheck,
  Scale,
  MessageSquare,
  ArrowUpRight,
  Building,
  HeadphonesIcon,
  Star,
  Zap,
  Search,
  Filter
} from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveRadar } from '@nivo/radar';
import { Input } from '@/components/ui/input';

interface CompetitiveAnalysisProps {
  analysis: any;
}

import { toPercent } from '@/lib/format';

export function CompetitiveAnalysis({ analysis }: CompetitiveAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Only metrics that were actually measured are shown; nothing is filled in with stock numbers.
  const metric = (name: string, key: string) => ({ name, value: toPercent(analysis?.[key]) });

  const analysisCategories = [
    {
      title: 'Digital Footprint',
      icon: Globe,
      color: 'blue',
      metrics: [
        metric('Website Score', 'websiteScore'),
        metric('Social Engagement', 'socialEngagement'),
        metric('Online Visibility', 'onlineVisibility')
      ]
    },
    {
      title: 'Customer Experience',
      icon: Users,
      color: 'purple',
      metrics: [
        metric('Response Time', 'responseTime'),
        metric('Service Quality', 'serviceQuality'),
        metric('Customer Satisfaction', 'customerSatisfaction')
      ]
    },
    {
      title: 'Market Position',
      icon: Target,
      color: 'indigo',
      metrics: [
        metric('Market Share', 'marketShare'),
        metric('Brand Strength', 'brandStrength'),
        metric('Competitive Edge', 'competitiveEdge')
      ]
    },
    {
      title: 'Content Strategy',
      icon: FileText,
      color: 'green',
      metrics: [
        metric('Content Quality', 'qualityScore'),
        metric('Engagement Rate', 'engagementRate'),
        metric('Content Frequency', 'frequencyScore')
      ]
    },
    {
      title: 'Visual Branding',
      icon: Layers,
      color: 'rose',
      metrics: [
        metric('Consistency', 'consistencyScore'),
        metric('Professionalism', 'professionalismScore'),
        metric('Visual Impact', 'impactScore')
      ]
    }
  ];

  const filteredCategories = analysisCategories.filter(category => {
    if (selectedCategory !== 'all' && category.title.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return category.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Competitive Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis across key business dimensions
          </p>
        </div>
        <ExportDialog
          data={analysis}
          charts={[
            { id: 'competitive-radar', name: 'Competitive Radar', type: 'radar' },
            { id: 'market-share', name: 'Market Share', type: 'pie' },
            { id: 'performance-metrics', name: 'Performance Metrics', type: 'bar' }
          ]}
          reportId="competitive-analysis"
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search analysis categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setSelectedCategory(selectedCategory === 'all' ? 'digital' : 'all')}
        >
          <Filter className="h-4 w-4" />
          {selectedCategory === 'all' ? 'Filter' : 'Clear Filter'}
        </Button>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center`}>
                  <category.icon className={`h-5 w-5 text-${category.color}-500`} />
                </div>
                <h3 className="font-medium">{category.title}</h3>
              </div>
              <div className="space-y-3">
                {category.metrics.map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{m.name}</span>
                      <span data-testid={m.value === null ? 'metric-unmeasured' : 'metric-value'}>{m.value === null ? 'Not measured' : `${Math.round(m.value)}%`}</span>
                    </div>
                    <Progress value={m.value ?? 0} className="h-1" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}