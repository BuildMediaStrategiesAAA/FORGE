-- Create Storage Bucket for Job Photos
-- 1. New Bucket: job-photos for storing site photos
-- 2. Security: Users can only access photos from their own jobs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload photos to their jobs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = split_part(name, '/', 1)
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view photos from their jobs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = split_part(name, '/', 1)
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their jobs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = split_part(name, '/', 1)
      AND jobs.created_by = auth.uid()
    )
  );