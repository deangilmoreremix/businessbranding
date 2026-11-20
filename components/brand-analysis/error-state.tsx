'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { describeError } from '@/lib/client/ai-error';
import { loginUrl } from '@/lib/auth-redirect';

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
  title?: string;
}

/** Honest failure state: the real cause (key missing / signed out / rate limit / service error) and a Retry. No results are shown. */
export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const info = describeError(error);
  const pathname = usePathname();
  return (
    <Card className="p-6 border-destructive/50 bg-destructive/10" role="alert" data-testid="error-state" data-error-kind={info.kind}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
        <div>
          <h3 className="text-lg font-semibold mb-2">{title ?? info.title}</h3>
          <p className="text-sm text-muted-foreground">{info.message}</p>
        </div>
        <div className="flex gap-3">
          {info.kind === 'key' && <Link href="/settings#ai"><Button variant="outline">Open Settings</Button></Link>}
          {info.kind === 'auth' && <Link href={loginUrl(pathname)}><Button variant="outline">Sign in</Button></Link>}
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </Card>
  );
}
