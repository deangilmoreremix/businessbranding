'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Heart, 
  ArrowUpRight, 
  ExternalLink, 
  BarChart, 
  Palette, 
  Headphones, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Users, 
  MessageSquare,
  Settings,
  Info,
  Lock,
  HelpCircle
} from 'lucide-react';
import { NewsletterForm } from '@/components/newsletter-form';

export function Footer() {
  const links = {
    services: [
      { name: 'Brand Analysis', href: '/brand-strategy', icon: BarChart },
      { name: 'Visual Identity', href: '/visual-identity', icon: Palette },
      { name: 'Voice Content', href: '/voice-content', icon: Headphones },
      { name: 'Content Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Content Workflows', href: '/workflows', icon: LayoutDashboard },
      { name: 'Planning & Calendar', href: '/dashboard/planning', icon: LayoutDashboard }
    ],
    resources: [
      { name: 'Documentation', href: '/docs', icon: FileText },
      { name: 'Blog', href: '/blogs', icon: BookOpen },
      { name: 'Case Studies', href: '/case-studies', icon: Users },
      { name: 'Features', href: '/features', icon: Settings }
    ],
    company: [
      { name: 'About Us', href: '/about', icon: Info },
      { name: 'Billing & keys', href: '/pricing', icon: LayoutDashboard },
      { name: 'Contact', href: '/contact', icon: MessageSquare },
      { name: 'Integrations', href: '/integrations', icon: Settings }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy', icon: Lock },
      { name: 'Terms of Service', href: '/terms', icon: FileText },
      { name: 'Cookie Policy', href: '/cookies', icon: HelpCircle }
    ],
    // Social/contact links exist only when configured (NEXT_PUBLIC_SOCIAL_TWITTER / _LINKEDIN / _GITHUB / NEXT_PUBLIC_CONTACT_EMAIL); there are no defaults.
    social: [
      { name: 'Twitter', href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER, icon: Twitter },
      { name: 'LinkedIn', href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, icon: Linkedin },
      { name: 'GitHub', href: process.env.NEXT_PUBLIC_SOCIAL_GITHUB, icon: Github },
      { name: 'Email', href: process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : undefined, icon: Mail }
    ].filter((l): l is { name: string; href: string; icon: typeof Twitter } => !!l.href)
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <footer className="border-t border-accent/10 bg-background/50 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="grid grid-cols-1 gap-8 lg:grid-cols-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand & Newsletter */}
          <motion.div className="lg:col-span-4" variants={childVariants}>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 6, 
                    ease: "easeInOut" 
                  }}
                >
                  <Brain className="h-8 w-8 text-blue-400" />
                </motion.div>
                <motion.div
                  className="absolute -inset-1 rounded-full bg-blue-500/20 -z-10"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3, 
                    ease: "easeInOut" 
                  }}
                />
              </div>
              <Link href="/" className="text-xl font-bold gradient-text">AI Brand Creator</Link>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-sm">
              Analyze your brand, create visual identity and voice content, and plan the rollout, with AI that runs on your own OpenAI key. Complete branding solution from strategy to visual assets and voice content.
            </p>
            
            <p className="text-sm font-medium mb-2">Newsletter</p>
            <NewsletterForm idPrefix="footer" />
          </motion.div>
          
          {/* Services */}
          <motion.div className="lg:col-span-2" variants={childVariants}>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              {links.services.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center group"
                  >
                    <link.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{link.name}</span>
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Resources */}
          <motion.div className="lg:col-span-2" variants={childVariants}>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center group"
                  >
                    <link.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{link.name}</span>
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Company */}
          <motion.div className="lg:col-span-2" variants={childVariants}>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center group"
                  >
                    <link.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{link.name}</span>
                    <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Social (only configured links) */}
          {links.social.length > 0 && <motion.div className="lg:col-span-2" variants={childVariants}>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-4">
              {links.social.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    <link.icon className="h-4 w-4 mr-2" />
                    <span>{link.name}</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>}
        </motion.div>
        
        <motion.div 
          className="border-t border-accent/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div>
            © {new Date().getFullYear()} AI Brand Creator. All rights reserved.
          </div>
          
          <div className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-red-500" aria-hidden />
          </div>
          
          <div className="flex gap-6">
            {links.legal.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                className="hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}