'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { speechRecognitionSupported, startDictation } from '@/lib/local/speech';
import { authFetch } from '@/lib/client/auth-fetch';

export type VoiceEngine = 'openai' | 'browser';

/**
 * Voice input for text fields. Default engine: record with MediaRecorder and transcribe with OpenAI (gpt-transcribe via
 * /api/voice/transcribe). Fallback engine: the browser's Web Speech API, used when MediaRecorder is missing or the
 * OpenAI request fails (e.g. no API key configured).
 */
export function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<VoiceEngine | null>(null);
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stopBrowser = useRef<(() => void) | null>(null);
  const chunks = useRef<Blob[]>([]);

  const canRecord = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const supported = canRecord || speechRecognitionSupported();

  const startBrowser = useCallback(() => {
    const stop = startDictation({
      onText: (t, final) => { if (final) onText(t.trim()); },
      onEnd: () => { setListening(false); setEngine(null); },
      onError: (m) => { setError(m); setListening(false); }
    });
    if (!stop) { setError('Voice input is not supported in this browser.'); return false; }
    stopBrowser.current = stop;
    setEngine('browser');
    setListening(true);
    return true;
  }, [onText]);

  const start = useCallback(async () => {
    setError('');
    if (canRecord) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream);
        chunks.current = [];
        rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);
          setBusy(true);
          try {
            const form = new FormData();
            form.append('file', new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }), 'voice.webm');
            const res = await authFetch('/api/voice/transcribe', { method: 'POST', body: form });
            if (!res.ok) throw new Error(String(res.status));
            const { text } = await res.json();
            if (text) onText(text.trim());
          } catch {
            setError('Transcription is unavailable right now; tap the mic again to use your browser\'s speech recognition.');
            setEngine('browser'); // next press uses the fallback
          } finally {
            setBusy(false);
          }
        };
        if (engine === 'browser' && speechRecognitionSupported()) {
          stream.getTracks().forEach((t) => t.stop());
          startBrowser();
          return;
        }
        recorder.current = rec;
        rec.start();
        setEngine('openai');
        setListening(true);
        return;
      } catch {
        setError('Microphone access was blocked.');
        return;
      }
    }
    startBrowser();
  }, [canRecord, engine, onText, startBrowser]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    recorder.current = null;
    stopBrowser.current?.();
    stopBrowser.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, busy, engine, error, start, stop };
}
