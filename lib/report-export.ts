import type { BrandAnalysis } from '@/lib/services/brand-analyzer';
import { formatFraction as fmtFraction, formatPercent as fmtPercent } from '@/lib/format';
import type { ImplementationPlan } from '@/lib/services/implementation-plan';

const NM = 'Not measured';
const formatFraction = (v: unknown, digits = 1) => fmtFraction(v, digits, NM);
const formatPercent = (v: unknown) => fmtPercent(v, NM);

/**
 * Real report exports of a brand analysis: PDF (jsPDF, MIT), Excel (SheetJS, write-only use) and Word (docx, MIT).
 * One neutral model is built from the analysis (only values that exist), then rendered by each exporter.
 */
export type ReportSection = 'overview' | 'analysis' | 'market' | 'competitors' | 'recommendations';
export const REPORT_SECTIONS: { id: ReportSection; label: string }[] = [
  { id: 'overview', label: 'Executive overview' },
  { id: 'analysis', label: 'Brand pillars analysis' },
  { id: 'market', label: 'Market analysis' },
  { id: 'competitors', label: 'Competitor intelligence' },
  { id: 'recommendations', label: 'Strategic recommendations' }
];

export interface ReportBlock { kind: 'paragraph' | 'table'; text?: string; header?: string[]; rows?: string[][] }
export interface ReportModel { title: string; subtitle: string; sections: { id: string; heading: string; blocks: ReportBlock[] }[] }

const cap = (s: unknown) => (typeof s === 'string' && s ? s[0].toUpperCase() + s.slice(1) : NM);
const list = (xs: unknown): string => (Array.isArray(xs) && xs.length ? xs.join('; ') : NM);

export function buildReportModel(analysis: BrandAnalysis, businessIdea: string, sections: ReportSection[], now = new Date()): ReportModel {
  const want = new Set(sections);
  const out: ReportModel['sections'] = [];
  const a: any = analysis;

  if (want.has('overview')) {
    const blocks: ReportBlock[] = [{ kind: 'table', header: ['Metric', 'Value'], rows: [
      ['Brand health', formatPercent(a.healthScore)],
      ['Market fit', formatFraction(a.marketFit, 0)],
      ['Uniqueness', formatFraction(a.uniquenessScore, 0)],
      ['Growth now', formatFraction(a.growthTrajectory?.current)],
      ['Growth projected', `${formatFraction(a.growthTrajectory?.projected)}${a.growthTrajectory?.timeframe ? ` (${a.growthTrajectory.timeframe})` : ''}`],
      ['Implementation', a.implementationStatus ? `${a.implementationStatus.completed} done, ${a.implementationStatus.inProgress} in progress, ${a.implementationStatus.planned} planned` : NM]
    ] }];
    out.push({ id: 'overview', heading: 'Executive overview', blocks });
  }
  if (want.has('analysis')) {
    out.push({ id: 'analysis', heading: 'Brand pillars analysis', blocks: [{ kind: 'table', header: ['Pillar', 'Score', 'Priority', 'Trend', 'Insights'], rows: (a.brandFactors ?? []).map((f: any) => [String(f.name), formatFraction(f.score, 0), cap(f.priority), cap(f.trend), list(f.insights)]) }] });
  }
  if (want.has('market')) {
    const m = a.marketAnalysis;
    const blocks: ReportBlock[] = [];
    if (m?.marketDynamics) blocks.push({ kind: 'table', header: ['Dynamic', 'Value'], rows: [['Growth rate', formatFraction(m.marketDynamics.growthRate)], ['Competition', cap(m.marketDynamics.competitionLevel)], ['Entry barriers', cap(m.marketDynamics.entryBarriers)]] });
    if (m?.customerSegments?.length) blocks.push({ kind: 'table', header: ['Segment', 'Share', 'Growth'], rows: m.customerSegments.map((s: any) => [String(s.segment), formatFraction(s.size, 0), formatFraction(s.growth)]) });
    for (const [title, items, key] of [['Industry trends', m?.industryTrends, 'trend'], ['Opportunities', m?.marketOpportunities, 'opportunity'], ['Growth barriers', m?.growthBarriers, 'barrier']] as const) {
      if (Array.isArray(items) && items.length) blocks.push({ kind: 'table', header: [title, 'Detail'], rows: items.map((i: any) => [String(i[key]), String(i.description ?? '')]) });
    }
    if (!blocks.length) blocks.push({ kind: 'paragraph', text: 'No market data was returned for this analysis.' });
    out.push({ id: 'market', heading: 'Market analysis', blocks });
  }
  if (want.has('competitors')) {
    const rows = (a.competitors ?? []).map((c: any) => [String(c.name), cap(c.marketPosition), list(c.strengths), list(c.weaknesses)]);
    out.push({ id: 'competitors', heading: 'Competitor intelligence', blocks: rows.length ? [{ kind: 'table', header: ['Competitor', 'Position', 'Strengths', 'Weaknesses'], rows }] : [{ kind: 'paragraph', text: 'No competitors were returned for this analysis.' }] });
  }
  if (want.has('recommendations')) {
    const rows = (a.recommendations ?? []).map((r: any) => [cap(r.priority), String(r.category ?? ''), String(r.recommendation ?? ''), cap(r.impact), String(r.timeframe ?? '')]);
    const blocks: ReportBlock[] = rows.length ? [{ kind: 'table', header: ['Priority', 'Area', 'Recommendation', 'Impact', 'Timeframe'], rows }] : [{ kind: 'paragraph', text: 'No recommendations were returned for this analysis.' }];
    if (a.riskFactors?.length) blocks.push({ kind: 'table', header: ['Risk', 'Probability', 'Impact', 'Mitigation'], rows: a.riskFactors.map((r: any) => [String(r.risk), cap(r.probability), cap(r.impact), String(r.mitigation ?? '')]) });
    out.push({ id: 'recommendations', heading: 'Strategic recommendations', blocks });
  }
  return { title: 'Brand analysis report', subtitle: `${businessIdea ? businessIdea.split('\n')[0].slice(0, 120) + ' · ' : ''}${now.toISOString().slice(0, 10)}`, sections: out };
}

