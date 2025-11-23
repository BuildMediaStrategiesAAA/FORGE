/*
  # Create Jobs Table

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `title` (text, not null)
      - `site_address` (text)
      - `status` (text, default 'draft')
      - `start_date` (date, nullable)
      - `expected_end_date` (date, nullable)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `jobs` table
    - Add policy for users to view their own jobs
    - Add policy for users to create jobs
    - Add policy for users to update their own jobs
    - Add policy for users to delete their own jobs
*/

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  site_address text,
  status text DEFAULT 'draft',
  start_date date,
  expected_end_date date,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);