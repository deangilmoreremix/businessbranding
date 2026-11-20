/**
 * Optional on-device AI background removal (people / portraits) with MediaPipe's ImageSegmenter (Apache-2.0).
 * Everything is lazy: the library and the ~250 KB model are only fetched when the user clicks the button.
 * Feature-detected: needs WebAssembly. Uses the GPU delegate when available and falls back to CPU.
 *
 * For logos and flat graphics prefer removeSolidBackground() in image-utils.ts, which needs no model at all.
 */

// The library is loaded from the pinned CDN build at runtime (not bundled): the bundled copy threw "Super constructor null of oE is not a constructor"
// once minified by webpack, while the official ESM bundle works (verified in headless Chromium).
const MEDIAPIPE_URL = process.env.NEXT_PUBLIC_MEDIAPIPE_URL || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs';
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const DEFAULT_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

export const aiSegmentationSupported = () => typeof WebAssembly === 'object' && typeof document !== 'undefined';

let segmenterPromise: Promise<any> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(/* webpackIgnore: true */ MEDIAPIPE_URL);
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      const modelAssetPath = process.env.NEXT_PUBLIC_SEGMENTER_MODEL_URL || DEFAULT_MODEL;
      const make = (delegate: 'GPU' | 'CPU') =>
        ImageSegmenter.createFromOptions(fileset, { baseOptions: { modelAssetPath, delegate }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true });
      try {
        return await make('GPU');
      } catch {
        return await make('CPU');
      }
    })().catch((e) => {
      segmenterPromise = null; // allow retry
      throw e;
    });
  }
  return segmenterPromise;
}

/** Returns a canvas with the person kept and the background transparent. */
export async function removeBackgroundAI(image: HTMLImageElement): Promise<HTMLCanvasElement> {
  const segmenter = await getSegmenter();
  const result = segmenter.segment(image);
  const mask: Float32Array = result.confidenceMasks[0].getAsFloat32Array();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < mask.length; i++) frame.data[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, mask[i])) * 255);
  ctx.putImageData(frame, 0, 0);
  result.close?.();
  return canvas;
}
