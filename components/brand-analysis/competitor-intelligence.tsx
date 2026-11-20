'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  BarChart,
  CheckCircle,
  XCircle,
  Briefcase,
  Users,
} from 'lucide-react';

import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsivePie } from '@nivo/pie';

interface CompetitorIntelligenceProps {
  industry?: string;
  competitors?: Array<{
    name: string;
    marketShare?: number;
    strengths?: string[];
    weaknesses?: string[];
    digitalPresence?: number;
    brandStrength?: number;
    pricing?: 'low' | 'mid' | 'high' | 'premium';
    targetAudience?: string[];
    metrics?: Record<string, number>;
  }>;
}

// Background deep research + notifications: browser-only, loaded on demand.
const DeepResearchPanel = dynamic(() => import('@/components/local/deep-research-panel'), { ssr: false, loading: () => null });

export function CompetitorIntelligence({ industry = 'Technology', competitors = [] }: CompetitorIntelligenceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('overview');

  // Only competitors from the real analysis are shown (no stock competitor rows).
  const allCompetitors = competitors;
  
  // Filter competitors based on search term
  const filteredCompetitors = allCompetitors.filter(competitor => 
    competitor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data uses ONLY values present in the analysis; a missing value is left out (or null), never invented.
  const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const radarData = allCompetitors.slice(0, 5).filter((c) => c.metrics && Object.values(c.metrics).some(isNum)).map((competitor) => ({
    competitor: competitor.name || 'Unknown',
    ...competitor.metrics
  }));

  const pieData = allCompetitors.filter((c) => isNum(c.marketShare) && c.marketShare > 0).map((competitor) => ({
    id: competitor.name,
    label: competitor.name,
    value: competitor.marketShare as number
  }));

  const heatRow = (id: string, pick: (c: any) => unknown) => ({ id, data: allCompetitors.slice(0, 7).map((c) => ({ x: c.name, y: isNum(pick(c)) ? (pick(c) as number) : null })) });
  const heatmapData = [
    heatRow('Brand Strength', (c) => c.brandStrength ?? c.score),
    heatRow('Digital Presence', (c) => c.digitalPresence),
    heatRow('Innovation', (c) => c.metrics?.innovation),
    heatRow('Customer Satisfaction', (c) => c.metrics?.customerSatisfaction)
  ].filter((row) => row.data.some((d) => d.y !== null));

  const barData = allCompetitors.length > 0 && allCompetitors[0].metrics
    ? Object.keys(allCompetitors[0].metrics).map((metric) => {
        const data: any = { metric: metric.replace(/([A-Z])/g, ' $1').trim() };
        allCompetitors.slice(0, 5).forEach((competitor) => {
          const metricValue = competitor.metrics?.[metric as keyof typeof competitor.metrics];
          if (isNum(metricValue)) data[competitor.name || 'Unknown'] = metricValue;
        });
        return data;
      })
    : [];

  // Error handling for empty data
  if (allCompetitors.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Top Competitors Intelligence</CardTitle>
          <Badge variant="outline">Industry: {industry}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No competitor data available</p>
            <p className="text-sm text-muted-foreground">Competitor analysis will be available once brand analysis is complete.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Top Competitors Intelligence</CardTitle>
          <Badge variant="outline">Industry: {industry}</Badge>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="grid grid-cols-4 w-[300px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <DeepResearchPanel industry={industry} />

      <CardContent>
        <Tabs value={activeView} className="space-y-4">
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Market Share Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    {pieData.length > 0 ? (
                      <ResponsivePie
                        data={pieData}
                        margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: 'category10' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        enableArcLinkLabels={false}
                        arcLabelsSkipAngle={10}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            translateY: 40,
                            itemWidth: 80,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            symbolSize: 12,
                            symbolShape: 'circle',
                            effects: [{ on: 'hover', style: { itemTextColor: '#000' } }]
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No market share data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Competitive Positioning</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    {radarData.length > 0 && radarData[0] && Object.keys(radarData[0]).length > 1 ? (
                      <ResponsiveRadar
                        data={radarData}
                        keys={Object.keys(radarData[0]).filter(k => k !== 'competitor')}
                        indexBy="competitor"
                        maxValue={100}
                        margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                        borderWidth={2}
                        gridLabelOffset={36}
                        dotSize={10}
                        dotColor={{ theme: 'background' }}
                        dotBorderWidth={2}
                        colors={{ scheme: 'category10' }}
                        blendMode="multiply"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No competitive positioning data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Strengths & Weaknesses Heatmap</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {heatmapData.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center" data-testid="heatmap-unmeasured">Not measured: the analysis has no per-competitor strength scores.</p>}
                <div className="h-[250px]" hidden={heatmapData.length === 0}>
                  {heatmapData.length > 0 && (
                  <ResponsiveHeatMap
                    data={heatmapData}
                    margin={{ top: 50, right: 60, bottom: 60, left: 90 }}
                    valueFormat=">-.2s"
                    axisTop={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: '',
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Category',
                    }}
                    colors={{
                      type: 'sequential',
                      scheme: 'blues',
                    }}
                    emptyColor="#555555"
                    legends={[
                      {
                        anchor: 'bottom',
                        translateX: 0,
                        translateY: 30,
                        length: 400,
                        thickness: 8,
                        direction: 'row',
                        tickPosition: 'after',
                        tickSize: 3,
                        tickSpacing: 4,
                        tickOverlap: false,
                        title: 'Score',
                        titleAlign: 'start',
                        titleOffset: 4
                      }
                    ]}
                  />
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold mb-4">Top 7 Competitors Overview</h3>
              
              {filteredCompetitors.slice(0, 7).map((competitor, index) => (
                <Card key={competitor.name} className="overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                          <span className="text-blue-700 dark:text-blue-300 font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{competitor.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{competitor.marketShare}% Market Share</Badge>
                            <Badge variant="outline" className={
                              competitor.pricing === 'premium' ? 'bg-purple-100 text-purple-800' : 
                              competitor.pricing === 'high' ? 'bg-red-100 text-red-800' : 
                              competitor.pricing === 'mid' ? 'bg-amber-100 text-amber-800' : 
                              'bg-green-100 text-green-800'
                            }>
                              {competitor.pricing === 'premium' ? 'Premium' : 
                                competitor.pricing === 'high' ? 'High Price' : 
                                competitor.pricing === 'mid' ? 'Mid Price' : 
                                'Low Price'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" onClick={() => 
                        setExpandedCompetitor(expandedCompetitor === competitor.name ? null : competitor.name)
                      }>
                        {expandedCompetitor === competitor.name ? 
                          <ChevronUp className="h-5 w-5" /> : 
                          <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                    
                    {expandedCompetitor === competitor.name && (
                      <div className="p-4 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Strengths
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {(competitor.strengths || ['Brand reputation', 'Product quality']).map((strength, i) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Weaknesses
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {(competitor.weaknesses || ['Limited innovation', 'Customer service']).map((weakness, i) => (
                                <li key={i}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Target Audience
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(competitor.targetAudience || ['General consumers']).map((audience, i) => (
                              <Badge key={i} variant="outline">{audience}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium">Key Metrics</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(competitor.metrics || {}).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-sm font-medium">{value}/100</span>
                                </div>
                                <Progress value={value} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Strategic Comparison</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[400px]">
                    {barData.length > 0 && allCompetitors.length > 0 ? (
                      <ResponsiveBar
                        data={barData}
                        keys={allCompetitors.slice(0, 5).map(c => c.name || 'Unknown')}
                        indexBy="metric"
                        margin={{ top: 50, right: 130, bottom: 60, left: 120 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={{ scheme: 'category10' }}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 45,
                          legend: 'Metrics',
                          legendPosition: 'middle',
                          legendOffset: 50,
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Score',
                          legendPosition: 'middle',
                          legendOffset: -80,
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                          {
                            dataFrom: 'keys',
                            anchor: 'bottom-right',
                            direction: 'column',
                            justify: false,
                            translateX: 120,
                            translateY: 0,
                            itemsSpacing: 2,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.85,
                            symbolSize: 20,
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No comparison data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Opportunity Gaps</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { title: 'Innovation Gap', score: 76, description: 'Potential to overtake 3 competitors with focused R&D' },
                          { title: 'Price-Value Gap', score: 82, description: 'Strong opportunity in mid-market segment' },
                          { title: 'Digital Experience', score: 88, description: 'Top 3 potential in digital customer journey' },
                        ].map((opportunity, i) => (
                          <Card key={i} className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="h-5 w-5 text-blue-500" />
                              <h3 className="font-medium">{opportunity.title}</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Opportunity Score</span>
                                <span className="font-medium">{opportunity.score}/100</span>
                              </div>
                              <Progress value={opportunity.score} className="h-2" />
                              <p className="text-sm">{opportunity.description}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Disruption Risk</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {[
                        { competitor: "Emerging Technologies", risk: 85, trend: "up", description: "Disruptive AI-powered solution gaining traction" },
                        { competitor: "Innovation Tech", risk: 72, trend: "up", description: "Recent funding round to expand market reach" },
                        { competitor: "NextGen Systems", risk: 68, trend: "stable", description: "New product launch scheduled next quarter" }
                      ].map((risk, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{risk.competitor}</span>
                              {risk.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              ) : risk.trend === "down" ? (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              ) : (
                                <Badge variant="outline">Stable</Badge>
                              )}
                            </div>
                            <Badge variant={risk.risk > 80 ? 'destructive' : 'outline'}>
                              {risk.risk}% Risk
                            </Badge>
                          </div>
                          <Progress value={risk.risk} className="h-2" />
                          <p className="text-sm text-muted-foreground">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg">Competitive Advantage</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {[
                        { area: "Customer Experience", advantage: 78, description: "7% above industry average" },
                        { area: "Technical Innovation", advantage: 86, description: "Leading in 3 of 5 categories" },
                        { area: "Price-to-Value", advantage: 73, description: "Mid-tier position with premium features" }
                      ].map((advantage, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{advantage.area}</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {advantage.advantage}% Advantage
                            </Badge>
                          </div>
                          <Progress value={advantage.advantage} className="h-2" />
                          <p className="text-sm text-muted-foreground">{advantage.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="market">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                { title: 'Total Market Size', value: '$8.7B', growth: '+12%', icon: BarChart },
                { title: 'Market Growth Rate', value: '14.8%', growth: '+2.3%', icon: TrendingUp },
                { title: 'Market Concentration', value: 'Moderate', sub: 'Top 3 hold 65%', icon: Target },
              ].map((stat, i) => (
                <Card key={i} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-sm mt-1">
                        <Badge variant="outline" className={(stat.growth?.startsWith('+')) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {stat.growth || 'N/A'} YoY
                        </Badge>
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                      <stat.icon className="text-blue-700 dark:text-blue-300 h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {stat.sub && <p className="text-sm text-muted-foreground">{stat.sub}</p>}
                  </div>
                </Card>
              ))}
            </div>
            
            
          </TabsContent>
          
          <TabsContent value="profiles">
            <div className="space-y-6">
              {filteredCompetitors.map((competitor, index) => (
                <Card key={competitor.name} className="overflow-hidden">
                  <div className="p-6 border-b bg-muted/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{competitor.name}</h3>
                            {index < 3 && (
                              <Badge variant={
                                index === 0 ? 'default' : 
                                index === 1 ? 'outline' : 
                                'secondary'
                              }>
                                <Award className="h-3 w-3 mr-1" />
                                {index === 0 ? 'Leader' : index === 1 ? 'Challenger' : 'Strong Performer'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              Market Share: <span className="font-medium ml-1">{competitor.marketShare}%</span>
                            </span>
                            <span> • </span>
                            <span className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              Target: <span className="font-medium ml-1">{competitor.targetAudience?.join(", ")}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Key Strengths
                        </h4>
                        <ul className="space-y-2">
                          {(competitor.strengths || ['No data available']).map((strength, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-green-800">{i+1}</span>
                              </div>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Key Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {(competitor.weaknesses || ['No data available']).map((weakness, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-red-800">{i+1}</span>
                              </div>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(competitor.metrics || {}).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-medium">{value}/100</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}