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
| @react-email/components / render | 1.0.12 / 2.3.1 | MIT | email template |
| @xyflow/react (React Flow) | 13.0.2 | MIT | workflow builder |
| @huggingface/transformers | 4.3.2 (CDN, not installed) | Apache-2.0 | optional on-device Whisper |
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

## 8. Content workflows (React Flow) and email templates (React Email)
- **Where:** new page **/workflows** (footer → *Content Workflows*). Drag steps on a canvas: **Brief → Generate copy (OpenAI Responses, strict-schema `brand_content`) → Email template / Voice-over (OpenAI TTS)**. *Run workflow* executes in dependency order and shows the copy, a sandboxed email preview and an audio player. Graphs autosave in IndexedDB; *Export/Import* JSON uses the File System Access API with fallbacks; loops, missing inputs and bad imports are reported.
- **Email:** `emails/brand-email.tsx` (React Email), rendered server-side by `POST /api/email/render` (HTML + plain text; only http(s) CTA links; palette validated). Preview is an `iframe sandbox=""`.
- **Code:** `lib/local/workflow.ts` (pure model, tested), `components/local/workflow-builder.tsx`, `app/workflows/page.tsx`, `app/api/email/render/route.ts`.
- **Support:** any modern desktop browser; React Flow works with touch but is best on desktop. React Flow CSS is imported only by the /workflows route.

## Bundle impact (production build)
Every existing route's First Load JS is **equal to or smaller than before** (23 of 37 routes smaller, 14 equal, none larger; shared JS 134 → 133 kB). Two changes keep it that way:
- `next.config.js`: the custom per-package vendor splitting now applies to *initial* chunks only (`chunks: 'initial'`). Before, icons/libraries used by lazy features were merged into shared vendor chunks (e.g. `vendor.lucide-react` grew by 3 kB on every page).
- The floating support assistant's chat/voice UI is `React.lazy`-loaded when the widget is opened.
New code is only fetched on use (editor, exports, trimmer, captions, research panel, workflow page).

## Not included / deviations
- **Video** (Mediabunny / WebCodecs / FFmpeg.wasm / `@remotion/web-renderer`): the app has no video feature, so nothing was added. `@remotion/web-renderer` (stable since 4.0.491, WebCodecs via Mediabunny, MPL-2.0 for Mediabunny) is the natural way to build a captioned audiogram later.
- Remotion's `createTikTokStyleCaptions` was not used (see section 5). Beacon analytics, Unlayer, PromptMe and standalone WebGPU were skipped as requested.
- A live microphone level meter was not added; the trimmer waveform covers the Web Audio visualizer need.

## Tests
`npm test` runs 60 vitest tests: image utilities, IndexedDB store (fake-indexeddb), File System Access fallbacks, PNG drawing (recording canvas), captions/VTT/SRT (including a round trip through `@remotion/captions`), speech/notifications/audio helpers, WAV/GIF encoders, workflow model and the React Email template.

## Fixes: stub modules, planning page, type errors
- **Stubs replaced:** `lib/services/calendar-service.ts` (AI + local scheduling, overlap resolution, RFC 5545 `.ics` export), `lib/services/implementation-plan.ts` (types, AI plan with strict schema, plan → calendar events, budget totals), `components/brand-pillar-breakdown/` (real UI; the empty `brand-pillar-breakdown.tsx` stub was shadowing it), `components/business-analyzer/business-analyzer-client.tsx` (the full analyzer moved into the directory the index already expected, plus a local saved-analyses history in IndexedDB).
- **New page:** `/dashboard/planning` (plan → smart schedule → calendar; footer link). `/dashboard/brand-analysis` gained the missing input that starts an analysis.
- **Type errors:** `npm run typecheck` runs `tsc` for the app **and** `tsconfig.edge.json` for the Supabase Edge Functions (Deno shim in `supabase/functions/deno-shim.d.ts`). Both report 0 errors. Notable root causes: untyped `useState([])`, a component and its type sharing a name, objects rendered as React children (brand recommendations), invalid chart/WaveSurfer options, missing `format` import, loosely typed colour maps.
