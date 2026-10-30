import {
  StripLayout,
  PaperStockId,
  PaperTextureId,
  FrameAspectRatio,
  FrameCornerStyle,
  CompositionOrientation,
  FrameNumberingMode,
  PhotoCropState,
  StripStyle,
  PrintSizePreset,
  PrintExportConfig
} from '../types/photobooth';

export interface LayoutPresetDefinition {
  id: StripLayout;
  name: string;
  subtitle: string;
  frameCount: number;
  defaultOrientation: CompositionOrientation;
  defaultAspectRatio: FrameAspectRatio;
  defaultGap: number;
  defaultMargin: number;
  defaultBorderThickness: number;
  defaultCornerStyle: FrameCornerStyle;
  defaultSprocketHoles: boolean;
  defaultNumbering: FrameNumberingMode;
  defaultPaperStock?: PaperStockId;
  baseWidth: number;
  baseHeight: number;
  /** Normalized 0..1 boxes used to draw accurate schematic preview icons */
  previewBoxes: Array<{ x: number; y: number; w: number; h: number }>;
}

export interface PaperStockProfile {
  id: PaperStockId;
  name: string;
  finishLabel: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  frameBorderColor: string;
  defaultTexture: PaperTextureId;
  defaultTextureIntensity: number;
  sheenType: 'none' | 'gloss' | 'pearl' | 'matte';
}

export interface ComputedFrameRect {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional outer card frame (e.g. for Polaroid-Style Grid or Instant Print) */
  cardRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
    chinHeight: number;
  };
  labelCode: string;
}

export interface ComputedCompositionGeometry {
  targetWidth: number;
  targetHeight: number;
  headerY: number;
  footerY: number;
  marginX: number;
  marginY: number;
  cornerRadiusPx: number;
  frameRects: ComputedFrameRect[];
  isDarkSurface: boolean;
}

