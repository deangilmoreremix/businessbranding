import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEYS } from '@/lib/api-config';

export interface BrandAnalysis {
  // Core Brand Metrics
  healthScore: number;
  marketFit: number;
  uniquenessScore: number;

  // Real-time Monitoring
  lastUpdated: string;
  monitoringStatus: 'active' | 'paused' | 'error';
  growthTrajectory: {
    current: number;
    projected: number;
    trend: 'up' | 'down' | 'stable';
    timeframe: string;
  };

  // Brand Pillars (20-point analysis)
  brandFactors: Array<{
    name: string;
    score: number;
    insights: string[];
    priority: 'high' | 'medium' | 'low';
    trend: 'improving' | 'declining' | 'stable';
  }>;

  // Performance Metrics
  performanceMetrics: {
    engagement: {
      rate: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: number;
    };
    conversion: {
      rate: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: number;
    };
    roi: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: number;
    };
    customerSatisfaction: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: number;
    };
    brandLoyalty: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: number;
    };
  };

  // Market Analysis
  marketAnalysis: {
    industryTrends: Array<{
      trend: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
    marketOpportunities: Array<{
      opportunity: string;
      potential: 'high' | 'medium' | 'low';
      description: string;
    }>;
    growthBarriers: Array<{
      barrier: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
    }>;
    customerSegments: Array<{
      segment: string;
      size: number;
      growth: number;
      characteristics: string[];
    }>;
    marketDynamics: {
      totalMarketSize: number;
      growthRate: number;
      competitionLevel: 'high' | 'medium' | 'low';
      entryBarriers: 'high' | 'medium' | 'low';
    };
  };

  // Competitors
  competitors: Array<{
    name: string;
    score?: number;
    marketShare?: number;
    strengths: string[];
    weaknesses: string[];
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    growthRate: number;
  }>;

  // Implementation Tracking
  implementationStatus: {
    completed: number;
    inProgress: number;
    planned: number;
    total: number;
    progressPercentage: number;
  };

  // Best Practices
  bestPractices: {
    dataCollection: {
      score: number;
      recommendations: string[];
    };
    analysisReview: {
      score: number;
      recommendations: string[];
    };
    optimization: {
      score: number;
      recommendations: string[];
    };
  };

  // Strategic Recommendations
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    resources: string[];
  }>;

  // Additional metadata
  toxicity?: Record<string, boolean>;
  riskFactors?: Array<{
    risk: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

export const BRAND_PILLARS = [
  'Brand Purpose & Mission',
  'Core Values & Authenticity',
  'Target Audience Understanding',
  'UVP & Differentiation',
  'Visual Identity',
  'Brand Voice & Personality',
  'Consistency Across Channels',
  'Emotional Storytelling',
  'Customer Experience',
  'Engagement & Community',
  'Trust & Credibility',
  'Loyalty & Advocacy',
  'Strategic Marketing',
  'Digital Presence',
  'Brand Monitoring',
  'Innovation & Adaptability',
  'Product/Service Quality',
  'Partnerships & Collaborations',
  'Internal Brand Culture',
  'Continuous Improvement'
];

export class BrandAnalyzer {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any;
  private initialized: boolean = false;
  private demoMode: boolean = API_KEYS.GEMINI === 'demo-mode';

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.demoMode) {
      console.warn('Running in demo mode - Gemini API key is not set');
      this.initialized = true;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(API_KEYS.GEMINI);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        topK: 40,
        topP: 0.95
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      this.initialized = false;
      this.demoMode = true; // Fall back to demo mode
      throw error;
    }
  }

  async analyzeBrandConcept(businessIdea: string): Promise<BrandAnalysis> {
    // Try to use the Supabase Edge Function first for better reliability
    try {
      console.log("Trying enhanced edge function for brand analysis");
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/brand-analyzer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ businessIdea })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Enhanced brand analysis completed successfully");
        return this.validateAndCleanAnalysis(data);
      }

      console.warn("Enhanced edge function failed, falling back to client-side analysis");
    } catch (error) {
      console.warn("Enhanced edge function unavailable, falling back to client-side analysis:", error);
    }

    // Return demo data if in demo mode or if API initialization failed
    if (this.demoMode || !this.model) {
      return this.getDemoAnalysis();
    }

    try {
      const prompt = this.getAnalysisPrompt(businessIdea);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      try {
        const analysis = JSON.parse(analysisText);
        return this.validateAndCleanAnalysis(analysis);
      } catch (parseError) {
        console.error('Failed to parse analysis result:', parseError);
        throw new Error('Invalid analysis format returned');
      }
    } catch (error) {
      console.error('Brand analysis failed:', error);
      return this.getDemoAnalysis();
    }
  }

  private getAnalysisPrompt(businessIdea: string): string {
    return `Analyze this business concept and provide a comprehensive brand analysis:

    Business Description: ${businessIdea}

    Analyze across these 20 brand pillars:
    ${BRAND_PILLARS.join('\n')}

    Provide analysis in the following format:
    1. Brand Health Score (0-100)
    2. Market Fit (0-1)
    3. Uniqueness Score (0-1)
    4. Brand Factors (array of factors with name, score, and insights)
    5. Competitor Analysis
    6. Strategic Recommendations

    Return the analysis as a structured JSON object.`;
  }

  private validateAndCleanAnalysis(analysis: any): BrandAnalysis {
    // Ensure all required fields are present, with fallbacks if missing
    return {
      healthScore: analysis.healthScore ?? 75,
      marketFit: analysis.marketFit ?? 0.7,
      uniquenessScore: analysis.uniquenessScore ?? 0.65,
      lastUpdated: analysis.lastUpdated ?? new Date().toISOString(),
      monitoringStatus: analysis.monitoringStatus ?? 'active',
      growthTrajectory: analysis.growthTrajectory ?? {
        current: 0,
        projected: 0,
        trend: 'stable' as const,
        timeframe: '12 months'
      },
      brandFactors: Array.isArray(analysis.brandFactors) ? analysis.brandFactors :
        BRAND_PILLARS.map(name => ({
          name,
          score: 0.7,
          insights: ['Generic insight for this pillar'],
          priority: 'medium' as const,
          trend: 'stable' as const
        })),
      performanceMetrics: analysis.performanceMetrics ?? {
        engagement: { rate: 0.75, trend: 'stable' as const, benchmark: 0.8 },
        conversion: { rate: 0.12, trend: 'stable' as const, benchmark: 0.15 },
        roi: { score: 0.85, trend: 'stable' as const, benchmark: 0.9 },
        customerSatisfaction: { score: 0.82, trend: 'stable' as const, benchmark: 0.85 },
        brandLoyalty: { score: 0.78, trend: 'stable' as const, benchmark: 0.8 }
      },
      marketAnalysis: analysis.marketAnalysis ?? {
        industryTrends: [],
        marketOpportunities: [],
        growthBarriers: [],
        customerSegments: [],
        marketDynamics: {
          totalMarketSize: 1000000000,
          growthRate: 0.08,
          competitionLevel: 'medium' as const,
          entryBarriers: 'medium' as const
        }
      },
      competitors: Array.isArray(analysis.competitors) ? analysis.competitors :
        [{ name: 'Generic Competitor', strengths: ['Market presence'], weaknesses: ['Innovation'], marketPosition: 'follower' as const, growthRate: 0.05 }],
      implementationStatus: analysis.implementationStatus ?? {
        completed: 0,
        inProgress: 0,
        planned: 0,
        total: 0,
        progressPercentage: 0
      },
      bestPractices: analysis.bestPractices ?? {
        dataCollection: { score: 0.7, recommendations: [] },
        analysisReview: { score: 0.7, recommendations: [] },
        optimization: { score: 0.7, recommendations: [] }
      },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations :
        [{
          priority: 'high' as const,
          category: 'Brand Identity',
          recommendation: 'Enhance visual brand identity with more distinctive elements',
          impact: 'high' as const,
          timeframe: '3 months',
          resources: ['Design team', 'Brand guidelines']
        }],
      toxicity: analysis.toxicity,
      riskFactors: analysis.riskFactors ?? []
    };
  }

  private getDemoAnalysis(): BrandAnalysis {
    return {
      healthScore: 85,
      marketFit: 0.78,
      uniquenessScore: 0.82,
      lastUpdated: new Date().toISOString(),
      monitoringStatus: 'active',
      growthTrajectory: {
        current: 0.12,
        projected: 0.18,
        trend: 'up',
        timeframe: '12 months'
      },
      brandFactors: BRAND_PILLARS.map((pillar, index) => {
        const priorities = ['high', 'medium', 'low'] as const;
        const trends = ['improving', 'stable', 'declining'] as const;
        return {
          name: pillar,
          score: 0.7 + (Math.random() * 0.2),
          insights: [
            'Strong foundation with room for growth',
            'Consider enhancing this aspect'
          ],
          priority: priorities[index < 5 ? 0 : index < 10 ? 1 : 2],
          trend: trends[Math.floor(Math.random() * 3)]
        };
      }),
      performanceMetrics: {
        engagement: { rate: 0.75, trend: 'up', benchmark: 0.8 },
        conversion: { rate: 0.12, trend: 'stable', benchmark: 0.15 },
        roi: { score: 0.85, trend: 'up', benchmark: 0.9 },
        customerSatisfaction: { score: 0.82, trend: 'up', benchmark: 0.85 },
        brandLoyalty: { score: 0.78, trend: 'stable', benchmark: 0.8 }
      },
      marketAnalysis: {
        industryTrends: [
          { trend: 'AI Integration', impact: 'high', description: 'AI adoption is accelerating across industries' },
          { trend: 'Sustainability Focus', impact: 'medium', description: 'Consumers demand eco-friendly practices' }
        ],
        marketOpportunities: [
          { opportunity: 'Emerging Markets', potential: 'high', description: 'Untapped markets in developing regions' },
          { opportunity: 'Digital Transformation', potential: 'medium', description: 'Helping traditional businesses go digital' }
        ],
        growthBarriers: [
          { barrier: 'Competition', severity: 'high', description: 'Established players dominate market' },
          { barrier: 'Regulation', severity: 'medium', description: 'Increasing regulatory requirements' }
        ],
        customerSegments: [
          { segment: 'Enterprise', size: 0.3, growth: 0.08, characteristics: ['Large budget', 'Complex needs'] },
          { segment: 'SMB', size: 0.5, growth: 0.12, characteristics: ['Cost sensitive', 'Quick decisions'] },
          { segment: 'Consumer', size: 0.2, growth: 0.15, characteristics: ['Price sensitive', 'Brand conscious'] }
        ],
        marketDynamics: {
          totalMarketSize: 1000000000,
          growthRate: 0.08,
          competitionLevel: 'high',
          entryBarriers: 'medium'
        }
      },
      competitors: [
        {
          name: 'TechCorp Solutions',
          marketShare: 25,
          strengths: ['Market presence', 'Product range'],
          weaknesses: ['Customer service', 'Pricing'],
          marketPosition: 'leader',
          growthRate: 0.08
        },
        {
          name: 'Digital Dynamics',
          marketShare: 15,
          strengths: ['Innovation', 'Customer focus'],
          weaknesses: ['Limited reach', 'Resource constraints'],
          marketPosition: 'challenger',
          growthRate: 0.12
        }
      ],
      implementationStatus: {
        completed: 12,
        inProgress: 8,
        planned: 15,
        total: 35,
        progressPercentage: 34
      },
      bestPractices: {
        dataCollection: {
          score: 0.82,
          recommendations: ['Implement automated data collection', 'Regular data validation']
        },
        analysisReview: {
          score: 0.75,
          recommendations: ['Monthly analysis reviews', 'Stakeholder feedback sessions']
        },
        optimization: {
          score: 0.78,
          recommendations: ['Performance monitoring', 'Continuous improvement processes']
        }
      },
      recommendations: [
        {
          priority: 'high',
          category: 'Brand Identity',
          recommendation: 'Enhance visual brand identity with more distinctive elements',
          impact: 'high',
          timeframe: '3 months',
          resources: ['Design team', 'Brand guidelines']
        },
        {
          priority: 'medium',
          category: 'Content Strategy',
          recommendation: 'Develop comprehensive content strategy across channels',
          impact: 'medium',
          timeframe: '6 months',
          resources: ['Content team', 'Marketing budget']
        },
        {
          priority: 'high',
          category: 'Customer Experience',
          recommendation: 'Implement customer feedback loop for continuous improvement',
          impact: 'high',
          timeframe: '2 months',
          resources: ['Customer service team', 'Feedback tools']
        }
      ],
      riskFactors: [
        {
          risk: 'Market competition',
          probability: 'high',
          impact: 'medium',
          mitigation: 'Differentiate through innovation'
        },
        {
          risk: 'Technology changes',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Stay updated with industry trends'
        }
      ]
    };
  }
}