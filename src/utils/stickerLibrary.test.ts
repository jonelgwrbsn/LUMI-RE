import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STICKER_CATEGORIES,
  EDITORIAL_STICKER_LIBRARY,
  EDITORIAL_INK_PALETTE,
  createStickerFromAsset,
  duplicateSticker,
  bringStickerForward,
  sendStickerBackward,
  pushStickerHistory,
  applyBatchFilterToPhotos,
  resolveFrameFilter
} from './stickerLibrary';
import { DEFAULT_ADJUSTMENTS, DEFAULT_FILM_EFFECTS } from './filterEngine';
import { CapturedPhoto } from '../types/photobooth';
import {
  COMPOSITION_GUIDE_MODES,
  cycleCompositionGuideMode,
  getCompositionGuideGeometry
} from './compositionGuide';
import {
  STUDIO_POSES,
  getNextStudioPoseIndex,
  getCameraConstraintFallbacks,
  requestCameraStreamWithFallback,
  diagnoseCameraError
} from './cameraPermissions';

test('curated sticker library covers all 6 required editorial categories without generic emojis', () => {
  const categoryIds = STICKER_CATEGORIES.map((c) => c.id);
  assert.deepEqual(categoryIds, [
    'film-lab',
    'fine-line',
    'film-frames',
    'editorial-type',
    'paper-ephemera',
    'date-location'
  ]);

  for (const catId of categoryIds) {
    const items = EDITORIAL_STICKER_LIBRARY.filter((a) => a.category === catId);
    assert.ok(items.length >= 4, `Expected at least 4 curated assets in ${catId}`);
  }

  assert.equal(EDITORIAL_INK_PALETTE.length, 5);
});

test('createStickerFromAsset and duplicateSticker manage zIndex and properties', () => {
  const labAsset = EDITORIAL_STICKER_LIBRARY[0];
  const s1 = createStickerFromAsset(labAsset, []);
  assert.equal(s1.assetId, labAsset.assetId);
  assert.equal(s1.zIndex, 1);
  assert.equal(s1.opacity, 1);

  const typeAsset = EDITORIAL_STICKER_LIBRARY.find((a) => a.category === 'editorial-type')!;
  const s2 = createStickerFromAsset(typeAsset, [s1]);
  assert.equal(s2.zIndex, 2);

  const { stickers, duplicated } = duplicateSticker([s1, s2], s1.id);
  assert.equal(stickers.length, 3);
  assert.ok(duplicated);
  assert.equal(duplicated.assetId, s1.assetId);
  assert.equal(duplicated.zIndex, 3);
});

test('bringStickerForward and sendStickerBackward reorder sticker layers', () => {
  const a1 = createStickerFromAsset(EDITORIAL_STICKER_LIBRARY[0], []);
  const a2 = createStickerFromAsset(EDITORIAL_STICKER_LIBRARY[1], [a1]);
  const a3 = createStickerFromAsset(EDITORIAL_STICKER_LIBRARY[2], [a1, a2]);

  const afterForward = bringStickerForward([a1, a2, a3], a1.id);
  assert.equal(afterForward[1].id, a1.id);
  assert.equal(afterForward[0].id, a2.id);

  const afterBackward = sendStickerBackward(afterForward, a3.id);
  assert.equal(afterBackward[1].id, a3.id);
  assert.equal(afterBackward[2].id, a1.id);
});

test('pushStickerHistory tracks undo and redo states and truncates redo branch on new action', () => {
  const a1 = createStickerFromAsset(EDITORIAL_STICKER_LIBRARY[0], []);
  const a2 = createStickerFromAsset(EDITORIAL_STICKER_LIBRARY[1], [a1]);

  let history = { stack: [[] as typeof a1[]], index: 0 };
  history = pushStickerHistory(history, [a1]);
  assert.equal(history.index, 1);
  assert.equal(history.stack[history.index].length, 1);

  history = pushStickerHistory(history, [a1, a2]);
  assert.equal(history.index, 2);

  // Simulate undo to index 1, then push a new state
  const undoneHistory = { ...history, index: 1 };
  const branchedHistory = pushStickerHistory(undoneHistory, []);
  assert.equal(branchedHistory.index, 2);
  assert.equal(branchedHistory.stack.length, 3);
  assert.equal(branchedHistory.stack[2].length, 0);
});

