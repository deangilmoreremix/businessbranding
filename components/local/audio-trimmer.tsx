'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Pause, Play, Scissors } from 'lucide-react';
import { computePeaks, decodeAudio, formatTime, trimAudioBlob, webAudioSupported, type DecodedAudio } from '@/lib/local/audio';
import { saveFile } from '@/lib/local/fs-access';

interface AudioTrimmerProps {
  blob: Blob;
  /** Called with the trimmed WAV so the host can replace its recording. */
  onTrim?: (trimmed: Blob) => void;
}

const W = 600;
const H = 80;

/**
 * Waveform view (Web Audio decode + canvas) with start/end handles, range preview and WAV export.
 * Renders nothing when the Web Audio API is unavailable or the clip cannot be decoded.
 */
export default function AudioTrimmer({ blob, onTrim }: AudioTrimmerProps) {
  const [audio, setAudio] = useState<DecodedAudio | null>(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    if (!webAudioSupported()) { setFailed(true); return; }
    decodeAudio(blob)
      .then((a) => { if (alive) { setAudio(a); setRange([0, a.duration]); setFailed(false); } })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [blob]);

  useEffect(() => {
    if (!audio || !canvas.current) return;
    const ctx = canvas.current.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const peaks = computePeaks(audio.channels[0], W);
    const [s, e] = range;
    peaks.forEach((p, x) => {
      const t = (x / W) * audio.duration;
      ctx.fillStyle = t >= s && t <= e ? '#6366f1' : '#9ca3af';
      ctx.fillRect(x, H / 2 + p.min * (H / 2), 1, Math.max(1, (p.max - p.min) * (H / 2)));
    });
  }, [audio, range]);

  useEffect(() => () => { player.current?.pause(); }, []);

  if (failed || !audio) return failed ? null : <p className="text-xs text-muted-foreground">Loading waveform…</p>;

  const preview = () => {
    if (playing) { player.current?.pause(); setPlaying(false); return; }
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    player.current = el;
    el.currentTime = range[0];
    el.ontimeupdate = () => { if (el.currentTime >= range[1]) { el.pause(); setPlaying(false); } };
    el.onended = () => setPlaying(false);
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const trimmed = () => trimAudioBlob(blob, range[0], range[1]);
  const full = range[0] === 0 && range[1] >= audio.duration - 0.01;

  return (
    <div className="space-y-2" data-testid="audio-trimmer">
      <canvas ref={canvas} width={W} height={H} className="w-full rounded bg-muted" aria-label="Audio waveform" />
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1">Start
          <input type="range" min={0} max={audio.duration} step={0.05} value={range[0]} aria-label="Trim start"
            onChange={(e) => setRange([Math.min(Number(e.target.value), range[1] - 0.1), range[1]])} />
          {formatTime(range[0])}
        </label>
        <label className="flex items-center gap-1">End
          <input type="range" min={0} max={audio.duration} step={0.05} value={range[1]} aria-label="Trim end"
            onChange={(e) => setRange([range[0], Math.max(Number(e.target.value), range[0] + 0.1)])} />
          {formatTime(range[1])}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={preview}>{playing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}Preview selection</Button>
        <Button size="sm" variant="outline" disabled={full} onClick={async () => onTrim?.(await trimmed())}><Scissors className="h-4 w-4 mr-1" />Apply trim</Button>
        <Button size="sm" variant="outline" onClick={async () => { await saveFile(await trimmed(), 'clip.wav', { 'audio/wav': ['.wav'] }); }}><Download className="h-4 w-4 mr-1" />Save clip (.wav)</Button>
      </div>
    </div>
  );
}
