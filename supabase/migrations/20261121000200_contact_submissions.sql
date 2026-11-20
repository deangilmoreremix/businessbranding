/*
  # Contact form submissions

  Messages from the public /contact form. Written ONLY by the server (service role) through POST /api/contact, which validates,
  size-limits and rate-limits per client; no client role (anon/authenticated) has any access to the table.
*/

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  subject text NOT NULL DEFAULT '' CHECK (char_length(subject) <= 300),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  client_hash text,                      -- salted hash of the client address (rate limiting); never the raw address
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_submissions_client_recent ON public.contact_submissions (client_hash, created_at DESC);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_submissions FROM anon, authenticated;
