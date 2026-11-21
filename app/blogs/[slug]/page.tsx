'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate } from '@/lib/format';

interface Post { title: string; content: string; author: string; category: string; publishedAt: string | null }

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(async (r) => { if (!r.ok) throw new Error('missing'); return r.json(); })
      .then((d) => { if (!d?.post || typeof d.post.title !== 'string' || typeof d.post.content !== 'string') throw new Error('unreadable'); setPost(d.post); setState('ready'); })
      .catch(() => setState('missing'));
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link href="/blogs" className="text-sm underline">&larr; All articles</Link>
      {state === 'loading' && <p className="mt-8 text-muted-foreground" role="status">Loading…</p>}
      {state === 'missing' && <p className="mt-8" data-testid="blog-missing">This article does not exist or is not published.</p>}
      {state === 'ready' && post && (
        <article className="mt-8">
          <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">{[post.author, post.publishedAt ? formatDate(post.publishedAt) : ''].filter(Boolean).join(' · ')}</p>
          {/* plain text, rendered as paragraphs: article content is never injected as HTML */}
          {post.content.split(/\n{2,}/).map((para, i) => <p key={i} className="mb-4 leading-relaxed whitespace-pre-wrap">{para}</p>)}
        </article>
      )}
    </div>
  );
}
