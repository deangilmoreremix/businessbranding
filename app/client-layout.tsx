'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans" suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}