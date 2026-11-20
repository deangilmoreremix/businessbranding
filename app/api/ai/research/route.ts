import { NextResponse } from 'next/server';
import { createStructured, isConfigured, reasoningModel, retrieveResponse, startBackground, WEB_SEARCH_TOOL } from '@/lib/openai';
import { errorResponse, rateLimit } from '@/lib/ai-http';

export const runtime = 'nodejs';

const KINDS = {
  competitors: { schema: 'competitor_intelligence', label: 'competitive landscape' },
  market: { schema: 'market_analysis', label: 'market' }
} as const;

/**
 * Long-running deep research in background mode (high reasoning effort + web_search).
 * POST { kind: 'competitors' | 'market', industry, brandDescription? } -> { id, status }   (returns immediately)
 * GET  ?id=...&kind=...  -> { status } while running, then { status: 'completed', data, citations }
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'research', 5);
  if (limited) return limited;
  try {
    const { kind, industry, brandDescription } = await request.json();
    if (!(kind in KINDS)) return NextResponse.json({ error: 'kind must be competitors or market' }, { status: 400 });
    if (typeof industry !== 'string' || !industry.trim() || industry.length > 200) return NextResponse.json({ error: 'industry is required' }, { status: 400 });
    if (!isConfigured()) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured', demo: true }, { status: 503 });

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
    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    return errorResponse(error, 'Failed to start research');
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') ?? '';
    const kind = url.searchParams.get('kind') ?? '';
    if (!/^resp_[A-Za-z0-9_-]+$/.test(id) || !(kind in KINDS)) return NextResponse.json({ error: 'Invalid id or kind' }, { status: 400 });

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
  } catch (error) {
    return errorResponse(error, 'Failed to read research result');
  }
}

