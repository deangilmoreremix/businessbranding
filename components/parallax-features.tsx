'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, CheckCircle, Headphones, Layers, Palette, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Landing-page feature tour. Everything here describes what the app actually does; there are no statistics, testimonials or
 * third-party citations (the earlier version invented them).
 */
interface Feature { title: string; icon: LucideIcon; color: string; description: string; details: string[]; href: string; cta: string }

const features: Feature[] = [
  {
    title: 'Brand analysis across 20 pillars',
    icon: Brain,
    color: 'indigo',
    description: 'Describe your business or paste your website and get a structured analysis: brand pillars, market view, competitors and recommendations.',
    details: ['20-pillar brand assessment from your own description', 'Competitor view with optional web-search research', 'Implementation plan with a calendar you can export (.ics)', 'Runs on your own OpenAI key'],
    href: '/brand-strategy',
    cta: 'Open brand strategy'
  },
  {
    title: 'Visual identity studio',
    icon: Palette,
    color: 'purple',
    description: 'Generate images with the OpenAI Images API, then refine them on your device.',
    details: ['AI image generation and variations', 'Layer editor: text, shapes, crop and background removal', 'PNG exports, brand-kit sheets and GIF previews', 'Local asset library stored in your browser'],
    href: '/dashboard/visual-identity',
    cta: 'Open visual studio'
  },
  {
    title: 'Voice content',
    icon: Headphones,
    color: 'blue',
    description: 'Turn text into narration and transcribe recordings, with captions you can download.',
    details: ['Text to speech with OpenAI voices', 'Podcast and audiobook builders', 'Transcription with gpt-transcribe', 'Waveform trimming and .vtt / .srt captions'],
    href: '/dashboard/voice-content',
    cta: 'Open voice studio'
  },
  {
    title: 'Workflows and planning',
    icon: Layers,
    color: 'green',
    description: 'Chain a brief into copy, an email template and a voice-over, and plan the rollout.',
    details: ['Visual workflow builder that saves in your browser', 'Branded email templates', 'Planning page that turns a plan into calendar events', 'JSON export and import of your workflows'],
    href: '/workflows',
    cta: 'Open workflows'
  }
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const left = index % 2 === 0;
  return (
    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
      <div className={left ? 'md:order-1' : 'md:order-2'}>
        <div className="space-y-6">
          <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/20 flex items-center justify-center`}>
            <feature.icon className={`h-7 w-7 text-${feature.color}-400`} aria-hidden />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-bold">{feature.title}</h3>
            <p className="text-xl text-muted-foreground">{feature.description}</p>
          </div>
          <ul className="space-y-3">
            {feature.details.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" aria-hidden />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          <Link href={feature.href}>
            <Button className="mt-2">{feature.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
      <div className={left ? 'md:order-2' : 'md:order-1'}>
        <Card className={`p-6 rounded-2xl border border-${feature.color}-500/20 bg-${feature.color}-500/5`}>
          <motion.div className="h-[260px] w-full flex items-center justify-center" animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} aria-hidden>
            <feature.icon className={`h-28 w-28 text-${feature.color}-400/70`} />
          </motion.div>
        </Card>
      </div>
    </motion.div>
  );
}

export function ParallaxFeatures() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 space-y-4">
          <Badge className="text-sm px-3">FEATURES</Badge>
          <h2 className="text-4xl md:text-5xl font-bold gradient-text">Everything for your brand, in one place</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Analysis, visual identity, voice and planning tools that work together. You bring your own OpenAI key; there is nothing else to pay for here.</p>
        </div>
        <div className="space-y-24">
          {features.map((feature, index) => (
            <FeatureRow key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ParallaxFeatures;
