'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { extractPalette } from '@/lib/local/image-utils';
import { putAsset, listAssets, deleteAsset, type AssetRecord } from '@/lib/local/store';
import { saveFile } from '@/lib/local/fs-access';
import { useLocalDraft } from '@/lib/local/use-draft';

// Browser-only, heavy: loaded only when the editor is opened.
const ImageEditor = dynamic(() => import('./image-editor'), { ssr: false, loading: () => null });

interface AssetToolsProps {
  /** Images the user is working with (uploaded preview + generated variations). */
  images: string[];
  /** Receives edited images so the host UI can show/save them like generated ones. */
  onAddImage?: (dataUrl: string) => void;
}

async function paletteFromUrl(url: string, count = 5): Promise<string[]> {
  const { loadImage, createCanvas } = await import('@/lib/local/export-png');
  const img = await loadImage(url);
  if (!img) return [];
  const c = createCanvas(64, 64);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 64, 64);
  return extractPalette(ctx.getImageData(0, 0, 64, 64), count);
}

/**
 * Local brand-asset tools: edit images, build brand-kit / palette / social-post PNGs, and keep a local library.
 * Everything runs in the browser; heavy libraries are imported only when used.
 */
export default function AssetTools({ images, onAddImage }: AssetToolsProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useLocalDraft('visual:brand-name', '');
  const [tagline, setTagline] = useLocalDraft('visual:brand-tagline', '');
  const [palette, setPalette] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [library, setLibrary] = useState<AssetRecord[]>([]);
  const cached = useRef(new Set<string>());
  const mockupRef = useRef<HTMLDivElement>(null);

  const refreshLibrary = useCallback(() => { listAssets(12).then(setLibrary); }, []);

  // Cache generated (data:) images locally so they survive a reload.
  useEffect(() => {
    (async () => {
      for (const url of images) {
        if (!url.startsWith('data:') || cached.current.has(url)) continue;
        cached.current.add(url);
        try {
          await putAsset({ blob: await (await fetch(url)).blob(), name: 'generated.png', kind: 'image', prompt: 'Generated image' });
        } catch { /* storage full or blocked: ignore */ }
      }
      refreshLibrary();
    })();
  }, [images, refreshLibrary]);

  useEffect(() => { refreshLibrary(); }, [refreshLibrary]);

  const pick = async (url: string) => {
    setSelected(url);
    setPalette(await paletteFromUrl(url));
  };
  useEffect(() => { if (!selected && images[0]) pick(images[0]); }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportKit = async (kind: 'kit' | 'palette' | 'social') => {
    setStatus('Rendering…');
    try {
      const { createCanvas, renderBrandKit, renderPalette, renderSocialPost, canvasToPngBlob, loadImage } = await import('@/lib/local/export-png');
      const logo = selected ? await loadImage(selected) : null;
      const base = { name: name || 'Your Brand', tagline, palette: palette.length ? palette : ['#4f46e5', '#ec4899'], logo: logo ?? undefined };
      const [w, h] = kind === 'social' ? [1080, 1080] : kind === 'palette' ? [1200, 300] : [1600, 1000];
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d')!;
      if (kind === 'kit') renderBrandKit(ctx, { ...base, width: w, height: h });
      else if (kind === 'palette') renderPalette(ctx, { x: 0, y: 0, width: w, height: h, palette: base.palette });
      else renderSocialPost(ctx, { ...base, width: w, height: h, headline: tagline || `Meet ${base.name}` });
      const blob = await canvasToPngBlob(canvas);
      const file = `${(name || 'brand').toLowerCase().replace(/\W+/g, '-')}-${kind}.png`;
      const result = await saveFile(blob, file, { 'image/png': ['.png'] });
      setStatus(result === 'cancelled' ? '' : result === 'saved' ? `Saved ${file}` : `Downloaded ${file}`);
    } catch (e: any) {
      setStatus(e.message || 'Export failed');
    }
  };

  const exportMockup = async () => {
    if (!mockupRef.current) return;
    setStatus('Rendering…');
    try {
      const { exportNodeToPng } = await import('@/lib/local/export-png');
      const blob = await exportNodeToPng(mockupRef.current, { pixelRatio: 3 });
      const result = await saveFile(blob, 'social-mockup.png', { 'image/png': ['.png'] });
      setStatus(result === 'cancelled' ? '' : 'Mockup exported');
    } catch (e: any) {
      setStatus(e.message || 'Export failed');
    }
  };

  const [c1 = '#4f46e5', c2 = '#ec4899'] = palette;

  return (
    <div className="mt-6 space-y-6 border-t pt-6" data-testid="asset-tools">
      <div>
        <h4 className="font-medium mb-2">Edit &amp; export (on your device)</h4>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">Upload or generate an image to edit it and export brand kits.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={i} className={`relative w-24 h-24 rounded border-2 ${selected === src ? 'border-primary' : 'border-transparent'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Asset ${i + 1}`} className="w-full h-full object-cover rounded cursor-pointer" onClick={() => pick(src)} />
                <Button size="sm" variant="secondary" className="absolute bottom-1 right-1 h-6 px-2" onClick={() => setEditing(src)} aria-label={`Edit image ${i + 1}`}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label>Brand name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Coffee" />
          <Label>Tagline</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Brewed with purpose" />
          <Label>Palette (from the selected image; click to edit)</Label>
          <div className="flex gap-2 flex-wrap">
            {palette.map((hex, i) => (
              <input key={i} type="color" value={hex} aria-label={`Colour ${i + 1}`} className="h-9 w-12" onChange={(e) => setPalette((p) => p.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
            {palette.length === 0 && <span className="text-sm text-muted-foreground">No image selected</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => exportKit('kit')}><Download className="h-4 w-4 mr-1" />Brand kit PNG</Button>
            <Button size="sm" variant="outline" onClick={() => exportKit('palette')}><Download className="h-4 w-4 mr-1" />Palette PNG</Button>
            <Button size="sm" variant="outline" onClick={() => exportKit('social')}><Download className="h-4 w-4 mr-1" />Social post PNG</Button>
            <Button size="sm" variant="outline" onClick={exportMockup}><ImageIcon className="h-4 w-4 mr-1" />Snapshot mockup</Button>
          </div>
          {status && <p className="text-xs text-muted-foreground" role="status">{status}</p>}
        </div>

        {/* DOM mockup captured by html-to-image */}
        <div ref={mockupRef} className="rounded-lg p-6 text-white flex flex-col justify-between aspect-square max-w-xs" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
          {selected && /* eslint-disable-next-line @next/next/no-img-element */ <img src={selected} alt="" className="h-12 w-12 object-contain rounded bg-white/30" />}
          <div>
            <p className="text-2xl font-extrabold leading-tight">{tagline || `Meet ${name || 'your brand'}`}</p>
            <p className="mt-2 text-sm opacity-90">{name || 'Your Brand'}</p>
          </div>
        </div>
      </div>

      {library.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Local library <span className="text-xs text-muted-foreground">(stored in this browser only)</span></h4>
          <div className="flex flex-wrap gap-3">
            {library.map((a) => <LibraryItem key={a.id} asset={a} onUse={(url) => onAddImage?.(url)} onDelete={async () => { await deleteAsset(a.id); refreshLibrary(); }} />)}
          </div>
        </div>
      )}

      {editing && (
        <ImageEditor src={editing} onClose={() => setEditing(null)} onApply={(url) => { onAddImage?.(url); refreshLibrary(); }} />
      )}
    </div>
  );
}

function LibraryItem({ asset, onUse, onDelete }: { asset: AssetRecord; onUse: (dataUrl: string) => void; onDelete: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(asset.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [asset.blob]);
  const reuse = async () => {
    const reader = new FileReader();
    reader.onloadend = () => onUse(reader.result as string);
    reader.readAsDataURL(asset.blob);
  };
  return (
    <div className="relative w-20 h-20 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={asset.name} className="w-full h-full object-cover rounded cursor-pointer" onClick={reuse} title="Click to reuse" />}
      <button onClick={onDelete} aria-label="Delete from library" className="absolute top-0 right-0 bg-black/60 rounded p-0.5 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3 text-white" /></button>
    </div>
  );
}
