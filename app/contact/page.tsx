'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { contactMailto, validateContact, type ContactErrors, type ContactForm } from '@/lib/contact';

// The site has no mail backend: the form opens the visitor's own mail app when a contact address is configured.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [done, setDone] = useState<'mailto' | 'copy' | null>(null);

  const set = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateContact(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (CONTACT_EMAIL) {
      window.location.href = contactMailto(CONTACT_EMAIL, form);
      setDone('mailto');
    } else {
      try { await navigator.clipboard.writeText(`${form.message}\n\n— ${form.name} <${form.email}>`); } catch { /* clipboard unavailable */ }
      setDone('copy');
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
          {done ? (
            <div role="status" data-testid="contact-done" className="flex items-start gap-3">
              <Mail className="h-6 w-6 text-green-500 mt-0.5" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {done === 'mailto'
                  ? 'Your mail app should open with the message ready to send.'
                  : 'No contact address is configured on this site, so your message was copied to the clipboard instead. Paste it into an email to us.'}
              </p>
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
              <Button type="submit" className="w-full"><Send className="h-4 w-4 mr-2" />Send message</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
