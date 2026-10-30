import {
  CustomSticker,
  StickerCategory,
  StickerFontFamily,
  CapturedPhoto,
  FilterPreset,
  FilterAdjustments,
  FilmEffectsState,
  FrameFilterOverride
} from '../types/photobooth';

export interface EditorialInkColor {
  id: string;
  name: string;
  hex: string;
}

export const EDITORIAL_INK_PALETTE: EditorialInkColor[] = [
  { id: 'charcoal', name: 'Charcoal Ink', hex: '#1C1917' },
  { id: 'burgundy', name: 'Muted Burgundy', hex: '#6B2D38' },
  { id: 'olive', name: 'Faded Olive', hex: '#5C6450' },
  { id: 'amber', name: 'Subdued Amber', hex: '#B46927' },
  { id: 'ivory', name: 'Warm Ivory', hex: '#F7F3E9' }
];

export interface StickerCategoryMeta {
  id: StickerCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export const STICKER_CATEGORIES: StickerCategoryMeta[] = [
  {
    id: 'film-lab',
    label: 'Film Lab',
    shortLabel: 'Film Lab',
    description: '35MM labels, frame numbers, developed-film stamps, archive & studio marks'
  },
  {
    id: 'fine-line',
    label: 'Fine-Line Graphics',
    shortLabel: 'Fine-Line',
    description: 'Thin-line stars, hearts, botanical drawings, sparkles, arrows & ornaments'
  },
  {
    id: 'film-frames',
    label: 'Film Frames',
    shortLabel: 'Film Frames',
    description: 'Negative strips, sprocket-hole motifs, corner crop marks & contact-sheet details'
  },
  {
    id: 'editorial-type',
    label: 'Editorial Typography',
    shortLabel: 'Typography',
    description: 'Professionally typeset serif captions, typewriter labels, issue numbers & annotations'
  },
  {
    id: 'paper-ephemera',
    label: 'Paper Ephemera',
    shortLabel: 'Ephemera',
    description: 'Understated masking tape, archival paper labels, torn-paper notes & studio tags'
  },
  {
    id: 'date-location',
    label: 'Date & Location',
    shortLabel: 'Date / Loc',
    description: 'Editable date stamps, location labels, coordinates & camera timestamps'
  }
];

export interface StickerAssetDefinition {
  assetId: string;
  category: StickerCategory;
  type: CustomSticker['type'];
  label: string;
  defaultText?: string;
  defaultSubtext?: string;
  editableText: boolean;
  defaultFontFamily: StickerFontFamily;
  defaultFontSize: number;
  defaultLetterSpacing: number;
  defaultTextAlign: 'left' | 'center' | 'right';
  defaultColor: string;
  defaultBackgroundColor?: string;
  defaultSize: number;
  defaultRotation: number;
}

export const EDITORIAL_STICKER_LIBRARY: StickerAssetDefinition[] = [
  // ==========================================
  // 1. FILM LAB
  // ==========================================
  {
    assetId: 'lab-35mm-original',
    category: 'film-lab',
    type: 'stamp',
    label: '35MM Original',
    defaultText: '35MM ORIGINAL',
    defaultSubtext: 'ISO 400 · PROCESS C-41',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 12,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 64,
    defaultRotation: -2
  },
  {
    assetId: 'lab-frame-no',
    category: 'film-lab',
    type: 'stamp',
    label: 'Frame Number',
    defaultText: 'FRAME NO. 01A',
    defaultSubtext: '▶ KODAK SAFETY FILM',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 11,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'left',
    defaultColor: '#B46927',
    defaultSize: 62,
    defaultRotation: 0
  },
  {
    assetId: 'lab-film-developed',
    category: 'film-lab',
    type: 'stamp',
    label: 'Film Developed Seal',
    defaultText: 'FILM DEVELOPED',
    defaultSubtext: 'LUMIÈRE LAB · PARIS',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 11,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 66,
    defaultRotation: -4
  },
  {
    assetId: 'lab-archive-mark',
    category: 'film-lab',
    type: 'stamp',
    label: 'Archive Proof Mark',
    defaultText: 'ARCHIVE // NEG. 35',
    defaultSubtext: 'VERIFIED SILVER HALIDE',
    editableText: true,
    defaultFontFamily: 'sans',
    defaultFontSize: 10,
    defaultLetterSpacing: 2.5,
    defaultTextAlign: 'center',
    defaultColor: '#5C6450',
    defaultSize: 64,
    defaultRotation: 2
  },
  {
    assetId: 'lab-studio-mark',
    category: 'film-lab',
    type: 'stamp',
    label: 'Studio Crest Mark',
    defaultText: 'ATELIER LUMIÈRE',
    defaultSubtext: 'CHAMBRE NOIRE N° 4',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 13,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 68,
    defaultRotation: 0
  },

  // ==========================================
  // 2. FINE-LINE GRAPHICS
  // ==========================================
  {
    assetId: 'line-north-star',
    category: 'fine-line',
    type: 'svg',
    label: 'Fine Compass Star',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 44,
    defaultRotation: 0
  },
  {
    assetId: 'line-monoline-heart',
    category: 'fine-line',
    type: 'svg',
    label: 'Fine-Line Heart',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 42,
    defaultRotation: -5
  },
  {
    assetId: 'line-botanical-sprig',
    category: 'fine-line',
    type: 'svg',
    label: 'Botanical Olive Sprig',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#5C6450',
    defaultSize: 54,
    defaultRotation: 8
  },
  {
    assetId: 'line-sparkle-cluster',
    category: 'fine-line',
    type: 'svg',
    label: 'Delicate Sparkle',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#B46927',
    defaultSize: 40,
    defaultRotation: 0
  },
  {
    assetId: 'line-editorial-arrow',
    category: 'fine-line',
    type: 'svg',
    label: 'Drafting Arrow',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 52,
    defaultRotation: -12
  },
  {
    assetId: 'line-fleuron-ornament',
    category: 'fine-line',
    type: 'svg',
    label: 'Editorial Fleuron',
    editableText: false,
    defaultFontFamily: 'garamond',
    defaultFontSize: 12,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 56,
    defaultRotation: 0
  },

  // ==========================================
  // 3. FILM FRAMES
  // ==========================================
  {
    assetId: 'frame-negative-strip',
    category: 'film-frames',
    type: 'frame',
    label: 'Negative Strip Motif',
    defaultText: 'KODAK 400TX',
    defaultSubtext: '▶ 24A',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 10,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 78,
    defaultRotation: 0
  },
  {
    assetId: 'frame-sprocket-bar',
    category: 'film-frames',
    type: 'frame',
    label: 'Sprocket Hole Border',
    editableText: false,
    defaultFontFamily: 'courier',
    defaultFontSize: 10,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 76,
    defaultRotation: 0
  },
  {
    assetId: 'frame-crop-corners',
    category: 'film-frames',
    type: 'frame',
    label: 'Corner Crop Marks',
    editableText: false,
    defaultFontFamily: 'courier',
    defaultFontSize: 10,
    defaultLetterSpacing: 1,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 72,
    defaultRotation: 0
  },
  {
    assetId: 'frame-viewfinder-outline',
    category: 'film-frames',
    type: 'frame',
    label: 'Viewfinder Frame',
    defaultText: '[ AF · 1/125 · F2.8 ]',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 9,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#B46927',
    defaultSize: 76,
    defaultRotation: 0
  },
  {
    assetId: 'frame-contact-sheet',
    category: 'film-frames',
    type: 'frame',
    label: 'Contact Sheet Wax Mark',
    defaultText: 'SELECT // PRINT 8×10',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 10,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 74,
    defaultRotation: -3
  },

  // ==========================================
  // 4. EDITORIAL TYPOGRAPHY
  // ==========================================
  {
    assetId: 'type-lumiere-studio',
    category: 'editorial-type',
    type: 'typography',
    label: 'Lumière Studio',
    defaultText: 'LUMIÈRE STUDIO',
    defaultSubtext: 'ÉDITION ANALOGIQUE',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 16,
    defaultLetterSpacing: 3,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 74,
    defaultRotation: 0
  },
  {
    assetId: 'type-archive-series',
    category: 'editorial-type',
    type: 'typography',
    label: 'Archive Series',
    defaultText: 'ARCHIVE SERIES',
    defaultSubtext: 'ISSUE NO. 04 — AUTUMN',
    editableText: true,
    defaultFontFamily: 'sans',
    defaultFontSize: 12,
    defaultLetterSpacing: 3,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 72,
    defaultRotation: 0
  },
  {
    assetId: 'type-one-for-album',
    category: 'editorial-type',
    type: 'typography',
    label: 'One For The Album',
    defaultText: 'ONE FOR THE ALBUM',
    defaultSubtext: 'COLLECTED MEMORIES',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 14,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 72,
    defaultRotation: 0
  },
  {
    assetId: 'type-little-memory',
    category: 'editorial-type',
    type: 'typography',
    label: 'A Little Memory',
    defaultText: 'A LITTLE MEMORY',
    defaultSubtext: 'CAPTURED ON 35MM',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 12,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#5C6450',
    defaultSize: 68,
    defaultRotation: -1
  },
  {
    assetId: 'type-just-us',
    category: 'editorial-type',
    type: 'typography',
    label: 'Just Us',
    defaultText: 'JUST US',
    defaultSubtext: 'PRIVATE COLLECTION',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 16,
    defaultLetterSpacing: 3.5,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 64,
    defaultRotation: 0
  },

  // ==========================================
  // 5. PAPER EPHEMERA
  // ==========================================
  {
    assetId: 'ephem-masking-tape',
    category: 'paper-ephemera',
    type: 'ephemera',
    label: 'Archival Masking Tape',
    defaultText: 'ROLL #04',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 11,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultBackgroundColor: '#F7F3E9',
    defaultSize: 72,
    defaultRotation: -6
  },
  {
    assetId: 'ephem-paper-label',
    category: 'paper-ephemera',
    type: 'ephemera',
    label: 'Bordered Paper Tag',
    defaultText: 'SPECIMEN N° 12',
    defaultSubtext: 'SILVER GELATIN',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 11,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultBackgroundColor: '#F7F3E9',
    defaultSize: 74,
    defaultRotation: 2
  },
  {
    assetId: 'ephem-torn-note',
    category: 'paper-ephemera',
    type: 'ephemera',
    label: 'Torn Deckle Slip',
    defaultText: 'Keep this forever.',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 14,
    defaultLetterSpacing: 0.5,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultBackgroundColor: '#F7F3E9',
    defaultSize: 76,
    defaultRotation: -3
  },
  {
    assetId: 'ephem-glassine-seal',
    category: 'paper-ephemera',
    type: 'ephemera',
    label: 'Glassine Archive Label',
    defaultText: 'DO NOT BEND · ARCHIVE',
    editableText: true,
    defaultFontFamily: 'sans',
    defaultFontSize: 10,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#5C6450',
    defaultBackgroundColor: '#F7F3E9',
    defaultSize: 72,
    defaultRotation: 1
  },

  // ==========================================
  // 6. DATE & LOCATION
  // ==========================================
  {
    assetId: 'date-location-editorial',
    category: 'date-location',
    type: 'typography',
    label: 'Date / Location Stamp',
    defaultText: 'OCTOBER 29, 2026',
    defaultSubtext: 'PARIS · RUE DE TURENNE',
    editableText: true,
    defaultFontFamily: 'garamond',
    defaultFontSize: 13,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#1C1917',
    defaultSize: 72,
    defaultRotation: 0
  },
  {
    assetId: 'date-gps-coords',
    category: 'date-location',
    type: 'typography',
    label: 'GPS Coordinates',
    defaultText: '48.8566° N, 2.3522° E',
    defaultSubtext: 'ELEV 35M · UTC+1',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 10,
    defaultLetterSpacing: 1.5,
    defaultTextAlign: 'center',
    defaultColor: '#5C6450',
    defaultSize: 72,
    defaultRotation: 0
  },
  {
    assetId: 'date-quartz-timestamp',
    category: 'date-location',
    type: 'stamp',
    label: 'Camera Quartz Date',
    defaultText: "'26 10 29  22:14",
    defaultSubtext: 'QUARTZ DATE · 35MM',
    editableText: true,
    defaultFontFamily: 'courier',
    defaultFontSize: 12,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#B46927',
    defaultSize: 66,
    defaultRotation: 0
  },
  {
    assetId: 'date-city-dispatch',
    category: 'date-location',
    type: 'stamp',
    label: 'City Dispatch Postmark',
    defaultText: 'PARIS — TOKYO — NYC',
    defaultSubtext: 'AUTUMN / WINTER 2026',
    editableText: true,
    defaultFontFamily: 'sans',
    defaultFontSize: 10,
    defaultLetterSpacing: 2,
    defaultTextAlign: 'center',
    defaultColor: '#6B2D38',
    defaultSize: 72,
    defaultRotation: -2
  }
];

export function getStickerAssetById(assetId: string): StickerAssetDefinition | undefined {
  return EDITORIAL_STICKER_LIBRARY.find((item) => item.assetId === assetId);
}

/**
 * Creates a new CustomSticker instance from a curated StickerAssetDefinition
 */
export function createStickerFromAsset(
  asset: StickerAssetDefinition,
  existingStickers: CustomSticker[],
  overrides?: Partial<CustomSticker>
): CustomSticker {
  const maxZ = existingStickers.reduce((max, s) => Math.max(max, s.zIndex ?? 0), 0);
  // Cycle through editorial frame seams and margin zones so stickers frame photos instead of obscuring faces
  const editorialAnchorSlots = [
    { x: 0.72, y: 0.34 },
    { x: 0.28, y: 0.64 },
    { x: 0.5, y: 0.91 },
    { x: 0.74, y: 0.05 },
    { x: 0.26, y: 0.34 }
  ];
  const slot = editorialAnchorSlots[existingStickers.length % editorialAnchorSlots.length];
  const staggerX = slot.x;
  const staggerY = slot.y;

  return {
    id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    assetId: asset.assetId,
    category: asset.category,
    type: asset.type,
    symbol: asset.label,
    label: asset.label,
    text: asset.defaultText ?? '',
    subtext: asset.defaultSubtext ?? '',
    fontFamily: asset.defaultFontFamily,
    fontSize: asset.defaultFontSize,
    letterSpacing: asset.defaultLetterSpacing,
    textAlign: asset.defaultTextAlign,
    color: asset.defaultColor,
    backgroundColor: asset.defaultBackgroundColor,
    opacity: 1,
    x: Number(Math.max(0.12, Math.min(0.88, staggerX)).toFixed(3)),
    y: Number(Math.max(0.04, Math.min(0.95, staggerY)).toFixed(3)),
    size: asset.defaultSize,
    rotation: asset.defaultRotation,
    zIndex: maxZ + 1,
    ...overrides
  };
}

/**
 * Duplicates an existing sticker with a slight offset and top zIndex
 */
export function duplicateSticker(
  stickers: CustomSticker[],
  targetId: string
): { stickers: CustomSticker[]; duplicated: CustomSticker | null } {
  const source = stickers.find((s) => s.id === targetId);
  if (!source) {
    return { stickers, duplicated: null };
  }
  const maxZ = stickers.reduce((max, s) => Math.max(max, s.zIndex ?? 0), 0);
  const duplicated: CustomSticker = {
    ...source,
    id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: Math.min(0.92, Number((source.x + 0.04).toFixed(3))),
    y: Math.min(0.92, Number((source.y + 0.04).toFixed(3))),
    zIndex: maxZ + 1
  };
  return {
    stickers: [...stickers, duplicated],
    duplicated
  };
}

/**
 * Sorts stickers in ascending zIndex order for deterministic rendering
 */
export function sortStickersByLayer(stickers: CustomSticker[]): CustomSticker[] {
  return [...stickers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

/**
 * Moves a sticker one layer forward (higher zIndex)
 */
export function bringStickerForward(stickers: CustomSticker[], targetId: string): CustomSticker[] {
  const sorted = sortStickersByLayer(stickers).map((s, idx) => ({ ...s, zIndex: idx + 1 }));
  const index = sorted.findIndex((s) => s.id === targetId);
  if (index === -1 || index === sorted.length - 1) return sorted;

  const tempZ = sorted[index].zIndex!;
  sorted[index].zIndex = sorted[index + 1].zIndex!;
  sorted[index + 1].zIndex = tempZ;
  return sortStickersByLayer(sorted);
}

/**
 * Moves a sticker one layer backward (lower zIndex)
 */
export function sendStickerBackward(stickers: CustomSticker[], targetId: string): CustomSticker[] {
  const sorted = sortStickersByLayer(stickers).map((s, idx) => ({ ...s, zIndex: idx + 1 }));
  const index = sorted.findIndex((s) => s.id === targetId);
  if (index <= 0) return sorted;

  const tempZ = sorted[index].zIndex!;
  sorted[index].zIndex = sorted[index - 1].zIndex!;
  sorted[index - 1].zIndex = tempZ;
  return sortStickersByLayer(sorted);
}

/**
 * History stack helper for Undo / Redo on sticker state
 */
export interface StickerHistoryState {
  stack: CustomSticker[][];
  index: number;
}

export function pushStickerHistory(
  history: StickerHistoryState,
  nextStickers: CustomSticker[],
  maxDepth = 30
): StickerHistoryState {
  const sliced = history.stack.slice(0, history.index + 1);
  const cloned = nextStickers.map((s) => ({ ...s }));
  const updatedStack = [...sliced, cloned];
  if (updatedStack.length > maxDepth) {
    updatedStack.shift();
  }
  return {
    stack: updatedStack,
    index: updatedStack.length - 1
  };
}

/**
 * Batch Apply helper: synchronizes all captured photos to use the specified preset, adjustments, and filmEffects
 */
export function applyBatchFilterToPhotos(
  photos: CapturedPhoto[],
  preset: FilterPreset,
  adjustments: FilterAdjustments,
  filmEffects: FilmEffectsState
): CapturedPhoto[] {
  const override: FrameFilterOverride = {
    preset,
    adjustments: { ...adjustments },
    filmEffects: JSON.parse(JSON.stringify(filmEffects))
  };
  return photos.map((photo) => ({
    ...photo,
    frameOverride: override
  }));
}

/**
 * Resolves the active filter configuration for a given frame depending on whether Batch Apply is active
 */
export function resolveFrameFilter(
  photo: CapturedPhoto | undefined,
  batchApply: boolean,
  globalPreset: FilterPreset,
  globalAdjustments: FilterAdjustments,
  globalFilmEffects: FilmEffectsState
): FrameFilterOverride {
  if (!batchApply && photo?.frameOverride) {
    return {
      preset: photo.frameOverride.preset,
      adjustments: photo.frameOverride.adjustments,
      filmEffects: photo.frameOverride.filmEffects
    };
  }
  return {
    preset: globalPreset,
    adjustments: globalAdjustments,
    filmEffects: globalFilmEffects
  };
}
