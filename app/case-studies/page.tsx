'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Users, 
  Globe,
  BarChart,
  Palette,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const caseStudies = [
  {
    title: 'Tech Startup Brand Evolution',
    description: 'How AI Brand Creator helped a SaaS startup increase brand recognition by 300%',
    industry: 'Technology',
    results: [
      'Brand recognition increased by 300%',
      'Customer acquisition cost reduced by 45%',
      'Social media engagement up 250%'
    ],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    featured: true
  },
  {
    title: 'E-commerce Brand Refresh',
    description: 'Transforming an online retailer with AI-powered visual identity',
    industry: 'E-commerce',
    results: [
      'Conversion rate improved by 75%',
      'Customer trust score up by 60%',
      'Brand recall increased by 150%'
    ],
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  },
  {
    title: 'Healthcare Provider Rebranding',
    description: 'Creating a modern, trustworthy brand for a digital health platform',
    industry: 'Healthcare',
    results: [
      'Patient trust increased by 85%',
      'App downloads up by 200%',
      'Brand authority score improved by 90%'
    ],
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1557683304-673a23048d34?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  },
  {
    title: 'Restaurant Chain Voice Identity',
    description: 'Developing a distinctive audio brand for a national restaurant chain',
    industry: 'Food & Beverage',
    results: [
      'Brand recognition increased by 150%',
      'Customer satisfaction up by 40%',
      'Social media engagement grew by 300%'
    ],
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1557683325-3ba8f0df79de?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80'
  }
];

const services = [
  {
    name: 'Brand Analysis',
    description: 'AI-powered analysis of your brand strategy',
    icon: BarChart,
    href: '/brand-strategy'
  },
  {
    name: 'Visual Identity',
    description: 'Create your complete visual brand',
    icon: Palette,
    href: '/visual-identity'
  },
  {
    name: 'Voice Content',
    description: 'Generate professional voice content',
    icon: MessageSquare,
    href: '/voice-content'
  }
];

export default function CaseStudiesPage() {
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
            <Badge className="text-sm px-3">CASE STUDIES</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Success Stories
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            See how businesses are transforming their brands with AI-powered solutions
          </motion.p>
        </div>

        {/* Featured Case Study */}
        {caseStudies.filter(study => study.featured).map((study, index) => (
          <motion.div
            key={study.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={study.image}
                  alt={study.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <Badge className="mb-4 bg-blue-500 hover:bg-blue-600">Featured Case Study</Badge>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden relative">
                      <Image
                        src={study.logo}
                        alt="Company logo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{study.title}</h2>
                      <p className="text-white/80">{study.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    {study.results.map((result, i) => (
                      <div key={i} className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Other Case Studies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {caseStudies.filter(study => !study.featured).map((study, index) => (
            <motion.div
              key={study.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
            >
              <Card className="overflow-hidden h-full">
                <div className="relative aspect-video">
                  <Image
                    src={study.image}
                    alt={study.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative">
                      <Image
                        src={study.logo}
                        alt="Company logo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Badge className="mb-2">{study.industry}</Badge>
                      <h3 className="font-bold">{study.title}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{study.description}</p>
                  <div className="space-y-2">
                    {study.results.map((result, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Services Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your brand with our AI-powered solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
            >
              <Link href={service.href}>
                <Card className="p-6 h-full hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
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

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Brand?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of businesses using AI to create professional brand identities
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