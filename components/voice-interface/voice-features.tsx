'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Headphones, 
  Music, 
  BookOpen, 
  MessageSquare,
  Mic,
  FileAudio,
  Brain,
  Wand2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export function VoiceFeatures() {
  const features = [
    {
      title: 'Voice Generation',
      description: 'Create natural-sounding voice content',
      icon: Headphones,
      items: [
        'Multiple voice options',
        'Emotional expression control',
        'Custom voice profiles',
        'Real-time preview'
      ]
    },
    {
      title: 'Podcast Creation',
      description: 'Generate engaging podcast content',
      icon: Music,
      items: [
        'Multi-voice conversations',
        'Background music integration',
        'Sound effects library',
        'Episode structuring'
      ]
    },
    {
      title: 'Audiobook Narration',
      description: 'Convert text to professional audiobooks',
      icon: BookOpen,
      items: [
        'Chapter organization',
        'Character voice variation',
        'Pacing control',
        'Export options'
      ]
    },
    {
      title: 'Voice Analysis',
      description: 'Analyze and optimize voice content',
      icon: Brain,
      items: [
        'Tone analysis',
        'Sentiment detection',
        'Cultural sensitivity check',
        'Audience alignment'
      ]
    },
    {
      title: 'Voice Enhancement',
      description: 'Improve voice quality and clarity',
      icon: Wand2,
      items: [
        'Noise reduction',
        'Clarity enhancement',
        'Volume normalization',
        'Echo cancellation'
      ]
    },
    {
      title: 'Content Optimization',
      description: 'Optimize content for voice delivery',
      icon: Sparkles,
      items: [
        'Script optimization',
        'Pacing suggestions',
        'Emphasis guidance',
        'Performance tips'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="ghost" className="w-full group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="text-center">
          <Badge className="mb-4">PRO FEATURES</Badge>
          <h3 className="text-2xl font-bold mb-4">Unlock Advanced Capabilities</h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Access professional voice generation features and advanced analytics
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
            Upgrade to Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}