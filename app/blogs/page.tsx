'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NewsletterForm } from '@/components/newsletter-form';
import { formatDate } from '@/lib/format';

interface Post { slug: string; title: string; excerpt: string; author: string; category: string; publishedAt: string | null }

/** Articles come from the `blog_posts` table (published rows only). With none published, the page says so: no placeholder articles. */
export default function BlogsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    fetch('/api/blog')
      .then(async (r) => (await r.json().catch(() => null)))
      .then((d) => {
        const list = Array.isArray(d?.posts) ? d.posts.filter((p: any) => p && typeof p.slug === 'string' && typeof p.title === 'string') : null;
        if (!list) throw new Error('unreadable');
        setPosts(list.map((p: any) => ({ ...p, excerpt: typeof p.excerpt === 'string' ? p.excerpt : '' })));
        if (d.error) setError(String(d.error));
      })
      .catch(() => { setPosts([]); setError('The articles could not be loaded (unreadable response). Reload to try again.'); });
  }, []);

  const shown = (posts ?? []).filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(term.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="text-sm px-3 mb-2">BLOG</Badge>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Articles about branding and using AI tools well.</p>
        </div>

        {posts === null ? (
          <p className="text-center text-muted-foreground" role="status">Loading articles…</p>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center mb-12" data-testid="blog-empty">
            <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
            <p className="text-muted-foreground">{error || 'Nothing has been published yet. Add your email below to hear when the first article is out.'}</p>
          </Card>
        ) : (
          <>
            <div className="relative max-w-md mx-auto mb-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search articles…" aria-label="Search articles" className="pl-9" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12" data-testid="blog-list">
              {shown.map((p) => (
                <Link key={p.slug} href={`/blogs/${p.slug}`}>
                  <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                    {p.category && <Badge variant="outline" className="mb-3">{p.category}</Badge>}
                    <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
                    <p className="text-muted-foreground mb-4">{p.excerpt}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {p.author && <span className="flex items-center gap-1"><User className="h-4 w-4" aria-hidden />{p.author}</span>}
                      {p.publishedAt && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" aria-hidden />{formatDate(p.publishedAt)}</span>}
                    </div>
                  </Card>
                </Link>
              ))}
              {shown.length === 0 && <p className="text-muted-foreground">No article matches your search.</p>}
            </div>
          </>
        )}

        <Card className="p-8 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-2">Get new articles by email</h2>
          <NewsletterForm idPrefix="blog" />
        </Card>
      </div>
    </div>
  );
}
