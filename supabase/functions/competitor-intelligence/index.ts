import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "npm:@google/generative-ai";
import { getEdgeSecret } from '../../lib/edge-secrets.ts';

const GEMINI_API_KEY = getEdgeSecret('GEMINI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

interface CompetitorAnalysis {
  industry: string;
  analysisDate: string;
  competitors: Array<{
    name: string;
    website: string;
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    marketShare: number;
    growthRate: number;
    strengths: string[];
    weaknesses: string[];
    digitalPresence: {
      websiteScore: number;
      socialMedia: {
        platforms: string[];
        followers: number;
        engagement: number;
      };
      seoScore: number;
      contentQuality: number;
    };
    pricing: {
      strategy: 'premium' | 'mid' | 'low' | 'freemium';
      range: string;
      competitiveness: number;
    };
    targetAudience: {
      demographics: string[];
      psychographics: string[];
      size: number;
    };
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  }>;
  marketDynamics: {
    totalMarketSize: number;
    growthRate: number;
    competitionLevel: 'high' | 'medium' | 'low';
    entryBarriers: 'high' | 'medium' | 'low';
    keyTrends: string[];
  };
  opportunities: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    description: string;
    competitors: string[];
    recommendedAction: string;
  }>;
  threats: Array<{
    threat: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    timeframe: string;
    expectedImpact: string;
  }>;
}

