'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Wand2, 
  Sparkles, 
  Brain, 
  Music, 
  Volume2, 
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { enhanceAudioQuality } from '@/lib/services/eleven-labs';

interface VoiceEnhancementProps {
  onEnhancementComplete?: (enhancedAudio: Blob) => void;
}

export function VoiceEnhancement({ onEnhancementComplete }: VoiceEnhancementProps) {
  const [inputText, setInputText] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enhancedAudioUrl, setEnhancedAudioUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    clarity: 0.75,
    emotion: 0.5,
    pacing: 0.5,
    naturalness: 0.8,
    volume: 0.5
  });

  const handleEnhance = async () => {
    if (!inputText) return;

    setEnhancing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 500);

    try {
      const response = await fetch('/api/voice/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          settings
        })
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const { audioUrl } = await response.json();
      setEnhancedAudioUrl(audioUrl);
      
      if (onEnhancementComplete) {
        const audioResponse = await fetch(audioUrl);
        const audioBlob = await audioResponse.blob();
        onEnhancementComplete(audioBlob);
      }

      setProgress(100);
    } catch (error) {
      console.error('Enhancement failed:', error);
    } finally {
      clearInterval(progressInterval);
      setEnhancing(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium">Voice Enhancement</h3>
            <p className="text-sm text-muted-foreground">
              Enhance voice content with AI optimization
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Enter text to enhance..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <h4 className="font-medium">Content Enhancement</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Clarity Enhancement</Label>
                <Slider
                  value={[settings.clarity * 100]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, clarity: value / 100 }))}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Emotional Expression</Label>
                <Slider
                  value={[settings.emotion * 100]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, emotion: value / 100 }))}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Natural Pacing</Label>
                <Slider
                  value={[settings.pacing * 100]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, pacing: value / 100 }))}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-purple-400" />
              <h4 className="font-medium">Audio Enhancement</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Naturalness</Label>
                <Slider
                  value={[settings.naturalness * 100]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, naturalness: value / 100 }))}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Output Volume</Label>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Slider
                    value={[settings.volume * 100]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, volume: value / 100 }))}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Button
          className="w-full"
          onClick={handleEnhance}
          disabled={!inputText || enhancing}
        >
          {enhancing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance Voice Content
            </>
          )}
        </Button>

        {enhancing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {progress < 100 ? 'Enhancing voice content...' : 'Done!'}
            </p>
          </div>
        )}

        {enhancedAudioUrl && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Enhanced Audio</h4>
                <Button variant="outline" size="sm" asChild>
                  <a href={enhancedAudioUrl} download="enhanced-voice.mp3">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
              <audio controls className="w-full">
                <source src={enhancedAudioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}