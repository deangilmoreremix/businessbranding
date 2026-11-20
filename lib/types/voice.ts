// Voice feature types (OpenAI audio: text-to-speech, transcription, Realtime).

/** A selectable built-in OpenAI voice. `voice_id` is the OpenAI voice name (e.g. "marin"). */
export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

export interface TranscriptionOptions {
  audio: File | Blob;
  /** Expected language (ISO code); sent as `languages[]`. */
  language?: string;
  /** Unstructured context about the recording. */
  prompt?: string;
  /** Literal terms expected in the audio. */
  keywords?: string[];
  model?: string;
}

export interface TranscriptionResult {
  text: string;
  languages?: { code: string }[];
}

export interface VoiceAnalysisResult {
  tone: {
    formal: number;
    casual: number;
    emotional: number;
    professional: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  culturalSensitivity: {
    issues: string[];
    score: number;
  };
  emotionalResonance: {
    primary: string;
    secondary: string[];
    intensity: number;
  };
  audienceAlignment: {
    score: number;
    recommendations: string[];
  };
}

export interface ContentOptimizationOptions {
  text: string;
  platform: 'podcast' | 'audiobook' | 'advertisement' | 'training';
  targetLength?: number;
  seoKeywords?: string[];
  preserveKeyMessages?: string[];
}

export interface PodcastSegment {
  text: string;
  voiceId: string;
}

export interface AudiobookChapter {
  title: string;
  text: string;
  voiceId: string;
}

export interface AudiobookOptions {
  title: string;
  author: string;
  narrator: string;
  chapters: AudiobookChapter[];
  coverImageUrl?: string;
  language?: string;
  genre?: string;
  description?: string;
}

