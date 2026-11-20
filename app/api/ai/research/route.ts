import { NextResponse } from 'next/server';
import { createStructured, reasoningModel, retrieveResponse, startBackground, WEB_SEARCH_TOOL } from '@/lib/openai';
import { getJob, insertJob, withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

const KINDS = {
  competitors: { schema: 'competitor_intelligence', label: 'competitive landscape' },
  market: { schema: 'market_analysis', label: 'market' }
} as const;

/**
 * Long-running deep research in background mode (high reasoning effort + web_search), always with the CALLER's own key.
 * POST { kind: 'competitors' | 'market', industry, brandDescription? } -> { id, status }   (returns immediately)
 * GET  ?id=...&kind=...  -> { status } while running, then { status: 'completed', data, citations }
 * The job id is recorded against the user; polling someone else's id returns 404, and polling uses the owner's key.
 */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'research', limit: 5, windowSeconds: 300 }, async (ctx) => {
    const { kind, industry, brandDescription } = await request.json();
    if (!(kind in KINDS)) return NextResponse.json({ error: 'kind must be competitors or market' }, { status: 400 });
    if (typeof industry !== 'string' || !industry.trim() || industry.length > 200) return NextResponse.json({ error: 'industry is required' }, { status: 400 });

    const k = KINDS[kind as keyof typeof KINDS];
    const job = await startBackground({
      feature: `research:${kind}`,
      model: reasoningModel(),
      effort: 'high',
      developer: 'You are a senior market and brand analyst. Research thoroughly with web search, cite current facts, and write a detailed report.',
      input: `Produce a detailed ${k.label} analysis for the ${industry} industry. Brand context: ${typeof brandDescription === 'string' ? brandDescription.slice(0, 1000) : 'n/a'}.`,
      tools: [{ ...WEB_SEARCH_TOOL }],
      completionWindow: 'soonest'
    });
    await insertJob(ctx.userId, job.id, kind);
    return NextResponse.json(job, { status: 202 });
  });
}

export async function GET(request: Request) {
  return withUser(request, { bucket: 'research-poll', limit: 120 }, async (ctx) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') ?? '';
    const kind = url.searchParams.get('kind') ?? '';
    if (!/^resp_[A-Za-z0-9_-]+$/.test(id) || !(kind in KINDS)) return NextResponse.json({ error: 'Invalid id or kind' }, { status: 400 });
    if (!(await getJob(ctx.userId, id))) return NextResponse.json({ error: 'Research job not found', code: 'JOB_NOT_FOUND' }, { status: 404 });

    const result = await retrieveResponse(id);
    if (result.status === 'queued' || result.status === 'in_progress') return NextResponse.json({ status: result.status });
    if (result.status !== 'completed' || !result.parsed) return NextResponse.json({ status: result.status, error: result.error }, { status: 502 });

    // Convert the finished report into the strict schema the UI consumes.
    const k = KINDS[kind as keyof typeof KINDS];
    const { data } = await createStructured(k.schema, {
      feature: `research:${kind}:structure`,
      effort: 'low',
      input: `Convert this research report into the required JSON structure.\n\nReport:\n${result.parsed.text}`
    });
    return NextResponse.json({ status: 'completed', data, citations: result.parsed.citations });
  });
}
