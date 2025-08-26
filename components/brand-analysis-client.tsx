'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
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
  AlertCircle
} from 'lucide-react';
import { BrandAnalyzer, BRAND_PILLARS, BrandAnalysis } from '@/lib/services/brand-analyzer';
import { ResponsiveRadar } from '@nivo/radar';

interface BrandAnalysisClientProps {
  businessIdea: string;
  websiteUrl?: string;
  onAnalysisComplete?: (analysis: BrandAnalysis) => void;
}

export default function BrandAnalysisClient({ businessIdea, websiteUrl, onAnalysisComplete }: BrandAnalysisClientProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BrandAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const analyzerRef = useRef<BrandAnalyzer | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const initAnalyzer = async () => {
      if (!analyzerRef.current) {
        analyzerRef.current = new BrandAnalyzer();
        await analyzerRef.current.initialize();
      }
    };

    initAnalyzer();
  }, []);

  useEffect(() => {
    if (mounted && businessIdea && !results && !loading) {
      handleAnalysis();
    }
  }, [mounted, businessIdea, results, loading]);

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
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const getRadarData = () => {
    if (!results) return [];

    return results.brandFactors.map(factor => ({
      factor: factor.name,
      score: factor.score * 100
    }));
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {loading && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Analyzing Brand Strategy</h3>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing brand strategy...</span>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6 border-red-500/20 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-500">Analysis Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAnalysis} 
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            </div>
          </div>
        </Card>
      )}

      {results && !loading && (
        <Card className="p-6">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis
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

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Brand Health Score</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
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
                          className="text-2xl font-bold"
                          textAnchor="middle"
                          fill="currentColor"
                        >
                          {results.healthScore}%
                        </text>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {results.healthScore >= 80 ? 'Excellent brand health' :
                       results.healthScore >= 60 ? 'Good brand health' :
                       'Needs improvement'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Market Fit</span>
                        <span>{Math.round(results.marketFit * 100)}%</span>
                      </div>
                      <Progress value={results.marketFit * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Uniqueness Score</span>
                        <span>{Math.round(results.uniquenessScore * 100)}%</span>
                      </div>
                      <Progress value={results.uniquenessScore * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Brand Performance</h3>
                <div className="h-[300px]">
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
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <p className="text-muted-foreground">{factor.insights[0]}</p>
                        </div>
                        
                        {factor.score < 0.7 && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-1" />
                            <p className="text-muted-foreground">{factor.insights[1]}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {results.recommendations.map((recommendation, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-500">{index + 1}</span>
                        </div>
                        <p>{recommendation}</p>
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
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-500">{index + 1}</span>
                            </div>
                            <p>{recommendation}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}