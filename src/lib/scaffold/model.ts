export interface Bay {
  index: number;
  length_m: number;
  meta?: Record<string, unknown>;
}

export interface Lift {
  index: number;
  height_m: number;
  meta?: Record<string, unknown>;
}

export type NodeType =
  | 'Standard'
  | 'Ledger'
  | 'Transom'
  | 'BasePlate'
  | 'ToeBoard'
  | 'Guardrail'
  | 'Tie'
  | 'Diagonal'
  | 'LadderAccess';

export interface BaseNode {
  id: string;
  type: NodeType;
  bay_index: number;
  lift_index: number;
  meta?: Record<string, unknown>;
}

export interface StandardNode extends BaseNode {
  type: 'Standard';
}

export interface LedgerNode extends BaseNode {
  type: 'Ledger';
}

export interface TransomNode extends BaseNode {
  type: 'Transom';
}

export interface BasePlateNode extends BaseNode {
  type: 'BasePlate';
}

export interface ToeBoardNode extends BaseNode {
  type: 'ToeBoard';
}

export interface GuardrailNode extends BaseNode {
  type: 'Guardrail';
}

export interface TieNode extends BaseNode {
  type: 'Tie';
}

export interface DiagonalNode extends BaseNode {
  type: 'Diagonal';
}

export interface LadderAccessNode extends BaseNode {
  type: 'LadderAccess';
}

export type Node =
  | StandardNode
  | LedgerNode
  | TransomNode
  | BasePlateNode
  | ToeBoardNode
  | GuardrailNode
  | TieNode
  | DiagonalNode
  | LadderAccessNode;

export interface Edge {
  id?: string;
  from: string;
  to: string;
  kind: string;
  meta?: Record<string, unknown>;
}

export interface ScaffoldGraphMeta {
  version?: string;
  created_at?: string;
  params?: {
    length_m: number;
    height_m: number;
    lift_m: number;
    bay_length_m: number;
  };
  [key: string]: unknown;
}

export interface ScaffoldGraph {
  bays: Bay[];
  lifts: Lift[];
  nodes: Node[];
  edges: Edge[];
  meta: ScaffoldGraphMeta;
}

