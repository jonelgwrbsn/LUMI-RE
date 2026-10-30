import { CustomSticker, StickerFontFamily } from '../types/photobooth';

export function resolveStickerFontStack(fontFamily?: StickerFontFamily): string {
  switch (fontFamily) {
    case 'courier':
      return '"Courier Prime", "Courier New", monospace';
    case 'sans':
      return '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
    case 'garamond':
    default:
      return '"Cormorant Garamond", Georgia, serif';
  }
}

/**
 * Helper to draw tracked text (with custom letterSpacing) on any 2D canvas context
 * with accurate left, center, or right alignment.
 */
function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: 'left' | 'center' | 'right' = 'center'
) {
  if (!text) return;
  if (!letterSpacing || letterSpacing <= 0.2) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }

  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((acc, w) => acc + w, 0) + Math.max(0, chars.length - 1) * letterSpacing;

  let startX = x;
  if (align === 'center') {
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    startX = x - totalWidth;
  }

  ctx.textAlign = 'left';
  let cursorX = startX;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, y);
    cursorX += widths[i] + letterSpacing;
  }
}

/**
 * Renders a CustomSticker onto the provided 2D canvas context at (cx, cy).
 * The context is already scaled by `scaleFactor` in `renderPhotoStripCanvas`,
 * so all coordinates are in base strip pixels (e.g., 600x1800).
 */
