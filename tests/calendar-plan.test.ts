import { describe, expect, it } from 'vitest';
import { foldLine, nextAllowedDay, normalizeSchedule, parseTimelineDays, resolveOverlaps, toICalendar, type CalendarEvent } from '@/lib/services/calendar-service';
import { budgetTotals, planToEvents } from '@/lib/services/implementation-plan';
import { testPlan as getDemoImplementationPlan } from './fixtures/plan';

const ev = (over: Omit<Partial<CalendarEvent>, 'start' | 'end'> & { start: string; end: string }): CalendarEvent => ({
  id: over.id ?? 'e', title: 'T', description: 'D', priority: 'medium', category: 'c', ...over, start: new Date(over.start), end: new Date(over.end)
});

describe('parseTimelineDays', () => {
  it('parses units and falls back to 90', () => {
    expect(parseTimelineDays('3 months')).toBe(90);
    expect(parseTimelineDays('6 weeks')).toBe(42);
    expect(parseTimelineDays('10 days')).toBe(10);
    expect(parseTimelineDays('1 year')).toBe(365);
    expect(parseTimelineDays('soon')).toBe(90);
  });
});

describe('nextAllowedDay / normalizeSchedule', () => {
  it('skips excluded weekdays', () => {
    const saturday = new Date('2026-01-03T09:00:00Z'); // Saturday
    expect(nextAllowedDay(saturday, ['Saturday', 'Sunday']).getUTCDay()).toBe(1);
  });
  it('drops invalid dates, keeps duration, sorts and moves events off excluded days', () => {
    const out = normalizeSchedule([
      { id: 'b', title: 'B', description: '', start: '2026-01-10T09:00:00Z', end: '2026-01-10T11:00:00Z', priority: 'high', category: 'x', metadata: { resources: [], objectives: [] } },
      { id: 'bad', title: 'Bad', description: '', start: 'nope', end: 'nope', priority: 'low', category: 'x', metadata: { resources: [], objectives: [] } },
      { id: 'a', title: 'A', description: '', start: '2026-01-05T09:00:00Z', end: '2026-01-05T10:00:00Z', priority: 'weird', category: 'x', metadata: { resources: [], objectives: [] } }
    ], { preferences: { excludedDays: ['Saturday', 'Sunday'] } });
    expect(out.map((e) => e.id)).toEqual(['a', 'b']);
    expect(out[0].priority).toBe('medium'); // unknown priority normalised
    expect(out[1].start.getUTCDay()).toBe(1); // Saturday Jan 10 -> Monday Jan 12
    expect(out[1].end.getTime() - out[1].start.getTime()).toBe(2 * 3_600_000);
  });
});

describe('resolveOverlaps', () => {
  it('moves a conflicting event after the earlier one (shared resources)', () => {
    const a = ev({ id: 'a', start: '2026-01-05T09:00:00Z', end: '2026-01-05T11:00:00Z', metadata: { resources: ['Dev'] } });
    const b = ev({ id: 'b', start: '2026-01-05T10:00:00Z', end: '2026-01-05T12:00:00Z', metadata: { resources: ['Dev'] } });
    const out = resolveOverlaps([b, a]);
    const placedB = out.find((e) => e.id === 'b')!;
    expect(placedB.start.getTime()).toBeGreaterThanOrEqual(a.end.getTime());
    expect(placedB.end.getTime() - placedB.start.getTime()).toBe(2 * 3_600_000);
  });
  it('leaves events with different resources alone', () => {
    const a = ev({ id: 'a', start: '2026-01-05T09:00:00Z', end: '2026-01-05T11:00:00Z', metadata: { resources: ['Dev'] } });
    const b = ev({ id: 'b', start: '2026-01-05T10:00:00Z', end: '2026-01-05T12:00:00Z', metadata: { resources: ['Design'] } });
    expect(resolveOverlaps([a, b]).find((e) => e.id === 'b')!.start.toISOString()).toBe('2026-01-05T10:00:00.000Z');
  });
});

describe('iCalendar export', () => {
  const events = [ev({ id: 'x1', title: 'Plan; review, now', description: 'Line one\nLine two', start: '2026-01-05T09:00:00Z', end: '2026-01-05T10:30:00Z', priority: 'high', category: 'Planning', metadata: { objectives: ['Ship'], resources: ['Dev'] } })];
  const ics = toICalendar(events, 'My Plan', new Date('2026-01-01T00:00:00Z'));
  it('is a valid VCALENDAR with CRLF line endings and UTC timestamps', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20260105T090000Z');
    expect(ics).toContain('DTEND:20260105T103000Z');
    expect(ics).toContain('UID:x1@ai-brand-creator');
    expect(ics).toContain('PRIORITY:1');
  });
  it('escapes special characters', () => {
    expect(ics).toContain('SUMMARY:Plan\\; review\\, now');
    expect(ics).toContain('Line one\\nLine two');
  });
  it('folds long lines at 75 octets', () => {
    const long = foldLine('DESCRIPTION:' + 'é'.repeat(100));
    for (const l of long.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(long.replace(/\r\n /g, '')).toBe('DESCRIPTION:' + 'é'.repeat(100));
  });
});

describe('planToEvents robustness', () => {
  it('tolerates unknown phase names by spacing phases 3 months apart', () => {
    const plan = getDemoImplementationPlan('Acme');
    plan.phases.forEach((p, i) => { (p as any).phase = `phase-${i}`; });
    const events = planToEvents(plan, new Date('2026-01-05T00:00:00Z'));
    expect(events.every((e) => !Number.isNaN(e.start.getTime()))).toBe(true);
    expect(events.every((e) => ['high', 'medium', 'low'].includes(e.priority))).toBe(true);
  });
});

describe('implementation plan helpers', () => {
  const plan = getDemoImplementationPlan('Acme');
  it('totals the budget', () => {
    const t = budgetTotals(plan);
    expect(t.shortTerm).toBe(11000);
    expect(t.total).toBe(t.shortTerm + t.midTerm + t.longTerm);
  });
  it('turns a plan into ordered, non-overlapping events with phase priorities and milestones', () => {
    const events = planToEvents(plan, new Date('2026-01-05T00:00:00Z'));
    const taskCount = plan.phases.flatMap((p) => p.goals.flatMap((g) => g.tasks)).length;
    expect(events).toHaveLength(taskCount + plan.milestones.length);
    expect(events.find((e) => e.title.includes('positioning'))!.priority).toBe('high');
    expect(events.find((e) => e.title.includes('Review channel'))!.priority).toBe('low');
    expect(events.some((e) => e.title.startsWith('Milestone:'))).toBe(true);
    expect(events.every((e) => ![0, 6].includes(e.start.getUTCDay()))).toBe(true);
    for (let i = 1; i < events.length; i++) expect(events[i].start.getTime()).toBeGreaterThanOrEqual(events[i - 1].start.getTime());
  });
});

describe('iCalendar escaping', () => {
  it('escapes semicolons, commas, backslashes and newlines in text values (RFC 5545)', () => {
    const ics = toICalendar([{ id: 'e1', title: 'A; B, C', description: 'x;y\\z\nnext', start: new Date('2026-01-05T09:00:00Z'), end: new Date('2026-01-05T10:00:00Z'), priority: 'high', category: 'c', metadata: { resources: [], objectives: [] } } as any]);
    expect(ics).toContain('SUMMARY:A\\; B\\, C');
    expect(ics).toContain('x\\;y\\\\z\\nnext');
    expect(ics).not.toMatch(/SUMMARY:[^\r\n]*[^\\];/);
  });
});
