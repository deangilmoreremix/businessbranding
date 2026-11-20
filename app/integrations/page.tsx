'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Database, KeyRound, Lock, Shield, XCircle, Zap, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { authFetch } from '@/lib/client/auth-fetch';

type Status = { label: string; ok: boolean };

/** Status badges are computed from real state (signed in? key saved? database configured?), never hard-coded. */
export default function IntegrationsPage() {
  const { user } = useAuth();
  const [key, setKey] = useState<Status>({ label: 'Checking…', ok: false });

  useEffect(() => {
    if (!user) { setKey({ label: 'Sign in to check', ok: false }); return; }
    authFetch('/api/settings/openai-key')
      .then(async (r) => { if (!r.ok) throw new Error(); const d = await r.json(); setKey(d.configured ? { label: `Key added (…${d.last4})`, ok: true } : { label: 'No key added', ok: false }); })
      .catch(() => setKey({ label: 'Could not check', ok: false }));
  }, [user]);

  const dbConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !/your_supabase_url/.test(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const cards: { title: string; description: string; icon: LucideIcon; status: Status; href: string; action: string }[] = [
    { title: 'OpenAI', description: 'Text and analysis (Responses API), images (Images API), speech and transcription, live voice. All use the one key you add in Settings.', icon: Zap, status: key, href: '/settings#ai', action: key.ok ? 'Manage key' : 'Add key' },
    { title: 'Supabase', description: 'Accounts, your saved items and the encrypted key store.', icon: Database, status: !dbConfigured ? { label: 'Not configured on this site', ok: false } : user ? { label: 'Signed in', ok: true } : { label: 'Signed out', ok: false }, href: user ? '/settings' : '/login', action: user ? 'Open settings' : 'Sign in' }
  ];

  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="text-sm px-3 mb-2">INTEGRATIONS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Integrations</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">The two services this app connects to, and whether each is set up for you right now.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {cards.map((c) => (
            <Card key={c.title} className="p-6" data-testid={`integration-${c.title.toLowerCase()}`}>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center"><c.icon className="h-6 w-6 text-blue-400" aria-hidden /></div>
                  <div>
                    <h2 className="text-xl font-semibold">{c.title}</h2>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={c.status.ok ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}>
                  {c.status.ok ? <CheckCircle className="h-3 w-3 mr-1" aria-hidden /> : <XCircle className="h-3 w-3 mr-1" aria-hidden />}{c.status.label}
                </Badge>
              </div>
              <div className="flex justify-end"><Link href={c.href}><Button variant="outline" size="sm">{c.action}</Button></Link></div>
            </Card>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How your data is handled</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: KeyRound, title: 'Encrypted API key', text: 'Your OpenAI key is stored encrypted (AES-256-GCM) and is never returned to the browser; only its last four characters are shown.' },
              { icon: Lock, title: 'Row-level security', text: 'Rows saved to your account are readable and writable only by you; the key table has no client access at all.' },
              { icon: Shield, title: 'Local by default', text: 'Images, audio, drafts and saved analyses live in your browser unless you choose to save to your account.' }
            ].map((f) => (
              <Card key={f.title} className="p-6 bg-accent/5 border-accent/20 text-center">
                <f.icon className="h-8 w-8 mx-auto text-blue-400 mb-3" aria-hidden />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/docs"><Button size="lg" variant="outline">Read the documentation<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
