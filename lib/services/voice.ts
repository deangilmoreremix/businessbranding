import { callTask, isDemoMode } from './ai';
import type {
  AudiobookOptions,
  ContentOptimizationOptions,
  PodcastSegment,
  TranscriptionOptions,
  TranscriptionResult,
  Voice,
  VoiceAnalysisResult
} from '../types/voice';
import { authFetch } from '@/lib/client/auth-fetch';

/**
 * Voice features on OpenAI:
 *  - text-to-speech via the Realtime API (gpt-realtime-2.1-mini; /api/voice/generate, /podcast, /audiobook)
 *  - speech-to-text via /v1/audio/transcriptions (gpt-transcribe; /api/voice/transcribe)
 *  - live voice conversations via Realtime WebRTC (/api/voice/realtime, see components/voice-interface/live-voice.tsx)
 * All OpenAI calls happen server-side; the browser only talks to /api/*.
 */

export const DEFAULT_VOICE_ID = 'marin';

/** Built-in Realtime voices (marin and cedar recommended). */
export const VOICES: Voice[] = [
  { voice_id: 'marin', name: 'Marin', category: 'recommended', description: 'Highest quality, warm and natural' },
  { voice_id: 'cedar', name: 'Cedar', category: 'recommended', description: 'Highest quality, deep and steady' },
  { voice_id: 'alloy', name: 'Alloy', category: 'neutral' },
  { voice_id: 'ash', name: 'Ash', category: 'casual' },
  { voice_id: 'ballad', name: 'Ballad', category: 'expressive' },
  { voice_id: 'coral', name: 'Coral', category: 'friendly' },
  { voice_id: 'echo', name: 'Echo', category: 'neutral' },
  { voice_id: 'sage', name: 'Sage', category: 'professional' },
  { voice_id: 'shimmer', name: 'Shimmer', category: 'friendly' },
  { voice_id: 'verse', name: 'Verse', category: 'expressive' }
];

async function readError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  return new Error(body.error || `${fallback} (${res.status})`);
}

export async function getAvailableVoices(): Promise<Voice[]> {
  return VOICES;
}

/** Narrate text; resolves to a WAV blob. */
export async function generateVoiceOver(text: string, voiceId: string = DEFAULT_VOICE_ID, instructions?: string): Promise<Blob> {
  const res = await authFetch('/api/voice/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId, instructions })
  });
  if (!res.ok) throw await readError(res, 'Voice generation failed');
  return res.blob();
}

/** Multi-voice podcast: one segment per speaker, joined into a single WAV. */
export async function createPodcast(title: string, segments: PodcastSegment[]): Promise<Blob> {
  const res = await authFetch('/api/voice/podcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, segments })
  });
  if (!res.ok) throw await readError(res, 'Podcast generation failed');
  return res.blob();
}

export async function createAudiobook(options: AudiobookOptions): Promise<Blob> {
  const res = await authFetch('/api/voice/audiobook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw await readError(res, 'Audiobook generation failed');
  return res.blob();
}

/** Result of narration made from segments, with each clip's duration (for exact captions). */
export interface NarrationResult {
  blob: Blob;
  /** Clip length per segment/chapter in ms (0 for empty ones); clips are joined with a 350 ms pause. */
  durationsMs: number[];
}

const parseDurations = (res: Response) =>
  (res.headers.get('X-Segment-Durations') || '').split(',').filter(Boolean).map(Number);

/** Like createPodcast but also returns per-segment durations. */
export async function createPodcastWithTimings(title: string, segments: PodcastSegment[]): Promise<NarrationResult> {
  const res = await authFetch('/api/voice/podcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, segments })
  });
  if (!res.ok) throw await readError(res, 'Podcast generation failed');
  return { blob: await res.blob(), durationsMs: parseDurations(res) };
}

/** Like createAudiobook but also returns per-chapter durations. */
export async function createAudiobookWithTimings(options: AudiobookOptions): Promise<NarrationResult> {
  const res = await authFetch('/api/voice/audiobook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw await readError(res, 'Audiobook generation failed');
  return { blob: await res.blob(), durationsMs: parseDurations(res) };
}

export async function transcribeAudio(options: TranscriptionOptions): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append('file', options.audio);
  if (options.language) form.append('language', options.language);
  if (options.prompt) form.append('prompt', options.prompt);
  options.keywords?.forEach((k) => form.append('keywords', k));
  if (options.model) form.append('model', options.model);

  const res = await authFetch('/api/voice/transcribe', { method: 'POST', body: form });
  if (!res.ok) throw await readError(res, 'Transcription failed');
  return res.json();
}

export async function getTranscriptionModels(): Promise<{ model_id: string; name: string; description: string }[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  return res.json();
}

/** Tone, sentiment and audience-fit analysis of a script (Structured Outputs). */
export async function analyzeVoiceContent(text: string): Promise<VoiceAnalysisResult> {
  if (await isDemoMode()) {
    return {
      tone: {
        formal: 0.7,
        casual: 0.3,
        emotional: 0.5,
        professional: 0.8
      },
      sentiment: {
        positive: 0.6,
        negative: 0.1,
        neutral: 0.3
      },
      culturalSensitivity: {
        issues: ['None found'],
        score: 0.95
      },
      emotionalResonance: {
        primary: 'trust',
        secondary: ['confidence', 'reliability'],
        intensity: 0.8
      },
      audienceAlignment: {
        score: 0.85,
        recommendations: [
          'Consider more technical terminology for professional audience',
          'Add industry-specific examples'
        ]
      }
    };
  }
  return (await callTask<VoiceAnalysisResult>('voice_analysis', `Analyze this voice script for tone, sentiment, cultural sensitivity, emotional resonance and audience alignment:\n\n${text}`)).data;
}

/** Rewrite a script for a platform (podcast, audiobook, advertisement, training). */
export async function optimizeContent(text: string, options: ContentOptimizationOptions): Promise<string> {
  if (await isDemoMode()) return `${text}\n\n[Optimized for ${options.platform}]`;
  try {
    const { data } = await callTask<{ optimizedText: string }>(
      'content_optimization',
      `Optimize this script for ${options.platform}.${options.targetLength ? ` Target about ${options.targetLength} words.` : ''}${options.seoKeywords?.length ? ` Work in these keywords naturally: ${options.seoKeywords.join(', ')}.` : ''}${options.preserveKeyMessages?.length ? ` Preserve these key messages: ${options.preserveKeyMessages.join('; ')}.` : ''}\n\nScript:\n${text}`
    );
    return data.optimizedText;
  } catch (error) {
    console.error('Content optimization failed:', error);
    return text; // keep the original script if optimization fails
  }
}
