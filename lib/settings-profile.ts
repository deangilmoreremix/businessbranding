/** Profile + notification preferences stored in user_settings.settings (owner-only; written by /api/settings/profile). */

export interface Profile { firstName: string; lastName: string; company: string; website: string }
export interface Notifications { productUpdates: boolean; brandAlerts: boolean; securityAlerts: boolean; marketing: boolean }

export const DEFAULT_PROFILE: Profile = { firstName: '', lastName: '', company: '', website: '' };
export const DEFAULT_NOTIFICATIONS: Notifications = { productUpdates: true, brandAlerts: true, securityAlerts: true, marketing: false };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');

export function validateWebsite(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' ? null : 'Use an http(s) address.';
  } catch {
    return 'Enter a full address such as https://example.com.';
  }
}

/** Clean untrusted profile input. Returns the clean object and per-field errors. */
export function cleanProfile(input: unknown): { value: Profile; errors: Partial<Record<keyof Profile, string>> } {
  const i = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const value: Profile = { firstName: text(i.firstName, 100), lastName: text(i.lastName, 100), company: text(i.company, 200), website: text(i.website, 300) };
  const errors: Partial<Record<keyof Profile, string>> = {};
  const w = validateWebsite(value.website);
  if (w) errors.website = w;
  return { value, errors };
}

export function cleanNotifications(input: unknown): Notifications {
  const i = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const b = (k: keyof Notifications) => (typeof i[k] === 'boolean' ? (i[k] as boolean) : DEFAULT_NOTIFICATIONS[k]);
  return { productUpdates: b('productUpdates'), brandAlerts: b('brandAlerts'), securityAlerts: b('securityAlerts'), marketing: b('marketing') };
}
