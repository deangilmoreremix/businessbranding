/*
  # Fix Business Analyzer Table

  1. Changes
    - Drop existing business_analyzer table if exists
    - Recreate table with correct IDENTITY column syntax
    - Re-enable RLS and policies

  2. Security
    - Enable RLS
    - Add policy for full access (demo mode)
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS business_analyzer;

-- Create business_analyzer table with correct IDENTITY syntax
CREATE TABLE business_analyzer (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  business_name text,
  industry text,
  website_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  analysis_results jsonb DEFAULT '{}'::jsonb,
  user_id uuid
);

-- Enable RLS
ALTER TABLE business_analyzer ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to business_analyzer"
  ON business_analyzer
  FOR ALL
  USING (true)
  WITH CHECK (true);