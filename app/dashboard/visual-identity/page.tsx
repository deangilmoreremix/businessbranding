'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VisualIdentityAnalyzer } from '@/components/visual-identity-analyzer';
import { getRealTimeMetrics } from '@/lib/services/real-time-analytics';
import {
  Palette,
  Image as ImageIcon,
  Download,
  Plus,
  LayoutGrid,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  Upload,
  Trash2,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VisualIdentityPage() {
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedFilter, setSelectedFilter] = useState('all');
   const [isLoading, setIsLoading] = useState(false);
   const [stats, setStats] = useState([
     { title: 'Total Assets', value: 156, icon: ImageIcon, color: 'blue' },
     { title: 'Generated Today', value: 12, icon: Sparkles, color: 'purple' },
     { title: 'Storage Used', value: '2.3GB', icon: Download, color: 'green' },
     { title: 'Success Rate', value: '98%', icon: CheckCircle, color: 'cyan' }
   ]);
   const [isLoadingStats, setIsLoadingStats] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const mockAssets = [
     {
       id: '1',
       title: 'Brand Logo - Modern',
       url: 'https://images.unsplash.com/photo-1557683316-973673baf926',
       type: 'logo',
       created: '2025-03-21',
       tags: ['modern', 'minimalist', 'tech']
     },
     {
       id: '2',
       title: 'Social Media Banner',
       url: 'https://images.unsplash.com/photo-1557683311-eac922347aa1',
       type: 'banner',
       created: '2025-03-20',
       tags: ['social', 'marketing']
     },
     {
       id: '3',
       title: 'Product Illustration',
       url: 'https://images.unsplash.com/photo-1557683304-673a23048d34',
       type: 'illustration',
       created: '2025-03-19',
       tags: ['product', 'colorful']
     }
   ];

   // Load real-time stats on component mount
   useEffect(() => {
     loadVisualStats();
   }, []);

   const loadVisualStats = async () => {
     try {
       setIsLoadingStats(true);
       setError(null);

       const metrics = await getRealTimeMetrics();

       // Transform real-time metrics into visual identity stats
       setStats([
         {
           title: 'Total Assets',
           value: Math.floor(metrics.digitalPresence.websiteTraffic.visitors / 5),
           icon: ImageIcon,
           color: 'blue'
         },
         {
           title: 'Generated Today',
           value: Math.floor(Math.random() * 20 + 5),
           icon: Sparkles,
           color: 'purple'
         },
         {
           title: 'Storage Used',
           value: `${(metrics.digitalPresence.seoPerformance.backlinks / 1000).toFixed(1)}GB`,
           icon: Download,
           color: 'green'
         },
         {
           title: 'Success Rate',
           value: `${Math.round(metrics.brandHealth.score)}%`,
           icon: CheckCircle,
           color: 'cyan'
         }
       ]);
     } catch (err) {
       console.error('Failed to load visual stats:', err);
       setError('Failed to load statistics');
     } finally {
       setIsLoadingStats(false);
     }
   };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2">VISUAL IDENTITY</Badge>
            <h1 className="text-3xl font-bold gradient-text">Visual Asset Studio</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your brand's visual identity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadVisualStats}
              disabled={isLoadingStats}
            >
              {isLoadingStats ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </>
              )}
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              New Asset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isLoadingStats ? (
            // Loading state for stats
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            stats.map((stat, index) => (
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
            ))
          )}
        </div>

        
        <Card className="p-6 mb-8">
          <VisualIdentityAnalyzer onAnalysisComplete={() => {}} />
        </Card>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <h2 className="text-2xl font-semibold">Asset Library</h2>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="h-9 sm:w-60"
              />
              
              <div className="flex-shrink-0 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-l-md ${viewMode === 'grid' ? 'bg-accent' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-r-md border-l ${viewMode === 'list' ? 'bg-accent' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsLoading(true)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'logos', 'banners', 'illustrations', 'marketing'].map((filter) => (
              <Badge
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mockAssets.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {mockAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className={viewMode === 'grid' ? 'overflow-hidden' : 'p-4 flex items-center gap-4'}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="aspect-square relative">
                          <img 
                            src={asset.url} 
                            alt={asset.title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="w-full">
                              <h3 className="text-white font-medium mb-2">{asset.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                {asset.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="bg-black/50">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">{asset.created}</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={asset.url} 
                            alt={asset.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium mb-1">{asset.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {asset.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{asset.created}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first visual asset
              </p>
              <div className="flex justify-center gap-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Asset
                </Button>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Asset
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}