import React, { useState } from 'react';
import {
  StripLayout,
  StripStyle,
  PaperStockId,
  PaperTextureId,
  FrameAspectRatio,
  FrameCornerStyle,
  CompositionOrientation,
  FrameNumberingMode,
  PhotoCropState,
  PrintExportConfig,
  PrintSizePreset
} from '../types/photobooth';
import {
  LAYOUT_PRESETS,
  PAPER_STOCK_PROFILES,
  PAPER_TEXTURE_OPTIONS,
  PRINT_SIZE_PRESETS,
  getLayoutPreset,
  getPaperStockProfile,
  computeCompositionGeometry,
  computePrintExportDimensions
} from '../utils/layoutAndPaper';
import {
  Layout,
  FileText,
  Maximize2,
  Move,
  Printer,
  RotateCcw,
  Crop,
  Sliders,
  Info
} from 'lucide-react';

interface LayoutAndPaperPanelProps {
  layout: StripLayout;
  style: StripStyle;
  printConfig: PrintExportConfig;
  onSelectLayout: (layout: StripLayout) => void;
  onUpdateStyle: (partial: Partial<StripStyle>) => void;
  onUpdatePrintConfig: (partial: Partial<PrintExportConfig>) => void;
  onTriggerHighResExport: () => void;
  onTriggerPrintModal: () => void;
}

const ASPECT_RATIO_OPTIONS: Array<{ id: FrameAspectRatio; label: string }> = [
  { id: 'auto', label: 'Layout Default' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '1:1', label: '1:1 Square' },
  { id: '3:2', label: '3:2 35mm Full' },
  { id: '3:4', label: '3:4 Portrait' },
  { id: '16:9', label: '16:9 Cinema' }
];

const CORNER_STYLE_OPTIONS: Array<{ id: FrameCornerStyle; label: string; pxLabel: string }> = [
  { id: 'sharp', label: 'Sharp', pxLabel: '0px' },
  { id: 'soft', label: 'Soft', pxLabel: '8px' },
  { id: 'rounded', label: 'Rounded', pxLabel: '20px' }
];

const NUMBERING_OPTIONS: Array<{ id: FrameNumberingMode; label: string }> = [
  { id: 'off', label: 'None' },
  { id: 'film-edge', label: '35mm Edge (▶ 1A)' },
  { id: 'minimal-index', label: 'Editorial (FIG. 01)' },
  { id: 'contact-proof', label: 'Contact Proof (35MM-13A)' }
];

