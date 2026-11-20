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
//   - Audio: speech-to-text POST /v1/audio/transcriptions (gpt-transcribe; prompt/keywords[]/languages[]);
//     text-to-speech via the Realtime API over WebSocket (gpt-realtime-2.1-mini, the documented migration path from
//     the deprecated /v1/audio/speech models) or the legacy Speech API; live voice via ephemeral Realtime client
//     secrets (POST /v1/realtime/client_secrets) + browser WebRTC (POST /v1/realtime/calls).

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
/** Read a (non-secret) environment value through the runtime binding. */
export const getEnv = (name: string) => readEnv(name);

// ---------------------------------------------------------------------------------------------
// Bring-your-own-key: the key is resolved per request (see byok.ts), never from process-wide state.
// ---------------------------------------------------------------------------------------------
let keyResolver: () => string | undefined = () => undefined;
/** Install the per-request key lookup (AsyncLocalStorage in byok.ts). */
export function setKeyResolver(fn: () => string | undefined) {
  keyResolver = fn;
}

export type ModelSlot = 'text' | 'reasoning' | 'image' | 'transcribe' | 'tts' | 'realtime';
let modelResolver: (slot: ModelSlot) => string | undefined = () => undefined;
/** Install per-user model overrides (Settings -> Models). Priority: user override > env > built-in default. */
export function setModelResolver(fn: (slot: ModelSlot) => string | undefined) {
  modelResolver = fn;
}

const usable = (key: string | undefined) => (key && key !== 'demo-mode' && key !== 'your_api_key_here' ? key : undefined);

/**
 * The caller's own OpenAI key. A shared server key (OPENAI_API_KEY) is used ONLY when ALLOW_SERVER_OPENAI_KEY=true
 * (development convenience; off by default).
 */
export function getApiKey(): string | undefined {
  const own = usable(keyResolver());
  if (own) return own;
  return readEnv('ALLOW_SERVER_OPENAI_KEY') === 'true' ? usable(readEnv('OPENAI_API_KEY')) : undefined;
}
export const isConfigured = () => !!getApiKey();
/** True when the dev-only shared server key is enabled (ALLOW_SERVER_OPENAI_KEY=true) and set. */
export const serverKeyFallbackAllowed = () => readEnv('ALLOW_SERVER_OPENAI_KEY') === 'true' && !!usable(readEnv('OPENAI_API_KEY'));

export const textModel = () => modelResolver('text') || readEnv('OPENAI_TEXT_MODEL') || MODELS.text;
export const reasoningModel = () => modelResolver('reasoning') || readEnv('OPENAI_REASONING_MODEL') || MODELS.reasoning;
export const imageModel = () => modelResolver('image') || readEnv('OPENAI_IMAGE_MODEL') || MODELS.image;

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
  /** The model the failing request used (for "no access to model X" messages). */
  model?: string;
  constructor(message: string, init: { status: number; code?: string; type?: string; requestId?: string; model?: string }) {
    super(message);
    this.name = 'OpenAIError';
    this.status = init.status;
    this.code = init.code;
    this.type = init.type;
    this.requestId = init.requestId;
    this.model = init.model;
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

/** Replace anything that looks like an API key. */
export function redactKeys(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_\-*.]{4,}/g, 'sk-…');
}

export interface FriendlyError {
  status: number;
  code: string;
  message: string;
}

/**
 * User-facing description of an OpenAI failure. Never includes the key or raw upstream text for auth failures.
 * `model` (if known) is mentioned for model-access problems so users know what to override in Settings.
 */
