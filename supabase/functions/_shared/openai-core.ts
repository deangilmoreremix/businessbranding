// Runtime-agnostic OpenAI client core, shared by Next.js (lib/openai.ts) and Supabase Edge Functions
// (supabase/functions/_shared/openai.ts). Uses only fetch/FormData/TextDecoder.
//
// Verified against the OpenAI docs (developers.openai.com/api/docs/guides/*):
//   - Responses API: POST /v1/responses. GPT-6.2 rules: never send temperature/top_p/top_logprobs;
//     reasoning.effort; reusable instructions in a first `developer` message inside `input`.
//   - Structured Outputs: text.format = { type:'json_schema', name, schema, strict:true }.
//   - Tools: { type:'web_search' } (hosted), { type:'function', name, parameters, strict } (function calling,
//     answered with { type:'function_call_output', call_id, output }), image_generation tool.
//   - Conversation state: previous_response_id + store:true.
//   - Streaming: stream:true -> SSE (response.output_text.delta, response.completed, error).
//   - Background mode: background:true (+ background_options.completion_window), poll GET /v1/responses/{id}
//     while status is queued | in_progress.
//   - Images API: POST /v1/images/generations and /v1/images/edits (multipart, image[]), base64 in data[].b64_json.

import { AI_SCHEMAS, type AISchemaName } from './schemas.ts';

// ---------------------------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------------------------
export const MODELS = {
  text: 'gpt-6.2-sol',
  reasoning: 'gpt-6.2-astra',
  image: 'gpt-image-2.6-sunburst',
  imageFast: 'gpt-image-2.6-flare'
} as const;

const DEFAULT_API_BASE = 'https://api.openai.com/v1';
/** Override with OPENAI_BASE_URL for proxies or mock servers in tests. */
const apiBase = () => readEnv('OPENAI_BASE_URL') || DEFAULT_API_BASE;

let readEnv: (name: string) => string | undefined = () => undefined;
export function setEnvReader(fn: (name: string) => string | undefined) {
  readEnv = fn;
}

export function getApiKey(): string | undefined {
  const key = readEnv('OPENAI_API_KEY');
  return key && key !== 'demo-mode' && key !== 'your_api_key_here' ? key : undefined;
}
export const isConfigured = () => !!getApiKey();

export const textModel = () => readEnv('OPENAI_TEXT_MODEL') || MODELS.text;
export const reasoningModel = () => readEnv('OPENAI_REASONING_MODEL') || MODELS.reasoning;
export const imageModel = () => readEnv('OPENAI_IMAGE_MODEL') || MODELS.image;

export type Effort = 'low' | 'medium' | 'high' | 'xhigh';

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------
export class NotConfiguredError extends Error {
  constructor() {
    super('OPENAI_API_KEY is not configured');
    this.name = 'NotConfiguredError';
  }
}

export class OpenAIError extends Error {
  status: number;
  code?: string;
  type?: string;
  requestId?: string;
  constructor(message: string, init: { status: number; code?: string; type?: string; requestId?: string }) {
    super(message);
    this.name = 'OpenAIError';
    this.status = init.status;
    this.code = init.code;
    this.type = init.type;
    this.requestId = init.requestId;
  }
}

/** The model declined to answer (Structured Outputs surfaces this as a `refusal` content part). */
export class RefusalError extends Error {
  constructor(public refusal: string) {
    super(`Model refused the request: ${refusal}`);
    this.name = 'RefusalError';
  }
}

/** Response ended before completion (e.g. max_output_tokens), so the JSON may be truncated. */
export class IncompleteError extends Error {
  constructor(public reason: string) {
    super(`Response incomplete: ${reason}`);
    this.name = 'IncompleteError';
  }
}

// ---------------------------------------------------------------------------------------------
// Usage logging
// ---------------------------------------------------------------------------------------------
export interface UsageRecord {
  feature: string;
  endpoint: string;
  model?: string;
  status: number | 'network_error';
  attempts: number;
  durationMs: number;
  requestId?: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  error?: string;
}

