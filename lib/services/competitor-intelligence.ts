import { API_KEYS } from '../api-config';

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || API_KEYS.GEMINI === 'demo-mode';

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
    marketSize: number;
    growthPotential: 'high' | 'medium' | 'low';
    competitiveAdvantage: string;
    entryStrategy: string;
    timeline: string;
    requiredResources: string[];
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

export async function analyzeCompetitors(
  industry: string,
  brandDescription?: string
): Promise<CompetitorAnalysis> {
  if (isDemoMode) {
    console.log('Running competitor analysis in demo mode');
    return {
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
            demographics: ['35-55 years', 'Decision makers', 'Urban professionals'],
            psychographics: ['Quality-focused', 'Risk-averse', 'Team player'],
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
            psychographics: ['Innovation-driven', 'Cost-conscious', 'Hands-on'],
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
          'AI integration is accelerating across all industry segments',
          'Remote work solutions gaining traction',
          'Sustainability focus increasing',
          'Mobile-first approaches becoming standard',
          'Data-driven decision making'
        ]
      },
      opportunities: [
        {
          opportunity: 'AI-Powered Automation',
          marketSize: 500000000,
          growthPotential: 'high',
          competitiveAdvantage: 'First-mover advantage in AI integration',
          entryStrategy: 'Develop proprietary AI features',
          timeline: '6-12 months',
          requiredResources: ['AI engineers', 'Data scientists', 'ML infrastructure']
        },
        {
          opportunity: 'Sustainability Solutions',
          marketSize: 300000000,
          growthPotential: 'high',
          competitiveAdvantage: 'Environmental leadership positioning',
          entryStrategy: 'Partner with green technology providers',
          timeline: '3-6 months',
          requiredResources: ['Sustainability experts', 'Marketing team', 'Partnership managers']
        },
        {
          opportunity: 'Mobile-First Solutions',
          marketSize: 400000000,
          growthPotential: 'medium',
          competitiveAdvantage: 'Superior mobile user experience',
          entryStrategy: 'Redesign platform for mobile-first approach',
          timeline: '4-8 months',
          requiredResources: ['Mobile developers', 'UX designers', 'Product managers']
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
      ]
    };
  }

  try {
    console.log('Analyzing competitors in:', industry);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/competitor-intelligence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ industry, brandDescription })
    });

    if (!response.ok) {
      throw new Error(`Competitor analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Competitor analysis completed successfully');
    return data;
  } catch (error) {
    console.error('Competitor analysis error:', error);
    throw error;
  }
}

export async function getCompetitorOverview(industry: string): Promise<{
  totalCompetitors: number;
  marketConcentration: number;
  averageGrowthRate: number;
  topCompetitors: Array<{
    name: string;
    marketShare: number;
    growthRate: number;
  }>;
}> {
  if (isDemoMode) {
    return {
      totalCompetitors: 15,
      marketConcentration: 65,
      averageGrowthRate: 0.12,
      topCompetitors: [
        { name: 'Industry Leader Inc.', marketShare: 28.5, growthRate: 0.12 },
        { name: 'Innovation Tech', marketShare: 22.3, growthRate: 0.18 },
        { name: 'ValueSoft Solutions', marketShare: 18.7, growthRate: 0.08 }
      ]
    };
  }

  try {
    const analysis = await analyzeCompetitors(industry);
    return {
      totalCompetitors: analysis.competitors.length,
      marketConcentration: analysis.marketDynamics.totalMarketSize > 0 ?
        (analysis.competitors.slice(0, 4).reduce((sum, comp) => sum + comp.marketShare, 0)) : 0,
      averageGrowthRate: analysis.competitors.reduce((sum, comp) => sum + comp.growthRate, 0) / analysis.competitors.length,
      topCompetitors: analysis.competitors.slice(0, 3).map(comp => ({
        name: comp.name,
        marketShare: comp.marketShare,
        growthRate: comp.growthRate
      }))
    };
  } catch (error) {
    console.error('Failed to get competitor overview:', error);
    throw error;
  }
}