export const LAYOUT_PRESETS: LayoutPresetDefinition[] = [
  {
    id: 'strip-3',
    name: '3-Frame Strip',
    subtitle: '2×6" Classic Vertical',
    frameCount: 3,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 20,
    defaultMargin: 36,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    baseWidth: 600,
    baseHeight: 1800,
    previewBoxes: [
      { x: 0.16, y: 0.08, w: 0.68, h: 0.25 },
      { x: 0.16, y: 0.37, w: 0.68, h: 0.25 },
      { x: 0.16, y: 0.66, w: 0.68, h: 0.25 }
    ]
  },
  {
    id: 'strip-4',
    name: '4-Frame Strip',
    subtitle: 'Quad Sequential Strip',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 16,
    defaultMargin: 36,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    baseWidth: 600,
    baseHeight: 2100,
    previewBoxes: [
      { x: 0.16, y: 0.06, w: 0.68, h: 0.19 },
      { x: 0.16, y: 0.28, w: 0.68, h: 0.19 },
      { x: 0.16, y: 0.50, w: 0.68, h: 0.19 },
      { x: 0.16, y: 0.72, w: 0.68, h: 0.19 }
    ]
  },
  {
    id: 'grid-2x2',
    name: '2×2 Grid Collage',
    subtitle: '4×6" Postcard Quartet',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 22,
    defaultMargin: 44,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    baseWidth: 1200,
    baseHeight: 1440,
    previewBoxes: [
      { x: 0.08, y: 0.10, w: 0.40, h: 0.36 },
      { x: 0.52, y: 0.10, w: 0.40, h: 0.36 },
      { x: 0.08, y: 0.50, w: 0.40, h: 0.36 },
      { x: 0.52, y: 0.50, w: 0.40, h: 0.36 }
    ]
  },
  {
    id: 'horizontal-3',
    name: 'Horizontal Strip',
    subtitle: 'Panoramic Cinema Trio',
    frameCount: 3,
    defaultOrientation: 'landscape',
    defaultAspectRatio: '4:3',
    defaultGap: 20,
    defaultMargin: 40,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    baseWidth: 1800,
    baseHeight: 720,
    previewBoxes: [
      { x: 0.06, y: 0.16, w: 0.27, h: 0.64 },
      { x: 0.365, y: 0.16, w: 0.27, h: 0.64 },
      { x: 0.67, y: 0.16, w: 0.27, h: 0.64 }
    ]
  },
  {
    id: 'classic-booth',
    name: 'Classic Photo Booth',
    subtitle: 'Vintage Arcade 4-Pose',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 14,
    defaultMargin: 32,
    defaultBorderThickness: 3,
    defaultCornerStyle: 'soft',
    defaultSprocketHoles: false,
    defaultNumbering: 'minimal-index',
    defaultPaperStock: 'archival-cream',
    baseWidth: 620,
    baseHeight: 2040,
    previewBoxes: [
      { x: 0.14, y: 0.06, w: 0.72, h: 0.19 },
      { x: 0.14, y: 0.27, w: 0.72, h: 0.19 },
      { x: 0.14, y: 0.48, w: 0.72, h: 0.19 },
      { x: 0.14, y: 0.69, w: 0.72, h: 0.19 }
    ]
  },
  {
    id: 'contact-sheet',
    name: 'Contact Sheet',
    subtitle: 'Darkroom Proof Sheet',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 24,
    defaultMargin: 44,
    defaultBorderThickness: 2,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'contact-proof',
    defaultPaperStock: 'darkroom-black',
    baseWidth: 1200,
    baseHeight: 1320,
    previewBoxes: [
      { x: 0.09, y: 0.12, w: 0.38, h: 0.32 },
      { x: 0.53, y: 0.12, w: 0.38, h: 0.32 },
      { x: 0.09, y: 0.52, w: 0.38, h: 0.32 },
      { x: 0.53, y: 0.52, w: 0.38, h: 0.32 }
    ]
  },
  {
    id: 'editorial-print',
    name: 'Editorial Print',
    subtitle: 'Hero + 2 Detail Frames',
    frameCount: 3,
    defaultOrientation: 'portrait',
    defaultAspectRatio: 'auto',
    defaultGap: 22,
    defaultMargin: 52,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'minimal-index',
    defaultPaperStock: 'warm-ivory',
    baseWidth: 1200,
    baseHeight: 1620,
    previewBoxes: [
      { x: 0.08, y: 0.09, w: 0.84, h: 0.46 },
      { x: 0.08, y: 0.59, w: 0.40, h: 0.28 },
      { x: 0.52, y: 0.59, w: 0.40, h: 0.28 }
    ]
  },
  {
    id: 'instant-print',
    name: 'Instant Print',
    subtitle: 'Integral Film Frame',
    frameCount: 1,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '1:1',
    defaultGap: 0,
    defaultMargin: 54,
    defaultBorderThickness: 2,
    defaultCornerStyle: 'soft',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    defaultPaperStock: 'pure-white',
    baseWidth: 1080,
    baseHeight: 1320,
    previewBoxes: [
      { x: 0.11, y: 0.09, w: 0.78, h: 0.65 }
    ]
  },
  {
    id: 'square-contact-grid',
    name: 'Square Contact Grid',
    subtitle: '6×6 Medium Format 2×2',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '1:1',
    defaultGap: 24,
    defaultMargin: 56,
    defaultBorderThickness: 2,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'film-edge',
    defaultPaperStock: 'fine-art-matte',
    baseWidth: 1320,
    baseHeight: 1460,
    previewBoxes: [
      { x: 0.09, y: 0.10, w: 0.39, h: 0.36 },
      { x: 0.52, y: 0.10, w: 0.39, h: 0.36 },
      { x: 0.09, y: 0.50, w: 0.39, h: 0.36 },
      { x: 0.52, y: 0.50, w: 0.39, h: 0.36 }
    ]
  },
  {
    id: 'film-negative-strip',
    name: 'Film Negative Strip',
    subtitle: '35mm Perforated Rebate',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '3:2',
    defaultGap: 18,
    defaultMargin: 54,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: true,
    defaultNumbering: 'film-edge',
    defaultPaperStock: 'darkroom-black',
    baseWidth: 680,
    baseHeight: 2080,
    previewBoxes: [
      { x: 0.18, y: 0.06, w: 0.64, h: 0.19 },
      { x: 0.18, y: 0.28, w: 0.64, h: 0.19 },
      { x: 0.18, y: 0.50, w: 0.64, h: 0.19 },
      { x: 0.18, y: 0.72, w: 0.64, h: 0.19 }
    ]
  },
  {
    id: 'minimal-gallery-print',
    name: 'Minimal Gallery Print',
    subtitle: 'Exhibition Mat Diptych',
    frameCount: 2,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '4:3',
    defaultGap: 36,
    defaultMargin: 72,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'sharp',
    defaultSprocketHoles: false,
    defaultNumbering: 'minimal-index',
    defaultPaperStock: 'fine-art-matte',
    baseWidth: 1120,
    baseHeight: 1680,
    previewBoxes: [
      { x: 0.14, y: 0.11, w: 0.72, h: 0.34 },
      { x: 0.14, y: 0.50, w: 0.72, h: 0.34 }
    ]
  },
  {
    id: 'polaroid-grid',
    name: 'Polaroid-Style Grid',
    subtitle: '4 Instant Framed Cards',
    frameCount: 4,
    defaultOrientation: 'portrait',
    defaultAspectRatio: '1:1',
    defaultGap: 28,
    defaultMargin: 48,
    defaultBorderThickness: 1,
    defaultCornerStyle: 'soft',
    defaultSprocketHoles: false,
    defaultNumbering: 'off',
    defaultPaperStock: 'soft-gray',
    baseWidth: 1320,
    baseHeight: 1620,
    previewBoxes: [
      { x: 0.08, y: 0.08, w: 0.40, h: 0.39 },
      { x: 0.52, y: 0.08, w: 0.40, h: 0.39 },
      { x: 0.08, y: 0.51, w: 0.40, h: 0.39 },
      { x: 0.52, y: 0.51, w: 0.40, h: 0.39 }
    ]
  }
];

