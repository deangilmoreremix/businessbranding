import { createClient } from '@supabase/supabase-js';

// Helper to get secrets in Edge Functions
export function getEdgeSecret(name: string): string | undefined {
  // First try environment variable
  const value = Deno.env.get(name);
  if (value) return value;

  // Fallback to demo mode if secret not found
  console.warn(`Secret ${name} not found, using demo mode`);
  return 'demo-mode';
}

// Example usage in Edge Function:
/*
const API_KEY = getEdgeSecret('MY_API_KEY');
if (API_KEY === 'demo-mode') {
  // Handle demo mode
  return demoResponse();
}
*/