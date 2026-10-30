export type CompositionGuideMode = 'off' | 'grid' | 'center' | 'both';

export interface CompositionGuideModeOption {
  id: CompositionGuideMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const COMPOSITION_GUIDE_MODES: CompositionGuideModeOption[] = [
  {
    id: 'off',
    label: 'Guide Off',
    shortLabel: 'Off',
    description: 'Clean viewfinder without framing overlays'
  },
  {
    id: 'grid',
    label: '3×3 Rule of Thirds',
    shortLabel: '3×3 Grid',
    description: '3×3 grid with power-point intersections for balanced portrait framing'
  },
  {
    id: 'center',
    label: 'Center & Strip Crop',
    shortLabel: 'Center Lines',
    description: 'Center-line axes, rangefinder crosshair & 1:1 square strip crop boundaries'
  },
  {
    id: 'both',
    label: 'Full Rangefinder Guide',
    shortLabel: 'Full Guide',
    description: 'Combined 3×3 grid, center axes & 1:1 strip crop safe zone'
  }
];

const GUIDE_MODE_ORDER: CompositionGuideMode[] = ['off', 'grid', 'center', 'both'];

/**
 * Cycles to the next composition guide mode in sequence (off -> grid -> center -> both -> off).
 */
export function cycleCompositionGuideMode(current: CompositionGuideMode): CompositionGuideMode {
  const idx = GUIDE_MODE_ORDER.indexOf(current);
  if (idx === -1) return 'grid';
  return GUIDE_MODE_ORDER[(idx + 1) % GUIDE_MODE_ORDER.length];
}

export interface CompositionGuideGeometry {
  showRuleOfThirds: boolean;
  showCenterLines: boolean;
  showStripCropSafeZone: boolean;
  /** Normalized positions (0..1) for 3x3 grid lines */
  thirds: [number, number];
  /** Normalized center axis position (0.5) */
  center: number;
  /**
   * Normalized horizontal inset (leftX, rightX) where a 1:1 square strip frame
   * crops a 4:3 (or custom aspect ratio) viewfinder image using center-cover.
   */
  squareCropSafeX: [number, number];
}

/**
 * Computes normalized guide geometry for a viewfinder of the given aspect ratio (default 4:3).
 * When a 4:3 capture is cropped into a 1:1 square photo strip frame, 12.5% on both the left
 * and right sides are trimmed ((1 - 3/4) / 2 = 0.125 -> safe zone [0.125, 0.875]).
 */
export function getCompositionGuideGeometry(
  mode: CompositionGuideMode,
  viewfinderAspect = 4 / 3
): CompositionGuideGeometry {
  const showRuleOfThirds = mode === 'grid' || mode === 'both';
  const showCenterLines = mode === 'center' || mode === 'both';
  const showStripCropSafeZone = mode !== 'off';

  const safeWidthRatio = viewfinderAspect > 1 ? 1 / viewfinderAspect : 1;
  const insetX = Number(((1 - safeWidthRatio) / 2).toFixed(4));
  const leftX = insetX;
  const rightX = Number((1 - insetX).toFixed(4));

  return {
    showRuleOfThirds,
    showCenterLines,
    showStripCropSafeZone,
    thirds: [Number((1 / 3).toFixed(4)), Number((2 / 3).toFixed(4))],
    center: 0.5,
    squareCropSafeX: [leftX, rightX]
  };
}
