/**
 * Optional on-device dictation with Whisper through Transformers.js (Apache-2.0, ONNX; WebGPU when available, else WASM).
 * The library is NOT bundled: bundlers cannot resolve onnxruntime-web's WASM assets from the package, so it is imported
 * at runtime from a pinned jsDelivr URL (`webpackIgnore`), and only after the user opts in.
 * OpenAI gpt-transcribe stays the default. This is only used after the user explicitly opts in, because the first use
 * downloads a model (~40-80 MB for whisper-tiny.en) which the browser then caches.
 */

export const WHISPER_MODEL = process.env.NEXT_PUBLIC_WHISPER_MODEL || 'onnx-community/whisper-tiny.en';
export const WHISPER_SAMPLE_RATE = 16000;
export const TRANSFORMERS_URL = process.env.NEXT_PUBLIC_TRANSFORMERS_URL || 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';

/** True only when WebGPU has a usable adapter (a bare `navigator.gpu` is not enough). */
export async function webgpuAdapterAvailable(): Promise<boolean> {
  try {
    const gpu = (navigator as any)?.gpu;
    if (!gpu) return false;
    const adapter = await Promise.race([gpu.requestAdapter(), new Promise((r) => setTimeout(() => r(null), 3000))]);
    return !!adapter;
  } catch {
    return false;
  }
}

export const onDeviceWhisperSupported = () => typeof WebAssembly === 'object' && typeof AudioContext !== 'undefined';

/** Average all channels into one. */
export function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0];
  const out = new Float32Array(channels[0].length);
  for (const ch of channels) for (let i = 0; i < out.length; i++) out[i] += ch[i] / channels.length;
  return out;
}

/** Linear-interpolation resampler (adequate for speech at 16 kHz). */
export function resampleLinear(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const length = Math.round((input.length * to) / from);
  const out = new Float32Array(length);
  const ratio = from / to;
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    out[i] = input[i0] + (input[i1] - input[i0]) * (pos - i0);
  }
  return out;
}

export async function decodeTo16kMono(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i));
    return resampleLinear(mixToMono(channels), buf.sampleRate, WHISPER_SAMPLE_RATE);
  } finally {
    ctx.close();
  }
}

let pipelinePromise: Promise<any> | null = null;

export interface WhisperProgress {
  status: string;
  file?: string;
  progress?: number;
}

/** Download (first time) and run Whisper on a recording. Resolves to the transcript text. */
export async function transcribeOnDevice(blob: Blob, onProgress?: (p: WhisperProgress) => void): Promise<string> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import(/* webpackIgnore: true */ TRANSFORMERS_URL);
      // `navigator.gpu` can exist with no usable adapter (headless/VM browsers): only choose WebGPU when an adapter is really available,
      // and fall back to WASM if the WebGPU pipeline cannot start.
      const hasAdapter = await webgpuAdapterAvailable();
      const make = (device: 'webgpu' | 'wasm') => pipeline('automatic-speech-recognition', WHISPER_MODEL, { device, progress_callback: onProgress } as any);
      if (hasAdapter) {
        try {
          return await make('webgpu');
        } catch {
          /* fall through to WASM */
        }
      }
      return make('wasm');
    })().catch((e) => {
      pipelinePromise = null;
      throw e;
    });
  }
  const asr = await pipelinePromise;
  const audio = await decodeTo16kMono(blob);
  const result = await asr(audio, { chunk_length_s: 30, stride_length_s: 5 });
  return (Array.isArray(result) ? result[0].text : result.text).trim();
}
