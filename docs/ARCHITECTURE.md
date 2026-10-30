# Lumière 35mm — Architecture & Technical Guide

This document details the internal architecture of **Lumière 35mm**, including its non-destructive 2D Canvas composition pipeline, layout geometry solver, Web Audio API mechanical sound synthesizer, and WebRTC camera fallback architecture.

---

## 1. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Browser Client (SPA)                            │
│                                                                             │
│  ┌───────────────┐   ┌─────────────────┐   ┌─────────────────────────────┐  │
│  │  LandingPage  │──▶│  CameraCapture  │──▶│    FilmAdvanceOverlay       │  │
│  └───────────────┘   │ (WebRTC + Live  │   │ (Sprocket Animation +       │  │
│                      │  35mm Fallback) │   │  3-Stage Mechanical Audio)  │  │
│                      └─────────────────┘   └──────────────┬──────────────┘  │
│                                                           │                 │
│                                                           ▼                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          PhotoEditor Workspace                        │  │
│  │  ┌─────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │  │
│  │  │ LayoutAndPaperPanel │  │ Film & FX Controls │  │ Sticker Studio │  │  │
│  │  └──────────┬──────────┘  └─────────┬──────────┘  └───────┬────────┘  │  │
│  │             └───────────────────────┼─────────────────────┘           │  │
│  │                                     ▼                                 │  │
│  │            ┌─────────────────────────────────────────────────┐        │  │
│  │            │   Single Shared Canvas Compositor               │        │  │
│  │            │   (src/utils/canvasRenderer.ts)                 │        │  │
│  │            └───────┬─────────────────┬───────────────┬───────┘        │  │
│  └────────────────────┼─────────────────┼───────────────┼────────────────┘  │
│                       ▼                 ▼               ▼                   │
│               ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│               │  ExportModal  │ │  PrintModal   │ │  ShareModal   │         │
│               │ (PNG/JPG/WebP)│ │ (300/600 DPI) │ │ (QR + Link)   │         │
│               └───────────────┘ └───────────────┘ └───────┬───────┘         │
└───────────────────────────────────────────────────────────┼─────────────────┘
                                                            │ HTTP / JSON
┌───────────────────────────────────────────────────────────▼─────────────────┐
│                         Express Backend (server.ts)                         │
│  • POST /api/share       -> Persists shared strips to data/shares.json      │
│  • GET  /api/share/:id   -> Serves shared strip metadata & image data       │
│  • DELETE /api/share/:id -> Deletes shared strip                            │
│  • POST /api/enhance     -> Calibrates optical super-resolution parameters  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Unified Non-Destructive Composition Pipeline (`src/utils/canvasRenderer.ts`)

A core architectural invariant of Lumière 35mm is that **the live preview, downloaded image, physical print sheet, and QR-shared image all execute the exact same rendering function**: `renderPhotoboothComposition()`.

### Rendering Order (Back-to-Front)
1. **Paper Stock Base Layer**:
   - Fills the canvas with the selected paper stock base color (`Fine Art Matte`, `Glossy Photo`, `Lustre Pearl`, `Archival Cream`, `Darkroom Black`, `Pure White`, `Warm Ivory`, `Soft Gray`, or user custom hex).
   - Generates procedural paper fiber micro-textures (`fine-matte` cotton rag, `silver-pearl` stipple, `laid-linen` crosshatch) scaled proportionally to the target export multiplier (`exportScale`) and modulated by `paperTextureIntensity` (`0–100%`).
   - Adds subtle optical sheen gradients for `Glossy Photo` and `Lustre Pearl` stocks without altering the photographs themselves.

2. **35mm Sprocket Holes & Film Edge Markings**:
   - When `showSprocketHoles` is active (or inherently enabled by `Film Negative Strip`), precision-punched sprocket perforations and `LUMIÈRE SAFETY FILM 35MM` edge codes are drawn along the outer rails.

3. **Frame Geometry & Non-Destructive Crop (`computeLayoutGeometry`)**:
   - `src/utils/layoutAndPaper.ts` computes the exact canvas dimensions (`width`, `height`) and an array of `FrameBox` rectangles (`x`, `y`, `width`, `height`, `rotation`) for all 12 layouts in both `portrait` and `landscape` orientations.
   - Each photograph is cropped into its target `FrameBox` using `computeSourceCropRect()` (`object-fit: cover` math with non-destructive pan `offsetX`/`offsetY` in `[-100, 100]` and `zoom` in `[1.0, 2.5]`), guaranteeing zero aspect-ratio stretching when switching layouts.

4. **Per-Frame Film Emulation & Optical Effects**:
   - Each frame supports either global batch settings (`batchApply: true`) or independent per-frame `PhotoFrameAdjustments` (`preset`, `effects`).
   - CSS/Canvas filter matrices apply the selected film stock (`src/utils/filterEngine.ts`), followed by procedural passes for:
     - **CineStill Halation**: Warm red-orange edge glow around highlights.
     - **Pro-Mist Highlight Bloom**: Soft atmospheric diffusion.
     - **Light Leaks**: Multi-stop directional gradients (`screen` blend mode).
     - **Optical Chromatic Aberration**: Red/cyan lateral channel offset at frame edges.
     - **Archival Dust, Scratches & Scanlines**: Deterministic pseudo-random emulsion artifacts seeded per frame index so particles never flicker across re-renders.
     - **Film Grain & Vignette**: Luminance noise overlay and radial corner darkening.
     - **1990s Quartz LED Date Stamp**: Double-pass glowing orange 7-segment date imprint.

