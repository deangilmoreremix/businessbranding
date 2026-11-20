import { speak, speechSynthesisSupported, stopSpeaking } from '@/lib/local/speech';
import { authFetch } from '@/lib/client/auth-fetch';

let audio: HTMLAudioElement | null = null;

export const readAloudSupported = () => typeof window !== 'undefined' && (typeof Audio !== 'undefined' || speechSynthesisSupported());

export function stopReadAloud() {
  if (audio) { audio.pause(); audio.src = ''; audio = null; }
  stopSpeaking();
}

/** Read text aloud: OpenAI text-to-speech first (natural voice), the browser's speechSynthesis as fallback. */
export async function readAloud(text: string, voiceId = 'marin'): Promise<'openai' | 'browser'> {
  stopReadAloud();
  try {
    const res = await authFetch('/api/voice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4000), voiceId })
    });
    if (!res.ok) throw new Error(String(res.status));
    const url = URL.createObjectURL(await res.blob());
    audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio!.onended = () => resolve();
      audio!.onerror = () => reject(new Error('playback'));
      audio!.play().catch(reject);
    });
    URL.revokeObjectURL(url);
    return 'openai';
  } catch {
    await speak(text.slice(0, 4000));
    return 'browser';
  }
}
