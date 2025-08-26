'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Brain, 
  Palette, 
  MessageSquare, 
  ArrowRight,
  BarChart,
  FileText,
  Users,
  Settings,
  Sparkles,
  Headphones,
  Globe,
  Target,
  Activity,
  BrainCircuit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  {
    title: 'Brand Analysis',
    description: 'Comprehensive 20-point brand analysis with competitive benchmarking',
    icon: BarChart,
    href: '/brand-strategy',
    color: 'blue'
  },
  {
    title: 'Visual Identity',
    description: 'Create professional logos, color schemes, and brand assets',
    icon: Palette,
    href: '/visual-identity',
    color: 'purple'
  },
  {
    title: 'Voice Content',
    description: 'Generate voiceovers, podcasts, and audiobooks with AI voices',
    icon: Headphones,
    href: '/voice-content',
    color: 'indigo'
  },
  {
    title: 'Content Management',
    description: 'Organize and manage all your brand assets in one place',
    icon: Settings,
    href: '/dashboard',
    color: 'green'
  },
  {
    title: 'Brand Strategy',
    description: 'Develop comprehensive brand strategy and positioning',
    icon: Target,
    href: '/brand-strategy',
    color: 'amber'
  },
  {
    title: 'Market Analysis',
    description: 'Analyze competitors and market positioning',
    icon: Activity,
    href: '/brand-strategy',
    color: 'rose'
  }
];

const tools = [
  {
    title: 'AI Assistant',
    description: 'Get instant help with branding questions',
    icon: Brain,
    href: '/docs',
    color: 'cyan'
  },
  {
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials',
    icon: FileText,
    href: '/docs',
    color: 'emerald'
  },
  {
    title: 'Case Studies',
    description: 'Real-world brand transformation stories',
    icon: Users,
    href: '/case-studies',
    color: 'violet'
  }
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-2"
          >
            <Badge className="text-sm px-3">FEATURES</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Complete Brand Creation Suite
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to create and manage your brand identity
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              whileHover={{ y: -5 }}
            >
              <Link href={feature.href}>
                <Card className={`p-6 bg-${feature.color}-500/5 border-${feature.color}-500/20 hover:bg-${feature.color}-500/10 transition-colors h-full relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="space-y-4">
                    <div className={`h-12 w-12 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center`}>
                      <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                    <Button variant="ghost" className="group">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Additional Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Supporting resources to help you make the most of our platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
              whileHover={{ y: -5 }}
            >
              <Link href={tool.href}>
                <Card className={`p-6 bg-${tool.color}-500/5 border-${tool.color}-500/20 hover:bg-${tool.color}-500/10 transition-colors h-full relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="space-y-4">
                    <div className={`h-12 w-12 rounded-lg bg-${tool.color}-500/20 flex items-center justify-center`}>
                      <tool.icon className={`h-6 w-6 text-${tool.color}-400`} />
                    </div>
                    <h3 className="text-xl font-semibold">{tool.title}</h3>
                    <p className="text-muted-foreground">{tool.description}</p>
                    <Button variant="ghost" className="group">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-24 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Brand?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start your journey with AI Brand Creator today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}