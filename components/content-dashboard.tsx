'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from '@/components/export-dialog';
import { getContentItems, getVoiceProfiles, getImageAssets } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { 
  FileAudio, 
  Image, 
  Mic, 
  Upload, 
  Plus, 
  Download, 
  Trash2, 
  Music,
  Play,
  Pause,
  BookOpen,
  Headphones,
  FileVideo,
  Grid,
  LayoutGrid,
  AlignJustify,
  Filter,
  Search,
  Loader2,
  Camera,
  RefreshCw
} from 'lucide-react';
import { Input } from './ui/input';

export function ContentDashboard() {
  const [activeTab, setActiveTab] = useState('voice');
  const [contentItems, setContentItems] = useState([]);
  const [voiceProfiles, setVoiceProfiles] = useState([]);
  const [imageAssets, setImageAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'voice') {
        try {
          const items = await getContentItems();
          setContentItems(items);
        } catch (e) {
          console.error('Error loading content items:', e);
          setError('Failed to load voice content. Using sample data instead.');
          setContentItems([
            {
              id: 'sample-1',
              title: 'Sample Podcast',
              type: 'podcast',
              url: 'https://example.com/sample.mp3',
              metadata: { duration: 180 },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: 'sample-user'
            },
            {
              id: 'sample-2',
              title: 'Sample Audiobook',
              type: 'audiobook',
              url: 'https://example.com/sample-book.mp3',
              metadata: { duration: 360 },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: 'sample-user'
            }
          ]);
        }
        
        try {
          const profiles = await getVoiceProfiles();
          setVoiceProfiles(profiles);
        } catch (e) {
          console.error('Error loading voice profiles:', e);
        }
      } else if (activeTab === 'images') {
        try {
          const assets = await getImageAssets();
          setImageAssets(assets);
        } catch (e) {
          console.error('Error loading image assets:', e);
          setError('Failed to load image assets. Using sample data instead.');
          setImageAssets([
            {
              id: 'sample-1',
              title: 'Sample Logo',
              url: 'https://images.unsplash.com/photo-1557683316-973673baf926',
              tags: ['logo', 'sample'],
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: 'sample-user'
            }
          ]);
        }
      }
    } catch (error) {
      console.error(`Failed to load ${activeTab} content:`, error);
      setError(`Failed to load ${activeTab} content. Please check your database connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterVoiceContent = () => {
    return contentItems.filter(item => {
      // Filter by type
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  const filterImageAssets = () => {
    return imageAssets.filter(asset => {
      // Filter by search term
      if (searchTerm && !asset.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by tag if selectedType is not 'all'
      if (selectedType !== 'all' && asset.tags && !asset.tags.includes(selectedType)) {
        return false;
      }
      
      return true;
    });
  };

  const getVoiceTypeBadge = (type: string) => {
    switch (type) {
      case 'podcast':
        return (
          <Badge variant="outline" className="bg-blue-500/10">
            <Music className="h-3 w-3 mr-1" />
            Podcast
          </Badge>
        );
      case 'audiobook':
        return (
          <Badge variant="outline" className="bg-amber-500/10">
            <BookOpen className="h-3 w-3 mr-1" />
            Audiobook
          </Badge>
        );
      case 'voice_over':
        return (
          <Badge variant="outline" className="bg-purple-500/10">
            <Headphones className="h-3 w-3 mr-1" />
            Voice Over
          </Badge>
        );
      case 'video':
        return (
          <Badge variant="outline" className="bg-green-500/10">
            <FileVideo className="h-3 w-3 mr-1" />
            Video
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileAudio className="h-3 w-3 mr-1" />
            {type}
          </Badge>
        );
    }
  };

  const renderVoiceContent = () => {
    const filteredContent = filterVoiceContent();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-lg w-full">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadContent}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }
    
    if (filteredContent.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileAudio className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No Voice Content Found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {searchTerm || selectedType !== 'all' ? 
              'No content matches your current filters. Try different search terms or filters.' : 
              'You haven\'t created any voice content yet. Get started by creating a podcast, audiobook, or voice over.'}
          </p>
          <div className="flex gap-3">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Content
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
          </div>
        </div>
      );
    }
    
    if (viewType === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col h-full">
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <div>
                    {getVoiceTypeBadge(item.type)}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-medium mt-2 mb-1 truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground mb-auto">
                  Created: {formatDate(item.created_at)}
                </p>
                <div className="flex justify-between mt-4 pt-2 border-t">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredContent.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getVoiceTypeBadge(item.type)}
                <h3 className="font-medium">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Created: {formatDate(item.created_at)}
                {item.metadata?.duration && ` • Duration: ${Math.floor(item.metadata.duration / 60)}:${(item.metadata.duration % 60).toString().padStart(2, '0')}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon">
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderImageAssets = () => {
    const filteredAssets = filterImageAssets();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-lg w-full">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={loadContent}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }
    
    if (filteredAssets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Image className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No Image Assets Found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {searchTerm || selectedType !== 'all' ? 
              'No images match your current filters. Try different search terms or filters.' : 
              'You haven\'t created any image assets yet. Generate new images or upload existing ones.'}
          </p>
          <div className="flex gap-3">
            <Button>
              <Camera className="h-4 w-4 mr-2" />
              Generate Image
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </div>
      );
    }
    
    if (viewType === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img 
                  src={asset.url} 
                  alt={asset.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                  <h3 className="font-medium text-white truncate max-w-[80%]">{asset.title}</h3>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 flex-wrap">
                    {asset.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {asset.tags && asset.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{asset.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="flex items-center gap-4 p-3 border rounded-md">
            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
              <img 
                src={asset.url} 
                alt={asset.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1">{asset.title}</h3>
              <div className="flex gap-1 flex-wrap">
                {asset.tags?.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {asset.tags && asset.tags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{asset.tags.length - 5}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="voice" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 items-start sm:items-center">
          <TabsList>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Voice Content
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image Assets
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content..."
              className="h-8 sm:w-60"
            />
            
            <div className="flex-shrink-0 border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-l-md ${viewType === 'grid' ? 'bg-accent' : ''}`}
                onClick={() => setViewType('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-r-md border-l ${viewType === 'list' ? 'bg-accent' : ''}`}
                onClick={() => setViewType('list')}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={loadContent}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filter row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant={selectedType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedType('all')}
          >
            All
          </Badge>
          
          {activeTab === 'voice' ? (
            <>
              <Badge 
                variant={selectedType === 'podcast' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('podcast')}
              >
                <Music className="h-3 w-3 mr-1" />
                Podcasts
              </Badge>
              <Badge 
                variant={selectedType === 'audiobook' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('audiobook')}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Audiobooks
              </Badge>
              <Badge 
                variant={selectedType === 'voice_over' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('voice_over')}
              >
                <Headphones className="h-3 w-3 mr-1" />
                Voice Overs
              </Badge>
              <Badge 
                variant={selectedType === 'video' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('video')}
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Videos
              </Badge>
            </>
          ) : (
            <>
              <Badge 
                variant={selectedType === 'logo' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('logo')}
              >
                Logos
              </Badge>
              <Badge 
                variant={selectedType === 'illustration' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('illustration')}
              >
                Illustrations
              </Badge>
              <Badge 
                variant={selectedType === 'branding' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('branding')}
              >
                Branding
              </Badge>
              <Badge 
                variant={selectedType === 'modern' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedType('modern')}
              >
                Modern
              </Badge>
            </>
          )}
        </div>
        
        <TabsContent value="voice">
          {renderVoiceContent()}
        </TabsContent>
        
        <TabsContent value="images">
          {renderImageAssets()}
        </TabsContent>
      </Tabs>
    </div>
  );
}