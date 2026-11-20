import { transformImage as recraftTransform } from './recraft';

/**
 * Brand image generation and edits via the OpenAI Images API (through /api/ai/image; the key stays on the server).
 *  - generateBrandImages: text -> image (new logo / asset concepts)
 *  - transformImage: edit an existing image into variations (drop-in replacement for the Recraft transform)
 */

export interface ImageRequestOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  quality?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | 'auto';
  complexity?: 'low' | 'medium' | 'high';
  background?: 'transparent' | 'opaque' | 'auto';
  /** Use the fast model (gpt-image-2.6-flare) for drafts. */
  fast?: boolean;
  n?: number;
}

class ImageNotConfiguredError extends Error {}

async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  // Local previews are blob: URLs the server cannot fetch, so inline them.
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function requestImages(body: Record<string, unknown>): Promise<string[]> {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.status === 503) throw new ImageNotConfiguredError('OPENAI_API_KEY is not configured');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Image request failed (${res.status})`);
  return data.images as string[];
}

export async function generateBrandImages(prompt: string, options: ImageRequestOptions = {}): Promise<{ images: string[] }> {
  return { images: await requestImages({ prompt, ...options }) };
}

/** Edit/transform a reference image. Falls back to the Recraft demo/provider when OpenAI is not configured. */
export async function transformImage(imageUrl: string, prompt: string, style?: string, options: ImageRequestOptions = {}): Promise<{ images: string[] }> {
  try {
    const reference = await toDataUrl(imageUrl);
    const styled = style ? `${prompt}\n\nStyle: ${style}` : prompt;
    return { images: await requestImages({ prompt: styled, referenceImages: [reference], n: 2, ...options }) };
  } catch (error) {
    if (error instanceof ImageNotConfiguredError) return recraftTransform(imageUrl, prompt, style);
    throw error;
  }
}

/** Text-only generation with the same Recraft fallback behaviour. */
export async function generateOrTransform(imageUrl: string | undefined, prompt: string, style?: string): Promise<{ images: string[] }> {
  if (imageUrl) return transformImage(imageUrl, prompt, style);
  try {
    return await generateBrandImages(prompt + (style ? `\n\nStyle: ${style}` : ''), { n: 2 });
  } catch (error) {
    if (error instanceof ImageNotConfiguredError) return recraftTransform('', prompt, style);
    throw error;
  }
}
