'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, KeyRound, Loader2, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { describeError } from '@/lib/client/ai-error';
import { readJson, requireShape } from '@/lib/client/validate';
import { authFetch, toApiError } from '@/lib/client/auth-fetch';

interface KeyStatus { configured: boolean; last4: string | null; updatedAt: string | null }
interface Access { [slot: string]: { model: string; available: boolean | null } }
interface ModelSettings { overrides: Record<string, string>; defaults: Record<string, string> }

const SLOT_LABELS: Record<string, string> = {
  text: 'Text (Responses)',
  reasoning: 'Heavy reasoning / research',
  image: 'Images',
  transcribe: 'Speech-to-text',
  tts: 'Text-to-speech',
  realtime: 'Live voice'
};

/**
 * Bring-your-own-key settings. The key is sent once over HTTPS to the server, which validates it with OpenAI and stores it
 * encrypted. The browser only ever sees "sk-…••••1234" (last four). The input is cleared after saving and the key is never
 * written to localStorage, cookies or URLs.
 */
export function OpenAIKeySettings({ onStatus }: { onStatus?: (configured: boolean) => void } = {}) {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [models, setModels] = useState<ModelSettings | null>(null);
  const [draftModels, setDraftModels] = useState<Record<string, string>>({});
  const [savingModels, setSavingModels] = useState(false);

  const load = useCallback(async () => {
    try {
      const [k, m] = await Promise.all([authFetch('/api/settings/openai-key'), authFetch('/api/settings/models')]);
      if (k.ok) setStatus(requireShape<KeyStatus>(await readJson(k), ['configured']));
      else setMessage({ kind: 'error', text: (await toApiError(k, 'Could not load key status')).message });
      if (m.ok) {
        const data = requireShape<ModelSettings>(await readJson(m), ['defaults', 'overrides']);
        setModels(data);
        setDraftModels(data.overrides);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: describeError(e).message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (status) onStatus?.(status.configured); }, [status, onStatus]);

  const save = async () => {
    setBusy('save');
    setMessage(null);
    try {
      const res = await authFetch('/api/settings/openai-key', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: input }) });
      if (!res.ok) throw await toApiError(res, 'Could not save the key');
      const data = requireShape<KeyStatus & { warning?: string }>(await readJson(res), ['configured']);
      setStatus(data);
      setAccess(null);
      setMessage({ kind: 'ok', text: data.warning === 'KEY_RESTRICTED' ? 'Key saved. OpenAI would not list models for it, so access could not be checked.' : 'Key validated and saved.' });
    } catch (e: any) {
      setMessage({ kind: 'error', text: describeError(e).message });
    } finally {
      setInput(''); // never keep the key in the page after the request
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setMessage(null);
    try {
      const res = await authFetch('/api/settings/openai-key', { method: 'POST' });
      if (!res.ok) throw await toApiError(res, 'Test failed');
      const data = requireShape<any>(await readJson(res), ['status']);
      setAccess(data.access);
      setMessage(data.status === 'valid' ? { kind: 'ok', text: 'Your key works.' } : data.status === 'invalid' ? { kind: 'error', text: 'OpenAI no longer accepts this key. Replace it below.' } : { kind: 'error', text: 'OpenAI could not confirm this key right now.' });
    } catch (e: any) {
      setMessage({ kind: 'error', text: describeError(e).message });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your OpenAI key? AI features will stop working until you add one again.')) return;
    setBusy('remove');
    setMessage(null);
    try {
      const res = await authFetch('/api/settings/openai-key', { method: 'DELETE' });
      if (!res.ok) throw await toApiError(res, 'Could not remove the key');
      setStatus(requireShape<KeyStatus>(await readJson(res), ['configured']));
      setAccess(null);
      setMessage({ kind: 'ok', text: 'Key removed.' });
    } catch (e: any) {
      setMessage({ kind: 'error', text: describeError(e).message });
    } finally {
      setBusy(null);
    }
  };

  const saveModels = async () => {
    setSavingModels(true);
    setMessage(null);
    try {
      const body: Record<string, string> = {};
      for (const slot of Object.keys(SLOT_LABELS)) body[slot] = (draftModels[slot] ?? '').trim();
      const res = await authFetch('/api/settings/models', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw await toApiError(res, 'Could not save models');
      const data = requireShape<ModelSettings>(await readJson(res), ['defaults', 'overrides']);
      setModels(data);
      setDraftModels(data.overrides);
      setMessage({ kind: 'ok', text: 'Model settings saved.' });
    } catch (e: any) {
      setMessage({ kind: 'error', text: describeError(e).message });
    } finally {
      setSavingModels(false);
    }
  };

  const masked = status?.configured ? `sk-…••••${status.last4}` : null;

  return (
    <div className="space-y-6" id="ai">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center"><KeyRound className="h-5 w-5 text-emerald-400" /></div>
          <div>
            <h3 className="font-medium">OpenAI API key</h3>
            <p className="text-sm text-muted-foreground">AI features use your own OpenAI key, so usage is billed to your OpenAI account.</p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-testid="key-status">
          {status === null ? <Loader2 className="h-4 w-4 animate-spin" /> : status.configured ? (
            <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-sm">Key saved: <code data-testid="key-masked">{masked}</code></span><Badge variant="outline">Encrypted at rest</Badge></>
          ) : (
            <><XCircle className="h-4 w-4 text-amber-500" /><span className="text-sm">No key added yet</span></>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="openai-key">{status?.configured ? 'Replace key' : 'Add key'}</Label>
          <div className="flex gap-2">
            <Input id="openai-key" type="password" autoComplete="off" spellCheck={false} placeholder="sk-…" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button onClick={save} disabled={!input.trim() || busy !== null}>{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate & save'}</Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Checked with OpenAI, then stored encrypted on the server. It is never shown again, only its last four characters.</p>
        </div>

        {status?.configured && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={test} disabled={busy !== null}>{busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Test key</Button>
            <Button variant="outline" size="sm" onClick={remove} disabled={busy !== null}><Trash2 className="h-4 w-4 mr-1" />Remove key</Button>
          </div>
        )}

        {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${message.kind === 'error' ? 'text-red-500' : 'text-green-600'}`} data-testid="key-message">{message.text}{message.kind === 'error' && !status && <> <button type="button" className="underline" onClick={() => { setMessage(null); load(); }}>Try Again</button></>}</p>}

        {access && (
          <ul className="text-sm space-y-1" data-testid="model-access">
            {Object.entries(access).map(([slot, a]) => (
              <li key={slot} className="flex items-center gap-2">
                {a.available === false ? <XCircle className="h-4 w-4 text-red-500" /> : a.available ? <CheckCircle className="h-4 w-4 text-green-500" /> : <span className="h-4 w-4" />}
                <span className="w-48">{SLOT_LABELS[slot]}</span><code>{a.model}</code>
                {a.available === false && <span className="text-red-500">not available on your account</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {models && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-medium">Models</h3>
            <p className="text-sm text-muted-foreground">If your OpenAI account cannot use a default model, enter one it can. Leave blank to use the default.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(SLOT_LABELS).map(([slot, label]) => (
              <div key={slot} className="space-y-1">
                <Label htmlFor={`model-${slot}`}>{label}</Label>
                <Input id={`model-${slot}`} placeholder={models.defaults[slot]} value={draftModels[slot] ?? ''} onChange={(e) => setDraftModels((d) => ({ ...d, [slot]: e.target.value }))} />
              </div>
            ))}
          </div>
          <Button onClick={saveModels} disabled={savingModels}>{savingModels ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Save models</Button>
        </Card>
      )}
    </div>
  );
}
