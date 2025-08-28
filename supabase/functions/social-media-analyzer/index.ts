import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "npm:@google/generative-ai";
import { getEdgeSecret } from '../../lib/edge-secrets.ts';

const GEMINI_API_KEY = getEdgeSecret('GEMINI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

interface SocialMediaProfile {
  platform: string;
  handle: string;
  url: string;
  followers?: number;
  following?: number;
  posts?: number;
  bio?: string;
  verified?: boolean;
}

interface SocialMediaAnalysis {
  profile: SocialMediaProfile;
  engagement: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
    benchmark: number;
    breakdown: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    };
  };
  content: {
    quality: number;
    consistency: number;
    themes: string[];
    topPosts: Array<{
      id: string;
      content: string;
      engagement: number;
      date: string;
    }>;
  };
  audience: {
    demographics: {
      age: string[];
      gender: string[];
      location: string[];
      interests: string[];
    };
    behavior: {
      activeHours: string[];
      engagementPatterns: string[];
      contentPreferences: string[];
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  competitors: Array<{
    handle: string;
    followers: number;
    engagement: number;
    similarity: number;
  }>;
}

const SOCIAL_MEDIA_ANALYSIS_PROMPT = `Analyze this social media profile and provide comprehensive insights:

Profile: {profileData}

Please provide analysis in the following format:
1. Engagement Rate (0-100) with trend and benchmark
2. Content Quality Score (0-100) and top themes
3. Audience Demographics and behavior patterns
4. Strategic recommendations with priorities
5. Top 5 similar competitor profiles

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
    const { profileUrl, platform, handle } = await req.json();

    if (!profileUrl && !handle) {
      throw new Error('Either profile URL or handle is required');
    }

    // Return demo data if API key is missing
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo-mode') {
      const demoProfile: SocialMediaProfile = {
        platform: platform || 'twitter',
        handle: handle || 'demo_brand',
        url: profileUrl || `https://${platform || 'twitter'}.com/demo_brand`,
        followers: 15420,
        following: 892,
        posts: 1247,
        bio: 'Demo brand for showcasing social media analysis capabilities',
        verified: true
      };

      return new Response(
        JSON.stringify({
          profile: demoProfile,
          engagement: {
            rate: 3.2,
            trend: 'up',
            benchmark: 2.8,
            breakdown: {
              likes: 245,
              comments: 89,
              shares: 156,
              saves: 67
            }
          },
          content: {
            quality: 78,
            consistency: 82,
            themes: ['Technology', 'Innovation', 'Business Growth', 'Digital Marketing'],
            topPosts: [
              {
                id: '1',
                content: 'Excited to announce our new AI-powered analytics platform! 🚀',
                engagement: 1250,
                date: '2024-01-15'
              },
              {
                id: '2',
                content: '5 ways to boost your social media engagement in 2024 📈',
                engagement: 890,
                date: '2024-01-10'
              }
            ]
          },
          audience: {
            demographics: {
              age: ['25-34', '35-44'],
              gender: ['Male: 55%', 'Female: 45%'],
              location: ['United States', 'United Kingdom', 'Canada'],
              interests: ['Technology', 'Business', 'Marketing', 'Entrepreneurship']
            },
            behavior: {
              activeHours: ['9-11 AM', '1-3 PM', '7-9 PM'],
              engagementPatterns: ['Educational content', 'Industry insights', 'Product updates'],
              contentPreferences: ['Thread posts', 'Infographics', 'Video content']
            }
          },
          recommendations: [
            {
              priority: 'high',
              category: 'Content Strategy',
              recommendation: 'Increase video content frequency by 40%',
              impact: 'high'
            },
            {
              priority: 'medium',
              category: 'Engagement',
              recommendation: 'Implement a 24-hour response time for comments',
              impact: 'medium'
            },
            {
              priority: 'high',
              category: 'Audience Growth',
              recommendation: 'Launch targeted advertising campaigns in tech industry segments',
              impact: 'high'
            }
          ],
          competitors: [
            { handle: '@tech_innovator', followers: 45200, engagement: 4.1, similarity: 0.85 },
            { handle: '@digital_growth', followers: 32100, engagement: 3.8, similarity: 0.78 },
            { handle: '@brand_builder', followers: 28900, engagement: 3.5, similarity: 0.72 },
            { handle: '@marketing_pro', followers: 25600, engagement: 3.2, similarity: 0.68 },
            { handle: '@business_hack', followers: 19800, engagement: 2.9, similarity: 0.65 }
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

    console.log('Starting social media analysis for:', profileUrl || handle);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      safetySettings: [
        {
          category: HarmCategory.HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
      ]
    });

    const profileData = {
      url: profileUrl,
      platform: platform,
      handle: handle
    };

    const prompt = SOCIAL_MEDIA_ANALYSIS_PROMPT.replace('{profileData}', JSON.stringify(profileData));

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    try {
      const analysisJson = JSON.parse(analysisText);
      console.log('Social media analysis completed successfully');

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
      console.error('Failed to parse social media analysis result:', parseError);
      throw new Error('Invalid analysis format returned');
    }
  } catch (error) {
    console.error('Social media analysis error:', error);

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