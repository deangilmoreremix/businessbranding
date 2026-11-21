import { createContentItem, DataError } from '@/lib/supabase';
import { putAsset } from '@/lib/local/store';

export interface SavedAudio {
  /** Kept on this device (IndexedDB): always attempted first, this is what makes the item playable again. */
  local: boolean;
  /** A metadata row was also stored in the signed-in user's account. */
  cloud: boolean;
  /** Why the account copy was not stored (not signed in, no database ...). */
  cloudReason?: string;
}

/**
 * Save generated/recorded audio. The audio itself lives in the browser's IndexedDB (a blob: URL is meaningless after a reload and the
 * app has no file hosting); the signed-in user's account gets a metadata row. Never throws: the caller shows the returned status.
 */
export async function saveGeneratedAudio(input: { title: string; type: 'podcast' | 'audiobook' | 'voice_over'; blob: Blob; durationSec: number; metadata?: Record<string, unknown> }): Promise<SavedAudio> {
  const result: SavedAudio = { local: false, cloud: false };
  let localId: string | undefined;
  try {
    localId = await putAsset({ blob: input.blob, name: input.title, kind: 'audio', meta: { contentType: input.type, durationSec: input.durationSec, ...input.metadata } });
    result.local = true;
  } catch {
    /* storage full or unavailable */
  }
  try {
    await createContentItem({ title: input.title, type: input.type, url: '', metadata: { ...input.metadata, durationSec: input.durationSec, localAssetId: localId, bytes: input.blob.size } });
    result.cloud = true;
  } catch (e) {
    result.cloudReason = e instanceof DataError ? e.message : 'Could not save to your account.';
  }
  return result;
}

/** Duration of a PCM WAV blob in seconds (0 when it is not a WAV). */
export async function wavDurationSeconds(blob: Blob): Promise<number> {
  let seconds = 0; // an unreadable blob has an unknown length, counted as 0 s in the totals (never an estimate)
  try {
    const head = new DataView(await blob.slice(0, 44).arrayBuffer());
    if (head.byteLength >= 44 && head.getUint32(0, false) === 0x52494646) { // RIFF
      const byteRate = head.getUint32(28, true);
      if (byteRate > 0) seconds = Math.max(0, (blob.size - 44) / byteRate);
    }
  } catch {
    /* leave 0 */
  }
  return seconds;
}
