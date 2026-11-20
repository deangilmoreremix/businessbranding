/**
 * Local persistence in IndexedDB (via `idb`, loaded lazily): drafts (form text, scripts, editor state) and a cache of
 * generated assets so they survive reloads and can be reopened without calling the API again.
 * Falls back to an in-memory Map when IndexedDB is unavailable (private mode, SSR, blocked storage).
 */

const DB_NAME = 'brand-local';
const DB_VERSION = 1;
const MAX_ASSETS = 60;

export interface DraftRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
}

export interface AssetRecord {
  id: string;
  blob: Blob;
  name: string;
  kind: 'image' | 'audio' | 'other';
  prompt?: string;
  meta?: Record<string, unknown>;
  createdAt: number;
}

export const idbSupported = () => typeof indexedDB !== 'undefined';

const memDrafts = new Map<string, DraftRecord>();
const memAssets = new Map<string, AssetRecord>();
let dbPromise: Promise<any> | null = null;

async function db(): Promise<any | null> {
  if (!idbSupported()) return null;
  if (!dbPromise) {
    dbPromise = import('idb')
      .then(({ openDB }) =>
        openDB(DB_NAME, DB_VERSION, {
          upgrade(d) {
            d.createObjectStore('drafts', { keyPath: 'key' });
            const assets = d.createObjectStore('assets', { keyPath: 'id' });
            assets.createIndex('createdAt', 'createdAt');
          }
        })
      )
      .catch(() => null);
  }
  return dbPromise;
}

/** Test hook: forget the cached connection (and memory fallbacks). */
export function resetStoreForTests() {
  dbPromise = null;
  memDrafts.clear();
  memAssets.clear();
}

// ---- Drafts ----------------------------------------------------------------------------------
export async function saveDraft<T>(key: string, value: T): Promise<void> {
  const rec: DraftRecord<T> = { key, value, updatedAt: Date.now() };
  const d = await db();
  if (d) await d.put('drafts', rec).catch(() => memDrafts.set(key, rec));
  else memDrafts.set(key, rec);
}

export async function loadDraft<T>(key: string): Promise<T | undefined> {
  const d = await db();
  const rec: DraftRecord<T> | undefined = d ? await d.get('drafts', key).catch(() => undefined) : memDrafts.get(key) as DraftRecord<T> | undefined;
  return rec?.value;
}

export async function deleteDraft(key: string): Promise<void> {
  memDrafts.delete(key);
  const d = await db();
  if (d) await d.delete('drafts', key).catch(() => undefined);
}

export async function listDrafts(prefix = ''): Promise<DraftRecord[]> {
  const d = await db();
  const all: DraftRecord[] = d ? await d.getAll('drafts').catch(() => []) : [...memDrafts.values()];
  return all.filter((r) => r.key.startsWith(prefix)).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---- Generated-asset cache ---------------------------------------------------------------------
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export async function putAsset(input: Omit<AssetRecord, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
  const rec: AssetRecord = { ...input, id: input.id ?? newId(), createdAt: Date.now() };
  const d = await db();
  if (d) await d.put('assets', rec).catch(() => memAssets.set(rec.id, rec));
  else memAssets.set(rec.id, rec);
  await trimAssets();
  return rec.id;
}

export async function listAssets(limit = 24): Promise<AssetRecord[]> {
  const d = await db();
  const all: AssetRecord[] = d ? await d.getAll('assets').catch(() => []) : [...memAssets.values()];
  return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function getAsset(id: string): Promise<AssetRecord | undefined> {
  const d = await db();
  return d ? d.get('assets', id).catch(() => undefined) : memAssets.get(id);
}

export async function deleteAsset(id: string): Promise<void> {
  memAssets.delete(id);
  const d = await db();
  if (d) await d.delete('assets', id).catch(() => undefined);
}

/** Keep only the newest `max` assets so the cache cannot grow without bound. */
export async function trimAssets(max = MAX_ASSETS): Promise<void> {
  const all = await listAssets(Number.MAX_SAFE_INTEGER);
  for (const old of all.slice(max)) await deleteAsset(old.id);
}

/** Store an image/audio from a URL (data:, blob: or same-origin) in the asset cache. */
export async function cacheAssetFromUrl(url: string, name: string, kind: AssetRecord['kind'], extra: Partial<AssetRecord> = {}): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return putAsset({ blob, name, kind, ...extra });
}
