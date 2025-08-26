'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Mic, 
  Square, 
  Download, 
  Wand2, 
  Loader2,
  VolumeX,
  Volume2,
  Trash2,
  Play,
  Pause,
  Save
} from 'lucide-react';
import { generateVoiceOver } from '@/lib/services/eleven-labs';
import { createContentItem } from '@/lib/supabase';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [noiseReduction, setNoiseReduction] = useState(0.5);
  const [format, setFormat] = useState('mp3');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [saving, setSaving] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Create a title based on recording date
        const now = new Date();
        setContentTitle(`Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      // Stop all tracks on the stream
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const enhanceAudio = async () => {
    if (!recordedBlob) return;

    setProcessing(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const formData = new FormData();
      formData.append('audio', recordedBlob);
      formData.append('noiseReduction', noiseReduction.toString());

      const response = await fetch('/api/voice/enhance', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Enhancement failed');

      const enhancedBlob = await response.blob();
      setRecordedBlob(enhancedBlob);
      
      // Revoke previous URL to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      const url = URL.createObjectURL(enhancedBlob);
      setAudioUrl(url);
      setProgress(100);
    } catch (error) {
      console.error('Failed to enhance audio:', error);
    } finally {
      clearInterval(progressInterval);
      setProcessing(false);
    }
  };

  const downloadAudio = () => {
    if (!recordedBlob) return;
    
    // Create a download link
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording.${format}`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = volume;
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number) => {
    const newVolume = value / 100;
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSave = async () => {
    if (!recordedBlob || !contentTitle) return;
    
    setSaving(true);
    try {
      await createContentItem({
        title: contentTitle,
        type: 'voice_over',
        url: audioUrl || '',
        metadata: {
          format,
          duration: audioRef.current?.duration || 0,
          noiseReduction,
          createdAt: new Date().toISOString()
        },
        user_id: 'user-id' // This would be the real user ID in a production app
      });
    } catch (error) {
      console.error('Failed to save recording:', error);
    } finally {
      setSaving(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setRecordedBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setContentTitle('');
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Mic className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium">Voice Recording</h3>
            <p className="text-sm text-muted-foreground">
              Record and enhance voice content
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center">
          <Button
            size="lg"
            className={`rounded-full h-16 w-16 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>

        {isRecording && (
          <div className="text-center py-2">
            <div className="animate-pulse text-red-500 font-medium">Recording...</div>
          </div>
        )}

        {audioUrl && (
          <div className="space-y-4">
            <Label>Recording Title</Label>
            <input
              type="text"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="Enter a title for this recording"
              className="w-full p-2 rounded-md border border-input bg-background"
            />

            <div className="flex justify-between items-center">
              <Button onClick={togglePlayback} variant="outline">
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4" />
                <Slider
                  value={[volume * 100]}
                  onValueChange={([value]) => handleVolumeChange(value)}
                  max={100}
                  step={1}
                  className="w-[80px]"
                />
                <Volume2 className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Noise Reduction</Label>
                <Slider
                  value={[noiseReduction * 100]}
                  onValueChange={([value]) => setNoiseReduction(value / 100)}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                      <SelectItem value="m4a">M4A</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={enhanceAudio}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Enhance Audio
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={downloadAudio}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                onClick={clearRecording}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>

              <Button
                onClick={handleSave}
                disabled={!contentTitle || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </>
                )}
              </Button>
            </div>

            {processing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {progress < 100 ? 'Enhancing audio...' : 'Done!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}