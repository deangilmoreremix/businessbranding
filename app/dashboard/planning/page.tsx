'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarPlus, Loader2, Sparkles } from 'lucide-react';
import { ScheduleModels } from '@/components/schedule-models';

// Charts and the calendar are large; load them only when the plan or calendar is shown.
const ImplementationPlan = dynamic(() => import('@/components/implementation-plan').then((m) => m.ImplementationPlan), { ssr: false, loading: () => null });
const CalendarView = dynamic(() => import('@/components/calendar-view').then((m) => m.CalendarView), { ssr: false, loading: () => null });
import { ErrorState } from '@/components/brand-analysis/error-state';
import { generateImplementationPlan, planToEvents, type ImplementationPlan as Plan } from '@/lib/services/implementation-plan';
import type { CalendarEvent } from '@/lib/services/calendar-service';
import { useLocalDraft } from '@/lib/local/use-draft';

/**
 * Planning workspace: generate an implementation plan, build a smart schedule, and see everything on a calendar
 * (exportable as .ics). The plan and form are kept locally (IndexedDB).
 */
export default function PlanningPage() {
  const [tab, setTab] = useState('plan');
  const [description, setDescription] = useLocalDraft('planning:description', '');
  const [goals, setGoals] = useLocalDraft('planning:goals', '');
  const [budget, setBudget] = useLocalDraft('planning:budget', '');
  const [timeline, setTimeline] = useLocalDraft('planning:timeline', '12 months');
  const [plan, setPlan] = useLocalDraft<Plan | null>('planning:plan', null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setPlan(await generateImplementationPlan({ businessDescription: description, goals: goals.split('\n').map((g) => g.trim()).filter(Boolean), budget, timeline }));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  // The plan's milestones always appear on the calendar (also after a reload, when the plan is restored from local storage).
  useEffect(() => {
    if (plan && events.length === 0) setEvents(planToEvents(plan));
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCalendar = () => {
    if (!plan) return;
    setEvents(planToEvents(plan));
    setTab('calendar');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Badge className="mb-2">PLANNING</Badge>
          <h1 className="text-3xl font-bold gradient-text">Implementation Planning</h1>
          <p className="text-muted-foreground mt-1">Turn your brand strategy into a phased plan, a schedule and a calendar.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="schedule">Smart schedule</TabsTrigger>
            <TabsTrigger value="calendar">Calendar{events.length ? ` (${events.length})` : ''}</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-desc">About your business</Label>
                <Textarea id="plan-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A small-batch coffee roaster launching an online store…" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="plan-goals">Goals (one per line)</Label>
                  <Textarea id="plan-goals" rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-budget">Budget</Label>
                  <Input id="plan-budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$25,000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-timeline">Timeline</Label>
                  <Input id="plan-timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generate} disabled={loading || !description.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate plan
                </Button>
                {plan && (
                  <Button variant="outline" onClick={addToCalendar}>
                    <CalendarPlus className="h-4 w-4 mr-2" />Open on calendar{events.length ? ` (${events.length})` : ''}
                  </Button>
                )}
              </div>
              {plan && events.length > 0 && <p className="text-sm text-muted-foreground" data-testid="plan-on-calendar">{events.length} plan events were added to the Calendar tab, where you can export them as an .ics file.</p>}
              {error != null && <ErrorState error={error} onRetry={generate} title="Could not generate the plan" />}
            </Card>
            {plan && <ImplementationPlan plan={plan} />}
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleModels onScheduleChange={setEvents} />
          </TabsContent>

          <TabsContent value="calendar">
            {events.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">Generate a plan or a schedule first, then it appears here.</Card>
            ) : (
              <CalendarView events={events} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
