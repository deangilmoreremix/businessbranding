import { describe, expect, it } from 'vitest';
import { buildReportModel, exportReport, REPORT_SECTIONS, type ReportSection } from '@/lib/report-export';
import { normalizeAnalysis } from '@/lib/services/brand-analyzer';

const analysis: any = normalizeAnalysis({
  healthScore: 72, marketFit: 0.64, uniquenessScore: 55,
  growthTrajectory: { current: 0.1, projected: 0.18, trend: 'up', timeframe: '12 months' },
  brandFactors: [{ name: 'Brand Purpose', score: 0.8, priority: 'high', trend: 'improving', insights: ['Clear mission', 'Add proof points'] }, { name: 'Visual Identity', score: 0.55, priority: 'medium', trend: 'stable', insights: [] }],
  marketAnalysis: { marketDynamics: { totalMarketSize: 1000, growthRate: 0.09, competitionLevel: 'high', entryBarriers: 'medium' }, customerSegments: [{ segment: 'Cafes', size: 0.4, growth: 0.1, characteristics: [] }], industryTrends: [{ trend: 'Direct trade', description: 'Buyers ask for origin stories', impact: 'high' }], marketOpportunities: [], growthBarriers: [] },
  competitors: [{ name: 'Rival Roasters', marketPosition: 'leader', growthRate: 0.05, strengths: ['Distribution'], weaknesses: ['Price'] }],
  recommendations: [{ priority: 'high', category: 'Identity', recommendation: 'Refresh the logo system', impact: 'high', timeframe: '3 months', resources: [] }],
  implementationStatus: { completed: 1, inProgress: 2, planned: 3, total: 6, progressPercentage: 17 }
});
const all = REPORT_SECTIONS.map((s) => s.id);
const text = async (b: Blob) => Buffer.from(await b.arrayBuffer());

describe('report model', () => {
  it('contains only the chosen sections and real values', () => {
    const m = buildReportModel(analysis, 'Acme Coffee roaster', ['overview', 'competitors'] as ReportSection[], new Date('2026-11-20T00:00:00Z'));
    expect(m.sections.map((s) => s.id)).toEqual(['overview', 'competitors']);
    expect(m.subtitle).toBe('Acme Coffee roaster · 2026-11-20');
    expect(JSON.stringify(m)).toContain('72%');
    expect(JSON.stringify(m)).toContain('Rival Roasters');
    expect(JSON.stringify(m)).not.toContain('Brand Purpose'); // analysis section not selected
  });
  it('says so when a section has no data instead of inventing rows', () => {
    const m = buildReportModel({ ...analysis, competitors: [], recommendations: [] }, '', all);
    expect(JSON.stringify(m)).toContain('No competitors were returned');
    expect(JSON.stringify(m)).toContain('No recommendations were returned');
  });

});

describe('exports are real, non-empty, valid files', () => {
  const model = buildReportModel(analysis, 'Acme Coffee roaster', all);

  it('PDF: %PDF header, EOF marker, size, and the selected content is in the file', async () => {
    const { blob, filename } = await exportReport('pdf', model);
    const buf = await text(blob);
    expect(filename).toBe('brand-analysis-report.pdf');
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.subarray(-16).toString()).toContain('%%EOF');
    expect(buf.length).toBeGreaterThan(2000);
    const raw = buf.toString('latin1');
    expect(raw).toContain('Executive overview');
    expect(raw).toContain('Rival Roasters');
  });

  it('Excel: a real zip/xlsx that reads back with one sheet per section and the right numbers', async () => {
    const { blob, filename } = await exportReport('excel', model);
    const buf = await text(blob);
    expect(filename.endsWith('.xlsx')).toBe(true);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    expect(wb.SheetNames).toEqual(['Executive overview', 'Brand pillars analysis', 'Market analysis', 'Competitor intelligence', 'Strategic recommendations']);
    const overview = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['Executive overview'], { header: 1 }) as string[][];
    expect(overview.flat()).toContain('72%');
    const pillars = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['Brand pillars analysis'], { header: 1 }) as string[][];
    expect(pillars.some((r) => r[0] === 'Brand Purpose' && r[1] === '80%')).toBe(true);
  });

  it('Word: a real docx (zip) whose document.xml holds the headings and table cells', async () => {
    const { blob, filename } = await exportReport('word', model);
    const buf = await text(blob);
    expect(filename.endsWith('.docx')).toBe(true);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Brand analysis report');
    expect(xml).toContain('Strategic recommendations');
    expect(xml).toContain('Refresh the logo system');
  });
});
