import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "npm:@google/generative-ai";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || 'AIzaSyBZ5NQ3dF5sdMBSjfkD6Oejw9VRhPTSUdc';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

const BRAND_PILLARS = [
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

const ANALYSIS_PROMPT = `Analyze this business concept and provide a comprehensive brand analysis:

Business Description: {businessDescription}

Analyze across these 20 brand pillars:
${BRAND_PILLARS.join('\n')}

Provide analysis in the following format:
1. Brand Health Score (0-100)
2. Market Fit (0-1)
3. Uniqueness Score (0-1)
4. Last Updated timestamp
5. Monitoring Status (active/paused/error)
6. Growth Trajectory (current, projected, trend, timeframe)
7. Brand Factors (array with name, score, insights, priority, trend)
8. Performance Metrics (engagement, conversion, ROI, customer satisfaction, brand loyalty)
9. Market Analysis (industry trends, opportunities, barriers, segments, dynamics)
10. Competitors (with market position, growth rate, SWOT)
11. Implementation Status (completed, in progress, planned, progress percentage)
12. Best Practices (data collection, analysis review, optimization scores and recommendations)
13. Strategic Recommendations (with priority, category, impact, timeframe, resources)
14. Risk Factors (with probability, impact, mitigation)

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
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    // Handle GET requests for retrieving saved analyses
    if (req.method === 'GET') {
      if (endpoint === 'history') {
        const { data: analyses, error } = await supabase
          .from('brand_analyses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ analyses }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    const { businessIdea } = await req.json();

    if (!businessIdea) {
      throw new Error('Business idea is required');
    }

    // Return demo data if API key is missing
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-mode') {
      return new Response(
        JSON.stringify({
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

    console.log('Starting brand analysis for:', businessIdea);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
      ]
    });

    const prompt = ANALYSIS_PROMPT.replace('{businessDescription}', businessIdea);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    try {
      const analysisJson = JSON.parse(analysisText);
      console.log('Analysis completed successfully');

      // Save analysis to database
      try {
        const { data: savedAnalysis, error: dbError } = await supabase
          .from('brand_analyses')
          .insert({
            business_idea: businessIdea,
            health_score: analysisJson.healthScore || 0,
            market_fit: analysisJson.marketFit || 0,
            uniqueness_score: analysisJson.uniquenessScore || 0,
            analysis_data: analysisJson,
            competitors_data: analysisJson.competitors || {},
            recommendations: analysisJson.recommendations || []
          })
          .select()
          .single();

        if (dbError) {
          console.error('Failed to save analysis to database:', dbError);
          // Continue without failing the request
        } else {
          console.log('Analysis saved to database:', savedAnalysis?.id);
          analysisJson.id = savedAnalysis?.id;
        }
      } catch (dbSaveError) {
        console.error('Database save error:', dbSaveError);
        // Continue without failing the request
      }

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
      console.error('Failed to parse analysis result:', parseError);
      throw new Error('Invalid analysis format returned');
    }
  } catch (error) {
    console.error('Analysis error:', error);
    
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