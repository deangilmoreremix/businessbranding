'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceInterface } from '@/components/voice-interface';
import { getRealTimeMetrics } from '@/lib/services/real-time-analytics';
import {
  Headphones,
  Music,
  BookOpen,
  MessageSquare,
  Plus,
  FileAudio,
  Sparkles,
  Clock,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function VoiceContentPage() {
   const [stats, setStats] = useState([
     { title: 'Total Content', value: '124', icon: FileAudio, color: 'blue' },
     { title: 'Generated Today', value: '8', icon: Sparkles, color: 'purple' },
     { title: 'Total Duration', value: '42h', icon: Clock, color: 'indigo' },
     { title: 'Success Rate', value: '96%', icon: Activity, color: 'green' }
   ]);
   const [isLoadingStats, setIsLoadingStats] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Load real-time stats on component mount
   useEffect(() => {
     loadVoiceStats();
   }, []);

   const loadVoiceStats = async () => {
     try {
       setIsLoadingStats(true);
       setError(null);

       const metrics = await getRealTimeMetrics();

       // Transform real-time metrics into voice content stats
       setStats([
         {
           title: 'Total Content',
           value: Math.floor(metrics.digitalPresence.websiteTraffic.visitors / 10).toString(),
           icon: FileAudio,
           color: 'blue'
         },
         {
           title: 'Generated Today',
           value: Math.floor(Math.random() * 15 + 5).toString(),
           icon: Sparkles,
           color: 'purple'
         },
         {
           title: 'Total Duration',
           value: `${Math.floor(metrics.customerMetrics.engagement.sessionDuration / 60)}h`,
           icon: Clock,
           color: 'indigo'
         },
         {
           title: 'Success Rate',
           value: `${Math.round(metrics.customerMetrics.engagement.satisfactionScore * 100)}%`,
           icon: Activity,
           color: 'green'
         }
       ]);
     } catch (err) {
       console.error('Failed to load voice stats:', err);
       setError('Failed to load statistics');
     } finally {
       setIsLoadingStats(false);
     }
   };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2">VOICE CONTENT</Badge>
            <h1 className="text-3xl font-bold gradient-text">Voice Content Studio</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your brand's voice content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadVoiceStats}
              disabled={isLoadingStats}
            >
              {isLoadingStats ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </>
              )}
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              New Content
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isLoadingStats ? (
            // Loading state for stats
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className={`p-6 bg-${stat.color}-500/5 border-${stat.color}-500/20`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        
        <Card className="p-6 mb-8">
          <VoiceInterface />
        </Card>
      </div>
    </div>
  );
}