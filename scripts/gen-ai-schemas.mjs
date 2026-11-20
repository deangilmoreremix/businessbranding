#!/usr/bin/env node
/**
 * Generates strict JSON Schemas (OpenAI Structured Outputs) from the app's existing demo fixtures,
 * which are the exact shapes the UI already consumes. Re-run after changing a fixture:
 *   node scripts/gen-ai-schemas.mjs
 * Output: supabase/functions/_shared/schemas.ts (imported by both Next.js and the Edge Functions).
 *
 * Strict-mode rules applied (see OpenAI "Structured outputs"): every object has additionalProperties:false
 * and lists ALL its properties in `required`.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const ts = createRequire(import.meta.url)('typescript');

/** Return the source text of the {...} literal starting at the first "{" at/after `from`. */
function extractLiteral(src, from) {
  const start = src.indexOf('{', from);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i++;
      while (src[i] !== c) i += src[i] === '\\' ? 2 : 1;
    } else if (c === '`') {
      i++;
      while (src[i] !== '`') i += src[i] === '\\' ? 2 : 1;
    } else if (c === '/' && src[i + 1] === '/') {
      while (src[i] !== '\n') i++;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('unbalanced literal');
}

const STUBS = {
  url: 'https://example.com', platform: 'twitter', handle: 'demo', profileUrl: 'https://twitter.com/demo',
  industry: 'Technology', brandDescription: 'A brand', text: 'text', type: 'brand', businessIdea: 'idea',
  BRAND_PILLARS: ['Pillar A', 'Pillar B'], content: 'content'
};

function evalLiteral(literal, extra = {}) {
  const scope = { ...STUBS, ...extra };
  // Fixtures are TypeScript (e.g. `as const`); transpile before evaluating.
  const js = ts.transpileModule(`__r = (${literal});`, { compilerOptions: { target: 'ES2020' } }).outputText;
  return new Function(...Object.keys(scope), `var __r; ${js}; return __r;`)(...Object.values(scope));
}

/** Merge several example values of the same slot into one schema. */
function infer(value) {
  if (value === null) return { type: ['string', 'null'] };
  if (Array.isArray(value)) {
    const items = value.filter((v) => v !== undefined);
    if (items.length === 0) return { type: 'array', items: { type: 'string' } };
    if (items.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      const merged = {};
      for (const it of items) for (const [k, v] of Object.entries(it)) if (!(k in merged) || merged[k] === null) merged[k] = v;
      return { type: 'array', items: infer(merged) };
    }
    return { type: 'array', items: infer(items[0]) };
  }
  switch (typeof value) {
    case 'string': return { type: 'string' };
    case 'number': return { type: 'number' };
    case 'boolean': return { type: 'boolean' };
    case 'object': {
      const props = {};
      for (const [k, v] of Object.entries(value)) if (v !== undefined) props[k] = infer(v);
      return { type: 'object', properties: props, required: Object.keys(props), additionalProperties: false };
    }
    default: throw new Error('unsupported ' + typeof value);
  }
}

function strip(obj, keys) { for (const k of keys) delete obj[k]; return obj; }

const read = (p) => fs.readFileSync(p, 'utf8');
const schemas = {};
const add = (name, example) => { schemas[name] = infer(strip(example, ['demo'])); };

// ---- Edge functions ------------------------------------------------------------------------
const edge = (f) => read(`supabase/functions/${f}/index.ts`);

