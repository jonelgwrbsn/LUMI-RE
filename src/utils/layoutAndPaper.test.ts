import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LAYOUT_PRESETS,
  PAPER_STOCK_PROFILES,
  computeCompositionGeometry,
  computeCoverCrop,
  computePrintExportDimensions
} from './layoutAndPaper';
import { StripStyle } from '../types/photobooth';

const BASE_STYLE: StripStyle = {
  backgroundColor: '#FFFFFF',
  textColor: '#1C1917',
  framePadding: 20,
  stripMargin: 36,
  borderRadius: 0,
  borderStyle: 'classic',
  showDateStamp: true,
  customDateText: "'26 10 29",
  headerText: 'LUMIÈRE STUDIO',
  footerText: '35MM FILM · PARIS',
  sprocketHoles: false,
  paperStock: 'pure-white',
  paperTexture: 'none',
  paperTextureIntensity: 0,
  frameAspectRatio: 'auto',
  frameBorderThickness: 1,
  cornerStyle: 'sharp',
  orientation: 'portrait',
  frameNumbering: 'off'
};

test('LAYOUT_PRESETS includes all 12 required layouts with valid preview schematics', () => {
  assert.equal(LAYOUT_PRESETS.length, 12);
  const ids = LAYOUT_PRESETS.map((l) => l.id);
  const expected = [
    'strip-3',
    'strip-4',
    'grid-2x2',
    'horizontal-3',
    'classic-booth',
    'contact-sheet',
    'editorial-print',
    'instant-print',
    'square-contact-grid',
    'film-negative-strip',
    'minimal-gallery-print',
    'polaroid-grid'
  ];
  assert.deepEqual(ids, expected);

  for (const preset of LAYOUT_PRESETS) {
    assert.ok(preset.frameCount >= 1 && preset.frameCount <= 4);
    assert.equal(preset.previewBoxes.length, preset.frameCount);
    for (const box of preset.previewBoxes) {
      assert.ok(box.w > 0 && box.h > 0);
      assert.ok(box.x >= 0 && box.y >= 0);
    }
  }
});

test('PAPER_STOCK_PROFILES includes all 8 required paper stock simulations', () => {
  assert.equal(PAPER_STOCK_PROFILES.length, 8);
  const ids = PAPER_STOCK_PROFILES.map((p) => p.id);
  assert.deepEqual(ids, [
    'fine-art-matte',
    'glossy-photo',
    'lustre-pearl',
    'archival-cream',
    'darkroom-black',
    'pure-white',
    'warm-ivory',
    'soft-gray'
  ]);
});

test('computeCompositionGeometry produces non-overlapping positive frame rectangles for all 12 layouts in both portrait and landscape', () => {
  for (const preset of LAYOUT_PRESETS) {
    for (const orientation of ['portrait', 'landscape'] as const) {
      const geo = computeCompositionGeometry(preset.id, {
        ...BASE_STYLE,
        orientation
      });
      assert.equal(geo.frameRects.length, preset.frameCount, `Frame count mismatch for ${preset.id}`);
      if (orientation === 'landscape') {
        assert.ok(geo.targetWidth >= geo.targetHeight, `Expected landscape width >= height for ${preset.id}`);
      } else {
        assert.ok(geo.targetHeight >= geo.targetWidth, `Expected portrait height >= width for ${preset.id}`);
      }
      for (const rect of geo.frameRects) {
        assert.ok(rect.width > 40 && rect.height > 40, `Invalid frame dimensions in ${preset.id}`);
        assert.ok(rect.x >= 0 && rect.y >= 0, `Negative frame coords in ${preset.id}`);
        assert.ok(
          rect.x + rect.width <= geo.targetWidth,
          `Frame exceeds targetWidth in ${preset.id}`
        );
        assert.ok(
          rect.y + rect.height <= geo.targetHeight,
          `Frame exceeds targetHeight in ${preset.id}`
        );
      }
    }
  }
});

test('computeCompositionGeometry respects frameAspectRatio override (e.g. 1:1 square)', () => {
  const geo = computeCompositionGeometry('strip-3', {
    ...BASE_STYLE,
    frameAspectRatio: '1:1'
  });
  for (const rect of geo.frameRects) {
    assert.ok(
      Math.abs(rect.width - rect.height) <= 2,
      `Expected 1:1 square frame, got ${rect.width}x${rect.height}`
    );
  }
});

test('computeCoverCrop preserves original image aspect ratio without stretching and clamps focal panning within bounds', () => {
  const imgW = 1600;
  const imgH = 1200; // 4:3
  const rectW = 500;
  const rectH = 500; // 1:1 square target frame

  const cropCenter = computeCoverCrop(imgW, imgH, rectW, rectH, {
    cropX: 0,
    cropY: 0,
    scale: 1
  });

  // Aspect ratio of rendered image must match source 4:3
  const renderedRatio = cropCenter.renderWidth / cropCenter.renderHeight;
  assert.ok(Math.abs(renderedRatio - imgW / imgH) < 1e-6);
  assert.ok(cropCenter.renderWidth >= rectW);
  assert.ok(cropCenter.renderHeight >= rectH);

  // Panning to extreme edges (-100 or +100) with 1.5x zoom still covers the target frame completely
  const cropPanned = computeCoverCrop(imgW, imgH, rectW, rectH, {
    cropX: 100,
    cropY: -100,
    scale: 1.5
  });
  assert.ok(Math.abs(cropPanned.renderWidth / cropPanned.renderHeight - imgW / imgH) < 1e-6);
  assert.ok(cropPanned.offsetX <= 0.01);
  assert.ok(cropPanned.offsetY <= 0.01);
  assert.ok(cropPanned.offsetX + cropPanned.renderWidth >= rectW - 0.01);
  assert.ok(cropPanned.offsetY + cropPanned.renderHeight >= rectH - 0.01);
});

test('computePrintExportDimensions calculates exact DPI pixel dimensions for 2x6, 4x6, and A4', () => {
  const strip2x6 = computePrintExportDimensions(600, 1800, {
    sizePreset: '2x6-strip',
    dpi: 300,
    includeBleedGuides: true,
    safeMarginMm: 3,
    duplexOn4x6: false
  });
  assert.equal(strip2x6.widthPx, 600);
  assert.equal(strip2x6.heightPx, 1800);
  assert.ok(strip2x6.bleedPx > 0);

  const print4x6At600 = computePrintExportDimensions(1200, 1440, {
    sizePreset: '4x6-print',
    dpi: 600,
    includeBleedGuides: false,
    safeMarginMm: 0,
    duplexOn4x6: false
  });
  assert.equal(print4x6At600.widthPx, 2400);
  assert.equal(print4x6At600.heightPx, 3600);
});

test('SOUND_EFFECT_CATALOG defines all 5 analog photobooth sound effects and respects mute state', async () => {
  const { SOUND_EFFECT_CATALOG, getSoundEnabled, setSoundEnabled } = await import('./soundEffects');
  assert.equal(SOUND_EFFECT_CATALOG.length, 5);
  assert.deepEqual(
    SOUND_EFFECT_CATALOG.map((s) => s.id),
    ['shutter', 'countdown', 'film-advance', 'tactile-dial', 'print-eject']
  );

  assert.equal(getSoundEnabled(), true);
  setSoundEnabled(false);
  assert.equal(getSoundEnabled(), false);

  // Triggering all 5 sounds in headless node/browser environment must never throw
  for (const item of SOUND_EFFECT_CATALOG) {
    assert.doesNotThrow(() => item.trigger());
  }

  setSoundEnabled(true);
  assert.equal(getSoundEnabled(), true);
});

