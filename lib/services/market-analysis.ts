import { API_KEYS } from '../api-config';

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || API_KEYS.GEMINI === 'demo-mode';

interface MarketAnalysis {
  industry: string;
  analysisDate: string;
  marketOverview: {
    totalSize: number;
    growthRate: number;
    projectedSize: number;
    keyMetrics: {
      cagr: number;
      marketConcentration: number;
      entryBarriers: 'high' | 'medium' | 'low';
      innovationIndex: number;
    };
  };
  industryTrends: Array<{
    trend: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    description: string;
    opportunities: string[];
    threats: string[];
  }>;
  marketSegments: Array<{
    segment: string;
    size: number;
    growth: number;
    characteristics: string[];
    targetAudience: {
      demographics: string[];
      needs: string[];
      buyingBehavior: string[];
    };
    competitiveIntensity: 'high' | 'medium' | 'low';
  }>;
  customerAnalysis: {
    personas: Array<{
      name: string;
      description: string;
      demographics: string[];
      psychographics: string[];
      painPoints: string[];
      buyingJourney: string[];
      preferredChannels: string[];
    }>;
    journeyStages: Array<{
      stage: string;
      description: string;
      touchpoints: string[];
      conversionRate: number;
      dropOffRate: number;
    }>;
    satisfactionDrivers: Array<{
      driver: string;
      importance: number;
      currentPerformance: number;
      gap: number;
    }>;
  };
  competitiveLandscape: {
    concentration: {
      cr4: number;
      hhi: number;
      dominantPlayers: string[];
    };
    competitiveForces: {
      newEntrants: 'high' | 'medium' | 'low';
      substitutes: 'high' | 'medium' | 'low';
      buyerPower: 'high' | 'medium' | 'low';
      supplierPower: 'high' | 'medium' | 'low';
      rivalry: 'high' | 'medium' | 'low';
    };
    emergingThreats: Array<{
      threat: string;
      probability: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
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
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    rationale: string;
    implementation: string;
    expectedOutcome: string;
    timeline: string;
  }>;
}

export async function analyzeMarket(
  industry: string,
  brandDescription?: string
): Promise<MarketAnalysis> {
  if (isDemoMode) {
    console.log('Running market analysis in demo mode');
    return {
      industry,
      analysisDate: new Date().toISOString(),
      marketOverview: {
        totalSize: 2500000000,
        growthRate: 0.12,
        projectedSize: 3200000000,
        keyMetrics: {
          cagr: 12.5,
          marketConcentration: 65,
          entryBarriers: 'medium',
          innovationIndex: 78
        }
      },
      industryTrends: [
        {
          trend: 'AI Integration',
          impact: 'high',
          timeframe: '2024-2026',
          description: 'AI adoption is accelerating across all industry segments',
          opportunities: ['AI-powered automation', 'Predictive analytics', 'Personalization'],
          threats: ['Job displacement', 'Data privacy concerns', 'Implementation costs']
        },
        {
          trend: 'Remote Work Solutions',
          impact: 'high',
          timeframe: '2024-2025',
          description: 'Hybrid work models becoming standard',
          opportunities: ['Cloud collaboration tools', 'Virtual training', 'Remote monitoring'],
          threats: ['Physical office space reduction', 'Team cohesion challenges']
        },
        {
          trend: 'Sustainability Focus',
          impact: 'medium',
          timeframe: '2025-2027',
          description: 'Environmental consciousness driving business decisions',
          opportunities: ['Green technology solutions', 'Sustainable practices', 'Carbon tracking'],
          threats: ['Increased regulatory requirements', 'Higher operational costs']
        }
      ],
      marketSegments: [
        {
          segment: 'Enterprise',
          size: 750000000,
          growth: 0.15,
          characteristics: ['Large organizations', 'Complex needs', 'High budget'],
          targetAudience: {
            demographics: ['35-55 years', 'C-level executives', 'IT decision makers'],
            needs: ['Scalability', 'Integration', 'Security', 'Support'],
            buyingBehavior: ['Long sales cycles', 'Multiple stakeholders', 'ROI-focused']
          },
          competitiveIntensity: 'high'
        },
        {
          segment: 'Mid-Market',
          size: 1200000000,
          growth: 0.18,
          characteristics: ['Growing companies', 'Moderate complexity', 'Medium budget'],
          targetAudience: {
            demographics: ['30-45 years', 'Department heads', 'IT managers'],
            needs: ['Ease of use', 'Quick implementation', 'Cost effectiveness'],
            buyingBehavior: ['Faster decisions', 'Feature comparison', 'Trial periods']
          },
          competitiveIntensity: 'medium'
        },
        {
          segment: 'Small Business',
          size: 550000000,
          growth: 0.22,
          characteristics: ['Small teams', 'Basic needs', 'Limited budget'],
          targetAudience: {
            demographics: ['25-40 years', 'Business owners', 'Startup founders'],
            needs: ['Affordability', 'Simplicity', 'Mobile access'],
            buyingBehavior: ['Price-sensitive', 'Quick decisions', 'Word-of-mouth']
          },
          competitiveIntensity: 'low'
        }
      ],
      customerAnalysis: {
        personas: [
          {
            name: 'Sarah Chen',
            description: 'IT Director at mid-sized manufacturing company',
            demographics: ['Female', '42 years old', 'Urban professional'],
            psychographics: ['Results-oriented', 'Risk-averse', 'Team player'],
            painPoints: ['Legacy system integration', 'User adoption', 'Budget constraints'],
            buyingJourney: ['Problem identification', 'Solution research', 'Vendor evaluation', 'Pilot testing'],
            preferredChannels: ['LinkedIn', 'Industry events', 'Peer recommendations']
          },
          {
            name: 'Mike Rodriguez',
            description: 'Operations Manager at small logistics company',
            demographics: ['Male', '38 years old', 'Small business owner'],
            psychographics: ['Practical', 'Cost-conscious', 'Hands-on'],
            painPoints: ['Manual processes', 'Scalability issues', 'Limited IT resources'],
            buyingJourney: ['Problem awareness', 'Online research', 'Demo request', 'Quick implementation'],
            preferredChannels: ['Google search', 'YouTube reviews', 'Social media ads']
          }
        ],
        journeyStages: [
          {
            stage: 'Awareness',
            description: 'Customer realizes they have a problem or opportunity',
            touchpoints: ['Industry reports', 'Social media', 'Word of mouth'],
            conversionRate: 0.15,
            dropOffRate: 0.85
          },
          {
            stage: 'Consideration',
            description: 'Customer researches and evaluates solutions',
            touchpoints: ['Website visits', 'Product demos', 'Competitor analysis'],
            conversionRate: 0.35,
            dropOffRate: 0.65
          },
          {
            stage: 'Decision',
            description: 'Customer selects and purchases solution',
            touchpoints: ['Pricing pages', 'Sales calls', 'Contract negotiation'],
            conversionRate: 0.75,
            dropOffRate: 0.25
          }
        ],
        satisfactionDrivers: [
          {
            driver: 'Ease of Use',
            importance: 9.2,
            currentPerformance: 7.8,
            gap: 1.4
          },
          {
            driver: 'Reliability',
            importance: 9.5,
            currentPerformance: 8.9,
            gap: 0.6
          },
          {
            driver: 'Customer Support',
            importance: 8.8,
            currentPerformance: 7.2,
            gap: 1.6
          },
          {
            driver: 'Value for Money',
            importance: 9.1,
            currentPerformance: 8.1,
            gap: 1.0
          }
        ]
      },
      competitiveLandscape: {
        concentration: {
          cr4: 65,
          hhi: 1800,
          dominantPlayers: ['Industry Leader Inc.', 'Innovation Tech', 'ValueSoft Solutions']
        },
        competitiveForces: {
          newEntrants: 'medium',
          substitutes: 'high',
          buyerPower: 'high',
          supplierPower: 'low',
          rivalry: 'high'
        },
        emergingThreats: [
          {
            threat: 'Open-source alternatives',
            probability: 'high',
            impact: 'medium',
            description: 'Free and open-source solutions gaining market share'
          },
          {
            threat: 'Platform consolidation',
            probability: 'medium',
            impact: 'high',
            description: 'Large platforms acquiring smaller players'
          },
          {
            threat: 'Regulatory changes',
            probability: 'medium',
            impact: 'high',
            description: 'New data privacy and AI regulations'
          }
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
      recommendations: [
        {
          priority: 'high',
          category: 'Product Strategy',
          recommendation: 'Accelerate AI integration across all product lines',
          rationale: 'AI is the fastest-growing trend with highest market potential',
          implementation: 'Form AI task force, partner with AI vendors, develop roadmap',
          expectedOutcome: '20% market share growth, improved competitive positioning',
          timeline: '6 months'
        },
        {
          priority: 'high',
          category: 'Customer Experience',
          recommendation: 'Address ease of use and support gaps identified in satisfaction drivers',
          rationale: 'High importance drivers with significant performance gaps',
          implementation: 'UX audit, support team expansion, training program',
          expectedOutcome: '15% increase in customer satisfaction, reduced churn',
          timeline: '3 months'
        },
        {
          priority: 'medium',
          category: 'Market Expansion',
          recommendation: 'Target mid-market segment with tailored solutions',
          rationale: 'Highest growth rate and moderate competitive intensity',
          implementation: 'Develop mid-market product tier, create targeted marketing campaigns',
          expectedOutcome: '25% revenue growth from new segment',
          timeline: '9 months'
        },
        {
          priority: 'medium',
          category: 'Competitive Positioning',
          recommendation: 'Strengthen differentiation through sustainability focus',
          rationale: 'Growing trend with low current competition',
          implementation: 'Develop sustainability features, marketing campaign, partnerships',
          expectedOutcome: 'Enhanced brand positioning, new market opportunities',
          timeline: '6 months'
        }
      ]
    };
  }

  try {
    console.log('Analyzing market for:', industry);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/market-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ industry, brandDescription })
    });

