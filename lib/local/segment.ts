/**
 * Optional on-device AI background removal (people / portraits) with MediaPipe's ImageSegmenter (Apache-2.0).
 * Everything is lazy: the library and the ~250 KB model are only fetched when the user clicks the button.
 * Feature-detected: needs WebAssembly. Uses the GPU delegate when available and falls back to CPU.
 *
 * For logos and flat graphics prefer removeSolidBackground() in image-utils.ts, which needs no model at all.
 */

// MediaPipe is loaded from a version-pinned CDN URL and EVERY file (module, WASM loader, WASM binary) is checked against a SHA-384
// hash before it is used (lib/local/sri.ts), so a tampered CDN response is refused. (The npm bundle cannot be used: once minified by
// webpack it threw "Super constructor null of oE is not a constructor"; the official ESM bundle works.)
const BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3';
const FILES = {
  module: { url: `${BASE}/vision_bundle.mjs`, integrity: 'sha384-DZDJgsg9kM/syzovsJE2oHoJvmLQE3Tvz6yd9ONxVPm6DQk/u/lNWX0IY19I4VRe' },
  loader: { url: `${BASE}/wasm/vision_wasm_internal.js`, integrity: 'sha384-VG4L2pc/JhM3VpFdPd6t2AoiapZdLjSqTKIuofix3rkzN9Yfj0tXOb1uT9+k4I3h' },
  binary: { url: `${BASE}/wasm/vision_wasm_internal.wasm`, integrity: 'sha384-HQSquUNcS27439Q+k9aDBLpQXHgMM5HFO0K3mSjv1RierSrzbQq8Fbc2zL+CXlGK' }
};
// The model is pinned too: a versioned URL (not "latest") whose bytes are verified before MediaPipe reads them.
const MODEL = {
  url: process.env.NEXT_PUBLIC_SEGMENTER_MODEL_URL || 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
  integrity: 'sha384-A2bQ8+iZyQM3KIGVBUf0FyetqxuynyKpjsjCE8uzoJEnj1ghCu6ge2daiRffAiS5'
};

export const aiSegmentationSupported = () => typeof WebAssembly === 'object' && typeof document !== 'undefined';

import { fetchVerified, fetchVerifiedBytes, importVerifiedModule } from '@/lib/local/sri';

let segmenterPromise: Promise<any> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { ImageSegmenter } = await importVerifiedModule(FILES.module.url, FILES.module.integrity);
      const [loader, binary] = await Promise.all([fetchVerified(FILES.loader.url, FILES.loader.integrity), fetchVerified(FILES.binary.url, FILES.binary.integrity)]);
      const fileset = { wasmLoaderPath: URL.createObjectURL(new Blob([loader], { type: 'text/javascript' })), wasmBinaryPath: URL.createObjectURL(binary) };
      const modelAssetBuffer = new Uint8Array(await fetchVerifiedBytes(MODEL.url, MODEL.integrity));
      const make = (delegate: 'GPU' | 'CPU') =>
        ImageSegmenter.createFromOptions(fileset, { baseOptions: { modelAssetBuffer, delegate }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true });
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
