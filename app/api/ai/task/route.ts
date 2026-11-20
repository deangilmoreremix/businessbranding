import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/openai';
import { isTaskName, runTask } from '@/lib/ai-tasks';
import { errorResponse, rateLimit } from '@/lib/ai-http';

export const runtime = 'nodejs';

const MAX_INPUT_CHARS = 20000;

/** GET -> { configured } so the client can choose between live and demo data. */
export async function GET() {
  return NextResponse.json({ configured: isConfigured() });
}

/**
 * POST { task, input, imageUrls? } -> { data, citations }
 * `task` is a named task from lib/ai-tasks.ts (fixed schema, model tier, effort and tools).
 */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'task', 30);
  if (limited) return limited;

  try {
    const { task, input, imageUrls } = await request.json();
    if (!isTaskName(task)) return NextResponse.json({ error: 'Unknown task' }, { status: 400 });
    if (typeof input !== 'string' || !input.trim()) return NextResponse.json({ error: 'input is required' }, { status: 400 });
    if (input.length > MAX_INPUT_CHARS) return NextResponse.json({ error: 'input too long' }, { status: 413 });

    const urls = Array.isArray(imageUrls) ? imageUrls.filter((u) => typeof u === 'string' && /^(https:|data:image\/)/.test(u)).slice(0, 4) : undefined;
    return NextResponse.json(await runTask(task, input, { imageUrls: urls }));
  } catch (error) {
    return errorResponse(error, 'AI task failed');
  }
}
