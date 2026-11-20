/**
 * Pure workflow model for the visual content workflow builder (React Flow is only the editor UI).
 * A workflow is a DAG of steps: brief -> copy -> (email | voice). Runs execute steps in topological order and feed each
 * step the text produced by the steps connected into it.
 */

export type StepKind = 'brief' | 'copy' | 'email' | 'voice';

export interface WorkflowNode {
  id: string;
  kind: StepKind;
  position: { x: number; y: number };
  data: Record<string, string>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  version: 1;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const STEP_LABELS: Record<StepKind, string> = {
  brief: 'Brief',
  copy: 'Generate copy (OpenAI)',
  email: 'Email template',
  voice: 'Voice-over (OpenAI)'
};

/** Steps that need text from an upstream step. */
const NEEDS_INPUT: StepKind[] = ['copy', 'email', 'voice'];

export function defaultWorkflow(): Workflow {
  return {
    version: 1,
    nodes: [
      { id: 'brief', kind: 'brief', position: { x: 0, y: 80 }, data: { text: 'Launch announcement for Acme Coffee, a small-batch roaster.' } },
      { id: 'copy', kind: 'copy', position: { x: 300, y: 80 }, data: { instruction: 'Write a short, warm launch announcement.' } },
      { id: 'email', kind: 'email', position: { x: 600, y: 0 }, data: { brandName: 'Acme Coffee', ctaLabel: 'Shop now', ctaUrl: 'https://example.com' } },
      { id: 'voice', kind: 'voice', position: { x: 600, y: 160 }, data: { voiceId: 'marin' } }
    ],
    edges: [
      { id: 'e1', source: 'brief', target: 'copy' },
      { id: 'e2', source: 'copy', target: 'email' },
      { id: 'e3', source: 'copy', target: 'voice' }
    ]
  };
}

/** Kahn's algorithm. Throws on cycles. */
export function executionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  const indeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const out = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
    out.get(e.source)!.push(e.target);
  }
  const queue = nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const t of out.get(id)!) {
      indeg.set(t, indeg.get(t)! - 1);
      if (indeg.get(t) === 0) queue.push(t);
    }
  }
  if (order.length !== nodes.length) throw new Error('The workflow contains a loop. Remove the connection that points back.');
  return order;
}

export function validateWorkflow(w: Workflow): string[] {
  const errors: string[] = [];
  const ids = new Set(w.nodes.map((n) => n.id));
  if (!w.nodes.some((n) => n.kind === 'brief')) errors.push('Add a Brief step to start from.');
  for (const e of w.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) errors.push(`Connection ${e.id} points to a missing step.`);
    const target = w.nodes.find((n) => n.id === e.target);
    if (target?.kind === 'brief') errors.push('A Brief cannot receive input.');
  }
  for (const n of w.nodes) {
    if (NEEDS_INPUT.includes(n.kind) && !w.edges.some((e) => e.target === n.id)) errors.push(`${STEP_LABELS[n.kind]} needs an input connection.`);
  }
  try {
    executionOrder(w.nodes, w.edges);
  } catch (e: any) {
    errors.push(e.message);
  }
  return errors;
}

/** Text from all steps connected into `nodeId`, in connection order. */
export function upstreamText(nodeId: string, edges: WorkflowEdge[], outputs: Record<string, string>): string {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => outputs[e.source])
    .filter(Boolean)
    .join('\n\n');
}

export function serializeWorkflow(w: Workflow): string {
  return JSON.stringify(w, null, 2);
}

const KINDS: StepKind[] = ['brief', 'copy', 'email', 'voice'];

/** Parse and validate imported JSON; throws a readable error for bad files. */
export function parseWorkflow(json: string): Workflow {
  let raw: any;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (raw?.version !== 1 || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) throw new Error('That file is not a workflow export.');
  const nodes: WorkflowNode[] = raw.nodes.map((n: any) => {
    if (!KINDS.includes(n?.kind) || typeof n.id !== 'string') throw new Error('The workflow contains an unknown step.');
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(n.data ?? {})) if (typeof v === 'string') data[k] = v.slice(0, 5000);
    return { id: n.id, kind: n.kind, position: { x: Number(n.position?.x) || 0, y: Number(n.position?.y) || 0 }, data };
  });
  const edges: WorkflowEdge[] = raw.edges.map((e: any) => ({ id: String(e.id), source: String(e.source), target: String(e.target) }));
  return { version: 1, nodes, edges };
}

/** Rendered step size (the builder gives every step a fixed 200px width; 80px is the tallest a step gets). */
export const STEP_W = 200;
export const STEP_H = 80;
const overlaps = (a: { x: number; y: number }, b: { x: number; y: number }, gap = 20) => Math.abs(a.x - b.x) < STEP_W + gap && Math.abs(a.y - b.y) < STEP_H + gap;

/** First position (scanning down the column, then right) that does not overlap any of `taken`. */
export function freePosition(taken: { x: number; y: number }[], start = { x: 0, y: 240 }): { x: number; y: number } {
  for (let col = 0; col < 20; col++) for (let row = 0; row < 40; row++) {
    const p = { x: start.x + col * (STEP_W + 40), y: start.y + row * (STEP_H + 30) };
    if (!taken.some((t) => overlaps(p, t))) return p;
  }
  return start;
}

/** Imported or older saved graphs may stack steps on top of each other: keep every position that is already clear, move only the overlapping ones. */
export function separateOverlaps<T extends { position: { x: number; y: number } }>(nodes: T[]): T[] {
  const placed: { x: number; y: number }[] = [];
  return nodes.map((n) => {
    const position = placed.some((p) => overlaps(p, n.position)) ? freePosition(placed, { x: n.position.x, y: n.position.y }) : n.position;
    placed.push(position);
    return position === n.position ? n : { ...n, position };
  });
}
