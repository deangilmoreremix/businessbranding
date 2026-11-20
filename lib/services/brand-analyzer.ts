
import { callTask, isDemoMode } from './ai';
import { authFetch } from '@/lib/client/auth-fetch';

import { toPercent } from '@/lib/format';

export interface BrandAnalysis {
  /** True when this is built-in sample data (no OpenAI key), not a real analysis: the UI labels it as such. */
  sample?: boolean;
  // Core Brand Metrics
  /** null = the model did not return it (shown as "Not measured"). */
  healthScore: number | null;
  marketFit: number | null;
  uniquenessScore: number | null;

  // Real-time Monitoring
  lastUpdated?: string;
  monitoringStatus?: 'active' | 'paused' | 'error';
  growthTrajectory?: {
    current: number | null;
    projected: number | null;
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
  performanceMetrics?: {
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
  implementationStatus?: {
    completed: number;
    inProgress: number;
    planned: number;
    total: number;
    progressPercentage: number;
  };

  // Best Practices
  bestPractices?: {
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
  /** Kept for API compatibility; nothing to initialize client-side. */
  async initialize(): Promise<void> {}

  async analyzeBrandConcept(businessIdea: string): Promise<BrandAnalysis> {
    // Try to use the Supabase Edge Function first for better reliability
    try {
      console.log("Trying enhanced edge function for brand analysis");
      const response = await authFetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/brand-analyzer`, {
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
        return normalizeAnalysis(this.validateAndCleanAnalysis(data));
      }

      console.warn("Enhanced edge function failed, falling back to client-side analysis");
    } catch (error) {
      console.warn("Enhanced edge function unavailable, falling back to client-side analysis:", error);
    }

    // No OpenAI key configured on the server -> demo data
    if (await isDemoMode()) {
      return this.getDemoAnalysis();
    }

    try {
      // Structured Outputs (strict schema) guarantees the shape; no JSON repair or regex parsing needed.
      const { data } = await callTask<BrandAnalysis>('brand_analysis', this.getAnalysisPrompt(businessIdea));
      return normalizeAnalysis(this.validateAndCleanAnalysis(data));
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
    // Nothing is invented here: a field the model did not return stays missing/null and the UI shows "Not measured".
    const arr = (v: unknown) => (Array.isArray(v) ? v : []);
    return {
      healthScore: analysis.healthScore ?? null,
      marketFit: analysis.marketFit ?? null,
      uniquenessScore: analysis.uniquenessScore ?? null,
      lastUpdated: analysis.lastUpdated ?? new Date().toISOString(),
      monitoringStatus: analysis.monitoringStatus,
      growthTrajectory: analysis.growthTrajectory,
      brandFactors: arr(analysis.brandFactors),
      performanceMetrics: analysis.performanceMetrics,
      marketAnalysis: analysis.marketAnalysis ?? { industryTrends: [], marketOpportunities: [], growthBarriers: [], customerSegments: [] },
      competitors: arr(analysis.competitors),
      implementationStatus: analysis.implementationStatus,
      bestPractices: analysis.bestPractices,
      recommendations: arr(analysis.recommendations),
      toxicity: analysis.toxicity,
      riskFactors: analysis.riskFactors ?? []
    };
  }

  private getDemoAnalysis(): BrandAnalysis {
    return {
      sample: true,
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
          score: 0.7 + ((index * 7) % 20) / 100, // deterministic sample value (this whole object is labelled sample data)
          insights: [
            'Strong foundation with room for growth',
            'Consider enhancing this aspect'
          ],
          priority: priorities[index < 5 ? 0 : index < 10 ? 1 : 2],
          trend: trends[index % 3]
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

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
/** Fraction in [0, 1] from either scale (0.5 and 50 both give 0.5). */
/** Signed fraction (growth can be negative): |v| <= 1 is already a fraction, larger values are percentages (clamped to +-1000%). */
const signedFraction = (v: unknown): number | null => { const n = num(v); if (n === undefined) return null; const f = Math.abs(n) <= 1 ? n : n / 100; return Math.max(-10, Math.min(10, f)); };
const nullableFraction = (v: unknown): number | null => { const p = toPercent(v); return p === null ? null : p / 100; };
const fraction = (v: unknown): number => { const p = toPercent(v); return p === null ? 0 : p / 100; };

/**
 * Make an analysis safe to render whatever scale or shape the model returned: scores are 0-100 (health, progress) or 0-1 (fit,
 * uniqueness) consistently, counts are whole numbers, an unparseable timestamp is dropped (never "Invalid Date"), and a monitoring
 * status that is not clearly active/paused is dropped (a successful analysis must not say "Error").
 */
export function normalizeAnalysis<T extends Partial<BrandAnalysis>>(a: T): T {
  const out: any = { ...a };
  const hp = toPercent(a.healthScore);
  out.healthScore = hp === null ? null : Math.round(hp);
  out.marketFit = nullableFraction(a.marketFit);
  out.uniquenessScore = nullableFraction(a.uniquenessScore);
  const ts = typeof a.lastUpdated === 'string' ? new Date(a.lastUpdated) : null;
  out.lastUpdated = ts && !Number.isNaN(ts.getTime()) ? ts.toISOString() : undefined;
  out.monitoringStatus = a.monitoringStatus === 'active' || a.monitoringStatus === 'paused' ? a.monitoringStatus : undefined;
  if (a.implementationStatus) {
    const st: any = a.implementationStatus;
    const whole = (v: unknown) => Math.max(0, Math.round(num(v) ?? 0));
    out.implementationStatus = { ...st, completed: whole(st.completed), inProgress: whole(st.inProgress), planned: whole(st.planned), total: whole(st.total), progressPercentage: Math.round(toPercent(st.progressPercentage) ?? 0) };
  }
  // The brand-analysis UI shows every rate/score below as a FRACTION (0.5 -> "50%"). Normalise them all here, once, so the UI never
  // has to guess the scale (it used to multiply a value that had already been converted to a percentage: "5000.0%").
  if (a.growthTrajectory) {
    const g: any = a.growthTrajectory;
    out.growthTrajectory = { ...g, current: signedFraction(g.current), projected: signedFraction(g.projected) };
  }
  const pm: any = a.performanceMetrics;
  if (pm) {
    out.performanceMetrics = { ...pm };
    for (const [k, field] of [['engagement', 'rate'], ['conversion', 'rate'], ['roi', 'score'], ['customerSatisfaction', 'score'], ['brandLoyalty', 'score']] as const) {
      if (pm[k]) out.performanceMetrics[k] = { ...pm[k], [field]: fraction(pm[k][field]) };
    }
  }
  const ma: any = a.marketAnalysis;
  if (ma) {
    out.marketAnalysis = { ...ma };
    if (ma.marketDynamics) out.marketAnalysis.marketDynamics = { ...ma.marketDynamics, growthRate: signedFraction(ma.marketDynamics.growthRate) };
    if (Array.isArray(ma.customerSegments)) out.marketAnalysis.customerSegments = ma.customerSegments.map((c: any) => ({ ...c, size: fraction(c?.size), growth: signedFraction(c?.growth) }));
  }
  if (Array.isArray(a.brandFactors)) out.brandFactors = a.brandFactors.map((f: any) => ({ ...f, score: fraction(f?.score) }));
  const bp: any = (a as any).bestPractices;
  if (bp) {
    out.bestPractices = { ...bp };
    for (const k of Object.keys(bp)) if (bp[k] && typeof bp[k] === 'object' && 'score' in bp[k]) out.bestPractices[k] = { ...bp[k], score: fraction(bp[k].score) };
  }
  return out as T;
}
