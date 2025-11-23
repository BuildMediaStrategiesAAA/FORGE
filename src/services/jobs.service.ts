import { supabase } from '../lib/supabase';

export interface Job {
  id: string;
  title: string;
  site_address: string | null;
  status: 'draft' | 'active' | 'complete';
  start_date: string | null;
  expected_end_date: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateJobInput {
  title: string;
  site_address?: string;
  start_date?: string;
  expected_end_date?: string;
}

export interface UpdateJobInput {
  title?: string;
  site_address?: string;
  status?: 'draft' | 'active' | 'complete';
  start_date?: string;
  expected_end_date?: string;
}

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title: input.title,
      site_address: input.site_address || null,
      start_date: input.start_date || null,
      expected_end_date: input.expected_end_date || null,
      status: 'draft',
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
