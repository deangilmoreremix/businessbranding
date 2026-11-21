'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ElapsedStatus } from '@/components/elapsed-status';
import { describeError } from '@/lib/client/ai-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  Globe, 
  Target, 
  Brain,
  Loader2,
  Download,
  RefreshCw,
  Settings,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { downloadICalendar, generateSmartSchedule, optimizeSchedule, type SmartScheduleOptions, type CalendarEvent } from '@/lib/services/calendar-service';

interface ScheduleModelsProps {
  /** Called whenever the generated or optimized schedule changes (e.g. to show it in the calendar). */
  onScheduleChange?: (events: CalendarEvent[]) => void;
}

export function ScheduleModels({ onScheduleChange }: ScheduleModelsProps = {}) {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [schedule, setSchedule] = useState<CalendarEvent[]>([]);
  const [options, setOptions] = useState<SmartScheduleOptions>({
    businessGoals: [],
    teamSize: 5,
    timeline: '3 months',
    preferences: {
      workingHours: ['9:00', '17:00'],
      timezone: 'UTC',
      excludedDays: ['Saturday', 'Sunday']
    }
  });

  const [error, setError] = useState<string | null>(null);


  const handleGenerateSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const generatedSchedule = await generateSmartSchedule(options);
      setSchedule(generatedSchedule);
      onScheduleChange?.(generatedSchedule);
    } catch (e) {
      setError(`Could not generate the schedule. ${describeError(e).message} You can try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSchedule = async () => {
    setOptimizing(true);
    setError(null);
    try {
      const optimizedSchedule = await optimizeSchedule(schedule, options.preferences?.excludedDays);
      setSchedule(optimizedSchedule);
      onScheduleChange?.(optimizedSchedule);
    } catch (e) {
      setError(`Could not optimize the schedule. ${describeError(e).message} You can try again.`);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Smart Schedule Generation</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered implementation schedule planning
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Goals</Label>
                <Input
                  placeholder="Enter a business goal and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        setOptions(prev => ({
                          ...prev,
                          businessGoals: [...prev.businessGoals, input.value.trim()]
                        }));
                        input.value = '';
                      }
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {options.businessGoals.map((goal, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setOptions(prev => ({
                          ...prev,
                          businessGoals: prev.businessGoals.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      {goal}
                      <span className="ml-2">×</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Team Size</Label>
                <Input
                  type="number"
                  min={1}
                  value={options.teamSize}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    teamSize: Number.isFinite(parseInt(e.target.value)) && parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Timeline</Label>
                <Select
                  value={options.timeline}
                  onValueChange={(value) => setOptions(prev => ({
                    ...prev,
                    timeline: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 month">1 Month</SelectItem>
                    <SelectItem value="3 months">3 Months</SelectItem>
                    <SelectItem value="6 months">6 Months</SelectItem>
                    <SelectItem value="1 year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    value={options.preferences?.workingHours?.[0]}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        workingHours: [e.target.value, prev.preferences?.workingHours?.[1] || '17:00']
                      }
                    }))}
                  />
                  <Input
                    type="time"
                    value={options.preferences?.workingHours?.[1]}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        workingHours: [prev.preferences?.workingHours?.[0] || '09:00', e.target.value]
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={options.preferences?.timezone}
                  onValueChange={(value) => setOptions(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      timezone: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Excluded Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Badge
                      key={day}
                      variant={options.preferences?.excludedDays?.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setOptions(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            excludedDays: prev.preferences?.excludedDays?.includes(day)
                              ? prev.preferences.excludedDays.filter(d => d !== day)
                              : [...(prev.preferences?.excludedDays || []), day]
                          }
                        }));
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerateSchedule}
            disabled={loading || options.businessGoals.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Smart Schedule
              </>
            )}
          </Button>

          <ElapsedStatus active={loading || optimizing} label={optimizing ? 'Optimizing…' : 'Generating schedule…'} />
          {error && <p role="alert" data-testid="schedule-error" className="text-sm text-red-600">{error}</p>}
        </div>
      </Card>

      {schedule.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Generated Schedule</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleOptimizeSchedule}
                disabled={optimizing}
              >
                {optimizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Optimize</span>
              </Button>
              <Button variant="outline" disabled={schedule.length === 0} onClick={() => downloadICalendar(schedule, 'smart-schedule.ics')}>
                <Download className="h-4 w-4 mr-2" />
                Export (.ics)
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {schedule.map((event, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg bg-${
                    event.priority === 'high' ? 'red' :
                    event.priority === 'medium' ? 'yellow' :
                    'green'
                  }-500/20 flex items-center justify-center`}>
                    <CalendarIcon className={`h-5 w-5 text-${
                      event.priority === 'high' ? 'red' :
                      event.priority === 'medium' ? 'yellow' :
                      'green'
                    }-400`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <Badge>{event.category}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(event.start, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{event.metadata?.resources?.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{event.metadata?.objectives?.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}