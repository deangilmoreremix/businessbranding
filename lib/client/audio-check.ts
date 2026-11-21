import { UnreadableResponseError } from '@/lib/client/validate';

const startsWith = (b: Uint8Array, s: string, at = 0) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));

/** True when the bytes look like a real audio container (WAV/RIFF, MP3/ID3 or frame sync, Ogg, FLAC, WebM/EBML, MP4). */
export function looksLikeAudio(head: Uint8Array): boolean {
  if (head.length < 12) return false;
  return (startsWith(head, 'RIFF') && startsWith(head, 'WAVE', 8)) || startsWith(head, 'ID3') || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) ||
    startsWith(head, 'OggS') || startsWith(head, 'fLaC') || (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) || startsWith(head, 'ftyp', 4);
}

/** Accept a Response as audio only when Content-Type is audio/* AND the bytes have an audio header; otherwise throw "unreadable". */
export async function acceptAudio(res: Response): Promise<Blob> {
  const type = (res.headers.get('Content-Type') || '').toLowerCase();
  if (!type.startsWith('audio/')) throw new UnreadableResponseError('The service did not return audio.');
  const blob = await res.blob();
  if (blob.size < 64 || !looksLikeAudio(new Uint8Array(await blob.slice(0, 16).arrayBuffer()))) throw new UnreadableResponseError('The service did not return playable audio.');
  return blob;
}

/** Same check for a data: URL returned inside JSON. */
export async function acceptAudioDataUrl(url: unknown): Promise<string> {
  if (typeof url !== 'string' || !/^data:audio\/[\w.+-]+;base64,/.test(url)) throw new UnreadableResponseError('The service did not return audio.');
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1, url.indexOf(',') + 33).replace(/[^A-Za-z0-9+/=]/g, '').slice(0, 32)), (c) => c.charCodeAt(0));
  if (!looksLikeAudio(bytes)) throw new UnreadableResponseError('The service did not return playable audio.');
  return url;
}
