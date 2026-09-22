export interface VarMeta {
  type: string;
  value?: number | string | null;
  fields?: Record<string, unknown>;
  arg?: boolean;
}

export interface ArrayInfo {
  name: string;
  addr: string | null;
  length: number;
  elem_size: number;
  elems: (number | string | null)[];
  type: string;
}

export interface PointerInfo {
  name: string;
  value: string;
  target_addr: number;
  target?: string | null;
  target_index?: number | null;
  target_type?: string | null;
  is_struct: boolean;
  null: boolean;
}

export interface ListNode {
  addr: string;
  label: number | string | null;
  next: string;
  fields: Record<string, unknown>;
}

export interface LinkedList {
  head: string;
  nodes: ListNode[];
  next_field: string;
}

export interface Stats {
  comparisons: number;
  swaps: number;
  visits: number;
}

export interface TraceEvent {
  step: number;
  line: number;
  line_text: string;
  function: string;
  stack: string[];
  event: string;
  variables: Record<string, VarMeta>;
  arrays: ArrayInfo[];
  pointers: PointerInfo[];
  memory: { address: string; name: string; value: unknown }[];
  linked_lists: LinkedList[];
  stdout: string;
  stdout_delta: string;
  stats?: Stats;
  swap?: { array: string; i: number; j: number };
}

export interface RunResult {
  ok: boolean;
  events: TraceEvent[];
  stats: Stats;
  compile_error: string | null;
  trace_error: string | null;
  truncated: boolean;
}
