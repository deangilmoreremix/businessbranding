'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';

// Use dynamic import with SSR disabled to prevent hydration mismatches
// Also use the default export to avoid naming issues with dynamic imports
const BrandAnalysisClient = dynamic(
  () => import('./brand-analysis-client').then(mod => mod.default),
  {
    loading: () => <LoadingSpinner message="Loading brand analysis..." />,
    ssr: false // Disable SSR for this component to prevent hydration issues
  }
);

export function BrandAnalysis(props: React.ComponentProps<typeof BrandAnalysisClient>) {
  const [error, setError] = useState<Error | null>(null);

  // Handle component errors
  const handleError = (error: Error) => {
    console.error('Brand analysis error:', error);
    setError(error);
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-6 border border-red-300 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-medium">Error loading brand analysis</h3>
        <p className="text-red-600">There was a problem loading this component. Please try refreshing the page.</p>
      </div>
    }>
      <Suspense fallback={<LoadingSpinner message="Loading brand analysis..." />}>
        <BrandAnalysisClient {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}