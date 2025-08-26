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
import { DocumentationLinks } from '@/components/documentation-links';

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
          <div className="inline-block mb-2">
            <Badge className="text-sm px-3">VOICE CONTENT</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Create AI-Powered Voice Content
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate professional voiceovers, podcasts, and audiobooks with natural-sounding AI voices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 bg-blue-500/5 border-blue-500/20">
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
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="p-6 bg-purple-500/5 border-purple-500/20">
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
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <VoiceInterface />

        <DocumentationLinks component="voice-content" />
      </div>
    </div>
  );
}