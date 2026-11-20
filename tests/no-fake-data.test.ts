import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Guard against fabricated content and fake interactivity ANYWHERE in app/, components/ and lib/ (not just a few files).
 * Every pattern below is a thing that previously shipped: invented statistics, invented people/testimonials, buttons that do nothing,
 * "saves" that are a timer, subscribe forms that send nothing, `href="#"`. A finding fails the test unless the file+pattern is in the
 * reviewed ALLOW list (each entry needs a reason a reviewer can check).
 */
const ROOTS = ['app', 'components', 'lib'];
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts|mdx)$/.test(f) ? [p.split('\\').join('/')] : []; });
const FILES = ROOTS.flatMap(walk).filter((f) => !f.startsWith('components/ui/'));
const src = (f: string) => readFileSync(f, 'utf8');

// file -> { rule -> reason }
const ALLOW: Record<string, Record<string, string>> = {
  'app/docs/**': { 'stat-literal': 'documentation text and code samples (version numbers, example payloads), not product claims' },
  'app/{privacy,terms,cookies}/page.tsx': { 'stat-literal': 'legal text: retention periods and legal limits' },
  'lib/local/**': { 'stat-literal': 'engineering constants (sample rates, byte sizes), not displayed statistics' },
  'lib/local/store.ts': { 'math-random': 'random suffix of a locally generated record id (uniqueness, never displayed or presented as data)' },
  'lib/services/{ai,voice,brand-analyzer}.ts': { 'hardcoded-metric': 'sample-data fixtures returned only when isDemoMode() is true; that dispatches SAMPLE_DATA_EVENT (visible sample-data banner) and brand analyses also carry sample:true; covered by the sample-label e2e checks' },
  'lib/ai-tasks.ts': { 'stat-literal': 'prompt instructions to the model (e.g. "score 0-100"), not displayed statistics' },
  'lib/**': { 'sample-fixture': 'lib code that implements the labelled sample-data mode (demo flag + sample:true) is reviewed in FAKE_DATA_AUDIT.md' }
};
const globToRe = (g: string) => new RegExp('^' + g.replace(/[.+^$()|\\]/g, '\\$&').replace(/\{([^}]+)\}/g, (_, a) => '(' + a.split(',').join('|') + ')').replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*') + '$');
const allowed = (file: string, rule: string) => Object.entries(ALLOW).some(([g, rules]) => globToRe(g).test(file) && rules[rule]);

type Finding = { file: string; line: number; rule: string; text: string };
const findings: Finding[] = [];
const add = (file: string, line: number, rule: string, text: string) => { if (!allowed(file, rule)) findings.push({ file, line, rule, text: text.trim().slice(0, 120) }); };

