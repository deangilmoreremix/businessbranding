'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Shield, Zap, Clock } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
    lifetime: number;
  };
  features: Array<{
    name: string;
    available: boolean | string | number;
  }>;
  mostPopular?: boolean;
}

interface PricingComparisonProps {
  plans: PricingPlan[];
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
}

export function PricingComparison({ plans, billingCycle }: PricingComparisonProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const getGroupedFeatures = () => {
    const features: Record<string, string[]> = {
      'Core Features': [],
      'Brand Strategy': [],
      'Visual Identity': [],
      'Voice Content': [],
      'Team Collaboration': [],
      'Advanced Features': [],
      'Support': []
    };

    // Get all features from all plans
    plans.forEach(plan => {
      plan.features.forEach(feature => {
        const name = typeof feature.available === 'string' 
          ? feature.name.split('(')[0].trim()
          : feature.name;

        // Assign features to categories based on name
        if (name.includes('Brand') && !name.includes('Visual') && !name.includes('Voice')) {
          features['Brand Strategy'].push(name);
        } else if (name.includes('Visual') || name.includes('Template') || name.includes('Image')) {
          features['Visual Identity'].push(name);
        } else if (name.includes('Voice') || name.includes('Audio')) {
          features['Voice Content'].push(name);
        } else if (name.includes('Team') || name.includes('Collaboration') || name.includes('User')) {
          features['Team Collaboration'].push(name);
        } else if (name.includes('API') || name.includes('Advanced') || name.includes('Custom')) {
          features['Advanced Features'].push(name);
        } else if (name.includes('Support') || name.includes('Manager') || name.includes('Training')) {
          features['Support'].push(name);
        } else {
          features['Core Features'].push(name);
        }
      });
    });

    // Remove duplicate features
    Object.keys(features).forEach(category => {
      features[category] = [...new Set(features[category])];
    });

    return features;
  };

  const groupedFeatures = getGroupedFeatures();

  const getPlanFeature = (plan: PricingPlan, featureName: string) => {
    return plan.features.find(f => 
      f.name === featureName || 
      f.name.startsWith(featureName + ' ('));
  };

  const featuresCount = Object.values(groupedFeatures).reduce(
    (total, features) => total + features.length, 0
  );

  return (
    <Card className="p-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
      <div className="text-center mb-8">
        <Badge className="mb-2">PRICING COMPARISON</Badge>
        <h2 className="text-3xl font-bold mb-2">Plan Comparison</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare our plans to find the perfect fit for your business
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 w-1/4">Features ({featuresCount})</th>
              {plans.map((plan) => (
                <th 
                  key={plan.id} 
                  className="text-center p-4"
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  <motion.div 
                    animate={{ scale: hoveredPlan === plan.id ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                    className={`p-2 rounded-md ${hoveredPlan === plan.id ? 'bg-accent/10' : ''}`}
                  >
                    {plan.mostPopular && (
                      <Badge className="mb-2 bg-purple-500">Most Popular</Badge>
                    )}
                    <div className="font-bold text-lg">{plan.name}</div>
                    <div className="text-2xl font-bold my-2">
                      ${billingCycle === 'monthly' ? plan.price.monthly : 
                        billingCycle === 'yearly' ? plan.price.yearly : 
                        plan.price.lifetime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {billingCycle !== 'lifetime' ? 
                        `per ${billingCycle === 'monthly' ? 'month' : 'year'}` : 
                        'one-time payment'}
                    </div>
                    <Button 
                      className={`mt-4 w-full ${plan.mostPopular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      variant={plan.mostPopular ? 'default' : 'outline'}
                    >
                      Choose {plan.name}
                    </Button>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedFeatures).map(([category, features]) => features.length > 0 && (
              <>
                <tr className="bg-accent/10">
                  <th colSpan={plans.length + 1} className="text-left p-4 font-medium">
                    {category}
                  </th>
                </tr>
                {features.map((feature, featureIndex) => (
                  <tr 
                    key={`${category}-${featureIndex}`}
                    className="border-b border-accent/10"
                  >
                    <td className="p-4 text-sm">{feature}</td>
                    {plans.map((plan) => {
                      const planFeature = getPlanFeature(plan, feature);
                      return (
                        <td 
                          key={`${plan.id}-${feature}`} 
                          className={`p-4 text-center ${hoveredPlan === plan.id ? 'bg-accent/5' : ''}`}
                        >
                          {!planFeature ? (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          ) : typeof planFeature.available === 'boolean' ? (
                            planFeature.available ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="font-medium">{planFeature.available}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">30-Day Money Back</h3>
              <p className="text-sm text-muted-foreground">
                Try risk-free with our 30-day money-back guarantee
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium">Cancel Anytime</h3>
              <p className="text-sm text-muted-foreground">
                No long-term contracts or commitments
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help whenever you need it
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}