    if (!response.ok) {
      throw new Error(`Market analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Market analysis completed successfully');
    return data;
  } catch (error) {
    console.error('Market analysis error:', error);
    throw error;
  }
}

export async function getMarketOverview(industry: string): Promise<{
  marketSize: number;
  growthRate: number;
  keyTrends: string[];
  topOpportunities: Array<{
    opportunity: string;
    marketSize: number;
    growthPotential: string;
  }>;
}> {
  if (isDemoMode) {
    return {
      marketSize: 2500000000,
      growthRate: 0.12,
      keyTrends: ['AI Integration', 'Remote Work Solutions', 'Sustainability Focus'],
      topOpportunities: [
        { opportunity: 'AI-Powered Automation', marketSize: 500000000, growthPotential: 'high' },
        { opportunity: 'Sustainability Solutions', marketSize: 300000000, growthPotential: 'high' },
        { opportunity: 'Mobile-First Solutions', marketSize: 400000000, growthPotential: 'medium' }
      ]
    };
  }

  try {
    const analysis = await analyzeMarket(industry);
    return {
      marketSize: analysis.marketOverview.totalSize,
      growthRate: analysis.marketOverview.growthRate,
      keyTrends: analysis.industryTrends.slice(0, 3).map(trend => trend.trend),
      topOpportunities: analysis.opportunities.slice(0, 3).map(opp => ({
        opportunity: opp.opportunity,
        marketSize: opp.marketSize,
        growthPotential: opp.growthPotential
      }))
    };
  } catch (error) {
    console.error('Failed to get market overview:', error);
    throw error;
  }
}