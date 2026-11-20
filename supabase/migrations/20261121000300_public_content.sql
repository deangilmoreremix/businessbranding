/*
  # Public content tables

  - blog_posts: published articles shown on /blogs (public read of published rows; writes by the service role / dashboard only)
  - newsletter_subscriptions: addresses saved by the footer/blog "Subscribe" form via POST /api/newsletter (service role only).
    Nothing is sent automatically: it is a saved list, and the UI says so.
*/

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,120}$'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  excerpt text NOT NULL DEFAULT '' CHECK (char_length(excerpt) <= 1000),
  content text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT '' CHECK (char_length(author_name) <= 200),
  category text NOT NULL DEFAULT '' CHECK (char_length(category) <= 100),
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read of published posts" ON public.blog_posts;
CREATE POLICY "Public read of published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
REVOKE ALL ON public.blog_posts FROM anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  client_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_email_key ON public.newsletter_subscriptions (lower(email));
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_subscriptions FROM anon, authenticated;
