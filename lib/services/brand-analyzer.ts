
import { callTask } from './ai';
import { authFetch } from '@/lib/client/auth-fetch';

import { toPercent } from '@/lib/format';

export interface BrandAnalysis {
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

    try {
      // Structured Outputs (strict schema) guarantees the shape; no JSON repair or regex parsing needed.
      const { data } = await callTask<BrandAnalysis>('brand_analysis', this.getAnalysisPrompt(businessIdea));
      return normalizeAnalysis(this.validateAndCleanAnalysis(data));
    } catch (error) {
      console.error('Brand analysis failed:', error);
      throw error; // the UI shows the real cause (key missing / sign-in / rate limit / service error) with Retry
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
