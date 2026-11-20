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