5. **Frame Borders, Corner Radius & Negative Numbering**:
   - Applies configurable border thickness (`0–24 px`), corner styles (`sharp`, `rounded`, `pill`), and archival frame numbers (`01A`, `02A`, etc.).

6. **Header, Footer & Editorial Captions**:
   - Renders header badges, footer notes, and user captions with automatic contrast adaptation for dark paper stocks (`Darkroom Black`, `Film Negative Strip`).

7. **Vector Stickers (`src/utils/stickerRenderer.ts`)**:
   - Stickers are stored in normalized strip coordinates (`x: 0..1`, `y: 0..1`) and rendered via resolution-independent 2D Canvas vector paths so they stay razor-sharp at 600 DPI.

---

## 3. Print-Ready Sheet Composition (`renderPrintReadyOutput`)

For physical printing (`ExportModal` and `PrintModal`), `computePrintTargetPixels()` calculates exact pixel dimensions from physical inches and target DPI (`300 DPI` or `600 DPI`), plus optional `3mm` bleed (`0.118 in` per side):

| Print Preset | Physical Size | 300 DPI Dimensions | 600 DPI Dimensions | Special Handling |
| :--- | :--- | :--- | :--- | :--- |
| `strip-2x6` | `2" × 6"` | `600 × 1800 px` | `1200 × 3600 px` | Single booth strip |
| `print-4x6` | `4" × 6"` | `1200 × 1800 px` | `2400 × 3600 px` | Automatically places **two** `2×6"` strips side-by-side with a center dashed cut line when using vertical strip layouts |
| `print-5x7` | `5" × 7"` | `1500 × 2100 px` | `3000 × 4200 px` | Centered archival enlargement |
| `print-8x10` | `8" × 10"` | `2400 × 3000 px` | `4800 × 6000 px` | Studio portfolio sheet |
| `sheet-a4` | `8.27" × 11.69"` | `2481 × 3507 px` | `4962 × 7014 px` | Full A4 sheet with crop marks |

---

## 4. Web Audio API Mechanical Sound Engine (`src/utils/soundEffects.ts`)

All sound effects are procedurally generated using Web Audio API nodes (`OscillatorNode`, `AudioBufferSourceNode`, `BiquadFilterNode`, `GainNode`) without external audio files:

- **`playMechanicalShutterSound()`**: Combines a first-curtain travel click (bandpass-filtered noise burst at `1900 Hz`), mirror slap body thump (`155 Hz → 48 Hz` pitch drop), and second-curtain metallic spring ring (`3400 Hz` + `5100 Hz` sine harmonics).
- **`playCountdownTickSound(secondsRemaining)`**: Generates a short piezo rangefinder beep (`1100 Hz` on normal ticks, `1650 Hz` on the final `1s` warning tick).
- **`playFilmAdvanceSound()`**: A 3-stage mechanical 35mm transport sequence:
  1. *Sprocket Ratchet Train*: 10 accelerating micro-clicks (`2400–3500 Hz` bandpass) + celluloid perforation slide hiss (`1450 Hz`).
  2. *Spool Winder Gear Whir*: Frequency-modulated triangle wave (`145 Hz → 295 Hz → 210 Hz`) simulating manual thumb-lever torque.
  3. *Return Latch Clack*: Dual-transient metallic latch (`2900 Hz` + `140 Hz` body stop) as the lever springs home.
- **`playFlashChargeSound()`**: Classic exponential capacitor charge whine (`1800 Hz → 5800 Hz` over `680 ms`) triggered after a multi-shot burst finishes.
- **`playTactileClickSound(variant)`**: Subtle `18–24 ms` mechanical detent click for preset selection and UI toggles.
- **`playPrintEjectSound()`**: Stepper motor pulse train (`28 Hz` AM-modulated roller noise) followed by a paper cutter blade thud (`190 Hz → 52 Hz`).

---

## 5. Camera Permissions & Resilient Fallback (`src/utils/cameraPermissions.ts`)

WebRTC camera access across desktop browsers, mobile webviews, and embedded iframes can fail for several distinct reasons (`NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`).

`requestCameraStreamWithFallback()` tries progressive constraint profiles:
1. Exact preferred `deviceId` at `1280×720`
2. Preferred `facingMode` (`user` / `environment`) at `1280×720`
3. Basic `facingMode` without resolution constraints
4. Universal `{ video: true, audio: false }`

If hardware access is unavailable or denied, `CameraCapture.tsx` provides:
- **Diagnostic Recovery UI**: Clear instructions to re-trigger the browser permission prompt (`Allow Camera Access`), open the native mobile camera (`Phone Camera`), or upload existing files.
- **Live 35mm Studio Camera**: A real-time 60fps canvas-rendered studio scene with 3 selectable poses that automatically cycle during multi-shot bursts (`getNextStudioPoseIndex()`), ensuring every feature of the photobooth works seamlessly on any device.
