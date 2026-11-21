'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Save, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VOICES } from '@/lib/services/voice';
import { DEFAULT_VOICE_PREFS, loadVoicePrefs, saveVoicePrefs, type VoicePrefs } from '@/lib/local/voice-prefs';
import { loadUsage, type Usage } from '@/lib/client/usage';

const LANGUAGES: [string, string][] = [['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['it', 'Italian']];

/**
 * Voice settings. Only options that change behaviour are offered: the default voice (new podcast segments and audiobook narrator) and
 * the default transcription language. They are saved in this browser. The usage panel shows YOUR real AI usage from the usage log.
 */
export function VoiceSettings() {
  const [prefs, setPrefs] = useState<VoicePrefs>(DEFAULT_VOICE_PREFS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);

  useEffect(() => {
    loadVoicePrefs().then(setPrefs);
    loadUsage().then((u) => { setUsage(u); setUsageLoaded(true); });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try { await saveVoicePrefs(prefs); setSaved(true); } finally { setSaving(false); }
  };
  const voiceCalls = usage ? Object.entries(usage.byFeature).filter(([f]) => /audio|voice|realtime|image/i.test(f)).reduce((n, [, c]) => n + c, 0) : 0;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Settings className="h-5 w-5 text-blue-400" aria-hidden /></div>
        <div>
          <h3 className="font-medium">Voice Settings</h3>
          <p className="text-sm text-muted-foreground">Defaults for the voice studios (saved in this browser)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Default voice</Label>
          <Select value={prefs.voiceId} onValueChange={(v) => setPrefs((p) => ({ ...p, voiceId: v }))}>
            <SelectTrigger aria-label="Default voice"><SelectValue placeholder="Select a voice" /></SelectTrigger>
            <SelectContent><SelectGroup>{VOICES.map((v) => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Used for new podcast segments and as the audiobook narrator.</p>
        </div>
        <div className="space-y-2">
          <Label>Default transcription language</Label>
          <Select value={prefs.language} onValueChange={(v) => setPrefs((p) => ({ ...p, language: v }))}>
            <SelectTrigger aria-label="Default transcription language"><SelectValue placeholder="Select a language" /></SelectTrigger>
            <SelectContent><SelectGroup>{LANGUAGES.map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Pre-selected in the Transcription tab.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save settings</Button>
        {saved && <span role="status" data-testid="voice-settings-saved" className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" aria-hidden />Saved</span>}
      </div>

      <div className="rounded-lg border p-4" data-testid="voice-usage">
        <h4 className="font-medium mb-2">Your AI usage (last 30 days)</h4>
        {!usageLoaded ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : usage ? (
          <p className="text-sm text-muted-foreground">{usage.requests} requests in total{usage.failed ? ` (${usage.failed} failed)` : ''}, {voiceCalls} of them for voice or images. Usage is billed by OpenAI to your own account.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sign in to see your usage. Usage is billed by OpenAI to your own account.</p>
        )}
      </div>
    </Card>
  );
}
