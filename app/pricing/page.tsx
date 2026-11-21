'use client';

import Link from 'next/link';
import { KeyRound, ShieldCheck, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// This app has no plans, trials or checkout. Anything shown here is how the product really works (see Settings > Billing).
const faq = [
  { q: 'Is there a subscription or a paid plan?', a: 'No. There are no plans or payments in this app. You use it with your own OpenAI API key.' },
  { q: 'What does it cost to use?', a: 'OpenAI bills your OpenAI account for the requests you make (text, images, speech). The cost depends on what you run and on OpenAI’s current prices; see OpenAI’s pricing page. This app does not add a fee or a markup.' },
  { q: 'Where is my key stored?', a: 'On the server, encrypted (AES-256-GCM). The browser only ever sees the last four characters. You can replace or remove it at any time in Settings.' },
  { q: 'What happens if I have no key?', a: 'You can open the pages, but AI features ask you to add a key first. Nothing is generated or shown as a result without one.' },
  { q: 'Do you store my images and audio?', a: 'Images and audio you create are kept in your browser (IndexedDB). Saved analyses stay in your browser too. If you are signed in and use Save, metadata rows are stored in your account.' }
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="text-sm px-3 mb-2">BILLING &amp; KEYS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Bring your own OpenAI key</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">There are no plans to choose. AI features run on your OpenAI account, and OpenAI bills you directly for what you use.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: KeyRound, title: 'Add your key once', text: 'Paste your OpenAI API key in Settings. It is checked with OpenAI and stored encrypted.' },
            { icon: Wallet, title: 'Pay OpenAI directly', text: 'Usage is billed by OpenAI to your account. This app charges nothing.' },
            { icon: ShieldCheck, title: 'You stay in control', text: 'Replace or remove the key whenever you like; set your own model choices.' }
          ].map((item) => (
            <Card key={item.title} className="p-6 text-center">
              <item.icon className="h-8 w-8 mx-auto text-blue-400 mb-3" aria-hidden />
              <h2 className="font-semibold mb-2">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </Card>
          ))}
        </div>

        <div className="text-center mb-16">
          <Link href="/settings#ai"><Button size="lg">Add your OpenAI key</Button></Link>
        </div>

        <h2 className="text-2xl font-bold mb-6">Questions</h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <Card key={item.q} className="p-6">
              <h3 className="font-semibold mb-2">{item.q}</h3>
              <p className="text-muted-foreground">{item.a}</p>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8">More questions? <Link href="/contact" className="underline">Contact us</Link>.</p>
      </div>
    </div>
  );
}
