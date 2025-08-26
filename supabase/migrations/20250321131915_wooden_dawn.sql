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
      - `user_id` (uuid) - References auth.users
    
    - `voice_profiles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `voice_id` (text) - ElevenLabs voice ID
      - `settings` (jsonb) - Voice settings and parameters
      - `created_at` (timestamptz)
      - `user_id` (uuid) - References auth.users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own content
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
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create voice_profiles table
CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  voice_id text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for content_items
CREATE POLICY "Users can create their own content"
  ON content_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own content"
  ON content_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content"
  ON content_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON content_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for voice_profiles
CREATE POLICY "Users can create their own voice profiles"
  ON voice_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice profiles"
  ON voice_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profiles"
  ON voice_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice profiles"
  ON voice_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();