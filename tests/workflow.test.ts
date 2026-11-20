import { describe, expect, it } from 'vitest';
import { defaultWorkflow, executionOrder, parseWorkflow, serializeWorkflow, upstreamText, validateWorkflow, type Workflow } from '@/lib/local/workflow';

describe('executionOrder', () => {
  it('orders the default workflow with upstream steps first', () => {
    const w = defaultWorkflow();
    const order = executionOrder(w.nodes, w.edges);
    expect(order.indexOf('brief')).toBeLessThan(order.indexOf('copy'));
    expect(order.indexOf('copy')).toBeLessThan(order.indexOf('email'));
    expect(order.indexOf('copy')).toBeLessThan(order.indexOf('voice'));
  });
  it('rejects loops', () => {
    const w = defaultWorkflow();
    w.edges.push({ id: 'loop', source: 'email', target: 'copy' });
    expect(() => executionOrder(w.nodes, w.edges)).toThrow(/loop/);
  });
});

describe('validateWorkflow', () => {
  it('accepts the default workflow', () => expect(validateWorkflow(defaultWorkflow())).toEqual([]));
  it('requires a brief and inputs for dependent steps', () => {
    const w: Workflow = { version: 1, nodes: [{ id: 'c', kind: 'copy', position: { x: 0, y: 0 }, data: {} }], edges: [] };
    const errors = validateWorkflow(w);
    expect(errors.some((e) => /Brief/.test(e))).toBe(true);
    expect(errors.some((e) => /needs an input/.test(e))).toBe(true);
  });
  it('rejects edges into a brief and to missing steps', () => {
    const w = defaultWorkflow();
    w.edges.push({ id: 'x', source: 'copy', target: 'brief' }, { id: 'y', source: 'copy', target: 'ghost' });
    const errors = validateWorkflow(w);
    expect(errors.some((e) => /cannot receive/.test(e))).toBe(true);
    expect(errors.some((e) => /missing step/.test(e))).toBe(true);
  });
});

describe('upstreamText', () => {
  it('joins the outputs of connected steps in edge order', () => {
    const edges = [{ id: '1', source: 'a', target: 'z' }, { id: '2', source: 'b', target: 'z' }, { id: '3', source: 'c', target: 'other' }];
    expect(upstreamText('z', edges, { a: 'first', b: 'second', c: 'nope' })).toBe('first\n\nsecond');
    expect(upstreamText('z', edges, {})).toBe('');
  });
});

describe('serialize / parse', () => {
  it('round-trips', () => {
    const w = defaultWorkflow();
    expect(parseWorkflow(serializeWorkflow(w))).toEqual(w);
  });
  it('rejects junk and unknown steps, and drops non-string data', () => {
    expect(() => parseWorkflow('nope')).toThrow(/JSON/);
    expect(() => parseWorkflow('{"version":2}')).toThrow(/workflow export/);
    expect(() => parseWorkflow('{"version":1,"nodes":[{"id":"a","kind":"hack"}],"edges":[]}')).toThrow(/unknown step/);
    const w = parseWorkflow('{"version":1,"nodes":[{"id":"a","kind":"brief","data":{"text":"ok","n":5}}],"edges":[]}');
    expect(w.nodes[0].data).toEqual({ text: 'ok' });
  });
});
