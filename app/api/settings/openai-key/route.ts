import { NextResponse } from 'next/server';
import { checkOpenAIKey, effectiveModels, getEnv, hasModel } from '@/lib/openai';
import { aadFor, deleteKeyRow, encryptSecret, getKeyRow, last4Of, readUserKey, upsertKeyRow, withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

/**
 * Manage the signed-in user's OpenAI API key (bring-your-own-key).
 *  GET     -> { configured, last4, updatedAt }            (status only; the key and ciphertext are never returned)
 *  PUT     { apiKey } -> validate with GET /v1/models, encrypt (AES-256-GCM) and store
 *  POST    -> re-test the stored key -> { status, access }
 *  DELETE  -> remove the key
 * The key is only ever sent over HTTPS in the PUT body; it is not logged, returned, placed in a URL or kept in localStorage.
 */
const KEY_SHAPE = /^[A-Za-z0-9_\-.]{20,300}$/;

const status = (row: { last4: string; updated_at: string } | null) => ({ configured: !!row, last4: row?.last4 ?? null, updatedAt: row?.updated_at ?? null });

export async function GET(request: Request) {
  return withUser(request, { bucket: 'settings', limit: 60, requireKey: false }, async (ctx) => NextResponse.json(status(await getKeyRow(ctx.userId))));
}

export async function PUT(request: Request) {
  return withUser(request, { bucket: 'settings-write', limit: 10, requireKey: false }, async (ctx) => {
    const body = await request.json();
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!KEY_SHAPE.test(apiKey)) {
      return NextResponse.json({ error: 'That does not look like an OpenAI API key. Paste the full key (it usually starts with "sk-").', code: 'INVALID_KEY_FORMAT' }, { status: 400 });
    }

    const check = await checkOpenAIKey(apiKey);
    if (check.status === 'invalid') {
      return NextResponse.json({ error: 'OpenAI rejected this key. Check that you copied it correctly and that it has not been revoked.', code: 'OPENAI_KEY_INVALID' }, { status: 422 });
    }
    if (check.status === 'unreachable') {
      return NextResponse.json({ error: 'Could not reach OpenAI to verify the key. Try again in a moment.', code: 'OPENAI_UNAVAILABLE' }, { status: 502 });
    }

    const encrypted = await encryptSecret(apiKey, getEnv('KEY_ENCRYPTION_SECRET'), aadFor(ctx.userId, 'openai'));
    await upsertKeyRow(ctx.userId, { ...encrypted, last4: last4Of(apiKey) });
    return NextResponse.json({ ...status(await getKeyRow(ctx.userId)), validated: check.status === 'valid', warning: check.status === 'restricted' ? 'KEY_RESTRICTED' : undefined });
  });
}

export async function POST(request: Request) {
  return withUser(request, { bucket: 'settings-test', limit: 10, requireKey: true }, async (ctx) => {
    const key = await readUserKey(ctx.userId);
    const check = await checkOpenAIKey(key ?? '');
    const models = effectiveModels();
    const access = Object.fromEntries(Object.entries(models).map(([slot, id]) => [slot, { model: id, available: hasModel(check.modelIds, id) }]));
    return NextResponse.json({ status: check.status, access });
  });
}

export async function DELETE(request: Request) {
  return withUser(request, { bucket: 'settings-write', limit: 10, requireKey: false }, async (ctx) => {
    await deleteKeyRow(ctx.userId);
    return NextResponse.json(status(null));
  });
}

