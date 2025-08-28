import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, X-Client-Info"
};

interface RealTimeMetrics {
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

// Simulated real-time data generator
function generateRealtimeData(): RealTimeMetrics {
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
        type: 'opportunity',
        title: 'Traffic Spike Opportunity',
        description: 'Organic traffic increased 23% this week',
        impact: 'high',
        actionRequired: 'Optimize for trending keywords',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'alert-2',
        type: 'warning',
        title: 'High Bounce Rate',
        description: 'Landing page bounce rate above 60%',
        impact: 'medium',
        actionRequired: 'Review and optimize landing page content',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ].filter(() => Math.random() > 0.7), // Randomly include alerts
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

    switch (endpoint) {
      case 'live':
        // Return real-time metrics
        const liveData = generateRealtimeData();
        return new Response(
          JSON.stringify(liveData),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );

      case 'stream':
        // Server-sent events for real-time streaming
        const stream = new ReadableStream({
          start(controller) {
            const interval = setInterval(() => {
              const data = generateRealtimeData();
              const message = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(new TextEncoder().encode(message));
            }, 5000); // Update every 5 seconds

            // Clean up interval when stream is cancelled
            req.signal.addEventListener('abort', () => {
              clearInterval(interval);
            });
          }
        });

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });

      case 'alerts':
        // Return only alerts
        const alertsData = generateRealtimeData();
        return new Response(
          JSON.stringify({
            alerts: alertsData.alerts,
            timestamp: alertsData.timestamp
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );

      case 'predictions':
        // Return only predictions
        const predictionsData = generateRealtimeData();
        return new Response(
          JSON.stringify({
            predictions: predictionsData.predictions,
            timestamp: predictionsData.timestamp
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );

      default:
        throw new Error('Invalid endpoint');
    }
  } catch (error) {
    console.error('Real-time analytics error:', error);

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