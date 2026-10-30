export type AppStep = 'landing' | 'camera' | 'review' | 'editor' | 'preview';

export interface FrameFilterOverride {
  preset: FilterPreset;
  adjustments: FilterAdjustments;
  filmEffects: FilmEffectsState;
}

export interface PhotoCropState {
  cropX: number; // -100 to 100 (0 is center)
  cropY: number; // -100 to 100 (0 is center)
  scale: number; // 1.0 to 2.5 (1.0 is default cover)
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  originalDataUrl?: string;
  enhancedDataUrl?: string;
  isEnhanced?: boolean;
  enhancementMode?: 'original' | 'standard' | 'ai-enhance';
  scaleFactor?: number;
  timestamp: number;
  cameraName?: string;
  width?: number;
  height?: number;
  frameOverride?: FrameFilterOverride;
  crop?: PhotoCropState;
}

export type StripLayout =
  | 'strip-3'
  | 'strip-4'
  | 'grid-2x2'
  | 'horizontal-3'
  | 'classic-booth'
  | 'contact-sheet'
  | 'editorial-print'
  | 'instant-print'
  | 'square-contact-grid'
  | 'film-negative-strip'
  | 'minimal-gallery-print'
  | 'polaroid-grid';

export type PaperStockId =
  | 'fine-art-matte'
  | 'glossy-photo'
  | 'lustre-pearl'
  | 'archival-cream'
  | 'darkroom-black'
  | 'pure-white'
  | 'warm-ivory'
  | 'soft-gray';

export type PaperTextureId =
  | 'none'
  | 'cotton-rag'
  | 'pearl-lustre'
  | 'silver-halide'
  | 'linen-press';

export type FrameAspectRatio = 'auto' | '4:3' | '1:1' | '3:4' | '3:2' | '16:9';

export type FrameCornerStyle = 'sharp' | 'soft' | 'rounded';

export type CompositionOrientation = 'portrait' | 'landscape';

export type FrameNumberingMode = 'off' | 'film-edge' | 'minimal-index' | 'contact-proof';

export type PrintSizePreset = 'digital-highres' | '2x6-strip' | '4x6-print' | '5x7-editorial' | 'a4-sheet';

export interface PrintExportConfig {
  sizePreset: PrintSizePreset;
  dpi: 150 | 300 | 600;
  includeBleedGuides: boolean;
  safeMarginMm: number;
  duplexOn4x6: boolean;
}

export type FilterPreset = 
  | 'original'
  | 'warm-film'
  | 'soft-matte'
  | 'vintage-fade'
  | 'classic-mono'
  | 'cool-film'
  | 'disposable'
  | 'y2k-flash'
  | 'light-leak'
  | 'expired-film'
  | 'cinestill-glow'
  | 'noir-400'
  | 'dream-bloom'
  | 'party-disposable'
  | 'cinema-800t'
  | '90s-snapshot'
  | 'pastel-romance'
  | 'classic-booth'
  | 'vhs-memory';

export interface EffectToggleState {
  enabled: boolean;
  intensity: number; // 0 - 100
}

export interface FilmEffectsState {
  grain: EffectToggleState;
  halation: EffectToggleState;
  lightLeak: EffectToggleState & { position?: 'top-left' | 'top-right' | 'bottom-right' | 'left-edge' };
  bloom: EffectToggleState;
  vignette: EffectToggleState;
  dustScratches: EffectToggleState;
  chromaticAberration: EffectToggleState;
  vhsScanlines: EffectToggleState;
  dateStamp: {
    enabled: boolean;
    text: string;
    color: string;
  };
}

export interface FilterAdjustments {
  intensity: number; // 0 - 100
  brightness: number; // -50 to +50
  contrast: number; // -50 to +50
  saturation: number; // -100 to +100
  warmth: number; // -50 to +50
  tint?: number; // -50 to +50
  grain: number; // 0 to 100 (for backwards compatibility)
  vignette: number; // 0 to 100 (for backwards compatibility)
  effects?: Partial<FilmEffectsState>;
}

export interface CustomCaption {
  id: string;
  text: string;
  font: 'garamond' | 'courier' | 'handwriting' | 'sans';
  size: number;
  color: string;
  align: 'left' | 'center' | 'right';
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  rotation: number; // degrees
}

export type StickerCategory =
  | 'film-lab'
  | 'fine-line'
  | 'film-frames'
  | 'editorial-type'
  | 'paper-ephemera'
  | 'date-location';

export type StickerFontFamily = 'garamond' | 'sans' | 'courier';

export interface CustomSticker {
  id: string;
  assetId: string;
  category: StickerCategory;
  type: 'svg' | 'typography' | 'stamp' | 'ephemera' | 'frame';
  symbol: string;
  label?: string;
  text?: string;
  subtext?: string;
  fontFamily?: StickerFontFamily;
  fontSize?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  opacity?: number; // 0.1 to 1.0
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  size: number;
  rotation: number; // degrees
  zIndex?: number;
}

export interface StripStyle {
  backgroundColor: string; // e.g. '#FFFFFF', '#18181B', '#F5EBE0', '#3B0A11'
  textColor: string;
  framePadding: number; // px (Frame Gap)
  stripMargin: number; // px (Outer Margin)
  borderRadius: number; // px
  borderStyle: 'classic' | 'sprocket' | 'polaroid' | 'kraft';
  showDateStamp: boolean;
  customDateText: string; // e.g. "'26 10 29"
  headerText: string;
  footerText: string;
  sprocketHoles: boolean;
  // Enhanced Layout & Paper Stock System
  paperStock?: PaperStockId;
  paperTexture?: PaperTextureId;
  paperTextureIntensity?: number; // 0 to 100
  frameAspectRatio?: FrameAspectRatio;
  frameBorderThickness?: number; // 0 to 24 px
  frameBorderColor?: string;
  cornerStyle?: FrameCornerStyle;
  orientation?: CompositionOrientation;
  frameNumbering?: FrameNumberingMode;
  frameCrops?: Record<number, PhotoCropState>;
}

export interface SharedStripData {
  id: string;
  imageData: string;
  createdAt: string;
  title?: string;
  layout?: string;
}
