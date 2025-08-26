'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';

const BusinessAnalyzerClient = dynamic(
  () => import('./business-analyzer-client').then(mod => mod.default || mod),
  {
    loading: () => <LoadingSpinner message="Loading business analyzer..." />,
    ssr: false
  }
);

export { BusinessAnalyzerClient as BusinessAnalyzer };