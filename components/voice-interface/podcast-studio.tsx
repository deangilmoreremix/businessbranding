'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Music, 
  Plus, 
  Trash2, 
  Download, 
  Play, 
  Pause,
  Loader2,
  FileMusic
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { createPodcastWithTimings } from '@/lib/services/voice';
import { captionsFromSegments } from '@/lib/local/captions';

const CaptionPlayer = dynamic(() => import('@/components/local/caption-player'), { ssr: false, loading: () => null });
import { saveGeneratedAudio, wavDurationSeconds, type SavedAudio } from '@/lib/local/content-save';

interface PodcastSegment {
  id: string;
  text: string;
  voiceId: string;
}

export function PodcastStudio() {
  const [saved, setSaved] = useState<SavedAudio | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [segments, setSegments] = useState<PodcastSegment[]>([
    { id: '1', text: '', voiceId: 'marin' }
  ]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [captionSource, setCaptionSource] = useState<{ text: string; durationMs: number }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const addSegment = () => {
    setSegments([
      ...segments,
      { 
        id: String(segments.length + 1), 
        text: '', 
        voiceId: 'marin' 
      }
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter(segment => segment.id !== id));
    }
  };

  const updateSegment = (id: string, updates: Partial<PodcastSegment>) => {
    setSegments(segments.map(segment => 
      segment.id === id ? { ...segment, ...updates } : segment
    ));
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const generatePodcast = async () => {
    if (!title || generating || segments.some(s => !s.text)) return;

    setGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 500);

    try {
      // Generate the podcast with OpenAI text-to-speech (one voice per segment)
      
      const { blob: audioBlob, durationsMs } = await createPodcastWithTimings(title, segments.map(s => ({
        text: s.text,
        voiceId: s.voiceId
      })));
      // Snapshot text + clip durations so captions stay correct if the segments are edited afterwards
      setCaptionSource(segments.map((s, i) => ({ text: s.text, durationMs: durationsMs[i] ?? 0 })));
      
      // Revoke previous URL to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Create URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Reset audio element
      if (audioElement) {
        audioElement.pause();
      }
      setAudioElement(null);
      setIsPlaying(false);
      
      // Keep the audio on this device and, when signed in, a metadata row in the account
      setSaved(await saveGeneratedAudio({
        title,
        type: 'podcast',
        blob: audioBlob,
        durationSec: durationsMs.reduce((a, b) => a + b, 0) / 1000 || (await wavDurationSeconds(audioBlob)),
        metadata: { description, segments: segments.map((x) => ({ text: x.text, voiceId: x.voiceId })) }
      }));

      setProgress(100);
    } catch (error) {
      console.error('Failed to generate podcast:', error);
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Music className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium">Podcast Studio</h3>
            <p className="text-sm text-muted-foreground">
              Create professional podcasts with multiple voices
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Podcast Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter podcast title"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter podcast description"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Segments</h4>
            <Button variant="outline" onClick={addSegment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>

          {segments.map((segment, index) => (
            <Card key={segment.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Segment {index + 1}</h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSegment(segment.id)}
                    disabled={segments.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={segment.voiceId}
                      onValueChange={(value) => updateSegment(segment.id, { voiceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="marin">Marin</SelectItem>
                          <SelectItem value="cedar">Cedar</SelectItem>
                          <SelectItem value="alloy">Alloy</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Script</Label>
                    <Textarea
                      value={segment.text}
                      onChange={(e) => updateSegment(segment.id, { text: e.target.value })}
                      placeholder="Enter segment script"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={generatePodcast}
          disabled={generating || !title || segments.some(s => !s.text)}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Podcast...
            </>
          ) : (
            <>
              <FileMusic className="mr-2 h-4 w-4" />
              Generate Podcast
            </>
          )}
        </Button>

        {generating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Generating podcast content...
            </p>
          </div>
        )}

        {audioUrl && !generating && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Generated Podcast</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={togglePlayback}>
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={audioUrl} download={`${title}.wav`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
              {saved && <p role="status" data-testid="save-status" className="text-xs text-muted-foreground">{saved.local ? 'Saved on this device.' : 'Not saved (browser storage unavailable).'} {saved.cloud ? 'Also saved to your account.' : saved.cloudReason}</p>}
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              {captionSource.length > 0 && (
                <CaptionPlayer audioUrl={audioUrl} captions={captionsFromSegments(captionSource)} filename={title || 'podcast'} />
              )}
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}