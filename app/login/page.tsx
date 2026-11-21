'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthCard, FormError, friendlyAuthError } from '@/components/auth/auth-card';
import { authFetch } from '@/lib/client/auth-fetch';
import { postLoginDestination, safeNextPath } from '@/lib/auth-redirect';

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
      return;
    }
    // First login (no OpenAI key yet) -> "Add your OpenAI key" step; otherwise straight back to where the user was going
    let hasKey = false;
    try {
      const res = await authFetch('/api/settings/openai-key');
      hasKey = res.ok && !!(await res.json()).configured;
    } catch {
      hasKey = false;
    }
    router.replace(postLoginDestination(hasKey, next));
  };

  const q = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <AuthCard title="Sign in" description="Welcome back. Sign in to use your AI Brand Creator workspace.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/reset-password" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sign in
        </Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        New here? <Link href={`/sign-up${q}`} className="text-blue-500 hover:underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
