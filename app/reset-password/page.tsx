'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthCard, FormError, friendlyAuthError } from '@/components/auth/auth-card';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <div className="flex items-start gap-3" data-testid="reset-sent">
          <MailCheck className="h-6 w-6 text-green-500 mt-0.5" aria-hidden />
          <p className="text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, a password reset link is on its way. <Link href="/login" className="text-blue-500 hover:underline">Back to sign in</Link></p>
        </div>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Reset your password" description="Enter your email and we will send you a link to choose a new password.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={busy || !email}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Send reset link
        </Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center"><Link href="/login" className="text-blue-500 hover:underline">Back to sign in</Link></p>
    </AuthCard>
  );
}
