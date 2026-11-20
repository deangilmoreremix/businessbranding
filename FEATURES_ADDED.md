# Features added (free, mostly in-browser)

All additions are **purely additive and lazy-loaded** (`next/dynamic` with `ssr:false` or dynamic `import()`), so initial
bundles do not grow. OpenAI remains the default AI path; on-device models are optional fallbacks only. No new third-party AI
provider is used. Tests: `npm test` (vitest).

_This file is updated per feature group; see the sections below._

## Packages and licenses (checked on npm; installed `license` field)

| Package | Version | License | Used for |
|---|---|---|---|
| konva / react-konva | 9.3.22 / 18.2.15 | MIT | image editor layers (react-konva 19 needs React 19; the app is on 18) |
| react-easy-crop | 6.2.5 | MIT | crop |
| html-to-image | 1.11.13 | MIT | DOM mockup → PNG |
| idb | 8.0.4 | ISC | IndexedDB drafts + asset cache |
| @mediapipe/tasks-vision | 1.2.3 | Apache-2.0 | optional on-device person cut-out |
| @remotion/captions | 4.0.545 (exact) | MIT (Remotion core packages: company license; used under the owner's free 1-person license) | `Caption` model, `parseVtt` |
| gifenc | 1.0.3 | MIT | animated GIF previews |
| vitest / vite / fake-indexeddb | 5.1.1 / – / 6.2.8 | MIT / MIT / Apache-2.0 | tests (dev only) |

Notes: **`bg0` does not exist on npm.** `@imgly/background-removal` exists but is **AGPL-3.0** (copyleft), so it was *not*
used. Background removal is a dependency-free solid-colour flood fill plus optional MediaPipe segmentation.

## 1. Image editor + background removal
- **Where:** Visual Identity page → after uploading or generating an image, the *Edit & export (on your device)* panel; pencil button on each image.
- **What:** layers (text, shapes: drag/resize/rotate, double-click to edit text), crop with aspect presets, background removal (solid colour, tolerance slider) and optional AI cut-out for people (MediaPipe ImageSegmenter; model ≈250 KB fetched from Google's public model bucket only when the button is pressed; override with `NEXT_PUBLIC_SEGMENTER_MODEL_URL`).
- **Code:** `components/local/image-editor.tsx`, `lib/local/image-utils.ts`, `lib/local/segment.ts`.
- **Support:** any modern browser for editing/solid removal. AI cut-out needs WebAssembly (GPU delegate with CPU fallback); the button disables itself otherwise.

## 2. PNG export (Canvas API + html-to-image)
- **Where:** same panel: *Brand kit PNG*, *Palette PNG*, *Social post PNG* (Canvas API, deterministic) and *Snapshot mockup* (html-to-image of the live preview card).
- The palette is extracted on-device (k-means) from the selected image and is editable.
- **Code:** `lib/local/export-png.ts`, `components/local/asset-tools.tsx`.

## 3. IndexedDB + File System Access
- **Where:** generated images are cached automatically in a *Local library* (click to reuse); the visual-identity prompt and brand name/tagline are drafts restored after reload; every export/save goes through the save helper.
- **Code:** `lib/local/store.ts` (idb, in-memory fallback), `lib/local/use-draft.ts`, `lib/local/fs-access.ts`.
- **Support:** IndexedDB everywhere (falls back to memory in private mode). Native Save/Open pickers: Chromium only; Firefox/Safari use a normal download / file input.

## 4. Voice input, read-aloud and optional on-device dictation
- **Where:** the assistant chat (brand-analysis AI Assistant → Chat tab, and the floating support assistant): a mic button next to *Send* and a speaker button on assistant replies. Voice tools → *Transcription* tab: an opt-in checkbox for on-device Whisper.
- **Default path is OpenAI:** the mic records with `MediaRecorder` and sends the clip to `/api/voice/transcribe` (`gpt-transcribe`); read-aloud calls `/api/voice/generate` (Realtime TTS). **Fallbacks:** if OpenAI is unavailable (no key, error) or `MediaRecorder` is missing, dictation uses the browser's **Web Speech API** (`SpeechRecognition`) and read-aloud uses `speechSynthesis`.
- **On-device Whisper (opt-in only):** Transformers.js (`onnx-community/whisper-tiny.en`, WebGPU if present else WASM). The library is imported at runtime from a pinned jsDelivr URL (`NEXT_PUBLIC_TRANSFORMERS_URL`) because bundlers cannot resolve onnxruntime-web's WASM assets from the npm package; the model (~40-80 MB) is downloaded by the browser on first use only.
- **Support:** Web Speech recognition: Chromium and Safari (Chromium sends audio to the vendor's service); not Firefox. `speechSynthesis`: all major browsers. On-device Whisper: modern desktop browsers with WebAssembly.
- **Code:** `lib/local/speech.ts`, `lib/local/whisper.ts`, `components/local/use-voice-input.ts`, `components/local/read-aloud.ts`.

## 5. WebVTT / SRT captions
- **Where:** Voice tools → *Transcription* (estimated timing from audio length), *Podcast* and *Audiobook* (exact timing: the server returns each clip's length in `X-Segment-Durations`). Each shows an audio player with a `<track>` caption track, live caption text, and **Captions (.vtt)** / **Subtitles (.srt)** downloads.
- **Remotion:** `@remotion/captions` 4.0.545 (MIT) supplies the `Caption` data model and `parseVtt` (import). Its `createTikTokStyleCaptions` was evaluated but merges distant words into one page, so cue grouping and the WebVTT/SRT writers are implemented in `lib/local/captions.ts`. **Remotion is used under the owner's free (1-person business) license.** `@remotion/web-renderer` (stable since 4.0.491) was reviewed; video rendering is not part of this release (see "Not included").
- **Code:** `lib/local/captions.ts`, `components/local/caption-player.tsx`.
- **Support:** `<track>` and Blob downloads work in all current browsers.

## 6. Notifications for finished background jobs
- **Where:** Brand analysis → Competitors view → *Run deep research*. The OpenAI background job is polled; its id is saved locally so polling resumes after a reload, and a browser notification fires when it finishes (only if you pressed *Notify me when done* and the tab is not focused). Results show recommendations, opportunities, threats and cited sources.
- **Support:** Notifications API on desktop browsers and Android Chrome; iOS Safari requires an installed web app. Unsupported/blocked → the button explains, and the result still appears in the page.
- **Code:** `lib/local/notify.ts`, `components/local/deep-research-panel.tsx`, `lib/services/deep-research.ts`.

## 7. Waveform, clip trimming and GIF previews
- **Where:** Voice tools → *Voice-over* recorder (after recording) and *Transcription* (selected audio file): waveform drawn from the Web Audio API, start/end sliders, *Preview selection*, *Apply trim* (replaces the recording) and *Save clip (.wav)*. Visual Identity edit panel: *GIF preview* cycles through the uploaded/generated/edited images (needs two or more).
- **Code:** `lib/local/audio.ts`, `components/local/audio-trimmer.tsx`, `lib/local/gif.ts`.
- **Support:** Web Audio decode + canvas: all current browsers (the trimmer hides itself if decoding fails). Existing WaveSurfer visualizer in the audiobook player is unchanged. There is no video feature in the app, so GIFs are used for image/animation previews only.
