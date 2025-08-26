'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Star,
  Layers,
  MessageSquare,
  Users,
  Globe,
  Heart,
  Shield,
  TrendingUp,
  Building,
  Zap,
  Scale
} from 'lucide-react';

interface FeatureCategory {
  id: string;
  name: string;
  icon: any;
  features: Feature[];
}

interface Feature {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'coming-soon' | 'beta';
  component?: React.ComponentType<any>;
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'analysis',
    name: 'Advanced Analysis',
    icon: Brain,
    features: [
      {
        id: 'image-analysis',
        name: 'Image Analysis',
        description: 'AI-powered image content analysis',
        status: 'available'
      },
      {
        id: 'brand-analysis',
        name: 'Brand Analysis',
        description: 'Comprehensive brand health check',
        status: 'available'
      },
      {
        id: 'competitor-analysis',
        name: 'Competitor Analysis',
        description: 'Market and competitor insights',
        status: 'available'
      }
    ]
  },
  {
    id: 'generation',
    name: 'Asset Generation',
    icon: Wand2,
    features: [
      {
        id: 'logo-generation',
        name: 'Logo Generation',
        description: 'AI-powered logo creation',
        status: 'available'
      },
      {
        id: 'pattern-generation',
        name: 'Pattern Generation',
        description: 'Create brand patterns',
        status: 'available'
      },
      {
        id: 'template-generation',
        name: 'Template Generation',
        description: 'Social media templates',
        status: 'available'
      }
    ]
  },
  {
    id: 'visual',
    name: 'Visual Tools',
    icon: ImageIcon,
    features: [
      {
        id: 'color-analysis',
        name: 'Color Analysis',
        description: 'Extract and analyze colors',
        status: 'available'
      },
      {
        id: 'style-transfer',
        name: 'Style Transfer',
        description: 'Transform image styles',
        status: 'available'
      },
      {
        id: 'visual-consistency',
        name: 'Visual Consistency',
        description: 'Check brand consistency',
        status: 'available'
      }
    ]
  },
  {
    id: 'export',
    name: 'Export & Share',
    icon: Download,
    features: [
      {
        id: 'multi-format-export',
        name: 'Multi-format Export',
        description: 'Export in various formats',
        status: 'available'
      },
      {
        id: 'asset-organization',
        name: 'Asset Organization',
        description: 'Organize brand assets',
        status: 'available'
      },
      {
        id: 'sharing-tools',
        name: 'Sharing Tools',
        description: 'Share with team members',
        status: 'available'
      }
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar & Planning',
    icon: Calendar,
    features: [
      {
        id: 'content-calendar',
        name: 'Content Calendar',
        description: 'Plan content releases',
        status: 'available'
      },
      {
        id: 'schedule-posts',
        name: 'Schedule Posts',
        description: 'Automate content posting',
        status: 'available'
      },
      {
        id: 'campaign-planning',
        name: 'Campaign Planning',
        description: 'Plan marketing campaigns',
        status: 'available'
      }
    ]
  }
];

export function FeatureManager() {
  const [activeCategory, setActiveCategory] = useState<string>('analysis');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Feature Manager</h2>
          <p className="text-muted-foreground">
            Explore and manage all available features
          </p>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          {featureCategories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {featureCategories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {category.features.map(feature => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{feature.name}</h3>
                        <Badge variant={
                          feature.status === 'available' ? 'default' :
                          feature.status === 'beta' ? 'secondary' :
                          'outline'
                        }>
                          {feature.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    variant={feature.status === 'available' ? 'default' : 'outline'}
                    disabled={feature.status === 'coming-soon'}
                  >
                    {feature.status === 'available' ? 'Use Feature' :
                     feature.status === 'beta' ? 'Try Beta' :
                     'Coming Soon'}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}