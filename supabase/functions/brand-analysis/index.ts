import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { getEdgeSecret } from '../../lib/edge-secrets.ts';

const GEMINI_API_KEY = getEdgeSecret('GEMINI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

const BRAND_ANALYSIS_PROMPT = `Analyze this business concept and provide a comprehensive brand analysis:

Business Description: {businessDescription}

Provide analysis in the following format:
1. Brand Health Score (0-100)
2. Market Fit (0-1)
3. Uniqueness Score (0-1)
4. Brand Factors (array of factors with name, score, and insights)
5. Competitor Analysis
6. Strategic Recommendations

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
    // Return demo response if in demo mode
    if (GEMINI_API_KEY === 'demo-mode') {
      return new Response(
        JSON.stringify({
          healthScore: 85,
          marketFit: 0.78,
          uniquenessScore: 0.82,
          brandFactors: [
            {
              name: 'Brand Purpose & Mission',
              score: 0.85,
              insights: [
                'Clear mission statement that resonates with target audience',
                'Strong alignment with market needs'
              ]
            },
            {
              name: 'Visual Identity',
              score: 0.75,
              insights: [
                'Professional and modern design elements',
                'Could benefit from more distinctive visual assets'
              ]
            },
            {
              name: 'Market Position',
              score: 0.82,
              insights: [
                'Well-defined target market segments',
                'Strong competitive differentiation'
              ]
            }
          ],
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
          ],
          demo: true
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { businessDescription } = await req.json();

    if (!businessDescription) {
      throw new Error('Business description is required');
    }

    console.log('Starting brand analysis for:', businessDescription);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      temperature: 0.9,
      topK: 40,
      topP: 0.95
    });

    const prompt = BRAND_ANALYSIS_PROMPT.replace('{businessDescription}', businessDescription);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    try {
      const analysis = JSON.parse(analysisText);
      console.log('Analysis completed successfully:', analysis);
      return new Response(
        JSON.stringify(analysis),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      throw new Error('Failed to parse analysis result');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        demo: GEMINI_API_KEY === 'demo-mode'
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