/**
 * File System Access API save/open with graceful fallbacks:
 *  - Chromium: native "Save as" / "Open" pickers.
 *  - Firefox/Safari (no picker API): a normal download / <input type="file">.
 */

export const fsAccessSupported = () => typeof window !== 'undefined' && 'showSaveFilePicker' in window;

export type SaveResult = 'saved' | 'downloaded' | 'cancelled';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Save with the native picker when available, otherwise download. */
export async function saveFile(blob: Blob, suggestedName: string, accept?: Record<string, string[]>): Promise<SaveResult> {
  if (fsAccessSupported()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        ...(accept ? { types: [{ description: suggestedName.split('.').pop()?.toUpperCase() ?? 'File', accept }] } : {})
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
      // Permission or picker failure: fall through to a normal download
    }
  }
  downloadBlob(blob, suggestedName);
  return 'downloaded';
}

/** Open a file with the native picker when available, otherwise a hidden file input. Resolves null if cancelled. */
export async function openFile(accept: Record<string, string[]>): Promise<File | null> {
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({ types: [{ description: 'Files', accept }], multiple: false });
      return await handle.getFile();
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = Object.values(accept).flat().join(',');
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
