import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Keeps the Supabase session fresh on every request.
 *
 * Uses the SAME cookie format as the browser AuthProvider (@supabase/auth-helpers-nextjs). The previous version used
 * @supabase/ssr, whose cookie format differs, so it discarded the session cookie on the first full page load and
 * signed the user out.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;
  try {
    const supabase = createMiddlewareClient({ req: request, res: response });
    await supabase.auth.getSession();
  } catch {
    // a broken auth backend must not take the whole site down
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