let usageLogger: (r: UsageRecord) => void = (r) => console.info('ai_usage', JSON.stringify(r));
/** Replace the default console logger (e.g. to write to a database). Prompts are never logged. */
export function setUsageLogger(fn: (r: UsageRecord) => void) {
  usageLogger = fn;
}

// ---------------------------------------------------------------------------------------------
// HTTP with retries
// ---------------------------------------------------------------------------------------------
const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelay(res: Response | undefined, attempt: number): number {
  const ms = res?.headers.get('retry-after-ms');
  if (ms && !Number.isNaN(Number(ms))) return Math.min(Number(ms), 30000);
  const s = res?.headers.get('retry-after');
  if (s && !Number.isNaN(Number(s))) return Math.min(Number(s) * 1000, 30000);
  return Math.min(500 * 2 ** (attempt - 1), 8000) + Math.random() * 250;
}

interface CallOptions {
  feature?: string;
  method?: 'GET' | 'POST';
  /** JSON object or FormData. */
  body?: unknown;
  /** Return the raw Response (for SSE) instead of parsing JSON. */
  raw?: boolean;
  retries?: boolean;
}

async function call(path: string, opts: CallOptions = {}): Promise<any> {
  const key = getApiKey();
  if (!key) throw new NotConfiguredError();

  const started = Date.now();
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const model = (opts.body as any)?.model ?? (isForm ? (opts.body as FormData).get('model') : undefined);
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    let res: Response | undefined;
    try {
      res = await fetch(`${apiBase()}${path}`, {
        method: opts.method ?? 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          ...(opts.body && !isForm ? { 'Content-Type': 'application/json' } : {})
        },
        body: opts.body ? (isForm ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined
      });
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS && opts.retries !== false) {
        await sleep(retryDelay(undefined, attempt));
        continue;
      }
      usageLogger({ feature: opts.feature ?? 'unknown', endpoint: path, model, status: 'network_error', attempts: attempt, durationMs: Date.now() - started, error: String(e) });
      throw e;
    }

    const requestId = res.headers.get('x-request-id') ?? undefined;
    if (res.ok) {
      if (opts.raw) return res; // usage for streams is logged by the stream consumer
      const data = await res.json();
      const u = data?.usage;
      usageLogger({
        feature: opts.feature ?? 'unknown',
        endpoint: path,
        model: data?.model ?? model,
        status: res.status,
        attempts: attempt,
        durationMs: Date.now() - started,
        requestId,
        inputTokens: u?.input_tokens,
        outputTokens: u?.output_tokens,
        reasoningTokens: u?.output_tokens_details?.reasoning_tokens,
        cachedTokens: u?.input_tokens_details?.cached_tokens
      });
      return data;
    }

    // Error response
    if (RETRYABLE.has(res.status) && attempt < MAX_ATTEMPTS && opts.retries !== false) {
      await sleep(retryDelay(res, attempt));
      continue;
    }
    let err: any = {};
    try {
      err = (await res.json())?.error ?? {};
    } catch {
      /* non-JSON error body */
    }
    usageLogger({ feature: opts.feature ?? 'unknown', endpoint: path, model, status: res.status, attempts: attempt, durationMs: Date.now() - started, requestId, error: err.code ?? err.type });
    throw new OpenAIError(err.message ?? `OpenAI API error ${res.status}`, { status: res.status, code: err.code, type: err.type, requestId });
  }
  throw lastError ?? new Error('OpenAI request failed');
}

// ---------------------------------------------------------------------------------------------
// Responses API
// ---------------------------------------------------------------------------------------------
export type InputItem = Record<string, unknown>;

export interface JsonSchemaFormat {
  name: string;
  schema: unknown;
}

