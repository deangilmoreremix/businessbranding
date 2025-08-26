'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from '@/components/export-dialog';
import { 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  ArrowRight,
  BarChart,
  Download,
  FileText,
  TrendingUp,
  Zap,
  Building,
  Brain
} from 'lucide-react';
import { ImplementationPlan, ImplementationPhase } from '@/lib/services/implementation-plan';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

interface ImplementationPlanProps {
  plan: ImplementationPlan;
}

export function ImplementationPlan({ plan }: ImplementationPlanProps) {
  const [activePhase, setActivePhase] = useState<'short-term' | 'mid-term' | 'long-term'>('short-term');

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'short-term': return 'blue';
      case 'mid-term': return 'purple';
      case 'long-term': return 'green';
      default: return 'blue';
    }
  };

  const renderPhase = (phase: ImplementationPhase) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{phase.timeframe}</h3>
          <p className="text-sm text-muted-foreground">Implementation timeline</p>
        </div>
        <Badge variant="outline" className={`bg-${getPhaseColor(phase.phase)}-500/10`}>
          {phase.phase}
        </Badge>
      </div>

      {phase.goals.map((goal, index) => (
        <Card key={index} className="p-6">
          <h4 className="text-lg font-semibold mb-4">{goal.title}</h4>
          <p className="text-muted-foreground mb-6">{goal.description}</p>

          <div className="space-y-6">
            <div>
              <h5 className="font-medium mb-3">Tasks & Timeline</h5>
              <div className="space-y-4">
                {goal.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-blue-500">{taskIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.task}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.timeline}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {task.resources.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-3">Success Metrics</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goal.metrics.map((metric, metricIndex) => (
                  <Card key={metricIndex} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{metric.metric}</span>
                      <Badge>{metric.target}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{metric.timeline}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Prepare data for charts
  const timelineData = [
    {
      id: 'Implementation Progress',
      data: [
        { x: 'Start', y: 0 },
        { x: '90 Days', y: 30 },
        { x: '180 Days', y: 60 },
        { x: '365 Days', y: 100 }
      ]
    }
  ];

  const budgetData = plan.budgetEstimate.map(item => ({
    category: item.category,
    'Short Term': item.shortTerm,
    'Mid Term': item.midTerm,
    'Long Term': item.longTerm
  }));

  const riskData = plan.risks.map(risk => ({
    risk: risk.risk,
    impact: risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{plan.overview.title}</h2>
          <p className="text-muted-foreground">{plan.overview.description}</p>
        </div>
        <ExportDialog
          data={plan}
          charts={[
            { id: 'timeline-chart', name: 'Implementation Timeline', type: 'line' },
            { id: 'budget-chart', name: 'Budget Allocation', type: 'bar' },
            { id: 'risk-chart', name: 'Risk Assessment', type: 'pie' }
          ]}
          reportId="implementation-plan-report"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">Timeline</h3>
              <p className="text-sm text-muted-foreground">{plan.overview.estimatedTimeline}</p>
            </div>
          </div>
          <Progress value={25} className="h-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium">Objectives</h3>
              <p className="text-sm text-muted-foreground">{plan.overview.objectives.length} Key Goals</p>
            </div>
          </div>
          <Progress value={50} className="h-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium">Resources</h3>
              <p className="text-sm text-muted-foreground">{plan.overview.requiredResources.length} Required</p>
            </div>
          </div>
          <Progress value={75} className="h-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium">Budget</h3>
              <p className="text-sm text-muted-foreground">3 Phase Plan</p>
            </div>
          </div>
          <Progress value={100} className="h-2" />
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Implementation Timeline</h3>
            <div className="h-[300px]">
              <ResponsiveLine
                data={timelineData}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 100 }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Timeline',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Progress (%)',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
              />
            </div>
          </Card>

          <div className="mt-6">
            {plan.phases.map((phase, index) => (
              <div key={index} className="mb-6">
                {renderPhase(phase)}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Allocation</h3>
            <div className="h-[400px]">
              <ResponsiveBar
                data={budgetData}
                keys={['Short Term', 'Mid Term', 'Long Term']}
                indexBy="category"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Category',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Budget ($)',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <ResponsivePie
                  data={riskData.map(risk => ({
                    id: risk.risk,
                    value: risk.impact
                  }))}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'red_yellow_blue' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                />
              </div>
              <div className="space-y-4">
                {plan.risks.map((risk, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        risk.impact === 'high' ? 'bg-red-500/20' :
                        risk.impact === 'medium' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          risk.impact === 'high' ? 'text-red-500' :
                          risk.impact === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{risk.risk}</h4>
                          <Badge variant={
                            risk.impact === 'high' ? 'destructive' :
                            risk.impact === 'medium' ? 'default' :
                            'secondary'
                          }>
                            {risk.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{risk.mitigation}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <div className="space-y-6">
            {plan.milestones.map((milestone, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold">{milestone.title}</h4>
                      <Badge variant="outline">{milestone.timeline}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{milestone.description}</p>
                    <div className="space-y-2">
                      {milestone.criteria.map((criterion, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}