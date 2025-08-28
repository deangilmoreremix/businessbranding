'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Brain,
  CheckCircle,
  FileBarChart,
  Gauge,
  Layers,
  Loader2,
  Target,
  Activity,
  RefreshCw,
  AlertCircle,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  XCircle
} from 'lucide-react';
import { BrandAnalyzer, BRAND_PILLARS, type BrandAnalysis } from '@/lib/services/brand-analyzer';
import { ResponsiveRadar } from '@nivo/radar';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { AnalysisError, AnalysisErrorType } from '@/lib/types/errors';
import { CompetitorIntelligence } from './competitor-intelligence';
import { scrapeWebsite } from '@/lib/services/web-scraper';

interface BrandAnalysisClientProps {
  businessIdea: string;
  websiteUrl?: string;
  onAnalysisComplete?: (analysis: BrandAnalysis) => void;
}

// Export as default for dynamic import compatibility
export default function BrandAnalysisClient({ 
  businessIdea, 
  websiteUrl, 
  onAnalysisComplete 
}: BrandAnalysisClientProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BrandAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [websiteData, setWebsiteData] = useState<any>(null);
  const [scanningWebsite, setScanningWebsite] = useState(false);
  const [animatedScores, setAnimatedScores] = useState<{[key: string]: number}>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [aiAssistantTab, setAiAssistantTab] = useState('suggestions');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'word'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const analyzerRef = useRef<BrandAnalyzer | null>(null);

  // Initialize analyzer only once after component is mounted
  useEffect(() => {
    setMounted(true);
    
    if (!analyzerRef.current) {
      analyzerRef.current = new BrandAnalyzer();
    }
  }, []);

  // Only start analysis when component is mounted and we have a business idea
  useEffect(() => {
    if (mounted && businessIdea && !results && !loading) {
      handleAnalysis();
    }
  }, [mounted, businessIdea, results, loading]);

  // Animate scores when results are loaded
  useEffect(() => {
    if (results) {
      const timer = setTimeout(() => {
        setAnimatedScores({
          healthScore: results.healthScore,
          marketFit: results.marketFit * 100,
          uniquenessScore: results.uniquenessScore * 100
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [results]);

  // Scan website when websiteUrl is provided
  useEffect(() => {
    if (mounted && websiteUrl && !websiteData && !scanningWebsite) {
      handleWebsiteScan();
    }
  }, [mounted, websiteUrl, websiteData, scanningWebsite]);

  const handleAnalysis = async () => {
    if (!businessIdea || !analyzerRef.current || loading) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 1000);

    try {
      const analysis = await analyzerRef.current.analyzeBrandConcept(businessIdea);
      setResults(analysis);
      setProgress(100);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(new AnalysisError(
        AnalysisErrorType.API_ERROR,
        'Failed to analyze brand concept',
        err
      ));
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const handleWebsiteScan = async () => {
    if (!websiteUrl || !mounted || scanningWebsite) return;

    setScanningWebsite(true);
    try {
      const data = await scrapeWebsite(websiteUrl);
      setWebsiteData(data);
    } catch (error) {
      console.error('Website scanning failed:', error);
      setWebsiteData({ error: 'Failed to scan website' });
    } finally {
      setScanningWebsite(false);
    }
  };

  const getRadarData = () => {
    if (!results) return [];

    return results.brandFactors.map(factor => ({
      factor: factor.name,
      score: factor.score * 100
    }));
  };

  // Enhanced Score Display Component
  const EnhancedScoreDisplay = ({
    value,
    label,
    trend,
    benchmark,
    animatedValue,
    format = 'percentage'
  }: {
    value: number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
    benchmark?: number;
    animatedValue?: number;
    format?: 'percentage' | 'decimal';
  }) => {
    const displayValue = animatedValue !== undefined ? animatedValue : value;
    const formattedValue = format === 'percentage'
      ? `${Math.round(displayValue)}%`
      : displayValue.toFixed(1);

    const getTrendIcon = () => {
      switch (trend) {
        case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
        case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
        default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
      }
    };

    const getScoreColor = () => {
      if (displayValue >= 80) return 'text-green-600';
      if (displayValue >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="flex items-center gap-2">
            {trend && getTrendIcon()}
            {benchmark && (
              <span className="text-xs text-muted-foreground">
                vs {benchmark}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold gradient-text ${getScoreColor()}`}>
            {formattedValue}
          </span>
          {benchmark && (
            <Badge variant="outline" className="text-xs">
              {displayValue >= benchmark ? 'Above Avg' : 'Below Avg'}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Show loading state
  if (loading) {
    return <LoadingState progress={progress} />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={handleAnalysis} />;
  }

  // Show results
  if (!results) {
    return null;
  }

  return (
    <Card className="p-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Brand Pillars
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Analysis
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="digital" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Digital Presence
            </TabsTrigger>
            <TabsTrigger value="best-practices" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Best Practices
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Report
            </TabsTrigger>
          </TabsList>

          {/* AI Assistant & Export Panel */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowAIAssistant(true)}
            >
              <Lightbulb className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowExportPanel(true)}
            >
              <FileBarChart className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-6">
          {/* Real-time Monitoring Status */}
          <div className="mb-6 p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  results.monitoringStatus === 'active' ? 'bg-green-500' :
                  results.monitoringStatus === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  Monitoring: {results.monitoringStatus === 'active' ? 'Active' :
                               results.monitoringStatus === 'paused' ? 'Paused' : 'Error'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(results.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Brand Health Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Brand Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#eee"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray={`${results.healthScore}, 100`}
                      />
                      <text
                        x="18"
                        y="20.35"
                        className="text-lg font-bold"
                        textAnchor="middle"
                        fill="currentColor"
                      >
                        {results.healthScore}%
                      </text>
                    </svg>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {results.healthScore >= 80 ? 'Excellent brand health' :
                   results.healthScore >= 60 ? 'Good brand health' :
                   'Needs improvement'}
                </p>
              </CardContent>
            </Card>

            {/* Growth Trajectory */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Growth Trajectory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Growth</span>
                    <span className="font-medium">{(results.growthTrajectory.current * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Projected Growth</span>
                    <span className="font-medium">{(results.growthTrajectory.projected * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trend</span>
                    <Badge variant={
                      results.growthTrajectory.trend === 'up' ? 'default' :
                      results.growthTrajectory.trend === 'down' ? 'destructive' : 'secondary'
                    }>
                      {results.growthTrajectory.trend === 'up' ? '↗ Growing' :
                       results.growthTrajectory.trend === 'down' ? '↘ Declining' : '→ Stable'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Implementation Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Implementation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span className="font-medium text-green-600">{results.implementationStatus.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium text-blue-600">{results.implementationStatus.inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Planned</span>
                    <span className="font-medium text-muted-foreground">{results.implementationStatus.planned}</span>
                  </div>
                  <Progress value={results.implementationStatus.progressPercentage} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {results.implementationStatus.progressPercentage}% Complete
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <p className="text-2xl font-bold">{(results.performanceMetrics.engagement.rate * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    results.performanceMetrics.engagement.trend === 'up' ? 'bg-green-100 text-green-600' :
                    results.performanceMetrics.engagement.trend === 'down' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {results.performanceMetrics.engagement.trend === 'up' ? '↗' :
                     results.performanceMetrics.engagement.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion</p>
                    <p className="text-2xl font-bold">{(results.performanceMetrics.conversion.rate * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    results.performanceMetrics.conversion.trend === 'up' ? 'bg-green-100 text-green-600' :
                    results.performanceMetrics.conversion.trend === 'down' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {results.performanceMetrics.conversion.trend === 'up' ? '↗' :
                     results.performanceMetrics.conversion.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-2xl font-bold">{(results.performanceMetrics.roi.score * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    results.performanceMetrics.roi.trend === 'up' ? 'bg-green-100 text-green-600' :
                    results.performanceMetrics.roi.trend === 'down' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {results.performanceMetrics.roi.trend === 'up' ? '↗' :
                     results.performanceMetrics.roi.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">{(results.performanceMetrics.customerSatisfaction.score * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    results.performanceMetrics.customerSatisfaction.trend === 'up' ? 'bg-green-100 text-green-600' :
                    results.performanceMetrics.customerSatisfaction.trend === 'down' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {results.performanceMetrics.customerSatisfaction.trend === 'up' ? '↗' :
                     results.performanceMetrics.customerSatisfaction.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Loyalty</p>
                    <p className="text-2xl font-bold">{(results.performanceMetrics.brandLoyalty.score * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    results.performanceMetrics.brandLoyalty.trend === 'up' ? 'bg-green-100 text-green-600' :
                    results.performanceMetrics.brandLoyalty.trend === 'down' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {results.performanceMetrics.brandLoyalty.trend === 'up' ? '↗' :
                     results.performanceMetrics.brandLoyalty.trend === 'down' ? '↘' : '→'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Market Fit</span>
                    <span>{Math.round(results.marketFit * 100)}%</span>
                  </div>
                  <Progress value={results.marketFit * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Uniqueness Score</span>
                    <span>{Math.round(results.uniquenessScore * 100)}%</span>
                  </div>
                  <Progress value={results.uniquenessScore * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Dynamics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Market Size</p>
                    <p className="font-medium">${(results.marketAnalysis.marketDynamics.totalMarketSize / 1000000).toFixed(0)}M</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Growth Rate</p>
                    <p className="font-medium">{(results.marketAnalysis.marketDynamics.growthRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Competition</p>
                    <p className="font-medium capitalize">{results.marketAnalysis.marketDynamics.competitionLevel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entry Barriers</p>
                    <p className="font-medium capitalize">{results.marketAnalysis.marketDynamics.entryBarriers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Performance Across Pillars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveRadar
                  data={getRadarData()}
                  keys={['score']}
                  indexBy="factor"
                  maxValue={100}
                  margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                  borderColor={{ from: 'color' }}
                  gridLabelOffset={36}
                  dotSize={10}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  colors={{ scheme: 'nivo' }}
                  blendMode="multiply"
                  motionConfig="wobbly"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">20-Point Brand Strategy Analysis</h3>
              <p className="text-muted-foreground">
                Comprehensive evaluation across all critical brand pillars with priority levels and trend analysis.
              </p>
            </div>

            {/* Priority Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High Priority</p>
                      <p className="text-2xl font-bold text-red-600">
                        {results.brandFactors.filter(f => f.priority === 'high').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Medium Priority</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {results.brandFactors.filter(f => f.priority === 'medium').length}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Priority</p>
                      <p className="text-2xl font-bold text-green-600">
                        {results.brandFactors.filter(f => f.priority === 'low').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Brand Pillars by Priority */}
            <Tabs defaultValue="high" className="space-y-4">
              <TabsList>
                <TabsTrigger value="high">High Priority ({results.brandFactors.filter(f => f.priority === 'high').length})</TabsTrigger>
                <TabsTrigger value="medium">Medium Priority ({results.brandFactors.filter(f => f.priority === 'medium').length})</TabsTrigger>
                <TabsTrigger value="low">Low Priority ({results.brandFactors.filter(f => f.priority === 'low').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="high">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.brandFactors.filter(f => f.priority === 'high').map((factor, index) => (
                    <Card key={index} className="p-4 border-red-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-red-500" />
                          <h4 className="font-medium">{factor.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">High Priority</Badge>
                          <Badge variant={factor.trend === 'improving' ? 'default' : factor.trend === 'declining' ? 'destructive' : 'secondary'}>
                            {factor.trend === 'improving' ? '↗ Improving' :
                             factor.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Progress value={factor.score * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{Math.round(factor.score * 100)}%</span>
                      </div>

                      <div className="space-y-2">
                        {factor.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-2 ${
                              i === 0 ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <p className="text-sm text-muted-foreground">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.brandFactors.filter(f => f.priority === 'medium').map((factor, index) => (
                    <Card key={index} className="p-4 border-yellow-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-medium">{factor.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Medium Priority</Badge>
                          <Badge variant={factor.trend === 'improving' ? 'default' : factor.trend === 'declining' ? 'destructive' : 'secondary'}>
                            {factor.trend === 'improving' ? '↗ Improving' :
                             factor.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Progress value={factor.score * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{Math.round(factor.score * 100)}%</span>
                      </div>

                      <div className="space-y-2">
                        {factor.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-2 ${
                              i === 0 ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <p className="text-sm text-muted-foreground">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="low">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.brandFactors.filter(f => f.priority === 'low').map((factor, index) => (
                    <Card key={index} className="p-4 border-green-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium">{factor.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Low Priority</Badge>
                          <Badge variant={factor.trend === 'improving' ? 'default' : factor.trend === 'declining' ? 'destructive' : 'secondary'}>
                            {factor.trend === 'improving' ? '↗ Improving' :
                             factor.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Progress value={factor.score * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{Math.round(factor.score * 100)}%</span>
                      </div>

                      <div className="space-y-2">
                        {factor.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-2 ${
                              i === 0 ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <p className="text-sm text-muted-foreground">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="market" className="mt-6">
          <div className="space-y-6">
            {/* Market Dynamics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Market Size</p>
                      <p className="text-2xl font-bold">${(results.marketAnalysis.marketDynamics.totalMarketSize / 1000000).toFixed(0)}M</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Growth Rate</p>
                      <p className="text-2xl font-bold">{(results.marketAnalysis.marketDynamics.growthRate * 100).toFixed(1)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Competition</p>
                      <p className="text-2xl font-bold capitalize">{results.marketAnalysis.marketDynamics.competitionLevel}</p>
                    </div>
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Barriers</p>
                      <p className="text-2xl font-bold capitalize">{results.marketAnalysis.marketDynamics.entryBarriers}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Industry Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Industry Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.marketAnalysis.industryTrends.map((trend, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          trend.impact === 'high' ? 'bg-red-100 text-red-600' :
                          trend.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{trend.trend}</h4>
                            <Badge variant={
                              trend.impact === 'high' ? 'destructive' :
                              trend.impact === 'medium' ? 'default' : 'secondary'
                            }>
                              {trend.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{trend.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.marketAnalysis.marketOpportunities.map((opportunity, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          opportunity.potential === 'high' ? 'bg-green-100 text-green-600' :
                          opportunity.potential === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{opportunity.opportunity}</h4>
                            <Badge variant={
                              opportunity.potential === 'high' ? 'default' :
                              opportunity.potential === 'medium' ? 'secondary' : 'outline'
                            }>
                              {opportunity.potential} Potential
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Barriers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Growth Barriers & Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.marketAnalysis.growthBarriers.map((barrier, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          barrier.severity === 'high' ? 'bg-red-100 text-red-600' :
                          barrier.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{barrier.barrier}</h4>
                            <Badge variant={
                              barrier.severity === 'high' ? 'destructive' :
                              barrier.severity === 'medium' ? 'default' : 'secondary'
                            }>
                              {barrier.severity} Severity
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{barrier.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Risk Factors */}
                  {results.riskFactors && results.riskFactors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Additional Risk Factors</h4>
                      <div className="space-y-3">
                        {results.riskFactors.map((risk, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div>
                              <p className="font-medium">{risk.risk}</p>
                              <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                risk.probability === 'high' ? 'destructive' :
                                risk.probability === 'medium' ? 'default' : 'secondary'
                              }>
                                {risk.probability}
                              </Badge>
                              <Badge variant="outline">
                                {risk.impact}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.marketAnalysis.customerSegments.map((segment, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{segment.segment}</h4>
                          <p className="text-sm text-muted-foreground">
                            {(segment.size * 100).toFixed(0)}% of market
                          </p>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Growth Rate</span>
                          <span className="font-medium">{(segment.growth * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Key Characteristics</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.characteristics.slice(0, 2).map((char, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <CompetitorIntelligence
            industry="Technology"
            competitors={results?.competitors || []}
          />
        </TabsContent>

        <TabsContent value="digital" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanningWebsite ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scanning website...</span>
                    </div>
                  ) : websiteData ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Website URL</h4>
                        <p className="text-sm text-muted-foreground">{websiteUrl}</p>
                      </div>
                      {websiteData.socialLinks && (
                        <div>
                          <h4 className="font-medium mb-2">Social Media Links</h4>
                          <div className="space-y-1">
                            {Object.entries(websiteData.socialLinks).map(([platform, url]) => (
                              <div key={platform} className="flex items-center gap-2">
                                <Badge variant="outline">{platform}</Badge>
                                <span className="text-sm">{url as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {websiteData.error && (
                        <div className="text-red-600 text-sm">
                          Error scanning website: {websiteData.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No website URL provided</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Digital Presence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#eee"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray={`${websiteData ? 85 : 0}, 100`}
                          />
                          <text
                            x="18"
                            y="20.35"
                            className="text-lg font-bold"
                            textAnchor="middle"
                            fill="currentColor"
                          >
                            {websiteData ? '85%' : 'N/A'}
                          </text>
                        </svg>
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {websiteData ? 'Strong digital presence detected' : 'Website scan required'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="best-practices" className="mt-6">
          <div className="space-y-6">
            {/* Best Practices Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Data Collection</p>
                      <p className="text-2xl font-bold">{(results.bestPractices.dataCollection.score * 100).toFixed(0)}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                  <Progress value={results.bestPractices.dataCollection.score * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Analysis Review</p>
                      <p className="text-2xl font-bold">{(results.bestPractices.analysisReview.score * 100).toFixed(0)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                  <Progress value={results.bestPractices.analysisReview.score * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Optimization</p>
                      <p className="text-2xl font-bold">{(results.bestPractices.optimization.score * 100).toFixed(0)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                  <Progress value={results.bestPractices.optimization.score * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Data Collection Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Data Collection Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">✅ Do's</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Provide accurate and complete business information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Include all relevant data points and metrics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Keep information current and up-to-date</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Maintain consistency across all data sources</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">❌ Don'ts</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Use outdated or inaccurate information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Omit important business details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Include irrelevant or misleading data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Skip regular data updates</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {results.bestPractices.dataCollection.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Specific Recommendations</h4>
                      <div className="space-y-2">
                        {results.bestPractices.dataCollection.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Review Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Analysis Review Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 font-bold">1</span>
                        </div>
                        <h4 className="font-medium mb-2">Regular Monitoring</h4>
                        <p className="text-sm text-muted-foreground">Conduct performance checks weekly</p>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <span className="text-green-600 font-bold">2</span>
                        </div>
                        <h4 className="font-medium mb-2">Trend Analysis</h4>
                        <p className="text-sm text-muted-foreground">Monitor trends and patterns monthly</p>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                          <span className="text-purple-600 font-bold">3</span>
                        </div>
                        <h4 className="font-medium mb-2">Strategy Adjustment</h4>
                        <p className="text-sm text-muted-foreground">Review and adjust quarterly</p>
                      </div>
                    </Card>
                  </div>

                  {results.bestPractices.analysisReview.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Review Recommendations</h4>
                      <div className="space-y-2">
                        {results.bestPractices.analysisReview.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Resource Management</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Efficient Processing</span>
                          <Badge variant="outline">Optimized</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Data Organization</span>
                          <Badge variant="outline">Structured</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Team Coordination</span>
                          <Badge variant="outline">Synchronized</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Continuous Improvement</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Regular Updates</span>
                          <Badge variant="outline">Automated</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Performance Monitoring</span>
                          <Badge variant="outline">Real-time</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Strategy Refinement</span>
                          <Badge variant="outline">Adaptive</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {results.bestPractices.optimization.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Optimization Recommendations</h4>
                      <div className="space-y-2">
                        {results.bestPractices.optimization.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                            <Target className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {results.recommendations.map((recommendation, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      recommendation.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                      recommendation.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-green-500/10 text-green-600'
                    }`}>
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          recommendation.priority === 'high' ? 'destructive' :
                          recommendation.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {recommendation.priority} Priority
                        </Badge>
                        <Badge variant="outline">{recommendation.category}</Badge>
                        <Badge variant="outline" className={
                          recommendation.impact === 'high' ? 'bg-red-100 text-red-800' :
                          recommendation.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {recommendation.impact} Impact
                        </Badge>
                      </div>
                      <p className="mb-2">{recommendation.recommendation}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>⏱️ {recommendation.timeframe}</span>
                        <span>📋 {recommendation.resources.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
                <Card className="p-4">
                  <p className="text-muted-foreground">
                    Your brand health score is {results.healthScore}%, indicating
                    {results.healthScore >= 80 ? ' excellent performance across key metrics.' :
                     results.healthScore >= 60 ? ' good performance with room for improvement.' :
                     ' significant opportunities for enhancement.'}
                  </p>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
                <div className="space-y-4">
                  {results.brandFactors.map((factor, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{factor.name}</h4>
                        <Badge variant={factor.score >= 0.7 ? 'default' : 'secondary'}>
                          {Math.round(factor.score * 100)}%
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={factor.score * 100} 
                        className="h-2 mb-4" 
                      />
                      
                      <div className="space-y-2">
                        {factor.insights.map((insight, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {insight}
                          </p>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                <div className="space-y-4">
                  {results.recommendations.map((recommendation, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          recommendation.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                          recommendation.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-green-500/10 text-green-600'
                        }`}>
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              recommendation.priority === 'high' ? 'destructive' :
                              recommendation.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {recommendation.priority} Priority
                            </Badge>
                            <Badge variant="outline">{recommendation.category}</Badge>
                          </div>
                          <p className="mb-2">{recommendation.recommendation}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>⏱️ {recommendation.timeframe}</span>
                            <span>📋 {recommendation.resources.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                AI Brand Assistant
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIAssistant(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <Tabs value={aiAssistantTab} onValueChange={setAiAssistantTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="suggestions">Smart Suggestions</TabsTrigger>
                  <TabsTrigger value="content">Content Generation</TabsTrigger>
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="strategy">Strategy Help</TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">AI-Powered Recommendations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.brandFactors
                        .filter(factor => factor.priority === 'high' && factor.score < 0.8)
                        .slice(0, 4)
                        .map((factor, index) => (
                          <Card key={index} className="p-4 border-red-200">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium mb-2">{factor.name}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Current score: {Math.round(factor.score * 100)}%
                                </p>
                                <Button size="sm" variant="outline" className="w-full">
                                  Get AI Suggestions
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Generate Brand Content</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Mission Statement</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create a compelling mission statement based on your brand analysis
                        </p>
                        <Button size="sm" className="w-full">
                          Generate Mission
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Brand Story</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Craft a narrative that connects with your audience
                        </p>
                        <Button size="sm" className="w-full">
                          Generate Story
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Social Media Posts</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create engaging social media content
                        </p>
                        <Button size="sm" className="w-full">
                          Generate Posts
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Marketing Copy</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Write persuasive marketing copy
                        </p>
                        <Button size="sm" className="w-full">
                          Generate Copy
                        </Button>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">AI-Powered Insights</h3>
                    <div className="space-y-3">
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1">Growth Opportunity</h4>
                            <p className="text-sm text-muted-foreground">
                              Based on your market analysis, there's a 23% growth opportunity in the digital transformation sector.
                            </p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1">Competitive Advantage</h4>
                            <p className="text-sm text-muted-foreground">
                              Your brand strength in customer experience is 18% above the industry average.
                            </p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1">Strategic Recommendation</h4>
                            <p className="text-sm text-muted-foreground">
                              Focus on strengthening your digital presence to capture the growing online market segment.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="strategy" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Strategic Planning Assistance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">SWOT Analysis</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Generate a comprehensive SWOT analysis based on your brand data
                        </p>
                        <Button size="sm" className="w-full">
                          Generate SWOT
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Action Plan</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Create a prioritized action plan for the next 90 days
                        </p>
                        <Button size="sm" className="w-full">
                          Generate Plan
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Identify potential risks and mitigation strategies
                        </p>
                        <Button size="sm" className="w-full">
                          Assess Risks
                        </Button>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">KPI Dashboard</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Design a custom KPI dashboard for your brand
                        </p>
                        <Button size="sm" className="w-full">
                          Create Dashboard
                        </Button>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Panel Modal */}
      {showExportPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-blue-500" />
                Export Brand Analysis Report
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportPanel(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Choose Export Format</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      exportFormat === 'pdf' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <div className="text-center">
                      <FileBarChart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <p className="font-medium">PDF Report</p>
                      <p className="text-sm text-muted-foreground">Professional format</p>
                    </div>
                  </Card>
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      exportFormat === 'excel' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">Excel Workbook</p>
                      <p className="text-sm text-muted-foreground">Raw data & charts</p>
                    </div>
                  </Card>
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      exportFormat === 'word' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setExportFormat('word')}
                  >
                    <div className="text-center">
                      <FileBarChart className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="font-medium">Word Document</p>
                      <p className="text-sm text-muted-foreground">Editable format</p>
                    </div>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Report Sections</h3>
                <div className="space-y-3">
                  {[
                    { id: 'overview', label: 'Executive Overview', checked: true },
                    { id: 'analysis', label: 'Brand Pillars Analysis', checked: true },
                    { id: 'market', label: 'Market Analysis', checked: true },
                    { id: 'competitors', label: 'Competitor Intelligence', checked: true },
                    { id: 'digital', label: 'Digital Presence', checked: true },
                    { id: 'recommendations', label: 'Strategic Recommendations', checked: true }
                  ].map((section) => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={section.id}
                        defaultChecked={section.checked}
                        className="rounded"
                      />
                      <label htmlFor={section.id} className="text-sm">
                        {section.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Branding Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="logo" className="rounded" />
                    <label htmlFor="logo" className="text-sm">Include company logo</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="colors" className="rounded" />
                    <label htmlFor="colors" className="text-sm">Use brand colors</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="charts" defaultChecked className="rounded" />
                    <label htmlFor="charts" className="text-sm">Include interactive charts</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowExportPanel(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsExporting(true);
                    // Simulate export process
                    setTimeout(() => {
                      setIsExporting(false);
                      setShowExportPanel(false);
                      // In a real implementation, this would trigger the actual export
                      alert(`Report exported as ${exportFormat.toUpperCase()}!`);
                    }, 2000);
                  }}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}