export const LayoutAndPaperPanel: React.FC<LayoutAndPaperPanelProps> = ({
  layout,
  style,
  printConfig,
  onSelectLayout,
  onUpdateStyle,
  onUpdatePrintConfig,
  onTriggerHighResExport,
  onTriggerPrintModal
}) => {
  const currentPreset = getLayoutPreset(layout);
  const currentStock = getPaperStockProfile(style.paperStock);
  const [selectedCropFrame, setSelectedCropFrame] = useState<number>(0);

  const orientation: CompositionOrientation =
    style.orientation || currentPreset.defaultOrientation;
  const aspectRatio: FrameAspectRatio =
    style.frameAspectRatio || currentPreset.defaultAspectRatio;
  const cornerStyle: FrameCornerStyle =
    style.cornerStyle || currentPreset.defaultCornerStyle;
  const borderThickness =
    typeof style.frameBorderThickness === 'number'
      ? style.frameBorderThickness
      : currentPreset.defaultBorderThickness;
  const frameNumbering: FrameNumberingMode =
    style.frameNumbering || currentPreset.defaultNumbering;
  const paperTexture: PaperTextureId =
    style.paperTexture !== undefined ? style.paperTexture : currentStock.defaultTexture;
  const textureIntensity =
    typeof style.paperTextureIntensity === 'number'
      ? style.paperTextureIntensity
      : currentStock.defaultTextureIntensity;

  const activeFrameIdx = Math.min(selectedCropFrame, currentPreset.frameCount - 1);
  const activeCrop: PhotoCropState = style.frameCrops?.[activeFrameIdx] || {
    cropX: 0,
    cropY: 0,
    scale: 1
  };

  const geometry = computeCompositionGeometry(layout, style);
  const printDimensions = computePrintExportDimensions(
    geometry.targetWidth,
    geometry.targetHeight,
    printConfig
  );

  const handleLayoutClick = (nextLayout: StripLayout) => {
    const nextPreset = getLayoutPreset(nextLayout);
    const nextStockId = nextPreset.defaultPaperStock || style.paperStock || 'pure-white';
    const nextStock = getPaperStockProfile(nextStockId);

    onSelectLayout(nextLayout);
    onUpdateStyle({
      orientation: nextPreset.defaultOrientation,
      framePadding: nextPreset.defaultGap,
      stripMargin: nextPreset.defaultMargin,
      frameBorderThickness: nextPreset.defaultBorderThickness,
      cornerStyle: nextPreset.defaultCornerStyle,
      sprocketHoles: nextPreset.defaultSprocketHoles,
      frameNumbering: nextPreset.defaultNumbering,
      frameAspectRatio: nextPreset.defaultAspectRatio,
      ...(nextPreset.defaultPaperStock
        ? {
            paperStock: nextStock.id,
            backgroundColor: nextStock.backgroundColor,
            textColor: nextStock.textColor,
            frameBorderColor: nextStock.frameBorderColor,
            paperTexture: nextStock.defaultTexture,
            paperTextureIntensity: nextStock.defaultTextureIntensity
          }
        : {})
    });
  };

  const handleSelectPaperStock = (stockId: PaperStockId) => {
    const profile = getPaperStockProfile(stockId);
    onUpdateStyle({
      paperStock: profile.id,
      backgroundColor: profile.backgroundColor,
      textColor: profile.textColor,
      frameBorderColor: profile.frameBorderColor,
      paperTexture: profile.defaultTexture,
      paperTextureIntensity: profile.defaultTextureIntensity
    });
  };

  const handleUpdateFrameCrop = (frameIdx: number, partial: Partial<PhotoCropState>) => {
    const prevCrop = style.frameCrops?.[frameIdx] || { cropX: 0, cropY: 0, scale: 1 };
    const nextCrop: PhotoCropState = { ...prevCrop, ...partial };
    onUpdateStyle({
      frameCrops: {
        ...(style.frameCrops || {}),
        [frameIdx]: nextCrop
      }
    });
  };

  const handleResetFrameCrop = (frameIdx: number) => {
    const nextMap = { ...(style.frameCrops || {}) };
    delete nextMap[frameIdx];
    onUpdateStyle({ frameCrops: nextMap });
  };

  const handleResetAllCrops = () => {
    onUpdateStyle({ frameCrops: {} });
  };

  const handleResetSpacing = () => {
    onUpdateStyle({
      framePadding: currentPreset.defaultGap,
      stripMargin: currentPreset.defaultMargin,
      frameBorderThickness: currentPreset.defaultBorderThickness,
      cornerStyle: currentPreset.defaultCornerStyle,
      frameAspectRatio: currentPreset.defaultAspectRatio
    });
  };

  return (
    <div className="space-y-6 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
      {/* GROUP 1: STRIP FORMAT */}
      <section className="bg-white p-4 rounded-xl border border-[#E0D8C8] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE1] pb-2.5">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-[#6B2D38]" />
            <div>
              <h3 className="text-xs font-serif font-bold text-[#1C1917]">1. Strip Format</h3>
              <p className="text-[11px] text-[#6B6458]">
                12 photographic layouts with dedicated frame geometry
              </p>
            </div>
          </div>

          {/* Portrait / Landscape Orientation Toggle */}
          <div
            className="inline-flex rounded-md bg-[#F6F3EC] p-0.5 border border-[#E0D8C8]"
            role="group"
            aria-label="Composition Orientation"
          >
            {(['portrait', 'landscape'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateStyle({ orientation: mode })}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap capitalize ${
                  orientation === mode
                    ? 'bg-[#1C1917] text-white font-semibold'
                    : 'text-[#575249] hover:text-[#1C1917]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Layout Presets Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {LAYOUT_PRESETS.map((item) => {
            const isSelected = layout === item.id;
            const isLandscapePreview =
              (isSelected ? orientation : item.defaultOrientation) === 'landscape';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLayoutClick(item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#FDFBF7] border-[#6B2D38] ring-1 ring-[#6B2D38] shadow-xs'
                    : 'bg-[#F6F3EC] border-[#E2DDD3] hover:border-[#BDB5A5] hover:bg-white'
                }`}
              >
                {/* Crisp Schematic SVG Preview */}
                <div
                  className={`w-10 h-12 shrink-0 rounded border flex items-center justify-center p-1 ${
                    item.defaultPaperStock === 'darkroom-black'
                      ? 'bg-[#18181B] border-stone-700'
                      : 'bg-white border-[#D6CFC2]'
                  }`}
                >
                  <svg
                    viewBox={isLandscapePreview ? '0 0 48 36' : '0 0 36 48'}
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    {item.previewBoxes.map((box, idx) => {
                      const bx = isLandscapePreview ? box.y * 48 : box.x * 36;
                      const by = isLandscapePreview ? box.x * 36 : box.y * 48;
                      const bw = isLandscapePreview ? box.h * 48 : box.w * 36;
                      const bh = isLandscapePreview ? box.w * 36 : box.h * 48;
                      return (
                        <rect
                          key={idx}
                          x={bx}
                          y={by}
                          width={bw}
                          height={bh}
                          rx={item.defaultCornerStyle === 'sharp' ? 0.5 : 2}
                          className={
                            isSelected
                              ? 'fill-[#6B2D38] stroke-[#6B2D38]'
                              : item.defaultPaperStock === 'darkroom-black'
                              ? 'fill-amber-500/80 stroke-amber-400'
                              : 'fill-[#8C8275] stroke-[#575249]'
                          }
                          strokeWidth="0.6"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-serif font-bold text-[#1C1917] truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[#6B6458] truncate">{item.subtitle}</div>
                  <div className="text-[10px] font-mono text-[#8C8275] tabular-nums">
                    {item.frameCount} {item.frameCount === 1 ? 'Frame' : 'Frames'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* GROUP 2: PAPER STOCK */}
      <section className="bg-white p-4 rounded-xl border border-[#E0D8C8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6B2D38]" />
            <div>
              <h3 className="text-xs font-serif font-bold text-[#1C1917]">2. Paper Stock</h3>
              <p className="text-[11px] text-[#6B6458]">
                Archival darkroom & studio paper profiles with surface texture control
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#6B2D38] font-semibold">
            {currentStock.name}
          </span>
        </div>

        {/* 8 Paper Stock Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAPER_STOCK_PROFILES.map((stock) => {
            const isSelected =
              style.paperStock === stock.id ||
              (!style.paperStock && style.backgroundColor === stock.backgroundColor);
            return (
              <button
                key={stock.id}
                type="button"
                onClick={() => handleSelectPaperStock(stock.id)}
                className={`p-2.5 rounded-lg border text-left transition-all space-y-1.5 ${
                  isSelected
                    ? 'bg-[#FDFBF7] border-[#6B2D38] ring-1 ring-[#6B2D38] shadow-2xs'
                    : 'bg-[#F6F3EC] border-[#E2DDD3] hover:border-[#BDB5A5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: stock.backgroundColor }}
                  />
                  <span className="text-[10px] font-mono text-[#8C8275] truncate">
                    {stock.finishLabel.split(' ')[0]}
                  </span>
                </div>
                <div className="text-xs font-serif font-bold text-[#1C1917] truncate">
                  {stock.name}
                </div>
                <div className="text-[10px] text-[#6B6458] line-clamp-1">{stock.finishLabel}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Background Color & Texture Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-[#F6F3EC] border border-[#E2DDD3] flex items-center justify-between gap-2">
            <div>
              <label
                htmlFor="paper-custom-bg"
                className="text-xs font-serif font-bold text-[#1C1917] block"
              >
                Paper Tint Override
              </label>
              <span className="text-[10px] font-mono text-[#6B6458] uppercase tabular-nums">
                {style.backgroundColor}
              </span>
            </div>
            <input
              id="paper-custom-bg"
              type="color"
              value={style.backgroundColor}
              onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
              className="w-9 h-7 rounded border border-[#D6CFC2] cursor-pointer bg-transparent"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-[#F6F3EC] border border-[#E2DDD3] space-y-1">
            <label
              htmlFor="paper-texture-select"
              className="text-xs font-serif font-bold text-[#1C1917] block"
            >
              Surface Weave / Fiber
            </label>
            <select
              id="paper-texture-select"
              value={paperTexture}
              onChange={(e) => {
                const nextTex = e.target.value as PaperTextureId;
                onUpdateStyle({
                  paperTexture: nextTex,
                  paperTextureIntensity:
                    nextTex === 'none'
                      ? 0
                      : textureIntensity === 0
                      ? 30
                      : textureIntensity
                });
              }}
              className="w-full px-2 py-1 text-xs font-mono bg-white border border-[#D6CFC2] rounded text-[#1C1917]"
            >
              {PAPER_TEXTURE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Texture Intensity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="paper-texture-intensity" className="font-medium text-[#1C1917]">
              Paper Texture Intensity
            </label>
            <span className="font-mono text-[#6B6458] tabular-nums">
              {paperTexture === 'none' ? '0% (None)' : `${textureIntensity}%`}
            </span>
          </div>
          <input
            id="paper-texture-intensity"
            type="range"
            min="0"
            max="100"
            disabled={paperTexture === 'none'}
            value={paperTexture === 'none' ? 0 : textureIntensity}
            onChange={(e) =>
              onUpdateStyle({ paperTextureIntensity: parseInt(e.target.value, 10) })
            }
            className="w-full accent-[#6B2D38] disabled:opacity-40"
          />
        </div>

        {/* Honest Simulation Disclaimer */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F6F3EC] border border-[#E2DDD3] text-[11px] text-[#6B6458]">
          <Info className="w-3.5 h-3.5 text-[#6B2D38] shrink-0 mt-0.5" />
          <span>
            Paper stock profiles simulate surface color and micro-texture in the digital master;
            physical print sheen depends on the actual photo paper loaded in your printer.
          </span>
        </div>
      </section>

      {/* GROUP 3: FRAME STYLING & PER-PHOTO CROP */}
      <section className="bg-white p-4 rounded-xl border border-[#E0D8C8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-[#6B2D38]" />
            <div>
              <h3 className="text-xs font-serif font-bold text-[#1C1917]">3. Frame Styling</h3>
              <p className="text-[11px] text-[#6B6458]">
                Aspect ratio, corner geometry, border weight, and non-destructive focal crop
              </p>
            </div>
          </div>
        </div>

        {/* Frame Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-xs font-serif font-bold text-[#1C1917] block">
            Frame Aspect Ratio
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateStyle({ frameAspectRatio: opt.id })}
                className={`px-2 py-1.5 text-[11px] font-mono rounded border text-center transition-colors whitespace-nowrap ${
                  aspectRatio === opt.id
                    ? 'bg-[#1C1917] text-white border-[#1C1917] font-semibold'
                    : 'bg-[#F6F3EC] text-[#575249] border-[#E0D8C8] hover:border-[#1C1917]'
                }`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Style & Border Thickness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-serif font-bold text-[#1C1917] block">
              Frame Corner Style
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CORNER_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateStyle({ cornerStyle: opt.id })}
                  className={`py-1.5 px-2 text-xs rounded border text-center transition-colors whitespace-nowrap ${
                    cornerStyle === opt.id
                      ? 'bg-[#6B2D38] text-white border-[#6B2D38] font-semibold'
                      : 'bg-[#F6F3EC] text-[#575249] border-[#E0D8C8] hover:border-[#1C1917]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="frame-border-thickness" className="font-serif font-bold text-[#1C1917]">
                Frame Border Thickness
              </label>
              <span className="font-mono text-[#6B6458] tabular-nums">{borderThickness}px</span>
            </div>
            <input
              id="frame-border-thickness"
              type="range"
              min="0"
              max="20"
              value={borderThickness}
              onChange={(e) =>
                onUpdateStyle({ frameBorderThickness: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#6B2D38]"
            />
          </div>
        </div>

        {/* Individual Photo Crop Position & Scaling */}
        <div className="p-3.5 rounded-xl bg-[#F6F3EC] border border-[#E2DDD3] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-[#6B2D38]" />
              <span className="text-xs font-serif font-bold text-[#1C1917]">
                Individual Photo Crop & Focal Position
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetFrameCrop(activeFrameIdx)}
                className="px-2 py-0.5 text-[11px] font-mono text-[#575249] hover:text-[#1C1917] bg-white border border-[#D6CFC2] rounded whitespace-nowrap"
              >
                Reset Frame
              </button>
              <button
                type="button"
                onClick={handleResetAllCrops}
                className="px-2 py-0.5 text-[11px] font-mono text-[#6B2D38] hover:bg-[#EFECE3] bg-white border border-[#6B2D38]/30 rounded whitespace-nowrap"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Target Frame Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: currentPreset.frameCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCropFrame(idx)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                  activeFrameIdx === idx
                    ? 'bg-[#1C1917] text-white font-semibold'
                    : 'bg-white text-[#575249] border border-[#D6CFC2] hover:border-[#1C1917]'
                }`}
              >
                Frame {idx + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="crop-pan-x" className="text-[#575249] font-medium">
                  Horizontal Pan (X)
                </label>
                <span className="font-mono text-[#1C1917] tabular-nums">{activeCrop.cropX}%</span>
              </div>
              <input
                id="crop-pan-x"
                type="range"
                min="-100"
                max="100"
                value={activeCrop.cropX}
                onChange={(e) =>
                  handleUpdateFrameCrop(activeFrameIdx, { cropX: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#6B2D38]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="crop-pan-y" className="text-[#575249] font-medium">
                  Vertical Pan (Y)
                </label>
                <span className="font-mono text-[#1C1917] tabular-nums">{activeCrop.cropY}%</span>
              </div>
              <input
                id="crop-pan-y"
                type="range"
                min="-100"
                max="100"
                value={activeCrop.cropY}
                onChange={(e) =>
                  handleUpdateFrameCrop(activeFrameIdx, { cropY: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#6B2D38]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <label htmlFor="crop-zoom-scale" className="text-[#575249] font-medium">
                  Crop Scale (Zoom)
                </label>
                <span className="font-mono text-[#1C1917] tabular-nums">
                  {activeCrop.scale.toFixed(2)}×
                </span>
              </div>
              <input
                id="crop-zoom-scale"
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={activeCrop.scale}
                onChange={(e) =>
                  handleUpdateFrameCrop(activeFrameIdx, { scale: parseFloat(e.target.value) })
                }
                className="w-full accent-[#6B2D38]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* GROUP 4: MARGINS AND SPACING */}
      <section className="bg-white p-4 rounded-xl border border-[#E0D8C8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-[#6B2D38]" />
            <div>
              <h3 className="text-xs font-serif font-bold text-[#1C1917]">
                4. Margins and Spacing
              </h3>
              <p className="text-[11px] text-[#6B6458]">
                Inter-frame gutter spacing and outer paper border width
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetSpacing}
            className="px-2.5 py-1 text-[11px] font-mono text-[#575249] hover:text-[#1C1917] bg-[#F6F3EC] border border-[#E0D8C8] rounded flex items-center gap-1 whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Default Spacing</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="frame-gap-slider" className="font-serif font-bold text-[#1C1917]">
                Frame Gap
              </label>
              <span className="font-mono text-[#6B6458] tabular-nums">{style.framePadding}px</span>
            </div>
            <input
              id="frame-gap-slider"
              type="range"
              min="0"
              max="48"
              value={style.framePadding}
              onChange={(e) =>
                onUpdateStyle({ framePadding: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#1C1917]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#8C8275] tabular-nums">
              <span>0px</span>
              <span>Default: {currentPreset.defaultGap}px</span>
              <span>48px</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="outer-margin-slider" className="font-serif font-bold text-[#1C1917]">
                Outer Margin
              </label>
              <span className="font-mono text-[#6B6458] tabular-nums">{style.stripMargin}px</span>
            </div>
            <input
              id="outer-margin-slider"
              type="range"
              min="12"
              max="80"
              value={style.stripMargin}
              onChange={(e) =>
                onUpdateStyle({ stripMargin: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#1C1917]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#8C8275] tabular-nums">
              <span>12px</span>
              <span>Default: {currentPreset.defaultMargin}px</span>
              <span>80px</span>
            </div>
          </div>
        </div>
      </section>

      {/* GROUP 5: PRINT DETAILS & EXPORT SPECIFICATION */}
      <section className="bg-white p-4 rounded-xl border border-[#E0D8C8] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#6B2D38]" />
            <div>
              <h3 className="text-xs font-serif font-bold text-[#1C1917]">5. Print Details</h3>
              <p className="text-[11px] text-[#6B6458]">
                Typography colophon, frame numbering, sprocket rebates, and print-ready DPI
              </p>
            </div>
          </div>
        </div>

        {/* Header & Footer Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="strip-header-input"
              className="text-xs font-serif font-bold text-[#1C1917] block"
            >
              Header Imprint Text
            </label>
            <input
              id="strip-header-input"
              type="text"
              value={style.headerText}
              onChange={(e) => onUpdateStyle({ headerText: e.target.value })}
              placeholder="e.g. LUMIÈRE STUDIO"
              className="w-full px-2.5 py-1.5 text-xs bg-[#F6F3EC] border border-[#E0D8C8] rounded font-mono text-[#1C1917]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="strip-footer-input"
              className="text-xs font-serif font-bold text-[#1C1917] block"
            >
              Footer Colophon Text
            </label>
            <input
              id="strip-footer-input"
              type="text"
              value={style.footerText}
              onChange={(e) => onUpdateStyle({ footerText: e.target.value })}
              placeholder="e.g. 35MM FILM · PARIS"
              className="w-full px-2.5 py-1.5 text-xs bg-[#F6F3EC] border border-[#E0D8C8] rounded font-mono text-[#1C1917]"
            />
          </div>
        </div>

        {/* Frame Numbering & Sprocket Holes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="frame-numbering-select"
              className="text-xs font-serif font-bold text-[#1C1917] block"
            >
              Frame Numbering
            </label>
            <select
              id="frame-numbering-select"
              value={frameNumbering}
              onChange={(e) =>
                onUpdateStyle({ frameNumbering: e.target.value as FrameNumberingMode })
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#F6F3EC] border border-[#E0D8C8] rounded text-[#1C1917]"
            >
              {NUMBERING_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F3EC] border border-[#E0D8C8] text-xs font-medium text-[#1C1917] cursor-pointer">
              <span>35mm Sprocket-Hole Edges</span>
              <input
                type="checkbox"
                checked={style.sprocketHoles}
                onChange={(e) => onUpdateStyle({ sprocketHoles: e.target.checked })}
                className="w-4 h-4 accent-[#6B2D38]"
              />
            </label>
          </div>
        </div>

        {/* Print-Ready Output Resolution & Format */}
        <div className="p-3.5 rounded-xl bg-[#F6F3EC] border border-[#E2DDD3] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-serif font-bold text-[#1C1917] block">
                Print-Ready Export Specification
              </span>
              <span className="text-[11px] font-mono text-[#6B2D38] tabular-nums">
                {printDimensions.physicalLabel}
              </span>
            </div>

            <div
              className="inline-flex rounded bg-white p-0.5 border border-[#D6CFC2]"
              role="group"
              aria-label="Export DPI"
            >
              {([150, 300, 600] as const).map((dpiVal) => (
                <button
                  key={dpiVal}
                  type="button"
                  onClick={() => onUpdatePrintConfig({ dpi: dpiVal })}
                  className={`px-2 py-1 text-[11px] font-mono rounded transition-colors tabular-nums whitespace-nowrap ${
                    printConfig.dpi === dpiVal
                      ? 'bg-[#1C1917] text-white font-semibold'
                      : 'text-[#575249] hover:text-[#1C1917]'
                  }`}
                >
                  {dpiVal} DPI
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="print-preset-select"
                className="text-[11px] font-medium text-[#575249] block mb-1"
              >
                Output Sheet / Format Size
              </label>
              <select
                id="print-preset-select"
                value={printConfig.sizePreset}
                onChange={(e) =>
                  onUpdatePrintConfig({ sizePreset: e.target.value as PrintSizePreset })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#D6CFC2] rounded text-[#1C1917]"
              >
                {PRINT_SIZE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dimensionsLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white border border-[#D6CFC2] text-xs text-[#1C1917] cursor-pointer">
                <span>Bleed & Crop Marks</span>
                <input
                  type="checkbox"
                  checked={printConfig.includeBleedGuides}
                  onChange={(e) =>
                    onUpdatePrintConfig({ includeBleedGuides: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#6B2D38]"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onTriggerPrintModal}
              className="px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-white hover:bg-[#EAE5DA] border border-[#D6CFC2] rounded-md transition-colors whitespace-nowrap"
            >
              Print Sheet Layout
            </button>
            <button
              type="button"
              onClick={onTriggerHighResExport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B2D38] hover:bg-[#802834] rounded-md transition-colors whitespace-nowrap"
            >
              Download {printConfig.dpi} DPI Master
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
