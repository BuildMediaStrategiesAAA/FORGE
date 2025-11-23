import { supabase } from '../lib/supabase';

export interface Dimensions {
  id: string;
  job_id: string;
  length_m: number | null;
  height_m: number | null;
  lift_m: number | null;
  bay_count: number | null;
  meta_source: string;
  created_at: string;
  updated_at: string;
}

export interface DimensionsInput {
  length_m?: number | null;
  height_m?: number | null;
  lift_m?: number | null;
  bay_count?: number | null;
}

export async function getDimensionsForJob(jobId: string): Promise<Dimensions | null> {
  const { data, error } = await supabase
    .from('dimensions')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertDimensions(jobId: string, input: DimensionsInput): Promise<Dimensions> {
  const { data, error } = await supabase
    .from('dimensions')
    .upsert({
      job_id: jobId,
      length_m: input.length_m,
      height_m: input.height_m,
      lift_m: input.lift_m,
      bay_count: input.bay_count,
      meta_source: 'manual',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'job_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
