'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Search } from 'lucide-react';
import { startResearch, pollResearch } from '@/lib/services/deep-research';
import { deleteDraft, loadDraft, saveDraft } from '@/lib/local/store';
import { notificationPermission, notify, requestNotificationPermission } from '@/lib/local/notify';

interface Job { id: string; kind: 'competitors'; industry: string }
interface Result {
  data: {
    recommendations?: { recommendation: string; priority?: string; timeframe?: string }[];
    opportunities?: { opportunity: string; description?: string }[];
    threats?: { threat: string; description?: string }[];
  };
  citations: { url: string; title?: string }[];
}

const JOB_KEY = 'research:job';

/**
 * Deep competitor research as an OpenAI background job (high reasoning + web search). It keeps running if you leave the
 * tab: the job id is stored locally and polling resumes on return, and a browser notification announces completion.
 */
export default function DeepResearchPanel({ industry }: { industry: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState<ReturnType<typeof notificationPermission>>('default');
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  const track = useCallback(async (job: Job) => {
    setRunning(true);
    setError('');
    setElapsed(0);
    const startedAt = Date.now();
    timer.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    try {
      const res = await pollResearch<Result['data']>('competitors', job.id, { intervalMs: 4000, timeoutMs: 15 * 60_000 });
      if (!alive.current) return;
      setResult(res);
      notify('Deep research finished', `Competitor research for ${job.industry} is ready.`);
    } catch (e: any) {
      if (alive.current) setError(e.message || 'Research failed');
    } finally {
      if (timer.current) clearInterval(timer.current);
      await deleteDraft(JOB_KEY);
      if (alive.current) setRunning(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    setPermission(notificationPermission());
    loadDraft<Job>(JOB_KEY).then((job) => { if (job && alive.current) track(job); });
    return () => { alive.current = false; if (timer.current) clearInterval(timer.current); };
  }, [track]);

  const begin = async () => {
    setResult(null);
    setError('');
    try {
      const { id } = await startResearch('competitors', industry);
      const job: Job = { id, kind: 'competitors', industry };
      await saveDraft(JOB_KEY, job);
      track(job);
    } catch (e: any) {
      setError(e.message || 'Could not start research');
    }
  };

  return (
    <div className="mx-6 mb-4 rounded border p-4 space-y-3" data-testid="deep-research">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={begin} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          {running ? `Researching… ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}` : 'Run deep research'}
        </Button>
        {permission !== 'unsupported' && permission !== 'granted' && (
          <Button size="sm" variant="outline" disabled={permission === 'denied'} onClick={async () => setPermission(await requestNotificationPermission())}>
            {permission === 'denied' ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
            {permission === 'denied' ? 'Notifications blocked' : 'Notify me when done'}
          </Button>
        )}
        {permission === 'granted' && <span className="text-xs text-muted-foreground">You will be notified when it finishes.</span>}
      </div>
      <p className="text-xs text-muted-foreground">Researches the live web for {industry}. This can take several minutes; you can keep working.</p>
      {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
      {result && (
        <div className="space-y-3 text-sm">
          {result.data.recommendations?.length ? (
            <List title="Recommendations" items={result.data.recommendations.map((r) => `${r.recommendation}${r.priority ? ` (${r.priority}${r.timeframe ? `, ${r.timeframe}` : ''})` : ''}`)} />
          ) : null}
          {result.data.opportunities?.length ? <List title="Opportunities" items={result.data.opportunities.map((o) => `${o.opportunity}${o.description ? `: ${o.description}` : ''}`)} /> : null}
          {result.data.threats?.length ? <List title="Threats" items={result.data.threats.map((t) => `${t.threat}${t.description ? `: ${t.description}` : ''}`)} /> : null}
          {result.citations.length > 0 && (
            <div>
              <p className="font-medium">Sources</p>
              <ul className="list-disc pl-5">
                {result.citations.map((c) => (
                  <li key={c.url}><a className="underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.title || c.url}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="list-disc pl-5">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
    </div>
  );
}
