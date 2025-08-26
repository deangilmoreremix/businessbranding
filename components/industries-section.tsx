'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { IndustryTile } from '@/components/industry-tile';
import { ShoppingBag, Code, Heart, Briefcase, Building, Utensils, GraduationCap as Graduation, Wrench, Plane, Laptop, Store, Factory, Palette, Users, Scale, Music, HeartHandshake, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';

const industryData = [
  {
    name: 'E-commerce',
    icon: <ShoppingBag className="h-5 w-5 text-blue-400" />,
    description: 'Build a standout online shopping brand in the crowded digital marketplace.',
    benefits: [
      'Clear product positioning and unique value proposition',
      'Consistent customer experience across all touchpoints',
      'Distinct visual language that stands out in digital spaces',
      'Trust-building brand elements for online transactions'
    ],
    color: 'blue'
  },
  {
    name: 'SaaS Startups',
    icon: <Code className="h-5 w-5 text-indigo-400" />,
    description: 'Establish a memorable tech brand that communicates complex solutions simply.',
    benefits: [
      'Technical credibility with approachable messaging',
      'Simplified explanation of complex solutions',
      'Future-focused brand positioning',
      'Consistent product and marketing design language'
    ],
    color: 'indigo'
  },
  {
    name: 'Health & Wellness',
    icon: <Heart className="h-5 w-5 text-rose-400" />,
    description: 'Create a health brand that balances professional authority with approachable care.',
    benefits: [
      'Trust-building visual and verbal identity',
      'Balance of professional expertise with compassionate care',
      'Clear communication of health benefits',
      'Aspirational yet authentic brand positioning'
    ],
    color: 'rose'
  },
  {
    name: 'Finance',
    icon: <Briefcase className="h-5 w-5 text-emerald-400" />,
    description: 'Develop a financial brand that builds trust while feeling modern and accessible.',
    benefits: [
      'Trust signals throughout brand identity',
      'Balance of stability with innovation',
      'Clear, jargon-free communication',
      'Professional yet approachable brand voice'
    ],
    color: 'emerald'
  },
  {
    name: 'Real Estate',
    icon: <Building className="h-5 w-5 text-amber-400" />,
    description: 'Build a property brand that stands out in a crowded, competitive market.',
    benefits: [
      'Local market differentiation strategy',
      'Luxury or accessibility positioning',
      'Trust and stability brand signals',
      'Property showcase visual strategy'
    ],
    color: 'amber'
  },
  {
    name: 'Food & Beverage',
    icon: <Utensils className="h-5 w-5 text-cyan-400" />,
    description: 'Craft a delicious brand identity that makes customers crave your offerings.',
    benefits: [
      'Appetizing visual identity system',
      'Story-driven brand narrative',
      'Memorable sensory branding elements',
      'Consistent packaging and environment design'
    ],
    color: 'cyan'
  },
  {
    name: 'Education',
    icon: <Graduation className="h-5 w-5 text-purple-400" />,
    description: 'Design a learning brand that balances academic authority with engaging approachability.',
    benefits: [
      'Credibility-building brand elements',
      'Progressive yet trustworthy positioning',
      'Clear communication of educational philosophy',
      'Engaging multi-audience messaging strategy'
    ],
    color: 'purple'
  },
  {
    name: 'Professional Services',
    icon: <Wrench className="h-5 w-5 text-lime-400" />,
    description: 'Create a service brand that showcases expertise while remaining client-focused.',
    benefits: [
      'Expertise signaling without overwhelming clients',
      'Approachable yet authoritative positioning',
      'Clear service differentiation strategy',
      'Client-centered brand messaging'
    ],
    color: 'lime'
  },
  {
    name: 'Travel & Hospitality',
    icon: <Plane className="h-5 w-5 text-blue-400" />,
    description: 'Design a travel brand that inspires wanderlust and delivers on experience promises.',
    benefits: [
      'Destination or experience positioning strategy',
      'Aspiration-driven visual identity',
      'Consistent service brand touchpoints',
      'Memorable sensory branding elements'
    ],
    color: 'blue'
  },
  {
    name: 'Technology',
    icon: <Laptop className="h-5 w-5 text-indigo-400" />,
    description: 'Build a tech brand that balances innovation with reliability and user-friendliness.',
    benefits: [
      'Future-focused yet accessible positioning',
      'Technical expertise with human understanding',
      'Innovation leadership signaling',
      'Consistent product and marketing integration'
    ],
    color: 'indigo'
  },
  {
    name: 'Retail',
    icon: <Store className="h-5 w-5 text-rose-400" />,
    description: 'Create a retail brand experience that stands out in physical and digital spaces.',
    benefits: [
      'Omnichannel brand consistency strategy',
      'Memorable in-store and online experiences',
      'Product curation storytelling',
      'Customer service as brand differentiator'
    ],
    color: 'rose'
  },
  {
    name: 'Manufacturing',
    icon: <Factory className="h-5 w-5 text-emerald-400" />,
    description: 'Develop an industrial brand that highlights quality, expertise and reliability.',
    benefits: [
      'Quality and precision messaging framework',
      'Technical expertise made approachable',
      'Heritage and innovation balance',
      'Business and consumer audience strategy'
    ],
    color: 'emerald'
  }
];

export function IndustriesSection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  
  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  
  // Use GSAP for animations
  // We'll animate when the section comes into view
  useEffect(() => {
    if (inView) {
      const tiles = document.querySelectorAll('.industry-tile');
      
      gsap.fromTo(tiles, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.1,
          ease: "power3.out"
        }
      );
    }
  }, [inView]);
  
  const displayCount = expanded ? industryData.length : 8;
  
  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden">
      <motion.div style={{ y }} className="relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16" ref={ref}>
            <Badge className="mb-4">FOR EVERYONE</Badge>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-4 gradient-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
              transition={{ duration: 0.8 }}
            >
              Perfect For Any Business
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Whether you're just starting out or rebranding an established business,
              our platform works for companies across all industries.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {industryData.slice(0, displayCount).map((industry, index) => (
              <div key={industry.name} className="industry-tile">
                <IndustryTile 
                  name={industry.name} 
                  icon={industry.icon}
                  description={industry.description}
                  benefits={industry.benefits}
                  color={industry.color}
                />
              </div>
            ))}
          </div>
          
          {industryData.length > 8 && (
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setExpanded(!expanded)}
                className="mx-auto"
              >
                {expanded ? 'Show Less' : 'Show More Industries'}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

// Add missing React import and useEffect hook
import React, { useEffect } from 'react';