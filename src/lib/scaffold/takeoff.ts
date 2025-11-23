import type { ScaffoldGraph } from './model';

export type MaterialLine = {
  item_code: string;
  name: string;
  qty: number;
};

/**
 * Converts a ScaffoldGraph into normalized material lines using deterministic takeoff rules v1.
 *
 * Rules:
 * - Standards: 2 per bay per lift (front + back)
 * - Ledgers: 2 per bay per lift
 * - Transoms: 2 per bay per lift
 * - Baseplates: 2 per bay (front + back)
 * - Guardrails: 2 per bay per top lift
 * - Toeboards: 2 per bay per top lift
 * - Diagonals: 1 per bay every 5 bays per lift (approx)
 * - Ties: 1 per bay every 4 bays per lift (approx)
 */
export function takeoffFromGraph(graph: ScaffoldGraph): MaterialLine[] {
  const numBays = graph.bays.length;
  const numLifts = graph.lifts.length;

  if (numBays === 0 || numLifts === 0) {
    return [];
  }

  const materials: MaterialLine[] = [];

  // Standards: 2 per bay per lift (front + back)
  materials.push({
    item_code: 'STD',
    name: 'Standard',
    qty: 2 * numBays * numLifts,
  });

  // Ledgers: 2 per bay per lift
  materials.push({
    item_code: 'LDG',
    name: 'Ledger',
    qty: 2 * numBays * numLifts,
  });

  // Transoms: 2 per bay per lift
  materials.push({
    item_code: 'TRS',
    name: 'Transom',
    qty: 2 * numBays * numLifts,
  });

  // Baseplates: 2 per bay (front + back)
  materials.push({
    item_code: 'BSP',
    name: 'Baseplate',
    qty: 2 * numBays,
  });

  // Guardrails: 2 per bay per top lift
  materials.push({
    item_code: 'GRD',
    name: 'Guardrail',
    qty: 2 * numBays,
  });

  // Toeboards: 2 per bay per top lift
  materials.push({
    item_code: 'TOE',
    name: 'Toeboard',
    qty: 2 * numBays,
  });

  // Diagonals: 1 per bay every 5 bays per lift (approx)
  const diagonalBays = Math.ceil(numBays / 5);
  materials.push({
    item_code: 'DIA',
    name: 'Diagonal',
    qty: diagonalBays * numLifts,
  });

  // Ties: 1 per bay every 4 bays per lift (approx)
  const tieBays = Math.ceil(numBays / 4);
  materials.push({
    item_code: 'TIE',
    name: 'Tie',
    qty: tieBays * numLifts,
  });

  return materials;
}
