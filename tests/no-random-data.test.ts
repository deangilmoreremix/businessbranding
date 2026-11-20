import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard: nothing that renders analysis data, charts or API results may use Math.random() (values shown to users must come from real
 * data, or be absent). Math.random is allowed only for ids/jitter, in the explicit list below.
 */
const ROOTS = ['app', 'components', 'lib', 'supabase/functions'];
const ALLOWED: Record<string, string> = {
  'supabase/functions/_shared/openai-core.ts': 'retry back-off jitter',
  'lib/local/store.ts': 'random suffix of a local record id'
};
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs|js)$/.test(f) ? [p] : []; });

describe('no random numbers as data', () => {
  const files = ROOTS.flatMap(walk).map((f) => f.split('\\').join('/'));
  it('scans a realistic number of files', () => expect(files.length).toBeGreaterThan(200));
  it('Math.random() appears only where explicitly allowed', () => {
    const offenders = files.filter((f) => /Math\.random\(/.test(readFileSync(f, 'utf8')) && !ALLOWED[f]);
    expect(offenders, `Math.random() found in: ${offenders.join(', ')}`).toEqual([]);
  });
  it('known fabricated fixtures stay gone', () => {
    const text = (f: string) => readFileSync(f, 'utf8');
    expect(text('components/brand-analysis/competitor-intelligence.tsx')).not.toMatch(/Industry Leader Inc\.|Regional Market Distribution|Competitor Growth Trends/);
    expect(text('lib/services/case-studies.ts')).not.toMatch(/Client Name|Company Name|'CEO'/);
    expect(text('app/api/scrape/route.ts')).not.toMatch(/Math\.random/);
  });
});
