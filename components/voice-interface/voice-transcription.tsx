'use client';

import { useEffect, useState } from 'react';
import { loadVoicePrefs } from '@/lib/local/voice-prefs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ElapsedStatus } from '@/components/elapsed-status';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Upload, FileAudio, Loader2, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { captionsFromText } from '@/lib/local/captions';
import { authFetch, toApiError } from '@/lib/client/auth-fetch';

const AudioTrimmer = dynamic(() => import('@/components/local/audio-trimmer'), { ssr: false, loading: () => null });
const CaptionPlayer = dynamic(() => import('@/components/local/caption-player'), { ssr: false, loading: () => null });

export function VoiceTranscription() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  useEffect(() => { loadVoicePrefs().then((p) => setLanguage(p.language)); }, []);
  const [context, setContext] = useState('');
  const [onDevice, setOnDevice] = useState(false);
  const [modelStatus, setModelStatus] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Local preview + duration (used to time the caption track)
      setFileUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(selectedFile); });
      setDurationMs(0);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setTranscribing(true);
    setError(null);

    if (onDevice) {
      // Optional on-device Whisper (opt-in): the model is downloaded once and then cached by the browser.
      try {
        const { transcribeOnDevice } = await import('@/lib/local/whisper');
        setModelStatus('Preparing on-device model (first use downloads ~40-80 MB)…');
        const text = await transcribeOnDevice(file, (p) => {
          if (p.status === 'progress' && p.progress !== undefined) setModelStatus(`Downloading model… ${Math.round(p.progress)}%`);
        });
        setResult(text || 'No speech detected.');
      } catch (error) {
        console.error('On-device transcription failed:', error);
        setError('On-device transcription failed in this browser. Turn it off to use OpenAI transcription, or try again.');
      } finally {
        setModelStatus('');
        setTranscribing(false);
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    if (context.trim()) formData.append('prompt', context.trim());

    try {
      const response = await authFetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw await toApiError(response, 'Transcription failed');

      const data = await response.json();
      setResult(data.text);
    } catch (error) {
      setError(error instanceof Error ? `${error.message}. You can try again.` : 'Transcription failed. You can try again.');
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
            {file && file.type.startsWith('audio/') && (
              <AudioTrimmer blob={file} onTrim={(trimmed) => setFile(new File([trimmed], file.name.replace(/\.[^.]+$/, '') + '-trimmed.wav', { type: 'audio/wav' }))} />
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

              <div className="flex items-start gap-2 rounded border p-2">
                <input
                  id="on-device"
                  type="checkbox"
                  className="mt-1"
                  checked={onDevice}
                  onChange={(e) => setOnDevice(e.target.checked)}
                />
                <label htmlFor="on-device" className="text-xs text-muted-foreground">
                  Transcribe on this device with Whisper (private, free). Optional: downloads a ~40-80 MB model the first time,
                  English only, slower than OpenAI. Leave off to use OpenAI.
                </label>
              </div>
              {modelStatus && <p className="text-xs text-muted-foreground" role="status">{modelStatus}</p>}

              <div className="space-y-2">
                <Label>Context (optional)</Label>
                <Input
                  placeholder="Names, product terms or topic to help accuracy"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
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

            <ElapsedStatus active={transcribing} label="Transcribing…" />
            {error && <p role="alert" data-testid="voice-error" className="text-sm text-red-600 text-center">{error}</p>}
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Transcription Result</h4>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result || '')} disabled={!result}>
                <Check className="mr-2 h-4 w-4" />
                Copy Text
              </Button>
            </div>
            {fileUrl && (
              <audio
                src={fileUrl}
                className="hidden"
                onLoadedMetadata={(e) => setDurationMs(Number.isFinite(e.currentTarget.duration) ? Math.round(e.currentTarget.duration * 1000) : 0)}
              />
            )}
            <ScrollArea className="h-[400px]">
              {result ? (
                <p className="whitespace-pre-wrap text-sm">{result}</p>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Transcription results will appear here...</p>
                </div>
              )}
            </ScrollArea>
            {result && fileUrl && durationMs > 0 && !result.startsWith('Transcription failed') && !result.startsWith('On-device transcription failed') && (
              <div className="mt-4">
                <CaptionPlayer audioUrl={fileUrl} captions={captionsFromText(result, durationMs)} filename={file?.name.replace(/\.[^.]+$/, '') || 'transcript'} estimated />
              </div>
            )}
          </Card>
        </div>
      </div>
    </Card>
  );
}