export const PLAN_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'phases', label: 'Phases, goals and tasks' },
  { id: 'budget', label: 'Budget estimate' },
  { id: 'risks', label: 'Risks' },
  { id: 'milestones', label: 'Milestones' }
] as const;

/** Report model of a real implementation plan (what the user generated), for PDF / Excel / Word. */
export function buildPlanReportModel(plan: ImplementationPlan, sections: string[], now = new Date()): ReportModel {
  const want = new Set(sections);
  const out: ReportModel['sections'] = [];
  const money = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : NM);
  if (want.has('overview')) out.push({ id: 'overview', heading: 'Overview', blocks: [
    { kind: 'table', header: ['Field', 'Value'], rows: [['Title', plan.overview.title], ['Description', plan.overview.description], ['Estimated timeline', plan.overview.estimatedTimeline || NM], ['Objectives', list(plan.overview.objectives)], ['Required resources', list(plan.overview.requiredResources)]] }
  ] });
  if (want.has('phases')) out.push({ id: 'phases', heading: 'Phases, goals and tasks', blocks: [{ kind: 'table', header: ['Phase', 'Goal', 'Task', 'Timeline', 'Resources'], rows: plan.phases.flatMap((p) => p.goals.flatMap((g) => g.tasks.map((t) => [p.phase, g.title, t.task, t.timeline || NM, list(t.resources)]))) }] });
  if (want.has('budget')) out.push({ id: 'budget', heading: 'Budget estimate', blocks: plan.budgetEstimate.length ? [{ kind: 'table', header: ['Category', 'Short term', 'Mid term', 'Long term'], rows: plan.budgetEstimate.map((b) => [b.category, money(b.shortTerm), money(b.midTerm), money(b.longTerm)]) }] : [{ kind: 'paragraph', text: 'No budget estimate in this plan.' }] });
  if (want.has('risks')) out.push({ id: 'risks', heading: 'Risks', blocks: plan.risks.length ? [{ kind: 'table', header: ['Risk', 'Impact', 'Mitigation'], rows: plan.risks.map((r) => [r.risk, cap(r.impact), r.mitigation || NM]) }] : [{ kind: 'paragraph', text: 'No risks in this plan.' }] });
  if (want.has('milestones')) out.push({ id: 'milestones', heading: 'Milestones', blocks: plan.milestones.length ? [{ kind: 'table', header: ['Milestone', 'Timeline', 'Description', 'Criteria'], rows: plan.milestones.map((m) => [m.title, m.timeline || NM, m.description || NM, list(m.criteria)]) }] : [{ kind: 'paragraph', text: 'No milestones in this plan.' }] });
  return { title: 'Implementation plan', subtitle: `${plan.overview.title} · ${now.toISOString().slice(0, 10)}`, sections: out };
}

export const COMPETITIVE_SECTIONS = [
  { id: 'position', label: 'Brand position (from the analysis)' },
  { id: 'competitors', label: 'Competitors' }
] as const;

