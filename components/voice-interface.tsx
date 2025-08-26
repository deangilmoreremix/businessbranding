'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WebsiteAnalyzer } from '@/components/website-analyzer';
import { createContentItem } from '@/lib/supabase';
import { generateVoiceOver, getAvailableVoices, createPodcast, createAudiobook, transcribeAudio, getTranscriptionModels } from '@/lib/services/eleven-labs';
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
  Globe
} from 'lucide-react';

interface PodcastSegment {
  id: string;
  text: string;
  voiceId: string;
}

interface AudiobookChapter {
  id: string;
  title: string;
  text: string;
  voiceId: string;
}

export function VoiceInterface() {
  // Voice selection state
  const [selectedVoiceId, setSelectedVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // Default voice
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  
  // Text-to-speech state
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [contentTitle, setContentTitle] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Podcast state
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastSegments, setPodcastSegments] = useState<PodcastSegment[]>([
    { id: '1', text: '', voiceId: '21m00Tcm4TlvDq8ikWAM' }
  ]);
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [podcastAudioSrc, setPodcastAudioSrc] = useState<string | null>(null);
  
  // Audiobook state
  const [audiobookTitle, setAudiobookTitle] = useState('');
  const [audiobookAuthor, setAudiobookAuthor] = useState('');
  const [audiobookNarrator, setAudiobookNarrator] = useState('');
  const [audiobookChapters, setAudiobookChapters] = useState<AudiobookChapter[]>([
    { id: '1', title: 'Chapter 1', text: '', voiceId: '21m00Tcm4TlvDq8ikWAM' }
  ]);
  const [generatingAudiobook, setGeneratingAudiobook] = useState(false);
  const [audiobookAudioSrc, setAudiobookAudioSrc] = useState<string | null>(null);
  
  // Settings state
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  
  // Transcription state
  const [selectedTranscriptionFile, setSelectedTranscriptionFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string>('en');
  const [speakerCount, setSpeakerCount] = useState<number>(1);
  const [wordTimingEnabled, setWordTimingEnabled] = useState<boolean>(false);
  const [transcriptionModels, setTranscriptionModels] = useState<any[]>([]);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string>('scribe-v1');

  // Load voices and transcription models on component mount
  useEffect(() => {
    loadVoices();
    loadModels();

    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => {
          setIsPlaying(false);
        });
      }
    };
  }, []);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause when isPlaying state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play audio:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Set audio source when audioSrc state changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
    }
  }, [audioSrc]);

  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      const voices = await getAvailableVoices();
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Failed to load voices:', error);
      // Set default voices if fetch fails
      setAvailableVoices([
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'professional' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'casual' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Antoni', category: 'professional' }
      ]);
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadModels = async () => {
    try {
      const models = await getTranscriptionModels();
      setTranscriptionModels(models);
    } catch (error) {
      console.error('Failed to load transcription models:', error);
      // Set default models if fetch fails
      setTranscriptionModels([
        { model_id: 'scribe-v1', name: 'Scribe V1', description: 'Standard transcription model' },
        { model_id: 'scribe-premium-v1', name: 'Scribe Premium V1', description: 'High-accuracy transcription model' }
      ]);
    }
  };

  const handleWebsiteAnalysis = (info: any) => {
    setInputText(info.analysis);
  };

  return (
    <div className="space-y-6">
      <WebsiteAnalyzer onAnalysisComplete={handleWebsiteAnalysis} />

      <Card className="p-6">
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

          {/* Rest of the existing TabsContent components remain unchanged */}
          {/* ... */}
        </Tabs>
      </Card>
    </div>
  );
}