export interface ResponsesRequest {
  /** Prompt text, or an array of input items (messages, function_call_output, prior output items). */
  input: string | InputItem[];
  /** Reusable system prompt. Sent as the FIRST `developer` message in `input` (cache-friendly on GPT-6.2). */
  developer?: string;
  /** Guidance that applies to this request only (top-level `instructions`). */
  instructions?: string;
  model?: string;
  effort?: Effort;
  /** Strict Structured Outputs schema. */
  schema?: JsonSchemaFormat;
  tools?: Record<string, unknown>[];
  toolChoice?: unknown;
  /** Public image URLs / data URLs for vision input (appended to the user message). */
  imageUrls?: string[];
  previousResponseId?: string;
  store?: boolean;
  background?: boolean;
  /** Background mode window: 'soonest' (default) | '2h' | '8h'. */
  completionWindow?: 'soonest' | '2h' | '8h';
  include?: string[];
  maxOutputTokens?: number;
  /** Stable end-user/session id for abuse monitoring. */
  safetyIdentifier?: string;
  metadata?: Record<string, string>;
  stream?: boolean;
  feature?: string;
}

/** Build the request body. Never includes temperature/top_p/top_logprobs (unsupported on GPT-6.2). */
export function buildResponsesBody(req: ResponsesRequest): Record<string, unknown> {
  const items: InputItem[] = [];
  if (req.developer) items.push({ role: 'developer', content: req.developer });

  if (typeof req.input === 'string') {
    items.push(
      req.imageUrls?.length
        ? {
            role: 'user',
            content: [
              { type: 'input_text', text: req.input },
              ...req.imageUrls.map((image_url) => ({ type: 'input_image', image_url }))
            ]
          }
        : { role: 'user', content: req.input }
    );
  } else {
    items.push(...req.input);
  }

  const body: Record<string, unknown> = { model: req.model || textModel(), input: items };
  if (req.instructions) body.instructions = req.instructions;
  if (req.effort) body.reasoning = { effort: req.effort };
  if (req.schema) body.text = { format: { type: 'json_schema', name: req.schema.name, schema: req.schema.schema, strict: true } };
  if (req.tools?.length) body.tools = req.tools;
  if (req.toolChoice) body.tool_choice = req.toolChoice;
  if (req.previousResponseId) body.previous_response_id = req.previousResponseId;
  if (req.store !== undefined) body.store = req.store;
  if (req.include?.length) body.include = req.include;
  if (req.maxOutputTokens) body.max_output_tokens = req.maxOutputTokens;
  if (req.safetyIdentifier) body.safety_identifier = req.safetyIdentifier;
  if (req.metadata) body.metadata = req.metadata;
  if (req.stream) body.stream = true;
  if (req.background) {
    body.background = true;
    body.store = true; // background responses are retrieved by id
    if (req.completionWindow && req.completionWindow !== 'soonest') {
      body.background_options = { completion_window: req.completionWindow };
    }
  }
  return body;
}

export interface Citation {
  url: string;
  title?: string;
}

export interface ParsedResponse {
  id: string;
  status: string;
  text: string;
  citations: Citation[];
  functionCalls: { callId: string; name: string; arguments: string }[];
  /** base64 images produced by the image_generation tool. */
  images: string[];
  output: any[];
  usage?: any;
}

/** Extract text, citations, tool calls and images from a Responses API payload. Throws on refusal/incomplete. */
export function parseResponse(data: any): ParsedResponse {
  if (data?.status === 'incomplete') {
    throw new IncompleteError(data?.incomplete_details?.reason ?? 'unknown');
  }
  if (data?.status === 'failed') {
    throw new OpenAIError(data?.error?.message ?? 'Response failed', { status: 500, code: data?.error?.code });
  }

  let text = '';
  const citations: Citation[] = [];
  const functionCalls: ParsedResponse['functionCalls'] = [];
  const images: string[] = [];

  for (const item of data?.output ?? []) {
    if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if (part.type === 'refusal') throw new RefusalError(part.refusal ?? '');
        if (part.type === 'output_text') {
          text += part.text ?? '';
          for (const a of part.annotations ?? []) {
            if (a.type === 'url_citation' && !citations.some((c) => c.url === a.url)) citations.push({ url: a.url, title: a.title });
          }
        }
      }
    } else if (item.type === 'function_call') {
      functionCalls.push({ callId: item.call_id, name: item.name, arguments: item.arguments });
    } else if (item.type === 'image_generation_call' && item.result) {
      images.push(item.result);
    }
  }

  return { id: data.id, status: data.status, text, citations, functionCalls, images, output: data.output ?? [], usage: data.usage };
}

