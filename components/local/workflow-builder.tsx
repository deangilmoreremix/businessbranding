'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Background, Controls, Handle, Position, ReactFlow, addEdge, useEdgesState, useNodesState, type Connection, type Node, type NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FolderOpen, Loader2, Play, Plus, Save, Trash2 } from 'lucide-react';
import { STEP_LABELS, STEP_W, freePosition, separateOverlaps, defaultWorkflow, executionOrder, parseWorkflow, serializeWorkflow, upstreamText, validateWorkflow, type StepKind, type Workflow } from '@/lib/local/workflow';
import { openFile, saveFile } from '@/lib/local/fs-access';
import { useLocalDraft } from '@/lib/local/use-draft';
import { authFetch } from '@/lib/client/auth-fetch';

type StepData = { kind: StepKind; values: Record<string, string> };
type StepNode = Node<StepData, 'step'>;

interface StepResult { text?: string; html?: string; audioUrl?: string; error?: string }

function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  return (
    <div className={`rounded-lg border bg-background px-3 py-2 text-sm shadow ${selected ? 'ring-2 ring-primary' : ''}`} style={{ width: STEP_W, minHeight: 56 }}>
      {data.kind !== 'brief' && <Handle type="target" position={Position.Left} />}
      <div className="font-medium">{STEP_LABELS[data.kind]}</div>
      <div className="text-xs text-muted-foreground line-clamp-2">{Object.values(data.values)[0] || 'Click to edit'}</div>
      {(data.kind === 'brief' || data.kind === 'copy') && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

const nodeTypes = { step: StepNodeView };

const FIELDS: Record<StepKind, { key: string; label: string; multiline?: boolean }[]> = {
  brief: [{ key: 'text', label: 'Brief', multiline: true }],
  copy: [{ key: 'instruction', label: 'Instruction', multiline: true }],
  email: [{ key: 'brandName', label: 'Brand name' }, { key: 'ctaLabel', label: 'Button label' }, { key: 'ctaUrl', label: 'Button link (https://…)' }],
  voice: [{ key: 'voiceId', label: 'Voice (marin, cedar, alloy…)' }]
};

const toFlow = (w: Workflow) => ({
  nodes: separateOverlaps(w.nodes.map<StepNode>((n) => ({ id: n.id, type: 'step', position: n.position, data: { kind: n.kind, values: n.data } }))),
  edges: w.edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
});

/**
 * Visual content workflow builder (React Flow). Steps run in dependency order using OpenAI (copy via the Responses API,
 * voice-over via text-to-speech) and a React Email template. The graph is autosaved locally and can be exported/imported.
 */
export default function WorkflowBuilder() {
  const initial = useMemo(() => toFlow(defaultWorkflow()), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [running, setRunning] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const counter = useRef(1);

  const toWorkflow = useCallback((): Workflow => ({
    version: 1,
    nodes: nodes.map((n) => ({ id: n.id, kind: n.data.kind, position: n.position, data: n.data.values })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
  }), [nodes, edges]);

  // Autosave to IndexedDB (restored on the next visit).
  const [saved, setSaved, restored] = useLocalDraft<Workflow | null>('workflow:current', null);
  const loaded = useRef(false);
  if (restored && !loaded.current) {
    loaded.current = true;
    if (saved) { const f = toFlow(saved); setNodes(f.nodes); setEdges(f.edges); }
  }
  const latest = toWorkflow();
  const latestJson = JSON.stringify(latest);
  const lastSaved = useRef('');
  if (restored && latestJson !== lastSaved.current && loaded.current) { lastSaved.current = latestJson; setTimeout(() => setSaved(latest), 0); }

  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, id: `e${Date.now()}` }, es)), [setEdges]);

  const addStep = (kind: StepKind) => {
    const id = `${kind}-${Date.now().toString(36)}${counter.current++}`;
    const defaults: Record<StepKind, Record<string, string>> = {
      brief: { text: '' }, copy: { instruction: 'Write the copy.' }, email: { brandName: 'Your Brand', ctaLabel: '', ctaUrl: '' }, voice: { voiceId: 'marin' }
    };
    setNodes((ns) => [...ns, { id, type: 'step', position: freePosition(ns.map((x) => x.position)), data: { kind, values: defaults[kind] } }]);
    setSelectedId(id);
  };

  const updateValue = (key: string, value: string) =>
    setNodes((ns) => ns.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, values: { ...n.data.values, [key]: value } } } : n)));

  const run = async () => {
    const w = toWorkflow();
    const errs = validateWorkflow(w);
    setProblems(errs);
    if (errs.length) return;
    setRunning(true);
    setResults({});
    const outputs: Record<string, string> = {};
    const res: Record<string, StepResult> = {};
    try {
      for (const id of executionOrder(w.nodes, w.edges)) {
        const node = w.nodes.find((n) => n.id === id)!;
        const input = upstreamText(id, w.edges, outputs);
        try {
          if (node.kind === 'brief') {
            outputs[id] = node.data.text ?? '';
            res[id] = { text: outputs[id] };
          } else if (node.kind === 'copy') {
            const r = await authFetch('/api/ai/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'brand_content', input: `${node.data.instruction ?? ''}\n\nBrief:\n${input}` }) });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `AI request failed (${r.status})`);
            const { data } = await r.json();
            outputs[id] = `${data.title}\n\n${data.content}`;
            res[id] = { text: outputs[id] };
          } else if (node.kind === 'email') {
            const [headline, ...rest] = input.split('\n\n');
            const r = await authFetch('/api/email/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...node.data, headline, body: rest.join('\n\n') }) });
            if (!r.ok) throw new Error('Email rendering failed');
            res[id] = { html: (await r.json()).html };
          } else if (node.kind === 'voice') {
            const r = await authFetch('/api/voice/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input, voiceId: node.data.voiceId }) });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Voice generation failed (${r.status})`);
            res[id] = { audioUrl: URL.createObjectURL(await r.blob()) };
          }
        } catch (e: any) {
          res[id] = { error: e.message };
          setResults({ ...res });
          break; // stop at the first failing step
        }
        setResults({ ...res });
      }
    } finally {
      setRunning(false);
    }
  };

  const selected = nodes.find((n) => n.id === selectedId);

  return (
    <div className="space-y-4" data-testid="workflow-builder">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STEP_LABELS) as StepKind[]).map((k) => (
          <Button key={k} size="sm" variant="outline" onClick={() => addStep(k)}><Plus className="h-4 w-4 mr-1" />{STEP_LABELS[k]}</Button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => saveFile(new Blob([serializeWorkflow(toWorkflow())], { type: 'application/json' }), 'workflow.json', { 'application/json': ['.json'] })}><Save className="h-4 w-4 mr-1" />Export</Button>
        <Button size="sm" variant="outline" onClick={async () => {
          const file = await openFile({ 'application/json': ['.json'] });
          if (!file) return;
          try { const f = toFlow(parseWorkflow(await file.text())); setNodes(f.nodes); setEdges(f.edges); setProblems([]); } catch (e: any) { setProblems([e.message]); }
        }}><FolderOpen className="h-4 w-4 mr-1" />Import</Button>
        <Button size="sm" onClick={run} disabled={running}>{running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}Run workflow</Button>
      </div>

      {problems.length > 0 && <ul className="text-sm text-red-500 list-disc pl-5" role="alert">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="h-[420px] rounded border">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)} fitView deleteKeyCode={['Backspace', 'Delete']}>
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <div className="space-y-3">
          {selected ? (
            <>
              <h4 className="font-medium">{STEP_LABELS[selected.data.kind]}</h4>
              {FIELDS[selected.data.kind].map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  {f.multiline
                    ? <Textarea rows={4} value={selected.data.values[f.key] ?? ''} onChange={(e) => updateValue(f.key, e.target.value)} />
                    : <Input value={selected.data.values[f.key] ?? ''} onChange={(e) => updateValue(f.key, e.target.value)} />}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => { setNodes((ns) => ns.filter((n) => n.id !== selected.id)); setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id)); setSelectedId(null); }}><Trash2 className="h-4 w-4 mr-1" />Delete step</Button>
            </>
          ) : <p className="text-sm text-muted-foreground">Select a step to edit it. Drag from a step&apos;s right handle to another step&apos;s left handle to connect them.</p>}
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-3" data-testid="workflow-results">
          <h4 className="font-medium">Results</h4>
          {nodes.filter((n) => results[n.id]).map((n) => {
            const r = results[n.id];
            return (
              <div key={n.id} className="rounded border p-3 space-y-2">
                <p className="text-sm font-medium">{STEP_LABELS[n.data.kind]}</p>
                {r.error && <p className="text-sm text-red-500">{r.error}</p>}
                {r.text && <p className="text-sm whitespace-pre-wrap">{r.text}</p>}
                {r.audioUrl && <audio controls src={r.audioUrl} className="w-full" />}
                {r.html && <iframe title="Email preview" sandbox="" srcDoc={r.html} className="w-full h-96 rounded border bg-white" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
