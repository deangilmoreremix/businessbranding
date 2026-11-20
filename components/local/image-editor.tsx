'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Stage, Layer, Image as KImage, Text as KText, Rect as KRect, Transformer } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crop, Download, Layers as LayersIcon, Loader2, Save, Type, Square, Trash2, Wand2, X } from 'lucide-react';
import { fitWithin, removeSolidBackground } from '@/lib/local/image-utils';
import { aiSegmentationSupported, removeBackgroundAI } from '@/lib/local/segment';
import { saveFile } from '@/lib/local/fs-access';
import { putAsset } from '@/lib/local/store';

interface EditorLayer {
  id: string;
  type: 'text' | 'rect';
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  text?: string;
  fontSize?: number;
  fill: string;
  width?: number;
  height?: number;
}

interface ImageEditorProps {
  /** Image to edit (data:, blob: or same-origin / CORS-enabled URL). */
  src: string;
  onClose: () => void;
  /** Called with the edited image as a PNG data URL. */
  onApply: (dataUrl: string) => void;
}

const STAGE_MAX = 560;
const ASPECTS = [{ label: '1:1', value: 1 }, { label: '4:3', value: 4 / 3 }, { label: '16:9', value: 16 / 9 }, { label: '9:16', value: 9 / 16 }];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image'));
    img.src = src;
  });
}

async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  canvas.getContext('2d')!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/**
 * On-device image editor: crop (react-easy-crop), layers with drag/resize/rotate/text (react-konva) and background
 * removal (solid-colour flood fill, or optional MediaPipe segmentation for people). Nothing is uploaded anywhere.
 */
