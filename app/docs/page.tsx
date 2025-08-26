'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  MessageSquare, 
  Code, 
  FileText, 
  ArrowRight,
  Palette,
  LayoutDashboard,
  Users,
  BarChart,
  Globe,
  FileAudio,
  Image as ImageIcon,
  Layers,
  Settings,
  Target,
  Star,
  Wand2
} from 'lucide-react';

const components = [
  {
    name: 'Brand Analysis',
    description: 'AI-powered brand strategy analysis component',
    icon: Brain,
    href: '/docs/components/brand-analysis'
  },
  {
    name: 'Visual Identity',
    description: 'Visual brand identity analysis and generation',
    icon: Palette,
    href: '/docs/components/visual-identity'
  },
  {
    name: 'Voice Interface',
    description: 'Voice content generation and management',
    icon: MessageSquare,
    href: '/docs/components/voice-interface'
  },
  {
    name: 'Content Dashboard',
    description: 'Asset and content management dashboard',
    icon: LayoutDashboard,
    href: '/docs/components/content-dashboard'
  },
  {
    name: 'Business Analyzer',
    description: 'Business and website analysis tools',
    icon: BarChart,
    href: '/docs/components/business-analyzer'
  },
  {
    name: 'Competitive Analysis',
    description: 'Market and competitor analysis tools',
    icon: Target,
    href: '/docs/components/competitive-analysis'
  },
  {
    name: 'Brand Pillar Breakdown',
    description: 'Brand strategy pillar analysis',
    icon: Layers,
    href: '/docs/components/brand-pillar-breakdown'
  },
  {
    name: 'Export Dialog',
    description: 'Export and download functionality',
    icon: FileText,
    href: '/docs/components/export-dialog'
  },
  {
    name: 'Feature Discovery',
    description: 'Interactive feature tour system',
    icon: Globe,
    href: '/docs/components/feature-discovery'
  },
  {
    name: 'Implementation Plan',
    description: 'Brand implementation planning',
    icon: Settings,
    href: '/docs/components/implementation-plan'
  }
];

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Components</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Documentation for all components in AI Brand Creator
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {components.map((component, index) => (
          <Link key={component.name} href={component.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <component.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{component.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {component.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-accent/5 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="text-muted-foreground mb-6">
          Can&apos;t find what you&apos;re looking for? Get in touch with our support team.
        </p>
        <div className="flex gap-4">
          <Button>
            Contact Support
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">
            Join Discord
          </Button>
        </div>
      </div>
    </div>
  );
}