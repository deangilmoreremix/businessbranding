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

export function CompetitiveAnalysis({ analysis }: CompetitiveAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Default metrics if analysis data is missing
  const defaultMetrics = {
    websiteScore: 85,
    socialEngagement: 78,
    onlineVisibility: 82,
    responseTime: 90,
    serviceQuality: 88,
    customerSatisfaction: 85,
    marketShare: 25,
    brandStrength: 80,
    competitiveEdge: 75,
    qualityScore: 90,
    engagementRate: 85,
    frequencyScore: 80,
    consistencyScore: 88,
    professionalismScore: 92,
    impactScore: 85
  };

  const analysisCategories = [
    {
      title: 'Digital Footprint',
      icon: Globe,
      color: 'blue',
      metrics: [
        { name: 'Website Score', value: analysis?.websiteScore || defaultMetrics.websiteScore },
        { name: 'Social Engagement', value: analysis?.socialEngagement || defaultMetrics.socialEngagement },
        { name: 'Online Visibility', value: analysis?.onlineVisibility || defaultMetrics.onlineVisibility }
      ]
    },
    {
      title: 'Customer Experience',
      icon: Users,
      color: 'purple',
      metrics: [
        { name: 'Response Time', value: analysis?.responseTime || defaultMetrics.responseTime },
        { name: 'Service Quality', value: analysis?.serviceQuality || defaultMetrics.serviceQuality },
        { name: 'Customer Satisfaction', value: analysis?.customerSatisfaction || defaultMetrics.customerSatisfaction }
      ]
    },
    {
      title: 'Market Position',
      icon: Target,
      color: 'indigo',
      metrics: [
        { name: 'Market Share', value: analysis?.marketShare || defaultMetrics.marketShare },
        { name: 'Brand Strength', value: analysis?.brandStrength || defaultMetrics.brandStrength },
        { name: 'Competitive Edge', value: analysis?.competitiveEdge || defaultMetrics.competitiveEdge }
      ]
    },
    {
      title: 'Content Strategy',
      icon: FileText,
      color: 'green',
      metrics: [
        { name: 'Content Quality', value: analysis?.qualityScore || defaultMetrics.qualityScore },
        { name: 'Engagement Rate', value: analysis?.engagementRate || defaultMetrics.engagementRate },
        { name: 'Content Frequency', value: analysis?.frequencyScore || defaultMetrics.frequencyScore }
      ]
    },
    {
      title: 'Visual Branding',
      icon: Layers,
      color: 'rose',
      metrics: [
        { name: 'Consistency', value: analysis?.consistencyScore || defaultMetrics.consistencyScore },
        { name: 'Professionalism', value: analysis?.professionalismScore || defaultMetrics.professionalismScore },
        { name: 'Visual Impact', value: analysis?.impactScore || defaultMetrics.impactScore }
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
                {category.metrics.map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{metric.name}</span>
                      <span>{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-1" />
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