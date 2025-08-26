'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Upload, FileAudio, Loader2, Check } from 'lucide-react';

export function VoiceTranscription() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [speakerCount, setSpeakerCount] = useState(1);
  const [wordTiming, setWordTiming] = useState(false);
  const [model, setModel] = useState('scribe-v1');
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setTranscribing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('speakerCount', speakerCount.toString());
    formData.append('wordTiming', wordTiming.toString());
    formData.append('model', model);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setResult(data.text);
      setProgress(100);
    } catch (error) {
      console.error('Transcription failed:', error);
      setResult('Transcription failed. Please try again.');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Mic className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium">Audio Transcription</h3>
            <p className="text-sm text-muted-foreground">
              Convert audio to text with speaker detection
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audio File</Label>
              <Input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileAudio className="h-4 w-4" />
                <span>{file.name}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Speakers</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={speakerCount}
                  onChange={(e) => setSpeakerCount(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Transcription Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scribe-v1">Scribe V1</SelectItem>
                    <SelectItem value="scribe-premium-v1">Scribe Premium V1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Word-level Timing</Label>
                <Switch
                  checked={wordTiming}
                  onCheckedChange={setWordTiming}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleTranscribe}
              disabled={!file || transcribing}
            >
              {transcribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Transcription
                </>
              )}
            </Button>

            {transcribing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {progress < 100 ? 'Processing audio...' : 'Done!'}
                </p>
              </div>
            )}
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Transcription Result</h4>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result || '')} disabled={!result}>
                <Check className="mr-2 h-4 w-4" />
                Copy Text
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              {result ? (
                <p className="whitespace-pre-wrap text-sm">{result}</p>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Transcription results will appear here...</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </Card>
  );
}