export function describeOpenAIError(error: unknown, model?: string): FriendlyError | null {
  if (error instanceof NotConfiguredError) return { status: 412, code: 'OPENAI_KEY_REQUIRED', message: 'Add your OpenAI API key in Settings to use AI features.' };
  if (!(error instanceof OpenAIError)) return null;
  const upstream = error.code ?? '';
  if (error.status === 401) return { status: 401, code: 'OPENAI_KEY_INVALID', message: 'OpenAI rejected your API key. It may be invalid, expired or revoked. Check it in Settings.' };
  if (error.status === 403) return { status: 403, code: 'OPENAI_FORBIDDEN', message: 'Your OpenAI account or project is not allowed to make this request. Check project permissions and model access in your OpenAI dashboard.' };
  if (upstream === 'model_not_found' || (error.status === 404 && /model/i.test(error.message))) {
    return { status: 424, code: 'OPENAI_MODEL_UNAVAILABLE', message: `Your OpenAI account does not have access to ${(error.model ?? model) ? `the model "${error.model ?? model}"` : 'the required model'}. Choose a model you can use in Settings → Models.` };
  }
  if (error.status === 429) {
    return upstream === 'insufficient_quota'
      ? { status: 402, code: 'OPENAI_QUOTA_EXCEEDED', message: 'Your OpenAI account is out of credit or over its quota. Add credit in your OpenAI billing settings.' }
      : { status: 429, code: 'OPENAI_RATE_LIMITED', message: 'OpenAI is rate limiting your key. Wait a moment and try again.' };
  }
  if (error.status >= 500) return { status: 502, code: 'OPENAI_UNAVAILABLE', message: 'OpenAI is temporarily unavailable. Try again shortly.' };
  return { status: 400, code: 'OPENAI_REQUEST_REJECTED', message: 'OpenAI could not process this request.' };
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
  /** Return the raw Response (for SSE or binary audio) instead of parsing JSON. */
  raw?: boolean;
  retries?: boolean;
  headers?: Record<string, string>;
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
          ...(opts.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
          ...opts.headers
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
    // OpenAI error text can echo a masked key ("Incorrect API key provided: sk-abc***xyz"): never keep key fragments.
    if (typeof err.message === 'string') err.message = redactKeys(err.message);
    usageLogger({ feature: opts.feature ?? 'unknown', endpoint: path, model, status: res.status, attempts: attempt, durationMs: Date.now() - started, requestId, error: err.code ?? err.type });
    throw new OpenAIError(err.message ?? `OpenAI API error ${res.status}`, { status: res.status, code: err.code, type: err.type, requestId, model: typeof model === 'string' ? model : undefined });
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

// ---------------------------------------------------------------------------------------------
// Audio: models, voices, WAV helpers
// ---------------------------------------------------------------------------------------------
export const AUDIO_MODELS = {
  /** Speech-to-text for recorded files (/v1/audio/transcriptions). */
  transcribe: 'gpt-transcribe',
  /** Realtime model used for text-to-speech (replacement for the deprecated Speech API models). */
  tts: 'gpt-realtime-2.1-mini',
  /** Realtime model for live conversational voice in the browser. */
  realtime: 'gpt-realtime-2.1',
  /** Legacy /v1/audio/speech model; only used when OPENAI_TTS_ENDPOINT=speech (shuts down 2027-01-06). */
  speech: 'gpt-4o-mini-tts'
} as const;

export const transcribeModel = () => modelResolver('transcribe') || readEnv('OPENAI_TRANSCRIBE_MODEL') || AUDIO_MODELS.transcribe;
export const ttsModel = () => modelResolver('tts') || readEnv('OPENAI_TTS_MODEL') || AUDIO_MODELS.tts;
export const realtimeModel = () => modelResolver('realtime') || readEnv('OPENAI_REALTIME_MODEL') || AUDIO_MODELS.realtime;
export const speechModel = () => readEnv('OPENAI_SPEECH_MODEL') || AUDIO_MODELS.speech;
/** 'realtime' (default) or 'speech' (legacy /v1/audio/speech). */
export const ttsEndpoint = (): 'realtime' | 'speech' => (readEnv('OPENAI_TTS_ENDPOINT') === 'speech' ? 'speech' : 'realtime');

/** Built-in Realtime voices (marin and cedar recommended). The legacy Speech API also offers fable, nova and onyx. */
export const REALTIME_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'] as const;
export const DEFAULT_VOICE = 'marin';

export function normalizeVoice(voice?: string): string {
  return REALTIME_VOICES.includes(voice as any) ? (voice as string) : DEFAULT_VOICE;
}

export interface WavAudio {
  pcm: Uint8Array;
  sampleRate: number;
}

/** Wrap mono 16-bit little-endian PCM in a WAV container. */
export function pcm16ToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + pcm.byteLength, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, pcm.byteLength, true);
  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return out;
}

