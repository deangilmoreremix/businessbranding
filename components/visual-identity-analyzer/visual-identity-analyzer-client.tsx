'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Upload, 
  Wand2, 
  Download, 
  AlertTriangle, 
  Loader2,
  Plus,
  X,
  Camera,
  RefreshCw
} from 'lucide-react';
import { transformImage } from '@/lib/services/recraft';
import { API_KEYS } from '@/lib/api-config';
import { extractTagsFromPrompt } from '@/lib/services/image-service';
import { createImageAsset } from '@/lib/supabase';
import { BrandPresenceAnalyzer } from '@/components/brand-presence-analyzer';

interface VisualIdentityAnalyzerProps {
  onAnalysisComplete: (info: {
    assets: string[];
    colors: string[];
    fonts: string[];
    analysis: string;
  }) => void;
}

export default function VisualIdentityAnalyzerClient({ onAnalysisComplete }: VisualIdentityAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [transformPrompt, setTransformPrompt] = useState('');
  const [transformStyle, setTransformStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [transformedImages, setTransformedImages] = useState<string[]>([]);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [imageTitle, setImageTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTransformImage = async () => {
    if (!previewUrl || !transformPrompt) {
      setError('Image and prompt are required');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 1000);

    try {
      const extractedTags = extractTagsFromPrompt(transformPrompt);
      setTags(extractedTags);
      setImageTitle(transformPrompt.split('.')[0]);
      
      const result = await transformImage(
        previewUrl,
        transformPrompt,
        transformStyle || undefined
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result && result.images && result.images.length > 0) {
        setTransformedImages(prev => [...prev, ...result.images]);
        setShowSaveForm(true);
      } else {
        throw new Error('No images were generated');
      }
    } catch (error) {
      console.error('Failed to transform image:', error);
      setError(error instanceof Error ? error.message : 'Failed to transform image');
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const handleSaveImage = async (imageUrl: string) => {
    try {
      if (!imageTitle) {
        setError('Please provide a title for this image');
        return;
      }
      
      const imageAsset = {
        title: imageTitle,
        url: imageUrl,
        prompt: transformPrompt,
        style: transformStyle || undefined,
        source: 'recraft' as const,
        tags,
        metadata: {
          width: 1024,
          height: 1024,
          format: 'png',
          generated: true
        },
        user_id: 'user-id'
      };
      
      await createImageAsset(imageAsset);
      setSavedImages(prev => [...prev, imageUrl]);
      
      return true;
    } catch (error) {
      console.error('Failed to save image to library:', error);
      setError('Failed to save image to library');
      return false;
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-8">
      <BrandPresenceAnalyzer 
        onAnalysisComplete={(info) => {
          if (onAnalysisComplete) {
            onAnalysisComplete({
              assets: [],
              colors: [],
              fonts: [],
              analysis: info.analysis
            });
          }
        }}
      />

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Visual Asset Generation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your brand assets or enter prompts to generate new ones
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-400" />
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Wand2 className="h-5 w-5 text-purple-400" />
              <div className="flex-1">
                <Input
                  placeholder="Enter transformation prompt..."
                  value={transformPrompt}
                  onChange={(e) => setTransformPrompt(e.target.value)}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-pink-400" />
              <div className="flex-1">
                <select
                  className="w-full p-2 rounded-md bg-background/50 backdrop-blur-sm border border-input"
                  value={transformStyle}
                  onChange={(e) => setTransformStyle(e.target.value)}
                >
                  <option value="">Select a style preset</option>
                  <option value="3d-model">3D Model</option>
                  <option value="analog-film">Analog Film</option>
                  <option value="anime">Anime</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="comic-book">Comic Book</option>
                  <option value="digital-art">Digital Art</option>
                  <option value="enhance">Enhance</option>
                  <option value="fantasy-art">Fantasy Art</option>
                  <option value="isometric">Isometric</option>
                  <option value="line-art">Line Art</option>
                  <option value="low-poly">Low Poly</option>
                  <option value="neon-punk">Neon Punk</option>
                  <option value="origami">Origami</option>
                  <option value="photographic">Photographic</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="tile-texture">Tile Texture</option>
                </select>
              </div>
            </div>

            {previewUrl && transformPrompt && (
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                onClick={handleTransformImage}
                disabled={loading || !previewUrl || !transformPrompt}
              >
                {loading ? 'Transforming...' : 'Transform Image with Recraft AI'}
              </Button>
            )}

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Transforming image...
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            {transformedImages.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Generated Images</h4>
                
                {showSaveForm && (
                  <div className="space-y-4 p-4 bg-accent/10 rounded-lg mb-4">
                    <h5 className="font-medium">Save to Image Library</h5>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image Title</label>
                      <Input 
                        value={imageTitle}
                        onChange={(e) => setImageTitle(e.target.value)}
                        placeholder="Enter a descriptive title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button 
                              type="button" 
                              className="ml-1 rounded-full hover:bg-accent/30 p-1"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="w-full"
                      onClick={() => setShowSaveForm(false)}
                    >
                      Done
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {transformedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Generated ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            const success = await handleSaveImage(image);
                            if (success) {
                              setSavedImages(prev => [...prev, image]);
                            }
                          }}
                          disabled={savedImages.includes(image)}
                        >
                          {savedImages.includes(image) ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-500" />
                              Saved to Library
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Save to Library
                            </>
                          )}
                        </Button>
                      </div>
                      {savedImages.includes(image) && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Saved
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}