export const PAPER_STOCK_PROFILES: PaperStockProfile[] = [
  {
    id: 'fine-art-matte',
    name: 'Fine Art Matte',
    finishLabel: '310gsm Museum Rag',
    description: 'Warm museum-grade cotton rag with zero glare and subtle archival fiber tooth.',
    backgroundColor: '#F8F5EE',
    textColor: '#1E1B18',
    secondaryTextColor: '#6E665C',
    frameBorderColor: 'rgba(30, 27, 24, 0.16)',
    defaultTexture: 'cotton-rag',
    defaultTextureIntensity: 35,
    sheenType: 'matte'
  },
  {
    id: 'glossy-photo',
    name: 'Glossy Photo',
    finishLabel: 'RC High-Gloss',
    description: 'Crisp optical brightener base with subtle directional resin-coated specular sheen.',
    backgroundColor: '#FCFBF9',
    textColor: '#141413',
    secondaryTextColor: '#57534E',
    frameBorderColor: 'rgba(20, 20, 19, 0.14)',
    defaultTexture: 'silver-halide',
    defaultTextureIntensity: 18,
    sheenType: 'gloss'
  },
  {
    id: 'lustre-pearl',
    name: 'Lustre Pearl',
    finishLabel: 'E-Surface Satin',
    description: 'Portrait studio standard with fine stippled pearl micro-texture and soft satin reflectance.',
    backgroundColor: '#F6F4EF',
    textColor: '#1C1917',
    secondaryTextColor: '#655E54',
    frameBorderColor: 'rgba(28, 25, 23, 0.15)',
    defaultTexture: 'pearl-lustre',
    defaultTextureIntensity: 28,
    sheenType: 'pearl'
  },
  {
    id: 'archival-cream',
    name: 'Archival Cream',
    finishLabel: 'Warm Barite Fiber',
    description: 'Traditional darkroom warm-tone baryta paper with vintage cream highlights.',
    backgroundColor: '#F2EBD9',
    textColor: '#26211B',
    secondaryTextColor: '#73685A',
    frameBorderColor: 'rgba(38, 33, 27, 0.18)',
    defaultTexture: 'cotton-rag',
    defaultTextureIntensity: 40,
    sheenType: 'matte'
  },
  {
    id: 'darkroom-black',
    name: 'Darkroom Black',
    finishLabel: 'Obsidian Contact Mount',
    description: 'Deep archival carbon-black contact sheet mount with amber and silver typography.',
    backgroundColor: '#141312',
    textColor: '#F4F0EA',
    secondaryTextColor: '#A8A096',
    frameBorderColor: 'rgba(244, 240, 234, 0.22)',
    defaultTexture: 'silver-halide',
    defaultTextureIntensity: 25,
    sheenType: 'matte'
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    finishLabel: 'Studio Daylight White',
    description: 'Neutral calibrated studio white stock for high-key editorial and instant layouts.',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
    secondaryTextColor: '#64646A',
    frameBorderColor: 'rgba(24, 24, 27, 0.12)',
    defaultTexture: 'none',
    defaultTextureIntensity: 0,
    sheenType: 'none'
  },
  {
    id: 'warm-ivory',
    name: 'Warm Ivory',
    finishLabel: 'Lumière Signature Stock',
    description: 'Editorial monograph ivory stock balanced for 35mm color negative skin tones.',
    backgroundColor: '#F5EFE4',
    textColor: '#211D1A',
    secondaryTextColor: '#6E655B',
    frameBorderColor: 'rgba(33, 29, 26, 0.16)',
    defaultTexture: 'linen-press',
    defaultTextureIntensity: 30,
    sheenType: 'matte'
  },
  {
    id: 'soft-gray',
    name: 'Soft Gray',
    finishLabel: 'Neutral Portfolio Mist',
    description: 'Subtle gallery zinc-gray mount that isolates highlight borders and instant cards.',
    backgroundColor: '#E6E4DF',
    textColor: '#1C1B19',
    secondaryTextColor: '#5C5954',
    frameBorderColor: 'rgba(28, 27, 25, 0.16)',
    defaultTexture: 'cotton-rag',
    defaultTextureIntensity: 25,
    sheenType: 'matte'
  }
];

