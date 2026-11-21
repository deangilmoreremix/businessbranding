'use client';

import { usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/error-boundary';

/** Wraps every page so a rendering error shows a recoverable message instead of white-screening the app; navigating away resets it. */
export function PageBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
