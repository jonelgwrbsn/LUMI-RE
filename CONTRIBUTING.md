# Contributing to Lumière 35mm

Thank you for your interest in contributing to **Lumière 35mm**! This guide explains how to set up your development environment, run tests, and extend the photobooth's analog presets, layouts, and sticker library.

---

## Development Workflow

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/lumiere-35mm-photobooth.git
   cd lumiere-35mm-photobooth
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

3. **Run verification checks before submitting a Pull Request:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

---

## Extending Lumière 35mm

### Adding a New Film Preset
1. Open `src/types/photobooth.ts` and add the new preset identifier to the `FilmPreset` union type.
2. Open `src/utils/filterEngine.ts` and add a new entry to `FILM_PRESETS` with:
   - `id`, `name`, `tagline`, `description`, `iso`, `badgeColor`
   - `cssFilter`: Standard CSS filter string (`contrast()`, `saturate()`, `sepia()`, `brightness()`, `hue-rotate()`)
   - `overlayColor` and `overlayBlend`: Optional color cast layer (`soft-light`, `overlay`, `multiply`, `screen`)
   - `defaultGrain` and `defaultVignette`: Recommended baseline values (`0–100`).

### Adding a New Print Layout
1. Add the layout ID to `StripLayoutId` in `src/types/photobooth.ts`.
2. Add the layout metadata to `STRIP_LAYOUTS` in `src/utils/layoutAndPaper.ts`.
3. Update `computeLayoutGeometry()` in `src/utils/layoutAndPaper.ts` to compute the frame boxes for your layout.
4. Add a unit test in `src/utils/layoutAndPaper.test.ts` verifying the frame count, non-overlapping bounds, and aspect ratios.

### Adding a New Vector Sticker
1. Define the sticker metadata in `STICKER_CATALOG` inside `src/utils/stickerLibrary.ts`.
2. Implement its procedural 2D Canvas vector drawing routine in `src/utils/stickerRenderer.ts`.
3. Run `npm test` to verify the sticker library integrity tests pass.

---

## Code Style Guidelines
- **TypeScript Strictness**: Avoid `any`; define explicit interfaces in `src/types/photobooth.ts`.
- **Non-Destructive Editing**: Never mutate `CapturedPhoto.originalDataUrl`. All crops, film presets, paper textures, and stickers must be computed non-destructively during canvas composition.
- **Zero External Audio Assets**: Keep all sound effects synthesized via Web Audio API in `src/utils/soundEffects.ts`.
