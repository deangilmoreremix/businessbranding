import type { AssetRecord } from '@/lib/local/store';
import { listAssets } from '@/lib/local/store';
import { getBusinessAnalyses } from '@/lib/services/business-analyzer';

export interface LibraryStats {
  total: number;
  images: number;
  audio: number;
  generatedToday: number;
  storageBytes: number;
  audioSeconds: number;
  analyses: number;
}

const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Real numbers from the user's own saved items; nothing is estimated or invented. */
export function computeLibraryStats(assets: Pick<AssetRecord, 'kind' | 'blob' | 'createdAt' | 'meta'>[], analyses = 0, now = Date.now()): LibraryStats {
  const today = startOfDay(now);
  let images = 0, audio = 0, generatedToday = 0, storageBytes = 0, audioSeconds = 0;
  for (const a of assets) {
    if (a.kind === 'image') images++;
    if (a.kind === 'audio') {
      audio++;
      const d = Number((a.meta as any)?.durationSec);
      if (Number.isFinite(d) && d > 0) audioSeconds += d;
    }
    if (a.createdAt >= today) generatedToday++;
    storageBytes += a.blob?.size ?? 0;
  }
  return { total: assets.length, images, audio, generatedToday, storageBytes, audioSeconds, analyses };
}

export async function loadLibraryStats(): Promise<LibraryStats> {
  const [assets, analyses] = await Promise.all([listAssets(Number.MAX_SAFE_INTEGER), getBusinessAnalyses().catch(() => [])]);
  return computeLibraryStats(assets, analyses.length);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  if (!(seconds > 0)) return '0 min';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${(m / 60).toFixed(1)} h`;
}
