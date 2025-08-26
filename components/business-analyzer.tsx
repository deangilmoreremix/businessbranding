'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { scrapeWebsite } from '@/lib/services/web-scraper';
import { BrandAnalysis } from '@/components/brand-analysis';
import { saveAnalysis, getStoredAnalysis } from '@/lib/services/storage';

interface BusinessAnalyzerProps {
  onAnalysisComplete?: (info: {
    websiteUrl: string;
    socialLinks: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
    };
    analysis: string;
  }) => void;
}

export function BusinessAnalyzer({ onAnalysisComplete }: BusinessAnalyzerProps) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });
  const [scraping, setScraping] = useState(false);
  const [scrapingError, setScrapingError] = useState('');
  const [extractedContent, setExtractedContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [showBrandAnalysis, setShowBrandAnalysis] = useState(false);
  const [businessIdeaForAnalysis, setBusinessIdeaForAnalysis] = useState('');
  const [detecting, setDetecting] = useState(false);

  // Load stored data on mount
  useEffect(() => {
    const storedData = getStoredAnalysis();
    if (storedData) {
      setWebsiteUrl(storedData.websiteUrl);
      setSocialLinks(storedData.socialLinks);
    }
  }, []);

  const handleWebsiteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setWebsiteUrl(url);
    setScrapingError('');

    if (url) {
      setDetecting(true);
      try {
        // First try web scraping
        const scrapedData = await scrapeWebsite(url);
        
        // If scraping finds links, use those
        if (scrapedData.socialLinks) {
          setSocialLinks(prev => ({
            ...prev,
            ...scrapedData.socialLinks
          }));

          // Save the analysis data
          saveAnalysis({
            websiteUrl: url,
            socialLinks: scrapedData.socialLinks
          });
        }

        setDetecting(false);
      } catch (error) {
        console.error('Failed to detect social profiles:', error);
        setScrapingError('Failed to detect social profiles. Please enter them manually.');
        setDetecting(false);
      }
    }
  };

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;

    setScraping(true);
    setScrapingError('');
    setProgress(0);
    
    try {
      // Combine website URL with social media links for analysis
      const fullBusinessIdea = [
        websiteUrl ? `Website: ${websiteUrl}` : '',
        socialLinks.facebook ? `Facebook: ${socialLinks.facebook}` : '',
        socialLinks.instagram ? `Instagram: ${socialLinks.instagram}` : '',
        socialLinks.twitter ? `Twitter: ${socialLinks.twitter}` : '',
        socialLinks.linkedin ? `LinkedIn: ${socialLinks.linkedin}` : ''
      ].filter(Boolean).join('\n');
      
      // Set the business idea for the BrandAnalysis component
      setBusinessIdeaForAnalysis(fullBusinessIdea);
      
      // Save the analysis data
      saveAnalysis({
        websiteUrl,
        socialLinks
      });
      
      // Show brand analysis component
      setShowBrandAnalysis(true);
      setProgress(50);
    } catch (error) {
      console.error('Analysis failed:', error);
      setScrapingError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      setShowBrandAnalysis(false);
    } finally {
      setScraping(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleAnalysis} className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Current Business Presence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Let our AI analyze your existing brand presence to provide targeted recommendations
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-400 mt-2" />
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Business Website URL"
                  value={websiteUrl}
                  onChange={handleWebsiteChange}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {detecting && (
              <div className="flex items-center gap-2 ml-8 text-sm text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Detecting social profiles...</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Facebook className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Facebook Page URL"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-pink-500" />
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Instagram Profile URL"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Twitter className="h-5 w-5 text-blue-400" />
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="Twitter Profile URL"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="LinkedIn Profile URL"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {scrapingError && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{scrapingError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
            disabled={scraping || detecting || (!websiteUrl)}
          >
            {scraping ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze Brand Strategy'
            )}
          </Button>

          {scraping && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Analyzing your brand presence across 20 strategic pillars...
              </p>
            </div>
          )}
        </div>
      </form>

      {showBrandAnalysis && (
        <div className="mt-8">
          <BrandAnalysis 
            businessIdea={businessIdeaForAnalysis || websiteUrl}
            websiteUrl={websiteUrl}
            onAnalysisComplete={(analysis) => {
              if (onAnalysisComplete) {
                onAnalysisComplete({
                  websiteUrl,
                  socialLinks,
                  analysis: JSON.stringify(analysis)
                });
              }
            }}
          />
        </div>
      )}
    </Card>
  );
}