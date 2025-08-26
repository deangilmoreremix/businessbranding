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
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveRadar } from '@nivo/radar';
import { Input } from '@/components/ui/input';

interface CompetitorAnalysisProps {
  analysis: any;
}

export function CompetitorAnalysis({ analysis }: CompetitorAnalysisProps) {
  const [activeTab, setActiveTab] = useState('companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Mock data for 20 companies - in production this would come from the analysis prop
  const competitors = [
    {
      name: 'Industry Leader Corp',
      marketShare: 35,
      strengths: ['Brand recognition', 'Market presence', 'Innovation'],
      weaknesses: ['High prices', 'Customer service'],
      metrics: {
        brandStrength: 95,
        marketPresence: 98,
        customerLoyalty: 88,
        innovation: 92
      }
    },
    {
      name: 'TechGiant Solutions',
      marketShare: 28,
      strengths: ['Technology leadership', 'Global reach', 'R&D'],
      weaknesses: ['Product complexity', 'Support response time'],
      metrics: {
        brandStrength: 90,
        marketPresence: 85,
        customerLoyalty: 82,
        innovation: 95
      }
    },
    // ... Add more companies to make up 20
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Industry Competition Analysis</h2>
          <p className="text-muted-foreground">
            Detailed comparison with top 20 companies in your industry
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

      <Tabs defaultValue="companies" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setSelectedCategory(selectedCategory === 'all' ? 'market-leaders' : 'all')}
          >
            <Filter className="h-4 w-4" />
            {selectedCategory === 'all' ? 'Filter' : 'Clear Filter'}
          </Button>
        </div>

        <TabsContent value="companies">
          <div className="space-y-4">
            {competitors.map((company, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Building className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{company.name}</h3>
                        <Badge variant="outline">{company.marketShare}% Market Share</Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm">Strengths: {company.strengths.join(', ')}</span>
                        </div>
                        {expandedCompany === company.name && (
                          <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(company.metrics).map(([key, value]) => (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span>{value}%</span>
                                  </div>
                                  <Progress value={value} className="h-1" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCompany(
                      expandedCompany === company.name ? null : company.name
                    )}
                  >
                    {expandedCompany === company.name ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Market Share Distribution</h3>
              <div className="h-[300px]">
                <ResponsivePie
                  data={competitors.map(c => ({
                    id: c.name,
                    value: c.marketShare
                  }))}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'nivo' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={true}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
              <div className="h-[300px]">
                <ResponsiveBar
                  data={competitors.slice(0, 5).map(c => ({
                    company: c.name,
                    ...c.metrics
                  }))}
                  keys={['brandStrength', 'marketPresence', 'customerLoyalty', 'innovation']}
                  indexBy="company"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  groupMode="grouped"
                  colors={{ scheme: 'nivo' }}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45
                  }}
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Competitive Positioning</h3>
              <div className="h-[400px]">
                <ResponsiveRadar
                  data={competitors.slice(0, 5).map(c => ({
                    company: c.name,
                    ...c.metrics
                  }))}
                  keys={['brandStrength', 'marketPresence', 'customerLoyalty', 'innovation']}
                  indexBy="company"
                  maxValue={100}
                  margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                  curve="linearClosed"
                  borderWidth={2}
                  borderColor={{ from: 'color' }}
                  gridLevels={5}
                  gridShape="circular"
                  gridLabelOffset={36}
                  enableDots={true}
                  dotSize={8}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  dotBorderColor={{ from: 'color' }}
                  enableDotLabel={true}
                  dotLabel="value"
                  dotLabelYOffset={-12}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Growth Trajectory</h3>
              <div className="h-[400px]">
                <ResponsiveBar
                  data={competitors.slice(0, 5).map(c => ({
                    name: c.name,
                    growth: Math.random() * 100
                  }))}
                  keys={['growth']}
                  indexBy="name"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  colors={{ scheme: 'nivo' }}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Growth Rate (%)',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}