import {
  Bay,
  Lift,
  Node,
  StandardNode,
  BasePlateNode,
  Edge,
  ScaffoldGraph,
} from './model';

export interface DraftModelDims {
  length_m: number;
  height_m: number;
  lift_m: number;
  bay_length_m?: number;
}

export function generateDraftModelFromDims(
  dims: DraftModelDims,
): ScaffoldGraph {
  const {
    length_m,
    height_m,
    lift_m,
    bay_length_m: bayLengthInput = 2.0,
  } = dims;

  const bayCount = Math.max(1, Math.ceil(length_m / bayLengthInput));
  const liftCount = Math.max(1, Math.ceil(height_m / lift_m));

  const bays: Bay[] = [];
  for (let i = 0; i < bayCount; i += 1) {
    const nominalStart = i * bayLengthInput;
    const remaining = Math.max(length_m - nominalStart, 0);
    const effectiveLength =
      i === bayCount - 1 ? Math.min(remaining, bayLengthInput) || bayLengthInput : bayLengthInput;

    bays.push({
      index: i,
      length_m: effectiveLength,
    });
  }

  const lifts: Lift[] = [];
  for (let i = 0; i < liftCount; i += 1) {
    const nominalTop = (i + 1) * lift_m;
    const effectiveHeight =
      i === liftCount - 1 ? Math.min(height_m, nominalTop) || nominalTop : nominalTop;

    lifts.push({
      index: i,
      height_m: effectiveHeight,
    });
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const bay of bays) {
    const bayIndex = bay.index;

    const basePlateId = `baseplate_${bayIndex}_0`;
    const basePlate: BasePlateNode = {
      id: basePlateId,
      type: 'BasePlate',
      bay_index: bayIndex,
      lift_index: 0,
    };
    nodes.push(basePlate);

    for (const lift of lifts) {
      const liftIndex = lift.index;
      const standardId = `standard_${bayIndex}_${liftIndex}`;
      const standard: StandardNode = {
        id: standardId,
        type: 'Standard',
        bay_index: bayIndex,
        lift_index: liftIndex,
      };
      nodes.push(standard);

      if (liftIndex === 0) {
        edges.push({
          id: `edge_vertical_${bayIndex}_base_to_0`,
          from: basePlateId,
          to: standardId,
          kind: 'Vertical',
        });
      }

      if (liftIndex > 0) {
        const belowId = `standard_${bayIndex}_${liftIndex - 1}`;
        edges.push({
          id: `edge_vertical_${bayIndex}_${liftIndex - 1}_to_${liftIndex}`,
          from: belowId,
          to: standardId,
          kind: 'Vertical',
        });
      }
    }
  }

  for (const lift of lifts) {
    const liftIndex = lift.index;
    for (let bayIndex = 0; bayIndex < bayCount - 1; bayIndex += 1) {
      const fromId = `standard_${bayIndex}_${liftIndex}`;
      const toId = `standard_${bayIndex + 1}_${liftIndex}`;
      edges.push({
        id: `edge_ledger_${bayIndex}_to_${bayIndex + 1}_lift_${liftIndex}`,
        from: fromId,
        to: toId,
        kind: 'Ledger',
      });
    }
  }

  const graph: ScaffoldGraph = {
    bays,
    lifts,
    nodes,
    edges,
    meta: {
      version: '1.0',
      params: {
        length_m,
        height_m,
        lift_m,
        bay_length_m: bayLengthInput,
      },
    },
  };

  return graph;
}

export function estimateLoadClass(graph: ScaffoldGraph): string {
  const bayCount = graph.bays.length;

  const maxHeight =
    graph.lifts.length > 0
      ? graph.lifts.reduce(
          (acc, lift) => (lift.height_m > acc ? lift.height_m : acc),
          0,
        )
      : 0;

  if (maxHeight <= 10 && bayCount <= 8) {
    return 'Class 3';
  }

  if (maxHeight <= 20) {
    return 'Class 4';
  }

  return 'Class 5';
}

