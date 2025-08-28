import { API_KEYS } from '../api-config';

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || API_KEYS.GEMINI === 'demo-mode';

interface SocialMediaAnalysis {
  profile: {
    platform: string;
    handle: string;
    url: string;
    followers?: number;
    following?: number;
    posts?: number;
    bio?: string;
    verified?: boolean;
  };
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

export async function analyzeSocialProfile(
  profileUrl: string,
  platform?: string,
  handle?: string
): Promise<SocialMediaAnalysis> {
  if (isDemoMode) {
    console.log('Running social media analysis in demo mode');
    return {
      profile: {
        platform: platform || 'twitter',
        handle: handle || 'demo_brand',
        url: profileUrl || `https://${platform || 'twitter'}.com/demo_brand`,
        followers: 15420,
        following: 892,
        posts: 1247,
        bio: 'Demo brand for showcasing social media analysis capabilities',
        verified: true
      },
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
      ]
    };
  }

  try {
    console.log('Analyzing social media profile:', profileUrl);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/social-media-analyzer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profileUrl, platform, handle })
    });

    if (!response.ok) {
      throw new Error(`Social media analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Social media analysis completed successfully');
    return data;
  } catch (error) {
    console.error('Social media analysis error:', error);
    throw error;
  }
}

export async function getSocialMediaInsights(platform: string, handle: string): Promise<{
  followers: number;
  engagement: number;
  posts: number;
  growth: number;
}> {
  if (isDemoMode) {
    return {
      followers: 15420 + Math.floor(Math.random() * 2000),
      engagement: 3.2 + Math.random() * 1.5,
      posts: 1247 + Math.floor(Math.random() * 100),
      growth: 8.5 + Math.random() * 5.0
    };
  }

  try {
    const profileUrl = `https://${platform}.com/${handle}`;
    const analysis = await analyzeSocialProfile(profileUrl, platform, handle);

    return {
      followers: analysis.profile.followers || 0,
      engagement: analysis.engagement.rate,
      posts: analysis.profile.posts || 0,
      growth: analysis.engagement.trend === 'up' ? 8.5 : analysis.engagement.trend === 'down' ? -2.3 : 1.2
    };
  } catch (error) {
    console.error('Failed to get social media insights:', error);
    throw error;
  }
}