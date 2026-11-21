'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthCard, FormError, friendlyAuthError } from '@/components/auth/auth-card';
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/auth-redirect';

/** Landing page of the password-reset email link: Supabase signs the user in with a recovery session, then they choose a new password. */
export default function UpdatePasswordPage() {
  const { user, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwError = validatePassword(password);
    if (pwError) return setError(pwError);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await updatePassword(password);
      router.replace('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <AuthCard title="Reset link expired" description="This password reset link is invalid or has expired.">
        <Link href="/reset-password" className="text-sm text-blue-500 hover:underline">Request a new link</Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={busy || !password}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Update password
        </Button>
      </form>
    </AuthCard>
  );
}
