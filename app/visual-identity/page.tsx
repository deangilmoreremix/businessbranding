'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Palette, 
  ArrowRight, 
  CheckCircle, 
  Image, 
  Brush, 
  Layers,
  Camera,
  Download,
  Sparkles,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VisualIdentityAnalyzer } from '@/components/visual-identity-analyzer';
import { DocumentationLinks } from '@/components/documentation-links';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VisualIdentityPage() {
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalysisComplete = (visualInfo: any) => {
    setAnalysisResult(visualInfo);
    setAnalysisComplete(true);
  };

  const visualFeatures = [
    'AI-generated logo design',
    'Brand color palette creation',
    'Typography recommendations',
    'Image style transformation',
    'Asset library management',
    'Brand style guide generation'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block mb-2">
            <Badge className="text-sm px-3">VISUAL IDENTITY</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Create Your Visual Brand Identity
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Design professional logos, color schemes, and visual brand assets with AI-powered tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 bg-purple-500/5 border-purple-500/20">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Palette className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Brand Visual System</h3>
              <p className="text-muted-foreground">
                Create a complete visual identity system including logos, color palettes, typography and design elements.
              </p>
              <ul className="space-y-2">
                {visualFeatures.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="p-6 bg-blue-500/5 border-blue-500/20">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Image className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">AI Image Generation</h3>
              <p className="text-muted-foreground">
                Transform uploaded images or generate brand new visuals with advanced AI technology.
              </p>
              <ul className="space-y-2">
                {['Image style transformation', 'Logo generation from concepts', 'Brand asset creation', 'Style application across assets'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        

        <Alert variant="default" className="bg-blue-500/10 border-blue-500/20 mb-8">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Image Storage Available</AlertTitle>
          <AlertDescription>
            Generated images can now be saved to your image library and accessed from the dashboard.
          </AlertDescription>
        </Alert>

        <div className="space-y-8 mb-16">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold gradient-text">
              How Our Visual Identity Creator Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create professional brand visuals with AI assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-accent/5 border-accent/20 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="space-y-3">
                <Camera className="h-8 w-8 text-purple-400" />
                <h3 className="text-lg font-semibold">Upload or Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Upload images or scan your website to extract existing visual elements.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-accent/5 border-accent/20 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="space-y-3">
                <BrainCircuit className="h-8 w-8 text-blue-400" />
                <h3 className="text-lg font-semibold">AI Transformation</h3>
                <p className="text-sm text-muted-foreground">
                  Apply AI transformation to create professional logos and brand assets.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-accent/5 border-accent/20 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="space-y-3">
                <Download className="h-8 w-8 text-green-400" />
                <h3 className="text-lg font-semibold">Save & Export</h3>
                <p className="text-sm text-muted-foreground">
                  Save your brand assets to your library and export for use across platforms.
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        <VisualIdentityAnalyzer onAnalysisComplete={handleAnalysisComplete} />

        <div className="text-center mt-20">
          <div className="inline-block mb-4">
            <Badge className="text-sm px-3">NEXT STEPS</Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-4">
            Complete Your Brand Identity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            After creating your visual identity, explore our other tools to build your complete brand.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/?section=brand-analysis">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Brand Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a comprehensive analysis of your brand strategy.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/voice-content">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Voice Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Create voiceovers, podcasts and other audio content for your brand.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Content Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage and organize all your brand assets in one place.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        <DocumentationLinks component="visual-identity" />
      </div>
    </div>
  );
}