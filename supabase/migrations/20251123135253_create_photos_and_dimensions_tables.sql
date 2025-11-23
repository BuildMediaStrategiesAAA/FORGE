/*
  # Create Photos and Dimensions Tables

  1. New Tables
    - `photos`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `job_id` (uuid, references jobs, not null)
      - `storage_path` (text, not null)
      - `taken_at` (timestamptz, default now())
      - `meta_json` (jsonb, nullable)
      - `annotated_points_json` (jsonb, nullable)
      - `created_at` (timestamptz, default now())
    
    - `dimensions`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `job_id` (uuid, references jobs, unique, not null)
      - `length_m` (numeric, nullable)
      - `height_m` (numeric, nullable)
      - `lift_m` (numeric, nullable)
      - `bay_count` (int, nullable)
      - `meta_source` (text, default 'manual')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Users can access photos/dimensions for jobs they own
    - Add policies for select, insert, update, delete operations
*/

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  taken_at timestamptz DEFAULT now(),
  meta_json jsonb,
  annotated_points_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  length_m numeric,
  height_m numeric,
  lift_m numeric,
  bay_count int,
  meta_source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos for their jobs"
  ON photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = photos.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add photos to their jobs"
  ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = photos.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their jobs"
  ON photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = photos.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view dimensions for their jobs"
  ON dimensions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = dimensions.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add dimensions to their jobs"
  ON dimensions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = dimensions.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update dimensions for their jobs"
  ON dimensions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = dimensions.job_id
      AND jobs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = dimensions.job_id
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete dimensions from their jobs"
  ON dimensions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = dimensions.job_id
      AND jobs.created_by = auth.uid()
    )
  );