/**
 * Caption helpers: build timed captions from a transcript or from narration segments and export WebVTT (<track> /
 * downloadable .vtt) or SRT.
 *
 * Data model: `Caption` from @remotion/captions (MIT, type-only import here; `parseVtt` is loaded lazily for importing).
 * Cue grouping and WebVTT writing are implemented here, so exports work without any Remotion runtime.
 * Timings are estimated proportionally to text length unless real segment durations are supplied.
 */
import type { Caption } from '@remotion/captions';

export type { Caption };

export interface Cue {
  startMs: number;
  endMs: number;
  text: string;
}

/** Split text into per-word captions whose durations are proportional to word length. */
export function wordCaptions(text: string, startMs: number, endMs: number): Caption[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const weights = words.map((w) => w.length + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(endMs - startMs, words.length);
  let cursor = startMs;
  return words.map((w, i) => {
    const from = Math.round(cursor);
    cursor += (weights[i] / total) * span;
    const to = i === words.length - 1 ? Math.round(startMs + span) : Math.round(cursor);
    return { text: (i === 0 ? '' : ' ') + w, startMs: from, endMs: to, timestampMs: Math.round((from + to) / 2), confidence: null };
  });
}

/** Captions for one continuous recording of known duration. */
export function captionsFromText(text: string, durationMs: number): Caption[] {
  return wordCaptions(text, 0, durationMs);
}

/**
 * Captions for narration made of segments (podcast speakers, audiobook chapters) with known clip durations.
 * `gapMs` must match the pause inserted between clips when they were joined (350 ms by default).
 */
export function captionsFromSegments(segments: { text: string; durationMs: number }[], gapMs = 350): Caption[] {
  const out: Caption[] = [];
  let t = 0;
  for (const seg of segments) {
    if (seg.durationMs > 0 && seg.text.trim()) {
      out.push(...wordCaptions(seg.text, t, t + seg.durationMs));
      t += seg.durationMs + gapMs;
    }
  }
  return out;
}

/** Group word captions into readable cues: break at sentence ends, line length or maximum duration. */
export function groupCues(captions: Caption[], opts: { maxChars?: number; maxDurationMs?: number } = {}): Cue[] {
  const maxChars = opts.maxChars ?? 42;
  const maxDuration = opts.maxDurationMs ?? 6000;
  const cues: Cue[] = [];
  let cur: Cue | null = null;
  for (const c of captions) {
    const word = c.text;
    if (cur) {
      const tooLong = (cur.text + word).trim().length > maxChars;
      const tooSlow = c.endMs - cur.startMs > maxDuration;
      const sentenceEnded = /[.!?…]["')\]]?$/.test(cur.text.trim());
      const gap = c.startMs - cur.endMs > 800; // a pause (e.g. between speakers) starts a new cue
      if (tooLong || tooSlow || sentenceEnded || gap) {
        cues.push(cur);
        cur = null;
      }
    }
    if (!cur) cur = { startMs: c.startMs, endMs: c.endMs, text: word.trimStart() };
    else {
      cur.text += word;
      cur.endMs = c.endMs;
    }
  }
  if (cur) cues.push(cur);
  return cues;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function formatVttTime(ms: number): string {
  const t = Math.max(0, Math.round(ms));
  return `${pad(Math.floor(t / 3600000))}:${pad(Math.floor(t / 60000) % 60)}:${pad(Math.floor(t / 1000) % 60)}.${pad(t % 1000, 3)}`;
}

export function formatSrtTime(ms: number): string {
  return formatVttTime(ms).replace('.', ',');
}

/** Cue text must not contain "-->" or blank lines in WebVTT. */
const safe = (s: string) => s.replace(/-->/g, '→').replace(/\n{2,}/g, '\n').trim();

export function cuesToVtt(cues: Cue[]): string {
  return 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${formatVttTime(c.startMs)} --> ${formatVttTime(c.endMs)}\n${safe(c.text)}\n`).join('\n');
}

export function cuesToSrt(cues: Cue[]): string {
  return cues.map((c, i) => `${i + 1}\n${formatSrtTime(c.startMs)} --> ${formatSrtTime(c.endMs)}\n${safe(c.text)}\n`).join('\n');
}

export function toVtt(captions: Caption[], opts?: { maxChars?: number; maxDurationMs?: number }): string {
  return cuesToVtt(groupCues(captions, opts));
}

/** Import an existing .vtt into the Caption model (uses @remotion/captions' parser, loaded on demand). */
export async function parseVttToCaptions(input: string): Promise<Caption[]> {
  const { parseVtt } = await import('@remotion/captions');
  return parseVtt({ input }).captions;
}

export function vttBlobUrl(vtt: string): string {
  return URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
}
