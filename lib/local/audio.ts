/**
 * Web Audio helpers for the voice tools: waveform peaks, clip trimming and WAV encoding.
 * The pure parts (peaks / trim / encode) are unit-tested; decoding uses the browser's AudioContext.
 */

export const webAudioSupported = () => typeof window !== 'undefined' && (typeof AudioContext !== 'undefined' || 'webkitAudioContext' in window);

/** Min/max amplitude per bucket, for drawing a waveform. Values are in [-1, 1]. */
export function computePeaks(samples: Float32Array, buckets: number): { min: number; max: number }[] {
  const out: { min: number; max: number }[] = [];
  const size = Math.max(1, Math.floor(samples.length / buckets));
  for (let b = 0; b < buckets; b++) {
    let min = 0;
    let max = 0;
    const end = Math.min(samples.length, (b + 1) * size);
    for (let i = b * size; i < end; i++) {
      if (samples[i] < min) min = samples[i];
      if (samples[i] > max) max = samples[i];
    }
    out.push({ min, max });
  }
  return out;
}

/** Cut [startSec, endSec) out of every channel. Out-of-range values are clamped. */
export function trimChannels(channels: Float32Array[], sampleRate: number, startSec: number, endSec: number): Float32Array[] {
  const length = channels[0]?.length ?? 0;
  const from = Math.max(0, Math.min(length, Math.round(startSec * sampleRate)));
  const to = Math.max(from, Math.min(length, Math.round(endSec * sampleRate)));
  return channels.map((c) => c.slice(from, to));
}

/** Encode float channels as 16-bit PCM WAV (interleaved). */
export function encodeWav16(channels: Float32Array[], sampleRate: number): Uint8Array {
  const n = channels[0]?.length ?? 0;
  const ch = channels.length;
  const out = new Uint8Array(44 + n * ch * 2);
  const v = new DataView(out.buffer);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return out;
}

export interface DecodedAudio {
  channels: Float32Array[];
  sampleRate: number;
  duration: number;
}

export async function decodeAudio(blob: Blob): Promise<DecodedAudio> {
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    return { channels: Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i)), sampleRate: buf.sampleRate, duration: buf.duration };
  } finally {
    ctx.close();
  }
}

/** Trim a recording and return a WAV blob. */
export async function trimAudioBlob(blob: Blob, startSec: number, endSec: number): Promise<Blob> {
  const { channels, sampleRate } = await decodeAudio(blob);
  return new Blob([encodeWav16(trimChannels(channels, sampleRate, startSec, endSec), sampleRate) as BlobPart], { type: 'audio/wav' });
}

export function formatTime(sec: number): string {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}
