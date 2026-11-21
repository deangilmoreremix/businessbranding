'use client';

import { Suspense, lazy, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

// The chat/voice UI (and its speech/recording code) is only downloaded when the assistant is opened.
// React.lazy is used instead of next/dynamic so the root layout does not pull in next/dynamic's runtime.
const SupportAgentPanel = lazy(() => import('@/components/support-agent-panel'));

/**
 * Floating support assistant powered by OpenAI: streaming text chat (Responses API) and live voice (Realtime API).
 */
export function SupportAgent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 p-4 glass-card shadow-xl">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close assistant">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <SupportAgentPanel />
          </Suspense>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 p-0 shadow-lg" aria-label="Open support assistant">
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
