import { API_KEYS } from '../api-config';

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || API_KEYS.GEMINI === 'demo-mode';

export interface RealTimeMetrics {
  timestamp: string;
  brandHealth: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    factors: {
      awareness: number;
      perception: number;
      loyalty: number;
      advocacy: number;
    };
  };
  digitalPresence: {
    websiteTraffic: {
      visitors: number;
      pageViews: number;
      bounceRate: number;
      avgSessionDuration: number;
    };
    socialMedia: {
      followers: number;
      engagement: number;
      posts: number;
      reach: number;
    };
    seoPerformance: {
      organicTraffic: number;
      keywordRankings: number;
      backlinks: number;
      domainAuthority: number;
    };
  };
  customerMetrics: {
    acquisition: {
      newCustomers: number;
      costPerAcquisition: number;
      conversionRate: number;
      churnRate: number;
    };
    engagement: {
      activeUsers: number;
      sessionDuration: number;
      featureUsage: number;
      satisfactionScore: number;
    };
    revenue: {
      monthlyRecurringRevenue: number;
      averageRevenuePerUser: number;
      growthRate: number;
      churnRevenueImpact: number;
    };
  };
  competitivePosition: {
    marketShare: number;
    rank: number;
    competitorGap: number;
    trend: 'gaining' | 'losing' | 'stable';
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'critical' | 'opportunity';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionRequired: string;
    timestamp: string;
  }>;
  predictions: {
    nextWeek: {
      traffic: number;
      revenue: number;
      customers: number;
    };
    nextMonth: {
      traffic: number;
      revenue: number;
      customers: number;
    };
    confidence: number;
  };
}

