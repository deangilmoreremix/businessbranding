import { NextResponse } from 'next/server';
import { listPublished, supabaseConfigured } from '@/lib/server/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET -> one published post by slug (404 for drafts and unknown slugs). */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  if (!/^[a-z0-9-]{1,120}$/.test(params.slug) || !supabaseConfigured()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const post = (await listPublished('blog_posts', 100)).find((r) => r.slug === params.slug);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ post: { slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content, author: post.author_name, category: post.category, publishedAt: post.published_at } });
  } catch {
    return NextResponse.json({ error: 'Could not load this article.' }, { status: 502 });
  }
}
