'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  FileText, 
  Code, 
  BookOpen, 
  ArrowRight, 
  ChevronDown,
  ChevronUp,
  Brain,
  Palette,
  Headphones,
  Settings,
  Target,
  Star
} from 'lucide-react';

interface DocLink {
  title: string;
  description: string;
  href: string;
  icon: any;
  category: 'Documentation' | 'API' | 'Examples';
}

interface DocumentationLinksProps {
  component: 'brand-analysis' | 'visual-identity' | 'voice-content';
}

const docLinks: Record<DocumentationLinksProps['component'], DocLink[]> = {
  'brand-analysis': [
    {
      title: 'Component Guide',
      description: 'Learn how to use the Brand Analysis component',
      href: '/docs/components/brand-analysis',
      icon: FileText,
      category: 'Documentation'
    },
    {
      title: 'API Reference',
      description: 'Explore the Brand Analysis API',
      href: '/docs/api/gemini',
      icon: Code,
      category: 'API'
    },
    {
      title: 'Best Practices',
      description: 'Tips for effective brand analysis',
      href: '/docs/best-practices',
      icon: Star,
      category: 'Documentation'
    }
  ],
  'visual-identity': [
    {
      title: 'Component Guide',
      description: 'Learn how to use the Visual Identity component',
      href: '/docs/components/visual-identity',
      icon: FileText,
      category: 'Documentation'
    },
    {
      title: 'Style Transfer API',
      description: 'Image transformation and style transfer',
      href: '/docs/api/recraft',
      icon: Code,
      category: 'API'
    },
    {
      title: 'Asset Generation',
      description: 'Generate brand assets with AI',
      href: '/docs/components/visual-identity#asset-generation',
      icon: Palette,
      category: 'Examples'
    }
  ],
  'voice-content': [
    {
      title: 'Component Guide',
      description: 'Learn how to use the Voice Content component',
      href: '/docs/components/voice-interface',
      icon: FileText,
      category: 'Documentation'
    },
    {
      title: 'Voice API',
      description: 'Voice generation and analysis API',
      href: '/docs/api/voice',
      icon: Code,
      category: 'API'
    },
    {
      title: 'Content Examples',
      description: 'Example voice content implementations',
      href: '/docs/components/voice-interface#examples',
      icon: BookOpen,
      category: 'Examples'
    }
  ]
};

export function DocumentationLinks({ component }: DocumentationLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const links = docLinks[component];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-12"
    >
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-t border-blue-500/20">
        <motion.div
          animate={{ height: isExpanded ? 'auto' : '64px' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Documentation & Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Learn more about using this feature
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {links.map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="p-4 hover:bg-accent/5 transition-colors h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <link.icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{link.category}</Badge>
                    </div>
                    <h4 className="font-medium mb-1">{link.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      {link.description}
                    </p>
                    <Button variant="ghost" className="w-full group">
                      View Documentation
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}