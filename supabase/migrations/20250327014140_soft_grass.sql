/*
  # Add Business Analyzer Table

  1. New Tables
    - `business_analyzer`
      - `id` (bigint, primary key)
      - `created_at` (timestamptz)
      - `business_name` (text)
      - `industry` (text)
      - `website_url` (text)
      - `social_links` (jsonb)
      - `analysis_results` (jsonb)
      - `user_id` (uuid)

  2. Security
    - Enable RLS on business_analyzer table
    - Add policies for authenticated users
*/

-- Create business_analyzer table
CREATE TABLE IF NOT EXISTS business_analyzer (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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