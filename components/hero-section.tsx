'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Palette, MessageSquare, BrainCircuit, Wand2, Globe, Target, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TypeAnimation } from 'react-type-animation';

export default function HeroSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleStartAnalysis = () => {
    if (mounted) {
      router.push('/brand-strategy');
    }
  };

  const handleBrandAnalysisClick = () => {
    setActiveComponent(activeComponent === 'brand-analysis' ? null : 'brand-analysis');
    router.push('/?section=brand-analysis');
  };

  const handleBrandStrategyClick = () => {
    setActiveComponent(activeComponent === 'business' ? null : 'business');
    router.push('/?section=business');
  };

  const handleVisualIdentityClick = () => {
    setActiveComponent(activeComponent === 'visual' ? null : 'visual');
    router.push('/?section=visual');
  };

  const handleVoiceClick = () => {
    setActiveComponent(activeComponent === 'voice' ? null : 'voice');
    router.push('/?section=voice');
  };

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-center py-24 overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-12"
        >
          <Badge className="px-3 py-1.5 text-base">BUSINESS REBRANDING</Badge>
          
          <div className="space-y-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter">
              <div className="gradient-text mb-4">Reinvent</div>
              <div className="mb-4">Your Brand</div>
              <div className="h-24">
                <TypeAnimation
                  sequence={[
                    'With Strategic Analysis',
                    2000,
                    'With Modern Design',
                    2000,
                    'With Market Insights',
                    2000,
                    'With AI Innovation',
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="gradient-text"
                />
              </div>
            </h1>
            
            <p className="text-xl text-blue-200/80 max-w-2xl leading-relaxed">
              Transform your business identity with AI-powered rebranding. Our platform helps you evolve your brand with data-driven insights, modern design, and strategic positioning.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 relative overflow-hidden group"
              onClick={handleStartAnalysis}
            >
              <span className="relative z-10">Start Brand Transformation</span>
              <ArrowRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                animate={{ x: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
            </Button>
            
            <Link href="/case-studies">
              <Button 
                variant="outline" 
                size="lg"
                className="group"
              >
                View Success Stories
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 perspective-1000">
            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'brand-analysis' ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5'
              }`}
              onClick={handleBrandAnalysisClick}
            >
              <BrainCircuit className="h-8 w-8 text-indigo-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Audit</h3>
              <p className="text-sm text-muted-foreground">Comprehensive analysis and market positioning</p>
            </div>
            
            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'business' ? 'bg-blue-500/10 border-blue-500' : 'hover:bg-white/5'
              }`}
              onClick={handleBrandStrategyClick}
            >
              <Brain className="h-8 w-8 text-blue-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Strategy</h3>
              <p className="text-sm text-muted-foreground">Data-driven rebranding roadmap</p>
            </div>

            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'visual' ? 'bg-purple-500/10 border-purple-500' : 'hover:bg-white/5'
              }`}
              onClick={handleVisualIdentityClick}
            >
              <Palette className="h-8 w-8 text-purple-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Visual Identity</h3>
              <p className="text-sm text-muted-foreground">Modern brand design and assets</p>
            </div>

            <div 
              className={`glass-card p-6 rounded-lg hover:scale-105 transition-all duration-300 ease-out cursor-pointer ${
                activeComponent === 'voice' ? 'bg-indigo-500/10 border-indigo-500' : 'hover:bg-white/5'
              }`}
              onClick={handleVoiceClick}
            >
              <MessageSquare className="h-8 w-8 text-indigo-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Voice</h3>
              <p className="text-sm text-muted-foreground">Distinctive messaging and tone</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:grid grid-cols-2 gap-6"
        >
          <Link href="/brand-strategy">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <BrainCircuit className="h-8 w-8 text-blue-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Evolution</h3>
              <p className="text-sm text-muted-foreground">Strategic rebranding with AI-driven insights</p>
              <div className="mt-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Avg. Revenue Growth +45%</span>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/visual-identity">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
            >
              <Palette className="h-8 w-8 text-purple-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Visual Refresh</h3>
              <p className="text-sm text-muted-foreground">Modern brand identity and design system</p>
              <div className="mt-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Brand Recognition +85%</span>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/voice-content">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <MessageSquare className="h-8 w-8 text-indigo-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Voice</h3>
              <p className="text-sm text-muted-foreground">Compelling messaging and content strategy</p>
              <div className="mt-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Engagement +95%</span>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/dashboard">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <Brain className="h-8 w-8 text-green-400 mb-4 floating" />
              <h3 className="font-semibold mb-2">Brand Management</h3>
              <p className="text-sm text-muted-foreground">Unified brand asset control center</p>
              <div className="mt-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Team Efficiency +85%</span>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}