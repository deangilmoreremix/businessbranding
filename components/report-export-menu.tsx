'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadBlob, exportReport, type ReportFormat, type ReportModel } from '@/lib/report-export';

type Format = ReportFormat | 'ics';
const LABELS: Record<Format, string> = { pdf: 'PDF', excel: 'Excel (.xlsx)', word: 'Word (.docx)', ics: 'Calendar (.ics)' };

interface Props {
  /** Sections the user can choose from. */
  sections: readonly { id: string; label: string }[];
  /** Build the report from the REAL data for the chosen sections. */
  buildModel: (sectionIds: string[]) => ReportModel;
  formats?: Format[];
  /** Required when `formats` includes 'ics': returns the .ics text for the real plan. */
  buildIcs?: () => string;
  filenameBase: string;
  buttonLabel?: string;
}

/** Real exports (PDF, Excel, Word, optionally iCalendar) of real data with the sections the user picks. Failures are shown, never swallowed. */
export function ReportExportMenu({ sections, buildModel, formats = ['pdf', 'excel', 'word'], buildIcs, filenameBase, buttonLabel = 'Export' }: Props) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>(formats[0]);
  const [chosen, setChosen] = useState<string[]>(sections.map((s) => s.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    if (format !== 'ics' && chosen.length === 0) { setError('Select at least one section to export.'); return; }
    setBusy(true);
    try {
      if (format === 'ics') {
        if (!buildIcs) throw new Error('Calendar export is not available here.');
        const ics = buildIcs();
        if (!/BEGIN:VEVENT/.test(ics)) throw new Error('There are no scheduled tasks to put in a calendar file.');
        downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `${filenameBase}.ics`);
      } else {
        const { blob, filename } = await exportReport(format, buildModel(chosen), filenameBase);
        downloadBlob(blob, filename);
      }
      setOpen(false);
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`export-open-${filenameBase}`}><Download className="h-4 w-4 mr-2" />{buttonLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>Downloads a file built from the data on this page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div role="radiogroup" aria-label="Format" className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <Button key={f} type="button" role="radio" aria-checked={format === f} variant={format === f ? 'default' : 'outline'} size="sm" onClick={() => setFormat(f)}>{LABELS[f]}</Button>
            ))}
          </div>
          {format !== 'ics' && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-2">Sections</legend>
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" checked={chosen.includes(s.id)} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, s.id] : c.filter((x) => x !== s.id)))} />
                  {s.label}
                </label>
              ))}
            </fieldset>
          )}
          {error && <p role="alert" data-testid="export-error" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <Button type="button" onClick={run} disabled={busy} data-testid="export-run">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
