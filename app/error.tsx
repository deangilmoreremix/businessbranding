'use client';

import { Button } from '@/components/ui/button';

/** Route-level fallback (Next.js error boundary): never a blank page, always a way to retry. */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-4" role="alert" data-testid="route-error">
      <h1 className="text-2xl font-bold">This page could not be displayed</h1>
      <p className="text-muted-foreground">Something unexpected happened while showing it. Nothing was lost.</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
