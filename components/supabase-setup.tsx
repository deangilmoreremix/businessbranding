'use client';

import { useEffect } from 'react';

export function SupabaseSetup() {
  // This component is now completely invisible to end users
  // It only performs silent database checks for admin/developer purposes
  // All database issues are handled silently through error boundaries

  useEffect(() => {
    // Silent database check - only logs to console for debugging
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/supabase/setup', {
          method: 'POST',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) {
          console.warn('Database connection issue detected');
        } else {
          const data = await response.json();
          if (data.status !== 'ready' && data.status !== 'completed') {
            console.warn('Database not ready:', data.message);
          }
        }
      } catch (error) {
        console.warn('Database check failed:', error);
      }
    };

    // Only run in development or if explicitly needed
    if (process.env.NODE_ENV === 'development') {
      checkDatabase();
    }
  }, []);

  // This component never renders anything visible to users
  return null;
}