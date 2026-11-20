import type { TaskName } from '@/lib/ai-tasks';

/**
 * AI features (Responses API + Structured Outputs), usable from server and client code.
 *  - server (API routes): runs the named task directly (lib/ai-tasks.ts)
 *  - browser: calls /api/ai/task so OPENAI_API_KEY never reaches the client
 * Every result is schema-validated JSON; when no key is configured each function returns its built-in
 * demo data (the demo fixtures also define the JSON schemas: see scripts/gen-ai-schemas.mjs).
 */

let clientConfigured: boolean | null = null;

export async function isDemoMode(): Promise<boolean> {
  if (typeof window === 'undefined') {
    const { isConfigured } = await import('@/lib/openai');
    return !isConfigured();
  }
  if (clientConfigured === null) {
    try {
      const res = await fetch('/api/ai/task');
      clientConfigured = res.ok ? !!(await res.json()).configured : false;
    } catch {
      clientConfigured = false;
    }
  }
  return !clientConfigured;
}

export interface AITaskResult<T> {
  data: T;
  /** Web sources used by search-backed tasks; show them as links wherever the data is displayed. */
  citations: { url: string; title?: string }[];
}

/** Run a named AI task and return schema-validated data. */
export async function callTask<T = any>(task: TaskName, input: string, opts: { imageUrls?: string[] } = {}): Promise<AITaskResult<T>> {
  if (typeof window === 'undefined') {
    const { runTask } = await import('@/lib/ai-tasks');
    return runTask<T>(task, input, opts);
  }
  const res = await fetch('/api/ai/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input, imageUrls: opts.imageUrls })
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json();
}

const isImageRef = (u: unknown): u is string => typeof u === 'string' && /^(https?:|data:image\/)/.test(u);

async function detectSocialProfiles(websiteUrl: string) {
  if (await isDemoMode()) {
    return {
      facebook: 'https://facebook.com/demo',
      twitter: 'https://twitter.com/demo',
      instagram: 'https://instagram.com/demo',
      linkedin: 'https://linkedin.com/company/demo'
    };
  }

  try {
    const { data } = await callTask('social_profiles', `Find the official social media profile URLs for the business at ${websiteUrl}.`);
    return data;
  } catch (error) {
    console.error('Failed to detect social profiles:', error);
    throw error;
  }
}

async function analyzeSocialMedia(profileUrl: string) {
  if (await isDemoMode()) {
    return {
      brandVoice: {
        tone: 'professional',
        personality: 'friendly',
        messaging: ['consistent', 'engaging', 'informative']
      },
      audience: {
        demographics: ['25-45', 'urban', 'professionals'],
        interests: ['technology', 'innovation', 'business'],
        behavior: ['highly engaged', 'tech-savvy']
      },
      contentStrategy: {
        types: ['educational', 'promotional', 'behind-the-scenes'],
        frequency: 'consistent',
        engagement: 'above average'
      },
      recommendations: [
        'Increase video content',
        'Engage more with comments',
        'Share more user testimonials'
      ]
    };
  }

  try {
    return (await callTask('social_profile_insights', `Analyze this social media profile: ${profileUrl}`)).data;
  } catch (error) {
    console.error('Social media analysis failed:', error);
    throw error;
  }
}

async function generateBrandEvolution(currentBrand: string) {
  if (await isDemoMode()) {
    return {
      strategy: {
        core: ['Strengthen value proposition', 'Modernize brand voice'],
        digital: ['Optimize social presence', 'Enhance content strategy'],
        visual: ['Update design system', 'Refresh brand assets']
      },
      timeline: {
        immediate: ['Quick wins and adjustments'],
        shortTerm: ['Core improvements'],
        longTerm: ['Strategic evolution']
      },
      metrics: {
        brandRecognition: 'Expected +40%',
        engagement: 'Expected +65%',
        conversion: 'Expected +25%'
      }
    };
  }

  try {
    return (await callTask('brand_evolution', `Analyze this brand and provide evolution recommendations: ${currentBrand}`)).data;
  } catch (error) {
    console.error('Brand evolution generation failed:', error);
    throw error;
  }
}

async function generateBrandingConcepts(prompt: string) {
  if (await isDemoMode()) {
    return {
      brandEssence: {
        values: ['Innovation', 'Trust', 'Excellence'],
        mission: 'To transform industries through cutting-edge solutions',
        vision: 'Leading the future of technology innovation'
      },
      targetAudience: {
        primary: {
          demographics: ['30-50', 'decision-makers', 'urban'],
          needs: ['efficiency', 'reliability', 'innovation']
        },
        secondary: {
          demographics: ['25-35', 'tech-savvy', 'professionals'],
          needs: ['performance', 'support', 'value']
        }
      },
      brandVoice: {
        personality: 'Professional yet approachable',
        tone: 'Confident and knowledgeable',
        keyMessages: [
          'Industry expertise',
          'Innovative solutions',
          'Reliable partner'
        ]
      },
      testimonial: "Their innovative approach completely transformed our brand positioning."
    };
  }

  try {
    return (await callTask('branding_concepts', `Generate branding concepts for: ${prompt}`)).data;
  } catch (error) {
    console.error('Branding concepts generation failed:', error);
    throw error;
  }
}

async function analyzeMultimodal(content: {
  text?: string;
  voiceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  if (await isDemoMode()) {
    return {
      textAnalysis: {
        clarity: 0.8,
        effectiveness: 0.75,
        seoScore: 0.7
      },
      voiceAnalysis: {
        tone: 0.85,
        delivery: 0.8,
        quality: 0.9
      },
      visualAnalysis: {
        impact: 0.8,
        brandMatch: 0.85,
        quality: 0.9
      },
      synchronization: {
        timing: 0.9,
        coherence: 0.85,
        impact: 0.8
      },
      recommendations: [
        "Improve vocal pacing in key sections",
        "Enhance visual contrast for better impact",
        "Strengthen call to action messaging"
      ]
    };
  }

  try {
    // Images are sent as vision input; audio/video are referenced by URL in the prompt text.
    const imageUrls = isImageRef(content.imageUrl) ? [content.imageUrl] : undefined;
    return (await callTask('multimodal_analysis', `Analyze this content across multiple modalities: ${JSON.stringify(content)}`, { imageUrls })).data;
  } catch (error) {
    console.error('Multimodal analysis failed:', error);
    throw error;
  }
}

async function analyzeRealtime(content: {
  text?: string;
  audio?: Blob;
  image?: Blob;
  video?: Blob;
}) {
  if (await isDemoMode()) {
    return {
      visualAnalysis: {
        brandElements: ['Logo', 'Color scheme', 'Typography'],
        designConsistency: 0.85,
        visualHierarchy: 0.8,
        colorUsage: 0.9,
        typography: 0.85
      },
      audioAnalysis: {
        voiceTone: 'Professional',
        speechPatterns: ['Clear', 'Engaging', 'Natural'],
        audioQuality: 0.9,
        brandAlignment: 0.85,
        emotionalImpact: 0.8
      },
      metrics: {
        brandRecognition: 0.75,
        audienceEngagement: 0.8,
        marketPosition: 0.7,
        competitiveStrength: 0.65,
        growthPotential: 0.85
      },
      recommendations: [
        'Enhance visual consistency across platforms',
        'Optimize voice tone for target audience',
        'Strengthen market differentiation',
        'Increase brand recognition elements',
        'Expand audience engagement strategies'
      ]
    };
  }

  try {
    // Only the image blob is sent as vision input; audio/video blobs are not supported by this path.
    const image = content.image ? await blobToBase64(content.image) : null;
    const imageUrls = isImageRef(image) ? [image] : undefined;
    return (await callTask('realtime_analysis', `Analyze this content in real-time: ${content.text || ''}`, { imageUrls })).data;
  } catch (error) {
    console.error('Real-time analysis failed:', error);
    throw error;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Top brands for an industry, researched with live web search (citations are returned alongside). */
async function getTopBrandsInIndustry(industry: string) {
  if (await isDemoMode()) {
    return {
      industry,
      topBrands: [
        { name: 'IndustryLeader', marketShare: 25, strengths: ['Brand Recognition', 'Product Quality'] },
        { name: 'CompetitorA', marketShare: 18, strengths: ['Customer Service', 'Innovation'] },
        { name: 'CompetitorB', marketShare: 15, strengths: ['Pricing', 'Distribution'] },
        { name: 'CompetitorC', marketShare: 12, strengths: ['Digital Presence', 'Target Marketing'] },
        { name: 'CompetitorD', marketShare: 10, strengths: ['Sustainability', 'Product Range'] }
      ]
    };
  }

  try {
    const { data, citations } = await callTask('top_brands', `List the top 5 brands in the ${industry} industry, including their estimated market share and key strengths.`);
    return { ...data, citations };
  } catch (error) {
    console.error('Failed to get top brands:', error);
    // Fall back to demo data on error
    return {
      industry,
      topBrands: [
        { name: 'IndustryLeader', marketShare: 25, strengths: ['Brand Recognition', 'Product Quality'] },
        { name: 'CompetitorA', marketShare: 18, strengths: ['Customer Service', 'Innovation'] },
        { name: 'CompetitorB', marketShare: 15, strengths: ['Pricing', 'Distribution'] },
        { name: 'CompetitorC', marketShare: 12, strengths: ['Digital Presence', 'Target Marketing'] },
        { name: 'CompetitorD', marketShare: 10, strengths: ['Sustainability', 'Product Range'] }
      ]
    };
  }
}

async function performEnhancedAnalysis(text: string) {
  if (await isDemoMode()) {
    return {
      enhancedContent: text + "\n\nThis content has been optimized for clarity, impact, and brand alignment.",
      improvements: [
        { type: 'clarity', description: 'Simplified complex sentences' },
        { type: 'engagement', description: 'Added stronger emotional hooks' },
        { type: 'structure', description: 'Improved paragraph organization' }
      ],
      metrics: {
        readability: 85,
        engagement: 90,
        brandAlignment: 95
      },
      recommendations: [
        'Consider adding customer testimonials',
        'Include more industry-specific terminology',
        'Emphasize value proposition more clearly'
      ]
    };
  }

  try {
    return (await callTask('enhanced_text_analysis', `Analyze and enhance this text content for improved clarity, engagement, and brand impact:\n\n${text}\n\nProvide the enhanced content, specific improvements made, metrics, and additional recommendations.`)).data;
  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    return {
      enhancedContent: text,
      improvements: [],
      metrics: {
        readability: 75,
        engagement: 75,
        brandAlignment: 75
      },
      recommendations: ['Try again with a more specific prompt']
    };
  }
}

export {
  detectSocialProfiles,
  analyzeSocialMedia,
  generateBrandEvolution,
  generateBrandingConcepts,
  analyzeMultimodal,
  analyzeRealtime,
  getTopBrandsInIndustry,
  performEnhancedAnalysis
};
