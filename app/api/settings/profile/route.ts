import { NextResponse } from 'next/server';
import { getSettings, saveSettings, withUser } from '@/lib/server/user';
import { cleanNotifications, cleanProfile, DEFAULT_NOTIFICATIONS, DEFAULT_PROFILE } from '@/lib/settings-profile';

export const runtime = 'nodejs';

/**
 * Profile and notification preferences of the signed-in user (stored in user_settings.settings, owner-only).
 *  GET -> { profile, notifications }
 *  PUT { profile?, notifications? } -> the saved values; invalid input -> 400 with per-field errors
 */
export async function GET(request: Request) {
  return withUser(request, { bucket: 'settings', limit: 60, requireKey: false }, async (ctx) => {
    const s: any = await getSettings(ctx.userId);
    return NextResponse.json({ profile: { ...DEFAULT_PROFILE, ...cleanProfile(s.profile).value }, notifications: s.notifications ? cleanNotifications(s.notifications) : DEFAULT_NOTIFICATIONS });
  });
}

export async function PUT(request: Request) {
  return withUser(request, { bucket: 'settings-write', limit: 20, requireKey: false }, async (ctx) => {
    const body = await request.json();
    const current: any = await getSettings(ctx.userId);
    const next = { ...current };
    if (body && 'profile' in body) {
      const { value, errors } = cleanProfile(body.profile);
      if (Object.keys(errors).length) return NextResponse.json({ error: 'Please check the highlighted fields.', code: 'VALIDATION', fields: errors }, { status: 400 });
      next.profile = value;
    }
    if (body && 'notifications' in body) next.notifications = cleanNotifications(body.notifications);
    await saveSettings(ctx.userId, next);
    return NextResponse.json({ profile: { ...DEFAULT_PROFILE, ...cleanProfile(next.profile).value }, notifications: next.notifications ? cleanNotifications(next.notifications) : DEFAULT_NOTIFICATIONS });
  });
}
