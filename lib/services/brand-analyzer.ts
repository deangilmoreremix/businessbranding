import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEYS } from '@/lib/api-config';

export interface BrandAnalysis {
  healthScore: number;
  marketFit: number;
  uniquenessScore: number;
  brandFactors: Array<{
    name: string;
    score: number;
    insights: string[];
  }>;
  competitors: Array<{
    name: string;
    score?: number;
    marketShare?: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  recommendations: string[];
  toxicity?: Record<string, boolean>;
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
      console.log("Trying edge function for brand analysis");
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
        return data as BrandAnalysis;
      }
      
      console.warn("Edge function failed, falling back to client-side analysis");
    } catch (error) {
      console.warn("Edge function unavailable, falling back to client-side analysis:", error);
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
      brandFactors: Array.isArray(analysis.brandFactors) ? analysis.brandFactors : 
        BRAND_PILLARS.map(name => ({ 
          name, 
          score: 0.7, 
          insights: ['Generic insight for this pillar'] 
        })),
      competitors: Array.isArray(analysis.competitors) ? analysis.competitors : 
        [{ name: 'Generic Competitor', strengths: ['Market presence'], weaknesses: ['Innovation'] }],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : 
        ['Enhance brand identity', 'Improve market positioning'],
      toxicity: analysis.toxicity
    };
  }

  private getDemoAnalysis(): BrandAnalysis {
    return {
      healthScore: 85,
      marketFit: 0.78,
      uniquenessScore: 0.82,
      brandFactors: BRAND_PILLARS.map((pillar, index) => ({
        name: pillar,
        score: 0.7 + (Math.random() * 0.2),
        insights: [
          'Strong foundation with room for growth',
          'Consider enhancing this aspect'
        ]
      })),
      competitors: [
        {
          name: 'TechCorp Solutions',
          marketShare: 25,
          strengths: ['Market presence', 'Product range'],
          weaknesses: ['Customer service', 'Pricing']
        },
        {
          name: 'Digital Dynamics',
          marketShare: 15,
          strengths: ['Innovation', 'Customer focus'],
          weaknesses: ['Limited reach', 'Resource constraints']
        }
      ],
      recommendations: [
        'Enhance visual brand identity with more distinctive elements',
        'Develop comprehensive content strategy across channels',
        'Implement customer feedback loop for continuous improvement'
      ]
    };
  }
}