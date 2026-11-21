'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FileText, Heart, MessageSquare, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Facts about the product only: no invented team, founding date, customer counts or satisfaction figures.
const principles: { title: string; icon: LucideIcon; description: string }[] = [
  { title: 'Your key, your data', icon: ShieldCheck, description: 'AI features use your own OpenAI API key, stored encrypted on the server. Your images, audio and drafts stay in your browser unless you save them to your account.' },
  { title: 'Honest results', icon: Sparkles, description: 'Numbers you see come from your analyses and saved items. When something was not measured, the app says so instead of filling in a figure.' },
  { title: 'Open formats', icon: FileText, description: 'Export PNG, GIF, calendar (.ics), captions (.vtt, .srt), HTML email and workflow JSON.' },
  { title: 'Learn as you go', icon: BookOpen, description: 'The documentation explains each feature and the API routes behind it.' },
  { title: 'Built for small teams', icon: Users, description: 'One workspace for brand analysis, visual identity, voice content and planning.' },
  { title: 'Made with care', icon: Heart, description: 'Accessible interface, keyboard-friendly controls and clear error messages.' }
];

const next = [
  { href: '/brand-strategy', title: 'Brand analysis', icon: Sparkles, text: 'Analyze your brand across 20 pillars.' },
  { href: '/dashboard/visual-identity', title: 'Visual identity', icon: FileText, text: 'Generate, edit and export brand visuals.' },
  { href: '/dashboard/voice-content', title: 'Voice content', icon: MessageSquare, text: 'Narration, podcasts, transcription and captions.' }
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="text-sm px-3 mb-2">ABOUT</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">About AI Brand Creator</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A workspace that helps you analyze a brand, build its visual identity and voice content, and plan the rollout, using AI that runs on your own OpenAI account.</p>
        </div>

        <div className="mb-24 max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground">
          <p>Creating a professional brand identity is usually expensive and slow. This app puts the common steps in one place: a structured analysis of your business, tools to create and edit visuals, narration and transcription, and a planner that turns a strategy into calendar events.</p>
          <p>It is deliberately simple about money: there are no plans or subscriptions. You pay OpenAI directly for what you use, through the key you add in Settings.</p>
        </div>

        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map((p, index) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * index }}>
                <Card className="p-6 h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4"><p.icon className="h-6 w-6 text-blue-400" aria-hidden /></div>
                    <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                    <p className="text-muted-foreground">{p.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-8">Start with</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {next.map((n) => (
              <Link key={n.href} href={n.href}>
                <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <n.icon className="h-8 w-8 text-purple-400" aria-hidden />
                    <h3 className="text-lg font-semibold">{n.title}</h3>
                    <p className="text-sm text-muted-foreground">{n.text}</p>
                    <span className="inline-flex items-center text-sm font-medium">Open<ArrowRight className="ml-2 h-4 w-4" /></span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
