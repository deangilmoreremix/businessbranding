import type { TaskName } from '@/lib/ai-tasks';
import { authFetch, toApiError } from '@/lib/client/auth-fetch';
import { isObj, readJson, requireShape } from '@/lib/client/validate';

/** Required top-level keys (and which must be arrays) of a task's `data`; a reply that lacks them is "unreadable", never rendered. */
export interface DataShape { keys: string[]; arrays?: string[] }

/**
 * AI features (Responses API + Structured Outputs), usable from server and client code.
 *  - server (API routes): runs the named task directly (lib/ai-tasks.ts)
 *  - browser: calls /api/ai/task so the OpenAI key never reaches the client
 * Every result is schema-validated JSON. There is NO fallback data: when a request cannot be completed (no key, no session, rate
 * limit, upstream error) the function throws an ApiError (status + code) and the UI shows the cause with a Retry action.
 */

export interface AITaskResult<T> {
  data: T;
  /** Web sources used by search-backed tasks; show them as links wherever the data is displayed. */
  citations: { url: string; title?: string }[];
}

/** Run a named AI task and return schema-validated data. */
export async function callTask<T = any>(task: TaskName, input: string, opts: { imageUrls?: string[]; shape?: DataShape } = {}): Promise<AITaskResult<T>> {
  if (typeof window === 'undefined') {
    const { runTask } = await import('@/lib/ai-tasks');
    return runTask<T>(task, input, opts);
  }
  const res = await authFetch('/api/ai/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input, imageUrls: opts.imageUrls })
  });
  if (!res.ok) throw await toApiError(res, 'AI request failed');
  const body = requireShape<AITaskResult<T>>(await readJson(res), ['data']);
  if (!isObj(body.data)) requireShape(null, []);
  if (opts.shape) requireShape(body.data, opts.shape.keys, opts.shape.arrays);
  return { data: body.data as T, citations: Array.isArray(body.citations) ? body.citations : [] };
}

const isImageRef = (u: unknown): u is string => typeof u === 'string' && /^(https?:|data:image\/)/.test(u);

async function analyzeMultimodal(content: {
  text?: string;
  voiceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  try {
    // Images are sent as vision input; audio/video are referenced by URL in the prompt text.
    const imageUrls = isImageRef(content.imageUrl) ? [content.imageUrl] : undefined;
    return (await callTask('multimodal_analysis', `Analyze this content across multiple modalities: ${JSON.stringify(content)}`, { imageUrls })).data;
  } catch (error) {
    console.error('Multimodal analysis failed:', error);
    throw error;
  }
}

async function performEnhancedAnalysis(text: string) {
  try {
    return (await callTask('enhanced_text_analysis', `Analyze and enhance this text content for improved clarity, engagement, and brand impact:\n\n${text}\n\nProvide the enhanced content, specific improvements made, metrics, and additional recommendations.`)).data;
  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    throw error;
  }
}

export { analyzeMultimodal, performEnhancedAnalysis };
