import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { downloadICalendar } from '@/lib/services/calendar-service';
import type { CalendarEvent } from '@/lib/services/calendar-service';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const handleExportCalendar = useCallback(() => {
    downloadICalendar(events);
  }, [events]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#3B82F6';
    
    switch (event.priority) {
      case 'high':
        backgroundColor = '#EF4444';
        break;
      case 'medium':
        backgroundColor = '#F59E0B';
        break;
      case 'low':
        backgroundColor = '#10B981';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block'
      }
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Implementation Calendar</h2>
          <p className="text-muted-foreground">
            View and manage your implementation timeline
          </p>
        </div>
        <Button onClick={handleExportCalendar}>
          <Download className="mr-2 h-4 w-4" />
          Export Calendar
        </Button>
      </div>

      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView: any) => setView(newView)}
          eventPropGetter={eventStyleGetter}
          tooltipAccessor={event => `${event.title}\n${event.description}`}
          popup
          selectable
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-red-500">High Priority</Badge>
          <Badge variant="default" className="bg-amber-500">Medium Priority</Badge>
          <Badge variant="default" className="bg-green-500">Low Priority</Badge>
        </div>
      </div>
    </Card>
  );
}