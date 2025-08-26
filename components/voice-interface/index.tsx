'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Music, 
  BookOpen, 
  Mic, 
  Brain as LucideBrain 
} from 'lucide-react';

const VoiceRecorder = dynamic(
  () => import('./voice-recorder').then(mod => mod.VoiceRecorder || mod),
  {
    loading: () => <LoadingSpinner message="Loading voice recorder..." />,
    ssr: false
  }
);

const PodcastStudio = dynamic(
  () => import('./podcast-studio').then(mod => mod.PodcastStudio || mod),
  {
    loading: () => <LoadingSpinner message="Loading podcast studio..." />,
    ssr: false
  }
);

const AudiobookCreator = dynamic(
  () => import('./audiobook-creator').then(mod => mod.AudiobookCreator || mod),
  {
    loading: () => <LoadingSpinner message="Loading audiobook creator..." />,
    ssr: false
  }
);

const VoiceTranscription = dynamic(
  () => import('./voice-transcription').then(mod => mod.VoiceTranscription || mod),
  {
    loading: () => <LoadingSpinner message="Loading transcription..." />,
    ssr: false
  }
);

const VoiceSettings = dynamic(
  () => import('./voice-settings').then(mod => mod.VoiceSettings || mod),
  {
    loading: () => <LoadingSpinner message="Loading settings..." />,
    ssr: false
  }
);

const VoiceAnalysis = dynamic(
  () => import('./voice-analysis').then(mod => mod.VoiceAnalysis || mod),
  {
    loading: () => <LoadingSpinner message="Loading voice analysis..." />,
    ssr: false
  }
);

const VoiceEnhancement = dynamic(
  () => import('./voice-enhancement').then(mod => mod.VoiceEnhancement || mod),
  {
    loading: () => <LoadingSpinner message="Loading voice enhancement..." />,
    ssr: false
  }
);

export function VoiceInterface() {
  return (
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
    </Card>
  );
}