'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessAnalyzer } from '@/components/business-analyzer';
import { CompetitiveAnalysis } from '@/components/competitive-analysis';
import { DocumentationLinks } from '@/components/documentation-links';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BrandAnalysis as BrandAnalysisResult } from '@/lib/services/brand-analyzer';

interface BusinessInfo {
  websiteUrl: string;
  socialLinks: { facebook: string; instagram: string; twitter: string; linkedin: string };
  analysis: string;
}

export default function BrandStrategyPage() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  // The analyzer renders the analysis itself (once) and hands the finished result up as JSON; do not render it a second time here.
  const brandAnalysisResults = useMemo<BrandAnalysisResult | null>(() => {
    try {
      return businessInfo?.analysis ? (JSON.parse(businessInfo.analysis) as BrandAnalysisResult) : null;
    } catch {
      return null;
    }
  }, [businessInfo]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block mb-2">
            <Badge className="text-sm px-3">STRATEGY</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            AI-Powered Brand Strategy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Develop a comprehensive brand strategy with AI analysis of your business across 20 strategic pillars.
          </p>
        </div>

        <div className="mb-16">
          <BusinessAnalyzer onAnalysisComplete={setBusinessInfo} />
        </div>

        {brandAnalysisResults && (
          <div className="mb-16">
            <CompetitiveAnalysis analysis={brandAnalysisResults} />
          </div>
        )}

        <div className="text-center mt-20">
          <div className="inline-block mb-4">
            <Badge className="text-sm px-3">NEXT STEPS</Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-4">
            Complete Your Brand Identity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            After your brand strategy analysis, explore our other tools to build your complete brand identity.
          </p>
        </div>
        
        <DocumentationLinks component="brand-analysis" />
      </div>
    </div>
  );
}