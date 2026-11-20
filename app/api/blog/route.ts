import { NextResponse } from 'next/server';
import { listPublished, supabaseConfigured } from '@/lib/server/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET -> { posts }: published rows of `blog_posts` only ([] when none are published or no database is configured). */
export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ posts: [] });
  try {
    const rows = await listPublished('blog_posts', 50);
    return NextResponse.json({ posts: rows.map((r) => ({ slug: r.slug, title: r.title, excerpt: r.excerpt, author: r.author_name, category: r.category, publishedAt: r.published_at })) });
  } catch {
    return NextResponse.json({ posts: [], error: 'Could not load articles right now.' }, { status: 502 });
  }
}
