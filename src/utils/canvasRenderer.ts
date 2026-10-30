import {
  CapturedPhoto,
  StripLayout,
  FilterPreset,
  FilterAdjustments,
  CustomCaption,
  CustomSticker,
  StripStyle,
  FilmEffectsState,
  PrintExportConfig
} from '../types/photobooth';
import { applyCanvasFilters, DEFAULT_FILM_EFFECTS } from './filterEngine';
import { drawStickerOnCanvas } from './stickerRenderer';
import { sortStickersByLayer, resolveFrameFilter } from './stickerLibrary';
import {
  computeCompositionGeometry,
  computeCoverCrop,
  getPaperStockProfile,
  getLayoutPreset
} from './layoutAndPaper';

export interface RenderOptions {
  photos: CapturedPhoto[];
  layout: StripLayout;
  style: StripStyle;
  preset: FilterPreset;
  adjustments: FilterAdjustments;
  captions: CustomCaption[];
  stickers: CustomSticker[];
  batchApply?: boolean;
  scaleFactor?: number; // 1 for web preview/standard, 2 to 4 for high-res print export
  printConfig?: PrintExportConfig;
}

// Helper to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Deterministic pseudo-random helper so paper texture never flickers between re-renders
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Renders believable, restrained paper stock texture & surface finish onto the paper canvas
 * before photographs are placed so photographs themselves are never altered.
 */
function drawPaperStockSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: StripStyle,
  isDarkSurface: boolean
) {
  const stock = getPaperStockProfile(style.paperStock);
  const textureType =
    style.paperTexture !== undefined ? style.paperTexture : stock.defaultTexture;
  const rawIntensity =
    typeof style.paperTextureIntensity === 'number'
      ? style.paperTextureIntensity
      : stock.defaultTextureIntensity;
  const intensity = Math.max(0, Math.min(100, rawIntensity)) / 100;

  // Subtle directional paper sheen for glossy or pearl stocks (on paper base only)
  if (stock.sheenType === 'gloss' || stock.sheenType === 'pearl') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    const sheenAlpha = stock.sheenType === 'gloss' ? 0.045 : 0.025;
    grad.addColorStop(0, `rgba(255, 255, 255, ${sheenAlpha})`);
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.75, `rgba(0, 0, 0, ${sheenAlpha * 0.45})`);
    grad.addColorStop(1, `rgba(255, 255, 255, ${sheenAlpha * 0.6})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  if (textureType === 'none' || intensity <= 0.01) {
    return;
  }

  ctx.save();

  if (textureType === 'cotton-rag' || style.borderStyle === 'kraft') {
    // Organic short archival fiber flecks + warm paper tooth
    const count = Math.round(2800 * intensity);
    ctx.strokeStyle = isDarkSurface
      ? `rgba(255, 248, 235, ${0.04 * intensity})`
      : `rgba(92, 74, 52, ${0.055 * intensity})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const rx = seededRandom(i * 3 + 1) * width;
      const ry = seededRandom(i * 3 + 2) * height;
      const angle = seededRandom(i * 3 + 3) * Math.PI;
      const len = 2 + seededRandom(i * 5) * 4;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(angle) * len, ry + Math.sin(angle) * len);
    }
    ctx.stroke();
  } else if (textureType === 'pearl-lustre') {
    // Uniform micro-stippled satin lab matrix
    const step = 10;
    const dotAlpha = (isDarkSurface ? 0.04 : 0.035) * intensity;
    ctx.fillStyle = isDarkSurface
      ? `rgba(255, 255, 255, ${dotAlpha})`
      : `rgba(40, 35, 30, ${dotAlpha})`;
    for (let y = 4; y < height; y += step) {
      for (let x = (y % (step * 2) === 0 ? 4 : 9); x < width; x += step) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  } else if (textureType === 'silver-halide') {
    // Fine baryta grain particles
    const count = Math.round(3400 * intensity);
    ctx.fillStyle = isDarkSurface
      ? `rgba(240, 236, 228, ${0.045 * intensity})`
      : `rgba(30, 26, 22, ${0.045 * intensity})`;
    for (let i = 0; i < count; i++) {
      const rx = seededRandom(i * 7 + 11) * width;
      const ry = seededRandom(i * 7 + 19) * height;
      ctx.fillRect(rx, ry, 1.25, 1.25);
    }
  } else if (textureType === 'linen-press') {
    // Delicate orthogonal cross-weave editorial lines
    const spacing = 8;
    const lineAlpha = (isDarkSurface ? 0.038 : 0.032) * intensity;
    ctx.strokeStyle = isDarkSurface
      ? `rgba(255, 250, 240, ${lineAlpha})`
      : `rgba(60, 50, 40, ${lineAlpha})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = 0; x < width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a rounded or sharp rectangle path
 */
function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  if (radius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else if (radius > 0) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Draws crop/bleed registration marks in corners when print bleed guides are enabled
 */
function drawPrintBleedGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDarkSurface: boolean
) {
  ctx.save();
  ctx.strokeStyle = isDarkSurface ? 'rgba(244, 240, 234, 0.45)' : 'rgba(28, 25, 23, 0.45)';
  ctx.lineWidth = 1;
  const inset = 14;
  const len = 18;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(inset, 4);
  ctx.lineTo(inset, inset + len);
  ctx.moveTo(4, inset);
  ctx.lineTo(inset + len, inset);
  // Top-right
  ctx.moveTo(width - inset, 4);
  ctx.lineTo(width - inset, inset + len);
  ctx.moveTo(width - 4, inset);
  ctx.lineTo(width - inset - len, inset);
  // Bottom-left
  ctx.moveTo(inset, height - 4);
  ctx.lineTo(inset, height - inset - len);
  ctx.moveTo(4, height - inset);
  ctx.lineTo(inset + len, height - inset);
  // Bottom-right
  ctx.moveTo(width - inset, height - 4);
  ctx.lineTo(width - inset, height - inset - len);
  ctx.moveTo(width - 4, height - inset);
  ctx.lineTo(width - inset - len, height - inset);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the complete composition onto an HTML Canvas and returns it.
 * Used as the single shared composition model across Live Preview, High-Res Download,
 * Print-Ready Output, and QR Share.
 */
export async function renderPhotoStripCanvas(options: RenderOptions): Promise<HTMLCanvasElement> {
  const {
    photos,
    layout,
    style,
    preset,
    adjustments,
    captions,
    stickers,
    batchApply = true,
    scaleFactor = 1,
    printConfig
  } = options;

  const layoutPreset = getLayoutPreset(layout);
  const stockProfile = getPaperStockProfile(style.paperStock);
  const geometry = computeCompositionGeometry(layout, style);
  const {
    targetWidth,
    targetHeight,
    headerY,
    footerY,
    cornerRadiusPx,
    frameRects,
    isDarkSurface
  } = geometry;

  const canvasWidth = Math.round(targetWidth * scaleFactor);
  const canvasHeight = Math.round(targetHeight * scaleFactor);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not obtain canvas 2D rendering context');
  }

  ctx.save();
  ctx.scale(scaleFactor, scaleFactor);

  // 1. Draw Paper Stock Base Color
  const bgColor = style.backgroundColor || stockProfile.backgroundColor || '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Draw Restrained Paper Stock Surface Finish & Texture (only on paper surface)
  drawPaperStockSurface(ctx, targetWidth, targetHeight, style, isDarkSurface);

  // 3. Layout-Specific Structural Accents (Classic Booth outer hairline, Minimal Gallery Mat, Contact Sheet header rule)
  if (layout === 'classic-booth') {
    ctx.save();
    ctx.strokeStyle = isDarkSurface ? 'rgba(244, 240, 234, 0.22)' : 'rgba(28, 25, 23, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 14, targetWidth - 28, targetHeight - 28);
    ctx.restore();
  } else if (layout === 'minimal-gallery-print') {
    ctx.save();
    ctx.strokeStyle = isDarkSurface ? 'rgba(244, 240, 234, 0.16)' : 'rgba(28, 25, 23, 0.12)';
    ctx.lineWidth = 1;
    const matX = Math.round(geometry.marginX * 0.72);
    const matY = Math.round(geometry.marginY * 0.72);
    ctx.strokeRect(matX, matY, targetWidth - matX * 2, targetHeight - matY * 2);
    ctx.restore();
  } else if (layout === 'contact-sheet') {
    ctx.save();
    ctx.strokeStyle = isDarkSurface ? 'rgba(249, 115, 22, 0.35)' : 'rgba(107, 45, 56, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(geometry.marginX, headerY + 14);
    ctx.lineTo(targetWidth - geometry.marginX, headerY + 14);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Sprocket Holes option (or Film Negative Strip default)
  const showSprockets = Boolean(
    style.sprocketHoles || style.borderStyle === 'sprocket' || layout === 'film-negative-strip'
  );
  if (showSprockets) {
    ctx.save();
    ctx.fillStyle = '#0F0E0C';
    const sprocketWidth = 38;
    ctx.fillRect(0, 0, sprocketWidth, targetHeight);
    ctx.fillRect(targetWidth - sprocketWidth, 0, sprocketWidth, targetHeight);

    const holeW = 16;
    const holeH = 24;
    const gap = 46;
    for (let y = 22; y < targetHeight - 22; y += gap) {
      ctx.fillStyle = bgColor === '#141312' ? '#2A2724' : bgColor;
      traceRoundedRect(ctx, (sprocketWidth - holeW) / 2, y, holeW, holeH, 3);
      ctx.fill();

      traceRoundedRect(
        ctx,
        targetWidth - sprocketWidth + (sprocketWidth - holeW) / 2,
        y,
        holeW,
        holeH,
        3
      );
      ctx.fill();

      ctx.fillStyle = '#D97706';
      ctx.font = '600 9px "Courier Prime", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('LUMIÈRE 400', 4, y + 15);
      ctx.textAlign = 'right';
      ctx.fillText('▶ 35MM', targetWidth - 4, y + 15);
    }
    ctx.restore();
  }

  // 5. Draw Header Text (if configured)
  const primaryTextColor = style.textColor || stockProfile.textColor || (isDarkSurface ? '#F4F0EA' : '#1C1917');
  if (style.headerText && style.headerText.trim()) {
    ctx.save();
    ctx.fillStyle = primaryTextColor;
    ctx.font = '600 16px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    ctx.fillText(style.headerText.toUpperCase(), targetWidth / 2, headerY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  const globalFilmEffects = (adjustments.effects || DEFAULT_FILM_EFFECTS) as FilmEffectsState;
  const borderThickness =
    typeof style.frameBorderThickness === 'number'
      ? Math.max(0, Math.min(24, style.frameBorderThickness))
      : layoutPreset.defaultBorderThickness;
  const numberingMode = style.frameNumbering || layoutPreset.defaultNumbering;

  // 6. Render Each Frame Slot with Aspect-Cover Crop, Per-Frame Focal Adjustment, and Pixel Filters
  for (let i = 0; i < frameRects.length; i++) {
    const rect = frameRects[i];
    // Fall back cyclically if layout has more frames than captured photos (e.g. 4-frame layout with 3 photos)
    const photo = photos[i] || (photos.length > 0 ? photos[i % photos.length] : undefined);

    // Optional Instant / Polaroid outer card container
    if (rect.cardRect) {
      ctx.save();
      ctx.shadowColor = isDarkSurface ? 'rgba(0, 0, 0, 0.55)' : 'rgba(28, 25, 23, 0.14)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = isDarkSurface ? '#22201E' : '#FFFFFF';
      traceRoundedRect(
        ctx,
        rect.cardRect.x,
        rect.cardRect.y,
        rect.cardRect.width,
        rect.cardRect.height,
        Math.max(2, cornerRadiusPx)
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = isDarkSurface ? 'rgba(255,255,255,0.12)' : 'rgba(28, 25, 23, 0.10)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Frame Background Box
    ctx.save();
    traceRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, cornerRadiusPx);
    ctx.fillStyle = isDarkSurface ? '#24221F' : '#EAE6DF';
    ctx.fill();
    ctx.restore();

    if (photo && photo.dataUrl) {
      try {
        const img = await loadImage(photo.dataUrl);

        // Offscreen canvas at high-res scaled pixel dimensions so export never upscales low-res pixels
        const offW = Math.max(1, Math.round(rect.width * scaleFactor));
        const offH = Math.max(1, Math.round(rect.height * scaleFactor));
        const offCanvas = document.createElement('canvas');
        offCanvas.width = offW;
        offCanvas.height = offH;
        const offCtx = offCanvas.getContext('2d')!;

        // Resolve per-frame crop state (from StripStyle.frameCrops or photo.crop)
        const cropState = style.frameCrops?.[i] || photo.crop;
        const { offsetX, offsetY, renderWidth, renderHeight } = computeCoverCrop(
          img.width,
          img.height,
          offW,
          offH,
          cropState
        );

        offCtx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

        // Resolve Batch Apply vs Per-Frame Filter configuration
        const frameFilter = resolveFrameFilter(
          photo,
          batchApply,
          preset,
          adjustments,
          globalFilmEffects
        );

        // Apply pixel matrix filters, grain, vignette, and film effects at full offscreen resolution
        applyCanvasFilters(
          offCtx,
          offW,
          offH,
          frameFilter.preset,
          frameFilter.adjustments,
          frameFilter.filmEffects
        );

        // Clip and draw filtered offscreen canvas onto main composition canvas
        ctx.save();
        traceRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, cornerRadiusPx);
        ctx.clip();
        ctx.drawImage(offCanvas, rect.x, rect.y, rect.width, rect.height);
        ctx.restore();

        // Draw Frame Border if thickness > 0
        if (borderThickness > 0) {
          ctx.save();
          traceRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, cornerRadiusPx);
          ctx.strokeStyle =
            style.frameBorderColor ||
            stockProfile.frameBorderColor ||
            (isDarkSurface ? 'rgba(244, 240, 234, 0.25)' : 'rgba(28, 25, 23, 0.16)');
          ctx.lineWidth = borderThickness;
          ctx.stroke();
          ctx.restore();
        }

        // Date stamp on frame corner
        if (style.showDateStamp) {
          const dateStr = style.customDateText || "'26 10 29";
          ctx.save();
          ctx.fillStyle = '#F97316';
          ctx.font = '700 13px "Courier Prime", monospace';
          ctx.textAlign = 'right';
          ctx.shadowColor = 'rgba(249, 115, 22, 0.4)';
          ctx.shadowBlur = 4;
          ctx.fillText(dateStr, rect.x + rect.width - 14, rect.y + rect.height - 14);
          ctx.restore();
        }
      } catch (err) {
        console.error(`Failed to load/draw photo at index ${i}:`, err);
      }
    } else {
      ctx.save();
      traceRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, cornerRadiusPx);
      ctx.fillStyle = isDarkSurface ? '#262320' : '#D6D1C7';
      ctx.fill();
      ctx.fillStyle = isDarkSurface ? '#8C8275' : '#78716C';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`[ Frame ${i + 1} ]`, rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
    }

    // 7. Draw Frame Numbering (if enabled)
    if (numberingMode !== 'off') {
      ctx.save();
      if (numberingMode === 'film-edge' || numberingMode === 'contact-proof') {
        ctx.fillStyle = isDarkSurface ? '#F59E0B' : '#9A3412';
        ctx.font = '600 11px "Courier Prime", monospace';
        ctx.textAlign = 'left';
        const labelY = rect.cardRect
          ? rect.cardRect.y + rect.cardRect.height - 14
          : rect.y + rect.height + 15;
        ctx.fillText(rect.labelCode, rect.x + 2, labelY);
      } else if (numberingMode === 'minimal-index') {
        ctx.fillStyle = stockProfile.secondaryTextColor || primaryTextColor;
        ctx.font = '500 10px "Courier Prime", monospace';
        ctx.textAlign = 'right';
        const labelY = rect.cardRect
          ? rect.cardRect.y + rect.cardRect.height - 14
          : rect.y + rect.height + 14;
        ctx.fillText(rect.labelCode, rect.x + rect.width - 2, labelY);
      }
      ctx.restore();
    }
  }

  // 8. Draw Custom Stickers (sorted by zIndex layer order)
  const orderedStickers = sortStickersByLayer(stickers);
  for (const sticker of orderedStickers) {
    const sx = sticker.x * targetWidth;
    const sy = sticker.y * targetHeight;
    drawStickerOnCanvas(ctx, sticker, sx, sy);
  }

  // 9. Draw Custom Captions
  for (const caption of captions) {
    if (!caption.text.trim()) continue;

    const cx = caption.x * targetWidth;
    const cy = caption.y * targetHeight;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((caption.rotation * Math.PI) / 180);

    const isDefaultDarkInk = !caption.color || caption.color.toUpperCase() === '#1C1917';
    ctx.fillStyle = isDarkSurface && isDefaultDarkInk ? primaryTextColor : (caption.color || primaryTextColor);
    ctx.textAlign = caption.align || 'center';

    let fontFam = '"Cormorant Garamond", serif';
    if (caption.font === 'courier') fontFam = '"Courier Prime", monospace';
    if (caption.font === 'handwriting') fontFam = '"Caveat", cursive';
    if (caption.font === 'sans') fontFam = '"Plus Jakarta Sans", sans-serif';

    ctx.font = `${caption.size}px ${fontFam}`;
    ctx.fillText(caption.text, 0, 0);

    ctx.restore();
  }

  // 10. Draw Footer Stamp (if configured)
  if (style.footerText && style.footerText.trim()) {
    ctx.save();
    ctx.fillStyle = primaryTextColor;
    ctx.font = '600 13px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(style.footerText.toUpperCase(), targetWidth / 2, footerY);
    ctx.restore();
  }

  // 11. Optional Print Bleed / Crop Registration Marks
  if (printConfig?.includeBleedGuides) {
    drawPrintBleedGuides(ctx, targetWidth, targetHeight, isDarkSurface);
  }

  ctx.restore();

  return canvas;
}
