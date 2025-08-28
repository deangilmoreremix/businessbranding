'use client';

import { useState } from 'react';
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

export function CompetitorIntelligence({ industry = 'Technology', competitors = [] }: CompetitorIntelligenceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('overview');

  // Demo competitors data if none provided
  const defaultCompetitors = [
    {
      name: 'Industry Leader Inc.',
      marketShare: 28.5,
      strengths: ['Brand recognition', 'Product quality', 'Marketing reach'],
      weaknesses: ['Premium pricing', 'Slower innovation'],
      digitalPresence: 92,
      brandStrength: 94,
      pricing: 'premium',
      targetAudience: ['Enterprise', 'Upper mid-market'],
      metrics: {
        brandLoyalty: 89,
        customerSatisfaction: 86,
        innovation: 78,
        marketReach: 94,
        digitalPresence: 92,
        socialEngagement: 88,
        priceCompetitiveness: 62
      }
    },
    {
      name: 'Innovation Tech',
      marketShare: 22.3,
      strengths: ['Innovation speed', 'Customer service', 'Digital experience'],
      weaknesses: ['Brand awareness', 'Limited product range'],
      digitalPresence: 96,
      brandStrength: 84,
      pricing: 'mid',
      targetAudience: ['Tech-savvy users', 'Early adopters'],
      metrics: {
        brandLoyalty: 82,
        customerSatisfaction: 90,
        innovation: 95,
        marketReach: 76,
        digitalPresence: 96,
        socialEngagement: 91,
        priceCompetitiveness: 76
      }
    },
    {
      name: 'ValueSoft Solutions',
      marketShare: 18.7,
      strengths: ['Competitive pricing', 'Large customer base', 'Reliable solutions'],
      weaknesses: ['Less innovative', 'Customer support issues'],
      digitalPresence: 78,
      brandStrength: 72,
      pricing: 'low',
      targetAudience: ['Small business', 'Budget-conscious'],
      metrics: {
        brandLoyalty: 74,
        customerSatisfaction: 72,
        innovation: 68,
        marketReach: 82,
        digitalPresence: 78,
        socialEngagement: 70,
        priceCompetitiveness: 92
      }
    },
    {
      name: 'NextGen Systems',
      marketShare: 14.2,
      strengths: ['Cutting-edge technology', 'Strong developer community', 'Open ecosystem'],
      weaknesses: ['Limited market presence', 'Complex products'],
      digitalPresence: 88,
      brandStrength: 76,
      pricing: 'mid',
      targetAudience: ['Developers', 'Tech companies'],
      metrics: {
        brandLoyalty: 79,
        customerSatisfaction: 83,
        innovation: 91,
        marketReach: 68,
        digitalPresence: 88,
        socialEngagement: 85,
        priceCompetitiveness: 75
      }
    },
    {
      name: 'Heritage Technologies',
      marketShare: 9.5,
      strengths: ['Established reputation', 'Enterprise relationships', 'Industry expertise'],
      weaknesses: ['Aging infrastructure', 'Slow modernization'],
      digitalPresence: 65,
      brandStrength: 82,
      pricing: 'high',
      targetAudience: ['Enterprise', 'Government'],
      metrics: {
        brandLoyalty: 86,
        customerSatisfaction: 78,
        innovation: 59,
        marketReach: 81,
        digitalPresence: 65,
        socialEngagement: 62,
        priceCompetitiveness: 68
      }
    },
    {
      name: 'Agile Solutions',
      marketShare: 5.8,
      strengths: ['Flexibility', 'Quick implementation', 'Customer-centric'],
      weaknesses: ['Scale limitations', 'Narrow product focus'],
      digitalPresence: 82,
      brandStrength: 68,
      pricing: 'mid',
      targetAudience: ['Mid-market', 'Growth-stage companies'],
      metrics: {
        brandLoyalty: 76,
        customerSatisfaction: 88,
        innovation: 84,
        marketReach: 62,
        digitalPresence: 82,
        socialEngagement: 79,
        priceCompetitiveness: 81
      }
    },
    {
      name: 'Emerging Technologies',
      marketShare: 4.1,
      strengths: ['Disruptive innovation', 'Fast growth', 'Modern architecture'],
      weaknesses: ['Limited track record', 'Funding constraints'],
      digitalPresence: 90,
      brandStrength: 64,
      pricing: 'low',
      targetAudience: ['Startups', 'Digital-first businesses'],
      metrics: {
        brandLoyalty: 68,
        customerSatisfaction: 85,
        innovation: 93,
        marketReach: 58,
        digitalPresence: 90,
        socialEngagement: 94,
        priceCompetitiveness: 88
      }
    }
  ];

  const allCompetitors = competitors.length > 0 ? competitors : defaultCompetitors;
  
  // Filter competitors based on search term
  const filteredCompetitors = allCompetitors.filter(competitor => 
    competitor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare data for radar chart
  const radarData = allCompetitors.slice(0, 5).map(competitor => {
    const metrics = competitor.metrics || {
      brandLoyalty: Math.round(Math.random() * 30 + 60),
      innovation: Math.round(Math.random() * 30 + 60),
      marketReach: Math.round(Math.random() * 30 + 60),
      digitalPresence: Math.round(Math.random() * 30 + 60),
      customerSatisfaction: Math.round(Math.random() * 30 + 60),
    };

    return {
      competitor: competitor.name || 'Unknown',
      ...metrics
    };
  });
  
  // Prepare data for market share pie chart
  const pieData = allCompetitors.map(competitor => ({
    id: competitor.name,
    label: competitor.name,
    value: competitor.marketShare || Math.round(Math.random() * 20 + 5)
  }));
  
  // Prepare data for strength/weakness heatmap
  const heatmapData = [
    { id: 'Brand Strength', data: allCompetitors.slice(0, 7).map(c => ({ x: c.name, y: c.brandStrength || Math.round(Math.random() * 30 + 60) })) },
    { id: 'Digital Presence', data: allCompetitors.slice(0, 7).map(c => ({ x: c.name, y: c.digitalPresence || Math.round(Math.random() * 30 + 60) })) },
    { id: 'Innovation', data: allCompetitors.slice(0, 7).map(c => ({ x: c.name, y: c.metrics?.innovation || Math.round(Math.random() * 30 + 60) })) },
    { id: 'Customer Satisfaction', data: allCompetitors.slice(0, 7).map(c => ({ x: c.name, y: c.metrics?.customerSatisfaction || Math.round(Math.random() * 30 + 60) })) }
  ];
  
  // Bar chart data for strategic comparison
  const barData = allCompetitors.length > 0 && allCompetitors[0].metrics
    ? Object.keys(allCompetitors[0].metrics).map(metric => {
        const data: any = { metric: metric.replace(/([A-Z])/g, ' $1').trim() };
        allCompetitors.slice(0, 5).forEach(competitor => {
          const metricValue = competitor.metrics?.[metric as keyof typeof competitor.metrics];
          data[competitor.name || 'Unknown'] = typeof metricValue === 'number' ? metricValue : Math.round(Math.random() * 30 + 60);
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
                <div className="h-[250px]">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Market Segments</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsivePie
                      data={[
                        { id: 'Enterprise', value: 42 },
                        { id: 'Mid-Market', value: 28 },
                        { id: 'SMB', value: 21 },
                        { id: 'Consumer', value: 9 },
                      ]}
                      margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={{ scheme: 'nivo' }}
                      borderWidth={1}
                      borderColor={{
                        from: 'color',
                        modifiers: [['darker', 0.2]],
                      }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{
                        from: 'color',
                        modifiers: [['darker', 2]],
                      }}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 56,
                          itemsSpacing: 0,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: '#999',
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle'
                        }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Competitor Growth Trends</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveBar
                      data={[
                        {
                          year: '2023',
                          'Industry Leader Inc.': 4.2,
                          'Innovation Tech': 8.7,
                          'ValueSoft Solutions': 3.1,
                          'NextGen Systems': 12.5,
                          'Emerging Technologies': 18.6,
                        },
                        {
                          year: '2024',
                          'Industry Leader Inc.': 3.8,
                          'Innovation Tech': 10.3,
                          'ValueSoft Solutions': 2.6,
                          'NextGen Systems': 15.2,
                          'Emerging Technologies': 16.9,
                        },
                        {
                          year: '2025 (Projected)',
                          'Industry Leader Inc.': 2.9,
                          'Innovation Tech': 12.8,
                          'ValueSoft Solutions': 1.8,
                          'NextGen Systems': 18.5,
                          'Emerging Technologies': 14.3,
                        }
                      ]}
                      keys={['Industry Leader Inc.', 'Innovation Tech', 'ValueSoft Solutions', 'NextGen Systems', 'Emerging Technologies']}
                      indexBy="year"
                      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                      padding={0.3}
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={{ scheme: 'nivo' }}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Year',
                        legendPosition: 'middle',
                        legendOffset: 32,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Growth (%)',
                        legendPosition: 'middle',
                        legendOffset: -40,
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
                                itemOpacity: 1,
                              },
                            },
                          ],
                        },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Regional Market Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveHeatMap
                    data={[
                      {
                        id: 'North America',
                        data: [
                          { x: 'Industry Leader', y: 38 },
                          { x: 'Innovation Tech', y: 24 },
                          { x: 'ValueSoft', y: 18 },
                          { x: 'NextGen', y: 12 },
                          { x: 'Heritage', y: 5 },
                          { x: 'Agile', y: 2 },
                          { x: 'Emerging', y: 1 },
                        ]
                      },
                      {
                        id: 'Europe',
                        data: [
                          { x: 'Industry Leader', y: 29 },
                          { x: 'Innovation Tech', y: 21 },
                          { x: 'ValueSoft', y: 22 },
                          { x: 'NextGen', y: 15 },
                          { x: 'Heritage', y: 8 },
                          { x: 'Agile', y: 3 },
                          { x: 'Emerging', y: 2 },
                        ]
                      },
                      {
                        id: 'Asia Pacific',
                        data: [
                          { x: 'Industry Leader', y: 25 },
                          { x: 'Innovation Tech', y: 27 },
                          { x: 'ValueSoft', y: 15 },
                          { x: 'NextGen', y: 18 },
                          { x: 'Heritage', y: 7 },
                          { x: 'Agile', y: 4 },
                          { x: 'Emerging', y: 4 },
                        ]
                      },
                      {
                        id: 'Latin America',
                        data: [
                          { x: 'Industry Leader', y: 19 },
                          { x: 'Innovation Tech', y: 16 },
                          { x: 'ValueSoft', y: 31 },
                          { x: 'NextGen', y: 14 },
                          { x: 'Heritage', y: 12 },
                          { x: 'Agile', y: 6 },
                          { x: 'Emerging', y: 2 },
                        ]
                      },
                      {
                        id: 'Middle East & Africa',
                        data: [
                          { x: 'Industry Leader', y: 22 },
                          { x: 'Innovation Tech', y: 18 },
                          { x: 'ValueSoft', y: 24 },
                          { x: 'NextGen', y: 13 },
                          { x: 'Heritage', y: 11 },
                          { x: 'Agile', y: 8 },
                          { x: 'Emerging', y: 4 },
                        ]
                      }
                    ]}
                    margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
                    valueFormat=">-.2s"
                    axisTop={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Competitors',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Regions',
                      legendPosition: 'middle',
                      legendOffset: -72
                    }}
                    colors={{
                      type: 'sequential',
                      scheme: 'blues'
                    }}
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
                        title: 'Market Share %',
                        titleAlign: 'start',
                        titleOffset: 4
                      }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
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