/** Create a response (non-streaming). */
export async function createResponse(req: ResponsesRequest): Promise<ParsedResponse> {
  const data = await call('/responses', { body: buildResponsesBody(req), feature: req.feature });
  return parseResponse(data);
}

export function getSchema(name: AISchemaName): JsonSchemaFormat {
  return { name, schema: AI_SCHEMAS[name] };
}

/** Structured Outputs: returns the parsed object guaranteed (non-refusal) to match the named schema. */
export async function createStructured<T = any>(
  schemaName: AISchemaName,
  req: Omit<ResponsesRequest, 'schema'>
): Promise<{ data: T; response: ParsedResponse }> {
  const response = await createResponse({ ...req, schema: getSchema(schemaName), feature: req.feature ?? schemaName });
  return { data: JSON.parse(response.text) as T, response };
}

export const WEB_SEARCH_TOOL = { type: 'web_search' } as const;

/**
 * Current-data features (competitors, markets, top brands): research with the hosted web_search tool,
 * then convert the findings to the strict schema in a second, tool-free request. Two steps keep the
 * schema guarantee independent of how tools and json_schema combine.
 */
export async function researchStructured<T = any>(
  schemaName: AISchemaName,
  req: { question: string; developer?: string; schemaPrompt?: string; effort?: Effort; model?: string; searchContextSize?: 'low' | 'medium' | 'high'; feature?: string }
): Promise<{ data: T; citations: Citation[] }> {
  const research = await createResponse({
    feature: `${req.feature ?? schemaName}:research`,
    model: req.model || reasoningModel(),
    developer: req.developer,
    input: req.question,
    effort: req.effort ?? 'medium',
    tools: [{ ...WEB_SEARCH_TOOL, search_context_size: req.searchContextSize ?? 'medium' }]
  });

  const sources = research.citations.map((c) => `- ${c.title ?? c.url}: ${c.url}`).join('\n');
  const { data } = await createStructured<T>(schemaName, {
    feature: `${req.feature ?? schemaName}:structure`,
    developer: req.developer,
    effort: 'low',
    input: `${req.schemaPrompt ?? 'Convert the research below into the required JSON structure.'}\n\nOriginal request:\n${req.question}\n\nResearch findings:\n${research.text}${sources ? `\n\nSources:\n${sources}` : ''}`
  });
  return { data, citations: research.citations };
}

// ---------------------------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------------------------
export interface StreamEvent {
  type: string;
  [key: string]: any;
}

/** Stream a response as parsed SSE events. */
export async function* streamResponse(req: ResponsesRequest): AsyncGenerator<StreamEvent> {
  const started = Date.now();
  const res: Response = await call('/responses', { body: buildResponsesBody({ ...req, stream: true }), raw: true, feature: req.feature });
  if (!res.body) throw new Error('No response body to stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let model: string | undefined;
  let usage: any;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLine = frame.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!dataLine || dataLine === '[DONE]') continue;
        const event = JSON.parse(dataLine) as StreamEvent;
        if (event.type === 'response.completed') {
          model = event.response?.model;
          usage = event.response?.usage;
        }
        yield event;
      }
    }
  } finally {
    usageLogger({
      feature: req.feature ?? 'stream',
      endpoint: '/responses (stream)',
      model,
      status: res.status,
      attempts: 1,
      durationMs: Date.now() - started,
      requestId: res.headers.get('x-request-id') ?? undefined,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
      reasoningTokens: usage?.output_tokens_details?.reasoning_tokens
    });
  }
}

