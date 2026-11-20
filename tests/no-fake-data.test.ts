import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { scanSource, extOf, type Finding } from './guard/scanner';

/**
 * Guard against fabricated content and fake interactivity in app/, components/, lib/ and supabase/functions/ (.ts .tsx .js .jsx .mjs .mdx).
 * Rules (tests/guard/scanner.ts) look at CONTENT (JSX text re-joined, string/template literals) and STRUCTURE (AST), not at fixed names
 * or numbers. tests/guard-fixtures holds planted fakes and evasions that every rule must catch (self-test below).
 * The allow-list covers documentation only; there is no allow-list for application code.
 */
const ROOTS = ['app', 'components', 'lib', 'supabase/functions'];
const EXT = /\.(tsx?|jsx?|mjs|mdx)$/;
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : EXT.test(f) ? [p.split('\\').join('/')] : []; });
const FILES = ROOTS.flatMap(walk).filter((f) => !f.startsWith('components/ui/') && f !== 'supabase/functions/_shared/schemas.ts' && !f.endsWith('.d.ts'));

/** Documentation shows version numbers, limits and example payloads: numeric-claim rules are skipped there (every other rule still applies). */
const DOCS = (f: string) => f.startsWith('app/docs/') || f.endsWith('.mdx');
const DOCS_REASON = 'documentation text and code samples (version numbers, example payloads, limits), not product claims';
// file -> { rule -> reason }: reviewed exceptions in application code (kept empty on purpose; each needs a reason a reviewer can check)
const ALLOW: Record<string, Record<string, string>> = {};

const globToRe = (g: string) => new RegExp('^' + g.replace(/[.+^$()|\\]/g, '\\$&').replace(/\{([^}]+)\}/g, (_, a) => '(' + a.split(',').join('|') + ')').replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*') + '$');
const allowed = (file: string, rule: string) => Object.entries(ALLOW).some(([g, rules]) => globToRe(g).test(file) && rules[rule]);

const scanAll = (): Finding[] => FILES.flatMap((f) => scanSource(f, readFileSync(f, 'utf8'), { docs: DOCS(f) })).filter((x) => !allowed(x.file, x.rule));

describe('no fabricated data or fake interactivity (whole app)', () => {
  it('scans the whole tree, including supabase/functions and .js/.jsx/.mjs', () => {
    expect(FILES.length).toBeGreaterThan(150);
    expect(FILES.some((f) => f.startsWith('supabase/functions/'))).toBe(true);
    expect(EXT.test('x.jsx') && EXT.test('x.mjs') && EXT.test('x.js')).toBe(true);
  });
  it('has no findings', () => {
    const findings = scanAll();
    const byRule: Record<string, Finding[]> = {};
    findings.forEach((f) => (byRule[f.rule] ||= []).push(f));
    const report = Object.entries(byRule).map(([r, fs]) => `${r} (${fs.length})\n` + fs.slice(0, 400).map((f) => `  ${f.file}:${f.line}  ${f.text}`).join('\n')).join('\n');
    expect(findings.length, `\n${report}\n`).toBe(0);
  });
  it('every allow-list entry has a reason and matches a file; docs exception has a reason', () => {
    expect(DOCS_REASON.length).toBeGreaterThan(15);
    for (const [g, rules] of Object.entries(ALLOW)) {
      expect(FILES.some((f) => globToRe(g).test(f)), `stale allow-list glob ${g}`).toBe(true);
      for (const [rule, reason] of Object.entries(rules)) expect(reason.length, `${g}/${rule} needs a reason`).toBeGreaterThan(15);
    }
  });
});

describe('guard self-test: every planted fake and evasion is caught', () => {
  const dir = 'tests/guard-fixtures';
  const fixtures = readdirSync(dir).filter((f) => f.endsWith('.fixture'));
  it('has the planted fixtures', () => expect(fixtures.length).toBeGreaterThanOrEqual(35));
  it.each(fixtures)('%s', (name) => {
    const code = readFileSync(join(dir, name), 'utf8');
    const expected = (code.match(/^\/\/ expect: (.+)$/m)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    expect(expected.length, `${name} needs an "// expect:" line`).toBeGreaterThan(0);
    const found = new Set(scanSource(name, code).map((f) => f.rule));
    for (const rule of expected) expect(found.has(rule), `${name}: expected rule ${rule}, got ${[...found].join(',') || 'nothing'}`).toBe(true);
    expect(['ts', 'tsx', 'js', 'jsx', 'mjs']).toContain(extOf(name));
  });
  it('clean code produces no findings (no blanket false positives)', () => {
    const clean = "export const X = ({ items }: { items: string[] }) => (\n  <div className=\"w-full h-2 flex gap-2\" style={{ width: '100%' }}>\n    <Button onClick={() => save(items)}>Save</Button>\n    <Link href=\"/pricing\"><Button>Go</Button></Link>\n    <p>Your analysis has {items.length} items.</p>\n  </div>\n);";
    expect(scanSource('clean.tsx', clean)).toEqual([]);
  });
});