const COMPETITOR_ANALYSIS_PROMPT = `Analyze the competitive landscape for this industry:

Industry: {industry}
Your Brand: {brandDescription}

Please provide comprehensive competitor intelligence including:
1. Top 5-7 competitors with detailed profiles
2. Market dynamics and positioning
3. Competitive opportunities and threats
4. Strategic recommendations

Return the analysis as a structured JSON object.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { industry, brandDescription } = await req.json();

    if (!industry) {
      throw new Error('Industry is required');
    }

    // Return demo data if API key is missing
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-mode') {
      const demoResult: CompetitorAnalysis = {
        industry,
        analysisDate: new Date().toISOString(),
        competitors: [
          {
            name: 'Industry Leader Inc.',
            website: 'https://industryleader.com',
            marketPosition: 'leader',
            marketShare: 28.5,
            growthRate: 0.12,
            strengths: ['Brand recognition', 'Product quality', 'Marketing reach', 'Customer loyalty'],
            weaknesses: ['Premium pricing', 'Slower innovation', 'Limited customization'],
            digitalPresence: {
              websiteScore: 92,
              socialMedia: {
                platforms: ['LinkedIn', 'Twitter', 'Facebook'],
                followers: 125000,
                engagement: 4.2
              },
              seoScore: 88,
              contentQuality: 85
            },
            pricing: {
              strategy: 'premium',
              range: '$99-$499/month',
              competitiveness: 75
            },
            targetAudience: {
              demographics: ['30-50 years', 'Decision makers', 'Urban professionals'],
              psychographics: ['Quality-focused', 'Brand-conscious', 'Risk-averse'],
              size: 500000
            },
            swot: {
              strengths: ['Strong brand', 'Quality products', 'Large customer base'],
              weaknesses: ['High prices', 'Slow innovation', 'Complex processes'],
              opportunities: ['Digital transformation', 'Emerging markets', 'Partnerships'],
              threats: ['New entrants', 'Economic downturn', 'Technology disruption']
            }
          },
          {
            name: 'Innovation Tech',
            website: 'https://innovationtech.com',
            marketPosition: 'challenger',
            marketShare: 22.3,
            growthRate: 0.18,
            strengths: ['Innovation speed', 'Customer service', 'Digital experience', 'Agile processes'],
            weaknesses: ['Brand awareness', 'Limited product range', 'Smaller team'],
            digitalPresence: {
              websiteScore: 96,
              socialMedia: {
                platforms: ['Twitter', 'Instagram', 'YouTube'],
                followers: 89000,
                engagement: 5.1
              },
              seoScore: 91,
              contentQuality: 88
            },
            pricing: {
              strategy: 'mid',
              range: '$49-$199/month',
              competitiveness: 82
            },
            targetAudience: {
              demographics: ['25-40 years', 'Tech-savvy users', 'Early adopters'],
              psychographics: ['Innovation-driven', 'Cost-conscious', 'Tech enthusiasts'],
              size: 750000
            },
            swot: {
              strengths: ['Fast innovation', 'Strong digital presence', 'Customer focus'],
              weaknesses: ['Limited brand recognition', 'Narrow product range', 'Funding constraints'],
              opportunities: ['Market expansion', 'Technology partnerships', 'Content marketing'],
              threats: ['Competition from larger players', 'Economic uncertainty', 'Talent acquisition']
            }
          },
          {
            name: 'ValueSoft Solutions',
            website: 'https://valuesoft.com',
            marketPosition: 'follower',
            marketShare: 18.7,
            growthRate: 0.08,
            strengths: ['Competitive pricing', 'Large customer base', 'Reliable solutions', 'Established reputation'],
            weaknesses: ['Less innovative', 'Customer support issues', 'Outdated technology'],
            digitalPresence: {
              websiteScore: 78,
              socialMedia: {
                platforms: ['Facebook', 'LinkedIn'],
                followers: 67000,
                engagement: 2.8
              },
              seoScore: 72,
              contentQuality: 75
            },
            pricing: {
              strategy: 'low',
              range: '$29-$99/month',
              competitiveness: 88
            },
            targetAudience: {
              demographics: ['35-55 years', 'Small business owners', 'Budget-conscious'],
              psychographics: ['Value-driven', 'Practical', 'Risk-averse'],
              size: 1200000
            },
            swot: {
              strengths: ['Low prices', 'Large market share', 'Established presence'],
              weaknesses: ['Technology lag', 'Support issues', 'Limited features'],
              opportunities: ['Technology upgrade', 'Service improvement', 'Market expansion'],
              threats: ['New innovative entrants', 'Price wars', 'Customer churn']
            }
          }
        ],
        marketDynamics: {
          totalMarketSize: 2500000000,
          growthRate: 0.12,
          competitionLevel: 'high',
          entryBarriers: 'medium',
          keyTrends: [
            'AI integration is accelerating',
            'Remote work solutions gaining traction',
            'Sustainability focus increasing',
            'Mobile-first approaches becoming standard',
            'Data-driven decision making'
          ]
        },
        opportunities: [
          {
            opportunity: 'AI-Powered Features',
            potential: 'high',
            description: 'Integrate AI capabilities that competitors lack',
            competitors: ['ValueSoft Solutions'],
            recommendedAction: 'Develop AI assistant features within 6 months'
          },
          {
            opportunity: 'Mobile Optimization',
            potential: 'medium',
            description: 'Enhanced mobile experience in growing mobile market',
            competitors: ['All competitors'],
            recommendedAction: 'Launch mobile app within 3 months'
          },
          {
            opportunity: 'Sustainability Focus',
            potential: 'high',
            description: 'Emphasize eco-friendly practices and solutions',
            competitors: ['Industry Leader Inc.'],
            recommendedAction: 'Develop sustainability roadmap and marketing campaign'
          }
        ],
        threats: [
          {
            threat: 'New AI-Enabled Entrants',
            probability: 'high',
            impact: 'high',
            description: 'New startups with AI-first approach entering market',
            mitigation: 'Accelerate AI integration and establish thought leadership'
          },
          {
            threat: 'Economic Downturn',
            probability: 'medium',
            impact: 'high',
            description: 'Potential economic slowdown affecting B2B spending',
            mitigation: 'Diversify revenue streams and offer flexible pricing'
          },
          {
            threat: 'Technology Commoditization',
            probability: 'medium',
            impact: 'medium',
            description: 'Core features becoming table stakes rather than differentiators',
            mitigation: 'Focus on superior user experience and advanced features'
          }
        ],
        recommendations: [
          {
            priority: 'high',
            category: 'Product Development',
            recommendation: 'Accelerate AI feature development to match Innovation Tech',
            timeframe: '3-6 months',
            expectedImpact: '15-20% market share gain'
          },
          {
            priority: 'high',
            category: 'Pricing Strategy',
            recommendation: 'Introduce tiered pricing to compete with ValueSoft while maintaining premium positioning',
            timeframe: '1-2 months',
            expectedImpact: '10-15% revenue increase'
          },
          {
            priority: 'medium',
            category: 'Digital Presence',
            recommendation: 'Enhance social media strategy and content marketing to improve engagement rates',
            timeframe: '2-4 months',
            expectedImpact: '25% increase in brand awareness'
          },
          {
            priority: 'high',
            category: 'Customer Experience',
            recommendation: 'Invest in customer support infrastructure to address service gaps',
            timeframe: '2-3 months',
            expectedImpact: '20% reduction in churn rate'
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

    console.log('Starting competitor intelligence analysis for:', industry);

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

    const prompt = COMPETITOR_ANALYSIS_PROMPT
      .replace('{industry}', industry)
      .replace('{brandDescription}', brandDescription || 'Our brand in this industry');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    try {
      const analysisJson = JSON.parse(analysisText);
      console.log('Competitor intelligence analysis completed successfully');

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
      console.error('Failed to parse competitor analysis result:', parseError);
      throw new Error('Invalid analysis format returned');
    }
  } catch (error) {
    console.error('Competitor intelligence error:', error);

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