export const PAPER_TEXTURE_OPTIONS: Array<{ id: PaperTextureId; label: string; desc: string }> = [
  { id: 'none', label: 'None (Smooth)', desc: 'Unadorned smooth paper surface' },
  { id: 'cotton-rag', label: 'Cotton Rag', desc: 'Organic fine-art pulp fiber tooth' },
  { id: 'pearl-lustre', label: 'Pearl Lustre', desc: 'Uniform micro-stippled lab finish' },
  { id: 'silver-halide', label: 'Silver Fiber', desc: 'Subtle baryta darkroom surface grain' },
  { id: 'linen-press', label: 'Linen Press', desc: 'Delicate cross-woven editorial paper' }
];

export const PRINT_SIZE_PRESETS: Array<{
  id: PrintSizePreset;
  name: string;
  dimensionsLabel: string;
  widthInches: number;
  heightInches: number;
  description: string;
}> = [
  {
    id: 'digital-highres',
    name: 'Native Layout High-Res',
    dimensionsLabel: 'Proportional 3× Scale',
    widthInches: 0,
    heightInches: 0,
    description: 'Preserves exact layout proportions at ultra-crisp 3× master resolution.'
  },
  {
    id: '2x6-strip',
    name: '2 × 6 in Photo Booth Strip',
    dimensionsLabel: '2.0" × 6.0"',
    widthInches: 2,
    heightInches: 6,
    description: 'Classic vertical arcade photo booth strip dimension.'
  },
  {
    id: '4x6-print',
    name: '4 × 6 in Postcard Print',
    dimensionsLabel: '4.0" × 6.0"',
    widthInches: 4,
    heightInches: 6,
    description: 'Standard darkroom & lab postcard print size.'
  },
  {
    id: '5x7-editorial',
    name: '5 × 7 in Gallery Print',
    dimensionsLabel: '5.0" × 7.0"',
    widthInches: 5,
    heightInches: 7,
    description: 'Medium-format portfolio and framed editorial print.'
  },
  {
    id: 'a4-sheet',
    name: 'A4 Archival Sheet',
    dimensionsLabel: '8.27" × 11.69" (210×297mm)',
    widthInches: 8.27,
    heightInches: 11.69,
    description: 'Full contact sheet or exhibition proof page.'
  }
];

