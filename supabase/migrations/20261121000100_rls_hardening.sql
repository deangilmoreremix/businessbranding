/*
  # RLS hardening

  Found by the real-Postgres test (scripts/db-test.sh):
  - several tables had "full access" policies with USING (true): anyone holding the public anon key could read and write every
    row (business_analyzer, content_items, image_assets, voice_profiles, case_studies)
  - other tables allowed `auth.uid() = user_id OR user_id IS NULL` to the PUBLIC role, i.e. anonymous clients could read and write
    every row whose user_id is NULL

  After this migration every user-owned table is reachable only by its owner (role `authenticated`), `anon` sees nothing, and
  case_studies is world-readable only when published (writes: service_role only, which bypasses RLS).
*/

-- 1. permissive "everyone" policies -> removed
DROP POLICY IF EXISTS "Allow full access to business_analyzer" ON business_analyzer;
DROP POLICY IF EXISTS "Allow full access to content_items" ON content_items;
DROP POLICY IF EXISTS "Allow full access to image_assets" ON image_assets;
DROP POLICY IF EXISTS "Allow full access to voice_profiles" ON voice_profiles;
DROP POLICY IF EXISTS "Allow full access to case studies" ON case_studies;

-- 2. "owner OR user_id IS NULL" on the public role -> owner only, authenticated only
DROP POLICY IF EXISTS "Users can access their own events" ON analytics_events;
DROP POLICY IF EXISTS "Users can access their own brand analyses" ON brand_analyses;
DROP POLICY IF EXISTS "Users can access their own metrics" ON brand_metrics;
DROP POLICY IF EXISTS "Users can access their own content history" ON content_generation_history;
DROP POLICY IF EXISTS "Users can access their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can access their own sessions" ON user_sessions;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analytics_events','brand_analyses','brand_metrics','content_generation_history','user_preferences','user_sessions','business_analyzer','image_assets']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owner full access" ON %I', t);
    EXECUTE format('CREATE POLICY "Owner full access" ON %I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- 3. anonymous clients get no table privileges at all (RLS already hides rows; this is defence in depth)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'case_studies' LOOP
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;
-- published case studies stay publicly readable
GRANT SELECT ON case_studies TO anon;

-- 4. FUTURE tables: Supabase grants new public tables to anon/authenticated by default. Revoke that so a table added later is not
--    reachable until its migration grants access on purpose (and adds RLS policies). service_role keeps its default grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

-- 5. Explicit privileges for the owner-scoped tables (RLS decides which rows). Stating them here, rather than relying on defaults,
--    keeps the migration correct when an earlier migration recreates a table (DROP/CREATE) after the default privileges changed.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  analytics_events, brand_analyses, brand_metrics, content_generation_history, user_preferences, user_sessions,
  business_analyzer, image_assets, content_items, voice_profiles, user_settings
TO authenticated;
GRANT SELECT ON case_studies TO authenticated;

-- 6. No client role needs TRUNCATE (bypasses RLS), REFERENCES or TRIGGER on any table.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON %I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- 7. case_studies: anonymous visitors may only READ published rows (RLS); no insert/update/delete/truncate privileges at all.
REVOKE ALL ON case_studies FROM anon;
GRANT SELECT ON case_studies TO anon;

-- 8. Functions: nothing in `public` is callable by clients unless a migration grants it on purpose (rate limiting etc. are service-role only).
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
-- ... and the same for functions created LATER (PostgreSQL grants EXECUTE to PUBLIC by default)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) TO service_role;

-- 9. voice_profiles had an updated_at trigger but no updated_at column, so EVERY update failed ("record new has no field updated_at").
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 10. case_studies: authenticated users may only READ (published rows, via RLS); the original migrations left them write grants.
REVOKE ALL ON case_studies FROM authenticated;
GRANT SELECT ON case_studies TO authenticated;
