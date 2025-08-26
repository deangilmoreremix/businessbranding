/*
  # Case Studies System

  1. New Tables
    - `case_studies`
      - `id` (uuid, primary key)
      - `title` (text)
      - `industry` (text)
      - `challenge` (text)
      - `solution` (text)
      - `results` (jsonb) - Metrics, testimonials, before/after data
      - `implementation` (jsonb) - Timeline, process, tools used
      - `images` (text[]) - URLs to case study images
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `published` (boolean)
      - `slug` (text)
      - `featured` (boolean)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS
    - Add policies for viewing and managing case studies
*/

-- Create case_studies table
CREATE TABLE IF NOT EXISTS case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  industry text NOT NULL,
  challenge text NOT NULL,
  solution text NOT NULL,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  implementation jsonb NOT NULL DEFAULT '{}'::jsonb,
  images text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published boolean DEFAULT false,
  slug text UNIQUE NOT NULL,
  featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to published case studies"
  ON case_studies
  FOR SELECT
  USING (published = true);

CREATE POLICY "Allow full access to case studies"
  ON case_studies
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_case_studies_updated_at
  BEFORE UPDATE ON case_studies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();