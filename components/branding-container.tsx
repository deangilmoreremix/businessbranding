'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Sparkles, Palette, MessageSquare, Brain, BrainCircuit } from 'lucide-react';

// Preload components
const BrandingWizard = dynamic(() => import('@/components/branding-wizard').then(mod => mod.BrandingWizard), {
  loading: () => <LoadingSpinner message="Loading branding wizard..." />,
  ssr: false
});

const BusinessAnalyzer = dynamic(() => import('@/components/business-analyzer').then(mod => mod.BusinessAnalyzer), {
  loading: () => <LoadingSpinner message="Loading business analyzer..." />,
  ssr: false
});

const VoiceInterface = dynamic(() => import('@/components/voice-interface').then(mod => mod.VoiceInterface), {
  loading: () => <LoadingSpinner message="Loading voice interface..." />,
  ssr: false
});

const VisualIdentityAnalyzer = dynamic(() => import('@/components/visual-identity-analyzer').then(mod => mod.VisualIdentityAnalyzer), {
  loading: () => <LoadingSpinner message="Loading visual identity analyzer..." />,
  ssr: false
});

const BrandAnalysis = dynamic(() => import('@/components/brand-analysis').then(mod => mod.BrandAnalysis), {
  loading: () => <LoadingSpinner message="Loading brand analysis..." />,
  ssr: false
});

interface BusinessInfo {
  websiteUrl: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  analysis: string;
}

export function BrandingContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [activeComponent, setActiveComponent] = useState<'business' | 'visual' | 'voice' | 'brand-analysis' | null>(
    () => {
      const section = searchParams.get('section');
      if (section === 'visual') return 'visual';
      if (section === 'voice') return 'voice';
      if (section === 'brand-analysis') return 'brand-analysis';
      if (section === 'business') return 'business';
      return 'brand-analysis';
    }
  );
  const [businessIdea, setBusinessIdea] = useState<string>('');

  // Preload components on mount
  useEffect(() => {
    const preloadComponents = async () => {
      // Preload all components in parallel
      await Promise.all([
        import('@/components/branding-wizard'),
        import('@/components/business-analyzer'),
        import('@/components/voice-interface'),
        import('@/components/visual-identity-analyzer'),
        import('@/components/brand-analysis')
      ]);
    };

    preloadComponents().catch(console.error);
  }, []);

  // Update URL when activeComponent changes
  useEffect(() => {
    if (activeComponent) {
      const url = new URL(window.location.href);
      url.searchParams.set('section', activeComponent);
      window.history.pushState({}, '', url.toString());
    }
  }, [activeComponent]);

  const handleBusinessAnalysis = (info: BusinessInfo) => {
    setBusinessInfo(info);
    setActiveComponent(null);
  };

  const handleBrandStrategyClick = () => {
    setActiveComponent(activeComponent === 'business' ? null : 'business');
  };

  const handleVisualIdentityClick = () => {
    setActiveComponent(activeComponent === 'visual' ? null : 'visual');
  };

  const handleVoiceClick = () => {
    setActiveComponent(activeComponent === 'voice' ? null : 'voice');
  };

  const handleBrandAnalysisClick = () => {
    setActiveComponent(activeComponent === 'brand-analysis' ? null : 'brand-analysis');
  };

  return (
    <main className="container relative z-10 mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <div className="relative inline-block">
            <Sparkles className="h-16 w-16 text-blue-400 floating" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight gradient-text">
            AI-Powered Brand Creation
          </h1>
          <p className="text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
            Transform your business idea into a complete brand identity using
            cutting-edge AI technology.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 perspective-1000">
            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'brand-analysis' ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5'
              }`}
              onClick={handleBrandAnalysisClick}
            >
              <BrainCircuit className="h-8 w-8 text-indigo-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Analysis</h3>
              <p className="text-sm text-muted-foreground">Comprehensive analysis and market positioning</p>
            </div>
            
            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'business' ? 'bg-blue-500/10 border-blue-500' : 'hover:bg-white/5'
              }`}
              onClick={handleBrandStrategyClick}
            >
              <Brain className="h-8 w-8 text-blue-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Strategy</h3>
              <p className="text-sm text-muted-foreground">Data-driven rebranding roadmap</p>
            </div>

            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'visual' ? 'bg-purple-500/10 border-purple-500' : 'hover:bg-white/5'
              }`}
              onClick={handleVisualIdentityClick}
            >
              <Palette className="h-8 w-8 text-purple-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Visual Identity</h3>
              <p className="text-sm text-muted-foreground">Modern brand design and assets</p>
            </div>

            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'voice' ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5'
              }`}
              onClick={handleVoiceClick}
            >
              <MessageSquare className="h-8 w-8 text-indigo-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Voice</h3>
              <p className="text-sm text-muted-foreground">Distinctive messaging and tone</p>
            </div>
          </div>
        </div>
      </div>

      {activeComponent === 'brand-analysis' && (
        <div className="mt-8">
          <BusinessAnalyzer 
            onAnalysisComplete={handleBusinessAnalysis}
          />
        </div>
      )}

      {activeComponent === 'business' && !businessInfo && (
        <BusinessAnalyzer 
          onAnalysisComplete={handleBusinessAnalysis}
        />
      )}

      {activeComponent === 'visual' && (
        <VisualIdentityAnalyzer 
          onAnalysisComplete={(visualInfo) => {
            setActiveComponent(null);
          }}
        />
      )}

      {activeComponent === 'voice' && (
        <VoiceInterface />
      )}

      {businessInfo && (
        <BrandingWizard 
          websiteUrl={businessInfo.websiteUrl}
          socialLinks={businessInfo.socialLinks}
          existingAnalysis={businessInfo.analysis}
        />
      )}
    </main>
  );
}