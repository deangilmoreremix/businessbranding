import { callTask } from './ai';

/**
 * Smart scheduling and iCalendar export.
 *  - generateSmartSchedule / optimizeSchedule: OpenAI (Responses API, strict schemas). There is no fallback schedule: failures are thrown.
 *  - toICalendar / downloadICalendar: RFC 5545 export that opens in Google Calendar, Outlook and Apple Calendar.
 */

export type Priority = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  priority: Priority;
  category: string;
  metadata?: {
    resources?: string[];
    objectives?: string[];
    dependencies?: string[];
  };
}

export interface SmartScheduleOptions {
  businessGoals: string[];
  teamSize: number;
  /** Free text such as "3 months" or "6 weeks". */
  timeline: string;
  preferences?: {
    /** [start, end] as "HH:MM". */
    workingHours?: string[];
    timezone?: string;
    excludedDays?: string[];
  };
}

/** Event as returned by the AI (ISO date strings). */
export interface RawScheduleEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  priority: string;
  category: string;
  metadata: { resources: string[]; objectives: string[] };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------------------------

/** "3 months" -> 90, "6 weeks" -> 42, "10 days" -> 10, "1 year" -> 365. Falls back to 90. */
export function parseTimelineDays(text: string): number {
  const m = /(\d+(?:\.\d+)?)\s*(day|week|month|quarter|year)s?/i.exec(text ?? '');
  if (!m) return 90;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const per = unit === 'day' ? 1 : unit === 'week' ? 7 : unit === 'month' ? 30 : unit === 'quarter' ? 91 : 365;
  return Math.max(1, Math.round(n * per));
}

export function parseTime(hhmm: string | undefined, fallback: [number, number]): [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return fallback;
  const h = Math.min(23, Number(m[1]));
  const min = Math.min(59, Number(m[2]));
  return [h, min];
}

const asPriority = (p: string): Priority => (p === 'high' || p === 'medium' || p === 'low' ? p : 'medium');

/** Move a date forward to the next day that is not excluded (at most 7 steps). */
export function nextAllowedDay(date: Date, excludedDays: string[] = []): Date {
  const d = new Date(date);
  for (let i = 0; i < 7 && excludedDays.includes(DAY_NAMES[d.getUTCDay()]); i++) d.setTime(d.getTime() + DAY_MS);
  return d;
}