/** Extract PCM and sample rate from a 16-bit PCM WAV (walks RIFF chunks, so extra chunks are fine). */
export function wavToPcm(wav: Uint8Array): WavAudio {
  const v = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  let sampleRate = 24000;
  let offset = 12;
  while (offset + 8 <= wav.byteLength) {
    const id = String.fromCharCode(wav[offset], wav[offset + 1], wav[offset + 2], wav[offset + 3]);
    const size = v.getUint32(offset + 4, true);
    if (id === 'fmt ') sampleRate = v.getUint32(offset + 12, true);
    if (id === 'data') return { pcm: wav.subarray(offset + 8, Math.min(offset + 8 + size, wav.byteLength)), sampleRate };
    offset += 8 + size + (size % 2);
  }
  throw new Error('Not a PCM WAV file');
}

/** Join WAV clips (same sample rate) with a short pause between them. */
export function concatWav(clips: Uint8Array[], pauseMs = 350): Uint8Array {
  const parts = clips.map(wavToPcm);
  const rate = parts[0]?.sampleRate ?? 24000;
  const gap = new Uint8Array(Math.round((rate * pauseMs) / 1000) * 2);
  const total = parts.reduce((n, p) => n + p.pcm.byteLength, 0) + gap.byteLength * Math.max(parts.length - 1, 0);
  const pcm = new Uint8Array(total);
  let o = 0;
  parts.forEach((p, i) => {
    pcm.set(p.pcm, o);
    o += p.pcm.byteLength;
    if (i < parts.length - 1) {
      pcm.set(gap, o);
      o += gap.byteLength;
    }
  });
  return pcm16ToWav(pcm, rate);
}

// ---------------------------------------------------------------------------------------------
// Speech-to-text (file transcription)
// ---------------------------------------------------------------------------------------------
export interface TranscribeOptions {
  data: Uint8Array | ArrayBuffer;
  mime?: string;
  filename?: string;
  /** Unstructured context about the recording. */
  prompt?: string;
  /** Literal terms expected in the audio. */
  keywords?: string[];
  /** Expected input languages (ISO codes). Replaces the singular `language` for gpt-transcribe. */
  languages?: string[];
  model?: string;
}

export interface Transcription {
  text: string;
  languages?: { code: string }[];
}

/** POST /v1/audio/transcriptions (multipart). Files up to 25 MB (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm). */
export async function transcribeAudio(opts: TranscribeOptions): Promise<Transcription> {
  const form = new FormData();
  form.append('model', opts.model || transcribeModel());
  form.append('file', new Blob([opts.data as BlobPart], { type: opts.mime || 'audio/webm' }), opts.filename || 'audio.webm');
  if (opts.prompt) form.append('prompt', opts.prompt);
  // The API rejects the whole request if a keyword contains < > CR or LF.
  for (const k of opts.keywords ?? []) {
    const clean = k.replace(/[<>\r\n]/g, ' ').trim();
    if (clean) form.append('keywords[]', clean);
  }
  for (const l of opts.languages ?? []) form.append('languages[]', l);
  return call('/audio/transcriptions', { body: form, feature: 'audio:transcribe' });
}

// ---------------------------------------------------------------------------------------------
// Text-to-speech
// ---------------------------------------------------------------------------------------------
export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  addEventListener(type: string, cb: (e: any) => void): void;
}
let wsFactory: ((url: string, headers: Record<string, string>) => WebSocketLike) | undefined;
/** Provide a WebSocket constructor that can send an Authorization header (`ws` in Node, Deno's WebSocket). */
export function setWebSocketFactory(f: (url: string, headers: Record<string, string>) => WebSocketLike) {
  wsFactory = f;
}

export interface SpeechOptions {
  text: string;
  voice?: string;
  /** Delivery guidance, e.g. "Warm, upbeat narrator". */
  instructions?: string;
  /** Stable hashed end-user id (OpenAI-Safety-Identifier). */
  safetyIdentifier?: string;
}

const TTS_ENGINE_PROMPT =
  'You are a text-to-speech engine. Speak exactly the text the user provides, word for word, with no introduction, commentary, additions or omissions.';
const MAX_TTS_CHARS = 20_000;
const TTS_CHUNK_CHARS = 900;

