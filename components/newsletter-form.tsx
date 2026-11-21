'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Newsletter sign-up. It SAVES the address (POST /api/newsletter -> newsletter_subscriptions) and says exactly that: nothing is sent
 * automatically. Errors are shown; "subscribed" is only ever displayed after the server confirmed the save.
 */
export function NewsletterForm({ idPrefix = 'nl' }: { idPrefix?: string }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'saved'>('idle');
  const [error, setError] = useState('');
  const [already, setAlready] = useState(false);
  const [neutral, setNeutral] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, website }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not save your address.');
      setAlready(!!body.alreadySubscribed);
      setNeutral(body.stored === false && !body.alreadySubscribed);
      setState('saved');
    } catch (err: any) {
      setError(err.message || 'Could not save your address.');
      setState('idle');
    }
  };

  if (state === 'saved') {
    return (
      <p role="status" data-testid="newsletter-saved" className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" aria-hidden />{neutral ? 'Thanks.' : already ? 'This address is already on the list.' : 'Saved. Nothing is sent automatically yet; we will only email you when we have news.'}
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <label htmlFor={`${idPrefix}-email`} className="sr-only">Email address</label>
        <Input id={`${idPrefix}-email`} type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div aria-hidden className="hidden"><input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
        <Button type="submit" disabled={state === 'sending' || !email}>{state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save my email'}</Button>
      </div>
      {error && <p role="alert" data-testid="newsletter-error" className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">We save your address so we can email you product news later. Nothing is sent automatically yet.</p>
    </form>
  );
}
