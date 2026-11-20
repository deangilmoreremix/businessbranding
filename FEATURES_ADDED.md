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