// ---------------------------------------------------------------------------------------------
// Function-calling agent loop (streaming + conversation state)
// ---------------------------------------------------------------------------------------------
export interface FunctionTool {
  name: string;
  description: string;
  /** JSON Schema for the arguments. With strict:true every property must be required and additionalProperties:false. */
  parameters: Record<string, unknown>;
}

export type FunctionHandlers = Record<string, (args: any) => Promise<unknown> | unknown>;

export interface AgentTurnOptions {
  input: string;
  developer?: string;
  previousResponseId?: string;
  model?: string;
  effort?: Effort;
  functions?: FunctionTool[];
  handlers?: FunctionHandlers;
  webSearch?: boolean;
  maxSteps?: number;
  feature?: string;
  onText?: (delta: string) => void;
  onToolCall?: (name: string, args: unknown) => void;
}

/**
 * One assistant turn: streams text deltas, executes any function calls the model makes and continues the
 * same conversation with previous_response_id (store:true) until the model produces a final answer.
 */
export async function runAgentTurn(opts: AgentTurnOptions): Promise<{ responseId: string; text: string; citations: Citation[] }> {
  const tools: Record<string, unknown>[] = [
    ...(opts.functions ?? []).map((f) => ({ type: 'function', name: f.name, description: f.description, parameters: f.parameters, strict: true })),
    ...(opts.webSearch ? [{ ...WEB_SEARCH_TOOL }] : [])
  ];

  let input: string | InputItem[] = opts.input;
  let previous = opts.previousResponseId;
  let fullText = '';
  const citations: Citation[] = [];

  for (let step = 0; step < (opts.maxSteps ?? 5); step++) {
    let completed: any;
    for await (const event of streamResponse({
      input,
      // The developer message is only needed on the first turn; later turns inherit it via previous_response_id.
      developer: previous ? undefined : opts.developer,
      model: opts.model,
      effort: opts.effort,
      tools,
      previousResponseId: previous,
      store: true,
      feature: opts.feature ?? 'assistant'
    })) {
      if (event.type === 'response.output_text.delta') {
        fullText += event.delta;
        opts.onText?.(event.delta);
      } else if (event.type === 'response.completed') {
        completed = event.response;
      } else if (event.type === 'response.failed' || event.type === 'error') {
        throw new OpenAIError(event.error?.message ?? event.response?.error?.message ?? 'Streaming error', { status: 500, code: event.error?.code });
      }
    }
    if (!completed) throw new Error('Stream ended without response.completed');

    const parsed = parseResponse(completed);
    for (const c of parsed.citations) if (!citations.some((x) => x.url === c.url)) citations.push(c);
    previous = parsed.id;

    if (parsed.functionCalls.length === 0) return { responseId: parsed.id, text: fullText, citations };

    const outputs: InputItem[] = [];
    for (const call of parsed.functionCalls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.arguments || '{}');
      } catch {
        /* strict mode guarantees valid JSON; fall through with empty args */
      }
      opts.onToolCall?.(call.name, args);
      let result: unknown;
      try {
        const handler = opts.handlers?.[call.name];
        result = handler ? await handler(args) : { error: `Unknown function ${call.name}` };
      } catch (e) {
        result = { error: e instanceof Error ? e.message : String(e) };
      }
      outputs.push({ type: 'function_call_output', call_id: call.callId, output: typeof result === 'string' ? result : JSON.stringify(result) });
    }
    input = outputs;
  }
  throw new Error('Assistant exceeded the maximum number of tool-call steps');
}

