import { FilterPreset, FilterAdjustments, FilmEffectsState } from '../types/photobooth';

export const DEFAULT_FILM_EFFECTS: FilmEffectsState = {
  grain: { enabled: false, intensity: 30 },
  halation: { enabled: false, intensity: 40 },
  lightLeak: { enabled: false, intensity: 50, position: 'top-right' },
  bloom: { enabled: false, intensity: 35 },
  vignette: { enabled: false, intensity: 25 },
  dustScratches: { enabled: false, intensity: 35 },
  chromaticAberration: { enabled: false, intensity: 30 },
  vhsScanlines: { enabled: false, intensity: 40 },
  dateStamp: { enabled: false, text: "'26 10 29", color: '#F97316' }
};

export const DEFAULT_ADJUSTMENTS: Record<FilterPreset, FilterAdjustments & { defaultEffects: FilmEffectsState }> = {
  original: {
    intensity: 100,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    tint: 0,
    grain: 0,
    vignette: 0,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS
    }
  },
  'warm-film': {
    intensity: 100,
    brightness: 5,
    contrast: 12,
    saturation: 15,
    warmth: 20,
    tint: 5,
    grain: 25,
    vignette: 20,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 25 },
      vignette: { enabled: true, intensity: 20 }
    }
  },
  'soft-matte': {
    intensity: 100,
    brightness: 8,
    contrast: -10,
    saturation: -15,
    warmth: 10,
    tint: -5,
    grain: 20,
    vignette: 10,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      bloom: { enabled: true, intensity: 25 },
      grain: { enabled: true, intensity: 20 }
    }
  },
  'vintage-fade': {
    intensity: 100,
    brightness: 10,
    contrast: -5,
    saturation: -25,
    warmth: 25,
    tint: 10,
    grain: 35,
    vignette: 30,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 35 },
      vignette: { enabled: true, intensity: 30 },
      dustScratches: { enabled: true, intensity: 25 }
    }
  },
  'classic-mono': {
    intensity: 100,
    brightness: 2,
    contrast: 20,
    saturation: -100,
    warmth: 0,
    tint: 0,
    grain: 40,
    vignette: 25,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 40 },
      vignette: { enabled: true, intensity: 25 },
      dustScratches: { enabled: true, intensity: 20 }
    }
  },
  'cool-film': {
    intensity: 100,
    brightness: 2,
    contrast: 10,
    saturation: 5,
    warmth: -20,
    tint: -10,
    grain: 20,
    vignette: 15,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 20 },
      vignette: { enabled: true, intensity: 15 }
    }
  },
  disposable: {
    intensity: 100,
    brightness: 15,
    contrast: 25,
    saturation: 25,
    warmth: 12,
    tint: 5,
    grain: 45,
    vignette: 35,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 45 },
      lightLeak: { enabled: true, intensity: 35, position: 'top-right' },
      vignette: { enabled: true, intensity: 35 }
    }
  },
  // --- 12 New Film Presets ---
  'y2k-flash': {
    intensity: 100,
    brightness: 18,
    contrast: 30,
    saturation: 20,
    warmth: -8,
    tint: -15,
    grain: 30,
    vignette: 20,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      bloom: { enabled: true, intensity: 30 },
      chromaticAberration: { enabled: true, intensity: 25 },
      grain: { enabled: true, intensity: 30 },
      dateStamp: { enabled: true, text: "'00 06 18", color: '#38BDF8' }
    }
  },
  'light-leak': {
    intensity: 100,
    brightness: 10,
    contrast: 8,
    saturation: 12,
    warmth: 28,
    tint: 10,
    grain: 25,
    vignette: 15,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      lightLeak: { enabled: true, intensity: 75, position: 'top-right' },
      grain: { enabled: true, intensity: 25 },
      dustScratches: { enabled: true, intensity: 20 }
    }
  },
  'expired-film': {
    intensity: 100,
    brightness: 6,
    contrast: -12,
    saturation: -20,
    warmth: 15,
    tint: 25,
    grain: 55,
    vignette: 40,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 55 },
      vignette: { enabled: true, intensity: 40 },
      dustScratches: { enabled: true, intensity: 50 },
      lightLeak: { enabled: true, intensity: 40, position: 'left-edge' }
    }
  },
  'cinestill-glow': {
    intensity: 100,
    brightness: 4,
    contrast: 18,
    saturation: 10,
    warmth: -12,
    tint: 12,
    grain: 30,
    vignette: 25,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      halation: { enabled: true, intensity: 70 },
      bloom: { enabled: true, intensity: 40 },
      grain: { enabled: true, intensity: 30 },
      vignette: { enabled: true, intensity: 25 }
    }
  },
  'noir-400': {
    intensity: 100,
    brightness: -2,
    contrast: 42,
    saturation: -100,
    warmth: 0,
    tint: 0,
    grain: 60,
    vignette: 45,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 60 },
      vignette: { enabled: true, intensity: 45 },
      dustScratches: { enabled: true, intensity: 35 }
    }
  },
  'dream-bloom': {
    intensity: 100,
    brightness: 12,
    contrast: -15,
    saturation: 8,
    warmth: 14,
    tint: 8,
    grain: 15,
    vignette: 15,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      bloom: { enabled: true, intensity: 65 },
      halation: { enabled: true, intensity: 30 },
      grain: { enabled: true, intensity: 15 }
    }
  },
  'party-disposable': {
    intensity: 100,
    brightness: 20,
    contrast: 28,
    saturation: 35,
    warmth: 18,
    tint: 5,
    grain: 45,
    vignette: 30,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 45 },
      lightLeak: { enabled: true, intensity: 45, position: 'bottom-right' },
      dateStamp: { enabled: true, text: "'26 10 29", color: '#F97316' }
    }
  },
  'cinema-800t': {
    intensity: 100,
    brightness: 2,
    contrast: 22,
    saturation: 15,
    warmth: -18,
    tint: 18,
    grain: 35,
    vignette: 30,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      halation: { enabled: true, intensity: 80 },
      grain: { enabled: true, intensity: 35 },
      vignette: { enabled: true, intensity: 30 }
    }
  },
  '90s-snapshot': {
    intensity: 100,
    brightness: 8,
    contrast: 10,
    saturation: 12,
    warmth: 22,
    tint: -8,
    grain: 35,
    vignette: 20,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 35 },
      dateStamp: { enabled: true, text: "'98 05 14", color: '#FACC15' },
      dustScratches: { enabled: true, intensity: 20 }
    }
  },
  'pastel-romance': {
    intensity: 100,
    brightness: 14,
    contrast: -18,
    saturation: -10,
    warmth: 12,
    tint: 15,
    grain: 18,
    vignette: 15,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      bloom: { enabled: true, intensity: 45 },
      grain: { enabled: true, intensity: 18 },
      vignette: { enabled: true, intensity: 15 }
    }
  },
  'classic-booth': {
    intensity: 100,
    brightness: 5,
    contrast: 18,
    saturation: 5,
    warmth: 10,
    tint: 0,
    grain: 40,
    vignette: 25,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      grain: { enabled: true, intensity: 40 },
      vignette: { enabled: true, intensity: 25 },
      dustScratches: { enabled: true, intensity: 25 }
    }
  },
  'vhs-memory': {
    intensity: 100,
    brightness: 10,
    contrast: 12,
    saturation: -15,
    warmth: -5,
    tint: 10,
    grain: 35,
    vignette: 25,
    defaultEffects: {
      ...DEFAULT_FILM_EFFECTS,
      vhsScanlines: { enabled: true, intensity: 60 },
      chromaticAberration: { enabled: true, intensity: 50 },
      grain: { enabled: true, intensity: 35 },
      dateStamp: { enabled: true, text: "PLAY 0:02:14", color: '#10B981' }
    }
  }
};

