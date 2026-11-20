'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cuesToSrt, cuesToVtt, groupCues, type Caption } from '@/lib/local/captions';
import { downloadBlob } from '@/lib/local/fs-access';

interface CaptionPlayerProps {
  audioUrl: string;
  captions: Caption[];
  /** Base filename for downloads (without extension). */
  filename?: string;
  /** True when timings are estimated from text length rather than measured. */
  estimated?: boolean;
  language?: string;
}

/**
 * Audio player with a WebVTT caption track (<track>), live cue text and .vtt/.srt downloads.
 * Works in every browser that supports <track>; the downloads work everywhere.
 */
export default function CaptionPlayer({ audioUrl, captions, filename = 'captions', estimated, language = 'en' }: CaptionPlayerProps) {
  const cues = useMemo(() => groupCues(captions), [captions]);
  const vtt = useMemo(() => cuesToVtt(cues), [cues]);
  const [trackUrl, setTrackUrl] = useState('');
  const [current, setCurrent] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    setTrackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [vtt]);

  if (!cues.length) return null;

  return (
    <div className="space-y-2" data-testid="caption-player">
      <audio
        controls
        src={audioUrl}
        className="w-full"
        onTimeUpdate={(e) => {
          const ms = e.currentTarget.currentTime * 1000;
          setCurrent(cues.find((c) => ms >= c.startMs && ms < c.endMs)?.text ?? '');
        }}
      >
        {trackUrl && <track kind="captions" srcLang={language} label="Captions" src={trackUrl} default />}
      </audio>
      <p className="min-h-[1.5rem] text-sm text-center" aria-live="polite">{current}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => downloadBlob(new Blob([vtt], { type: 'text/vtt' }), `${filename}.vtt`)}>
          <Download className="h-4 w-4 mr-1" />Captions (.vtt)
        </Button>
        <Button size="sm" variant="outline" onClick={() => downloadBlob(new Blob([cuesToSrt(cues)], { type: 'text/plain' }), `${filename}.srt`)}>
          <Download className="h-4 w-4 mr-1" />Subtitles (.srt)
        </Button>
        {estimated && <span className="text-xs text-muted-foreground">Timing is estimated from the text.</span>}
      </div>
    </div>
  );
}
