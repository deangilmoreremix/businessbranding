/**
 * Web Speech API wrappers (browser built-ins, free). Everything is feature-detected:
 *  - SpeechRecognition (dictation): Chromium and Safari (webkit prefix); not Firefox. Chromium sends audio to the
 *    browser vendor's recognition service, so the app offers it only as a fallback to OpenAI transcription.
 *  - speechSynthesis (read aloud): all major browsers; voices differ per OS.
 */

type RecognitionCtor = new () => any;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const speechRecognitionSupported = () => recognitionCtor() !== null;
export const speechSynthesisSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export interface DictationHandlers {
  /** Called with the text so far; `final` is true once a phrase is committed. */
  onText: (text: string, final: boolean) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

/** Start dictation. Returns a stop function, or null when unsupported. */
export function startDictation(handlers: DictationHandlers, lang = 'en-US'): (() => void) | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e: any) => {
    let text = '';
    let final = false;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
      if (e.results[i].isFinal) final = true;
    }
    handlers.onText(text, final);
  };
  rec.onerror = (e: any) => handlers.onError?.(e?.error === 'not-allowed' ? 'Microphone permission was denied' : e?.error || 'Speech recognition error');
  rec.onend = () => handlers.onEnd?.();
  try {
    rec.start();
  } catch (e: any) {
    handlers.onError?.(e?.message || 'Could not start dictation');
    return null;
  }
  return () => { try { rec.stop(); } catch { /* already stopped */ } };
}

/** Pick a voice for the language, preferring local voices. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang = 'en'): SpeechSynthesisVoice | undefined {
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  return matches.find((v) => v.localService) ?? matches[0];
}

/** Read text aloud with the browser voice. Resolves when finished (or immediately when unsupported). */
export function speak(text: string, opts: { lang?: string; rate?: number } = {}): Promise<void> {
  if (!speechSynthesisSupported()) return Promise.resolve();
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang ?? 'en-US';
    u.rate = opts.rate ?? 1;
    const voice = pickVoice(synth.getVoices(), (opts.lang ?? 'en-US').slice(0, 2));
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSynthesisSupported()) window.speechSynthesis.cancel();
}
