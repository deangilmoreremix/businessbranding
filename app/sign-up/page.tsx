'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthCard, FormError, friendlyAuthError } from '@/components/auth/auth-card';
import { MIN_PASSWORD_LENGTH, postLoginDestination, safeNextPath, validatePassword } from '@/lib/auth-redirect';

function SignUpForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwError = validatePassword(password);
    if (pwError) return setError(pwError);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) {
        setConfirmSent(true);
      } else {
        // signed in immediately: a brand-new account has no key yet -> the "Add your OpenAI key" step
        router.replace(postLoginDestination(false, next));
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const q = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';
  if (confirmSent) {
    return (
      <AuthCard title="Check your email">
        <div className="flex items-start gap-3" data-testid="confirm-sent">
          <MailCheck className="h-6 w-6 text-green-500 mt-0.5" aria-hidden />
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Open it, then <Link href={`/login${q}`} className="text-blue-500 hover:underline">sign in</Link> to add your OpenAI key and start.
          </p>
        </div>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Create your account" description="AI features use your own OpenAI API key, which you add after signing in.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pw-hint" />
          <p id="pw-hint" className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create account
        </Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account? <Link href={`/login${q}`} className="text-blue-500 hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
