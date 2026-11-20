'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff } from 'lucide-react';

type Status = 'idle' | 'connecting' | 'live' | 'error';

interface LiveVoiceProps {
  /** Built-in Realtime voice name (e.g. "marin"). */
  voiceId?: string;
  instructions?: string;
}

/**
 * Live voice conversation over the OpenAI Realtime API (WebRTC).
 * The server mints a short-lived client secret (/api/voice/realtime); the browser exchanges SDP with the Realtime
 * calls endpoint using that secret, so the real API key never reaches the client.
 */
export function LiveVoice({ voiceId, instructions }: LiveVoiceProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus('idle');
  };

  useEffect(() => stop, []);

  const start = async () => {
    setError('');
    setStatus('connecting');
    try {
      const tokenRes = await fetch('/api/voice/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, instructions })
      });
      const token = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok) {
        throw new Error(tokenRes.status === 503 ? 'Live voice needs OPENAI_API_KEY to be configured on the server.' : token.error || 'Could not start a voice session');
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Play the model's audio
      if (!audioRef.current) audioRef.current = document.createElement('audio');
      audioRef.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioRef.current) audioRef.current.srcObject = e.streams[0];
      };

      // Send the microphone
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mic;
      pc.addTrack(mic.getTracks()[0]);

      // Events (transcripts) arrive on the data channel
      const dc = pc.createDataChannel('oai-events');
      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'response.output_audio_transcript.done' && event.transcript) {
            setLines((prev) => [...prev, event.transcript]);
          }
        } catch {
          /* ignore non-JSON frames */
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(token.callsUrl, {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/sdp' }
      });
      if (!sdpRes.ok) throw new Error('The voice connection was rejected');
      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });
      setStatus('live');
    } catch (e) {
      stop();
      setError(e instanceof Error ? e.message : 'Voice session failed');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={status === 'live' ? stop : start} disabled={status === 'connecting'} className="w-full">
        {status === 'connecting' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : status === 'live' ? (
          <MicOff className="h-4 w-4 mr-2" />
        ) : (
          <Mic className="h-4 w-4 mr-2" />
        )}
        {status === 'live' ? 'End conversation' : status === 'connecting' ? 'Connecting…' : 'Start voice conversation'}
      </Button>
      {status === 'live' && <p className="text-xs text-muted-foreground">Listening… just start talking.</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {lines.length > 0 && (
        <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
          {lines.map((l, i) => (
            <li key={i} className="rounded bg-muted px-2 py-1">{l}</li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">The voice you hear is AI-generated, not a human.</p>
    </div>
  );
}
