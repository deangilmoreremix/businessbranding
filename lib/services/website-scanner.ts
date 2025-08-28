import { API_KEYS } from '../api-config';

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || API_KEYS.GEMINI === 'demo-mode';

interface WebsiteScanResult {
  url: string;
  scanDate: string;
  loadTime: number;
  mobileFriendly: boolean;
  seo: {
    score: number;
    title: string;
    description: string;
    keywords: string[];
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    images: {
      total: number;
      withAlt: number;
      withoutAlt: number;
    };
    links: {
      internal: number;
      external: number;
      broken: number;
    };
  };
  content: {
    wordCount: number;
    readability: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
    brandMentions: string[];
  };
  technical: {
    ssl: boolean;
    responsive: boolean;
    performance: number;
    accessibility: number;
    security: {
      score: number;
      issues: string[];
    };
  };
  social: {
    openGraph: boolean;
    twitterCards: boolean;
    schemaMarkup: boolean;
    socialLinks: Array<{
      platform: string;
      url: string;
      verified: boolean;
    }>;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export async function scanWebsite(url: string): Promise<WebsiteScanResult> {
  if (isDemoMode) {
    console.log('Running website scan in demo mode');
    return {
      url,
      scanDate: new Date().toISOString(),
      loadTime: 1250,
      mobileFriendly: true,
      seo: {
        score: 78,
        title: 'Demo Website - Professional Business Solutions',
        description: 'Leading provider of innovative business solutions and digital transformation services.',
        keywords: ['business solutions', 'digital transformation', 'consulting', 'technology'],
        headings: {
          h1: ['Welcome to Our Services'],
          h2: ['Why Choose Us', 'Our Solutions', 'Contact Us'],
          h3: ['Expert Team', 'Proven Results', 'Get Started']
        },
        images: {
          total: 12,
          withAlt: 10,
          withoutAlt: 2
        },
        links: {
          internal: 25,
          external: 8,
          broken: 1
        }
      },
      content: {
        wordCount: 1250,
        readability: 72,
        sentiment: 'positive',
        topics: ['Business Solutions', 'Digital Transformation', 'Consulting', 'Technology'],
        brandMentions: ['Demo Company', 'Our Services', 'Expert Solutions']
      },
      technical: {
        ssl: true,
        responsive: true,
        performance: 85,
        accessibility: 78,
        security: {
          score: 92,
          issues: ['Consider implementing CSP headers']
        }
      },
      social: {
        openGraph: true,
        twitterCards: true,
        schemaMarkup: true,
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/demo', verified: true },
          { platform: 'twitter', url: 'https://twitter.com/demo', verified: true },
          { platform: 'linkedin', url: 'https://linkedin.com/company/demo', verified: true }
        ]
      },
      recommendations: [
        {
          priority: 'high',
          category: 'SEO',
          issue: 'Missing meta description on 3 pages',
          recommendation: 'Add unique meta descriptions to all pages',
          impact: 'high'
        },
        {
          priority: 'medium',
          category: 'Performance',
          issue: 'Large images without optimization',
          recommendation: 'Compress and optimize images for web',
          impact: 'medium'
        },
        {
          priority: 'high',
          category: 'Accessibility',
          issue: 'Missing alt text on 2 images',
          recommendation: 'Add descriptive alt text to all images',
          impact: 'high'
        }
      ]
    };
  }

  try {
    console.log('Scanning website:', url);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/website-scanner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Website scan failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Website scan completed successfully');
    return data;
  } catch (error) {
    console.error('Website scan error:', error);
    throw error;
  }
}

export async function getWebsiteScore(url: string): Promise<{
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  overallScore: number;
}> {
  if (isDemoMode) {
    return {
      seoScore: 78 + Math.random() * 15,
      performanceScore: 82 + Math.random() * 12,
      accessibilityScore: 75 + Math.random() * 18,
      overallScore: 78 + Math.random() * 15
    };
  }

  try {
    const scanResult = await scanWebsite(url);
    return {
      seoScore: scanResult.seo.score,
      performanceScore: scanResult.technical.performance,
      accessibilityScore: scanResult.technical.accessibility,
      overallScore: Math.round((scanResult.seo.score + scanResult.technical.performance + scanResult.technical.accessibility) / 3)
    };
  } catch (error) {
    console.error('Failed to get website score:', error);
    throw error;
  }
}

export async function getWebsiteIssues(url: string): Promise<{
  critical: number;
  warnings: number;
  suggestions: number;
  issues: Array<{
    type: 'critical' | 'warning' | 'suggestion';
    category: string;
    issue: string;
    recommendation: string;
  }>;
}> {
  if (isDemoMode) {
    return {
      critical: 2,
      warnings: 5,
      suggestions: 8,
      issues: [
        {
          type: 'critical',
          category: 'SEO',
          issue: 'Missing meta description',
          recommendation: 'Add unique meta descriptions to all pages'
        },
        {
          type: 'warning',
          category: 'Performance',
          issue: 'Large images without optimization',
          recommendation: 'Compress and optimize images'
        },
        {
          type: 'suggestion',
          category: 'Accessibility',
          issue: 'Missing alt text on images',
          recommendation: 'Add descriptive alt text to all images'
        }
      ]
    };
  }

  try {
    const scanResult = await scanWebsite(url);
    const issues = scanResult.recommendations.map(rec => ({
      type: rec.priority === 'high' ? 'critical' as const : rec.priority === 'medium' ? 'warning' as const : 'suggestion' as const,
      category: rec.category,
      issue: rec.issue,
      recommendation: rec.recommendation
    }));

    return {
      critical: issues.filter(i => i.type === 'critical').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      suggestions: issues.filter(i => i.type === 'suggestion').length,
      issues
    };
  } catch (error) {
    console.error('Failed to get website issues:', error);
    throw error;
  }
}