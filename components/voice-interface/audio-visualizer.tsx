'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioVisualizerProps {
  audioUrl: string;
  onReady?: () => void;
  onFinish?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

export function AudioVisualizer({
  audioUrl,
  onReady,
  onFinish,
  height = 100,
  waveColor = '#4F46E5',
  progressColor = '#818CF8'
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      cursorWidth: 2,
      cursorColor: '#9CA3AF',
      normalize: true,
      responsive: true,
      fillParent: true,
      minPxPerSec: 50
    });

    // Load audio
    wavesurfer.load(audioUrl);

    // Event handlers
    wavesurfer.on('ready', () => {
      onReady?.();
    });

    wavesurfer.on('finish', () => {
      onFinish?.();
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, height, waveColor, progressColor, onReady, onFinish]);

  return <div ref={containerRef} className="w-full" />;
}