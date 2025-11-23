import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScaffoldGraph } from '../lib/scaffold/model';
import { nextRevision } from '../lib/scaffold/revisions';
import { runCompliance } from '../lib/compliance/tg20';

export interface ScaffoldModel {
  id: string;
  job_id: string;
  version: string;
  model_json: ScaffoldGraph;
  load_class: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Lists all scaffold models for a job, ordered newest first.
 */
export async function listModels(
  job_id: string,
  sb?: SupabaseClient
): Promise<ScaffoldModel[]> {
  const client = sb ?? supabase;
  const { data, error } = await client
    .from('scaffold_models')
    .select('*')
    .eq('job_id', job_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ScaffoldModel[];
}

/**
 * Returns the latest scaffold model for a job or null if none exists.
 */
export async function getLatestModel(
  job_id: string,
  sb?: SupabaseClient
): Promise<ScaffoldModel | null> {
  const client = sb ?? supabase;
  const { data, error } = await client
    .from('scaffold_models')
    .select('*')
    .eq('job_id', job_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ScaffoldModel | null;
}

/**
 * Creates a new scaffold model with automatic versioning.
 * If no existing models, starts at "Rev A", otherwise increments from latest.
 */
export async function createModel(
  job_id: string,
  graph: ScaffoldGraph,
  load_class: string,
  sb?: SupabaseClient
): Promise<ScaffoldModel> {
  const client = sb ?? supabase;
  const latest = await getLatestModel(job_id, client);
  const version = latest ? nextRevision(latest.version) : 'Rev A';

  const { data, error } = await client
    .from('scaffold_models')
    .insert({
      job_id,
      version,
      model_json: graph,
      load_class,
      is_published: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ScaffoldModel;
}

/**
 * Creates a new revision of the latest model for a job.
 * Computes next revision automatically and sets is_published=false.
 */
export async function supersedeModel(
  job_id: string,
  graph: ScaffoldGraph,
  load_class: string,
  sb?: SupabaseClient
): Promise<ScaffoldModel> {
  const client = sb ?? supabase;
  const latest = await getLatestModel(job_id, client);
  if (!latest) {
    throw new Error('No existing model found to supersede');
  }

  const version = nextRevision(latest.version);

  const { data, error } = await client
    .from('scaffold_models')
    .insert({
      job_id,
      version,
      model_json: graph,
      load_class,
      is_published: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ScaffoldModel;
}

/**
 * Publishes a model after running compliance checks.
 * Throws an error if compliance fails.
 */
export async function publishModel(
  model_id: string,
  sb?: SupabaseClient
): Promise<ScaffoldModel> {
  const client = sb ?? supabase;
  const { data: model, error: fetchError } = await client
    .from('scaffold_models')
    .select('*')
    .eq('id', model_id)
    .single();

  if (fetchError) throw fetchError;
  if (!model) throw new Error('Model not found');

  const compliance = runCompliance(model.model_json as ScaffoldGraph);

  if (!compliance.pass) {
    throw new Error(
      `Compliance failed:\n${compliance.issues.join('\n')}`
    );
  }

  const { data: updated, error: updateError } = await client
    .from('scaffold_models')
    .update({ is_published: true })
    .eq('id', model_id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated as ScaffoldModel;
}
