-- Create brand_analyses table for storing brand analysis results
CREATE TABLE IF NOT EXISTS brand_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  business_idea text NOT NULL,
  health_score numeric(5,2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  market_fit numeric(3,2) NOT NULL CHECK (market_fit >= 0 AND market_fit <= 1),
  uniqueness_score numeric(3,2) NOT NULL CHECK (uniqueness_score >= 0 AND uniqueness_score <= 1),
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  competitors_data jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_sessions table for tracking user activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_data jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- Create brand_metrics table for storing real-time metrics
CREATE TABLE IF NOT EXISTS brand_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  brand_analysis_id uuid REFERENCES brand_analyses(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value jsonb NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

-- Create content_generation_history table
CREATE TABLE IF NOT EXISTS content_generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  content_type text NOT NULL CHECK (content_type IN ('voice', 'image', 'text')),
  prompt text,
  generated_content jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE brand_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for demo - in production these would be more restrictive)
CREATE POLICY "Users can access their own brand analyses" ON brand_analyses
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can access their own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can access their own events" ON analytics_events
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can access their own metrics" ON brand_metrics
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can access their own content history" ON content_generation_history
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can access their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_analyses_user_id ON brand_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_analyses_created_at ON brand_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_metrics_user_id ON brand_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_metrics_recorded_at ON brand_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_generation_history_user_id ON content_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_generation_history_created_at ON content_generation_history(created_at DESC);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_brand_analyses_updated_at ON brand_analyses;
CREATE TRIGGER update_brand_analyses_updated_at
  BEFORE UPDATE ON brand_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();