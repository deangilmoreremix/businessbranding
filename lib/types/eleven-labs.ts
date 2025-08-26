export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  settings?: VoiceSettings;
  labels?: Record<string, string>;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface GenerationOptions {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: VoiceSettings;
  pronunciation_dictionary_locators?: string[];
}

export interface VoiceGenerationResponse {
  audio: Blob;
  metadata: {
    text: string;
    voice_id: string;
    model_id: string;
    duration: number;
  };
}

export interface VoiceCloneOptions {
  name: string;
  files: File[];
  description?: string;
  labels?: Record<string, string>;
}

export interface VoiceDesignOptions {
  name: string;
  text: string;
  gender?: 'male' | 'female';
  accent?: string;
  age?: 'young' | 'middle_aged' | 'old';
  accent_strength?: number;
  clarity?: number;
  style?: 'natural' | 'professional' | 'casual';
}

export interface TranscriptionOptions {
  audio: File | Blob;
  language?: string;
  temperature?: number;
  speaker_count?: number;
  word_timing?: boolean;
  model?: string;
}

export interface TranscriptionResult {
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  speakers?: Array<{
    id: number;
    segments: Array<{
      start: number;
      end: number;
    }>;
  }>;
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

export interface VoiceBrandingOptions {
  industry: string;
  targetAudience: string[];
  brandValues: string[];
  tone: string[];
  region?: string[];
}

export interface VoiceBrandingResult {
  voiceId: string;
  guidelines: {
    tone: string[];
    pacing: number;
    emphasis: string[];
    vocabulary: string[];
    prohibited: string[];
  };
  examples: {
    text: string;
    audio: string;
  }[];
  metrics: {
    consistency: number;
    recognition: number;
    memorability: number;
  };
}

export interface ContentOptimizationOptions {
  text: string;
  platform: 'podcast' | 'audiobook' | 'advertisement' | 'training';
  targetLength?: number;
  seoKeywords?: string[];
  preserveKeyMessages?: string[];
}

export interface QualityEnhancementOptions {
  audio: Blob;
  removeBackground?: boolean;
  enhanceClarity?: boolean;
  normalizeLevels?: boolean;
  improveArticulation?: boolean;
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

export interface SoundEffectOptions {
  type: 'reverb' | 'echo' | 'pitch' | 'chorus';
  intensity: number;
  audioBlob: Blob;
}

export interface DubbingOptions {
  videoFile: File;
  voiceId: string;
  language?: string;
  preserveOriginalAudio?: boolean;
}

export interface WidgetOptions {
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  width?: string;
  height?: string;
}