/** Report model of the competitive view: the three measured scores under their TRUE names, plus the analysed competitors. */
export function buildCompetitiveReportModel(analysis: any, sections: string[], now = new Date()): ReportModel {
  const want = new Set(sections);
  const out: ReportModel['sections'] = [];
  if (want.has('position')) out.push({ id: 'position', heading: 'Brand position', blocks: [{ kind: 'table', header: ['Measure', 'Value'], rows: [['Brand health', formatPercent(analysis?.healthScore)], ['Market fit', formatFraction(analysis?.marketFit, 0)], ['Uniqueness', formatFraction(analysis?.uniquenessScore, 0)]] }] });
  if (want.has('competitors')) {
    const rows = (analysis?.competitors ?? []).map((c: any) => [String(c.name), cap(c.marketPosition), typeof c.marketShare === 'number' ? `${c.marketShare > 1 ? c.marketShare : Math.round(c.marketShare * 100)}%` : NM, list(c.strengths), list(c.weaknesses)]);
    out.push({ id: 'competitors', heading: 'Competitors', blocks: rows.length ? [{ kind: 'table', header: ['Competitor', 'Position', 'Market share', 'Strengths', 'Weaknesses'], rows }] : [{ kind: 'paragraph', text: 'No competitors were returned for this analysis.' }] });
  }
  return { title: 'Competitive analysis', subtitle: now.toISOString().slice(0, 10), sections: out };
}

export const REPORT_FORMATS = {
  pdf: { ext: 'pdf', mime: 'application/pdf' },
  excel: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  word: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
} as const;
export type ReportFormat = keyof typeof REPORT_FORMATS;

export async function toPdf(model: ReportModel): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48;
  let y = M;
  const need = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const write = (text: string, size: number, bold = false, indent = 0) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
    for (const line of doc.splitTextToSize(text, W - 2 * M - indent) as string[]) { need(size + 4); doc.text(line, M + indent, y); y += size + 4; }
  };
  write(model.title, 20, true);
  write(model.subtitle, 10);
  y += 10;
  for (const s of model.sections) {
    y += 8;
    write(s.heading, 14, true);
    for (const b of s.blocks) {
      if (b.kind === 'paragraph') write(b.text ?? '', 10);
      else {
        write((b.header ?? []).join('  |  '), 9, true);
        for (const row of b.rows ?? []) write(row.join('  |  '), 9, false, 6);
      }
      y += 4;
    }
  }
  return doc.output('blob');
}

export async function toXlsx(model: ReportModel): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const s of model.sections) {
    const aoa: string[][] = [[s.heading], []];
    for (const b of s.blocks) {
      if (b.kind === 'paragraph') aoa.push([b.text ?? '']);
      else { aoa.push(b.header ?? []); aoa.push(...(b.rows ?? [])); }
      aoa.push([]);
    }
    let name = s.heading.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    while (used.has(name)) name = name.slice(0, 28) + '_' + used.size;
    used.add(name);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  }
  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([bytes], { type: REPORT_FORMATS.excel.mime });
}

export async function toDocx(model: ReportModel): Promise<Blob> {
  const d = await import('docx');
  const children: any[] = [new d.Paragraph({ text: model.title, heading: d.HeadingLevel.TITLE }), new d.Paragraph({ text: model.subtitle })];
  for (const s of model.sections) {
    children.push(new d.Paragraph({ text: s.heading, heading: d.HeadingLevel.HEADING_1 }));
    for (const b of s.blocks) {
      if (b.kind === 'paragraph') children.push(new d.Paragraph({ text: b.text ?? '' }));
      else {
        const cell = (t: string, bold = false) => new d.TableCell({ children: [new d.Paragraph({ children: [new d.TextRun({ text: t, bold })] })] });
        children.push(new d.Table({ width: { size: 100, type: d.WidthType.PERCENTAGE }, rows: [new d.TableRow({ children: (b.header ?? []).map((h) => cell(h, true)) }), ...(b.rows ?? []).map((r) => new d.TableRow({ children: r.map((c) => cell(c)) }))] }));
        children.push(new d.Paragraph({ text: '' }));
      }
    }
  }
  return d.Packer.toBlob(new d.Document({ sections: [{ children }] }));
}

export async function exportReport(format: ReportFormat, model: ReportModel, base = 'brand-analysis-report'): Promise<{ blob: Blob; filename: string }> {
  const blob = format === 'pdf' ? await toPdf(model) : format === 'excel' ? await toXlsx(model) : await toDocx(model);
  return { blob, filename: `${base}.${REPORT_FORMATS[format].ext}` };
}

/** Save a blob through a temporary link (works in every browser; no pickers). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
