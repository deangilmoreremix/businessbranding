'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceInterface } from '@/components/voice-interface';
import { SupabaseSetup } from '@/components/supabase-setup';
import { 
  Headphones, 
  Music, 
  BookOpen, 
  MessageSquare,
  Plus,
  FileAudio,
  Sparkles,
  Clock,
  Activity
} from 'lucide-react';

export default function VoiceContentPage() {
  const stats = [
    { title: 'Total Content', value: '124', icon: FileAudio, color: 'blue' },
    { title: 'Generated Today', value: '8', icon: Sparkles, color: 'purple' },
    { title: 'Total Duration', value: '42h', icon: Clock, color: 'indigo' },
    { title: 'Success Rate', value: '96%', icon: Activity, color: 'green' }
  ];

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
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
          ))}
        </div>

        <SupabaseSetup />
        
        <Card className="p-6 mb-8">
          <VoiceInterface />
        </Card>
      </div>
    </div>
  );
}