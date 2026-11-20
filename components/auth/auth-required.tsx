'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginUrl } from '@/lib/auth-redirect';
import { useAuth } from './auth-provider';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AuthRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthRequired({ children, fallback }: AuthRequiredProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(loginUrl(pathname)); // come back here after signing in
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    return fallback || null;
  }

  return <>{children}</>;
}