// ---------------------------------------------------------------------------------------------
// Background mode (long jobs, polled by id)
// ---------------------------------------------------------------------------------------------
export async function startBackground(req: Omit<ResponsesRequest, 'background'>): Promise<{ id: string; status: string }> {
  const data = await call('/responses', { body: buildResponsesBody({ ...req, background: true }), feature: req.feature ?? 'background' });
  return { id: data.id, status: data.status };
}

export type BackgroundStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'incomplete' | 'cancelled';

/** Retrieve a response by id. While status is queued/in_progress, keep polling; otherwise parse it. */
export async function retrieveResponse(id: string): Promise<{ status: BackgroundStatus; parsed?: ParsedResponse; error?: string }> {
  const data = await call(`/responses/${encodeURIComponent(id)}`, { method: 'GET', feature: 'background:poll' });
  const status = data.status as BackgroundStatus;
  if (status === 'queued' || status === 'in_progress') return { status };
  if (status === 'completed') return { status, parsed: parseResponse(data) };
  return { status, error: data?.error?.message ?? data?.incomplete_details?.reason ?? status };
}

// ---------------------------------------------------------------------------------------------
// Images API
// ---------------------------------------------------------------------------------------------
export interface ImageOptions {
  prompt: string;
  model?: string;
  /** '1024x1024' | '1536x1024' | '1024x1536' | 'auto' | custom 'WIDTHxHEIGHT'. */
  size?: string;
  /** low | medium | high | xhigh | max | auto */
  quality?: string;
  /** low | medium | high - how much the model plans before rendering (GPT-Image-2.6). */
  complexity?: 'low' | 'medium' | 'high';
  /** png | jpeg | webp (svg for generations only). */
  outputFormat?: 'png' | 'jpeg' | 'webp' | 'svg';
  background?: 'transparent' | 'opaque' | 'auto';
  n?: number;
}

export interface GeneratedImage {
  b64: string;
  mime: string;
  dataUrl: string;
}

function toImages(data: any, format?: string): GeneratedImage[] {
  const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : format === 'svg' ? 'image/svg+xml' : 'image/png';
  return (data?.data ?? [])
    .filter((d: any) => d?.b64_json)
    .map((d: any) => ({ b64: d.b64_json, mime, dataUrl: `data:${mime};base64,${d.b64_json}` }));
}

function imageParams(o: ImageOptions): Record<string, unknown> {
  const p: Record<string, unknown> = { model: o.model || imageModel(), prompt: o.prompt, n: o.n ?? 1 };
  if (o.size) p.size = o.size;
  if (o.quality) p.quality = o.quality;
  if (o.complexity) p.complexity = o.complexity;
  if (o.outputFormat) p.output_format = o.outputFormat;
  if (o.background) p.background = o.background;
  return p;
}

/** Text -> image (Images API). */
export async function generateImage(opts: ImageOptions): Promise<GeneratedImage[]> {
  const data = await call('/images/generations', { body: imageParams(opts), feature: 'image:generate' });
  return toImages(data, opts.outputFormat);
}

/** Image edit / variation from one or more reference images (Images API, multipart `image[]`). */
export async function editImage(opts: ImageOptions & { images: { data: Uint8Array | ArrayBuffer; mime: string; name?: string }[] }): Promise<GeneratedImage[]> {
  const form = new FormData();
  for (const [k, v] of Object.entries(imageParams(opts))) form.append(k, String(v));
  opts.images.forEach((img, i) => {
    form.append('image[]', new Blob([img.data as BlobPart], { type: img.mime }), img.name ?? `image-${i}.${img.mime.split('/')[1] ?? 'png'}`);
  });
  const data = await call('/images/edits', { body: form, feature: 'image:edit' });
  return toImages(data, opts.outputFormat);
}

/** Reusable system prompt for the brand/market analysis edge functions (first `developer` message, cache-friendly). */
export const BRAND_DEVELOPER_PROMPT =
  'You are a senior brand and market strategist. Be specific and realistic; never invent unverifiable statistics. Return only data that fits the required JSON structure.';
