import { describeOpenAIError, generateImage, runAgentTurn, textModel, type FunctionTool } from '@/lib/openai';
import { runInContext, withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 60_000;

const SUPPORT_PROMPT = `You are the support assistant for an AI brand-building platform (brand analysis, visual identity, voice content).
- Explain how to use the features and answer general branding questions.
- Use web search only for current facts and cite sources inline.
- Keep answers short and friendly.`;

const DEVELOPER_PROMPT = `You are the AI Brand Assistant inside a brand-analysis app. Help the user understand their analysis and improve their brand.
- Ground answers in the analysis data you can read with the provided functions; do not invent scores.
- Use web search for current market, competitor or trend questions and cite sources inline.
- Use generate_brand_image only when the user asks for a visual, logo or image concept.
- Keep answers concise and actionable.`;

// Function tools the model may call. Strict mode: every property required, additionalProperties false.
const FUNCTIONS: FunctionTool[] = [
  {
    name: 'get_brand_factor',
    description: 'Look up one brand factor (pillar) from the current analysis by name: score, priority, trend and insights.',
    parameters: { type: 'object', properties: { name: { type: 'string', description: 'Factor name, e.g. "Visual Identity"' } }, required: ['name'], additionalProperties: false }
  },
  {
    name: 'list_weak_factors',
    description: 'List brand factors whose score (0-1) is below a threshold, weakest first.',
    parameters: { type: 'object', properties: { below: { type: 'number', description: 'Score threshold between 0 and 1' } }, required: ['below'], additionalProperties: false }
  },
  {
    name: 'generate_brand_image',
    description: 'Generate a brand image (logo concept, mood board, social visual) and show it to the user.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed visual description' },
        size: { type: 'string', enum: ['1024x1024', '1536x1024', '1024x1536'] }
      },
      required: ['prompt', 'size'],
      additionalProperties: false
    }
  }
];

/**
 * POST { message, previousResponseId?, context? } -> text/event-stream
 * Events (JSON per `data:` line): delta {text} | tool {name} | image {dataUrl} | done {responseId, citations} | error {message}
 * Conversation state lives at OpenAI (store:true + previous_response_id); the client only keeps the last response id.
 */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'assistant', limit: 20 }, async (ctx) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { message, previousResponseId, context, mode } = body ?? {};
  const support = mode === 'support';
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: 'message is required (max 4000 chars)' }, { status: 400 });
  }
  if (previousResponseId !== undefined && !/^resp_[A-Za-z0-9_-]+$/.test(previousResponseId)) {
    return Response.json({ error: 'Invalid previousResponseId' }, { status: 400 });
  }

  const analysis = context && JSON.stringify(context).length <= MAX_CONTEXT_CHARS ? context : null;
  const factors: any[] = Array.isArray(analysis?.brandFactors) ? analysis.brandFactors : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await runInContext(ctx, async () => {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        const result = await runAgentTurn({
          input: message,
          developer: support ? SUPPORT_PROMPT : `${DEVELOPER_PROMPT}\n\nBusiness: ${analysis?.businessIdea ?? 'unknown'}. Health score: ${analysis?.healthScore ?? 'n/a'}.`,
          previousResponseId,
          model: textModel(),
          effort: 'medium',
          functions: support ? [] : FUNCTIONS,
          webSearch: true,
          feature: 'assistant',
          onText: (text) => send({ type: 'delta', text }),
          onToolCall: (name) => send({ type: 'tool', name }),
          handlers: {
            get_brand_factor: ({ name }: { name: string }) =>
              factors.find((f) => String(f.name).toLowerCase() === String(name).toLowerCase()) ?? { error: `No factor named "${name}"` },
            list_weak_factors: ({ below }: { below: number }) =>
              factors.filter((f) => f.score < below).sort((a, b) => a.score - b.score).map((f) => ({ name: f.name, score: f.score, priority: f.priority })),
            generate_brand_image: async ({ prompt, size }: { prompt: string; size: string }) => {
              const [image] = await generateImage({ prompt, size });
              if (!image) return { error: 'No image was produced' };
              send({ type: 'image', dataUrl: image.dataUrl });
              return { ok: true, note: 'The image is now displayed to the user.' };
            }
          }
        });
        send({ type: 'done', responseId: result.responseId, citations: result.citations });
      } catch (error) {
        console.error('Assistant turn failed:', error instanceof Error ? error.name : 'error');
        const friendly = describeOpenAIError(error, textModel());
        send({ type: 'error', message: friendly?.message ?? 'The assistant could not complete that request. Please try again.', code: friendly?.code });
      } finally {
        await ctx.flush();
        controller.close();
      }
      });
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' }
  });
  });
}
