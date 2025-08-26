'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface ClientProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientProvider({ 
  children, 
  fallback = <LoadingSpinner message="Loading..." />
}: ClientProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback;
  }

  return <>{children}</>;
}