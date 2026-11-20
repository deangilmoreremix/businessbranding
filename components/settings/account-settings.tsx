'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/auth-provider';
import { authFetch, toApiError } from '@/lib/client/auth-fetch';
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/auth-redirect';
import { DEFAULT_NOTIFICATIONS, DEFAULT_PROFILE, type Notifications, type Profile } from '@/lib/settings-profile';

type Msg = { kind: 'ok' | 'error'; text: string } | null;
const Status = ({ m, id }: { m: Msg; id: string }) => (m ? <p role={m.kind === 'error' ? 'alert' : 'status'} data-testid={id} className={`text-sm ${m.kind === 'error' ? 'text-red-500' : 'text-green-600'}`}>{m.text}</p> : null);

/** Loads and saves profile + notifications through /api/settings/profile. */
function useAccountSettings() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [notifications, setNotifications] = useState<Notifications>(DEFAULT_NOTIFICATIONS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    authFetch('/api/settings/profile')
      .then(async (r) => { if (!r.ok) throw await toApiError(r, 'Could not load your settings'); return r.json(); })
      .then((d) => { setProfile(d.profile); setNotifications(d.notifications); })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoaded(true));
  }, []);
  const save = async (body: object) => {
    const r = await authFetch('/api/settings/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw Object.assign(new Error(body.error || `Could not save (${r.status})`), { fields: body.fields });
    }
    return r.json();
  };
  return { profile, setProfile, notifications, setNotifications, loaded, loadError, save };
}

const saveIcon = (b: boolean) => (b ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />);

export function ProfileCard() {
  const { user } = useAuth();
  const s = useAccountSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => s.setProfile((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    setBusy(true); setMsg(null); setFieldErrors({});
    try { const d = await s.save({ profile: s.profile }); s.setProfile(d.profile); setMsg({ kind: 'ok', text: 'Profile saved.' }); }
    catch (e: any) { setFieldErrors(e.fields ?? {}); setMsg({ kind: 'error', text: e.message }); }
    finally { setBusy(false); }
  };
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
      {s.loadError && <p role="alert" className="text-sm text-red-500 mb-4" data-testid="settings-load-error">{s.loadError}</p>}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="p-first">First name</Label><Input id="p-first" value={s.profile.firstName} onChange={set('firstName')} /></div>
          <div className="space-y-2"><Label htmlFor="p-last">Last name</Label><Input id="p-last" value={s.profile.lastName} onChange={set('lastName')} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="p-email">Email</Label><Input id="p-email" type="email" value={user?.email ?? ''} readOnly disabled /><p className="text-xs text-muted-foreground">Your sign-in address. Changing it is not supported yet.</p></div>
        <div className="space-y-2"><Label htmlFor="p-company">Company</Label><Input id="p-company" value={s.profile.company} onChange={set('company')} /></div>
        <div className="space-y-2"><Label htmlFor="p-website">Website</Label><Input id="p-website" type="url" placeholder="https://example.com" value={s.profile.website} onChange={set('website')} aria-invalid={!!fieldErrors.website} />{fieldErrors.website && <p role="alert" className="text-sm text-red-500">{fieldErrors.website}</p>}</div>
        <Button onClick={save} disabled={busy || !s.loaded}>{saveIcon(busy)}Save changes</Button>
        <Status m={msg} id="profile-status" />
      </div>
    </Card>
  );
}

export function NotificationsCard() {
  const s = useAccountSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const toggle = (k: keyof Notifications) => (v: boolean) => s.setNotifications((n) => ({ ...n, [k]: v }));
  const save = async () => {
    setBusy(true); setMsg(null);
    try { const d = await s.save({ notifications: s.notifications }); s.setNotifications(d.notifications); setMsg({ kind: 'ok', text: 'Notification preferences saved.' }); }
    catch (e: any) { setMsg({ kind: 'error', text: e.message }); }
    finally { setBusy(false); }
  };
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Notification Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">These choices are stored in your account. This app does not send e-mail yet, so they take effect once e-mail notifications are switched on.</p>
      <div className="space-y-6">
        {([['productUpdates', 'Product updates', 'News about features and improvements'], ['brandAlerts', 'Brand alerts', 'Changes to your brand analyses'], ['securityAlerts', 'Security alerts', 'Sign-in and account activity'], ['marketing', 'Marketing e-mails', 'Offers and tips']] as const).map(([k, title, desc]) => (
          <div key={k} className="flex items-center justify-between">
            <div><Label htmlFor={`n-${k}`}>{title}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
            <Switch id={`n-${k}`} checked={s.notifications[k]} onCheckedChange={toggle(k)} />
          </div>
        ))}
        <Button onClick={save} disabled={busy || !s.loaded}>{saveIcon(busy)}Save preferences</Button>
        <Status m={msg} id="notifications-status" />
      </div>
    </Card>
  );
}

export function SecurityCard() {
  const { user, signIn, updatePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const submit = async () => {
    setMsg(null);
    const weak = validatePassword(next);
    if (weak) return setMsg({ kind: 'error', text: weak });
    if (next !== confirm) return setMsg({ kind: 'error', text: 'The new passwords do not match.' });
    if (next === current) return setMsg({ kind: 'error', text: 'Choose a password different from the current one.' });
    if (!user?.email) return setMsg({ kind: 'error', text: 'Sign in to change your password.' });
    setBusy(true);
    try {
      await signIn(user.email, current); // proves the current password
    } catch {
      setBusy(false);
      return setMsg({ kind: 'error', text: 'The current password is not correct.' });
    }
    try {
      await updatePassword(next);
      setCurrent(''); setNext(''); setConfirm('');
      setMsg({ kind: 'ok', text: 'Password updated.' });
    } catch (e: any) {
      setMsg({ kind: 'error', text: e?.message || 'Could not update the password.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
      <div className="space-y-4">
        <div className="space-y-2"><Label htmlFor="s-current">Current password</Label><Input id="s-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="s-new">New password</Label><Input id="s-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /><p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p></div>
        <div className="space-y-2"><Label htmlFor="s-confirm">Confirm new password</Label><Input id="s-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button onClick={submit} disabled={busy || !current || !next}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Update password</Button>
        <Status m={msg} id="security-status" />
        <p className="text-xs text-muted-foreground">Two-factor authentication is not available yet.</p>
      </div>
    </Card>
  );
}

export function BillingNote() {
  return (
    <Card className="p-6" data-testid="billing-note">
      <h2 className="text-xl font-semibold mb-3">Billing</h2>
      <p className="text-sm text-muted-foreground">There is nothing to pay for in this app and it never asks for card details. AI features run on <strong>your own OpenAI API key</strong> (Settings &rarr; OpenAI), so usage is billed by OpenAI directly to your OpenAI account.</p>
    </Card>
  );
}
