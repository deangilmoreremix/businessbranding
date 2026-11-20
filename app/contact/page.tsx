'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { validateContact, type ContactErrors, type ContactForm } from '@/lib/contact';

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm & { website: string }>({ name: '', email: '', message: '', website: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [serverError, setServerError] = useState('');

  const set = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const found = validateContact(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Your message could not be sent.');
      setState('sent');
    } catch (err: any) {
      setServerError(err.message || 'Your message could not be sent.');
      setState('idle');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Contact us</h1>
          <p className="text-muted-foreground">Questions, feedback or partnership ideas? Send us a message.</p>
        </div>
        <Card className="p-6">
          {state === 'sent' ? (
            <div role="status" data-testid="contact-done" className="flex items-start gap-3">
              <Mail className="h-6 w-6 text-green-500 mt-0.5" aria-hidden />
              <p className="text-sm text-muted-foreground">Your message was saved. It is not emailed automatically, so a reply is not guaranteed and may take time.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email && <p role="alert" className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-message">Message</Label>
                <Textarea id="c-message" rows={6} value={form.message} onChange={set('message')} aria-invalid={!!errors.message} />
                {errors.message && <p role="alert" className="text-sm text-red-500">{errors.message}</p>}
              </div>
              {/* honeypot: hidden from people, filled by bots */}
              <div aria-hidden className="hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} /></label></div>
              {serverError && <p role="alert" data-testid="contact-error" className="text-sm text-red-500">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={state === 'sending'}><Send className="h-4 w-4 mr-2" />{state === 'sending' ? 'Sending…' : 'Send message'}</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
