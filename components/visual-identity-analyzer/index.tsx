'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';

const VisualIdentityAnalyzerClient = dynamic(
  () => import('./visual-identity-analyzer-client'),
  {
    loading: () => <LoadingSpinner message="Loading visual identity analyzer..." />,
    ssr: false
  }
);

export function VisualIdentityAnalyzer(props: React.ComponentProps<typeof VisualIdentityAnalyzerClient>) {
  return (
    <ErrorBoundary>
      <VisualIdentityAnalyzerClient {...props} />
    </ErrorBoundary>
  );
}