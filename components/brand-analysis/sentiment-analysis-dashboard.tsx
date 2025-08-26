'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart,
  AlertTriangle,
  Minus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  Users,
  Globe,
  Search
} from 'lucide-react';

import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveStream } from '@nivo/stream';

interface SentimentAnalysisDashboardProps {
  data?: {
    overall: {
      positive: number;
      neutral: number;
      negative: number;
    };
    trend?: Array<{
      date: string;
      positive: number;
      neutral: number;
      negative: number;
    }>;
    platforms?: Record<string, {
      positive: number;
      neutral: number;
      negative: number;
      volume: number;
    }>;
    topics?: Array<{
      topic: string;
      sentiment: number;
      volume: number;
    }>;
    keywords?: Record<string, {
      sentiment: number;
      volume: number;
    }>;
    demographics?: Record<string, {
      positive: number;
      neutral: number;
      negative: number;
    }>;
  };
}

export function SentimentAnalysisDashboard({ data }: SentimentAnalysisDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [platform, setPlatform] = useState('all');
  
  // Demo data if none provided
  const demoData = {
    overall: {
      positive: data?.overall?.positive || 68,
      neutral: data?.overall?.neutral || 22,
      negative: data?.overall?.negative || 10
    },
    trend: data?.trend || [
      { date: '2025-01-01', positive: 55, neutral: 35, negative: 10 },
      { date: '2025-01-08', positive: 58, neutral: 32, negative: 10 },
      { date: '2025-01-15', positive: 62, neutral: 28, negative: 10 },
      { date: '2025-01-22', positive: 59, neutral: 29, negative: 12 },
      { date: '2025-01-29', positive: 63, neutral: 27, negative: 10 },
      { date: '2025-02-05', positive: 65, neutral: 25, negative: 10 },
      { date: '2025-02-12', positive: 64, neutral: 26, negative: 10 },
      { date: '2025-02-19', positive: 68, neutral: 22, negative: 10 },
      { date: '2025-02-26', positive: 70, neutral: 20, negative: 10 },
      { date: '2025-03-05', positive: 69, neutral: 21, negative: 10 },
      { date: '2025-03-12', positive: 72, neutral: 18, negative: 10 },
      { date: '2025-03-19', positive: 74, neutral: 16, negative: 10 },
    ],
    platforms: data?.platforms || {
      facebook: { positive: 72, neutral: 18, negative: 10, volume: 38 },
      twitter: { positive: 65, neutral: 20, negative: 15, volume: 42 },
      instagram: { positive: 78, neutral: 16, negative: 6, volume: 35 },
      linkedin: { positive: 82, neutral: 12, negative: 6, volume: 25 }
    },
    topics: data?.topics || [
      { topic: 'Product Quality', sentiment: 85, volume: 125 },
      { topic: 'Customer Service', sentiment: 76, volume: 98 },
      { topic: 'User Experience', sentiment: 82, volume: 110 },
      { topic: 'Pricing', sentiment: 62, volume: 87 },
      { topic: 'Brand Values', sentiment: 88, volume: 45 },
    ],
    keywords: data?.keywords || {
      'innovative': { sentiment: 92, volume: 85 },
      'reliable': { sentiment: 88, volume: 76 },
      'expensive': { sentiment: 42, volume: 68 },
      'professional': { sentiment: 95, volume: 62 },
      'intuitive': { sentiment: 87, volume: 58 },
      'customer service': { sentiment: 74, volume: 72 },
      'quality': { sentiment: 86, volume: 92 },
      'buggy': { sentiment: 28, volume: 42 },
    },
    demographics: data?.demographics || {
      '18-24': { positive: 75, neutral: 15, negative: 10 },
      '25-34': { positive: 72, neutral: 18, negative: 10 },
      '35-44': { positive: 68, neutral: 22, negative: 10 },
      '45-54': { positive: 64, neutral: 26, negative: 10 },
      '55+': { positive: 62, neutral: 28, negative: 10 },
    }
  };

  // Prepare sentiment trend data for line chart
  const sentimentTrendData = [
    {
      id: 'Positive',
      data: demoData.trend.map(point => ({
        x: point.date,
        y: point.positive
      }))
    },
    {
      id: 'Neutral',
      data: demoData.trend.map(point => ({
        x: point.date,
        y: point.neutral
      }))
    },
    {
      id: 'Negative',
      data: demoData.trend.map(point => ({
        x: point.date,
        y: point.negative
      }))
    }
  ];

  // Prepare platform data for bar chart
  const platformData = Object.entries(demoData.platforms).map(([platform, data]) => ({
    platform,
    Positive: data.positive,
    Neutral: data.neutral,
    Negative: data.negative,
    volume: data.volume
  }));

  // Prepare keywords data
  const keywordsData = Object.entries(demoData.keywords).map(([keyword, data]) => ({
    keyword,
    sentiment: data.sentiment,
    volume: data.volume
  }));

  // Prepare data for stream chart
  const streamData = [
    { month: 'Jan', Positive: 65, Neutral: 25, Negative: 10 },
    { month: 'Feb', Positive: 67, Neutral: 23, Negative: 10 },
    { month: 'Mar', Positive: 70, Neutral: 20, Negative: 10 },
    { month: 'Apr', Positive: 68, Neutral: 22, Negative: 10 },
    { month: 'May', Positive: 72, Neutral: 18, Negative: 10 },
    { month: 'Jun', Positive: 75, Neutral: 15, Negative: 10 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Brand Sentiment Analysis</CardTitle>
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Sentiment Score Cards */}
              <Card className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm">Positive Sentiment</p>
                    <p className="text-2xl font-bold mt-1">{demoData.overall.positive}%</p>
                    <p className="text-sm mt-1 flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+4% vs previous period</span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100">
                    <Heart className="text-green-500 h-5 w-5" />
                  </div>
                </div>
                <Progress value={demoData.overall.positive} className="mt-4 h-2" />
              </Card>
              
              <Card className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm">Neutral Sentiment</p>
                    <p className="text-2xl font-bold mt-1">{demoData.overall.neutral}%</p>
                    <p className="text-sm mt-1 flex items-center">
                      <TrendingDown className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-blue-500">-2% vs previous period</span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                    <Minus className="text-blue-500 h-5 w-5" />
                  </div>
                </div>
                <Progress value={demoData.overall.neutral} className="mt-4 h-2" />
              </Card>
              
              <Card className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm">Negative Sentiment</p>
                    <p className="text-2xl font-bold mt-1">{demoData.overall.negative}%</p>
                    <p className="text-sm mt-1 flex items-center">
                      <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-amber-500">-2% vs previous period</span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-amber-100">
                    <AlertTriangle className="text-amber-500 h-5 w-5" />
                  </div>
                </div>
                <Progress value={demoData.overall.negative} className="mt-4 h-2" />
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Sentiment Trend Over Time</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[350px]">
                    <ResponsiveLine
                      data={sentimentTrendData}
                      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                      xScale={{ type: 'point' }}
                      yScale={{
                        type: 'linear',
                        min: 0,
                        max: 100,
                        stacked: false,
                      }}
                      yFormat=" >-.2f"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: 'Time',
                        legendOffset: 40,
                        legendPosition: 'middle',
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Sentiment (%)',
                        legendOffset: -40,
                        legendPosition: 'middle',
                      }}
                      colors={{ scheme: 'category10' }}
                      pointSize={10}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'column',
                          justify: false,
                          translateX: 100,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemDirection: 'left-to-right',
                          itemWidth: 80,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: 'circle',
                          symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsivePie
                      data={[
                        { id: 'Positive', label: 'Positive', value: demoData.overall.positive, color: 'rgb(74, 222, 128)' },
                        { id: 'Neutral', label: 'Neutral', value: demoData.overall.neutral, color: 'rgb(56, 189, 248)' },
                        { id: 'Negative', label: 'Negative', value: demoData.overall.negative, color: 'rgb(251, 146, 60)' }
                      ]}
                      margin={{ top: 30, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={{ datum: 'data.color' }}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{ theme: 'background' }}
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
                  <CardTitle className="text-lg">Sentiment Volume</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveStream
                      data={streamData}
                      keys={['Positive', 'Neutral', 'Negative']}
                      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        orient: 'bottom',
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: '',
                        legendOffset: 36
                      }}
                      axisLeft={{
                        orient: 'left',
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Distribution',
                        legendOffset: -40
                      }}
                      enableGridX={true}
                      enableGridY={false}
                      offsetType="silhouette"
                      colors={{ scheme: 'category10' }}
                      fillOpacity={0.85}
                      borderColor={{ theme: 'background' }}
                      dotSize={8}
                      dotColor={{ from: 'color' }}
                      dotBorderWidth={2}
                      dotBorderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'column',
                          translateX: 100,
                          itemWidth: 80,
                          itemHeight: 20,
                          itemTextColor: '#999999',
                          symbolSize: 12,
                          symbolShape: 'circle',
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemTextColor: '#000000'
                              }
                            }
                          ]
                        }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Sentiment by Keywords</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(demoData.keywords).slice(0, 8).map(([keyword, data]) => (
                    <div key={keyword} className="relative">
                      <Card className="p-3">
                        <div className="space-y-2">
                          <Badge variant="outline" className="w-full justify-between">
                            {keyword}
                            <span className={
                              data.sentiment >= 80 ? 'text-green-500' : 
                              data.sentiment >= 60 ? 'text-blue-500' : 
                              'text-amber-500'
                            }>
                              {data.sentiment}%
                            </span>
                          </Badge>
                          <Progress 
                            value={data.sentiment} 
                            className="h-2"
                            color={
                              data.sentiment >= 80 ? 'bg-green-500' : 
                              data.sentiment >= 60 ? 'bg-blue-500' : 
                              'bg-amber-500'
                            }
                          />
                          <div className="text-xs text-muted-foreground text-right">
                            {data.volume} mentions
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="topics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Topic Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[400px]">
                    <ResponsiveBar
                      data={demoData.topics.map(topic => ({
                        topic: topic.topic,
                        sentiment: topic.sentiment,
                        volume: topic.volume
                      }))}
                      keys={['sentiment']}
                      indexBy="topic"
                      margin={{ top: 50, right: 130, bottom: 50, left: 150 }}
                      padding={0.3}
                      layout="horizontal"
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={{ scheme: 'blues' }}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Sentiment Score (%)',
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
                      markers={[
                        {
                          axis: 'x',
                          value: 60,
                          lineStyle: { stroke: '#888', strokeDasharray: '3 3' },
                          legend: 'Neutral',
                          legendPosition: 'top-left',
                          legendOrientation: 'horizontal',
                          legendOffsetY: -25
                        }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Top Positive Topics</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {demoData.topics
                      .filter(topic => topic.sentiment >= 75)
                      .sort((a, b) => b.sentiment - a.sentiment)
                      .slice(0, 4)
                      .map((topic, i) => (
                        <div key={topic.topic} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{topic.topic}</span>
                            <span className="text-green-500">{topic.sentiment}%</span>
                          </div>
                          <Progress value={topic.sentiment} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{topic.volume} mentions</span>
                            <span className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              +{Math.round(Math.random() * 10 + 5)}% from last period
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Areas of Concern</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {demoData.topics
                      .filter(topic => topic.sentiment < 70)
                      .sort((a, b) => a.sentiment - b.sentiment)
                      .slice(0, 4)
                      .map((topic, i) => (
                        <div key={topic.topic} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{topic.topic}</span>
                            <span className="text-amber-500">{topic.sentiment}%</span>
                          </div>
                          <Progress value={topic.sentiment} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{topic.volume} mentions</span>
                            <span className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              +{Math.round(Math.random() * 5 + 1)}% from last period
                            </span>
                          </div>
                        </div>
                      ))
                    }
                    
                    {demoData.topics.filter(topic => topic.sentiment < 70).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-amber-500" />
                        <p>No topics with concerning sentiment found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Topic Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Most Discussed', value: 'Product Quality', mentions: 125, sentiment: 85 },
                      { title: 'Most Positive', value: 'Brand Values', sentiment: 88, mentions: 45 },
                      { title: 'Needs Attention', value: 'Pricing', sentiment: 62, mentions: 87 },
                    ].map((metric, i) => (
                      <Card key={i} className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                        <h3 className="font-medium text-xl mb-2">{metric.value}</h3>
                        <div className="flex justify-between text-sm">
                          <span>{metric.mentions} mentions</span>
                          <Badge className={metric.sentiment >= 75 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {metric.sentiment}% sentiment
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="channels">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="md:col-span-2">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Channel Sentiment Comparison</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[400px]">
                    <ResponsiveBar
                      data={platformData}
                      keys={['Positive', 'Neutral', 'Negative']}
                      indexBy="platform"
                      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                      padding={0.3}
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={{ scheme: 'nivo' }}
                      defs={[
                        {
                          id: 'dots',
                          type: 'patternDots',
                          background: 'inherit',
                          color: '#38bcb2',
                          size: 4,
                          padding: 1,
                          stagger: true
                        },
                        {
                          id: 'lines',
                          type: 'patternLines',
                          background: 'inherit',
                          color: '#eed312',
                          rotation: -45,
                          lineWidth: 6,
                          spacing: 10
                        }
                      ]}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Platform',
                        legendPosition: 'middle',
                        legendOffset: 32,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Sentiment (%)',
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {Object.entries(demoData.platforms).map(([platform, data]) => (
                <Card key={platform} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                      {platform === 'facebook' && <Facebook className="h-6 w-6 text-blue-600" />}
                      {platform === 'twitter' && <Twitter className="h-6 w-6 text-blue-400" />}
                      {platform === 'instagram' && <Instagram className="h-6 w-6 text-pink-500" />}
                      {platform === 'linkedin' && <Linkedin className="h-6 w-6 text-blue-700" />}
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{platform}</h3>
                      <p className="text-sm text-muted-foreground">{data.volume}% of total mentions</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant={
                        data.positive >= 75 ? 'default' : 
                        data.positive >= 60 ? 'secondary' : 
                        'outline'
                      }>
                        {data.positive >= 75 ? 'Strong' : 
                         data.positive >= 60 ? 'Good' : 
                         'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 text-green-500 mr-1" /> Positive
                        </span>
                        <span>{data.positive}%</span>
                      </div>
                      <Progress value={data.positive} className="h-1.5" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Minus className="h-3 w-3 text-blue-500 mr-1" /> Neutral
                        </span>
                        <span>{data.neutral}%</span>
                      </div>
                      <Progress value={data.neutral} className="h-1.5" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" /> Negative
                        </span>
                        <span>{data.negative}%</span>
                      </div>
                      <Progress value={data.negative} className="h-1.5" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Messages
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <Card className="mb-6">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Channel Growth Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { platform: 'Instagram', growth: 28, engagement: 16 },
                    { platform: 'LinkedIn', growth: 35, engagement: 22 },
                    { platform: 'YouTube', growth: 42, engagement: 18 },
                  ].map((opportunity, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{opportunity.platform}</h3>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          +{opportunity.growth}% Growth
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Engagement Potential</span>
                          <span className="font-medium">+{opportunity.engagement}%</span>
                        </div>
                        <Progress value={opportunity.engagement * 3} className="h-2" />
                      </div>
                      <div className="mt-4 text-right">
                        <Button variant="ghost" size="sm" className="text-sm">
                          Explore Strategy
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="demographics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Demographic Sentiment</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[350px]">
                    <ResponsiveBar
                      data={Object.entries(demoData.demographics).map(([age, data]) => ({
                        age,
                        Positive: data.positive,
                        Neutral: data.neutral,
                        Negative: data.negative
                      }))}
                      keys={['Positive', 'Neutral', 'Negative']}
                      indexBy="age"
                      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                      padding={0.3}
                      groupMode="stacked"
                      colors={{ scheme: 'nivo' }}
                      defs={[
                        {
                          id: 'dots',
                          type: 'patternDots',
                          background: 'inherit',
                          color: '#38bcb2',
                          size: 4,
                          padding: 1,
                          stagger: true
                        },
                        {
                          id: 'lines',
                          type: 'patternLines',
                          background: 'inherit',
                          color: '#eed312',
                          rotation: -45,
                          lineWidth: 6,
                          spacing: 10
                        }
                      ]}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Age Group',
                        legendPosition: 'middle',
                        legendOffset: 32,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Sentiment (%)',
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
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Audience Insights</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Highest Engagement</h4>
                        <Badge>25-34 age group</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This group shows 28% higher engagement than average and the most positive sentiment.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Growth Opportunity</h4>
                        <Badge variant="outline">45-54 age group</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This segment has 32% more spending power but 18% lower engagement than younger groups.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Sentiment Concern</h4>
                        <Badge variant="destructive">55+ age group</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This group shows the lowest positive sentiment (62%) with concerns around usability.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Primary Audience</p>
                            <p className="font-medium">Urban Professionals</p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Top Region</p>
                            <p className="font-medium">North America</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Geographic Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { region: 'North America', positive: 72, neutral: 18, negative: 10, volume: 42 },
                    { region: 'Europe', positive: 68, neutral: 22, negative: 10, volume: 28 },
                    { region: 'Asia Pacific', positive: 65, neutral: 20, negative: 15, volume: 22 },
                    { region: 'Latin America', positive: 70, neutral: 19, negative: 11, volume: 8 },
                  ].map((region) => (
                    <Card key={region.region} className="p-4">
                      <h3 className="font-medium mb-2">{region.region}</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Positive</span>
                            <span className="font-medium">{region.positive}%</span>
                          </div>
                          <Progress value={region.positive} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Neutral</span>
                            <span className="font-medium">{region.neutral}%</span>
                          </div>
                          <Progress value={region.neutral} className="h-1.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Negative</span>
                            <span className="font-medium">{region.negative}%</span>
                          </div>
                          <Progress value={region.negative} className="h-1.5" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{region.volume}% of total volume</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}