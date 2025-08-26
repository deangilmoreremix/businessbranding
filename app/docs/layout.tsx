'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Brain,
  Palette,
  MessageSquare,
  BookOpen,
  Settings,
  Users,
  BarChart,
  Globe,
  Layers,
  Target,
  Star,
  HeadphonesIcon,
  Wand2
} from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Introduction',
        href: '/docs',
        icon: FileText
      },
      {
        title: 'AI Features',
        href: '/docs/gemini-features',
        icon: Brain
      },
      {
        title: 'Voice Features',
        href: '/docs/voice-features',
        icon: MessageSquare
      }
    ]
  },
  {
    title: 'Components',
    items: [
      {
        title: 'Brand Analysis',
        href: '/docs/components/brand-analysis',
        icon: BarChart
      },
      {
        title: 'Visual Identity',
        href: '/docs/components/visual-identity',
        icon: Palette
      },
      {
        title: 'Voice Interface',
        href: '/docs/components/voice-interface',
        icon: HeadphonesIcon
      },
      {
        title: 'Business Analyzer',
        href: '/docs/components/business-analyzer',
        icon: Globe
      },
      {
        title: 'Content Dashboard',
        href: '/docs/components/content-dashboard',
        icon: Layers
      },
      {
        title: 'Competitive Analysis',
        href: '/docs/components/competitive-analysis',
        icon: Target
      },
      {
        title: 'Brand Pillar Breakdown',
        href: '/docs/components/brand-pillar-breakdown',
        icon: Star
      },
      {
        title: 'Feature Discovery',
        href: '/docs/components/feature-discovery',
        icon: Wand2
      }
    ]
  },
  {
    title: 'Resources',
    items: [
      {
        title: 'Best Practices',
        href: '/docs/best-practices',
        icon: BookOpen
      },
      {
        title: 'Case Studies',
        href: '/docs/case-studies',
        icon: Users
      }
    ]
  }
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[240px_1fr] md:gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
        <div className="py-6 pr-6 lg:py-8">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-full py-6">
            <div className="space-y-8">
              {sidebarNavItems.map((section, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="font-medium">{section.title}</h4>
                  <div className="grid grid-flow-row auto-rows-max text-sm">
                    {section.items
                      .filter(item => 
                        !search || 
                        item.title.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((item, j) => (
                        <Link
                          key={j}
                          href={item.href}
                          className={cn(
                            "flex w-full items-center rounded-md p-2 hover:underline",
                            {
                              "bg-accent": pathname === item.href,
                            }
                          )}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_200px]">
        <div className="mx-auto w-full min-w-0">
          <div className="pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}