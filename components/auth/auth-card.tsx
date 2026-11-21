import type { ReactNode } from 'react';
import { Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** Shared frame for the sign-in, sign-up and password-reset pages. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center text-center">
          <Brain className="h-12 w-12 text-blue-400 mb-2" aria-hidden />
          <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI Brand Creator</p>
        </div>
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
          {children}
        </Card>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" data-testid="auth-error" className="text-sm text-red-500">{message}</p>;
}

/** Turn Supabase auth errors into short, friendly messages. */
export function friendlyAuthError(error: unknown): string {
  const raw = ((error as any)?.message ?? '').toString();
  if (/invalid login credentials/i.test(raw)) return 'That email and password do not match. Check them and try again.';
  if (/email not confirmed/i.test(raw)) return 'Please confirm your email first. Check your inbox for the confirmation link.';
  if (/already registered|already been registered/i.test(raw)) return 'An account with this email already exists. Try signing in instead.';
  if (/rate limit|too many/i.test(raw)) return 'Too many attempts. Please wait a minute and try again.';
  if (/password/i.test(raw) && /(at least|weak|short|characters)/i.test(raw)) return raw;
  if (/failed to fetch|network/i.test(raw)) return 'Could not reach the sign-in service. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
