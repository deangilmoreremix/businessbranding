'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  href: string;
  color?: string;
  onClick?: () => void;
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  features,
  href,
  color = 'blue',
  onClick
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorVariants = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      button: 'bg-purple-500 hover:bg-purple-600'
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      icon: 'text-indigo-400',
      button: 'bg-indigo-500 hover:bg-indigo-600'
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
      button: 'bg-cyan-500 hover:bg-cyan-600'
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      button: 'bg-green-500 hover:bg-green-600'
    },
  };
  
  const colorClasses = colorVariants[color] || colorVariants.blue;
  
  return (
    <Card
      className={`p-6 ${colorClasses.bg} border ${colorClasses.border} transition-all duration-300 h-full relative overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Add shimmer effect on hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ 
          x: isHovered ? "200%" : "-100%", 
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      <div className="space-y-4 h-full flex flex-col">
        <motion.div
          whileHover={{ 
            scale: 1.1,
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.5 }
          }}
        >
          <Icon className={`h-10 w-10 ${colorClasses.icon}`} />
        </motion.div>
        
        <div>
          <motion.h3 
            className="text-xl font-semibold mb-2"
            animate={{ 
              textShadow: isHovered 
                ? "0 0 8px rgba(255,255,255,0.5)"
                : "0 0 0px rgba(255,255,255,0)"
            }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        <ul className="space-y-2 mt-2 flex-grow">
          {features.map((feature, index) => (
            <motion.li 
              key={index}
              className="flex items-start gap-2 text-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                x: isHovered ? 0 : -5 
              }}
              transition={{ delay: index * 0.1 }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colorClasses.icon} mt-1.5`} />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
        
        <Button 
          className="mt-4 w-full group relative overflow-hidden"
          onClick={onClick}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"
            animate={{ 
              x: isHovered ? "100%" : "-100%"
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeInOut"
            }}
          />
          <span className="relative z-10">Get Started</span>
          <motion.div
            className="inline-block ml-2 relative z-10"
            animate={{ 
              x: isHovered ? 3 : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>
    </Card>
  );
}