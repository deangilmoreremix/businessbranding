import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || 'AIzaSyBZ5NQ3dF5sdMBSjfkD6Oejw9VRhPTSUdc';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { content, type } = await req.json();

    // Return dummy data if no API key or in demo mode
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-mode') {
      const demoAnalysis = getDemoAnalysis(type);
      return new Response(
        JSON.stringify(demoAnalysis),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: type === 'visual' ? 'gemini-pro-vision' : 'gemini-pro'
    });

    let prompt = '';
    switch (type) {
      case 'brand':
        prompt = `Analyze this brand strategy and provide insights:
          ${content}
          
          Include:
          1. Brand health score (0-100)
          2. Market fit analysis
          3. Competitive positioning
          4. Growth opportunities
          5. Specific recommendations`;
        break;
      case 'visual':
        prompt = `Analyze these visual brand elements:
          ${content}
          
          Include:
          1. Color harmony analysis
          2. Typography evaluation
          3. Layout assessment
          4. Brand consistency score
          5. Visual impact recommendations`;
        break;
      case 'voice':
        prompt = `Analyze this voice content:
          ${content}
          
          Include:
          1. Tone analysis
          2. Emotional resonance
          3. Brand alignment
          4. Audience fit
          5. Enhancement suggestions`;
        break;
      default:
        prompt = content;
    }

    console.log('Processing prompt:', prompt.substring(0, 100) + '...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini Response:', text.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ text }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        demo: true
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

// Helper function to provide demo analysis data
function getDemoAnalysis(type: string) {
  const demoResponses = {
    brand: {
      text: `{
        "brandHealth": 78,
        "marketFit": 0.82,
        "competitivePosition": {
          "strengths": ["Innovative messaging", "Unique value proposition"],
          "weaknesses": ["Brand consistency", "Market recognition"]
        },
        "growthOpportunities": [
          "Expand digital presence",
          "Strengthen visual identity",
          "Improve content strategy"
        ],
        "recommendations": [
          "Implement consistent visual language across all channels",
          "Develop more distinctive brand voice",
          "Invest in targeted marketing campaigns"
        ]
      }`
    },
    visual: {
      text: `{
        "colorAnalysis": {
          "harmony": 0.75,
          "palette": ["#3B82F6", "#6366F1", "#8B5CF6"],
          "recommendations": ["Add secondary colors", "Increase contrast"]
        },
        "typography": {
          "effectiveness": 0.82,
          "fonts": ["Inter", "System UI"],
          "recommendations": ["Add display font", "Improve hierarchy"]
        },
        "layoutAssessment": {
          "score": 0.79,
          "strengths": ["Clean design", "Good whitespace"],
          "improvements": ["Enhance visual hierarchy", "Add more breathing room"]
        },
        "brandConsistency": 0.68,
        "recommendations": [
          "Create a comprehensive style guide",
          "Apply consistent visual elements",
          "Refine color usage across platforms"
        ]
      }`
    },
    voice: {
      text: `{
        "toneAnalysis": {
          "formal": 0.7,
          "casual": 0.3,
          "professional": 0.85,
          "friendly": 0.65
        },
        "emotionalResonance": {
          "primary": "trust",
          "secondary": ["confidence", "reliability"],
          "intensity": 0.75
        },
        "brandAlignment": 0.82,
        "audienceFit": {
          "score": 0.78,
          "targetGroups": ["professionals", "decision-makers"]
        },
        "suggestions": [
          "Increase clarity in technical sections",
          "Add more emotional connection points",
          "Maintain professional tone while adding warmth",
          "Include industry-specific terminology"
        ]
      }`
    }
  };

  return { text: demoResponses[type]?.text || "{}" };
}