export function getLayoutPreset(layout: StripLayout): LayoutPresetDefinition {
  return LAYOUT_PRESETS.find((l) => l.id === layout) || LAYOUT_PRESETS[0];
}

export function getPaperStockProfile(stockId?: PaperStockId): PaperStockProfile {
  return PAPER_STOCK_PROFILES.find((p) => p.id === stockId) || PAPER_STOCK_PROFILES[5];
}

export function parseAspectRatioValue(ratio?: FrameAspectRatio): number | null {
  if (!ratio || ratio === 'auto') return null;
  const parts = ratio.split(':').map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return parts[0] / parts[1];
  }
  return null;
}

export function resolveCornerRadiusPx(cornerStyle?: FrameCornerStyle, explicitRadius?: number): number {
  if (cornerStyle === 'sharp') return 0;
  if (cornerStyle === 'soft') return 8;
  if (cornerStyle === 'rounded') return 20;
  return explicitRadius || 0;
}

/**
 * Fits a target aspect ratio box centered inside an available slot bounding box
 */
export function fitBoxWithAspectRatio(
  slotX: number,
  slotY: number,
  slotW: number,
  slotH: number,
  aspectRatio: number | null
): { x: number; y: number; width: number; height: number } {
  if (!aspectRatio || aspectRatio <= 0) {
    return { x: slotX, y: slotY, width: slotW, height: slotH };
  }
  const slotRatio = slotW / slotH;
  if (Math.abs(slotRatio - aspectRatio) < 1e-5) {
    return { x: slotX, y: slotY, width: slotW, height: slotH };
  }
  if (slotRatio > aspectRatio) {
    // Slot is wider than desired ratio: constrain width
    const width = slotH * aspectRatio;
    const x = slotX + (slotW - width) / 2;
    return { x, y: slotY, width, height: slotH };
  } else {
    // Slot is taller than desired ratio: constrain height
    const height = slotW / aspectRatio;
    const y = slotY + (slotH - height) / 2;
    return { x: slotX, y, width: slotW, height };
  }
}

/**
 * Computes the complete composition geometry for all 12 layouts, honoring orientation,
 * margins, gaps, sprocket holes, and frame aspect ratio overrides.
 */
