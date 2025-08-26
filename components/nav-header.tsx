'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  Palette,
  ChevronDown,
  Menu,
  X,
  BarChart,
  Sparkles,
  FileText,
  Headphones,
  Settings,
  Users,
  BookOpen,
  ArrowRight,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const services = [
  {
    name: 'Brand Analysis',
    description: 'AI-powered brand strategy analysis',
    icon: BarChart,
    href: '/brand-strategy'
  },
  {
    name: 'Visual Identity',
    description: 'Create your complete visual brand',
    icon: Palette,
    href: '/visual-identity'
  },
  {
    name: 'Voice Content',
    description: 'Generate professional voice content',
    icon: Headphones,
    href: '/voice-content'
  },
  {
    name: 'Content Management',
    description: 'Manage all your brand assets',
    icon: LayoutDashboard,
    href: '/dashboard'
  }
];

const resources = [
  {
    name: 'Documentation',
    description: 'Learn how to use our platform',
    icon: FileText,
    href: '/docs'
  },
  {
    name: 'Blog',
    description: 'Latest news and articles',
    icon: BookOpen,
    href: '/blogs'
  },
  {
    name: 'Case Studies',
    description: 'See how others use our platform',
    icon: Users,
    href: '/case-studies'
  }
];

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleStartAnalysis = () => {
    if (mounted) {
      router.push('/brand-strategy');
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/');
    setMobileMenuOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <motion.div 
      className={`sticky top-0 z-40 w-full backdrop-blur-lg border-b transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 border-accent/20 shadow-md' 
          : 'bg-background/50 border-accent/10'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 font-semibold group">
            <motion.div
              className="relative"
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                repeat: Infinity,
                repeatType: "mirror",
                duration: 4,
                ease: "easeInOut"
              }}
            >
              <Brain className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <motion.div 
                className="absolute -inset-1 bg-blue-400/20 rounded-full -z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.2, 0.8], 
                  opacity: [0, 0.3, 0],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <span className="gradient-text font-bold hidden sm:block">AI Brand Creator</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                  Services
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px] p-3">
                <div className="grid grid-cols-1 gap-2">
                  {services.map((service) => (
                    <DropdownMenuItem key={service.href} asChild>
                      <Link 
                        href={service.href}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <service.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">{service.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                  Resources
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px] p-3">
                <div className="grid grid-cols-1 gap-2">
                  {resources.map((resource) => (
                    <DropdownMenuItem key={resource.href} asChild>
                      <Link 
                        href={resource.href}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <resource.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-sm text-muted-foreground">{resource.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/agency">
              <Button variant="ghost" className="flex items-center gap-1">
                <Building className="h-4 w-4 mr-1" />
                Agency
              </Button>
            </Link>

            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>

            <Link href="/about">
              <Button variant="ghost">About</Button>
            </Link>

            <Link href="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
              onClick={handleStartAnalysis}
            >
              Start Free Brand Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div 
          className="md:hidden backdrop-blur-lg bg-background/80 border-b border-accent/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="container py-4">
            <div className="space-y-1">
              <p className="px-3 text-sm font-medium text-muted-foreground">Services</p>
              {services.map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(service.href)
                      ? "bg-accent/20 text-foreground"
                      : "hover:bg-accent/10 text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <service.icon className="h-4 w-4" />
                  {service.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 space-y-1">
              <p className="px-3 text-sm font-medium text-muted-foreground">Resources</p>
              {resources.map((resource) => (
                <Link
                  key={resource.href}
                  href={resource.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(resource.href)
                      ? "bg-accent/20 text-foreground"
                      : "hover:bg-accent/10 text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <resource.icon className="h-4 w-4" />
                  {resource.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 space-y-1">
              <p className="px-3 text-sm font-medium text-muted-foreground">Company</p>
              {[
                { name: 'Agency', href: '/agency', icon: Building },
                { name: 'Pricing', href: '/pricing', icon: Settings },
                { name: 'About', href: '/about', icon: Users },
                { name: 'Contact', href: '/contact', icon: MessageSquare }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-accent/20 text-foreground"
                      : "hover:bg-accent/10 text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-6 px-3 space-y-3">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={handleStartAnalysis}
              >
                Start Free Brand Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.div>
  );
}