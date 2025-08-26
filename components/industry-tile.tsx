'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IndustryTileProps {
  name: string;
  icon: React.ReactNode;
  benefits: string[];
  description: string;
  color?: string;
}

export function IndustryTile({ name, icon, benefits, description, color = 'blue' }: IndustryTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  const colorVariants = {
    blue: {
      light: 'bg-blue-500/5',
      medium: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'bg-blue-500/20'
    },
    purple: {
      light: 'bg-purple-500/5',
      medium: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'bg-purple-500/20'
    },
    indigo: {
      light: 'bg-indigo-500/5',
      medium: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      glow: 'bg-indigo-500/20'
    },
    emerald: {
      light: 'bg-emerald-500/5',
      medium: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'bg-emerald-500/20'
    },
    amber: {
      light: 'bg-amber-500/5',
      medium: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'bg-amber-500/20'
    },
    rose: {
      light: 'bg-rose-500/5',
      medium: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'bg-rose-500/20'
    },
    cyan: {
      light: 'bg-cyan-500/5',
      medium: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'bg-cyan-500/20'
    },
    lime: {
      light: 'bg-lime-500/5',
      medium: 'bg-lime-500/10',
      border: 'border-lime-500/20',
      text: 'text-lime-400',
      glow: 'bg-lime-500/20'
    }
  };
  
  const colors = colorVariants[color] || colorVariants.blue;
  
  const handleStartAnalysis = () => {
    router.push(`/?section=brand-analysis&industry=${encodeURIComponent(name)}`);
  };
  
  return (
    <Card 
      className={`p-6 relative overflow-hidden ${colors.light} ${colors.border} transition-all duration-300`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background animation */}
      <motion.div 
        className={`absolute inset-0 ${colors.medium} -z-10`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Shimmer effect overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -z-5"
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ 
          x: isHovered ? "200%" : "-100%", 
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Content */}
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          <motion.div 
            className={`p-2 rounded-lg ${colors.glow} ${isHovered ? 'scale-110' : 'scale-100'} transition-transform duration-300`}
            whileHover={{ 
              rotate: [0, 5, -5, 0],
              transition: { duration: 1, repeat: Infinity }
            }}
          >
            {icon}
          </motion.div>
          <motion.h3 
            className="font-semibold text-lg"
            animate={{ 
              textShadow: isHovered 
                ? "0 0 8px rgba(255,255,255,0.5)"
                : "0 0 0px rgba(255,255,255,0)"
            }}
            transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h3>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        
        {/* Benefits */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            height: isHovered ? 'auto' : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: -5 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -5
              }}
              transition={{ delay: index * 0.1 }}
            >
              <CheckCircle className={`h-4 w-4 ${colors.text} mt-0.5 flex-shrink-0`} />
              <span className="text-xs">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Button */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group relative overflow-hidden"
            onClick={handleStartAnalysis}
          >
            {/* Button glow effect */}
            <motion.div 
              className="absolute inset-0 bg-white/5"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            
            <span>Analyze {name} Brand</span>
            <motion.div
              className="inline-block ml-2"
              animate={{ 
                x: isHovered ? 3 : 0 
              }}
            >
              <ArrowRight className={`h-4 w-4 ${colors.text} transition-transform group-hover:translate-x-1`} />
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}