export function computeCompositionGeometry(
  layout: StripLayout,
  style: StripStyle
): ComputedCompositionGeometry {
  const preset = getLayoutPreset(layout);
  const orientation: CompositionOrientation = style.orientation || preset.defaultOrientation;

  // Determine base canvas dimensions and swap if orientation differs from preset default
  let targetWidth = preset.baseWidth;
  let targetHeight = preset.baseHeight;

  if (orientation === 'landscape' && targetHeight > targetWidth) {
    const tmp = targetWidth;
    targetWidth = targetHeight;
    targetHeight = tmp;
  } else if (orientation === 'portrait' && targetWidth > targetHeight) {
    const tmp = targetWidth;
    targetWidth = targetHeight;
    targetHeight = tmp;
  }

  const hasSprockets = Boolean(
    style.sprocketHoles || style.borderStyle === 'sprocket' || layout === 'film-negative-strip'
  );

  const rawMargin = typeof style.stripMargin === 'number' ? Math.max(12, Math.min(100, style.stripMargin)) : preset.defaultMargin;
  const rawGap = typeof style.framePadding === 'number' ? Math.max(0, Math.min(64, style.framePadding)) : preset.defaultGap;

  const sprocketSafeInset = hasSprockets ? 46 : 0;
  const marginX = Math.max(rawMargin, sprocketSafeInset + Math.round(rawMargin * 0.55));
  const headerPadding = style.headerText ? Math.max(68, rawMargin + 30) : Math.max(32, rawMargin);
  const footerPadding =
    style.footerText || style.showDateStamp || layout === 'minimal-gallery-print' || layout === 'instant-print'
      ? Math.max(96, rawMargin + 52)
      : Math.max(36, rawMargin);

  const availableWidth = Math.max(120, targetWidth - marginX * 2);
  const availableHeight = Math.max(120, targetHeight - headerPadding - footerPadding);

  const forcedAspectRatio = parseAspectRatioValue(style.frameAspectRatio);
  const cornerRadiusPx = resolveCornerRadiusPx(style.cornerStyle, style.borderRadius);

  const rawSlots: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    cardRect?: { x: number; y: number; width: number; height: number; chinHeight: number };
  }> = [];

  if (layout === 'strip-3' || layout === 'strip-4' || layout === 'classic-booth' || layout === 'film-negative-strip') {
    const count = layout === 'strip-3' ? 3 : 4;
    if (orientation === 'landscape') {
      const slotW = (availableWidth - rawGap * (count - 1)) / count;
      const slotH = availableHeight;
      for (let i = 0; i < count; i++) {
        rawSlots.push({
          x: marginX + i * (slotW + rawGap),
          y: headerPadding,
          width: slotW,
          height: slotH
        });
      }
    } else {
      const slotW = availableWidth;
      const slotH = (availableHeight - rawGap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        rawSlots.push({
          x: marginX,
          y: headerPadding + i * (slotH + rawGap),
          width: slotW,
          height: slotH
        });
      }
    }
  } else if (layout === 'horizontal-3') {
    const count = 3;
    if (orientation === 'portrait') {
      const slotW = availableWidth;
      const slotH = (availableHeight - rawGap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        rawSlots.push({
          x: marginX,
          y: headerPadding + i * (slotH + rawGap),
          width: slotW,
          height: slotH
        });
      }
    } else {
      const slotW = (availableWidth - rawGap * (count - 1)) / count;
      const slotH = availableHeight;
      for (let i = 0; i < count; i++) {
        rawSlots.push({
          x: marginX + i * (slotW + rawGap),
          y: headerPadding,
          width: slotW,
          height: slotH
        });
      }
    }
  } else if (layout === 'grid-2x2' || layout === 'contact-sheet' || layout === 'square-contact-grid') {
    const extraProofGapY = layout === 'contact-sheet' ? Math.max(rawGap, 28) : rawGap;
    const slotW = (availableWidth - rawGap) / 2;
    const slotH = (availableHeight - extraProofGapY) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        rawSlots.push({
          x: marginX + c * (slotW + rawGap),
          y: headerPadding + r * (slotH + extraProofGapY),
          width: slotW,
          height: slotH
        });
      }
    }
  } else if (layout === 'editorial-print') {
    if (orientation === 'landscape') {
      // Left 58% Hero frame, Right 42% stacked 2 detail frames
      const heroW = (availableWidth - rawGap) * 0.58;
      const sideW = availableWidth - rawGap - heroW;
      const sideH = (availableHeight - rawGap) / 2;
      rawSlots.push({
        x: marginX,
        y: headerPadding,
        width: heroW,
        height: availableHeight
      });
      rawSlots.push({
        x: marginX + heroW + rawGap,
        y: headerPadding,
        width: sideW,
        height: sideH
      });
      rawSlots.push({
        x: marginX + heroW + rawGap,
        y: headerPadding + sideH + rawGap,
        width: sideW,
        height: sideH
      });
    } else {
      // Top 58% Hero frame, Bottom 42% 2 side-by-side detail frames
      const heroH = (availableHeight - rawGap) * 0.58;
      const bottomH = availableHeight - rawGap - heroH;
      const bottomW = (availableWidth - rawGap) / 2;
      rawSlots.push({
        x: marginX,
        y: headerPadding,
        width: availableWidth,
        height: heroH
      });
      rawSlots.push({
        x: marginX,
        y: headerPadding + heroH + rawGap,
        width: bottomW,
        height: bottomH
      });
      rawSlots.push({
        x: marginX + bottomW + rawGap,
        y: headerPadding + heroH + rawGap,
        width: bottomW,
        height: bottomH
      });
    }
  } else if (layout === 'instant-print') {
    // Classic integral instant film print with deep bottom chin
    const cardPad = Math.max(28, Math.round(rawMargin * 0.65));
    const chinHeight = Math.round(targetHeight * 0.19);
    const cardX = marginX;
    const cardY = headerPadding;
    const cardW = availableWidth;
    const cardH = availableHeight;
    const photoW = Math.max(80, cardW - cardPad * 2);
    const photoH = Math.max(80, cardH - cardPad - chinHeight);
    rawSlots.push({
      x: cardX + cardPad,
      y: cardY + cardPad,
      width: photoW,
      height: photoH,
      cardRect: {
        x: cardX,
        y: cardY,
        width: cardW,
        height: cardH,
        chinHeight
      }
    });
  } else if (layout === 'minimal-gallery-print') {
    // 2-frame curated gallery print with generous museum mat breathing room
    const matInset = Math.round(Math.min(availableWidth, availableHeight) * 0.06);
    const innerW = availableWidth - matInset * 2;
    const innerH = availableHeight - matInset * 2;
    if (orientation === 'landscape') {
      const slotW = (innerW - rawGap) / 2;
      for (let i = 0; i < 2; i++) {
        rawSlots.push({
          x: marginX + matInset + i * (slotW + rawGap),
          y: headerPadding + matInset,
          width: slotW,
          height: innerH
        });
      }
    } else {
      const slotH = (innerH - rawGap) / 2;
      for (let i = 0; i < 2; i++) {
        rawSlots.push({
          x: marginX + matInset,
          y: headerPadding + matInset + i * (slotH + rawGap),
          width: innerW,
          height: slotH
        });
      }
    }
  } else if (layout === 'polaroid-grid') {
    const slotW = (availableWidth - rawGap) / 2;
    const slotH = (availableHeight - rawGap) / 2;
    const innerPad = Math.max(14, Math.round(slotW * 0.055));
    const chinH = Math.max(44, Math.round(slotH * 0.18));
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const cardX = marginX + c * (slotW + rawGap);
        const cardY = headerPadding + r * (slotH + rawGap);
        rawSlots.push({
          x: cardX + innerPad,
          y: cardY + innerPad,
          width: Math.max(60, slotW - innerPad * 2),
          height: Math.max(60, slotH - innerPad - chinH),
          cardRect: {
            x: cardX,
            y: cardY,
            width: slotW,
            height: slotH,
            chinHeight: chinH
          }
        });
      }
    }
  }

  const frameRects: ComputedFrameRect[] = rawSlots.map((slot, idx) => {
    // Apply aspect ratio constraint if specified (or if square-contact-grid defaults to 1:1)
    const effectiveRatio =
      forcedAspectRatio ??
      (layout === 'square-contact-grid' ? 1 : null);

    const fitted = fitBoxWithAspectRatio(
      slot.x,
      slot.y,
      slot.width,
      slot.height,
      effectiveRatio
    );

    const num = idx + 1;
    let labelCode = `0${num}`;
    const numberingMode = style.frameNumbering || preset.defaultNumbering;
    if (numberingMode === 'film-edge') {
      labelCode = `▶ ${num}A`;
    } else if (numberingMode === 'contact-proof') {
      labelCode = `35MM-${String(num * 4 + 9).padStart(2, '0')}A`;
    } else if (numberingMode === 'minimal-index') {
      labelCode = `FIG. 0${num}`;
    }

    return {
      index: idx,
      x: Math.round(fitted.x),
      y: Math.round(fitted.y),
      width: Math.round(fitted.width),
      height: Math.round(fitted.height),
      cardRect: slot.cardRect,
      labelCode
    };
  });

  // Determine whether background color is dark for contrast calculations
  const bgHex = (style.backgroundColor || '#FFFFFF').replace('#', '');
  let isDarkSurface = false;
  if (bgHex.length === 6) {
    const r = parseInt(bgHex.slice(0, 2), 16);
    const g = parseInt(bgHex.slice(2, 4), 16);
    const b = parseInt(bgHex.slice(4, 6), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    isDarkSurface = luma < 90;
  }

  return {
    targetWidth,
    targetHeight,
    headerY: Math.round(headerPadding * 0.62),
    footerY: Math.round(targetHeight - footerPadding * 0.42),
    marginX,
    marginY: headerPadding,
    cornerRadiusPx,
    frameRects,
    isDarkSurface
  };
}

