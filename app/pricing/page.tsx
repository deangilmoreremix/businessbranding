'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, ChevronsUpDown, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses just beginning their brand journey',
    price: {
      monthly: 29,
      yearly: 290,
    },
    features: [
      { name: 'Brand Analysis Report', available: true },
      { name: 'Basic Visual Identity Pack', available: true },
      { name: 'Voice Over Creation (50 credits)', available: true },
      { name: 'Social Media Templates (5)', available: true },
      { name: 'Brand Book Generation', available: false },
      { name: 'Advanced Brand Strategy', available: false },
      { name: 'Multiple Brand Projects', available: false },
      { name: 'Team Collaboration', available: false },
    ],
    popular: false,
    color: 'blue',
    cta: 'Start Free Trial',
    callout: '14-day free trial',
  },
  {
    name: 'Professional',
    description: 'Ideal for growing businesses looking for a complete brand solution',
    price: {
      monthly: 89,
      yearly: 890,
    },
    features: [
      { name: 'Everything in Starter', available: true },
      { name: 'Full Brand Strategy Report', available: true },
      { name: 'Premium Visual Identity Pack', available: true },
      { name: 'Voice Over Creation (200 credits)', available: true },
      { name: 'Social Media Templates (25)', available: true },
      { name: 'Brand Book Generation', available: true },
      { name: 'Advanced Brand Strategy', available: true },
      { name: 'Multiple Brand Projects (3)', available: true },
      { name: 'Team Collaboration', available: false },
    ],
    popular: true,
    color: 'purple',
    cta: 'Start Free Trial',
    callout: 'Most Popular',
  },
  {
    name: 'Business',
    description: 'For enterprises and agencies managing multiple brands and teams',
    price: {
      monthly: 199,
      yearly: 1990,
    },
    features: [
      { name: 'Everything in Professional', available: true },
      { name: 'Unlimited Brand Projects', available: true },
      { name: 'Voice Over Creation (Unlimited)', available: true },
      { name: 'Social Media Templates (Unlimited)', available: true },
      { name: 'Advanced Analytics', available: true },
      { name: 'Dedicated Success Manager', available: true },
      { name: 'Team Collaboration (10 seats)', available: true },
      { name: 'Agency Client Management', available: true },
      { name: 'API Access', available: true },
    ],
    popular: false,
    color: 'green',
    cta: 'Contact Sales',
    callout: 'Custom solutions available',
  },
];

const features = [
  { 
    name: 'Brand Analysis', 
    description: 'Comprehensive analysis of your brand across 20 strategic pillars with competitive benchmarking',
    tiers: ['Limited', 'Full', 'Advanced']
  },
  { 
    name: 'Visual Identity', 
    description: 'AI-generated logo, color palette, typography, and visual assets',
    tiers: ['Basic Pack', 'Premium Pack', 'Unlimited']
  },
  { 
    name: 'Voice Content', 
    description: 'Text-to-speech generation for podcasts, audiobooks, and brand voice overs',
    tiers: ['50 Credits', '200 Credits', 'Unlimited']
  },
  { 
    name: 'Social Media', 
    description: 'AI-generated social media templates and content ideas',
    tiers: ['5 Templates', '25 Templates', 'Unlimited']
  },
  { 
    name: 'Brand Book', 
    description: 'Comprehensive brand guidelines document',
    tiers: ['Not Included', 'Included', 'Advanced']
  },
  { 
    name: 'Brand Projects', 
    description: 'Number of separate brand identities you can create',
    tiers: ['1 Project', '3 Projects', 'Unlimited']
  },
  { 
    name: 'Team Collaboration', 
    description: 'Invite team members to collaborate on brand projects',
    tiers: ['Not Included', 'Not Included', '10 Seats']
  },
  { 
    name: 'Export Options', 
    description: 'File formats available for download',
    tiers: ['PNG, JPG, MP3', 'PNG, JPG, SVG, MP3, WAV', 'All Formats']
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const toggleFeature = (name: string) => {
    setExpandedFeature(expandedFeature === name ? null : name);
  };

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
            <Badge className="text-sm px-3">PRICING</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose the perfect plan for your brand creation needs
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center gap-4 bg-accent/10 p-1 rounded-lg">
            <Label htmlFor="billing-toggle" className={`text-sm ${billingInterval === 'monthly' ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-toggle" className={`text-sm ${billingInterval === 'yearly' ? 'font-medium' : 'text-muted-foreground'}`}>
              Yearly
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500">
                Save 20%
              </Badge>
            </Label>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 inset-x-0 flex justify-center">
                  <Badge className="bg-purple-500 hover:bg-purple-600">Most Popular</Badge>
                </div>
              )}
              <Card className={`p-6 h-full flex flex-col ${plan.popular ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">${billingInterval === 'monthly' ? plan.price.monthly : plan.price.yearly}</span>
                    <span className="text-muted-foreground ml-2">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.callout}</p>
                </div>
                
                <div className="border-t border-accent/10 my-6 pt-6 flex-grow">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {feature.available ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className={feature.available ? '' : 'text-muted-foreground'}>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  className={`w-full mt-auto ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  variant={plan.name === 'Business' ? 'outline' : 'default'}
                >
                  {plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Detailed breakdown of what's included in each plan
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/10">
                  <th className="py-4 px-4 text-left min-w-[200px]">Feature</th>
                  <th className="py-4 px-4 text-center">Starter</th>
                  <th className="py-4 px-4 text-center">Professional</th>
                  <th className="py-4 px-4 text-center">Business</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr 
                    key={feature.name} 
                    className={`border-b border-accent/10 ${expandedFeature === feature.name ? 'bg-accent/5' : ''}`}
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleFeature(feature.name)}
                        className="text-left flex items-center gap-2 w-full"
                      >
                        <span className="font-medium">{feature.name}</span>
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {expandedFeature === feature.name && (
                        <p className="mt-2 text-sm text-muted-foreground pr-4">{feature.description}</p>
                      )}
                    </td>
                    {feature.tiers.map((tier, i) => (
                      <td key={i} className="py-4 px-4 text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center gap-1 cursor-help">
                                <span>{tier}</span>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm max-w-[200px]">{feature.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-24 bg-accent/5 border border-accent/10 rounded-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Contact our team for enterprise plans, custom features, or specific requirements for your brand.
          </p>
          <Button size="lg">Contact Sales</Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Have questions about our pricing or features?
          </p>
          <Link href="#" className="text-blue-500 hover:underline">
            View our detailed FAQ
          </Link>
        </motion.div>
      </div>
    </div>
  );
}