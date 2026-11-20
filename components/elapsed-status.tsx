'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/** Seconds since `active` became true (0 when idle). Real elapsed time: there is no way to know a request's true percentage. */
export function useElapsed(active: boolean): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

/** Indeterminate spinner with real elapsed time, used instead of a made-up percentage bar. */
export function ElapsedStatus({ active, label }: { active: boolean; label: string }) {
  const seconds = useElapsed(active);
  if (!active) return null;
  return (
    <div role="status" data-testid="elapsed-status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label} {seconds}s</span>
    </div>
  );
}
