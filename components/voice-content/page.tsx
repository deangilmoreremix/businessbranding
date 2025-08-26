'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Headphones, 
  ArrowRight, 
  CheckCircle, 
  Music, 
  BookOpen, 
  MessageSquare,
  Mic,
  FileAudio,
  Download,
  Sparkles,
  BrainCircuit,
  Palette
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceInterface } from '@/components/voice-interface';

export default function VoiceContentPage() {
  const voiceFeatures = [
    'Text-to-speech generation',
    'Multiple voice options',
    'Podcast creation',
    'Audiobook narration',
    'Audio transcription',
    'Custom voice profile creation'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-2"
          >
            <Badge className="text-sm px-3 pulsing-border">VOICE CONTENT</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Create AI-Powered Voice Content
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Generate professional voiceovers, podcasts, and audiobooks with natural-sounding AI voices.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-6 bg-blue-500/5 border-blue-500/20 relative overflow-hidden group">
              <div className="shimmer absolute inset-0 opacity-0 group-hover:opacity-100"></div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold">Professional Voice Content</h3>
                <p className="text-muted-foreground">
                  Create high-quality voice content for your brand with our advanced AI text-to-speech technology.
                </p>
                <ul className="space-y-2">
                  {voiceFeatures.slice(0, 4).map((feature, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-6 bg-purple-500/5 border-purple-500/20 relative overflow-hidden group">
              <div className="shimmer absolute inset-0 opacity-0 group-hover:opacity-100"></div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Audio Suite</h3>
                <p className="text-muted-foreground">
                  A comprehensive suite of audio tools for creating, editing, and managing voice content.
                </p>
                <ul className="space-y-2">
                  {['Multiple voice options', 'Transcription services', 'Content storage library', 'Voice customization'].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-8 mb-16">
          <div className="text-center space-y-4">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold gradient-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Create Any Voice Content
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              From simple voiceovers to complex multi-voice podcasts
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Voice Overs",
                description: "Create professional voice overs for videos, presentations, and other content.",
                color: "blue",
                delay: 0.2
              },
              {
                icon: Music,
                title: "Podcasts",
                description: "Generate multi-voice podcasts with realistic conversations and transitions.",
                color: "purple",
                delay: 0.3
              },
              {
                icon: BookOpen,
                title: "Audiobooks",
                description: "Turn your written content into engaging audiobooks with natural narration.",
                color: "indigo",
                delay: 0.4
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: item.delay }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className={`p-6 bg-accent/5 border-accent/20 relative overflow-hidden`}>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="space-y-3">
                    <motion.div 
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, 5, -5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <item.icon className={`h-8 w-8 text-${item.color}-400`} />
                    </motion.div>
                    <h3 className="text-lg font-semibold glowing-text">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
        
        <VoiceInterface />

        <div className="text-center mt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <Badge className="text-sm px-3 pulsing-border">NEXT STEPS</Badge>
          </motion.div>
          <motion.h2 
            className="text-2xl md:text-3xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Complete Your Brand Identity
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            After creating your voice content, explore our other tools to build your complete brand.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BrainCircuit,
                title: "Brand Analysis",
                description: "Get a comprehensive analysis of your brand strategy.",
                href: "/?section=brand-analysis",
                color: "indigo",
                delay: 0.3
              },
              {
                icon: Palette,
                title: "Visual Identity",
                description: "Create logos, color schemes, and visual assets for your brand.",
                href: "/visual-identity",
                color: "purple",
                delay: 0.4
              },
              {
                icon: Sparkles,
                title: "Content Dashboard",
                description: "Manage and organize all your brand assets in one place.",
                href: "/dashboard",
                color: "green",
                delay: 0.5
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ y: -5 }}
              >
                <Link href={item.href}>
                  <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full relative overflow-hidden group">
                    <div className="shimmer absolute inset-0 opacity-0 group-hover:opacity-100"></div>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <motion.div 
                        className={`h-12 w-12 rounded-full bg-${item.color}-500/20 flex items-center justify-center`}
                        whileHover={{ 
                          scale: 1.1,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <item.icon className={`h-6 w-6 text-${item.color}-400`} />
                      </motion.div>
                      <h3 className="text-lg font-semibold glowing-text">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <Button variant="link" className="mt-2 group">
                        Explore
                        <motion.div
                          className="inline-block ml-2"
                          whileHover={{ x: 3 }}
                        >
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </motion.div>
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}