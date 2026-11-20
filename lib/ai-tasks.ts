/**
 * Server-side registry of AI tasks. Each task fixes its schema (Structured Outputs), reasoning effort,
 * model tier and whether it needs live web data, so browsers can only ask for a named task and never
 * choose schemas, models or tools.
 */
import {
  createStructured,
  researchStructured,
  reasoningModel,
  type Citation,
  type Effort
} from '@/lib/openai';
import type { AISchemaName } from '../supabase/functions/_shared/schemas.ts';

interface TaskDef {
  schema: AISchemaName;
  /** Reasoning effort: low for quick extraction, medium for analysis, high for deep strategy. */
  effort: Effort;
  /** Use the heavier reasoning model (gpt-6.2-astra). */
  heavy?: boolean;
  /** Needs current facts -> hosted web_search (research step, then strict-schema step). */
  web?: boolean;
  developer: string;
}

const BASE = 'You are a senior brand strategist. Be specific and realistic; never invent unverifiable statistics. Return only data that fits the required JSON structure.';

export const TASKS = {
  brand_analysis: { schema: 'brand_analysis', effort: 'high', heavy: true, developer: `${BASE} Scores are 0-1 unless a field says otherwise; healthScore is 0-100.` },
  social_profiles: { schema: 'social_profiles', effort: 'low', web: true, developer: `${BASE} Return the official social profile URLs for the business; use an empty string when one cannot be verified.` },
  social_profile_insights: { schema: 'social_profile_insights', effort: 'medium', web: true, developer: BASE },
  brand_evolution: { schema: 'brand_evolution', effort: 'medium', developer: BASE },
  branding_concepts: { schema: 'branding_concepts', effort: 'medium', developer: `${BASE} \`content\` is polished copy ready to use; \`keyMessages\` are the 3-5 messages to preserve.` },
  multimodal_analysis: { schema: 'multimodal_analysis', effort: 'medium', developer: BASE },
  realtime_analysis: { schema: 'realtime_analysis', effort: 'low', developer: BASE },
  top_brands: { schema: 'top_brands', effort: 'medium', web: true, developer: `${BASE} Use current market data; marketShare is a percentage.` },
  enhanced_text_analysis: { schema: 'enhanced_text_analysis', effort: 'medium', developer: BASE },
  voice_analysis: { schema: 'voice_analysis', effort: 'medium', developer: `${BASE} Scores are 0-1.` },
  content_optimization: { schema: 'content_optimization', effort: 'medium', developer: `${BASE} Rewrite scripts for spoken delivery.` },
  brand_content: { schema: 'brand_content', effort: 'low', developer: `${BASE} Write on-brand copy for the requested deliverable.` }
} as const satisfies Record<string, TaskDef>;

export type TaskName = keyof typeof TASKS;

export function isTaskName(name: unknown): name is TaskName {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(TASKS, name);
}

export interface TaskResult<T = any> {
  data: T;
  citations: Citation[];
}

/** Run a named task and return schema-validated data (plus web citations for web tasks). */
export async function runTask<T = any>(name: TaskName, input: string, opts: { imageUrls?: string[] } = {}): Promise<TaskResult<T>> {
  const def: TaskDef = TASKS[name];

  if (def.web) {
    const { data, citations } = await researchStructured<T>(def.schema, {
      question: input,
      developer: def.developer,
      effort: def.effort,
      feature: name
    });
    return { data, citations };
  }

  const { data } = await createStructured<T>(def.schema, {
    input,
    developer: def.developer,
    effort: def.effort,
    model: def.heavy ? reasoningModel() : undefined,
    imageUrls: opts.imageUrls,
    feature: name
  });
  return { data, citations: [] };
}