for (const [name, file] of [['brand_analysis_edge', 'brand-analysis'], ['brand_analyzer_edge', 'brand-analyzer']]) {
  const s = edge(file);
  add(name, evalLiteral(extractLiteral(s, s.indexOf('JSON.stringify({', s.indexOf("=== 'demo-mode'")) + 'JSON.stringify('.length)));
}
for (const [name, file, anchor] of [
  ['competitor_intelligence', 'competitor-intelligence', 'const demoResult: CompetitorAnalysis ='],
  ['market_analysis', 'market-analysis', 'const demoResult: MarketAnalysis ='],
  ['website_scan', 'website-scanner', 'const demoResult: WebsiteScanResult =']
]) {
  const s = edge(file);
  add(name, evalLiteral(extractLiteral(s, s.indexOf(anchor) + anchor.length)));
}
{
  const s = edge('social-media-analyzer');
  const profile = evalLiteral(extractLiteral(s, s.indexOf('const demoProfile')));
  const at = s.indexOf('JSON.stringify({', s.indexOf('const demoProfile'));
  add('social_media_analysis', evalLiteral(extractLiteral(s, at + 'JSON.stringify('.length), { demoProfile: profile }));
}
{
  const s = edge('ai-analysis');
  const demo = evalLiteral(extractLiteral(s, s.indexOf('const demoResponses')));
  for (const [type, v] of Object.entries(demo)) add(`analysis_${type}`, JSON.parse(v.text));
}

// ---- Client services -----------------------------------------------------------------------
{
  const s = read('lib/services/ai.ts');
  const grab = (fn, name, extra = {}) => {
    const at = s.indexOf(`async function ${fn}`);
    const demo = s.indexOf('return {', s.indexOf('isDemoMode()', at));
    add(name, evalLiteral(extractLiteral(s, demo + 'return '.length), extra));
  };
  grab('analyzeSocialMedia', 'social_profile_insights');
  grab('generateBrandEvolution', 'brand_evolution');
  grab('generateBrandingConcepts', 'branding_concepts');
  grab('analyzeMultimodal', 'multimodal_analysis');
  grab('analyzeRealtime', 'realtime_analysis');
  grab('getTopBrandsInIndustry', 'top_brands');
  grab('performEnhancedAnalysis', 'enhanced_text_analysis');
  // detectSocialProfiles returns the four profile URLs
  const at = s.indexOf('async function detectSocialProfiles');
  add('social_profiles', evalLiteral(extractLiteral(s, s.indexOf('return {', s.indexOf('isDemoMode()', at)) + 'return '.length)));
}
{
  const s = read('lib/services/voice.ts');
  const at = s.indexOf('async function analyzeVoiceContent');
  add('voice_analysis', evalLiteral(extractLiteral(s, s.indexOf('return {', s.indexOf('isDemoMode()', at)) + 'return '.length)));
}
{
  const s = read('lib/services/brand-analyzer.ts');
  const at = s.indexOf('private getDemoAnalysis');
  add('brand_analysis', evalLiteral(extractLiteral(s, s.indexOf('return {', at) + 'return '.length)));
}

// ---- Hand-written tweaks -------------------------------------------------------------------
// Voice/branding content routes read these two fields in addition to the demo shape.
const concepts = schemas.branding_concepts;
concepts.properties.content = { type: 'string' };
concepts.properties.keyMessages = { type: 'array', items: { type: 'string' } };
concepts.required.push('content', 'keyMessages');

schemas.content_optimization = {
  type: 'object',
  properties: { optimizedText: { type: 'string' }, changes: { type: 'array', items: { type: 'string' } } },
  required: ['optimizedText', 'changes'],
  additionalProperties: false
};

// Assistant quick actions (mission / story / posts / copy / suggestions)
schemas.brand_content = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    content: { type: 'string' },
    bullets: { type: 'array', items: { type: 'string' } }
  },
  required: ['title', 'content', 'bullets'],
  additionalProperties: false
};

const out = `// AUTO-GENERATED by scripts/gen-ai-schemas.mjs - do not edit by hand.
// Strict JSON Schemas for OpenAI Structured Outputs (text.format = json_schema, strict: true).

export const AI_SCHEMAS = ${JSON.stringify(schemas, null, 2)} as const;

export type AISchemaName = keyof typeof AI_SCHEMAS;
`;
fs.writeFileSync('supabase/functions/_shared/schemas.ts', out);
console.log('schemas:', Object.keys(schemas).join(', '));
