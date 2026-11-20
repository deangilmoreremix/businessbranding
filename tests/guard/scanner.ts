import ts from 'typescript';

/**
 * Scanner behind tests/no-fake-data.test.ts. Pure: (path, code) -> findings, so the same rules run on the repository and on the
 * planted fakes in tests/guard-fixtures (self-test). Rules look at CONTENT (JSX text with `{98}%` / split lines re-joined, string and
 * template literals) and at STRUCTURE (AST), not at a fixed list of names or numbers.
 */
export type Finding = { file: string; line: number; rule: string; text: string };

const SCRIPT_KIND: Record<string, ts.ScriptKind> = { ts: ts.ScriptKind.TS, tsx: ts.ScriptKind.TSX, js: ts.ScriptKind.JS, jsx: ts.ScriptKind.JSX, mjs: ts.ScriptKind.JS, mts: ts.ScriptKind.TS };
export const extOf = (file: string) => file.replace(/\.fixture$/, '').split('.').pop() ?? '';

// ---- claim patterns, applied to CONTENT strings --------------------------------------------------------------------------------
const NUM_RULES: [string, RegExp][] = [
  ['stat-literal', /(?:^|[^\w$.-])[+\-]?\d{1,3}(?:\.\d+)?\s?%|[+\-]\d+(?:\.\d+)?%/],
  ['price-literal', /\$\s?\d[\d,]*(?:\.\d+)?\s*(?:\/|per\s|[KMB]\b|mo\b|month|year|annual)|\$\d{2,}(?!\s*\{)/],
  ['abbrev-count', /\b\d{1,3}(?:\.\d)?[KMB]\+?(?![\w%])/],
  ['big-number', /\b\d{1,3},\d{3}\+?(?!\d)/],
  ['bare-big-number', /\b\d{4,}\+?\s*(?:users|customers|teams|brands|clients|companies|downloads|visitors|views|members|businesses|projects|agencies|subscribers|reviews)\b|\b\d{1,3}[\s\u00a0]\d{3}\b(?!\s*(?:px|ms|kb|mb|hz))/i],
  ['stars-rating', /\b\d(?:\.\d)?\s*\/\s*5\b|\b\d(?:\.\d)?\s*(?:out of 5|stars?)\b|★{3,}/i],
  ['times-claim', /\b(?:by|up to|over)\s+\d+(?:\.\d+)?\s?x\b|\b\d+(?:\.\d+)?\s?x\s+(?:faster|more|better|growth|roi|higher|increase|conversion)\b|\b\d+\s+times\s+(?:faster|more|better|higher)\b/i]
];
const WORD_RULES: [string, RegExp][] = [
  ['vague-claim', /thousands of|millions of|trusted by|join (?:over )?\d|\bOver \d|\d+\+ (?:brands|clients|customers|companies|users|countries|businesses|agencies)/i],
  ['free-trial', /free trial|start free|money-back|14-day|cancel anytime/i],
  ['fake-name', /Sarah Chen|John Smith|Alex Johnson|Michael Chen|David Anderson|David Rodriguez|Sarah Williams|Michael Johnson|Emily Davis|Jane Doe|Lorem ipsum|TechFlex|GlobalTech/],
  // a person's name followed by a job title: ANY "Firstname Lastname, CMO" style attribution, not a fixed list of names
  ['testimonial-attribution', /\b[A-Z][a-z]+(?:\s[A-Z]\.)?\s[A-Z][a-z]+(?:[,\u2013\u2014-]|\s[-\u2013\u2014])\s*(?:Chief|CEO|CMO|CTO|CFO|COO|CIO|Founder|Co-?Founder|Director|VP\b|Vice President|President|Head of|Owner|Managing|Marketing (?:Manager|Director|Lead)|Brand (?:Manager|Director)|Product (?:Manager|Lead)|Creative Director|Senior|Lead\b)/],
  ['unsourced-citation', /McKinsey|Bain & Company|Forrester|Gartner|Lucidpress|Statista|according to (?:a )?(?:recent )?(?:study|report)/i],
  ['fake-social', /(?:twitter|linkedin|github|facebook|instagram)\.com\/(?:company\/)?(?:aibrandcreator|demo)\b/i]
];
export const DOC_SKIPPED_RULES = new Set(['stat-literal', 'price-literal', 'abbrev-count', 'big-number', 'bare-big-number', 'stars-rating', 'times-claim']);

// ---- text patterns on code (comments stripped) ------------------------------------------------------------------------------------
const CODE_RULES: [string, RegExp][] = [
  ['math-random', /Math\.random\(/],
  ['math-series', /Math\.(?:sin|cos|tan)\s*\(/],
  ['dead-href', /href=\{?\s*(?:["']\s*["']|["']#["']|["']javascript:[^"']*["']|`#`)\s*\}?/i],
  ['literal-style-percent', /\b(?:width|height|minWidth|maxWidth)\s*:\s*['"`]?\s*(?!100%|0%)\d+(?:\.\d+)?%/],
  ['literal-class-percent', /(?<![\w-])[wh]-\[\d+(?:\.\d+)?%\]/],
  ['literal-progress', /<Progress\s+value=\{\s*\d/],
  ['timer-only-handler', /setTimeout\(\s*\(\)\s*=>\s*\{?\s*(?:alert|toast|console\.log|setSaving\(false\)|setSubscribed|setIsSubscribed)/],
  ['alert-success', /alert\(\s*['"`][^'"`]*(?:success|saved|exported|sent|subscribed)/i],
  ['fake-async-success', /setTimeout\([^;]*\)\s*;?\s*return\s*\{\s*success\s*:\s*true/],
  ['interval-counter', /setInterval\([\s\S]{0,240}?\bset\w+\(\s*\(?\s*\w+\s*\)?\s*=>\s*(?:Math\.min\(\s*)?\w+\s*\+\s*\d/],
  ['hardcoded-metric', /\b(?:score|risk|advantage|percent|percentage|growth|rate|count|total|progress|share|potential|impact|confidence|rating|users|visitors|revenue|pct|n)\s*:\s*-?\d{2,}/i],
  ['sample-fixture', /\b(demo|sample|mock)[A-Za-z]*\s*(=|:)\s*[\[{]|\bget(Demo|Sample|Mock)[A-Za-z]*\(|\b(demo|sample)(Data|Items|Rows|Brands|Posts|Studies|Metrics|Competitors)\b|\bisDemoMode\b|X-Sample-Data|\bdemo\s*:\s*true|\bsample\s*:\s*true/]
];

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:\\])\/\/.*$/gm, (_m, a) => a);
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

const CLASS_TOKEN = /^[!\w:\-\[\]\/.#%()',=&>_*@]+$/;
const looksLikeClasses = (raw: string) => { const s = raw.replace(/\u27e6\u27e7/g, ' '); const t = s.trim().split(/\s+/); return t.length >= 1 && /[-:\[]/.test(s) && t.every((x) => CLASS_TOKEN.test(x)) && !/[.!?]\s/.test(s); };
const CONTENT_ATTRS = new Set(['title', 'alt', 'aria-label', 'label', 'description', 'content', 'text', 'subtitle', 'heading', 'value', 'name', 'badge', 'tooltip']);
const CSS_PROPS = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'inset', 'margin', 'padding', 'position', 'backgroundPosition', 'transform', 'flex', 'gap', 'fontSize', 'transformOrigin', 'objectPosition', 'clipPath', 'translateX', 'translateY', 'x', 'y', 'size']);
const SAFE_NUMERIC = new Set(['x', 'y', 'z', 'top', 'left', 'right', 'bottom', 'width', 'height', 'size', 'delay', 'duration', 'ms', 'timeout', 'interval', 'max', 'min', 'limit', 'threshold', 'zIndex', 'rotate', 'scale', 'opacity', 'stagger', 'speed', 'density', 'pointSize', 'strokeWidth', 'fontSize', 'margin', 'padding', 'length', 'step', 'offset', 'rows', 'cols', 'columns', 'tabIndex', 'status', 'port', 'maxLength', 'minLength', 'rowSpan', 'colSpan', 'amount', 'repeat', 'order', 'index', 'id', 'version', 'year', 'quality', 'itemWidth', 'itemHeight', 'symbolSize', 'translateX', 'translateY', 'axis', 'bucket', 'cellSize', 'gap', 'radius', 'angle', 'padAngle', 'innerRadius', 'cornerRadius', 'pixelRatio', 'sampleRate', 'bitrate', 'bitDepth', 'channels', 'fps', 'count']);

export function scanSource(file: string, code: string, opts: { docs?: boolean } = {}): Finding[] {
  const out: Finding[] = [];
  const ext = extOf(file);
  const add = (line: number, rule: string, text: string) => { if (opts.docs && DOC_SKIPPED_RULES.has(rule)) return; out.push({ file, line, rule, text: norm(text).slice(0, 120) }); };
  const stripped = stripComments(code);

  // ---- code-text rules (on the comment-stripped source; whole-file so multi-line forms are caught)
  const lineAt = (idx: number) => stripped.slice(0, idx).split('\n').length;
  for (const [rule, re] of CODE_RULES) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (let m = g.exec(stripped); m; m = g.exec(stripped)) {
      const lineText = stripped.split('\n')[lineAt(m.index) - 1] ?? '';
      if (/^\s*(import|export type)\b/.test(lineText) || /\bplaceholder=/.test(lineText)) continue;
      if (/^\s*[\w$]+\s*[:=]\s*\/.*\/[a-z]*;?\s*$/.test(lineText) || /(?:const|let)\s+\w+\s*=\s*\/.*\/[a-z]*;/.test(lineText)) continue; // regex literal definitions
      if (rule === 'hardcoded-metric' && /rate\s*:\s*(?:8000|11025|16000|22050|24000|32000|44100|48000)\b/i.test(m[0])) continue; // audio sample rate
      add(lineAt(m.index), rule, m[0].length > 100 ? m[0].slice(0, 100) : lineText);
    }
  }

  if (!SCRIPT_KIND[ext]) { // .mdx etc.: content rules over the raw text only
    const t = norm(stripped);
    for (const [rule, re] of [...NUM_RULES, ...WORD_RULES]) if (re.test(t)) add(1, rule, (t.match(re)?.[0] ?? ''));
    return out;
  }

  const sf = ts.createSourceFile(file, stripped, ts.ScriptTarget.Latest, true, SCRIPT_KIND[ext]);
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const content = (n: ts.Node, text: string) => {
    const t = norm(text);
    if (!t || looksLikeClasses(t) || /(?:gradient|rgba?|hsla?)\(/.test(t) || /^(?:[-\d.]+(?:%|px|em|rem|vh|vw)?\s*)+$/.test(t) && n.parent && (ts.isArrayLiteralExpression(n.parent) || ts.isPropertyAssignment(n.parent))) return; // CSS values
    for (const [rule, re] of [...NUM_RULES, ...WORD_RULES]) {
      const m = t.match(re);
      if (!m) continue;
      if (rule === 'stat-literal' && /^-?[\d.]+%$/.test(t) && (() => { for (let p: ts.Node | undefined = n.parent; p; p = p.parent) if (ts.isJsxAttribute(p) && /^(animate|initial|exit|style|variants|whileHover|whileInView|transition)$/.test(p.name.getText())) return true; return false; })()) continue; // animation / style values
      if (rule === 'stat-literal' && /^[\d.\s%]+$/.test(t) && n.parent && ts.isPropertyAssignment(n.parent) && CSS_PROPS.has(n.parent.name.getText())) continue; // style: { width: '100%' }
      add(lineOf(n), rule, t);
    }
  };
  const isHandlerName = (name: string) => /^on[A-Z]/.test(name);
  const fnBody = (init: ts.Node | undefined): { fn: ts.FunctionLikeDeclaration; body: ts.Node } | null => {
    if (!init) return null;
    let e: ts.Node = init;
    if (ts.isJsxExpression(e) && e.expression) e = e.expression;
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return { fn: e, body: e.body };
    return null;
  };
  const callNames = (n: ts.Node): string[] => {
    const names: string[] = [];
    const v = (x: ts.Node) => { if (ts.isCallExpression(x)) names.push(x.expression.getText()); ts.forEachChild(x, v); };
    v(n);
    return names;
  };
  const hasAwait = (n: ts.Node): boolean => { let f = false; const v = (x: ts.Node) => { if (ts.isAwaitExpression(x)) f = true; ts.forEachChild(x, v); }; v(n); return f; };

  const checkHandler = (name: string, init: ts.Node | undefined, at: ts.Node) => {
    if (!isHandlerName(name)) return;
    const f = fnBody(init);
    if (!f) return;
    const { body } = f;
    const empty = (ts.isBlock(body) && body.statements.length === 0) || (ts.isIdentifier(body) && body.text === 'undefined') || (!ts.isBlock(body) && body.kind === ts.SyntaxKind.VoidExpression);
    if (empty) { add(lineOf(at), 'empty-handler', `${name}={() => {}}`); return; }
    const names = callNames(body);
    const visible = names.filter((c) => /^(toast(\.\w+)?|alert|console\.\w+)$/.test(c));
    const others = names.filter((c) => !/^(toast(\.\w+)?|alert|console\.\w+|set[A-Z]\w*|preventDefault|e\.preventDefault|event\.preventDefault)$/.test(c));
    if (visible.length && !others.length && !hasAwait(body)) add(lineOf(at), 'fake-success-handler', `${name}: ${norm(body.getText()).slice(0, 80)}`);
  };

  const visit = (n: ts.Node, ancestors: ts.Node[]) => {
    // JSX content: children re-joined so "{98}% of users" and numbers split over lines are seen as the text a user reads
    if (ts.isJsxElement(n) || ts.isJsxFragment(n)) {
      const parts = n.children.map((c) => (ts.isJsxText(c) ? c.text : ts.isJsxExpression(c) ? (c.expression && (ts.isNumericLiteral(c.expression) || ts.isStringLiteral(c.expression)) ? c.expression.text : '\u27e6\u27e7') : ' '));
      const joined = parts.join('');
      if (joined.trim()) content(n, joined);
    }
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && n.parent) {
      const p = n.parent;
      const skip = ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p) || ts.isExternalModuleReference(p) ||
        (ts.isJsxAttribute(p) && !CONTENT_ATTRS.has(p.name.getText())) ||
        (ts.isPropertyAssignment(p) && p.initializer !== n) ||
        (ts.isCallExpression(p) && /^(require|cn|clsx|cva|twMerge|import|test|it|describe|dynamic)$/.test(p.expression.getText())) ||
        (ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText()));
      if (!skip) content(n, n.text);
    }
    if (ts.isTemplateExpression(n)) {
      const t = n.head.text + n.templateSpans.map((s) => '\u27e6\u27e7' + s.literal.text).join('');
      if (!(n.parent && ts.isJsxAttribute(n.parent)) && !(n.parent && ts.isPropertyAssignment(n.parent) && n.parent.name.getText() === 'className')) content(n, t);
    }

    // an awaited fixed wait (new Promise(r => setTimeout(r, N))) outside a polling loop is an artificial delay
    if (ts.isNewExpression(n) && n.expression.getText() === 'Promise' && n.arguments?.[0] && /setTimeout\(/.test(n.arguments[0].getText()) && n.arguments[0].getText().length < 90 && ts.isAwaitExpression(n.parent)) {
      let inLoop = false;
      for (let p: ts.Node | undefined = n.parent; p; p = p.parent) { if (ts.isWhileStatement(p) || ts.isForStatement(p) || ts.isDoStatement(p) || ts.isForOfStatement(p)) inLoop = true; if (ts.isFunctionLike(p)) break; }
      if (!inLoop) add(lineOf(n), 'artificial-delay', n.parent.getText().slice(0, 80));
    }
    // handlers
    if (ts.isJsxAttribute(n)) checkHandler(n.name.getText(), n.initializer, n);
    if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name)) checkHandler(n.name.text, n.initializer, n);

    // numeric data in arrays of objects (stat tiles, chart rows): any bare number >= 10 under a name that is not layout/config
    if (ts.isPropertyAssignment(n) && n.parent && ts.isObjectLiteralExpression(n.parent) && n.parent.parent && ts.isArrayLiteralExpression(n.parent.parent)) {
      const name = ts.isIdentifier(n.name) || ts.isStringLiteral(n.name) ? n.name.text : '';
      const init = ts.isPrefixUnaryExpression(n.initializer) && ts.isNumericLiteral(n.initializer.operand) ? n.initializer.operand : n.initializer;
      if (ts.isNumericLiteral(init) && Math.abs(Number(init.text)) >= 10 && !SAFE_NUMERIC.has(name) && ['tsx', 'jsx'].includes(ext)) add(lineOf(n), 'numeric-data-array', `${name}: ${init.text}`);
    }
    // inert buttons
    if (['tsx', 'jsx'].includes(ext) && (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n))) {
      const el = ts.isJsxElement(n) ? n.openingElement : n;
      const tag = el.tagName.getText();
      const attrs = el.attributes;
      const names = new Set(attrs.properties.filter(ts.isJsxAttribute).map((a) => a.name.getText()));
      const spread = attrs.properties.some(ts.isJsxSpreadAttribute);
      if ((tag === 'Button' || tag === 'button') && !spread && !['onClick', 'onSubmit', 'asChild', 'disabled', 'onPointerDown', 'onMouseDown', 'form', 'onKeyDown', 'formAction'].some((a) => names.has(a))) {
        const typeAttr = attrs.properties.filter(ts.isJsxAttribute).find((a) => a.name.getText() === 'type');
        const isSubmit = typeAttr?.initializer && /submit/.test(typeAttr.initializer.getText());
        const tagOf = (a: ts.Node) => (ts.isJsxElement(a) ? a.openingElement.tagName.getText() : ts.isJsxSelfClosingElement(a) ? a.tagName.getText() : '');
        const insideInteractive = ancestors.some((a) => /^(Link|a|form|[A-Za-z]*Trigger|[A-Za-z]*Close|[A-Za-z]*Action|[A-Za-z]*Cancel|Tab[A-Za-z]*|Slot)$/.test(tagOf(a)) || ((ts.isJsxElement(a) ? a.openingElement : ts.isJsxSelfClosingElement(a) ? a : null)?.attributes.properties.some((p) => ts.isJsxAttribute(p) && p.name.getText() === 'asChild') ?? false));
        if (!isSubmit && !insideInteractive) add(lineOf(n), 'inert-button', n.getText().slice(0, 80));
      }
    }
    const next = ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) ? [...ancestors, n] : ancestors;
    ts.forEachChild(n, (c) => visit(c, next));
  };
  visit(sf, []);
  return out;
}
