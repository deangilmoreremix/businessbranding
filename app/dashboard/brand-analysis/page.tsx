'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandAnalysis } from '@/components/brand-analysis';
import { BrandPillarBreakdown } from '@/components/brand-pillar-breakdown';
import { Brain, BarChart, Target, Activity, Sparkles } from 'lucide-react';

export default function BrandAnalysisPage() {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [brandAnalysisResults, setBrandAnalysisResults] = useState(null);

  const handleAnalysisComplete = (analysis) => {
    setBrandAnalysisResults(analysis);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2">BRAND ANALYSIS</Badge>
            <h1 className="text-3xl font-bold gradient-text">Brand Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and improve your brand performance across all metrics
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Sparkles className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Brand Health Score', value: '85%', icon: Brain, color: 'blue' },
            { title: 'Market Fit', value: '92%', icon: Target, color: 'purple' },
            { title: 'Competitive Rank', value: '#2', icon: BarChart, color: 'indigo' },
            { title: 'Growth Rate', value: '+45%', icon: Activity, color: 'green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`p-6 bg-${stat.color}-500/5 border-${stat.color}-500/20`}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <BrandAnalysis 
            businessIdea={businessInfo?.websiteUrl || ''}
            onAnalysisComplete={handleAnalysisComplete}
          />

          {brandAnalysisResults && (
            <BrandPillarBreakdown 
              pillarScores={brandAnalysisResults.brandFactors}
              onImprovementSelected={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}