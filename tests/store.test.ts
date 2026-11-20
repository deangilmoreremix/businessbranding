import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteAsset, deleteDraft, listAssets, listDrafts, loadDraft, putAsset, resetStoreForTests, saveDraft, trimAssets } from '@/lib/local/store';

beforeEach(() => resetStoreForTests());

describe('drafts (IndexedDB)', () => {
  it('round-trips structured values and lists newest first', async () => {
    await saveDraft('voice:script', { text: 'hello', voice: 'marin' });
    await new Promise((r) => setTimeout(r, 5));
    await saveDraft('voice:other', 'x');
    expect(await loadDraft('voice:script')).toEqual({ text: 'hello', voice: 'marin' });
    expect((await listDrafts('voice:')).map((d) => d.key)).toEqual(['voice:other', 'voice:script']);
    expect(await listDrafts('nope:')).toEqual([]);
  });

  it('overwrites and deletes', async () => {
    await saveDraft('k', 1);
    await saveDraft('k', 2);
    expect(await loadDraft('k')).toBe(2);
    await deleteDraft('k');
    expect(await loadDraft('k')).toBeUndefined();
  });
});

describe('asset cache', () => {
  it('stores blobs and returns newest first', async () => {
    const a = await putAsset({ blob: new Blob(['a'], { type: 'image/png' }), name: 'a.png', kind: 'image', prompt: 'logo' });
    await new Promise((r) => setTimeout(r, 5));
    const b = await putAsset({ blob: new Blob(['b']), name: 'b.png', kind: 'image' });
    const list = await listAssets();
    expect(list.map((x) => x.id)).toEqual([b, a]);
    expect(list[1].prompt).toBe('logo');
    expect(list[1].blob.size).toBe(1);
  });

  it('trims to the newest N and deletes by id', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      ids.push(await putAsset({ blob: new Blob([String(i)]), name: `${i}.png`, kind: 'image' }));
      await new Promise((r) => setTimeout(r, 3));
    }
    await trimAssets(3);
    expect((await listAssets()).map((x) => x.name)).toEqual(['4.png', '3.png', '2.png']);
    await deleteAsset(ids[4]);
    expect((await listAssets()).length).toBe(2);
  });
});