// ---- text rules (line based, comments stripped) ------------------------------------------------------------------------------
const NOT_DISPLAY = /className|style=|\bw-\[|\bh-\[|translate|animate=|initial=|whileInView|transition=|viewport=|opacity|scale|inset|margin|padding|width|height|\bx:|\by:|stroke|strokeDasharray|toFixed|Math\.(round|min|max)|\bflex-|grid-cols|gradient|rgba?\(|#[0-9a-fA-F]{3,6}|\.test\(|RegExp|new Date|setTimeout\(.*\d{3,}|\b(top|left|right|bottom):/;
const RULES: [string, RegExp][] = [
  ['stat-literal', /(?:^|[^\w$.-])[+\-]?\d{1,3}(?:\.\d+)?%(?!\s*[\]"'`)}])|[+\-]\d+(?:\.\d+)?%|\b\d{1,3}(?:\.\d+)?%\s+(?:satisfaction|growth|increase|reduction|faster|improvement|of (?:market|brands|customers|users)|ROI|savings|uplift)/i],
  ['price-literal', /\$\s?\d[\d,]*(?:\.\d+)?\s*(?:\/|per\s|[KMB]\b|mo\b|month|year|annual)|\$\d{2,}(?!\s*\{)/],
  ['abbrev-count', /\b\d{1,3}(?:\.\d)?[KMB]\+?\b(?!\w)/],
  ['big-number', /\b\d{1,3},\d{3}\+?(?!\d)/],
  ['vague-claim', /thousands of|millions of|trusted by|join (?:over )?\d|\bOver \d|\d+\+ (?:brands|clients|customers|companies|users|countries|businesses|agencies)/i],
  ['hardcoded-metric', /\b(?:score|risk|advantage|percent|percentage|growth|rate|count|total|progress|share|potential|impact|confidence|rating|users|visitors|revenue)\s*:\s*-?\d/i],
  ['literal-progress', /<Progress\s+value=\{\s*\d/],
  ['free-trial', /free trial|start free|money-back|14-day|cancel anytime/i],
  ['fake-name', /Sarah Chen|John Smith|Alex Johnson|Michael Chen|David Anderson|David Rodriguez|Sarah Williams|Michael Johnson|Emily Davis|Jane Doe|Lorem ipsum|TechFlex|GlobalTech/],
  ['unsourced-citation', /McKinsey|Bain & Company|Forrester|Gartner|Lucidpress|Statista|according to (?:a )?(?:recent )?(?:study|report)/i],
  ['math-random', /Math\.random\(/],
  ['dead-href', /href=["']#["']/],
  ['fake-social', /(?:twitter|linkedin|github|facebook|instagram)\.com\/(?:company\/)?aibrandcreator/i],
  ['timer-only-handler', /setTimeout\(\s*\(\)\s*=>\s*\{?\s*(?:alert|toast|console\.log|setSaving\(false\)|setSubscribed|setIsSubscribed)/],
  ['console-only-handler', /on(?:Click|Submit|Change)=\{\s*\(?[\w,\s]*\)?\s*=>\s*console\.log/],
  ['alert-success', /alert\(\s*['"`][^'"`]*(?:success|saved|exported|sent|subscribed)/i]
];
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, (m, a) => a);
for (const f of FILES) {
  const lines = stripComments(src(f)).split('\n');
  lines.forEach((line, i) => {
    if (/^\s*[\w$]+\s*[:=]\s*\/.*\/[a-z]*;?\s*$/.test(line) || /(?:const|let)\s+\w+\s*=\s*\/.*\/[a-z]*;/.test(line) || /\bposition:\s*["']\d+% \d+%["']/.test(line) || /\bplaceholder=/.test(line)) return; // regex literals, CSS position, input placeholders (hints, not data)
    for (const [rule, re] of RULES) {
      if (!re.test(line)) continue;
      if (rule === 'stat-literal' && (NOT_DISPLAY.test(line) || /^\s*(import|export type|\*)/.test(line))) continue;
      if ((rule === 'price-literal' || rule === 'big-number' || rule === 'abbrev-count') && NOT_DISPLAY.test(line) && !/>[^<]*[\d$]/.test(line)) continue;
      add(f, i + 1, rule, line);
    }
  });
}

// ---- AST rules: buttons that do nothing --------------------------------------------------------------------------------------
const INTERACTIVE_ANCESTORS = /^(Link|a|form|[A-Za-z]*Trigger|[A-Za-z]*Close|[A-Za-z]*Action|[A-Za-z]*Cancel|Tab[A-Za-z]*|CollapsibleTrigger|Slot)$/;
function checkButtons(file: string) {
  const code = src(file);
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const tagOf = (n: ts.Node): string => (ts.isJsxElement(n) ? n.openingElement.tagName.getText() : ts.isJsxSelfClosingElement(n) ? n.tagName.getText() : '');
  const attrsOf = (n: ts.Node) => (ts.isJsxElement(n) ? n.openingElement.attributes : ts.isJsxSelfClosingElement(n) ? n.attributes : null);
  const visit = (n: ts.Node, ancestors: ts.Node[]) => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = tagOf(n);
      const attrs = attrsOf(n)!;
      const names = new Set(attrs.properties.filter(ts.isJsxAttribute).map((a) => a.name.getText()));
      const spread = attrs.properties.some(ts.isJsxSpreadAttribute);
      if ((tag === 'Button' || tag === 'button') && !spread && !['onClick', 'onSubmit', 'asChild', 'disabled', 'onPointerDown', 'onMouseDown', 'form', 'onKeyDown'].some((a) => names.has(a))) {
        const typeAttr = attrs.properties.filter(ts.isJsxAttribute).find((a) => a.name.getText() === 'type');
        const isSubmit = typeAttr?.initializer && /submit/.test(typeAttr.initializer.getText());
        const insideInteractive = ancestors.some((a) => INTERACTIVE_ANCESTORS.test(tagOf(a)) || (attrsOf(a)?.properties ?? ({} as any)).length && (attrsOf(a)!.properties as ts.NodeArray<ts.JsxAttributeLike>).some((p) => ts.isJsxAttribute(p) && p.name.getText() === 'asChild'));
        if (!isSubmit && !insideInteractive) add(file, sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, 'inert-button', code.slice(n.getStart(), n.getStart() + 80).replace(/\s+/g, ' '));
      }
      ancestors = [...ancestors, n];
    }
    ts.forEachChild(n, (c) => visit(c, ancestors));
  };
  visit(sf, []);
}
for (const f of FILES.filter((f) => f.endsWith('.tsx'))) checkButtons(f);

// ---- sample / demo fixtures --------------------------------------------------------------------------------------------------
const FIXTURE = /\b(demo|sample|mock|placeholder)[A-Za-z]*\s*(=|:)\s*[\[{]|\bget(Demo|Sample|Mock)[A-Za-z]*\(|\b(demo|sample)(Data|Items|Rows|Brands|Posts|Studies|Metrics|Competitors)\b/;
for (const f of FILES) {
  src(f).split('\n').forEach((line, i) => { if (FIXTURE.test(line) && !/placeholder=/.test(line) && !/^\s*(\/\/|\*)/.test(line)) add(f, i + 1, 'sample-fixture', line); });
}

describe('no fabricated data or fake interactivity (whole app)', () => {
  it('scans the whole tree', () => expect(FILES.length).toBeGreaterThan(150));
  it('has no findings outside the reviewed allow-list', () => {
    const byRule: Record<string, Finding[]> = {};
    findings.forEach((f) => (byRule[f.rule] ||= []).push(f));
    const report = Object.entries(byRule).map(([r, fs]) => `${r} (${fs.length})\n` + fs.slice(0, 400).map((f) => `  ${f.file}:${f.line}  ${f.text}`).join('\n')).join('\n');
    expect(findings.length, `\n${report}\n`).toBe(0);
  });
  it('every allow-list entry has a reason and matches at least one file', () => {
    for (const [g, rules] of Object.entries(ALLOW)) {
      expect(FILES.some((f) => globToRe(g).test(f)), `stale allow-list glob ${g}`).toBe(true);
      for (const [rule, reason] of Object.entries(rules)) expect(reason.length, `${g}/${rule} needs a reason`).toBeGreaterThan(15);
    }
  });
});