/**
 * Applies real pixel processing & analog canvas film effects to an offscreen image context
 */
export function applyCanvasFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: FilterPreset,
  adj: FilterAdjustments,
  customEffects?: FilmEffectsState
) {
  if (width <= 0 || height <= 0) return;

  const basePreset = DEFAULT_ADJUSTMENTS[preset] || DEFAULT_ADJUSTMENTS.original;
  const blendRatio = (adj.intensity ?? 100) / 100;

  // Combine baseline preset parameters with active adjustment overrides
  const effBrightness = (basePreset.brightness * blendRatio) + (adj.brightness || 0);
  const effContrast = (basePreset.contrast * blendRatio) + (adj.contrast || 0);
  const effSat = (basePreset.saturation * blendRatio) + (adj.saturation || 0);
  const effWarmth = (basePreset.warmth * blendRatio) + (adj.warmth || 0);
  const effTint = ((basePreset.tint || 0) * blendRatio) + (adj.tint || 0);

  // Active Film Effects (use custom overrides if provided, otherwise baseline preset defaults)
  const effects: FilmEffectsState = customEffects || {
    ...basePreset.defaultEffects,
    ...(adj.effects || {})
  };

  // --- 1. Chromatic Aberration (Channel Pixel Offset Pass) ---
  if (effects.chromaticAberration?.enabled && effects.chromaticAberration.intensity > 0) {
    applyChromaticAberration(ctx, width, height, effects.chromaticAberration.intensity);
  }

  // --- 2. Color Matrix Pixel Grading (Brightness, Contrast, Saturation, Warmth, Tint) ---
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Contrast factor calculation
  const contrastFactor = (259 * (effContrast + 255)) / (255 * (259 - effContrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness adjustment
    if (effBrightness !== 0) {
      r += effBrightness * 2.55;
      g += effBrightness * 2.55;
      b += effBrightness * 2.55;
    }

    // Contrast adjustment
    if (effContrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Saturation & Black/White conversion
    if (preset === 'classic-mono' || preset === 'noir-400' || effSat <= -100) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    } else if (effSat !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const satRatio = Math.max(0, 1 + effSat / 100);
      r = gray + (r - gray) * satRatio;
      g = gray + (g - gray) * satRatio;
      b = gray + (b - gray) * satRatio;
    }

    // Temperature (Warmth)
    if (effWarmth > 0) {
      r += effWarmth * 0.75;
      b -= effWarmth * 0.5;
    } else if (effWarmth < 0) {
      r += effWarmth * 0.5;
      b -= effWarmth * 0.75;
    }

    // Tint (Green vs. Magenta shift)
    if (effTint > 0) { // Magenta tint
      r += effTint * 0.5;
      b += effTint * 0.5;
      g -= effTint * 0.4;
    } else if (effTint < 0) { // Green tint
      g += Math.abs(effTint) * 0.6;
    }

    // Clamp RGB values
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  // --- 3. Film Grain (Luminance Weighted Noise) ---
  const grainIntensity = (effects.grain?.enabled ? effects.grain.intensity : 0) || Math.max(0, (basePreset.grain * blendRatio) + (adj.grain || 0));
  if (grainIntensity > 0) {
    const grainAmount = (grainIntensity / 100) * 40;
    for (let i = 0; i < data.length; i += 4) {
      // Weight grain slightly higher in midtones
      const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const lumWeight = 1 - Math.abs(luminance - 128) / 128 * 0.3;
      const noise = (Math.random() - 0.5) * grainAmount * lumWeight;

      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // --- 4. Halation (CineStill Red Highlight Glow Pass) ---
  if (effects.halation?.enabled && effects.halation.intensity > 0) {
    applyHalation(ctx, width, height, effects.halation.intensity);
  }

  // --- 5. Bloom Effect (Ethereal Highlight Diffusion) ---
  if (effects.bloom?.enabled && effects.bloom.intensity > 0) {
    applyBloom(ctx, width, height, effects.bloom.intensity);
  }

  // --- 6. Light Leak Overlay ---
  if (effects.lightLeak?.enabled && effects.lightLeak.intensity > 0) {
    applyLightLeak(ctx, width, height, effects.lightLeak.intensity, effects.lightLeak.position || 'top-right');
  }

  // --- 7. Dust and Scratches (Analog Darkroom Artifacts) ---
  if (effects.dustScratches?.enabled && effects.dustScratches.intensity > 0) {
    applyDustAndScratches(ctx, width, height, effects.dustScratches.intensity);
  }

  // --- 8. VHS Scanlines ---
  if (effects.vhsScanlines?.enabled && effects.vhsScanlines.intensity > 0) {
    applyVHSScanlines(ctx, width, height, effects.vhsScanlines.intensity);
  }

  // --- 9. Vignette Falloff Layer ---
  const vignetteIntensity = (effects.vignette?.enabled ? effects.vignette.intensity : 0) || Math.max(0, (basePreset.vignette * blendRatio) + (adj.vignette || 0));
  if (vignetteIntensity > 0) {
    applyVignette(ctx, width, height, vignetteIntensity);
  }

  // --- 10. Date Stamp Layer ---
  if (effects.dateStamp?.enabled) {
    applyDateStamp(ctx, width, height, effects.dateStamp.text, effects.dateStamp.color);
  }
}

/**
 * Chromatic Aberration: Shifts Red channel slightly left and Blue channel slightly right toward margins
 */
function applyChromaticAberration(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const offset = Math.round((intensity / 100) * 6);
  if (offset <= 0) return;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center to scale aberration at frame edges
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const distSq = dx * dx + dy * dy;

      if (distSq > 0.05) {
        const shiftX = Math.round(offset * dx * distSq);
        const shiftY = Math.round(offset * dy * distSq);

        // Shift Red channel outward
        const rx = Math.min(width - 1, Math.max(0, x + shiftX));
        const ry = Math.min(height - 1, Math.max(0, y + shiftY));
        const rIdx = (ry * width + rx) * 4;
        data[idx] = copy[rIdx];

        // Shift Blue channel inward
        const bx = Math.min(width - 1, Math.max(0, x - shiftX));
        const by = Math.min(height - 1, Math.max(0, y - shiftY));
        const bIdx = (by * width + bx) * 4;
        data[idx + 2] = copy[bIdx + 2];
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Halation: Creates a red/orange halo around bright highlights
 */
function applyHalation(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const highlightCanvas = document.createElement('canvas');
  highlightCanvas.width = width;
  highlightCanvas.height = height;
  const hCtx = highlightCanvas.getContext('2d')!;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const hData = hCtx.createImageData(width, height);

  // Extract pixels with luminance > 210
  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (l > 200) {
      const factor = (l - 200) / 55;
      hData.data[i] = 255; // Red channel bloom
      hData.data[i + 1] = Math.round(80 * factor); // Warm orange tint
      hData.data[i + 2] = 0;
      hData.data[i + 3] = Math.round(220 * factor * (intensity / 100));
    }
  }
  hCtx.putImageData(hData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = `blur(${Math.max(2, Math.round((intensity / 100) * 12))}px)`;
  ctx.drawImage(highlightCanvas, 0, 0);
  ctx.restore();
}

/**
 * Bloom: Diffused soft lighting around highlights
 */
function applyBloom(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (intensity / 100) * 0.35;
  ctx.filter = `blur(${Math.max(3, Math.round((intensity / 100) * 15))}px) brightness(120%)`;
  ctx.drawImage(ctx.canvas, 0, 0, width, height);
  ctx.restore();
}

/**
 * Light Leak: Analog warm lens flare gradient
 */
function applyLightLeak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  position: 'top-left' | 'top-right' | 'bottom-right' | 'left-edge'
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  let grad: CanvasGradient;
  const alpha = (intensity / 100) * 0.7;

  if (position === 'top-right') {
    grad = ctx.createRadialGradient(width, 0, 0, width, 0, width * 0.85);
    grad.addColorStop(0, `rgba(255, 140, 50, ${alpha})`);
    grad.addColorStop(0.4, `rgba(240, 70, 30, ${alpha * 0.6})`);
    grad.addColorStop(0.8, `rgba(180, 20, 80, ${alpha * 0.2})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (position === 'top-left') {
    grad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.85);
    grad.addColorStop(0, `rgba(255, 180, 60, ${alpha})`);
    grad.addColorStop(0.5, `rgba(230, 90, 40, ${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (position === 'left-edge') {
    grad = ctx.createLinearGradient(0, 0, width * 0.35, 0);
    grad.addColorStop(0, `rgba(255, 120, 40, ${alpha})`);
    grad.addColorStop(0.6, `rgba(220, 50, 90, ${alpha * 0.4})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    grad = ctx.createRadialGradient(width, height, 0, width, height, width * 0.8);
    grad.addColorStop(0, `rgba(255, 160, 40, ${alpha})`);
    grad.addColorStop(0.5, `rgba(220, 60, 60, ${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Dust and Scratches: Procedural darkroom specks and hairline scratches
 */
function applyDustAndScratches(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillStyle = 'rgba(20, 20, 20, 0.35)';

  const count = Math.round((intensity / 100) * 30);

  // Hairlines & Scratches
  for (let i = 0; i < count; i++) {
    const sx = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
    const sy = (Math.cos(i * 678.9) * 0.5 + 0.5) * height;
    const len = 15 + (Math.sin(i * 54.1) * 0.5 + 0.5) * 40;

    ctx.lineWidth = 0.5 + (i % 2) * 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.sin(i) * 6), sy + len);
    ctx.stroke();
  }

  // Fiber specks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < count * 2; i++) {
    const px = (Math.sin(i * 321.1) * 0.5 + 0.5) * width;
    const py = (Math.cos(i * 876.5) * 0.5 + 0.5) * height;
    const r = 0.8 + (i % 3) * 0.6;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * VHS Scanlines: Translucent horizontal line matrix
 */
function applyVHSScanlines(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${(intensity / 100) * 0.22})`;

  const lineHeight = Math.max(2, Math.round(height / 250));
  for (let y = 0; y < height; y += lineHeight * 2) {
    ctx.fillRect(0, y, width, lineHeight);
  }

  ctx.restore();
}

/**
 * Vignette: Radial corner darkening
 */
function applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  const outerRadius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
  const innerRadius = outerRadius * (1 - (intensity / 100) * 0.65);

  const grad = ctx.createRadialGradient(
    width / 2, height / 2, innerRadius,
    width / 2, height / 2, outerRadius
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(15, 10, 8, ${(intensity / 100) * 0.65})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Date Stamp: Vintage LED pixelated stamp
 */
function applyDateStamp(ctx: CanvasRenderingContext2D, width: number, height: number, text: string, color: string = '#F97316') {
  if (!text) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '700 13px "Courier Prime", monospace';
  ctx.textAlign = 'right';
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.fillText(text, width - 14, height - 14);
  ctx.restore();
}
