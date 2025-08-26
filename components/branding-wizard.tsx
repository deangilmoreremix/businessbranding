'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from '@/components/export-dialog';
import { 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  ArrowRight,
  BarChart,
  Download,
  FileText,
  TrendingUp,
  Zap,
  Building,
  Brain
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveRadar } from '@nivo/radar';
import { ImplementationPlan, ImplementationPhase } from '@/lib/services/implementation-plan';
import { BrandAnalyzer, BRAND_PILLARS } from '@/lib/services/brand-analyzer';
import { generateVoiceOver } from '@/lib/services/eleven-labs';
import { scrapeWebsite } from '@/lib/services/web-scraper';

interface BrandingWizardProps {
  websiteUrl: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  existingAnalysis?: string | null;
}

export function BrandingWizard({ websiteUrl, socialLinks, existingAnalysis }: BrandingWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [scanningItems, setScanningItems] = useState<string[]>([]);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transformPrompt, setTransformPrompt] = useState('');
  const [transformStyle, setTransformStyle] = useState('');
  const [transforming, setTransforming] = useState(false);
  const [analyzer] = useState(() => new BrandAnalyzer());
  const [topBrands, setTopBrands] = useState([]);
  const [industry, setIndustry] = useState('');
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [results, setResults] = useState({
    branding: '',
    assets: [] as string[],
    voiceover: null as any,
    analysis: null as any,
    brandFactors: [] as { name: string; score: number }[],
    recommendations: [] as string[],
    beforeAfter: [] as { before: string; after: string; factor: string }[]
  });
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [pillarStatus, setPillarStatus] = useState<Record<string, { status: 'not-started' | 'in-progress' | 'completed', tooltip: string }>>({});

  useEffect(() => {
    // Initialize pillar status
    const initialStatus = BRAND_PILLARS.reduce((acc, pillar) => ({
      ...acc,
      [pillar]: {
        status: 'not-started',
        tooltip: `Analyzes ${pillar}`
      }
    }), {});
    setPillarStatus(initialStatus);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchImages = async () => {
      if (websiteUrl) {
        try {
          setFetchingImages(true);
          const data = await scrapeWebsite(websiteUrl);
          if (mounted) {
            const validImages = Array.isArray(data.static.images) 
              ? data.static.images
                  .filter((img: any) => typeof img === 'string' && img.startsWith('http'))
                  .slice(0, 6)
              : [];
            setScrapedImages(validImages);
          }
        } catch (error) {
          console.error('Failed to fetch images:', error);
        } finally {
          if (mounted) {
            setFetchingImages(false);
          }
        }
      }
    };

    const init = async () => {
      try {
        await analyzer.initialize();
        await fetchImages();
      } catch (error) {
        console.error('Failed to initialize analyzer:', error);
      }
    };

    if (mounted) {
      init();
    }

    return () => {
      mounted = false;
    };
  }, [analyzer, websiteUrl]);

  useEffect(() => {
    if (results.branding && !results.voiceover) {
      const generateVoiceOverAudio = async () => {
        try {
          const voiceover = await generateVoiceOver(results.branding);
          setResults(prev => ({ ...prev, voiceover }));
        } catch (error) {
          console.warn('Failed to generate voiceover:', error);
        } finally {
          setAnalysisComplete(true);
        }
      };
      generateVoiceOverAudio();
    }
  }, [results.branding, results.voiceover]);

  return (
    <div className="max-w-5xl mx-auto relative z-10">
      {!existingAnalysis && step === 0 && (
        <Card className="p-8 glass-card mb-8">
          <div className="text-center space-y-4 relative">
            <Brain className="h-12 w-12 text-blue-400 mx-auto floating" />
            <h2 className="text-2xl font-bold gradient-text">Start Your Brand Journey</h2>
            <p className="text-muted-foreground">
              Let AI analyze your brand presence and unlock actionable insights
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6 glass-card">
        <div className="space-y-6">
          {/* Brand Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {BRAND_PILLARS.map((pillar, index) => (
              <div
                key={pillar}
                className={`p-4 rounded-lg border transition-colors ${
                  pillarStatus[pillar]?.status === 'completed' ? 'bg-green-500/10 border-green-500' : 
                  pillarStatus[pillar]?.status === 'in-progress' ? 'bg-blue-500/10 border-blue-500' :
                  'bg-gray-500/10 border-gray-500'
                }`}
              >
                <h4 className="text-sm font-medium">{pillar}</h4>
                <div className="mt-2">
                  <Progress 
                    value={
                      pillarStatus[pillar]?.status === 'completed' ? 100 :
                      pillarStatus[pillar]?.status === 'in-progress' ? 50 :
                      0
                    } 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Progress steps */}
          <div className="flex justify-between items-center">
            {[
              { title: "Scan & Discover", icon: Globe, description: "AI scan of website + socials" },
              { title: "Industry Benchmarking", icon: Target, description: "Match against Top 20 brands" },
              { title: "Brand Health Report", icon: FileText, description: "Strengths & recommendations" },
              { title: "One-Click Optimization", icon: Wand2, description: "AI-powered enhancements" },
              { title: "Your Brand Blueprint", icon: Download, description: "Download & share assets" }
            ].map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                {i < 4 && <div className={`w-full h-1 ${i < currentStep ? 'bg-blue-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {analysisComplete && results.analysis && (
        <Card className="mt-8 p-6 glass-card">
          <div className="space-y-8">
            {/* Analysis Overview */}
            <div className="grid grid-cols-3 gap-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Content Analysis</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tone & Messaging</h4>
                      {results.analysis.contentAnalysis?.headings?.map((heading: any, i: number) => (
                        <p key={i} className="text-sm mb-2">{heading.text}</p>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Content Structure</h4>
                      <p className="text-sm">{results.analysis.contentAnalysis?.metaDescription}</p>
                    </div>
                  </div>
                </ScrollArea>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Visual Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Brand Colors</h4>
                    <div className="flex gap-2">
                      {results.analysis.visualIdentity?.colors?.map((color: string, i: number) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Typography</h4>
                    <p className="text-sm">{results.analysis.visualIdentity?.fonts}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Social Media Impact</h3>
                <div className="h-[200px]">
                  <ResponsiveLine
                    data={[
                      {
                        id: 'engagement',
                        data: [
                          { x: 'Week 1', y: 65 },
                          { x: 'Week 2', y: 75 },
                          { x: 'Week 3', y: 85 },
                          { x: 'Week 4', y: 90 }
                        ]
                      }
                    ]}
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 100 }}
                    curve="monotoneX"
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0
                    }}
                    enablePoints={true}
                    pointSize={8}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableGridX={false}
                    colors={['#3B82F6']}
                  />
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}

      {analysisComplete && results.analysis && <Tabs defaultValue="analysis" className="mt-8">
        <TabsList>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis">
          <div className="grid grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Brand Health Score</h3>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${results.analysis.marketFit * 100}, 100`}
                  />
                  <text x="18" y="20.35" className="text-5xl" textAnchor="middle">
                    {Math.round(results.analysis.marketFit * 100)}%
                  </text>
                </svg>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Competitive Analysis</h3>
              <div className="h-[300px]">
                <ResponsiveRadar
                  data={results.brandFactors}
                  keys={['score']}
                  indexBy="name"
                  maxValue={1}
                  margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                  curve="linearClosed"
                  borderWidth={2}
                  borderColor={{ from: 'color' }}
                  gridLabelOffset={36}
                  dotSize={10}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  dotBorderColor={{ from: 'color' }}
                  enableDotLabel={true}
                  dotLabel="value"
                  dotLabelYOffset={-12}
                  colors={{ scheme: 'nivo' }}
                  fillOpacity={0.25}
                  blendMode="multiply"
                  animate={true}
                />
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Strategy Analysis</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-2">Strengths</h4>
                  <ul className="space-y-2">
                    {results.analysis.brandFactors?.filter((f: any) => f.score > 0.7)
                      .map((f: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{f.insights[0]}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {results.analysis.brandFactors?.filter((f: any) => f.score < 0.5)
                      .map((f: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span>{f.insights[1]}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="visual">
          <div className="grid grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Visual Identity Analysis</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScrapedImages([])}
                  disabled={scrapedImages.length === 0}
                >
                  Clear Images
                </Button>
              </div>

              {fetchingImages && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Fetching images from website...</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {scrapedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedImage === image ? 'ring-2 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.02]'
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Scraped image ${index + 1}`}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                
                {selectedImage && (
                  <div className="space-y-4 mt-6">
                    <Input
                      placeholder="Enter transformation prompt..."
                      value={transformPrompt}
                      onChange={(e) => setTransformPrompt(e.target.value)}
                    />
                    <select
                      className="w-full p-2 rounded-md bg-background border border-input"
                      value={transformStyle}
                      onChange={(e) => setTransformStyle(e.target.value)}
                    >
                      <option value="">Select a style preset</option>
                      <option value="3d-model">3D Model</option>
                      <option value="analog-film">Analog Film</option>
                      <option value="anime">Anime</option>
                      <option value="cinematic">Cinematic</option>
                      <option value="comic-book">Comic Book</option>
                      <option value="digital-art">Digital Art</option>
                      <option value="enhance">Enhance</option>
                      <option value="fantasy-art">Fantasy Art</option>
                      <option value="isometric">Isometric</option>
                      <option value="line-art">Line Art</option>
                      <option value="low-poly">Low Poly</option>
                      <option value="neon-punk">Neon Punk</option>
                      <option value="origami">Origami</option>
                      <option value="photographic">Photographic</option>
                      <option value="pixel-art">Pixel Art</option>
                      <option value="tile-texture">Tile Texture</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Assets</h3>
              <div>
                <h4 className="font-medium mb-2">Color Palette</h4>
                <div className="flex gap-4">
                  {results.analysis.visualIdentity?.colors?.map((color: string, i: number) => (
                    <div key={i} className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg shadow-md"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs mt-1 block">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Typography</h4>
                <p>{results.analysis.visualIdentity?.fonts}</p>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Asset Gallery</h3>
              <div className="grid grid-cols-2 gap-4">
                {results.assets.length > 0 ? results.assets.map((asset, i) => (
                  <img
                    key={i}
                    src={asset}
                    alt={`Brand asset ${i + 1}`}
                    className="rounded-lg shadow-md w-full h-48 object-cover"
                    loading="lazy"
                  />
                )) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <p>Transform images to see them appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="social">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Social Media Performance</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-2">Engagement Metrics</h4>
                  <div className="h-[200px]">
                    <ResponsiveLine
                      data={[
                        {
                          id: 'engagement',
                          data: [
                            { x: 'Jan', y: 65 },
                            { x: 'Feb', y: 75 },
                            { x: 'Mar', y: 85 },
                            { x: 'Apr', y: 90 }
                          ]
                        }
                      ]}
                      margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 0, max: 100 }}
                      curve="monotoneX"
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0
                      }}
                      enablePoints={true}
                      pointSize={8}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      enableGridX={false}
                      colors={['#3B82F6']}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Platform Analysis</h4>
                  <div className="space-y-4">
                    {Object.entries(socialLinks).map(([platform, url]) => (
                      url && (
                        <div key={platform} className="flex items-center gap-4">
                          {platform === 'facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                          {platform === 'twitter' && <Twitter className="w-5 h-5 text-blue-400" />}
                          {platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                          {platform === 'linkedin' && <Linkedin className="w-5 h-5 text-blue-700" />}
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="capitalize">{platform}</span>
                              <span>75%</span>
                            </div>
                            <Progress value={75} />
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="competitors">
          {topBrands.length > 0 && (
            <div className="glass-card p-6 rounded-lg">
              {/* Competitors content */}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommendations">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Strategic Recommendations</h3>
              <div className="grid grid-cols-2 gap-8">
                {results.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium">Recommendation {i + 1}</p>
                      <p className="text-muted-foreground">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <div className="flex justify-end gap-4">
              <Button onClick={() => {}} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button onClick={() => {}} className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Analysis
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>}
    </div>
  );
}