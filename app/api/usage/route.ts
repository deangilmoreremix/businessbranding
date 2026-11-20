import { NextResponse } from 'next/server';
import { getUsageSummary, withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

/** GET -> the signed-in user's own AI usage for the last 30 days, aggregated from key-free `ai_usage_log` rows. */
export async function GET(request: Request) {
  return withUser(request, { bucket: 'usage', limit: 60, requireKey: false }, async (ctx) => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    return NextResponse.json(await getUsageSummary(ctx.userId, since));
  });
}
