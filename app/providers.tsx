'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { ClientProvider } from '@/components/client-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientProvider>
        {children}
      </ClientProvider>
    </AuthProvider>
  );
}