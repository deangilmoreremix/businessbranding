'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';

const BrandPillarBreakdownClient = dynamic(
  () => import('./brand-pillar-breakdown-client').then(mod => mod.default || mod),
  {
    loading: () => <LoadingSpinner message="Loading brand pillars..." />,
    ssr: false
  }
);

export { BrandPillarBreakdownClient as BrandPillarBreakdown };