export function drawStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: CustomSticker,
  cx: number,
  cy: number
): void {
  const size = sticker.size || 64;
  const scale = size / 64; // Normalized around 64px base design unit
  const ink = sticker.color || '#1C1917';
  const paperBg = sticker.backgroundColor || '#F7F3E9';
  const opacity = sticker.opacity !== undefined ? Math.max(0.05, Math.min(1, sticker.opacity)) : 1;
  const fontFam = resolveStickerFontStack(sticker.fontFamily);
  const baseFontSize = (sticker.fontSize || 12) * scale;
  const tracking = (sticker.letterSpacing ?? 1.5) * scale;
  const align = sticker.textAlign || 'center';
  const primaryText = sticker.text !== undefined ? sticker.text : sticker.label || '';
  const secondaryText = sticker.subtext || '';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((sticker.rotation || 0) * Math.PI) / 180);
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.textBaseline = 'middle';

  const assetId = sticker.assetId || '';

  // =========================================================
  // 1. FILM LAB STAMPS & MARKS
  // =========================================================
  if (assetId === 'lab-35mm-original') {
    const w = 136 * scale;
    const h = 44 * scale;
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = 0.75 * scale;
    ctx.strokeRect(-w / 2 + 3 * scale, -h / 2 + 3 * scale, w - 6 * scale, h - 6 * scale);

    // Corner sprocket ticks
    const tick = 4 * scale;
    ctx.fillRect(-w / 2 + 6 * scale, -h / 2 + 6 * scale, tick, tick);
    ctx.fillRect(w / 2 - 10 * scale, -h / 2 + 6 * scale, tick, tick);

    ctx.font = `700 ${Math.round(baseFontSize)}px ${fontFam}`;
    const textX = align === 'left' ? -w / 2 + 12 * scale : align === 'right' ? w / 2 - 12 * scale : 0;
    drawTrackedText(ctx, primaryText, textX, secondaryText ? -5 * scale : 0, tracking, align);

    if (secondaryText) {
      ctx.font = `400 ${Math.max(7, Math.round(baseFontSize * 0.68))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, textX, 9 * scale, tracking * 0.7, align);
    }
  } else if (assetId === 'lab-frame-no') {
    const w = 128 * scale;
    const h = 36 * scale;
    ctx.lineWidth = 1.2 * scale;
    // Top and bottom film edge hairlines
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.moveTo(-w / 2, h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.stroke();

    ctx.font = `700 ${Math.round(baseFontSize)}px ${fontFam}`;
    const textX = align === 'left' ? -w / 2 + 4 * scale : align === 'right' ? w / 2 - 4 * scale : 0;
    drawTrackedText(ctx, primaryText, textX, secondaryText ? -5 * scale : 0, tracking, align);

    if (secondaryText) {
      ctx.font = `600 ${Math.max(7, Math.round(baseFontSize * 0.72))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, textX, 8 * scale, tracking * 0.6, align);
    }
  } else if (assetId === 'lab-film-developed') {
    const r = 42 * scale;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal center band
    ctx.beginPath();
    ctx.moveTo(-r + 4 * scale, -10 * scale);
    ctx.lineTo(r - 4 * scale, -10 * scale);
    ctx.moveTo(-r + 4 * scale, 10 * scale);
    ctx.lineTo(r - 4 * scale, 10 * scale);
    ctx.stroke();

    ctx.font = `700 ${Math.round(baseFontSize * 0.85)}px ${fontFam}`;
    drawTrackedText(ctx, primaryText, 0, 0, tracking * 0.8, 'center');

    if (secondaryText) {
      ctx.font = `500 ${Math.max(6, Math.round(baseFontSize * 0.6))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, 0, 19 * scale, tracking * 0.5, 'center');
    }
    // Small star at top of seal
    ctx.font = `600 ${Math.round(9 * scale)}px ${fontFam}`;
    drawTrackedText(ctx, '35MM', 0, -20 * scale, 1.5 * scale, 'center');
  } else if (assetId === 'lab-archive-mark') {
    const w = 138 * scale;
    const h = 38 * scale;
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 3 * scale);
    ctx.stroke();

    // Left registration cross
    const cxCross = -w / 2 + 14 * scale;
    ctx.beginPath();
    ctx.arc(cxCross, 0, 5 * scale, 0, Math.PI * 2);
    ctx.moveTo(cxCross - 7 * scale, 0);
    ctx.lineTo(cxCross + 7 * scale, 0);
    ctx.moveTo(cxCross, -7 * scale);
    ctx.lineTo(cxCross, 7 * scale);
    ctx.stroke();

    ctx.font = `600 ${Math.round(baseFontSize)}px ${fontFam}`;
    drawTrackedText(ctx, primaryText, 8 * scale, secondaryText ? -5 * scale : 0, tracking, 'center');
    if (secondaryText) {
      ctx.font = `400 ${Math.max(6, Math.round(baseFontSize * 0.72))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, 8 * scale, 7 * scale, tracking * 0.6, 'center');
    }
  } else if (assetId === 'lab-studio-mark') {
    const w = 142 * scale;
    const h = 44 * scale;
    ctx.lineWidth = 1 * scale;
    // Chamfered octagon border
    const c = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + c, -h / 2);
    ctx.lineTo(w / 2 - c, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + c);
    ctx.lineTo(w / 2, h / 2 - c);
    ctx.lineTo(w / 2 - c, h / 2);
    ctx.lineTo(-w / 2 + c, h / 2);
    ctx.lineTo(-w / 2, h / 2 - c);
    ctx.lineTo(-w / 2, -h / 2 + c);
    ctx.closePath();
    ctx.stroke();

    ctx.font = `600 ${Math.round(baseFontSize)}px ${fontFam}`;
    drawTrackedText(ctx, primaryText, 0, secondaryText ? -5 * scale : 0, tracking, align);
    if (secondaryText) {
      ctx.font = `400 ${Math.max(7, Math.round(baseFontSize * 0.65))}px "Plus Jakarta Sans", sans-serif`;
      drawTrackedText(ctx, secondaryText, 0, 9 * scale, tracking * 0.8, align);
    }

  // =========================================================
  // 2. FINE-LINE GRAPHICS (Pure Vector Paths, Consistent 1.25px Stroke)
  // =========================================================
  } else if (assetId === 'line-north-star') {
    ctx.lineWidth = 1.35 * scale;
    const outer = 28 * scale;
    const inner = 6 * scale;
    const diag = 14 * scale;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : diag;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const nextAngle = angle + Math.PI / 8;
      const nx = Math.cos(nextAngle) * inner;
      const ny = Math.sin(nextAngle) * inner;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      ctx.lineTo(nx, ny);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (assetId === 'line-monoline-heart') {
    ctx.lineWidth = 1.5 * scale;
    const s = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 20 * s);
    ctx.bezierCurveTo(-26 * s, 4 * s, -28 * s, -18 * s, -13 * s, -20 * s);
    ctx.bezierCurveTo(-4 * s, -21 * s, 0, -12 * s, 0, -7 * s);
    ctx.bezierCurveTo(0, -12 * s, 4 * s, -21 * s, 13 * s, -20 * s);
    ctx.bezierCurveTo(28 * s, -18 * s, 26 * s, 4 * s, 0, 20 * s);
    ctx.stroke();
  } else if (assetId === 'line-botanical-sprig') {
    ctx.lineWidth = 1.35 * scale;
    const s = 1.15 * scale;
    // Main curved stem
    ctx.beginPath();
    ctx.moveTo(-22 * s, 24 * s);
    ctx.quadraticCurveTo(-4 * s, 0, 20 * s, -24 * s);
    ctx.stroke();

    // 3 pairs of delicate olive leaves
    const leaves = [
      { x: -10 * s, y: 10 * s, dir: -1 },
      { x: -5 * s, y: 4 * s, dir: 1 },
      { x: 2 * s, y: -4 * s, dir: -1 },
      { x: 7 * s, y: -10 * s, dir: 1 },
      { x: 13 * s, y: -17 * s, dir: -1 }
    ];
    for (const lf of leaves) {
      ctx.beginPath();
      ctx.moveTo(lf.x, lf.y);
      ctx.quadraticCurveTo(
        lf.x + lf.dir * 12 * s,
        lf.y - 6 * s,
        lf.x + lf.dir * 14 * s,
        lf.y - 14 * s
      );
      ctx.quadraticCurveTo(
        lf.x + lf.dir * 4 * s,
        lf.y - 10 * s,
        lf.x,
        lf.y
      );
      ctx.stroke();
    }
  } else if (assetId === 'line-sparkle-cluster') {
    ctx.lineWidth = 1.3 * scale;
    const drawFourPoint = (ox: number, oy: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(ox, oy - r);
      ctx.quadraticCurveTo(ox, oy, ox + r, oy);
      ctx.quadraticCurveTo(ox, oy, ox, oy + r);
      ctx.quadraticCurveTo(ox, oy, ox - r, oy);
      ctx.quadraticCurveTo(ox, oy, ox, oy - r);
      ctx.closePath();
      ctx.stroke();
    };
    drawFourPoint(-4 * scale, 2 * scale, 18 * scale);
    drawFourPoint(14 * scale, -12 * scale, 8 * scale);
    drawFourPoint(-15 * scale, -14 * scale, 5 * scale);
  } else if (assetId === 'line-editorial-arrow') {
    ctx.lineWidth = 1.4 * scale;
    const len = 34 * scale;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(len, 0);
    // Open architectural arrowhead
    ctx.moveTo(len - 10 * scale, -6 * scale);
    ctx.lineTo(len, 0);
    ctx.lineTo(len - 10 * scale, 6 * scale);
    // Fletching tail ticks
    ctx.moveTo(-len + 6 * scale, -5 * scale);
    ctx.lineTo(-len, 0);
    ctx.lineTo(-len + 6 * scale, 5 * scale);
    ctx.moveTo(-len + 12 * scale, -5 * scale);
    ctx.lineTo(-len + 6 * scale, 0);
    ctx.lineTo(-len + 12 * scale, 5 * scale);
    ctx.stroke();
  } else if (assetId === 'line-fleuron-ornament') {
    ctx.lineWidth = 1.25 * scale;
    const w = 44 * scale;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(-10 * scale, 0);
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();

    // Central diamond & scrolls
    ctx.beginPath();
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(8 * scale, 0);
    ctx.lineTo(0, 8 * scale);
    ctx.lineTo(-8 * scale, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-14 * scale, 0, 2 * scale, 0, Math.PI * 2);
    ctx.arc(14 * scale, 0, 2 * scale, 0, Math.PI * 2);
    ctx.fill();

  // =========================================================
  // 3. FILM FRAMES & CONTACT SHEET DETAILS
  // =========================================================
  } else if (assetId === 'frame-negative-strip') {
    const w = 152 * scale;
    const h = 44 * scale;
    ctx.lineWidth = 1.4 * scale;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Top and bottom sprocket tracks
    const holeW = 7 * scale;
    const holeH = 5 * scale;
    for (let x = -w / 2 + 8 * scale; x < w / 2 - 10 * scale; x += 14 * scale) {
      ctx.strokeRect(x, -h / 2 + 3 * scale, holeW, holeH);
      ctx.strokeRect(x, h / 2 - 8 * scale, holeW, holeH);
    }

    ctx.font = `700 ${Math.round(baseFontSize)}px "Courier Prime", monospace`;
    drawTrackedText(ctx, primaryText, -18 * scale, 0, tracking, 'center');
    if (secondaryText) {
      drawTrackedText(ctx, secondaryText, w / 2 - 26 * scale, 0, tracking * 0.8, 'center');
    }
  } else if (assetId === 'frame-sprocket-bar') {
    const w = 148 * scale;
    const h = 22 * scale;
    ctx.lineWidth = 1.3 * scale;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    for (let x = -w / 2 + 8 * scale; x < w / 2 - 10 * scale; x += 16 * scale) {
      ctx.beginPath();
      ctx.roundRect(x, -5 * scale, 9 * scale, 10 * scale, 2 * scale);
      ctx.stroke();
    }
  } else if (assetId === 'frame-crop-corners') {
    const w = 120 * scale;
    const h = 84 * scale;
    const arm = 16 * scale;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(-w / 2, -h / 2 + arm);
    ctx.lineTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2 + arm, -h / 2);
    // Top-right
    ctx.moveTo(w / 2 - arm, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + arm);
    // Bottom-right
    ctx.moveTo(w / 2, h / 2 - arm);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(w / 2 - arm, h / 2);
    // Bottom-left
    ctx.moveTo(-w / 2 + arm, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2 - arm);
    // Center hairline crosshair
    ctx.moveTo(-6 * scale, 0);
    ctx.lineTo(6 * scale, 0);
    ctx.moveTo(0, -6 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.stroke();
  } else if (assetId === 'frame-viewfinder-outline') {
    const w = 136 * scale;
    const h = 76 * scale;
    const arm = 14 * scale;
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + arm);
    ctx.lineTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2 + arm, -h / 2);
    ctx.moveTo(w / 2 - arm, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + arm);
    ctx.moveTo(w / 2, h / 2 - arm);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(w / 2 - arm, h / 2);
    ctx.moveTo(-w / 2 + arm, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2 - arm);
    ctx.stroke();

    // Center AF bracket
    ctx.strokeRect(-14 * scale, -10 * scale, 28 * scale, 20 * scale);
    if (primaryText) {
      ctx.font = `600 ${Math.round(baseFontSize)}px "Courier Prime", monospace`;
      drawTrackedText(ctx, primaryText, 0, h / 2 - 10 * scale, tracking, 'center');
    }
  } else if (assetId === 'frame-contact-sheet') {
    const w = 136 * scale;
    const h = 42 * scale;
    ctx.lineWidth = 2.2 * scale;
    // Hand-drawn style grease-pencil crop rectangle
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 4 * scale, -h / 2 + 2 * scale);
    ctx.lineTo(w / 2 + 3 * scale, -h / 2 - 1 * scale);
    ctx.lineTo(w / 2 - 1 * scale, h / 2 + 3 * scale);
    ctx.lineTo(-w / 2 + 2 * scale, h / 2 - 1 * scale);
    ctx.closePath();
    ctx.stroke();

    ctx.font = `700 ${Math.round(baseFontSize)}px ${fontFam}`;
    drawTrackedText(ctx, primaryText, 0, 0, tracking, align);

  // =========================================================
  // 5. PAPER EPHEMERA (Masking Tape, Labels, Torn Note)
  // =========================================================
  } else if (assetId === 'ephem-masking-tape') {
    const w = 138 * scale;
    const h = 32 * scale;
    ctx.save();
    ctx.fillStyle = paperBg;
    ctx.globalAlpha = opacity * 0.92;
    // Slightly serrated left/right tape edges
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 - 3 * scale, -h / 4);
    ctx.lineTo(w / 2 + 2 * scale, 0);
    ctx.lineTo(w / 2 - 2 * scale, h / 4);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.lineTo(-w / 2 + 3 * scale, h / 4);
    ctx.lineTo(-w / 2 - 2 * scale, 0);
    ctx.lineTo(-w / 2 + 2 * scale, -h / 4);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 0.8 * scale;
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.22)';
    ctx.stroke();
    ctx.restore();

    if (primaryText) {
      ctx.fillStyle = ink;
      ctx.font = `600 ${Math.round(baseFontSize)}px ${fontFam}`;
      const tx = align === 'left' ? -w / 2 + 12 * scale : align === 'right' ? w / 2 - 12 * scale : 0;
      drawTrackedText(ctx, primaryText, tx, 0, tracking, align);
    }
  } else if (assetId === 'ephem-paper-label') {
    const w = 138 * scale;
    const h = 44 * scale;
    const notch = 6 * scale;
    ctx.fillStyle = paperBg;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + notch, -h / 2);
    ctx.lineTo(w / 2 - notch, -h / 2);
    ctx.lineTo(w / 2, -h / 2 + notch);
    ctx.lineTo(w / 2, h / 2 - notch);
    ctx.lineTo(w / 2 - notch, h / 2);
    ctx.lineTo(-w / 2 + notch, h / 2);
    ctx.lineTo(-w / 2, h / 2 - notch);
    ctx.lineTo(-w / 2, -h / 2 + notch);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.lineWidth = 0.6 * scale;
    ctx.strokeRect(-w / 2 + 4 * scale, -h / 2 + 4 * scale, w - 8 * scale, h - 8 * scale);

    ctx.fillStyle = ink;
    ctx.font = `700 ${Math.round(baseFontSize)}px ${fontFam}`;
    const tx = align === 'left' ? -w / 2 + 12 * scale : align === 'right' ? w / 2 - 12 * scale : 0;
    drawTrackedText(ctx, primaryText, tx, secondaryText ? -5 * scale : 0, tracking, align);
    if (secondaryText) {
      ctx.font = `400 ${Math.max(7, Math.round(baseFontSize * 0.68))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, tx, 9 * scale, tracking * 0.7, align);
    }
  } else if (assetId === 'ephem-torn-note') {
    const w = 144 * scale;
    const h = 40 * scale;
    ctx.fillStyle = paperBg;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.lineTo(w / 2, h / 2 - 3 * scale);
    // Subtle deckle bottom edge
    for (let x = w / 2; x >= -w / 2; x -= 12 * scale) {
      const dy = (Math.abs(Math.round(x)) % 2 === 0 ? 2 : -1.5) * scale;
      ctx.lineTo(x, h / 2 + dy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.25)';
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();

    // Top subtle rule line
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.6 * scale;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 10 * scale, -h / 2 + 7 * scale);
    ctx.lineTo(w / 2 - 10 * scale, -h / 2 + 7 * scale);
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.font = `italic 600 ${Math.round(baseFontSize * 1.05)}px ${fontFam}`;
    const tx = align === 'left' ? -w / 2 + 12 * scale : align === 'right' ? w / 2 - 12 * scale : 0;
    drawTrackedText(ctx, primaryText, tx, 3 * scale, tracking * 0.5, align);
  } else if (assetId === 'ephem-glassine-seal') {
    const w = 142 * scale;
    const h = 32 * scale;
    ctx.fillStyle = paperBg;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1 * scale;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = ink;
    ctx.font = `600 ${Math.round(baseFontSize)}px ${fontFam}`;
    const tx = align === 'left' ? -w / 2 + 10 * scale : align === 'right' ? w / 2 - 10 * scale : 0;
    drawTrackedText(ctx, primaryText, tx, 0, tracking, align);

  // =========================================================
  // 4 & 6. EDITORIAL TYPOGRAPHY & DATE / LOCATION STAMPS
  // =========================================================
  } else {
    const w = 148 * scale;
    // Optional editorial hairline rules for postmark / quartz / editorial stamps
    if (assetId === 'date-city-dispatch' || assetId === 'date-quartz-timestamp') {
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -16 * scale);
      ctx.lineTo(w / 2, -16 * scale);
      ctx.moveTo(-w / 2, 16 * scale);
      ctx.lineTo(w / 2, 16 * scale);
      ctx.stroke();
    } else if (assetId === 'type-lumiere-studio' || assetId === 'date-location-editorial') {
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.moveTo(-36 * scale, 16 * scale);
      ctx.lineTo(36 * scale, 16 * scale);
      ctx.stroke();
    }

    const tx = align === 'left' ? -w / 2 + 6 * scale : align === 'right' ? w / 2 - 6 * scale : 0;
    ctx.font = `600 ${Math.round(baseFontSize)}px ${fontFam}`;
    drawTrackedText(ctx, primaryText, tx, secondaryText ? -5 * scale : 0, tracking, align);

    if (secondaryText) {
      ctx.font = `400 ${Math.max(7, Math.round(baseFontSize * 0.66))}px "Courier Prime", monospace`;
      drawTrackedText(ctx, secondaryText, tx, 8 * scale, tracking * 0.75, align);
    }
  }

  ctx.restore();
}
