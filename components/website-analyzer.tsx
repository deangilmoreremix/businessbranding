'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface WebsiteAnalyzerProps {
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

export function WebsiteAnalyzer({ onAnalysisComplete }: WebsiteAnalyzerProps) {
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

  const handleWebsiteAnalysis = async () => {
    if (!websiteUrl) return;

    setScraping(true);
    setScrapingError('');
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const data = await scrapeWebsite(websiteUrl);
      
      // Update social links if found
      if (data.static?.socialLinks) {
        setSocialLinks(prev => ({
          ...prev,
          ...data.static.socialLinks
        }));
      }

      // Extract text content
      const content = [
        data.static?.title,
        data.static?.description,
        ...(data.static?.headings?.map(h => h.text) || [])
      ].filter(Boolean).join('\n\n');

      setExtractedContent(content);
      setProgress(100);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          websiteUrl,
          socialLinks: data.static?.socialLinks || socialLinks,
          analysis: content
        });
      }
    } catch (error) {
      console.error('Failed to analyze website:', error);
      setScrapingError('Failed to analyze website. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setScraping(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Website Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze your website and social media presence to extract content for voice generation
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-400" />
            <div className="flex-1">
              <Input
                type="url"
                placeholder="Enter website URL"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWebsiteAnalysis}
              disabled={!websiteUrl || scraping}
            >
              {scraping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {scraping && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Analyzing website content...
              </p>
            </div>
          )}

          {scrapingError && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{scrapingError}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleWebsiteAnalysis}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Facebook className="h-5 w-5 text-blue-600" />
              <Input
                type="url"
                placeholder="Facebook Page URL"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Input
                type="url"
                placeholder="Twitter Profile URL"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-pink-500" />
              <Input
                type="url"
                placeholder="Instagram Profile URL"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <Input
                type="url"
                placeholder="LinkedIn Profile URL"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>
          </div>

          {extractedContent && (
            <div className="space-y-2">
              <h4 className="font-medium">Extracted Content</h4>
              <Card className="p-4 bg-muted/10">
                <ScrollArea className="h-[200px]">
                  <p className="whitespace-pre-wrap">{extractedContent}</p>
                </ScrollArea>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}