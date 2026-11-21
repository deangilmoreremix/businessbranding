'use client';

import { useEffect, useState } from 'react';
import { loadVoicePrefs } from '@/lib/local/voice-prefs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ElapsedStatus } from '@/components/elapsed-status';
import { acceptAudio } from '@/lib/client/audio-check';
import { describeError } from '@/lib/client/ai-error';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AudioVisualizer } from './audio-visualizer';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Play, 
  Pause,
  Loader2,
  Settings,
  FileAudio,
  Bookmark
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { captionsFromSegments } from '@/lib/local/captions';
import { authFetch, toApiError } from '@/lib/client/auth-fetch';

const CaptionPlayer = dynamic(() => import('@/components/local/caption-player'), { ssr: false, loading: () => null });

interface Chapter {
  id: string;
  title: string;
  text: string;
  voiceId: string;
}

export function AudiobookCreator() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [narrator, setNarrator] = useState('');
  const [defaultVoice, setDefaultVoice] = useState('marin');
  useEffect(() => { loadVoicePrefs().then((p) => { setDefaultVoice(p.voiceId); setNarrator((n) => n || p.voiceId); }); }, []);
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', title: 'Chapter 1', text: '', voiceId: 'marin' }
  ]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [captionSource, setCaptionSource] = useState<{ text: string; durationMs: number }[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const addChapter = () => {
    setChapters([
      ...chapters,
      { 
        id: String(chapters.length + 1), 
        title: `Chapter ${chapters.length + 1}`, 
        text: '', 
        voiceId: defaultVoice 
      }
    ]);
  };

  const removeChapter = (id: string) => {
    setChapters(chapters.filter(chapter => chapter.id !== id));
  };

  const updateChapter = (id: string, updates: Partial<Chapter>) => {
    setChapters(chapters.map(chapter => 
      chapter.id === id ? { ...chapter, ...updates } : chapter
    ));
  };

  const generateAudiobook = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await authFetch('/api/voice/audiobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          narrator,
          chapters
        })
      });

      if (!response.ok) throw await toApiError(response, 'Audiobook generation failed');
      const blob = await acceptAudio(response);

      const durations = (response.headers.get('X-Segment-Durations') || '').split(',').filter(Boolean).map(Number);
      // Narration reads each chapter title before its text; mirror that in the captions
      setCaptionSource(chapters.map((c, i) => ({ text: `${c.title ? `${c.title}. ` : ''}${c.text}`, durationMs: durations[i] ?? 0 })));
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e) {
      setError(`${describeError(e).message} You can try again.`);
    } finally {
      setGenerating(false);
    }
  };

  const addBookmark = () => {
    setBookmarks([...bookmarks, currentTime]);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium">Audiobook Creator</h3>
            <p className="text-sm text-muted-foreground">
              Convert text to professional audiobooks
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Book Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
            />
          </div>

          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
            />
          </div>

          <div className="space-y-2">
            <Label>Narrator Voice</Label>
            <Select value={narrator} onValueChange={setNarrator}>
              <SelectTrigger>
                <SelectValue placeholder="Select narrator voice" />
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Chapters</h4>
            <Button variant="outline" onClick={addChapter}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
          </div>

          {chapters.map((chapter, index) => (
            <Card key={chapter.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                    placeholder="Chapter title"
                    className="max-w-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChapter(chapter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={chapter.voiceId}
                      onValueChange={(value) => updateChapter(chapter.id, { voiceId: value })}
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
                    <Label>Chapter Text</Label>
                    <Textarea
                      value={chapter.text}
                      onChange={(e) => updateChapter(chapter.id, { text: e.target.value })}
                      placeholder="Enter chapter text"
                      rows={6}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={generateAudiobook}
          disabled={generating || !title || !author || !narrator || chapters.some(c => !c.text)}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Audiobook...
            </>
          ) : (
            <>
              <FileAudio className="mr-2 h-4 w-4" />
              Generate Audiobook
            </>
          )}
        </Button>

        <ElapsedStatus active={generating} label="Generating audiobook…" />
        {error && <p role="alert" data-testid="voice-error" className="text-sm text-red-600 text-center">{error}</p>}

        {audioUrl && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Generated Audiobook</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={addBookmark}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Add Bookmark
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={audioUrl} download={`${title}.wav`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
              <AudioVisualizer
                audioUrl={audioUrl}
                height={80}
                waveColor="#8B5CF6"
                progressColor="#6366F1"
                onReady={() => setCurrentTime(0)}
              />
              {captionSource.length > 0 && (
                <CaptionPlayer audioUrl={audioUrl} captions={captionsFromSegments(captionSource)} filename={title || 'audiobook'} />
              )}
              {bookmarks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bookmarks.map((time, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const audio = document.querySelector('audio');
                        if (audio) audio.currentTime = time;
                      }}
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      {new Date(time * 1000).toISOString().substr(11, 8)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}