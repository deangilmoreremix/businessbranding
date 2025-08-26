'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ContentDashboard } from '@/components/content-dashboard';
import { SupabaseSetup } from '@/components/supabase-setup';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileAudio, 
  Image as ImageIcon, 
  Sparkles, 
  Clock, 
  Activity,
  Plus,
  ArrowRight,
  BarChart,
  Globe,
  Users,
  Share2,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analytics data
  const trendData = [
    {
      id: 'engagement',
      data: [
        { x: 'Jan', y: 65 },
        { x: 'Feb', y: 75 },
        { x: 'Mar', y: 85 },
        { x: 'Apr', y: 90 },
        { x: 'May', y: 95 },
        { x: 'Jun', y: 88 }
      ]
    }
  ];

  const pieData = [
    { id: 'Voice Content', value: 35 },
    { id: 'Visual Assets', value: 40 },
    { id: 'Brand Analysis', value: 25 }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Content Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your voice content and AI-generated assets
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Total Content', value: '124', icon: FileAudio, color: 'blue' },
            { title: 'Generated Today', value: '8', icon: Sparkles, color: 'purple' },
            { title: 'Total Duration', value: '42h', icon: Clock, color: 'indigo' },
            { title: 'Success Rate', value: '96%', icon: Activity, color: 'green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`p-6 bg-${stat.color}-500/5 border-${stat.color}-500/20`}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <SupabaseSetup />
        
        <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Content Analysis</h3>
                <p className="text-sm text-muted-foreground">Get insights about your content performance</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => setIsAnalyzing(true)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Content
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">Content Quality</h4>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>

            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">Brand Consistency</h4>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>

            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium mb-2">Engagement Rate</h4>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Content Performance</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsiveLine
                data={trendData}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Engagement',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
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
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Content Distribution</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsivePie
                data={pieData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                colors={{ scheme: 'nivo' }}
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
          </Card>
        </div>

        <ContentDashboard />
      </div>
    </div>
  );
}