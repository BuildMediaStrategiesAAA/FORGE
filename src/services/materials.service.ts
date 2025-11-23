import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MaterialLine } from '../lib/scaffold/takeoff';

export interface MaterialRecord {
  id: string;
  scaffold_model_id: string;
  item_code: string;
  name: string;
  qty: number;
  created_at: string;
}

/**
 * Saves material takeoff lines for a scaffold model.
 * Deletes existing materials for the model first, then bulk inserts new ones.
 */
export async function saveTakeoff(
  scaffold_model_id: string,
  lines: MaterialLine[],
  sb?: SupabaseClient
): Promise<void> {
  const client = sb ?? supabase;
  // Delete existing materials for this model
  const { error: deleteError } = await client
    .from('materials')
    .delete()
    .eq('scaffold_model_id', scaffold_model_id);

  if (deleteError) throw deleteError;

  // Bulk insert new materials
  if (lines.length > 0) {
    const records = lines.map((line) => ({
      scaffold_model_id,
      item_code: line.item_code,
      name: line.name,
      qty: line.qty,
    }));

    const { error: insertError } = await client
      .from('materials')
      .insert(records);

    if (insertError) throw insertError;
  }
}

/**
 * Lists all materials for a scaffold model, ordered by name.
 */
export async function listMaterials(
  scaffold_model_id: string,
  sb?: SupabaseClient
): Promise<MaterialRecord[]> {
  const client = sb ?? supabase;
  const { data, error } = await client
    .from('materials')
    .select('*')
    .eq('scaffold_model_id', scaffold_model_id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as MaterialRecord[];
}
