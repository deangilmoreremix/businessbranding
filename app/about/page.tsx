'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  Users, 
  Globe, 
  Award, 
  Heart, 
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Sparkles,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ServiceCard } from '@/components/service-card';

const teamMembers = [
  {
    name: 'Alex Johnson',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Former AI researcher with a passion for design and branding.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Machine learning expert specialized in generative AI systems.'
  },
  {
    name: 'Sarah Williams',
    role: 'Head of Design',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Award-winning designer with over 15 years in brand identity.'
  },
  {
    name: 'David Rodriguez',
    role: 'Marketing Director',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Digital marketing strategist with experience in brand launches.'
  }
];

const values = [
  {
    title: 'Innovation',
    icon: Sparkles,
    description: 'We constantly push the boundaries of what AI can do for branding.'
  },
  {
    title: 'Quality',
    icon: Star,
    description: 'We are committed to delivering professional-grade brand assets and strategies.'
  },
  {
    title: 'Accessibility',
    icon: Users,
    description: 'Making professional branding accessible to businesses of all sizes.'
  },
  {
    title: 'Security',
    icon: ShieldCheck,
    description: 'Clear pricing, honest feedback, and straightforward guidance.'
  },
  {
    title: 'Education',
    icon: BookOpen,
    description: 'Empowering our customers with knowledge about effective branding.'
  },
  {
    title: 'Impact',
    icon: Heart,
    description: 'Helping businesses grow through effective brand strategies and identities.'
  }
];

export default function AboutPage() {
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
            <Badge className="text-sm px-3">ABOUT US</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our Story and Mission
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Revolutionizing brand creation through the power of artificial intelligence
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-xl blur-xl opacity-50"></div>
              <div className="relative rounded-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Team working on AI brand creation"
                  width={800}
                  height={600}
                  className="object-cover w-full h-[400px]"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold">Our Vision</h2>
            <p className="text-lg text-muted-foreground">
              Founded in 2023, AI Brand Creator was born from a simple observation: creating a professional brand identity is expensive, time-consuming, and inaccessible to many businesses.
            </p>
            <p className="text-lg text-muted-foreground">
              Our team of AI researchers, designers, and branding experts came together with a mission to democratize high-quality branding through artificial intelligence.
            </p>
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">2,500+</div>
                  <div className="text-sm text-muted-foreground">Brands Created</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">98%</div>
                  <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">15+</div>
                  <div className="text-sm text-muted-foreground">Industries Served</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">30+</div>
                  <div className="text-sm text-muted-foreground">Countries Worldwide</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
              >
                <Card className="p-6 h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the experts behind AI Brand Creator
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                whileHover={{ y: -5 }}
              >
                <Card className="overflow-hidden h-full">
                  <div className="relative aspect-square">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="inline-block mb-4">
            <Badge className="text-sm px-3">NEXT STEPS</Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-4">
            Complete Your Brand Identity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            After your brand strategy analysis, explore our other tools to build your complete brand identity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/visual-identity">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Visual Identity</h3>
                  <p className="text-sm text-muted-foreground">
                    Create logos, color schemes, and visual assets for your brand.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/voice-content">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Brand Voice</h3>
                  <p className="text-sm text-muted-foreground">
                    Develop your brand voice, messaging, and content strategy.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard">
              <Card className="p-6 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Content Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage all your brand assets and content in one place.
                  </p>
                  <Button variant="link" className="mt-2 group">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}