export default function ImageEditor({ src, onClose, onApply }: ImageEditorProps) {
  const [working, setWorking] = useState(src);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  // crop
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  // layers
  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('Your brand');
  const [color, setColor] = useState('#4f46e5');
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});

  // background removal
  const [tolerance, setTolerance] = useState(40);

  useEffect(() => {
    let alive = true;
    loadImage(working).then((i) => alive && setImg(i)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [working]);

  const size = img ? fitWithin(img.naturalWidth, img.naturalHeight, STAGE_MAX, STAGE_MAX) : { width: STAGE_MAX, height: STAGE_MAX, scale: 1 };

  useEffect(() => {
    const node = selected ? nodeRefs.current[selected] : null;
    if (trRef.current) {
      trRef.current.nodes(node ? [node] : []);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selected, layers]);

  const addLayer = (l: Omit<EditorLayer, 'id' | 'rotation' | 'scaleX' | 'scaleY'>) => {
    const id = `l${Date.now().toString(36)}`;
    setLayers((p) => [...p, { ...l, id, rotation: 0, scaleX: 1, scaleY: 1 }]);
    setSelected(id);
  };

  const applyCrop = useCallback(async () => {
    if (!area) return;
    setBusy('crop');
    try {
      setWorking(await cropToDataUrl(working, area));
      setLayers([]);
      setSelected(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }, [area, working]);

  const removeBgSolid = async () => {
    if (!img) return;
    setBusy('bg');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      removeSolidBackground(frame, { tolerance });
      ctx.putImageData(frame, 0, 0);
      setWorking(canvas.toDataURL('image/png'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const removeBgAI = async () => {
    if (!img) return;
    setBusy('ai');
    setError('');
    try {
      setWorking((await removeBackgroundAI(img)).toDataURL('image/png'));
    } catch (e) {
      console.warn('AI background removal failed:', (e as Error)?.message);
      setError('On-device background removal could not start (model download blocked or unsupported browser). Try the solid-colour option.');
    } finally {
      setBusy('');
    }
  };

  const render = (pixelRatio = 1): string => {
    setSelected(null);
    trRef.current?.nodes([]);
    const ratio = img ? img.naturalWidth / size.width : pixelRatio;
    if (!stageRef.current) throw new Error('The editor is not ready yet');
    return stageRef.current.toDataURL({ pixelRatio: ratio, mimeType: 'image/png' });
  };

  const exportBlob = async () => (await fetch(render())).blob();

  const onDownload = async () => {
    await saveFile(await exportBlob(), 'edited-image.png', { 'image/png': ['.png'] });
  };
  const onSaveLocal = async () => {
    setBusy('save');
    await putAsset({ blob: await exportBlob(), name: 'edited-image.png', kind: 'image', prompt: 'Edited in image editor' });
    setBusy('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-label="Image editor">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Image editor</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close editor"><X className="h-4 w-4" /></Button>
        </div>

        <Tabs defaultValue="layers">
          <TabsList>
            <TabsTrigger value="layers"><LayersIcon className="h-4 w-4 mr-1" />Layers</TabsTrigger>
            <TabsTrigger value="crop"><Crop className="h-4 w-4 mr-1" />Crop</TabsTrigger>
            <TabsTrigger value="background"><Wand2 className="h-4 w-4 mr-1" />Background</TabsTrigger>
          </TabsList>

          {/* forceMount: the Konva stage must stay mounted on the other tabs, or "Download PNG"/"Save"/"Use this image" would read a null stage */}
          <TabsContent value="layers" forceMount className="space-y-3 data-[state=inactive]:hidden">
            <div className="flex flex-wrap items-end gap-2">
              <Input className="w-48" value={textInput} onChange={(e) => setTextInput(e.target.value)} aria-label="Text" />
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Colour" className="h-9 w-10" />
              <Button size="sm" variant="outline" onClick={() => addLayer({ type: 'text', x: 40, y: 40, text: textInput || 'Text', fontSize: 40, fill: color })}>
                <Type className="h-4 w-4 mr-1" />Add text
              </Button>
              <Button size="sm" variant="outline" onClick={() => addLayer({ type: 'rect', x: 60, y: 60, width: 120, height: 80, fill: color })}>
                <Square className="h-4 w-4 mr-1" />Add shape
              </Button>
              <Button size="sm" variant="outline" disabled={!selected} onClick={() => { setLayers((p) => p.filter((l) => l.id !== selected)); setSelected(null); }}>
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
            </div>
            <div className="overflow-auto border rounded bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-[length:16px_16px] w-fit max-w-full">
              <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                onMouseDown={(e: any) => { if (e.target === e.target.getStage() || e.target.name() === 'base') setSelected(null); }}
                onTouchStart={(e: any) => { if (e.target === e.target.getStage() || e.target.name() === 'base') setSelected(null); }}
              >
                <Layer>
                  {img && <KImage name="base" image={img} width={size.width} height={size.height} />}
                  {layers.map((l) => {
                    const common = {
                      ref: (n: any) => { nodeRefs.current[l.id] = n; },
                      x: l.x, y: l.y, rotation: l.rotation, scaleX: l.scaleX, scaleY: l.scaleY, fill: l.fill, draggable: true,
                      onClick: () => setSelected(l.id), onTap: () => setSelected(l.id),
                      onDragEnd: (e: any) => setLayers((p) => p.map((x) => (x.id === l.id ? { ...x, x: e.target.x(), y: e.target.y() } : x))),
                      onTransformEnd: (e: any) => {
                        const n = e.target;
                        setLayers((p) => p.map((x) => (x.id === l.id ? { ...x, x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: n.scaleX(), scaleY: n.scaleY() } : x)));
                      }
                    };
                    return l.type === 'text'
                      ? <KText key={l.id} {...common} text={l.text} fontSize={l.fontSize} fontStyle="bold" onDblClick={() => { const t = window.prompt('Edit text', l.text); if (t) setLayers((p) => p.map((x) => (x.id === l.id ? { ...x, text: t } : x))); }} />
                      
                      : <KRect key={l.id} {...common} width={l.width} height={l.height} />;
                  })}
                  <Transformer ref={trRef} rotateEnabled keepRatio={false} />
                </Layer>
              </Stage>
            </div>
            <p className="text-xs text-muted-foreground">Drag to move; use the handles to resize or rotate; double-click text to edit.</p>
          </TabsContent>

          <TabsContent value="crop" className="space-y-3">
            <div className="relative h-80 bg-black rounded overflow-hidden">
              <Cropper image={working} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ASPECTS.map((a) => (
                <Button key={a.label} size="sm" variant={aspect === a.value ? 'default' : 'outline'} onClick={() => setAspect(a.value)}>{a.label}</Button>
              ))}
              <Slider className="w-40" value={[zoom * 100]} min={100} max={300} step={5} onValueChange={([v]) => setZoom(v / 100)} aria-label="Zoom" />
              <Button size="sm" onClick={applyCrop} disabled={busy === 'crop'}>{busy === 'crop' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply crop'}</Button>
            </div>
          </TabsContent>

          <TabsContent value="background" className="space-y-3">
            <div className="space-y-2">
              <Label>Solid-colour background (logos, flat graphics)</Label>
              <div className="flex items-center gap-3">
                <Slider className="w-48" value={[tolerance]} min={5} max={120} step={1} onValueChange={([v]) => setTolerance(v)} aria-label="Tolerance" />
                <span className="text-sm w-8">{tolerance}</span>
                <Button size="sm" onClick={removeBgSolid} disabled={busy === 'bg' || !img}>Remove background</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>AI cut-out for people (runs on your device)</Label>
              <p className="text-xs text-muted-foreground">Downloads a small segmentation model (about 250 KB) the first time you use it.</p>
              <Button size="sm" variant="outline" onClick={removeBgAI} disabled={busy === 'ai' || !img || !aiSegmentationSupported()}>
                {busy === 'ai' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {aiSegmentationSupported() ? 'Remove background (AI)' : 'Not supported in this browser'}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setWorking(src)}>Reset to original</Button>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onSaveLocal} disabled={busy === 'save'}><Save className="h-4 w-4 mr-1" />Save to local library</Button>
          <Button variant="outline" size="sm" onClick={onDownload}><Download className="h-4 w-4 mr-1" />Download PNG</Button>
          <Button size="sm" onClick={() => { onApply(render()); onClose(); }}>Use this image</Button>
        </div>
      </div>
    </div>
  );
}