/**
 * Aspect-ratio-aware non-destructive cover crop calculation.
 * Never stretches the source image: renderWidth / renderHeight === imgWidth / imgHeight.
 * Supports per-frame focal point panning (cropX, cropY in -100..100) and zoom scale (1.0..2.5).
 */
export function computeCoverCrop(
  imgWidth: number,
  imgHeight: number,
  rectWidth: number,
  rectHeight: number,
  crop?: PhotoCropState
): {
  offsetX: number;
  offsetY: number;
  renderWidth: number;
  renderHeight: number;
} {
  const safeImgW = Math.max(1, imgWidth);
  const safeImgH = Math.max(1, imgHeight);
  const safeRectW = Math.max(1, rectWidth);
  const safeRectH = Math.max(1, rectHeight);

  const imgRatio = safeImgW / safeImgH;
  const rectRatio = safeRectW / safeRectH;

  let baseW = safeRectW;
  let baseH = safeRectH;

  if (imgRatio > rectRatio) {
    baseH = safeRectH;
    baseW = safeRectH * imgRatio;
  } else {
    baseW = safeRectW;
    baseH = safeRectW / imgRatio;
  }

  const zoom = crop?.scale ? Math.max(1, Math.min(2.5, crop.scale)) : 1;
  const renderWidth = baseW * zoom;
  const renderHeight = baseH * zoom;

  const panX = crop?.cropX ? Math.max(-100, Math.min(100, crop.cropX)) / 100 : 0;
  const panY = crop?.cropY ? Math.max(-100, Math.min(100, crop.cropY)) / 100 : 0;

  const slackX = Math.max(0, (renderWidth - safeRectW) / 2);
  const slackY = Math.max(0, (renderHeight - safeRectH) / 2);

  // Center + user focal shift within available slack so image never leaves uncovered gaps
  const offsetX = -(renderWidth - safeRectW) / 2 - panX * slackX;
  const offsetY = -(renderHeight - safeRectH) / 2 - panY * slackY;

  return {
    offsetX,
    offsetY,
    renderWidth,
    renderHeight
  };
}

