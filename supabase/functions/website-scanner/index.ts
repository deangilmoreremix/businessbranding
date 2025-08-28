import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "npm:@google/generative-ai";
import { getEdgeSecret } from '../../lib/edge-secrets.ts';

const GEMINI_API_KEY = getEdgeSecret('GEMINI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

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

const WEBSITE_ANALYSIS_PROMPT = `Analyze this website comprehensively:

URL: {url}
Content: {content}

Please provide analysis in the following format:
1. SEO Score (0-100) with title, description, keywords analysis
2. Content quality metrics (word count, readability, sentiment)
3. Technical performance (SSL, responsive, performance score)
4. Social media integration and schema markup
5. Specific recommendations with priorities

Return the analysis as a structured JSON object.`;

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteScanner/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();

    // Extract basic content (simplified scraping)
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
    const headings = {
      h1: (html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || []).map(h => h.replace(/<[^>]+>/g, '')),
      h2: (html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || []).map(h => h.replace(/<[^>]+>/g, '')),
      h3: (html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || []).map(h => h.replace(/<[^>]+>/g, ''))
    };

    // Extract social links
    const socialPatterns = {
      facebook: /https?:\/\/(www\.)?facebook\.com\/[^"'\s]+/gi,
      twitter: /https?:\/\/(www\.)?twitter\.com\/[^"'\s]+/gi,
      instagram: /https?:\/\/(www\.)?instagram\.com\/[^"'\s]+/gi,
      linkedin: /https?:\/\/(www\.)?linkedin\.com\/[^"'\s]+/gi
    };

    const socialLinks: Array<{platform: string, url: string}> = [];
    Object.entries(socialPatterns).forEach(([platform, pattern]) => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(url => {
          socialLinks.push({ platform, url });
        });
      }
    });

    return JSON.stringify({
      title,
      description,
      headings,
      socialLinks: Array.from(new Set(socialLinks.map(link => link.url))),
      wordCount: html.replace(/<[^>]+>/g, ' ').split(/\s+/).length,
      hasSSL: url.startsWith('https://'),
      loadTime: Math.random() * 3000 + 500 // Simulated load time
    });
  } catch (error) {
    console.error('Website scraping failed:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('Website URL is required');
    }

    // Return demo data if API key is missing
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-mode') {
      const demoResult: WebsiteScanResult = {
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
        ],
        demo: true
      };

      return new Response(
        JSON.stringify(demoResult),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Starting website scan for:', url);

    // Scrape the website
    const scrapedContent = await scrapeWebsite(url);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      safetySettings: [
        {
          category: HarmCategory.HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
      ]
    });

    const prompt = WEBSITE_ANALYSIS_PROMPT
      .replace('{url}', url)
      .replace('{content}', scrapedContent);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    try {
      const analysisJson = JSON.parse(analysisText);
      console.log('Website analysis completed successfully');

      return new Response(
        JSON.stringify(analysisJson),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('Failed to parse website analysis result:', parseError);
      throw new Error('Invalid analysis format returned');
    }
  } catch (error) {
    console.error('Website scanning error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});