'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Send, Square, Volume2 } from 'lucide-react';
import { useVoiceInput } from '@/components/local/use-voice-input';
import { readAloud, readAloudSupported, stopReadAloud } from '@/components/local/read-aloud';
import { authFetch } from '@/lib/client/auth-fetch';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  images?: string[];
  citations?: { url: string; title?: string }[];
}

interface AssistantChatProps {
  /** Current brand analysis; the server's function tools read scores from it. */
  analysis: unknown;
  /** 'support' = general product support (no analysis tools); default = brand analysis assistant. */
  mode?: 'brand' | 'support';
}

/**
 * Streaming chat backed by /api/ai/assistant (OpenAI Responses API).
 * Server-sent events stream text deltas; conversation state is kept by OpenAI, so the client only
 * remembers the last response id (previous_response_id) between turns.
 */
export function AssistantChat({ analysis, mode = 'brand' }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const previousResponseId = useRef<string | undefined>(undefined);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const voice = useVoiceInput((text) => setInput((prev) => (prev ? `${prev} ${text}` : text)));

  const toggleReadAloud = async (index: number, text: string) => {
    if (speakingIndex === index) { stopReadAloud(); setSpeakingIndex(null); return; }
    setSpeakingIndex(index);
    await readAloud(text);
    setSpeakingIndex((cur) => (cur === index ? null : cur));
  };

  const patchLast = (fn: (m: Message) => Message) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: '' }]);

    try {
      const res = await authFetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, previousResponseId: previousResponseId.current, context: analysis, mode })
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx).replace(/^data: /, '');
          buffer = buffer.slice(idx + 2);
          if (!frame) continue;
          const event = JSON.parse(frame);
          if (event.type === 'delta') patchLast((m) => ({ ...m, text: m.text + event.text }));
          else if (event.type === 'tool') setStatus(event.name === 'generate_brand_image' ? 'Generating image…' : 'Looking at your analysis…');
          else if (event.type === 'image') patchLast((m) => ({ ...m, images: [...(m.images ?? []), event.dataUrl] }));
          else if (event.type === 'done') {
            previousResponseId.current = event.responseId;
            patchLast((m) => ({ ...m, citations: event.citations }));
          } else if (event.type === 'error') throw new Error(event.message);
        }
      }
    } catch (error) {
      patchLast((m) => ({ ...m, text: m.text || (error instanceof Error ? error.message : 'Something went wrong.') }));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {mode === 'support'
              ? 'Ask how to use the platform, or about branding in general.'
              : 'Ask about your scores, competitors or market trends, or ask for a logo concept image.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {m.text || (busy && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : null)}
              {m.role === 'assistant' && m.text && !busy && readAloudSupported() && (
                <button
                  type="button"
                  onClick={() => toggleReadAloud(i, m.text)}
                  className="ml-2 inline-flex align-middle opacity-70 hover:opacity-100"
                  aria-label={speakingIndex === i ? 'Stop reading' : 'Read aloud'}
                >
                  {speakingIndex === i ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              )}
              {m.images?.map((src, j) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={j} src={src} alt="Generated brand concept" className="mt-2 rounded-md max-w-full" />
              ))}
              {m.citations && m.citations.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {m.citations.map((c) => (
                    <li key={c.url}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {c.title || c.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
      {voice.error && <p className="text-xs text-red-500" role="alert">{voice.error}</p>}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask the brand assistant…"
          rows={2}
          disabled={busy}
        />
        {voice.supported && (
          <Button
            type="button"
            variant={voice.listening ? 'destructive' : 'outline'}
            onClick={voice.listening ? voice.stop : voice.start}
            disabled={busy || voice.busy}
            aria-label={voice.listening ? 'Stop voice input' : 'Start voice input'}
            title={voice.engine === 'browser' ? 'Using your browser\'s speech recognition' : 'Voice input'}
          >
            {voice.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : voice.listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Button onClick={send} disabled={busy || !input.trim()} aria-label="Send message">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
