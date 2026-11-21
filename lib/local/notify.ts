/**
 * Notifications API helpers for finished background jobs (e.g. deep research).
 * Feature-detected; the permission prompt is only shown from an explicit user action.
 */
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/** Ask for permission (call from a click handler). Resolves to the final state. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a notification if allowed. Returns whether one was shown. Skips when the tab is already focused. */
export function notify(title: string, body: string, opts: { onlyWhenHidden?: boolean; onClick?: () => void } = {}): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  if ((opts.onlyWhenHidden ?? true) && typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) return false;
  try {
    const n = new Notification(title, { body });
    if (opts.onClick) n.onclick = () => { window.focus(); opts.onClick?.(); n.close(); };
    return true;
  } catch {
    return false; // some mobile browsers require a service worker for notifications
  }
}
