'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { SAMPLE_CLEARED_EVENT, SAMPLE_DATA_EVENT } from '@/lib/client/auth-fetch';

/** Inline label for a result block that is built-in sample data. */
export function SampleDataLabel({ className = '' }: { className?: string }) {
  return (
    <p role="note" data-testid="sample-data-label" className={`inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm ${className}`}>
      <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
      Sample data &ndash; <Link href="/settings#ai" className="underline font-medium">add your OpenAI key</Link> for real results
    </p>
  );
}

/**
 * Persistent pill shown once any feature has fallen back to built-in sample data on this page view, so fake results are never
 * mistaken for real ones. Cleared as soon as a request confirms the user's key works.
 */
export function SampleDataBadge() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(true);
    const off = () => setShown(false);
    window.addEventListener(SAMPLE_DATA_EVENT, on);
    window.addEventListener(SAMPLE_CLEARED_EVENT, off);
    return () => {
      window.removeEventListener(SAMPLE_DATA_EVENT, on);
      window.removeEventListener(SAMPLE_CLEARED_EVENT, off);
    };
  }, []);
  if (!shown) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40" data-testid="sample-data-badge">
      <SampleDataLabel className="shadow-lg bg-background" />
    </div>
  );
}
