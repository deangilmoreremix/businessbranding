'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', title: 'Chapter 1', text: '', voiceId: '21m00Tcm4TlvDq8ikWAM' }
  ]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  const addChapter = () => {
    setChapters([
      ...chapters,
      { 
        id: String(chapters.length + 1), 
        title: `Chapter ${chapters.length + 1}`, 
        text: '', 
        voiceId: '21m00Tcm4TlvDq8ikWAM' 
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
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 500);

    try {
      const response = await fetch('/api/voice/audiobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          narrator,
          chapters
        })
      });

      if (!response.ok) throw new Error('Audiobook generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setProgress(100);
    } catch (error) {
      console.error('Failed to generate audiobook:', error);
    } finally {
      clearInterval(progressInterval);
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
                  <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel</SelectItem>
                  <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella</SelectItem>
                  <SelectItem value="AZnzlk1XvdvUeBnXmlld">Antoni</SelectItem>
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
                          <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel</SelectItem>
                          <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella</SelectItem>
                          <SelectItem value="AZnzlk1XvdvUeBnXmlld">Antoni</SelectItem>
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

        {generating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Generating audiobook content...
            </p>
          </div>
        )}

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
                    <a href={audioUrl} download={`${title}.mp3`}>
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