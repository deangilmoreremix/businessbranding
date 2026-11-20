'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CaseStudy { id: string; slug: string; title: string; industry: string; challenge: string; solution: string; featured: boolean }

/** Case studies are published rows of `case_studies`. Until some are published the page says so; nothing is made up. */
export default function CaseStudiesPage() {
  const [items, setItems] = useState<CaseStudy[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/case-studies')
      .then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => { setItems([]); setError('Could not load case studies right now.'); });
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="text-sm px-3 mb-2">CASE STUDIES</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Case studies</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Real projects, written up by the people who ran them.</p>
        </div>

        {items === null ? (
          <p className="text-center text-muted-foreground" role="status">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center" data-testid="case-studies-empty">
            <h2 className="text-xl font-semibold mb-2">No case studies published yet</h2>
            <p className="text-muted-foreground mb-6">{error || 'We only publish projects we can describe truthfully, so this page is empty for now.'}</p>
            <Link href="/brand-strategy"><Button>Analyze your own brand</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="case-study-list">
            {items.map((c) => (
              <Card key={c.id} className="p-6">
                <Badge variant="outline" className="mb-3">{c.industry}</Badge>
                <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
                <p className="text-sm font-medium mt-4">Challenge</p>
                <p className="text-muted-foreground">{c.challenge}</p>
                <p className="text-sm font-medium mt-4">Solution</p>
                <p className="text-muted-foreground">{c.solution}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
