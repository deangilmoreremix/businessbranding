import { loadDraft, saveDraft } from '@/lib/local/store';

/** Voice studio preferences, kept in this browser (IndexedDB). Both fields are actually used: see PodcastStudio, AudiobookCreator, VoiceTranscription. */
export interface VoicePrefs { voiceId: string; language: string }
export const DEFAULT_VOICE_PREFS: VoicePrefs = { voiceId: 'marin', language: 'en' };
const KEY = 'voice:prefs';

export async function loadVoicePrefs(): Promise<VoicePrefs> {
  const saved = await loadDraft<Partial<VoicePrefs>>(KEY).catch(() => undefined);
  return { ...DEFAULT_VOICE_PREFS, ...(saved && typeof saved === 'object' ? saved : {}) };
}

export const saveVoicePrefs = (prefs: VoicePrefs) => saveDraft(KEY, prefs);
