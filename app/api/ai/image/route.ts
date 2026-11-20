import { NextResponse } from 'next/server';
import { editImage, generateImage, MODELS, type ImageOptions } from '@/lib/openai';
import { withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

const SIZES = /^(auto|\d{3,4}x\d{3,4})$/;
const QUALITIES = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'auto']);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Reject URLs that point at private/loopback hosts (basic SSRF guard for reference-image fetches). */
function isPublicHttps(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === '::1' || h.startsWith('[')) return false;
    return true;
  } catch {
    return false;
  }
}

async function loadReference(ref: string): Promise<{ data: Uint8Array; mime: string }> {
  const dataUrl = ref.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (dataUrl) {
    const data = Uint8Array.from(Buffer.from(dataUrl[2], 'base64'));
    if (data.byteLength > MAX_IMAGE_BYTES) throw new Error('Reference image too large');
    return { data, mime: dataUrl[1] };
  }
  if (!isPublicHttps(ref)) throw new Error('Reference image must be a data URL or a public https URL');
  const res = await fetch(ref, { redirect: 'error' });
  const mime = (res.headers.get('content-type') || '').split(';')[0];
  if (!res.ok || !/^image\/(png|jpeg|webp)$/.test(mime)) throw new Error('Reference image could not be loaded (png, jpeg or webp required)');
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error('Reference image too large');
  return { data: buf, mime };
}

/**
 * POST { prompt, referenceImages?, size?, quality?, complexity?, background?, fast?, n? } -> { images: dataUrl[] }
 * Without referenceImages: Images API generation. With them: Images API edit (logo/asset variations).
 */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'image', limit: 10 }, async () => {
    const body = await request.json();
    const { prompt, referenceImages } = body;
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      return NextResponse.json({ error: 'A prompt (max 4000 chars) is required' }, { status: 400 });
    }

    const opts: ImageOptions = {
      prompt,
      model: body.fast ? MODELS.imageFast : undefined,
      size: typeof body.size === 'string' && SIZES.test(body.size) ? body.size : '1024x1024',
      quality: QUALITIES.has(body.quality) ? body.quality : undefined,
      complexity: ['low', 'medium', 'high'].includes(body.complexity) ? body.complexity : undefined,
      background: ['transparent', 'opaque', 'auto'].includes(body.background) ? body.background : undefined,
      outputFormat: body.background === 'transparent' ? 'png' : undefined,
      n: Math.min(Math.max(Number(body.n) || 1, 1), 4)
    };

    const refs: string[] = Array.isArray(referenceImages) ? referenceImages.filter((r) => typeof r === 'string').slice(0, 4) : [];
    let loaded: Awaited<ReturnType<typeof loadReference>>[] = [];
    try {
      loaded = await Promise.all(refs.map(loadReference));
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Reference image could not be loaded', code: 'BAD_REFERENCE_IMAGE' }, { status: 400 });
    }
    const images = loaded.length ? await editImage({ ...opts, images: loaded }) : await generateImage(opts);

    return NextResponse.json({ images: images.map((i) => i.dataUrl) });
  });
}
