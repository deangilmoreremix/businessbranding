'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, X } from 'lucide-react';
import { AUTH_REQUIRED_EVENT, KEY_REQUIRED_EVENT } from '@/lib/client/auth-fetch';

type Reason = 'key' | 'auth';

/**
 * Small banner shown when an AI request needs the user's own OpenAI key (or a sign-in). Any call made through
 * authFetch() triggers it, so individual features do not each need their own "no key" state.
 */
export function OpenAIKeyNotice() {
  const [reason, setReason] = useState<Reason | null>(null);

  useEffect(() => {
    const onKey = () => setReason('key');
    const onAuth = () => setReason((r) => r ?? 'auth');
    window.addEventListener(KEY_REQUIRED_EVENT, onKey);
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuth);
    return () => {
      window.removeEventListener(KEY_REQUIRED_EVENT, onKey);
      window.removeEventListener(AUTH_REQUIRED_EVENT, onAuth);
    };
  }, []);

  if (!reason) return null;
  return (
    <div role="status" data-testid="openai-key-notice" className="fixed bottom-20 right-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <KeyRound className="h-5 w-5 mt-0.5 text-amber-500" aria-hidden />
        <div className="flex-1 text-sm">
          {reason === 'key' ? (
            <>
              <p className="font-medium">Add your OpenAI key</p>
              <p className="text-muted-foreground">AI features use your own OpenAI API key. Add it once in Settings.</p>
              <Link href="/settings#ai" className="mt-2 inline-block font-medium underline">Open Settings</Link>
            </>
          ) : (
            <>
              <p className="font-medium">Sign in to use AI features</p>
              <p className="text-muted-foreground">Your session is needed to use your OpenAI key.</p>
            </>
          )}
        </div>
        <button type="button" aria-label="Dismiss" onClick={() => setReason(null)}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
