/**
 * Deep competitor/market research in OpenAI background mode (high reasoning effort + web search).
 * start() returns immediately with a job id; poll() until status is 'completed'.
 */
export type ResearchKind = 'competitors' | 'market';

export async function startResearch(kind: ResearchKind, industry: string, brandDescription?: string): Promise<{ id: string }> {
  const res = await fetch('/api/ai/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, industry, brandDescription })
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to start research');
  return res.json();
}

export async function pollResearch<T = any>(
  kind: ResearchKind,
  id: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<{ data: T; citations: { url: string; title?: string }[] }> {
  const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60_000);
  while (Date.now() < deadline) {
    const res = await fetch(`/api/ai/research?kind=${kind}&id=${encodeURIComponent(id)}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Research failed');
    if (body.status === 'completed') return body;
    await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3000));
  }
  throw new Error('Research timed out');
}
