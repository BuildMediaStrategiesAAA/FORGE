import { supabase } from '../lib/supabase';

export interface Photo {
  id: string;
  job_id: string;
  storage_path: string;
  taken_at: string;
  meta_json: any;
  annotated_points_json: any;
  created_at: string;
}

export async function uploadPhoto(jobId: string, file: File): Promise<Photo> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const storagePath = `${jobId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('job-photos')
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('photos')
    .insert({
      job_id: jobId,
      storage_path: storagePath,
      taken_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return data;
}

export async function getPhotosForJob(jobId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('job_id', jobId)
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('job-photos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function deletePhoto(photoId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from('job-photos')
    .remove([storagePath]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (dbError) throw dbError;
}