test('Batch Apply vs Individual Frame filter resolution works accurately', () => {
  const samplePhotos: CapturedPhoto[] = [
    { id: 'p1', dataUrl: 'data:image/png;base64,1', timestamp: 1 },
    { id: 'p2', dataUrl: 'data:image/png;base64,2', timestamp: 2 }
  ];

  // Apply Noir 400 to all photos via batch helper
  const synced = applyBatchFilterToPhotos(
    samplePhotos,
    'noir-400',
    DEFAULT_ADJUSTMENTS['noir-400'],
    DEFAULT_FILM_EFFECTS
  );
  assert.equal(synced[0].frameOverride?.preset, 'noir-400');
  assert.equal(synced[1].frameOverride?.preset, 'noir-400');

  // Customize frame 2 with 'cinestill-glow'
  synced[1] = {
    ...synced[1],
    frameOverride: {
      preset: 'cinestill-glow',
      adjustments: DEFAULT_ADJUSTMENTS['cinestill-glow'],
      filmEffects: DEFAULT_FILM_EFFECTS
    }
  };

  // When batchApply is false, frame 2 resolves to cinestill-glow
  const perFrameResolved = resolveFrameFilter(
    synced[1],
    false,
    'warm-film',
    DEFAULT_ADJUSTMENTS['warm-film'],
    DEFAULT_FILM_EFFECTS
  );
  assert.equal(perFrameResolved.preset, 'cinestill-glow');

  // When batchApply is true, frame 2 resolves to the global preset ('warm-film')
  const batchResolved = resolveFrameFilter(
    synced[1],
    true,
    'warm-film',
    DEFAULT_ADJUSTMENTS['warm-film'],
    DEFAULT_FILM_EFFECTS
  );
  assert.equal(batchResolved.preset, 'warm-film');
});

test('Composition guide modes cycle and compute accurate 3x3 and 1:1 strip crop geometry', () => {
  assert.equal(COMPOSITION_GUIDE_MODES.length, 4);
  assert.equal(cycleCompositionGuideMode('off'), 'grid');
  assert.equal(cycleCompositionGuideMode('grid'), 'center');
  assert.equal(cycleCompositionGuideMode('center'), 'both');
  assert.equal(cycleCompositionGuideMode('both'), 'off');

  const gridGeo = getCompositionGuideGeometry('grid', 4 / 3);
  assert.equal(gridGeo.showRuleOfThirds, true);
  assert.equal(gridGeo.showCenterLines, false);
  assert.equal(gridGeo.showStripCropSafeZone, true);
  assert.deepEqual(gridGeo.thirds, [0.3333, 0.6667]);
  assert.deepEqual(gridGeo.squareCropSafeX, [0.125, 0.875]);

  const centerGeo = getCompositionGuideGeometry('center', 4 / 3);
  assert.equal(centerGeo.showRuleOfThirds, false);
  assert.equal(centerGeo.showCenterLines, true);
  assert.equal(centerGeo.center, 0.5);

  const offGeo = getCompositionGuideGeometry('off', 4 / 3);
  assert.equal(offGeo.showRuleOfThirds, false);
  assert.equal(offGeo.showCenterLines, false);
  assert.equal(offGeo.showStripCropSafeZone, false);
});

test('requestCameraStreamWithFallback and studio pose cycling work reliably', async () => {
  const fallbacks = getCameraConstraintFallbacks('user');
  assert.equal(fallbacks.length, 3);

  const deviceFallbacks = getCameraConstraintFallbacks('environment', 'cam-device-123');
  assert.equal(deviceFallbacks.length, 4);

  let attempts = 0;
  const mockStream = { id: 'mock-stream' } as unknown as MediaStream;
  const recovered = await requestCameraStreamWithFallback(async () => {
    attempts += 1;
    if (attempts === 1) {
      const err = new Error('Resolution not supported');
      err.name = 'OverconstrainedError';
      throw err;
    }
    return mockStream;
  }, 'user');

  assert.equal(attempts, 2);
  assert.equal(recovered, mockStream);

  // Verify NotAllowedError does not spam 3 permission prompts
  let deniedAttempts = 0;
  await assert.rejects(async () => {
    await requestCameraStreamWithFallback(async () => {
      deniedAttempts += 1;
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw err;
    }, 'environment');
  });
  assert.equal(deniedAttempts, 1);

  const diag = diagnoseCameraError({ name: 'NotAllowedError', message: 'Permission denied' });
  assert.equal(diag.kind, 'permission_denied');
  assert.equal(diag.canRetryPopup, true);
  assert.ok(diag.browserHint.length > 0);

  // Studio pose cycling
  assert.equal(STUDIO_POSES.length, 3);
  assert.equal(getNextStudioPoseIndex(0), 1);
  assert.equal(getNextStudioPoseIndex(1), 2);
  assert.equal(getNextStudioPoseIndex(2), 0);
});