/** Convert AI output into CalendarEvents, dropping invalid dates and enforcing excluded days. */
export function normalizeSchedule(raw: RawScheduleEvent[], options: Pick<SmartScheduleOptions, 'preferences'> = {}): CalendarEvent[] {
  const excluded = options.preferences?.excludedDays ?? [];
  const events: CalendarEvent[] = [];
  for (const r of raw) {
    const start = new Date(r.start);
    const end = new Date(r.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    const duration = Math.max(end.getTime() - start.getTime(), 30 * 60_000);
    const shiftedStart = nextAllowedDay(start, excluded);
    events.push({
      id: r.id || `evt-${events.length + 1}`,
      title: r.title,
      description: r.description,
      start: shiftedStart,
      end: new Date(shiftedStart.getTime() + duration),
      priority: asPriority(r.priority),
      category: r.category,
      metadata: { resources: r.metadata?.resources ?? [], objectives: r.metadata?.objectives ?? [] }
    });
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Remove overlaps between events that share a resource (or all events when none list resources): later or
 * lower-priority events move to the next free slot on an allowed day. Deterministic.
 */
export function resolveOverlaps(events: CalendarEvent[], excludedDays: string[] = []): CalendarEvent[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime() || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const placed: CalendarEvent[] = [];
  for (const ev of sorted) {
    const duration = ev.end.getTime() - ev.start.getTime();
    let start = nextAllowedDay(ev.start, excludedDays);
    const conflicts = (candidate: Date) =>
      placed.find((p) => shareResource(p, ev) && candidate.getTime() < p.end.getTime() && candidate.getTime() + duration > p.start.getTime());
    let guard = 0;
    for (let c = conflicts(start); c && guard < 200; c = conflicts(start), guard++) {
      start = nextAllowedDay(new Date(c.end.getTime()), excludedDays);
    }
    placed.push({ ...ev, start, end: new Date(start.getTime() + duration) });
  }
  return placed.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function shareResource(a: CalendarEvent, b: CalendarEvent): boolean {
  const ra = a.metadata?.resources ?? [];
  const rb = b.metadata?.resources ?? [];
  if (!ra.length || !rb.length) return true; // unknown resources: assume the same team
  return ra.some((r) => rb.includes(r));
}


// ---------------------------------------------------------------------------------------------
// iCalendar (RFC 5545)
// ---------------------------------------------------------------------------------------------
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets (continuation lines start with a space). */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
      limit = 74; // continuation lines carry a leading space
    }
    cur += ch;
    bytes += b;
  }
  if (cur) out.push(cur);
  return out.join('\r\n ');
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const ICS_PRIORITY: Record<Priority, number> = { high: 1, medium: 5, low: 9 };

export function toICalendar(events: CalendarEvent[], calendarName = 'Implementation Plan', now: Date = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Brand Creator//Implementation Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsEscape(calendarName)}`];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${icsEscape(e.id)}@ai-brand-creator`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(new Date(e.start))}`,
      `DTEND:${icsDate(new Date(e.end))}`,
      `SUMMARY:${icsEscape(e.title)}`,
      `DESCRIPTION:${icsEscape([e.description, e.metadata?.objectives?.length ? `Objectives: ${e.metadata.objectives.join('; ')}` : '', e.metadata?.resources?.length ? `Resources: ${e.metadata.resources.join('; ')}` : ''].filter(Boolean).join('\n'))}`,
      `CATEGORIES:${icsEscape(e.category)}`,
      `PRIORITY:${ICS_PRIORITY[e.priority] ?? 5}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Browser download of the .ics file. */
export function downloadICalendar(events: CalendarEvent[], filename = 'implementation-calendar.ics'): void {
  const blob = new Blob([toICalendar(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------------------------------------------------------------------------------------------
// AI-backed generation with local fallback
// ---------------------------------------------------------------------------------------------
export async function generateSmartSchedule(options: SmartScheduleOptions): Promise<CalendarEvent[]> {
  {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await callTask<{ events: RawScheduleEvent[] }>(
      'smart_schedule',
      `Create an implementation schedule starting ${today} (UTC) over ${options.timeline}.\nBusiness goals: ${options.businessGoals.join('; ')}\nTeam size: ${options.teamSize}\nWorking hours: ${(options.preferences?.workingHours ?? ['09:00', '17:00']).join(' to ')} (${options.preferences?.timezone ?? 'UTC'})\nDo not schedule on: ${(options.preferences?.excludedDays ?? []).join(', ') || 'no excluded days'}\nUse ISO 8601 UTC timestamps. Priorities are high, medium or low.`
    );
    const events = normalizeSchedule(data.events, options);
    if (!events.length) throw new Error('The AI returned no schedule events. Try again.');
    return resolveOverlaps(events, options.preferences?.excludedDays);
  }
}

export async function optimizeSchedule(events: CalendarEvent[], excludedDays: string[] = []): Promise<CalendarEvent[]> {
  if (!events.length) return [];
  {
    const payload = events.map((e) => ({ id: e.id, title: e.title, description: e.description, start: new Date(e.start).toISOString(), end: new Date(e.end).toISOString(), priority: e.priority, category: e.category, metadata: { resources: e.metadata?.resources ?? [], objectives: e.metadata?.objectives ?? [] } }));
    const { data } = await callTask<{ events: RawScheduleEvent[] }>(
      'schedule_optimization',
      `Optimize this schedule: resolve conflicts, balance workload, put high-priority work first and keep dependencies in order. Keep every event (same ids) and only change times.\n${JSON.stringify(payload)}`
    );
    const optimized = normalizeSchedule(data.events, { preferences: { excludedDays } });
    if (!optimized.length) throw new Error('The AI returned no schedule events. Try again.');
    return resolveOverlaps(optimized, excludedDays);
  }
}
