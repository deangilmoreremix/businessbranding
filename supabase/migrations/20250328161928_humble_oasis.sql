/*
  # Content Management System Tables

  1. New Tables
    - `content_items`
      - `id` (uuid, primary key)
      - `title` (text)
      - `type` (text) - podcast, audiobook, video, voice_over
      - `url` (text) - URL to the generated content
      - `metadata` (jsonb) - Additional metadata specific to content type
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid)
    
    - `voice_profiles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `voice_id` (text) - ElevenLabs voice ID
      - `settings` (jsonb) - Voice settings and parameters
      - `created_at` (timestamptz)
      - `user_id` (uuid)
    
    - `image_assets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `url` (text)
      - `prompt` (text, optional)
      - `style` (text, optional)
      - `source` (text, optional)
      - `tags` (text array, optional)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid)

  2. Security
    - Enable RLS on all tables
    - Add policies for all users to view and manage content
*/

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('podcast', 'audiobook', 'video', 'voice_over')),
  url text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Create voice_profiles table
CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  voice_id text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Create image_assets table
CREATE TABLE IF NOT EXISTS image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  prompt text,
  style text,
  source text,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that allow full access (for demo purposes)
-- In a production environment, these would be more restrictive
CREATE POLICY "Allow full access to content_items"
  ON content_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to voice_profiles"
  ON voice_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to image_assets"
  ON image_assets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_image_assets_updated_at ON image_assets;
CREATE TRIGGER update_image_assets_updated_at
  BEFORE UPDATE ON image_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();