'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Brain, 
  Palette, 
  MessageSquare, 
  ArrowRight,
  BarChart,
  Target,
  Users,
  Globe,
  Sparkles,
  BrainCircuit,
  Star,
  Wand2,
  TrendingUp,
  CheckCircle,
  Building,
  Zap,
  Clock,
  DollarSign,
  Briefcase,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ParticleBackground from '@/components/particle-background';

const services = [
  {
    title: 'Client Brand Analysis',
    description: 'Run a structured brand analysis on a client brief',
    icon: BrainCircuit,
    features: [
      '20-pillar brand analysis',
      'Competitor and market overview',
      'Recommendations to review',
      'PDF, Excel and Word report export'
    ],
    color: 'blue'
  },
  {
    title: 'Visual Identity Service',
    description: 'Create and edit brand imagery',
    icon: Wand2,
    features: [
      'Image generation with your OpenAI key',
      'In-browser image editor',
      'Asset library saved on your device',
      'Variations of an uploaded image'
    ],
    color: 'purple'
  },
  {
    title: 'Voice & Content Service',
    description: 'Draft voice content',
    icon: MessageSquare,
    features: [
      'Text-to-speech voice content',
      'Podcast and audiobook drafts',
      'Transcription of recordings',
      'Email draft workflows'
    ],
    color: 'indigo'
  }
];

const agencyBenefits = [
  {
    title: 'Strategy drafts',
    description: 'Run the 20-pillar brand analysis on a client brief and start from a structured draft',
    icon: Target,
    time: 'Drafts, not final strategy'
  },
  {
    title: 'Assets and voice',
    description: 'Create images, voice content and email drafts with the same tools',
    icon: Settings,
    time: 'Review before sending to clients'
  },
  {
    title: 'Your own key',
    description: 'Usage is billed by OpenAI to the key you add; there are no seats or plans here',
    icon: DollarSign,
    time: 'No subscription'
  }
];

const results = [
  {
    title: 'Analysis',
    value: '20 pillars',
    description: 'Each analysis scores the same 20 brand pillars',
    icon: Clock
  },
  {
    title: 'Reports',
    value: 'PDF, Excel, Word',
    description: 'Export an analysis with the sections you choose',
    icon: Briefcase
  },
  {
    title: 'Saved on your device',
    value: 'Local',
    description: 'Saved analyses and assets stay in your browser storage',
    icon: TrendingUp
  }
];

export default function AgencyPage() {
  return (
    <main className="relative">
      <ParticleBackground />

      {/* Hero Section */}
      <section className="min-h-screen relative flex flex-col items-center justify-center py-24">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4">FOR AGENCIES & CONSULTANTS</Badge>
              <h1 className="text-6xl font-bold tracking-tighter gradient-text mb-6">
                AI Branding Tools for Agencies and Consultants
              </h1>
              <p className="text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
                Use the analysis, image and voice tools on client briefs. Everything runs on your own OpenAI key and the output is a draft for you to review.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/brand-strategy">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                >
                  Start Offering Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {agencyBenefits.map((benefit, index) => (
                <Card key={index} className="p-6 bg-accent/5 border-accent/20">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-400 mb-1">{benefit.time}</div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">SERVICE OFFERINGS</Badge>
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Expand Your Service Portfolio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Add powerful AI-driven branding services to your agency&apos;s offerings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`p-6 bg-${service.color}-500/5 border-${service.color}-500/20 h-full`}>
                  <div className="space-y-4">
                    <div className={`h-12 w-12 rounded-lg bg-${service.color}-500/20 flex items-center justify-center`}>
                      <service.icon className={`h-6 w-6 text-${service.color}-400`} />
                    </div>
                    <h3 className="text-xl font-semibold">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">AGENCY SUCCESS</Badge>
            <h2 className="text-4xl font-bold gradient-text mb-4">
              What agencies use it for
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three ways the tools help an agency work faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {results.map((result, index) => (
              <motion.div
                key={result.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <result.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold gradient-text mb-2">{result.value}</div>
                  <h3 className="font-medium mb-2">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12"
          >
            <h2 className="text-3xl font-bold mb-4">Try it on a client brief</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Run the analysis on a client brief, or send us a question.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/brand-strategy">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Analyze a client brand
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">Contact us</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}