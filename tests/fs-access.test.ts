import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveFile } from '@/lib/local/fs-access';

function stubDom() {
  const clicks: string[] = [];
  const anchor: any = { click: () => clicks.push(anchor.download), remove: () => {}, set href(_v: string) {}, set download(v: string) { anchor._d = v; }, get download() { return anchor._d; } };
  vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild: () => {} } });
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
  return clicks;
}

afterEach(() => vi.unstubAllGlobals());

describe('saveFile', () => {
  it('falls back to a download when the File System Access API is missing', async () => {
    vi.stubGlobal('window', {});
    const clicks = stubDom();
    expect(await saveFile(new Blob(['x']), 'kit.png')).toBe('downloaded');
    expect(clicks).toEqual(['kit.png']);
  });

  it('uses the native picker when available', async () => {
    const written: Blob[] = [];
    const handle = { createWritable: async () => ({ write: async (b: Blob) => written.push(b), close: async () => {} }) };
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn(async () => handle) });
    const blob = new Blob(['x']);
    expect(await saveFile(blob, 'kit.png', { 'image/png': ['.png'] })).toBe('saved');
    expect(written).toEqual([blob]);
  });

  it('reports cancellation without downloading', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); } });
    const clicks = stubDom();
    expect(await saveFile(new Blob(['x']), 'kit.png')).toBe('cancelled');
    expect(clicks).toEqual([]);
  });

  it('falls back to a download when the picker fails for another reason', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: async () => { throw new Error('SecurityError'); } });
    const clicks = stubDom();
    expect(await saveFile(new Blob(['x']), 'kit.png')).toBe('downloaded');
    expect(clicks).toEqual(['kit.png']);
  });
});