export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
  if (isDemoMode) {
    console.log('Running real-time analytics in demo mode');
    const now = new Date();
    const baseTraffic = 1250 + Math.random() * 500;
    const baseRevenue = 45000 + Math.random() * 15000;

    return {
      timestamp: now.toISOString(),
      brandHealth: {
        score: 78 + Math.random() * 12,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
        change: (Math.random() - 0.5) * 4,
        factors: {
          awareness: 82 + Math.random() * 10,
          perception: 75 + Math.random() * 15,
          loyalty: 85 + Math.random() * 8,
          advocacy: 72 + Math.random() * 12
        }
      },
      digitalPresence: {
        websiteTraffic: {
          visitors: Math.floor(baseTraffic),
          pageViews: Math.floor(baseTraffic * 2.3),
          bounceRate: 45 + Math.random() * 20,
          avgSessionDuration: 180 + Math.random() * 120
        },
        socialMedia: {
          followers: 12500 + Math.floor(Math.random() * 2000),
          engagement: 3.2 + Math.random() * 2.5,
          posts: 45 + Math.floor(Math.random() * 20),
          reach: 89000 + Math.floor(Math.random() * 30000)
        },
        seoPerformance: {
          organicTraffic: Math.floor(baseTraffic * 0.7),
          keywordRankings: 25 + Math.floor(Math.random() * 15),
          backlinks: 1200 + Math.floor(Math.random() * 500),
          domainAuthority: 65 + Math.random() * 15
        }
      },
      customerMetrics: {
        acquisition: {
          newCustomers: 45 + Math.floor(Math.random() * 30),
          costPerAcquisition: 85 + Math.random() * 40,
          conversionRate: 2.8 + Math.random() * 1.5,
          churnRate: 3.2 + Math.random() * 2.0
        },
        engagement: {
          activeUsers: 890 + Math.floor(Math.random() * 200),
          sessionDuration: 420 + Math.random() * 180,
          featureUsage: 68 + Math.random() * 20,
          satisfactionScore: 4.2 + Math.random() * 0.8
        },
        revenue: {
          monthlyRecurringRevenue: Math.floor(baseRevenue),
          averageRevenuePerUser: 125 + Math.random() * 50,
          growthRate: 8.5 + Math.random() * 8.0,
          churnRevenueImpact: 1200 + Math.random() * 800
        }
      },
      competitivePosition: {
        marketShare: 12.5 + Math.random() * 5.0,
        rank: 8 + Math.floor(Math.random() * 7),
        competitorGap: -2.3 + Math.random() * 4.6,
        trend: Math.random() > 0.5 ? 'gaining' : Math.random() > 0.25 ? 'stable' : 'losing'
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'opportunity' as const,
          title: 'Traffic Spike Opportunity',
          description: 'Organic traffic increased 23% this week',
          impact: 'high' as const,
          actionRequired: 'Optimize for trending keywords',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'alert-2',
          type: 'warning' as const,
          title: 'High Bounce Rate',
          description: 'Landing page bounce rate above 60%',
          impact: 'medium' as const,
          actionRequired: 'Review and optimize landing page content',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ].filter(() => Math.random() > 0.7),
      predictions: {
        nextWeek: {
          traffic: Math.floor(baseTraffic * 1.15),
          revenue: Math.floor(baseRevenue * 1.08),
          customers: 52 + Math.floor(Math.random() * 20)
        },
        nextMonth: {
          traffic: Math.floor(baseTraffic * 1.35),
          revenue: Math.floor(baseRevenue * 1.18),
          customers: 180 + Math.floor(Math.random() * 40)
        },
        confidence: 78 + Math.random() * 15
      }
    };
  }

  try {
    console.log('Fetching real-time analytics');
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/real-time-analytics/live`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Real-time analytics failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Real-time analytics fetched successfully');
    return data;
  } catch (error) {
    console.error('Real-time analytics error:', error);
    throw error;
  }
}

export async function getRealtimeAlerts(): Promise<{
  alerts: RealTimeMetrics['alerts'];
  timestamp: string;
}> {
  if (isDemoMode) {
    return {
      alerts: [
        {
          id: 'alert-1',
          type: 'opportunity' as const,
          title: 'Traffic Spike Opportunity',
          description: 'Organic traffic increased 23% this week',
          impact: 'high' as const,
          actionRequired: 'Optimize for trending keywords',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'alert-2',
          type: 'warning' as const,
          title: 'High Bounce Rate',
          description: 'Landing page bounce rate above 60%',
          impact: 'medium' as const,
          actionRequired: 'Review and optimize landing page content',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ].filter(() => Math.random() > 0.7),
      timestamp: new Date().toISOString()
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/real-time-analytics/alerts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Alerts fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    throw error;
  }
}

export async function getRealtimePredictions(): Promise<{
  predictions: RealTimeMetrics['predictions'];
  timestamp: string;
}> {
  if (isDemoMode) {
    const baseTraffic = 1250 + Math.random() * 500;
    const baseRevenue = 45000 + Math.random() * 15000;

    return {
      predictions: {
        nextWeek: {
          traffic: Math.floor(baseTraffic * 1.15),
          revenue: Math.floor(baseRevenue * 1.08),
          customers: 52 + Math.floor(Math.random() * 20)
        },
        nextMonth: {
          traffic: Math.floor(baseTraffic * 1.35),
          revenue: Math.floor(baseRevenue * 1.18),
          customers: 180 + Math.floor(Math.random() * 40)
        },
        confidence: 78 + Math.random() * 15
      },
      timestamp: new Date().toISOString()
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/real-time-analytics/predictions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Predictions fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch predictions:', error);
    throw error;
  }
}

export function subscribeToRealtimeUpdates(
  callback: (data: RealTimeMetrics) => void,
  onError?: (error: Error) => void
): () => void {
  if (isDemoMode) {
    // Simulate real-time updates in demo mode
    const interval = setInterval(async () => {
      try {
        const data = await getRealTimeMetrics();
        callback(data);
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  // For production, you would use Supabase real-time subscriptions
  // or Server-Sent Events from the edge function
  try {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/real-time-analytics/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        if (onError) {
          onError(new Error('Failed to parse real-time data'));
        }
      }
    };

    eventSource.onerror = (error) => {
      if (onError) {
        onError(new Error('Real-time connection failed'));
      }
    };

    return () => {
      eventSource.close();
    };
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error('Failed to establish real-time connection'));
    }
    return () => {};
  }
}