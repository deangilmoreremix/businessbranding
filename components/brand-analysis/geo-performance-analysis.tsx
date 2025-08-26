'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  BarChart, 
  CheckCircle,
  AlertCircle,
  Zap,
  Download,
  ArrowUpRight,
  Users,
  Building
} from 'lucide-react';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';

interface RegionData {
  region: string;
  marketShare: number;
  brandRecognition: number;
  customerSatisfaction: number;
  growth: number;
  competitivePosition: number;
  revenue?: number;
  stores?: number;
  opportunity?: number;
  revenue_growth?: number;
}

interface GeoPerformanceAnalysisProps {
  data?: {
    regions: RegionData[];
    countryData?: Record<string, RegionData>;
  };
}

export function GeoPerformanceAnalysis({ data }: GeoPerformanceAnalysisProps) {
  const [timeRange, setTimeRange] = useState('90d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Demo data if none provided
  const demoRegions: RegionData[] = [
    {
      region: 'North America',
      marketShare: 32,
      brandRecognition: 85,
      customerSatisfaction: 88,
      growth: 12,
      competitivePosition: 82,
      revenue: 12000000,
      stores: 240,
      opportunity: 65,
      revenue_growth: 14
    },
    {
      region: 'Europe',
      marketShare: 24,
      brandRecognition: 76,
      customerSatisfaction: 82,
      growth: 8,
      competitivePosition: 75,
      revenue: 7800000,
      stores: 120,
      opportunity: 72,
      revenue_growth: 9
    },
    {
      region: 'Asia Pacific',
      marketShare: 18,
      brandRecognition: 65,
      customerSatisfaction: 79,
      growth: 15,
      competitivePosition: 68,
      revenue: 6500000,
      stores: 95,
      opportunity: 88,
      revenue_growth: 21
    },
    {
      region: 'Latin America',
      marketShare: 15,
      brandRecognition: 58,
      customerSatisfaction: 75,
      growth: 10,
      competitivePosition: 62,
      revenue: 2200000,
      stores: 45,
      opportunity: 76,
      revenue_growth: 16
    },
    {
      region: 'Middle East & Africa',
      marketShare: 11,
      brandRecognition: 48,
      customerSatisfaction: 72,
      growth: 18,
      competitivePosition: 55,
      revenue: 1800000,
      stores: 28,
      opportunity: 92,
      revenue_growth: 25
    }
  ];

  const demoCountryData: Record<string, RegionData> = {
    'United States': {
      region: 'United States',
      marketShare: 35,
      brandRecognition: 92,
      customerSatisfaction: 86,
      growth: 10,
      competitivePosition: 88,
      revenue: 9500000,
      stores: 180,
      opportunity: 62,
      revenue_growth: 12
    },
    'Canada': {
      region: 'Canada',
      marketShare: 28,
      brandRecognition: 82,
      customerSatisfaction: 90,
      growth: 14,
      competitivePosition: 78,
      revenue: 2500000,
      stores: 60,
      opportunity: 68,
      revenue_growth: 16
    },
    'United Kingdom': {
      region: 'United Kingdom',
      marketShare: 31,
      brandRecognition: 88,
      customerSatisfaction: 85,
      growth: 6,
      competitivePosition: 82,
      revenue: 2800000,
      stores: 45,
      opportunity: 58,
      revenue_growth: 8
    },
    'Germany': {
      region: 'Germany',
      marketShare: 26,
      brandRecognition: 75,
      customerSatisfaction: 84,
      growth: 8,
      competitivePosition: 76,
      revenue: 2200000,
      stores: 35,
      opportunity: 72,
      revenue_growth: 10
    },
    'France': {
      region: 'France',
      marketShare: 22,
      brandRecognition: 72,
      customerSatisfaction: 78,
      growth: 7,
      competitivePosition: 70,
      revenue: 1800000,
      stores: 28,
      opportunity: 75,
      revenue_growth: 9
    },
    'China': {
      region: 'China',
      marketShare: 15,
      brandRecognition: 62,
      customerSatisfaction: 80,
      growth: 22,
      competitivePosition: 65,
      revenue: 3200000,
      stores: 42,
      opportunity: 92,
      revenue_growth: 25
    },
    'Japan': {
      region: 'Japan',
      marketShare: 24,
      brandRecognition: 78,
      customerSatisfaction: 86,
      growth: 9,
      competitivePosition: 72,
      revenue: 1800000,
      stores: 30,
      opportunity: 78,
      revenue_growth: 11
    },
    'Australia': {
      region: 'Australia',
      marketShare: 26,
      brandRecognition: 82,
      customerSatisfaction: 88,
      growth: 11,
      competitivePosition: 74,
      revenue: 1500000,
      stores: 23,
      opportunity: 76,
      revenue_growth: 14
    },
    'Brazil': {
      region: 'Brazil',
      marketShare: 18,
      brandRecognition: 65,
      customerSatisfaction: 76,
      growth: 12,
      competitivePosition: 60,
      revenue: 1200000,
      stores: 28,
      opportunity: 82,
      revenue_growth: 18
    },
    'Mexico': {
      region: 'Mexico',
      marketShare: 16,
      brandRecognition: 60,
      customerSatisfaction: 74,
      growth: 9,
      competitivePosition: 58,
      revenue: 1000000,
      stores: 18,
      opportunity: 80,
      revenue_growth: 16
    }
  };

  const regions = data?.regions || demoRegions;
  const countryData = data?.countryData || demoCountryData;
  
  // Prepare data for bar chart
  const marketShareData = regions.map(region => ({
    region: region.region,
    'Market Share': region.marketShare,
  }));

  // Prepare data for heatmap
  const heatmapData = [
    {
      id: 'Brand Recognition',
      data: regions.map(region => ({ x: region.region, y: region.brandRecognition }))
    },
    {
      id: 'Customer Satisfaction',
      data: regions.map(region => ({ x: region.region, y: region.customerSatisfaction }))
    },
    {
      id: 'Growth',
      data: regions.map(region => ({ x: region.region, y: region.growth }))
    },
    {
      id: 'Competitive Position',
      data: regions.map(region => ({ x: region.region, y: region.competitivePosition }))
    }
  ];

  // Prepare data for pie chart
  const revenueData = regions
    .filter(region => region.revenue !== undefined)
    .map(region => ({
      id: region.region,
      label: region.region,
      value: region.revenue as number
    }));

  // Prepare top countries by opportunity
  const topOpportunityCountries = Object.entries(countryData)
    .sort(([, a], [, b]) => (b.opportunity || 0) - (a.opportunity || 0))
    .slice(0, 5)
    .map(([country, data]) => ({ country, ...data }));
    
  // Prepare growth countries list
  const topGrowthCountries = Object.entries(countryData)
    .sort(([, a], [, b]) => (b.revenue_growth || 0) - (a.revenue_growth || 0))
    .slice(0, 5)
    .map(([country, data]) => ({ country, ...data }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Geographic Performance</CardTitle>
          <div className="flex gap-4 items-center">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b mb-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Regions
              </TabsTrigger>
              <TabsTrigger value="countries" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Countries
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Opportunities
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                { title: 'Global Brand Recognition', value: '72%', change: '+8%', icon: Globe, color: 'blue' },
                { title: 'Geographic Coverage', value: '42 Countries', change: '+6', icon: MapPin, color: 'purple' },
                { title: 'Highest Growth Region', value: 'Asia Pacific', change: '+22%', icon: TrendingUp, color: 'green' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={`p-4 bg-${stat.color}-500/5`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold">{stat.value}</h3>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {stat.change}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Market Share by Region</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveBar
                      data={marketShareData}
                      keys={['Market Share']}
                      indexBy="region"
                      margin={{ top: 50, right: 30, bottom: 50, left: 120 }}
                      padding={0.3}
                      layout="horizontal"
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={{ scheme: 'category10' }}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Market Share (%)',
                        legendPosition: 'middle',
                        legendOffset: 32
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsivePie
                      data={revenueData}
                      margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={{ scheme: 'category10' }}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Performance Heatmap by Region</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveHeatMap
                    data={heatmapData}
                    margin={{ top: 40, right: 60, bottom: 60, left: 120 }}
                    xInnerPadding={0.1}
                    yInnerPadding={0.1}
                    axisTop={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: '',
                    }}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Regions',
                      legendPosition: 'middle',
                      legendOffset: 36
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Metrics',
                      legendPosition: 'middle',
                      legendOffset: -100
                    }}
                    colors={{
                      type: 'sequential',
                      scheme: 'blue_green'
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
                        tickFormat: '>-.2s',
                        title: 'Performance Score',
                        titleAlign: 'start',
                        titleOffset: 4
                      }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <Card className="lg:col-span-1">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Top Growth Countries</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {topGrowthCountries.map((country, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{country.country}</h3>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              +{country.revenue_growth}%
                            </Badge>
                          </div>
                          <Progress value={country.revenue_growth} max={30} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Top Opportunity Markets</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {topOpportunityCountries.map((country, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            {country.country}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Opportunity: {country.opportunity}%
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Market Share</span>
                              <span>{country.marketShare}%</span>
                            </div>
                            <Progress value={country.marketShare} className="h-1.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Growth</span>
                              <span className="text-green-500">+{country.growth}%</span>
                            </div>
                            <Progress value={country.growth} max={30} className="h-1.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Recognition</span>
                              <span>{country.brandRecognition}%</span>
                            </div>
                            <Progress value={country.brandRecognition} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="regions">
            <div className="grid grid-cols-1 gap-6 mb-6">
              {regions.map((region, i) => (
                <Card key={region.region} className="overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-blue-700 dark:text-blue-300 text-xl font-semibold">{i + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-lg mb-1">{region.region}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Market Share: {region.marketShare}%
                            </Badge>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Growth: +{region.growth}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Button variant="outline" size="sm">
                          Expand
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <h4 className="font-medium flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Brand Recognition
                          </h4>
                          <span>{region.brandRecognition}%</span>
                        </div>
                        <Progress value={region.brandRecognition} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {region.brandRecognition >= 80 ? 'Excellent' : 
                           region.brandRecognition >= 70 ? 'Strong' : 
                           region.brandRecognition >= 60 ? 'Good' : 
                           'Needs improvement'}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <h4 className="font-medium flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            Customer Satisfaction
                          </h4>
                          <span>{region.customerSatisfaction}%</span>
                        </div>
                        <Progress value={region.customerSatisfaction} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {region.customerSatisfaction >= 85 ? 'Excellent' : 
                           region.customerSatisfaction >= 75 ? 'Strong' : 
                           region.customerSatisfaction >= 65 ? 'Good' : 
                           'Needs improvement'}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <h4 className="font-medium flex items-center gap-1">
                            <BarChart className="h-4 w-4 text-purple-500" />
                            Competitive Position
                          </h4>
                          <span>{region.competitivePosition}%</span>
                        </div>
                        <Progress value={region.competitivePosition} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {region.competitivePosition >= 80 ? 'Market leader' : 
                           region.competitivePosition >= 70 ? 'Strong competitor' : 
                           region.competitivePosition >= 60 ? 'Established' : 
                           'Developing'}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <h4 className="font-medium flex items-center gap-1">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Growth Opportunity
                          </h4>
                          <span>{region.opportunity || 75}%</span>
                        </div>
                        <Progress value={region.opportunity || 75} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {(region.opportunity || 75) >= 85 ? 'Exceptional opportunity' : 
                           (region.opportunity || 75) >= 75 ? 'Strong opportunity' : 
                           (region.opportunity || 75) >= 65 ? 'Good opportunity' : 
                           'Limited opportunity'}
                        </p>
                      </div>
                    </div>
                    
                    {(region.stores !== undefined || region.revenue !== undefined) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {region.revenue !== undefined && (
                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">Revenue Contribution</p>
                              <p className="font-medium">${(region.revenue / 1000000).toFixed(1)}M</p>
                            </div>
                          </Card>
                        )}
                        
                        {region.stores !== undefined && (
                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">Physical Presence</p>
                              <p className="font-medium">{region.stores} stores</p>
                            </div>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="countries">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <Select defaultValue="marketShare">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketShare">Market Share</SelectItem>
                  <SelectItem value="growth">Growth Rate</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                  <SelectItem value="brandRecognition">Brand Recognition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(countryData).map(([country, data], i) => (
                <Card key={country} className="overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        </div>
                        <h3 className="font-medium">{country}</h3>
                      </div>
                      
                      <Badge variant={
                        data.marketShare > 30 ? 'default' : 
                        data.marketShare > 20 ? 'secondary' : 'outline'
                      }>
                        {data.marketShare}% Share
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Brand Recognition</span>
                          <span className="font-medium">{data.brandRecognition}%</span>
                        </div>
                        <Progress value={data.brandRecognition} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Customer Satisfaction</span>
                          <span className="font-medium">{data.customerSatisfaction}%</span>
                        </div>
                        <Progress value={data.customerSatisfaction} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Growth</span>
                          <span className="font-medium text-green-500">+{data.growth}%</span>
                        </div>
                        <Progress value={data.growth * 3} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Revenue: </span>
                          <span className="font-medium">${(data.revenue || 0)/1000000}M</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Stores: </span>
                          <span className="font-medium">{data.stores || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="opportunities">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Opportunity Score by Region</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveBar
                      data={regions.map(region => ({
                        region: region.region,
                        'Opportunity Score': region.opportunity || 75,
                      }))}
                      keys={['Opportunity Score']}
                      indexBy="region"
                      margin={{ top: 50, right: 50, bottom: 50, left: 120 }}
                      padding={0.3}
                      layout="horizontal"
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={['#3B82F6']}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Opportunity Score',
                        legendPosition: 'middle',
                        legendOffset: 45
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0
                      }}
                      labelSkipWidth={16}
                      labelSkipHeight={16}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Growth Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-5">
                    {[
                      { title: 'Market Expansion', description: 'Potential for significant market share growth in Asia Pacific', score: 85 },
                      { title: 'Brand Recognition', description: 'Opportunity to improve brand visibility in emerging markets', score: 78 },
                      { title: 'Digital Penetration', description: 'Enhance digital presence in Latin America and Middle East', score: 92 },
                      { title: 'Retail Presence', description: 'Expand physical locations in high-growth urban centers', score: 74 }
                    ].map((opportunity, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium flex items-center">
                              <Zap className="h-4 w-4 mr-2 text-amber-500" />
                              {opportunity.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {opportunity.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {opportunity.score}% Potential
                          </Badge>
                        </div>
                        <Progress value={opportunity.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Strategic Entry Markets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    country: "Vietnam",
                    region: "Southeast Asia",
                    marketSize: "$2.4B",
                    growth: "+18%",
                    entryBarrier: "Moderate",
                    opportunity: 92,
                    competitors: 4
                  },
                  {
                    country: "Poland",
                    region: "Eastern Europe",
                    marketSize: "$1.8B",
                    growth: "+12%",
                    entryBarrier: "Low",
                    opportunity: 86,
                    competitors: 3
                  },
                  {
                    country: "Colombia",
                    region: "Latin America",
                    marketSize: "$1.2B",
                    growth: "+15%",
                    entryBarrier: "Moderate",
                    opportunity: 84,
                    competitors: 5
                  }
                ].map((market, i) => (
                  <Card key={i} className="flex flex-col">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{market.country}</h3>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {market.growth} Growth
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{market.region}</p>
                    </div>
                    <div className="p-4 space-y-4 flex-grow">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Market Size</p>
                          <p className="font-medium">{market.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entry Barrier</p>
                          <p className="font-medium">{market.entryBarrier}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Competitors</p>
                          <p className="font-medium">{market.competitors} major</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Opportunity</p>
                          <p className="font-medium">{market.opportunity}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" size="sm" className="w-full">
                        View Market Analysis
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <Card className="mt-6">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Market Entry Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Primary Focus Regions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { region: 'Southeast Asia', strategy: 'Digital-first approach with localized marketing', timeframe: 'Q2-Q3 2025' },
                        { region: 'Eastern Europe', strategy: 'Strategic partnerships with local distributors', timeframe: 'Q3-Q4 2025' },
                        { region: 'Latin America', strategy: 'Urban center expansion with flagship locations', timeframe: 'Q1-Q2 2026' }
                      ].map((rec, i) => (
                        <Card key={i} className="p-4">
                          <h5 className="font-medium mb-1">{rec.region}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{rec.strategy}</p>
                          <Badge variant="outline">{rec.timeframe}</Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Markets to Approach with Caution
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { region: 'Western Africa', reason: 'Political instability and infrastructure challenges', risk: 'High' },
                        { region: 'Central Asia', reason: 'Regulatory complexity and competitive saturation', risk: 'Moderate' }
                      ].map((rec, i) => (
                        <Card key={i} className="p-4 flex justify-between items-center">
                          <div>
                            <h5 className="font-medium mb-1">{rec.region}</h5>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                          <Badge variant={rec.risk === 'High' ? 'destructive' : 'outline'}>
                            {rec.risk} Risk
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}