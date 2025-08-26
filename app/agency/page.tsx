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
    description: 'Deliver comprehensive brand audits in minutes',
    icon: BrainCircuit,
    features: [
      '20-point brand health analysis',
      'Competitive market positioning',
      'Growth opportunity identification',
      'Actionable recommendations'
    ],
    color: 'blue'
  },
  {
    title: 'Visual Identity Service',
    description: 'Offer professional brand design services',
    icon: Wand2,
    features: [
      'AI-powered logo generation',
      'Brand asset creation',
      'Style guide development',
      'Visual consistency tools'
    ],
    color: 'purple'
  },
  {
    title: 'Voice & Content Service',
    description: 'Provide complete content solutions',
    icon: MessageSquare,
    features: [
      'Brand voice development',
      'Content strategy creation',
      'Voice content generation',
      'Message optimization'
    ],
    color: 'indigo'
  }
];

const agencyBenefits = [
  {
    title: 'Increased Revenue',
    description: 'Add a new high-margin service offering',
    icon: DollarSign,
    time: '10x faster delivery'
  },
  {
    title: 'Scalable Process',
    description: 'Handle more clients with AI automation',
    icon: Settings,
    time: '5x client capacity'
  },
  {
    title: 'Client Success',
    description: 'Deliver measurable brand improvements',
    icon: Target,
    time: '98% satisfaction'
  }
];

const results = [
  {
    title: 'Service Delivery Time',
    value: '90%',
    description: 'Reduction in project timeline',
    icon: Clock
  },
  {
    title: 'Client Portfolio',
    value: '3x',
    description: 'Growth in client capacity',
    icon: Briefcase
  },
  {
    title: 'Revenue Growth',
    value: '185%',
    description: 'Average agency growth',
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
                Transform Your Agency with AI-Powered Branding Services
              </h1>
              <p className="text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
                Offer professional brand transformation services to your clients using our AI platform. Deliver exceptional results in a fraction of the time.
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
              <Button size="lg" variant="outline">
                Partner Program
              </Button>
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
              Add powerful AI-driven branding services to your agency's offerings
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
              Partner Success Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how agencies are transforming their business with our platform
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
            <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Agency?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join our partner program and start offering AI-powered branding services today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/brand-strategy">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Become a Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Partner Success Stories
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}