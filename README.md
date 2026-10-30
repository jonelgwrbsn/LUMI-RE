# LUMIÈRE 35MM — Analogue Photobooth & Darkroom Studio

**Lumière 35mm** is a full-stack vintage 35mm film photobooth and darkroom composition studio built with React 19, TypeScript, Tailwind CSS v4, HTML5 2D Canvas, Web Audio API, and Express.

It recreates the tactile rituals of mechanical chemical photobooths—from rangefinder framing, flash capacitor whine, and two-curtain focal-plane shutter acoustics to 35mm film color science, darkroom paper fiber stocks, non-destructive optical effects, editorial vector stickers, and 300/600 DPI physical print-sheet generation.

---

## Table of Contents

- [Key Features](#key-features)
  - [1. Camera Booth & Rangefinder Capture](#1-camera-booth--rangefinder-capture)
  - [2. Synthesized Web Audio Mechanical Sound Engine](#2-synthesized-web-audio-mechanical-sound-engine)
  - [3. 35mm Film Emulation & Optical Darkroom Effects](#3-35mm-film-emulation--optical-darkroom-effects)
  - [4. Photographic Layout & Paper Stock System](#4-photographic-layout--paper-stock-system)
  - [5. Editorial Vector Sticker Studio & Captions](#5-editorial-vector-sticker-studio--captions)
  - [6. Print-Ready Export, Super-Resolution & QR Sharing](#6-print-ready-export-super-resolution--qr-sharing)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running in Development](#running-in-development)
  - [Building for Production](#building-for-production)
  - [Running Tests & Type Checks](#running-tests--type-checks)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [API Reference](#api-reference)
- [License](#license)

---

## Key Features

### 1. Camera Booth & Rangefinder Capture
- **Hardware WebRTC Camera & Multi-Device Selector**: Supports front/rear mobile lenses and desktop webcams with progressive constraint fallback (`1280×720` HD → device default → universal video stream).
- **Live 35mm Studio Camera Fallback**: Includes a real-time animated 35mm studio subject canvas with 3 selectable poses (*Editorial Portrait*, *Candid Motion*, *Archive Close-Up*) so users can test burst sequences, framing, and darkroom workflows even without a physical webcam attached.
- **Native Mobile Camera & Gallery Upload**: Direct `<input capture="user">` integration for mobile browsers and multi-file drag-and-drop photo import.
- **Rangefinder Composition Guides**: Toggleable live viewfinder overlays (`Off`, `3×3 Rule-of-Thirds Grid`, `Center Crosshair & Strip Crop Markers`, or `Grid + Center Combined`) calibrated for strip cropping.
- **Self-Timer & Multi-Shot Burst**: Configurable `3s`, `5s`, or `10s` countdown timers with single-shot capture or automatic 3-frame / 4-frame booth sequences.

### 2. Synthesized Web Audio Mechanical Sound Engine
Zero external MP3/WAV dependencies—all acoustic cues are synthesized in real time via the browser's native **Web Audio API** (`src/utils/soundEffects.ts`) with persistent global mute/unmute controls:
1. **35mm Focal-Plane Shutter Clack**: Two-curtain mechanical travel transient, mirror-box slap resonance, and metallic spring tail.
2. **Piezo Self-Timer Beeps**: Classic `1100 Hz` countdown ticks culminating in a `1650 Hz` final-second shutter warning tone.
3. **Mechanical Film Advance Lever & Sprocket Ratchet**: Played during the `FilmAdvanceOverlay` transition between the camera booth and darkroom editor—combines a 10-tooth sprocket ratchet click train, celluloid perforation slide friction, spool winder gear torque whir, and a spring-loaded lever return latch.
4. **Xenon Strobe Flash Capacitor Charge**: Characteristic ascending `1800 Hz → 5800 Hz` high-voltage transformer whine after each burst discharge.
5. **Tactile Darkroom Controls & Print Chute Eject**: Crisp mechanical micro-switch clicks when toggling presets/layouts and a motorized paper-feed roller + guillotine cutter thud on export.

### 3. 35mm Film Emulation & Optical Darkroom Effects
- **19 Calibrated Film Stock Presets**:
  - *Original Studio*, *Kodak Gold 200*, *Kodak Portra 400*, *Ilford HP5 Plus 400 (B&W)*, *Kodak Tri-X 400*, *Polaroid 600 Instant*, *1890s Warm Sepia*, *1970s Faded Nostalgia*, *Fujifilm Superia 400*, *CineStill 800T Tungsten*, *Agfa Vista 200*, *LomoChrome Purple*, *Warm Golden Hour*, *Faded Matte Editorial*, *High-Contrast Street*, *Soft Pastel Portra*, *Cool Cyanotype*, *Cross-Processed Slide*, and *bleach Bypass Silver*.
- **9 Real-Time Optical Effects**:
  - **Film Grain** (`0–100%`)
  - **Vignette Falloff** (`0–100%`)
  - **Light Leak Overlay** (`None`, `Warm Amber`, `Crimson Edge`, `Vintage Cyan`, `Golden Streak`, `prism Rainbow`, `Twin Sunburst`)
  - **CineStill Red Halation** (`0–100%`)
  - **Pro-Mist Highlight Bloom** (`0–100%`)
  - **Archival Dust & Scratches** (`0–100%`)
  - **Optical Chromatic Aberration** (`0–100%`)
  - **CRT / Camcorder Scanlines** (`0–100%`)
  - **1990s Quartz LED Date Stamp** (`'98 10 24` orange 7-segment phosphor imprint)
- **Batch Apply or Per-Frame Grading**: Apply film stocks and optical effects across the entire strip simultaneously (`Batch: All Frames`) or grade each individual frame (`Single Frame #1–#4`).

### 4. Photographic Layout & Paper Stock System
- **12 Professional Print Layouts**:
  - `3-Frame Strip`, `4-Frame Strip`, `2×2 Grid Collage`, `Horizontal Strip`, `Classic Photo Booth`, `Contact Sheet`, `Editorial Print`, `Instant Print`, `Square Contact Grid`, `Film Negative Strip`, `Minimal Gallery Print`, and `Polaroid-Style Grid`.
- **8 Darkroom Paper Stock Simulations**:
  - `Fine Art Matte`, `Glossy Photo`, `Lustre Pearl`, `Archival Cream`, `Darkroom Black`, `Pure White`, `Warm Ivory`, and `Soft Gray`—each with adjustable paper fiber texture (`Fine Cotton Rag`, `Silver Halide Pebble`, `Laid Linen`, or `None`) and texture intensity (`0–100%`).
- **Granular Frame & Margin Controls**:
  - Frame aspect ratio (`Default`, `1:1 Square`, `4:3 Classic`, `3:4 Portrait`, `16:9 Cinema`, `3:2 35mm Full`), border thickness, frame gap (`8–60 px`), outer margin (`16–90 px`), corner style (`Sharp`, `Soft Rounded`, `Archival Pill`), portrait/landscape orientation, negative frame numbering (`01A`, `02A`...), 35mm sprocket-hole borders, custom header/footer typography, and per-photo non-destructive pan/zoom crop adjustment.

### 5. Editorial Vector Sticker Studio & Captions
- **6 Curated Vector Sticker Categories**: *35mm Film & Darkroom*, *Wax Seals & Stamps*, *Botanical & Editorial*, *Retro Booth Badges*, *Tape & Paper Scraps*, and *Hand-Drawn Accents*.
- **Interactive Direct Manipulation**: Drag, pinch-to-zoom, two-finger rotate (via Hammer.js + custom pointer handles), layer ordering, opacity, horizontal flip, and 30-step Undo/Redo history (`Ctrl/Cmd + Z` / `Ctrl/Cmd + Y`).
- **Custom Strip Captions**: Add bottom-margin editorial notes, dates, and locations in *Playfair Display Serif*, *DM Sans*, *JetBrains Mono*, or *Caveat Handwritten* fonts.

### 6. Print-Ready Export, Super-Resolution & QR Sharing
- **Single Shared High-Resolution Composition Renderer**: Identical pixel-accurate rendering pipeline across the live darkroom preview, PNG/JPEG/WebP download, physical print sheet, and QR share view.
- **Physical Print Sheet Generator**: Supports `2×6" Booth Strip`, `4×6" Postcard (Dual 2×6" Cut Sheet)`, `5×7" Enlargement`, `8×10" Portrait Sheet`, and `A4 Contact Sheet` at `300 DPI` or `600 DPI` with optional crop marks and `3mm` print bleed.
- **Optical Super-Resolution (`2×` / `4×`)**: Upscale individual frames with high-precision Lanczos resampling, luminance unsharp masking, and optional neural parameter calibration, complete with an interactive Before/After split-screen loupe.
- **Instant QR Code & Link Sharing**: Generate a scannable QR code and temporary share URL (`/share/:id`) for instant mobile downloads.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Typography** | Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons, Google Fonts (*Playfair Display*, *DM Sans*, *JetBrains Mono*, *Caveat*) |
| **Graphics & Rendering** | HTML5 2D Canvas API (non-destructive multi-pass compositor, procedural film grain, paper fiber textures, 300/600 DPI print renderer) |
| **Audio Synthesis** | Web Audio API (real-time procedural mechanical shutter, sprocket ratchet, piezo timer, flash capacitor whine, and paper eject) |
| **Touch & Gestures** | Hammer.js + native Pointer Events |
| **Backend Server** | Node.js, Express 4 (`server.ts` serving API endpoints + Vite middleware in dev / static bundle in prod) |
| **Testing** | Node.js native test runner (`node:test` + `node:assert/strict` executed via `tsx`) |

---

## Getting Started

### Prerequisites
- **Node.js** `>= 18.0.0` (Node 20+ recommended)
- **npm** `>= 9.0.0` (or `pnpm` / `bun`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lumiere-35mm-photobooth.git
   cd lumiere-35mm-photobooth
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

### Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `3000` | Port for the Express + Vite server. |
| `APP_URL` | No | `http://localhost:3000` | Public base URL used when encoding QR code share links (`/share/:id`). |
| `GEMINI_API_KEY` | No | `""` | Optional API key for neural optical calibration in the Super-Resolution modal. When omitted, Lumière automatically uses its built-in local Lanczos & unsharp-mask super-resolution engine. |

### Running in Development

Start the full-stack development server (Express API + Vite frontend):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Compile the frontend assets and bundle the Express server into `dist/`:

```bash
npm run build
npm start
```

### Running Tests & Type Checks

Run the TypeScript compiler check and unit test suites:

```bash
# Type-check the entire project
npm run lint

# Run unit tests for layout geometry, paper profiles, and vector sticker transforms
npm test
```

---

## Keyboard Shortcuts

### Camera Booth View
| Key | Action |
| :--- | :--- |
| `Space` | Trigger single photo capture |
| `B` | Start multi-photo burst sequence |
| `C` | Switch between Hardware Camera and Live 35mm Studio Camera |
| `G` | Cycle rangefinder composition guide (`Off` → `3×3 Grid` → `Crosshair` → `Combined`) |
| `Esc` | Cancel active countdown or burst sequence |

### Darkroom Editor View
| Key | Action |
| :--- | :--- |
| `Delete` / `Backspace` | Delete currently selected sticker |
| `Ctrl/Cmd + Z` | Undo last sticker transformation |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo sticker transformation |
| `Esc` | Deselect active sticker or close modal |

---

## Project Architecture & Directory Structure

```text
lumiere-35mm-photobooth/
├── index.html                        # Application HTML entry point & typography imports
├── server.ts                         # Express server: QR share persistence & optical super-resolution API
├── vite.config.ts                    # Vite + Tailwind v4 configuration
├── package.json                      # Scripts & dependency manifest
├── .env.example                      # Sample environment configuration
├── docs/
│   └── ARCHITECTURE.md               # Detailed rendering pipeline & sound synthesis documentation
└── src/
    ├── main.tsx                      # React DOM root mount & URL router (/ and /share/:id)
    ├── App.tsx                       # Workflow state machine (Landing -> Camera -> FilmAdvance -> Editor)
    ├── index.css                     # Tailwind CSS v4 entry & custom darkroom scrollbars
    ├── types/
    │   └── photobooth.ts             # Core TypeScript interfaces for photos, presets, layouts, and paper
    ├── components/
    │   ├── TopBar.tsx                # Navigation header, Studio Audio toggle & session reset
    │   ├── LandingPage.tsx           # Editorial hero showcase & interactive sample strip preview
    │   ├── CameraCapture.tsx         # WebRTC booth, Live 35mm Studio fallback, burst timer & shot reel
    │   ├── FilmAdvanceOverlay.tsx    # Synchronized mechanical film-wind transition & sprocket animation
    │   ├── PhotoEditor.tsx           # Darkroom editor workspace & live interactive canvas preview
    │   ├── LayoutAndPaperPanel.tsx   # 12 layouts, 8 paper stocks, margins, sprocket holes & crop controls
    │   ├── StickerStudioPanel.tsx    # Vector sticker browser, layer manager & transform sliders
    │   ├── TouchGestureOverlay.tsx   # Pointer/touch manipulation handles for stickers on the live canvas
    │   ├── ImageEnhancerModal.tsx    # 2x/4x optical super-resolution modal with Before/After slider
    │   ├── ExportModal.tsx           # High-res PNG/JPEG/WebP & 300/600 DPI print sheet exporter
    │   ├── PrintModal.tsx            # Dedicated browser print sheet generator with crop/bleed marks
    │   └── ShareModal.tsx            # QR code generator & share link manager
    ├── pages/
    │   └── SharedStripPage.tsx       # Public standalone viewer for QR-shared photo strips (/share/:id)
    └── utils/
        ├── canvasRenderer.ts         # Unified high-DPI 2D Canvas compositor for preview, print & export
        ├── filterEngine.ts           # 19 analog film presets & 9 optical effects definitions
        ├── layoutAndPaper.ts         # Layout geometry calculator, paper stock profiles & print sizing
        ├── layoutAndPaper.test.ts    # Unit tests for layout geometry, aspect-ratio crop & print DPI
        ├── soundEffects.ts           # Web Audio API synthesizer (shutter, film advance, flash, clicks)
        ├── cameraPermissions.ts      # WebRTC constraint fallback engine & error diagnostics
        ├── compositionGuide.ts       # Rangefinder overlay cycle & SVG geometry helpers
        ├── imageUpscaler.ts          # Client-side Lanczos-style upscaling & unsharp mask processor
        ├── stickerLibrary.ts         # Curated vector sticker catalog & undo/redo state manager
        ├── stickerLibrary.test.ts    # Unit tests for sticker geometry & history stack
        └── stickerRenderer.ts        # Procedural 2D Canvas vector renderer for all sticker types
```

For an in-depth technical walkthrough of the rendering pipeline, coordinate system, and Web Audio synthesis graphs, see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## API Reference

The Express server (`server.ts`) exposes the following JSON endpoints:

### `POST /api/share`
Saves a rendered photo strip and returns a unique 8-character share ID and full URL for QR code scanning.
- **Request Body:**
  ```json
  {
    "imageData": "data:image/png;base64,...",
    "title": "Lumière 35mm Strip",
    "layout": "classic-booth"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "id": "a1b2c3d4",
    "shareUrl": "http://localhost:3000/share/a1b2c3d4",
    "createdAt": "2026-10-30T10:00:00.000Z"
  }
  ```

### `GET /api/share/:id`
Retrieves a previously shared photo strip by its ID.

### `DELETE /api/share/:id`
Permanently removes a shared photo strip from memory and disk (`data/shares.json`).

### `POST /api/enhance`
Computes calibrated optical super-resolution parameters (`sharpenAmount`, `contrastBoost`, `shadowLift`, `highlightRecovery`, `warmthShift`, `denoiseStrength`) for the `2×`/`4×` super-resolution pipeline.

---

## Contributing

Contributions, bug reports, and new film stock presets are welcome! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines on adding new film emulations, layout presets, or vector stickers.

---

## License

Released under the **MIT License**.
