import { callTask, isDemoMode } from './ai';
import { parseTimelineDays, resolveOverlaps, type CalendarEvent, type Priority } from './calendar-service';

/**
 * Implementation plans: phased goals, tasks, success metrics, budget, risks and milestones.
 * Generated with the OpenAI Responses API (strict schema); a demo plan is used when no key is configured.
 */

export type PhaseName = 'short-term' | 'mid-term' | 'long-term';

export interface PlanTask {
  task: string;
  timeline: string;
  resources: string[];
}

export interface PlanMetric {
  metric: string;
  target: string;
  timeline: string;
}

export interface PlanGoal {
  title: string;
  description: string;
  tasks: PlanTask[];
  metrics: PlanMetric[];
}

export interface ImplementationPhase {
  phase: PhaseName;
  timeframe: string;
  goals: PlanGoal[];
}

export interface PlanRisk {
  risk: string;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface PlanMilestone {
  title: string;
  description: string;
  timeline: string;
  criteria: string[];
}

export interface BudgetLine {
  category: string;
  shortTerm: number;
  midTerm: number;
  longTerm: number;
}

export interface ImplementationPlan {
  overview: {
    title: string;
    description: string;
    estimatedTimeline: string;
    objectives: string[];
    requiredResources: string[];
  };
  phases: ImplementationPhase[];
  budgetEstimate: BudgetLine[];
  risks: PlanRisk[];
  milestones: PlanMilestone[];
}

export interface PlanRequest {
  businessDescription: string;
  goals?: string[];
  budget?: string;
  timeline?: string;
}

/** Demo plan; also the fixture the strict JSON schema is generated from (scripts/gen-ai-schemas.mjs). */
export function getDemoImplementationPlan(businessDescription = 'your business'): ImplementationPlan {
  return {
    overview: {
      title: 'Brand Implementation Plan',
      description: `A phased plan to launch and grow the brand for ${businessDescription}.`,
      estimatedTimeline: '12 months',
      objectives: ['Establish a consistent brand identity', 'Grow qualified audience', 'Convert awareness into revenue'],
      requiredResources: ['Brand strategist', 'Designer', 'Content marketer']
    },
    phases: [
      {
        phase: 'short-term',
        timeframe: '0-3 months',
        goals: [
          {
            title: 'Define the brand foundation',
            description: 'Positioning, voice and visual identity.',
            tasks: [
              { task: 'Run brand positioning workshop', timeline: '2 weeks', resources: ['Brand strategist'] },
              { task: 'Create logo and colour system', timeline: '4 weeks', resources: ['Designer'] }
            ],
            metrics: [{ metric: 'Brand guidelines approved', target: '1 document', timeline: '6 weeks' }]
          }
        ]
      },
      {
        phase: 'mid-term',
        timeframe: '3-6 months',
        goals: [
          {
            title: 'Launch marketing channels',
            description: 'Website, social profiles and email.',
            tasks: [{ task: 'Publish website and social profiles', timeline: '3 weeks', resources: ['Content marketer', 'Designer'] }],
            metrics: [{ metric: 'Monthly visitors', target: 'Set after measuring your baseline', timeline: '6 months' }]
          }
        ]
      },
      {
        phase: 'long-term',
        timeframe: '6-12 months',
        goals: [
          {
            title: 'Scale what works',
            description: 'Double down on the best-performing channels.',
            tasks: [{ task: 'Review channel performance and reallocate budget', timeline: '2 weeks', resources: ['Brand strategist'] }],
            metrics: [{ metric: 'Qualified leads per month', target: '200', timeline: '12 months' }]
          }
        ]
      }
    ],
    budgetEstimate: [
      { category: 'Brand design', shortTerm: 8000, midTerm: 2000, longTerm: 1000 },
      { category: 'Marketing', shortTerm: 3000, midTerm: 9000, longTerm: 15000 }
    ],
    risks: [{ risk: 'Inconsistent brand usage across channels', impact: 'medium', mitigation: 'Publish brand guidelines and templates' }],
    milestones: [{ title: 'Brand guidelines approved', description: 'Core identity signed off.', timeline: 'Month 2', criteria: ['Logo approved', 'Voice guide published'] }]
  };
}

export async function generateImplementationPlan(req: PlanRequest): Promise<ImplementationPlan> {
  if (await isDemoMode()) return getDemoImplementationPlan(req.businessDescription);
  const { data } = await callTask<ImplementationPlan>(
    'implementation_plan',
    `Create a detailed implementation plan for this business.\nBusiness: ${req.businessDescription}\nGoals: ${(req.goals ?? []).join('; ') || 'not specified'}\nBudget: ${req.budget || 'not specified'}\nTimeline: ${req.timeline || '12 months'}\nUse the phases short-term, mid-term and long-term, and risk impact values high, medium or low.`
  );
  return data;
}

const PHASE_PRIORITY: Record<PhaseName, Priority> = { 'short-term': 'high', 'mid-term': 'medium', 'long-term': 'low' };
const PHASE_OFFSET_MONTHS: Record<PhaseName, number> = { 'short-term': 0, 'mid-term': 3, 'long-term': 6 };

/**
 * Turn a plan into calendar events: tasks run in sequence inside their phase, starting at the phase offset, each lasting
 * its own timeline ("2 weeks"); milestones become all-hands review events. Pure and deterministic for a given start date.
 */
export function planToEvents(plan: ImplementationPlan, from: Date = new Date(), excludedDays: string[] = ['Saturday', 'Sunday']): CalendarEvent[] {
  const DAY = 86_400_000;
  const base = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 9, 0);
  const events: CalendarEvent[] = [];
  let n = 0;
  plan.phases.forEach((phase, phaseIndex) => {
    // unknown phase names fall back to their position (every 3 months)
    let cursor = base + (PHASE_OFFSET_MONTHS[phase.phase] ?? phaseIndex * 3) * 30 * DAY;
    for (const goal of phase.goals) {
      for (const t of goal.tasks) {
        const days = Math.max(1, parseTimelineDays(t.timeline));
        const start = new Date(cursor);
        events.push({
          id: `plan-${++n}`,
          title: t.task,
          description: `${goal.title}: ${goal.description}`,
          start,
          end: new Date(cursor + Math.min(days, 5) * DAY - 15 * 3_600_000), // first working week of the task, 9:00 to 18:00 blocks
          priority: PHASE_PRIORITY[phase.phase] ?? 'medium',
          category: phase.phase,
          metadata: { resources: t.resources, objectives: [goal.title] }
        });
        cursor += days * DAY;
      }
    }
  });
  plan.milestones.forEach((m, i) => {
    const start = new Date(base + Math.max(1, parseTimelineDays(m.timeline)) * DAY);
    events.push({ id: `milestone-${i + 1}`, title: `Milestone: ${m.title}`, description: m.description, start, end: new Date(start.getTime() + 2 * 3_600_000), priority: 'high', category: 'milestone', metadata: { resources: [], objectives: m.criteria } });
  });
  return resolveOverlaps(events, excludedDays);
}

/** Total estimated budget per phase and overall. */
export function budgetTotals(plan: ImplementationPlan): { shortTerm: number; midTerm: number; longTerm: number; total: number } {
  const sum = (key: 'shortTerm' | 'midTerm' | 'longTerm') => plan.budgetEstimate.reduce((n, b) => n + (Number(b[key]) || 0), 0);
  const shortTerm = sum('shortTerm');
  const midTerm = sum('midTerm');
  const longTerm = sum('longTerm');
  return { shortTerm, midTerm, longTerm, total: shortTerm + midTerm + longTerm };
}
