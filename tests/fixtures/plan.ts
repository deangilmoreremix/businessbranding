import type { ImplementationPlan } from '@/lib/services/implementation-plan';

/** TEST FIXTURE ONLY (never imported by app code): a small valid plan for the calendar/export tests. */
export function testPlan(businessDescription = 'your business'): ImplementationPlan {
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

