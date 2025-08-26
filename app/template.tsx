'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

// Define routes where footer should not be shown
const APP_ROUTES = [
  '/brand-strategy',
  '/visual-identity',
  '/voice-content',
  '/dashboard'
];

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is an app route
  const isAppRoute = APP_ROUTES.some(route => pathname?.startsWith(route));

  return (
    <>
      {children}
      {!isAppRoute && <Footer />}
    </>
  );
}