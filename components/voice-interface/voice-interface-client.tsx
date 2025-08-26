'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AudioVisualizer } from './audio-visualizer';
import { VoiceControls } from './voice-controls';
import { VoiceRecorder } from './voice-recorder';
import { PodcastStudio } from './podcast-studio';
import { AudiobookCreator } from './audiobook-creator';
import { VoiceTranscription } from './voice-transcription';
import { VoiceSettings } from './voice-settings';
import { generateVoiceOver, getAvailableVoices } from '@/lib/services/eleven-labs';
import { 
  Play, 
  Pause, 
  VolumeX, 
  Volume2, 
  Upload, 
  Download, 
  Save, 
  Mic, 
  Music, 
  BookOpen, 
  MessageSquare, 
  Loader2, 
  FileAudio, 
  Check, 
  ChevronDown, 
  Headphones, 
  FileVideo, 
  Brain as LucideBrain,
  Plus,
  Trash2,
  Wand2
} from 'lucide-react';

export default function VoiceInterfaceClient() {
  const [selectedVoiceId, setSelectedVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voices = await getAvailableVoices();
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const handleGenerateVoice = async () => {
    if (!inputText || generating) return;

    setGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const audioBlob = await generateVoiceOver(inputText, selectedVoiceId);
      const url = URL.createObjectURL(audioBlob);
      setAudioSrc(url);
      setProgress(100);
    } catch (error) {
      console.error('Voice generation failed:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="voice-over" className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full">
          <TabsTrigger value="voice-over" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Voice Over
          </TabsTrigger>
          <TabsTrigger value="podcast" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Podcast
          </TabsTrigger>
          <TabsTrigger value="audiobook" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Audiobook
          </TabsTrigger>
          <TabsTrigger value="transcription" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Transcription
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <LucideBrain className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice-over">
          <VoiceRecorder />
        </TabsContent>

        <TabsContent value="podcast">
          <PodcastStudio />
        </TabsContent>

        <TabsContent value="audiobook">
          <AudiobookCreator />
        </TabsContent>

        <TabsContent value="transcription">
          <VoiceTranscription />
        </TabsContent>

        <TabsContent value="settings">
          <VoiceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}