/** Split on sentence boundaries so each Realtime response stays short. */
export function chunkForSpeech(text: string, max = TTS_CHUNK_CHARS): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > max) {
      chunks.push(cur.trim());
      cur = '';
    }
    cur += s;
    while (cur.length > max) {
      chunks.push(cur.slice(0, max));
      cur = cur.slice(max);
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/** Text-to-speech through a Realtime WebSocket session (audio output only). Returns a 24 kHz mono WAV. */
async function synthesizeRealtime(opts: SpeechOptions): Promise<Uint8Array> {
  const key = getApiKey();
  if (!key) throw new NotConfiguredError();
  if (!wsFactory) throw new Error('No WebSocket implementation configured (setWebSocketFactory)');

  const chunks = chunkForSpeech(opts.text);
  const model = ttsModel();
  const url = `${apiBase().replace(/^http/, 'ws')}/realtime?model=${encodeURIComponent(model)}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (opts.safetyIdentifier) headers['OpenAI-Safety-Identifier'] = opts.safetyIdentifier;

  const started = Date.now();
  const pcmParts: Uint8Array[] = [];

  await new Promise<void>((resolve, reject) => {
    const ws = wsFactory!(url, headers);
    let index = 0;
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* already closed */ }
      err ? reject(err) : resolve();
    };
    const timer = setTimeout(() => finish(new Error('Text-to-speech timed out')), 120_000);
    const send = (event: unknown) => ws.send(JSON.stringify(event));
    const speakNext = () => {
      send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: chunks[index] }] } });
      send({ type: 'response.create', response: { output_modalities: ['audio'] } });
    };

    ws.addEventListener('error', () => finish(new Error('Realtime connection error')));
    ws.addEventListener('close', () => finish(index < chunks.length ? new Error('Realtime connection closed early') : undefined));
    ws.addEventListener('message', (e: any) => {
      const event = JSON.parse(typeof e.data === 'string' ? e.data : e.data.toString());
      switch (event.type) {
        case 'session.created':
          send({
            type: 'session.update',
            session: {
              type: 'realtime',
              model,
              output_modalities: ['audio'],
              instructions: opts.instructions ? `${TTS_ENGINE_PROMPT} Delivery: ${opts.instructions}` : TTS_ENGINE_PROMPT,
              audio: { output: { format: { type: 'audio/pcm', rate: 24000 }, voice: normalizeVoice(opts.voice) } }
            }
          });
          break;
        case 'session.updated':
          speakNext();
          break;
        case 'response.output_audio.delta': {
          const bin = atob(event.delta);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          pcmParts.push(bytes);
          break;
        }
        case 'response.done':
          if (event.response?.status && event.response.status !== 'completed') {
            finish(new Error(`Speech response ${event.response.status}`));
          } else if (++index < chunks.length) speakNext();
          else finish();
          break;
        case 'error':
          finish(new OpenAIError(event.error?.message ?? 'Realtime error', { status: 500, code: event.error?.code }));
          break;
      }
    });
  });

  usageLogger({ feature: 'audio:tts', endpoint: '/realtime (ws)', model, status: 200, attempts: 1, durationMs: Date.now() - started });
  const total = pcmParts.reduce((n, p) => n + p.byteLength, 0);
  const pcm = new Uint8Array(total);
  let o = 0;
  for (const p of pcmParts) {
    pcm.set(p, o);
    o += p.byteLength;
  }
  if (!total) throw new Error('No audio was returned');
  return pcm16ToWav(pcm, 24000);
}

/** Legacy POST /v1/audio/speech (deprecated models; shuts down 2027-01-06). WAV output. */
async function synthesizeSpeechEndpoint(opts: SpeechOptions): Promise<Uint8Array> {
  const res: Response = await call('/audio/speech', {
    raw: true,
    feature: 'audio:tts',
    body: {
      model: speechModel(),
      voice: opts.voice || DEFAULT_VOICE,
      input: opts.text,
      response_format: 'wav',
      ...(opts.instructions ? { instructions: opts.instructions } : {})
    }
  });
  return new Uint8Array(await res.arrayBuffer());
}

/** Text -> speech (WAV). Uses Realtime by default; set OPENAI_TTS_ENDPOINT=speech for the legacy Speech API. */
export async function synthesizeSpeech(opts: SpeechOptions): Promise<{ audio: Uint8Array; mime: 'audio/wav' }> {
  if (!opts.text?.trim()) throw new Error('text is required');
  if (opts.text.length > MAX_TTS_CHARS) throw new Error(`text exceeds ${MAX_TTS_CHARS} characters`);
  const audio = ttsEndpoint() === 'speech' ? await synthesizeSpeechEndpoint(opts) : await synthesizeRealtime(opts);
  return { audio, mime: 'audio/wav' };
}

/** Duration of a WAV clip in milliseconds. */
export function wavDurationMs(wav: Uint8Array): number {
  const { pcm, sampleRate } = wavToPcm(wav);
  return Math.round((pcm.byteLength / 2 / sampleRate) * 1000);
}

/**
 * Multi-voice production (podcast, audiobook): one clip per segment, joined into a single WAV.
 * `durationsMs[i]` is the length of segment i's clip (0 when it had no text), which lets callers build exact captions
 * (clips are joined with a 350 ms pause).
 */
export async function synthesizeSegmentsDetailed(
  segments: { text: string; voice?: string; instructions?: string }[]
): Promise<{ audio: Uint8Array; durationsMs: number[] }> {
  const clips: Uint8Array[] = [];
  const durationsMs: number[] = [];
  for (const seg of segments) {
    if (seg.text?.trim()) {
      const clip = (await synthesizeSpeech(seg)).audio;
      clips.push(clip);
      durationsMs.push(wavDurationMs(clip));
    } else durationsMs.push(0);
  }
  if (!clips.length) throw new Error('No text to synthesize');
  return { audio: concatWav(clips), durationsMs };
}

/** Same as synthesizeSegmentsDetailed but returns only the audio. */
export async function synthesizeSegments(segments: { text: string; voice?: string; instructions?: string }[]): Promise<Uint8Array> {
  return (await synthesizeSegmentsDetailed(segments)).audio;
}

// ---------------------------------------------------------------------------------------------
// Live voice (browser): ephemeral Realtime client secret
// ---------------------------------------------------------------------------------------------
export interface RealtimeSessionOptions {
  instructions?: string;
  voice?: string;
  model?: string;
  safetyIdentifier?: string;
}

/**
 * Mint a short-lived client secret for a browser WebRTC session. The browser then POSTs its SDP offer to
 * https://api.openai.com/v1/realtime/calls with `Authorization: Bearer <value>`; the real API key never leaves the server.
 */
export async function createRealtimeClientSecret(opts: RealtimeSessionOptions = {}): Promise<{ value: string; expires_at?: number; model: string }> {
  const model = opts.model || realtimeModel();
  const data = await call('/realtime/client_secrets', {
    feature: 'realtime:client_secret',
    headers: opts.safetyIdentifier ? { 'OpenAI-Safety-Identifier': opts.safetyIdentifier } : undefined,
    body: {
      session: {
        type: 'realtime',
        model,
        ...(opts.instructions ? { instructions: opts.instructions } : {}),
        audio: { output: { voice: normalizeVoice(opts.voice) } }
      }
    }
  });
  return { value: data.value, expires_at: data.expires_at, model };
}

/** Base URL browsers use for the WebRTC SDP exchange. */
export const realtimeCallsUrl = () => `${apiBase()}/realtime/calls`;

// ---------------------------------------------------------------------------------------------
// Key validation (Settings): GET /v1/models with an explicit key. The key is never logged or echoed.
// ---------------------------------------------------------------------------------------------
export interface KeyCheck {
  /** valid = accepted; invalid = 401; restricted = 403 (authenticated, but this key cannot list models); unreachable = OpenAI down/rate limited. */
  status: 'valid' | 'invalid' | 'restricted' | 'unreachable';
  modelIds: string[];
}

export async function checkOpenAIKey(key: string): Promise<KeyCheck> {
  try {
    const res = await fetch(`${apiBase()}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) });
    if (res.status === 401) return { status: 'invalid', modelIds: [] };
    if (res.status === 403) return { status: 'restricted', modelIds: [] };
    if (!res.ok) return { status: 'unreachable', modelIds: [] };
    const data = await res.json().catch(() => ({}));
    return { status: 'valid', modelIds: (data?.data ?? []).map((m: any) => String(m.id)) };
  } catch {
    return { status: 'unreachable', modelIds: [] };
  }
}

/** Is a model id usable by this account according to the /v1/models list? (null when the list is unavailable) */
export const hasModel = (modelIds: string[], id: string): boolean | null => (modelIds.length ? modelIds.includes(id) : null);

/** Defaults/overrides currently in effect for each slot. */
export function effectiveModels(): Record<ModelSlot, string> {
  return { text: textModel(), reasoning: reasoningModel(), image: imageModel(), transcribe: transcribeModel(), tts: ttsModel(), realtime: realtimeModel() };
}
