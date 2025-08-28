'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentDashboard } from '@/components/content-dashboard';
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
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  XCircle,
  Bell,
  Check
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { getRealTimeMetrics, getRealtimeAlerts, subscribeToRealtimeUpdates, type RealTimeMetrics } from '@/lib/services/real-time-analytics';

// Notification Component
const NotificationToast = ({
  alert,
  onDismiss
}: {
  alert: any;
  onDismiss: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`p-4 rounded-lg border shadow-lg ${
        alert.type === 'critical' ? 'bg-red-50 border-red-200' :
        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          alert.type === 'critical' ? 'bg-red-500/20 text-red-600' :
          alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
          'bg-blue-500/20 text-blue-600'
        }`}>
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium">{alert.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant={
              alert.impact === 'high' ? 'destructive' :
              alert.impact === 'medium' ? 'default' : 'secondary'
            }>
              {alert.impact} Impact
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
   const [isLoading, setIsLoading] = useState(false);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [realTimeData, setRealTimeData] = useState<RealTimeMetrics | null>(null);
   const [alerts, setAlerts] = useState<any[]>([]);
   const [isLoadingData, setIsLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [toastNotifications, setToastNotifications] = useState<any[]>([]);
   const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

   // Load real-time data on component mount
   useEffect(() => {
     loadRealTimeData();

     // Subscribe to real-time updates
     const unsubscribe = subscribeToRealtimeUpdates(
       (data) => {
         setRealTimeData(data);
         setConnectionStatus('connected');

         // Check for new alerts and show notifications
         if (data.alerts && data.alerts.length > 0) {
           const newAlerts = data.alerts.filter(alert =>
             !alerts.some(existing => existing.id === alert.id)
           );

           if (newAlerts.length > 0) {
             setAlerts(prev => [...prev, ...newAlerts]);

             // Show toast notifications for new alerts
             newAlerts.forEach(alert => {
               showToastNotification(alert);
             });
           }
         }
       },
       (error) => {
         console.error('Real-time update error:', error);
         setConnectionStatus('disconnected');
       }
     );

     return unsubscribe;
   }, [alerts]);

   const showToastNotification = (alert: any) => {
     const notification = {
       id: Date.now() + Math.random(),
       alert,
       timestamp: Date.now()
     };

     setToastNotifications(prev => [...prev, notification]);

     // Auto-dismiss after 5 seconds
     setTimeout(() => {
       setToastNotifications(prev =>
         prev.filter(n => n.id !== notification.id)
       );
     }, 5000);
   };

   const dismissToast = (id: number) => {
     setToastNotifications(prev => prev.filter(n => n.id !== id));
   };

   const loadRealTimeData = async () => {
     try {
       setIsLoadingData(true);
       setError(null);

       const [metricsData, alertsData] = await Promise.all([
         getRealTimeMetrics(),
         getRealtimeAlerts()
       ]);

       setRealTimeData(metricsData);
       setAlerts(alertsData.alerts || []);
     } catch (err) {
       console.error('Failed to load real-time data:', err);
       setError('Failed to load dashboard data');
     } finally {
       setIsLoadingData(false);
     }
   };

   // Prepare analytics data from real-time metrics
   const trendData = realTimeData ? [
     {
       id: 'brand-health',
       data: [
         { x: 'Week 1', y: Math.round(realTimeData.brandHealth.score - 5) },
         { x: 'Week 2', y: Math.round(realTimeData.brandHealth.score - 2) },
         { x: 'Week 3', y: Math.round(realTimeData.brandHealth.score) },
         { x: 'Week 4', y: Math.round(realTimeData.brandHealth.score + 2) }
       ]
     }
   ] : [];

   const pieData = realTimeData ? [
     { id: 'Website Traffic', value: Math.round(realTimeData.digitalPresence.websiteTraffic.visitors / 100) },
     { id: 'Social Media', value: Math.round(realTimeData.digitalPresence.socialMedia.followers / 1000) },
     { id: 'SEO Performance', value: Math.round(realTimeData.digitalPresence.seoPerformance.organicTraffic / 10) }
   ] : [];

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
          {realTimeData ? [
            {
              title: 'Website Traffic',
              value: realTimeData.digitalPresence.websiteTraffic.visitors.toLocaleString(),
              icon: Globe,
              color: 'blue',
              trend: realTimeData.brandHealth.trend,
              change: realTimeData.brandHealth.change
            },
            {
              title: 'Brand Health',
              value: `${Math.round(realTimeData.brandHealth.score)}%`,
              icon: Activity,
              color: 'green',
              trend: realTimeData.brandHealth.trend,
              change: realTimeData.brandHealth.change
            },
            {
              title: 'Social Followers',
              value: realTimeData.digitalPresence.socialMedia.followers.toLocaleString(),
              icon: Users,
              color: 'purple',
              trend: realTimeData.competitivePosition.trend === 'gaining' ? 'up' : 'down',
              change: realTimeData.competitivePosition.competitorGap
            },
            {
              title: 'Monthly Revenue',
              value: `$${realTimeData.customerMetrics.revenue.monthlyRecurringRevenue.toLocaleString()}`,
              icon: BarChart,
              color: 'indigo',
              trend: realTimeData.customerMetrics.revenue.growthRate > 0 ? 'up' : 'down',
              change: realTimeData.customerMetrics.revenue.growthRate
            }
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
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : stat.trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                        {stat.change > 0 ? '+' : ''}{typeof stat.change === 'number' ? stat.change.toFixed(1) : stat.change}{stat.title.includes('%') ? '' : stat.title.includes('Revenue') ? '%' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )) : (
            // Loading state for stats
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        
        {/* Real-time Alerts Section */}
        {alerts.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Active Alerts</h3>
                  <p className="text-sm text-muted-foreground">{alerts.length} notification{alerts.length !== 1 ? 's' : ''} requiring attention</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAlerts([])}>
                Clear All
              </Button>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'critical' ? 'bg-red-500/20 text-red-600' :
                    alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
                    'bg-blue-500/20 text-blue-600'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <Badge variant={
                        alert.impact === 'high' ? 'destructive' :
                        alert.impact === 'medium' ? 'default' : 'secondary'
                      }>
                        {alert.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.actionRequired}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Real-time Brand Health</h3>
                <p className="text-sm text-muted-foreground">Live performance metrics and insights</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadRealTimeData}
              disabled={isLoadingData}
            >
              {isLoadingData ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>

          {realTimeData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-medium mb-2">Brand Health Score</h4>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-sm font-medium">{Math.round(realTimeData.brandHealth.score)}%</span>
                </div>
                <Progress value={realTimeData.brandHealth.score} className="h-2" />
                <div className="flex items-center gap-1 mt-2">
                  {realTimeData.brandHealth.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : realTimeData.brandHealth.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span className={`text-xs ${realTimeData.brandHealth.trend === 'up' ? 'text-green-500' : realTimeData.brandHealth.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                    {realTimeData.brandHealth.change > 0 ? '+' : ''}{realTimeData.brandHealth.change.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-medium mb-2">Website Traffic</h4>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Visitors</span>
                  <span className="text-sm font-medium">{realTimeData.digitalPresence.websiteTraffic.visitors.toLocaleString()}</span>
                </div>
                <Progress value={(realTimeData.digitalPresence.websiteTraffic.visitors / 2000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Bounce Rate: {realTimeData.digitalPresence.websiteTraffic.bounceRate.toFixed(1)}%
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-medium mb-2">Customer Satisfaction</h4>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-sm font-medium">{(realTimeData.customerMetrics.engagement.satisfactionScore * 100).toFixed(0)}%</span>
                </div>
                <Progress value={realTimeData.customerMetrics.engagement.satisfactionScore * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Active Users: {realTimeData.customerMetrics.engagement.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-muted-foreground">Loading real-time data...</p>
              </div>
            </div>
          )}
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Brand Health Trend</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[300px]">
              {realTimeData ? (
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
                    legend: 'Week',
                    legendOffset: 36,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Score',
                    legendOffset: -40,
                    legendPosition: 'middle'
                  }}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  colors={{ scheme: 'paired' }}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-muted-foreground">Loading trend data...</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Digital Presence Breakdown</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-[300px]">
              {realTimeData ? (
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
                  colors={{ scheme: 'paired' }}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-muted-foreground">Loading distribution data...</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <ContentDashboard />
      </div>

      {/* Toast Notifications */}
      {toastNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toastNotifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              alert={notification.alert}
              onDismiss={() => dismissToast(notification.id)}
            />
          ))}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className={`h-2 w-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>
    </div>
   );
 }