/**
 * Calculates print-ready pixel dimensions and scale factor for the given layout and PrintExportConfig.
 */
export function computePrintExportDimensions(
  baseWidth: number,
  baseHeight: number,
  config: PrintExportConfig
): {
  widthPx: number;
  heightPx: number;
  scaleFactor: number;
  bleedPx: number;
  safeMarginPx: number;
  physicalLabel: string;
} {
  const preset = PRINT_SIZE_PRESETS.find((p) => p.id === config.sizePreset) || PRINT_SIZE_PRESETS[0];
  const dpi = config.dpi || 300;
  const isLandscape = baseWidth > baseHeight;

  const mmToInches = (mm: number) => mm / 25.4;
  const bleedPx = config.includeBleedGuides ? Math.round(mmToInches(3) * dpi) : 0;
  const safeMarginPx = Math.round(mmToInches(Math.max(0, config.safeMarginMm || 0)) * dpi);

  if (preset.id === 'digital-highres') {
    const maxDim = Math.max(baseWidth, baseHeight);
    const rawScale = dpi === 600 ? 2.5 : dpi === 300 ? 2.0 : 1.25;
    const scaleFactor = maxDim > 1400 ? Math.min(rawScale, 1.5) : rawScale;
    const widthPx = Math.round(baseWidth * scaleFactor);
    const heightPx = Math.round(baseHeight * scaleFactor);
    return {
      widthPx,
      heightPx,
      scaleFactor,
      bleedPx,
      safeMarginPx,
      physicalLabel: `${widthPx} × ${heightPx} px (${dpi} DPI Master)`
    };
  }

  const wIn = isLandscape ? preset.heightInches : preset.widthInches;
  const hIn = isLandscape ? preset.widthInches : preset.heightInches;

  const widthPx = Math.round(wIn * dpi);
  const heightPx = Math.round(hIn * dpi);

  const scaleX = widthPx / baseWidth;
  const scaleY = heightPx / baseHeight;
  const scaleFactor = Math.max(1.25, Math.min(2.25, Math.max(scaleX, scaleY)));

  return {
    widthPx,
    heightPx,
    scaleFactor,
    bleedPx,
    safeMarginPx,
    physicalLabel: `${wIn.toFixed(1)}" × ${hIn.toFixed(1)}" @ ${dpi} DPI (${widthPx} × ${heightPx} px)`
  };
}
