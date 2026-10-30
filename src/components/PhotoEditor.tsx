import React, { useState, useEffect, useRef } from 'react';
import {
  CapturedPhoto,
  StripLayout,
  FilterPreset,
  FilterAdjustments,
  CustomCaption,
  CustomSticker,
  StripStyle,
  FilmEffectsState,
  EffectToggleState,
  PrintExportConfig
} from '../types/photobooth';
import { DEFAULT_ADJUSTMENTS, DEFAULT_FILM_EFFECTS } from '../utils/filterEngine';
import { renderPhotoStripCanvas } from '../utils/canvasRenderer';
import {
  computeCompositionGeometry,
  computePrintExportDimensions,
  getLayoutPreset,
  getPaperStockProfile
} from '../utils/layoutAndPaper';
import {
  playTactileClickSound,
  playRotaryDetentSound,
  playPresetSwitchSound,
  playPrintEjectSound
} from '../utils/soundEffects';
import {
  StickerAssetDefinition,
  StickerHistoryState,
  createStickerFromAsset,
  duplicateSticker,
  bringStickerForward,
  sendStickerBackward,
  pushStickerHistory
} from '../utils/stickerLibrary';
import {
  Sliders,
  Layout,
  Type,
  Sticker,
  Download,
  Share2,
  Printer,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Film,
  Zap,
  Sun,
  Flame,
  Aperture,
  Tv,
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  SplitSquareHorizontal,
  ArrowLeft
} from 'lucide-react';

import { ImageEnhancerModal } from './ImageEnhancerModal';
import { TouchGestureOverlay } from './TouchGestureOverlay';
import { StickerStudioPanel } from './StickerStudioPanel';
import { LayoutAndPaperPanel } from './LayoutAndPaperPanel';
import { Tooltip } from './Tooltip';

interface PhotoEditorProps {
  photos: CapturedPhoto[];
  onOpenExportModal: (dataUrl: string, canvas: HTMLCanvasElement) => void;
  onOpenShareModal: (dataUrl: string) => void;
  onOpenPrintModal: (dataUrl: string) => void;
  onBackToCamera: () => void;
  onClearPhotos: () => void;
  onUpdatePhoto: (photoId: string, updatedPhoto: Partial<CapturedPhoto>) => void;
}

interface PresetDescriptor {
  name: string;
  stockCode: string;
  iso: string;
  desc: string;
  category: 'Classic' | 'Portrait' | 'Vintage' | 'Monochrome' | 'Cinematic' | 'Flash' | 'Effects' | 'Raw';
  swatches: [string, string, string];
}

const PRESET_LABELS: Record<FilterPreset, PresetDescriptor> = {
  'warm-film': {
    name: 'Warm Film (Kodak 400)',
    stockCode: 'KODAK GOLD 400',
    iso: 'ISO 400',
    desc: 'Rich golden highlights, warm shadows, medium grain',
    category: 'Classic',
    swatches: ['#3A2618', '#C88A4B', '#F5DFB8']
  },
  'soft-matte': {
    name: 'Soft Matte (Portra)',
    stockCode: 'PORTRA 400NC',
    iso: 'ISO 400',
    desc: 'Creamy lifted blacks, natural skin tones, soft contrast',
    category: 'Portrait',
    swatches: ['#3E3530', '#C49A84', '#F3E6DC']
  },
  'vintage-fade': {
    name: 'Vintage Fade (70s)',
    stockCode: 'AGFA COLOR 78',
    iso: 'ISO 200',
    desc: 'Lifted black level, warm sepia undertone, archival fade',
    category: 'Vintage',
    swatches: ['#4A3B2C', '#B58D63', '#EFE0C6']
  },
  'classic-mono': {
    name: 'Classic Mono (Tri-X)',
    stockCode: 'KODAK 400TX',
    iso: 'ISO 400',
    desc: 'Deep silver-gelatin contrast, crisp highlights, classic grain',
    category: 'Monochrome',
    swatches: ['#181818', '#787878', '#F0EFEA']
  },
  'cool-film': {
    name: 'Cool Film (Fuji)',
    stockCode: 'SUPERIA X-TRA',
    iso: 'ISO 400',
    desc: 'Cool cyan-tinted highlights with deep emerald shadow tones',
    category: 'Classic',
    swatches: ['#192E2B', '#5E9287', '#DFEFEA']
  },
  disposable: {
    name: 'Disposable Cam',
    stockCode: 'FUNSAVER 800',
    iso: 'ISO 800',
    desc: 'Punchy direct xenon flash, saturated primary colors',
    category: 'Flash',
    swatches: ['#202638', '#C95B44', '#F8E9B8']
  },
  original: {
    name: 'Original Raw',
    stockCode: 'DIRECT SENSOR',
    iso: 'ISO 100',
    desc: 'Unprocessed neutral studio capture without color cast',
    category: 'Raw',
    swatches: ['#262626', '#8A8A8A', '#F5F5F4']
  },
  'y2k-flash': {
    name: 'Y2K Flash',
    stockCode: 'CYBERSHOT 02',
    iso: 'ISO 400',
    desc: 'Bright direct strobe, specular highlight pop, cool blue cast',
    category: 'Flash',
    swatches: ['#1B2436', '#6987B8', '#EEF4FC']
  },
  'light-leak': {
    name: 'Light Leak',
    stockCode: 'SEAL FLARE 35',
    iso: 'ISO 200',
    desc: 'Warm amber edge flare and organic camera-door light leak',
    category: 'Effects',
    swatches: ['#3A1E14', '#D96B27', '#F9D89C']
  },
  'expired-film': {
    name: 'Expired Film',
    stockCode: 'EXP 1994 ROLL',
    iso: 'ISO 400',
    desc: 'Shifted magenta emulsion cast, heavy silver grain, muted darks',
    category: 'Vintage',
    swatches: ['#3D2332', '#9E6B7B', '#EBD6C8']
  },
  'cinestill-glow': {
    name: 'CineStill Glow',
    stockCode: 'CINESTILL 800T',
    iso: 'ISO 800T',
    desc: 'Tungsten motion-picture stock with red highlight halation',
    category: 'Cinematic',
    swatches: ['#14262E', '#C84630', '#E8F1F2']
  },
  'noir-400': {
    name: 'Noir 400',
    stockCode: 'ILFORD DELTA',
    iso: 'ISO 400',
    desc: 'High-contrast dramatic silver halide black & white',
    category: 'Monochrome',
    swatches: ['#0A0A0A', '#525252', '#FAFAFA']
  },
  'dream-bloom': {
    name: 'Dream Bloom',
    stockCode: 'PRO-MIST 1/4',
    iso: 'ISO 160',
    desc: 'Optical highlight diffusion glow and warm portrait softness',
    category: 'Portrait',
    swatches: ['#362B28', '#D4A89A', '#FCF3EE']
  },
  'party-disposable': {
    name: 'Party Disposable',
    stockCode: 'QUICKSNAP 800',
    iso: 'ISO 800',
    desc: 'Warm club strobe look with quartz LED date stamp',
    category: 'Flash',
    swatches: ['#2B1B28', '#D46A4E', '#F9E4B7']
  },
  'cinema-800t': {
    name: 'Cinema 800T',
    stockCode: 'VISION3 500T',
    iso: 'ISO 500T',
    desc: 'Teal-graded shadows, warm tungsten skin tones, subtle halation',
    category: 'Cinematic',
    swatches: ['#10252E', '#B87D4B', '#E6EEF0']
  },
  '90s-snapshot': {
    name: '90s Snapshot',
    stockCode: 'MAXIMA 200',
    iso: 'ISO 200',
    desc: 'Nostalgic 1990s drugstore print warmth with date imprint',
    category: 'Vintage',
    swatches: ['#362D22', '#B58F5E', '#F4E8D1']
  },
  'pastel-romance': {
    name: 'Pastel Romance',
    stockCode: 'PORTRA 160',
    iso: 'ISO 160',
    desc: 'Delicate sage shadows, rose-tinted highlights, airy bloom',
    category: 'Portrait',
    swatches: ['#353D38', '#C99E9A', '#F9EFEA']
  },
  'classic-booth': {
    name: 'Classic Booth',
    stockCode: 'PHOTO-ME DIP',
    iso: 'ISO 320',
    desc: 'Authentic chemical dip-and-dunk photobooth tonal curve',
    category: 'Classic',
    swatches: ['#2B241E', '#9C826B', '#F2ECE1']
  },
  'vhs-memory': {
    name: 'VHS Memory',
    stockCode: 'HI8 CAMCORDER',
    iso: 'TAPE SP',
    desc: 'CRT scanlines, RGB edge fringing, and camcorder OSD stamp',
    category: 'Effects',
    swatches: ['#1A1D2B', '#4E8C6F', '#E2E8F0']
  }
};

type PresetCategoryFilter = 'All' | PresetDescriptor['category'];

const PRESET_CATEGORIES: PresetCategoryFilter[] = [
  'All',
  'Classic',
  'Portrait',
  'Vintage',
  'Cinematic',
  'Monochrome',
  'Flash',
  'Effects',
  'Raw'
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photos,
  onOpenExportModal,
  onOpenShareModal,
  onOpenPrintModal,
  onBackToCamera,
  onClearPhotos,
  onUpdatePhoto
}) => {
  const [enhancerOpen, setEnhancerOpen] = useState<boolean>(false);

  // Composition State
  const [layout, setLayout] = useState<StripLayout>('strip-3');
  const [preset, setPreset] = useState<FilterPreset>('warm-film');
  const [presetCategory, setPresetCategory] = useState<PresetCategoryFilter>('All');
  const [adjustments, setAdjustments] = useState<FilterAdjustments>({
    ...DEFAULT_ADJUSTMENTS['warm-film']
  });
  const [filmEffects, setFilmEffects] = useState<FilmEffectsState>({
    ...DEFAULT_ADJUSTMENTS['warm-film'].defaultEffects
  });

  // Batch Apply vs Individual Frame Mode
  const [batchApply, setBatchApply] = useState<boolean>(true);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

  // Light-Table Stage Interactive States
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>('');
  const [isZoomedLoupe, setIsZoomedLoupe] = useState<boolean>(false);
  const [lightTableSurface, setLightTableSurface] = useState<'darkroom' | 'warm-paper' | 'gallery'>('darkroom');
  const [mobileStageCompact, setMobileStageCompact] = useState<boolean>(true);
  const [emulsionPulse, setEmulsionPulse] = useState<boolean>(false);

  const [style, setStyle] = useState<StripStyle>({
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
    frameAspectRatio: '4:3',
    frameBorderThickness: 1,
    cornerStyle: 'sharp',
    orientation: 'portrait',
    frameNumbering: 'off',
    frameCrops: {}
  });

  const [printConfig, setPrintConfig] = useState<PrintExportConfig>({
    sizePreset: 'digital-highres',
    dpi: 300,
    includeBleedGuides: false,
    safeMarginMm: 3,
    duplexOn4x6: true
  });

  const [captions, setCaptions] = useState<CustomCaption[]>([
    {
      id: 'cap_1',
      text: 'Moments in 35mm',
      font: 'garamond',
      size: 20,
      color: '#1C1917',
      align: 'center',
      x: 0.5,
      y: 0.94,
      rotation: 0
    }
  ]);

  // Stickers & Undo/Redo History State
  const [stickers, setStickers] = useState<CustomSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [stickerHistory, setStickerHistory] = useState<StickerHistoryState>({
    stack: [[]],
    index: 0
  });

  const [activeTab, setActiveTab] = useState<'preset' | 'effects' | 'layout' | 'adjust' | 'text' | 'stickers'>('preset');

  const [renderedDataUrl, setRenderedDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number }>({ width: 300, height: 600 });

  // Update preview container dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (previewContainerRef.current) {
        setPreviewSize({
          width: previewContainerRef.current.clientWidth,
          height: previewContainerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [renderedDataUrl, isZoomedLoupe, mobileStageCompact]);

  // Helper to commit sticker changes to Undo/Redo stack
  const commitStickers = (nextStickers: CustomSticker[]) => {
    setStickers(nextStickers);
    setStickerHistory((prev) => pushStickerHistory(prev, nextStickers));
  };

  const handleUndoSticker = () => {
    if (stickerHistory.index <= 0) return;
    playTactileClickSound();
    const nextIdx = stickerHistory.index - 1;
    const restored = stickerHistory.stack[nextIdx].map((s) => ({ ...s }));
    setStickerHistory({ ...stickerHistory, index: nextIdx });
    setStickers(restored);
    if (selectedStickerId && !restored.some((s) => s.id === selectedStickerId)) {
      setSelectedStickerId(restored[restored.length - 1]?.id || null);
    }
  };

  const handleRedoSticker = () => {
    if (stickerHistory.index >= stickerHistory.stack.length - 1) return;
    playTactileClickSound();
    const nextIdx = stickerHistory.index + 1;
    const restored = stickerHistory.stack[nextIdx].map((s) => ({ ...s }));
    setStickerHistory({ ...stickerHistory, index: nextIdx });
    setStickers(restored);
  };

  const handleAddStickerFromAsset = (asset: StickerAssetDefinition) => {
    playTactileClickSound();
    const created = createStickerFromAsset(asset, stickers);
    const next = [...stickers, created];
    commitStickers(next);
    setSelectedStickerId(created.id);
  };

  const handleUpdateSticker = (id: string, partial: Partial<CustomSticker>) => {
    const next = stickers.map((s) => (s.id === id ? { ...s, ...partial } : s));
    commitStickers(next);
  };

  const handleDuplicateSticker = (id: string) => {
    playTactileClickSound();
    const { stickers: next, duplicated } = duplicateSticker(stickers, id);
    if (duplicated) {
      commitStickers(next);
      setSelectedStickerId(duplicated.id);
    }
  };

  const handleBringStickerForward = (id: string) => {
    playTactileClickSound();
    const next = bringStickerForward(stickers, id);
    commitStickers(next);
  };

  const handleSendStickerBackward = (id: string) => {
    playTactileClickSound();
    const next = sendStickerBackward(stickers, id);
    commitStickers(next);
  };

  const handleRemoveSticker = (id: string) => {
    playTactileClickSound();
    const next = stickers.filter((s) => s.id !== id);
    commitStickers(next);
    if (selectedStickerId === id) {
      setSelectedStickerId(next[next.length - 1]?.id || null);
    }
  };

  const handleClearStickers = () => {
    playTactileClickSound();
    commitStickers([]);
    setSelectedStickerId(null);
  };

  const handleUpdateCaption = (id: string, partial: Partial<CustomCaption>) => {
    setCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  };

  const handleRemoveCaption = (id: string) => {
    playTactileClickSound();
    setCaptions((prev) => prev.filter((c) => c.id !== id));
  };

  // Sync current filter state to target frame(s)
  const syncFilterToPhotoFrames = (
    nextPreset: FilterPreset,
    nextAdjustments: FilterAdjustments,
    nextEffects: FilmEffectsState,
    forceAll = false
  ) => {
    if (batchApply || forceAll) {
      photos.forEach((p) => {
        onUpdatePhoto(p.id, {
          frameOverride: {
            preset: nextPreset,
            adjustments: { ...nextAdjustments },
            filmEffects: JSON.parse(JSON.stringify(nextEffects))
          }
        });
      });
    } else {
      const targetPhoto = photos[selectedFrameIndex];
      if (targetPhoto) {
        onUpdatePhoto(targetPhoto.id, {
          frameOverride: {
            preset: nextPreset,
            adjustments: { ...nextAdjustments },
            filmEffects: JSON.parse(JSON.stringify(nextEffects))
          }
        });
      }
    }
  };

  const handleToggleBatchApply = (enabled: boolean) => {
    playTactileClickSound();
    setBatchApply(enabled);
    if (enabled) {
      syncFilterToPhotoFrames(preset, adjustments, filmEffects, true);
    } else {
      const targetPhoto = photos[selectedFrameIndex];
      if (targetPhoto?.frameOverride) {
        setPreset(targetPhoto.frameOverride.preset);
        setAdjustments({ ...targetPhoto.frameOverride.adjustments });
        setFilmEffects({ ...targetPhoto.frameOverride.filmEffects });
      } else {
        syncFilterToPhotoFrames(preset, adjustments, filmEffects, true);
      }
    }
  };

  const handleSelectFrameIndex = (idx: number) => {
    playTactileClickSound();
    setSelectedFrameIndex(idx);
    const targetPhoto = photos[idx];
    if (!batchApply && targetPhoto?.frameOverride) {
      setPreset(targetPhoto.frameOverride.preset);
      setAdjustments({ ...targetPhoto.frameOverride.adjustments });
      setFilmEffects({ ...targetPhoto.frameOverride.filmEffects });
    }
  };

  // Keyboard navigation for Editor tab switching and Undo/Redo
  useEffect(() => {
    const tabs: Array<typeof activeTab> = ['preset', 'effects', 'layout', 'adjust', 'text', 'stickers'];

    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoSticker();
        } else {
          handleUndoSticker();
        }
        return;
      }

      if (e.key === '1') {
        playTactileClickSound();
        setActiveTab('preset');
      }
      if (e.key === '2') {
        playTactileClickSound();
        setActiveTab('effects');
      }
      if (e.key === '3') {
        playTactileClickSound();
        setActiveTab('layout');
      }
      if (e.key === '4') {
        playTactileClickSound();
        setActiveTab('adjust');
      }
      if (e.key === '5') {
        playTactileClickSound();
        setActiveTab('text');
      }
      if (e.key === '6') {
        playTactileClickSound();
        setActiveTab('stickers');
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        playTactileClickSound();
        const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playTactileClickSound();
        const prevIdx = (tabs.indexOf(activeTab) - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, stickerHistory]);

  // Trigger canvas re-rendering whenever composition state updates
  useEffect(() => {
    let isCancelled = false;
    setIsRendering(true);

    renderPhotoStripCanvas({
      photos,
      layout,
      style,
      preset,
      adjustments: {
        ...adjustments,
        effects: filmEffects
      },
      captions,
      stickers,
      batchApply,
      scaleFactor: 1,
      printConfig
    })
      .then((canvas) => {
        if (isCancelled) return;
        canvasRef.current = canvas;
        setRenderedDataUrl(canvas.toDataURL('image/png'));
        setIsRendering(false);
      })
      .catch((err) => {
        console.error('Error rendering canvas:', err);
        setIsRendering(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [photos, layout, preset, adjustments, filmEffects, style, captions, stickers, batchApply, printConfig]);

  // Render an ungraded "Original Raw" reference strip when user activates Compare Original
  useEffect(() => {
    if (!isComparingOriginal) return;
    let isCancelled = false;

    const rawBase = DEFAULT_ADJUSTMENTS.original;
    renderPhotoStripCanvas({
      photos: photos.map((p) => ({ ...p, frameOverride: undefined })),
      layout,
      style,
      preset: 'original',
      adjustments: {
        ...rawBase,
        effects: DEFAULT_FILM_EFFECTS
      },
      captions,
      stickers,
      batchApply: true,
      scaleFactor: 1,
      printConfig
    })
      .then((canvas) => {
        if (isCancelled) return;
        setOriginalPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [isComparingOriginal, photos, layout, style, captions, stickers, printConfig]);

  // Handle Preset Change with tactile turret sound & subtle emulsion pulse
  const handlePresetSelect = (p: FilterPreset) => {
    playPresetSwitchSound();
    setPreset(p);
    setEmulsionPulse(true);
    setTimeout(() => setEmulsionPulse(false), 180);

    const base = DEFAULT_ADJUSTMENTS[p] || DEFAULT_ADJUSTMENTS.original;
    const nextAdj = { ...base };
    const nextEff = { ...base.defaultEffects };
    setAdjustments(nextAdj);
    setFilmEffects(nextEff);
    syncFilterToPhotoFrames(p, nextAdj, nextEff);
  };

  // Film Effect helper functions
  const handleEffectToggle = (key: keyof FilmEffectsState, enabled: boolean) => {
    playTactileClickSound();
    setFilmEffects((prev) => {
      const next: FilmEffectsState =
        key === 'dateStamp'
          ? { ...prev, dateStamp: { ...prev.dateStamp, enabled } }
          : { ...prev, [key]: { ...(prev[key] as EffectToggleState), enabled } };
      syncFilterToPhotoFrames(preset, adjustments, next);
      return next;
    });
  };

  const handleEffectIntensity = (key: keyof FilmEffectsState, intensity: number) => {
    playRotaryDetentSound();
    setFilmEffects((prev) => {
      if (key === 'dateStamp') return prev;
      const next: FilmEffectsState = {
        ...prev,
        [key]: { ...(prev[key] as EffectToggleState), intensity }
      };
      syncFilterToPhotoFrames(preset, adjustments, next);
      return next;
    });
  };

  const handleResetEffectsToPresetDefaults = () => {
    playTactileClickSound();
    const base = DEFAULT_ADJUSTMENTS[preset] || DEFAULT_ADJUSTMENTS.original;
    const nextEff = { ...base.defaultEffects };
    setFilmEffects(nextEff);
    syncFilterToPhotoFrames(preset, adjustments, nextEff);
  };

  const handleDisableAllEffects = () => {
    playTactileClickSound();
    const nextEff = { ...DEFAULT_FILM_EFFECTS };
    setFilmEffects(nextEff);
    syncFilterToPhotoFrames(preset, adjustments, nextEff);
  };

  // Add caption line
  const addCaption = () => {
    playTactileClickSound();
    const newCap: CustomCaption = {
      id: `cap_${Date.now()}`,
      text: 'Good Times',
      font: 'handwriting',
      size: 22,
      color: style.textColor,
      align: 'center',
      x: 0.5,
      y: 0.5,
      rotation: 0
    };
    setCaptions([...captions, newCap]);
  };

  const handleExport = async () => {
    playPrintEjectSound();
    try {
      setIsRendering(true);
      const geo = computeCompositionGeometry(layout, style);
      const dims = computePrintExportDimensions(geo.targetWidth, geo.targetHeight, printConfig);
      const hiResCanvas = await renderPhotoStripCanvas({
        photos,
        layout,
        style,
        preset,
        adjustments: {
          ...adjustments,
          effects: filmEffects
        },
        captions,
        stickers,
        batchApply,
        scaleFactor: dims.scaleFactor,
        printConfig
      });
      const hiResUrl = hiResCanvas.toDataURL('image/png');
      setIsRendering(false);
      onOpenExportModal(hiResUrl, hiResCanvas);
    } catch (err) {
      console.error('High-res export render failed:', err);
      setIsRendering(false);
      if (canvasRef.current && renderedDataUrl) {
        onOpenExportModal(renderedDataUrl, canvasRef.current);
      }
    }
  };

  const currentLayoutMeta = getLayoutPreset(layout);
  const currentPaperMeta = getPaperStockProfile(style.paperStock);
  const currentPresetMeta = PRESET_LABELS[preset];
  const frameCount = Math.max(photos.length, currentLayoutMeta.frameCount);

  const filteredPresets = (Object.keys(PRESET_LABELS) as FilterPreset[]).filter((key) => {
    if (presetCategory === 'All') return true;
    return PRESET_LABELS[key].category === presetCategory;
  });

  const activeEffectsCount = [
    filmEffects.grain.enabled,
    filmEffects.halation.enabled,
    filmEffects.lightLeak.enabled,
    filmEffects.bloom.enabled,
    filmEffects.vignette.enabled,
    filmEffects.dustScratches.enabled,
    filmEffects.chromaticAberration.enabled,
    filmEffects.vhsScanlines.enabled,
    filmEffects.dateStamp.enabled
  ].filter(Boolean).length;

  const lightTableBgClass =
    lightTableSurface === 'darkroom'
      ? 'bg-[#141210] border-[#2C2723] text-[#E6E0D4]'
      : lightTableSurface === 'warm-paper'
      ? 'bg-[#EAE4D7] border-[#D5CCBC] text-[#1C1917]'
      : 'bg-[#232220] border-[#383532] text-[#F4F1EA]';

  const displayedStripUrl = isComparingOriginal && originalPreviewUrl ? originalPreviewUrl : renderedDataUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
      {/* Top Darkroom Workbench Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DED8CC] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#787063]">
            <span>DARKROOM WORKBENCH</span>
            <span aria-hidden="true">·</span>
            <span>{currentLayoutMeta.name}</span>
            <span aria-hidden="true">·</span>
            <span>{currentPaperMeta.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] tracking-tight">
            Strip Composition &amp; Color Grading
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTactileClickSound();
              onBackToCamera();
            }}
            className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#4A453D] bg-[#EAE5DA] hover:bg-[#DED7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retake</span>
          </button>

          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                playTactileClickSound();
                onClearPhotos();
                onBackToCamera();
              }}
              title="Clear all photos and start fresh"
              className="min-h-[40px] px-3 py-2 text-xs font-medium text-[#7F2B2B] hover:text-[#5C1919] bg-[#F5EBEB] hover:bg-[#ECDADA] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Reel</span>
            </button>
          )}

          <Tooltip content="2× / 4× Optical Super-Resolution & Detail Restoration">
            <button
              type="button"
              onClick={() => {
                playTactileClickSound();
                setEnhancerOpen(true);
              }}
              className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#EAE5DA] hover:bg-[#DED7C8] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Aperture className="w-3.5 h-3.5 text-[#6B2D38]" />
              <span>Optical Upscale</span>
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={() => {
              playPrintEjectSound();
              onOpenPrintModal(renderedDataUrl);
            }}
            disabled={!renderedDataUrl}
            className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#EAE5DA] hover:bg-[#DED7C8] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPrintEjectSound();
              onOpenShareModal(renderedDataUrl);
            }}
            disabled={!renderedDataUrl}
            className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#EAE5DA] hover:bg-[#DED7C8] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share QR</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!renderedDataUrl}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#6B2D38] hover:bg-[#56222B] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: On Mobile, Live Light-Table Stage is FIRST (order-1) so users see their strip while editing below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* RIGHT ON DESKTOP / TOP ON MOBILE: Interactive Darkroom Light-Table Stage */}
        <div className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-20 space-y-3">
          <div className={`rounded-2xl border p-4 sm:p-5 transition-colors duration-200 ${lightTableBgClass}`}>
            {/* Light-Table Top Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-current/10 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Eye className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold tracking-wider uppercase">
                  {isComparingOriginal ? 'RAW UNGRADED REFERENCE' : currentPresetMeta.stockCode}
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="opacity-75 tabular-nums">{currentPresetMeta.iso}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Hold / Toggle Compare Original */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    setIsComparingOriginal((prev) => !prev);
                  }}
                  aria-pressed={isComparingOriginal}
                  title="Compare graded strip against original ungraded capture"
                  className={`min-h-[34px] px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    isComparingOriginal
                      ? 'bg-amber-500 text-[#141210] font-semibold'
                      : 'bg-current/10 hover:bg-current/15'
                  }`}
                >
                  <SplitSquareHorizontal className="w-3.5 h-3.5" />
                  <span>{isComparingOriginal ? 'Showing Original' : 'Compare Raw'}</span>
                </button>

                {/* Loupe Zoom Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    setIsZoomedLoupe((prev) => !prev);
                  }}
                  aria-pressed={isZoomedLoupe}
                  title="Toggle 1.25x darkroom inspection loupe"
                  className={`min-h-[34px] px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    isZoomedLoupe
                      ? 'bg-amber-500 text-[#141210] font-semibold'
                      : 'bg-current/10 hover:bg-current/15'
                  }`}
                >
                  {isZoomedLoupe ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isZoomedLoupe ? '100%' : 'Loupe'}</span>
                </button>

                {/* Mobile Compact / Full Height Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    setMobileStageCompact((prev) => !prev);
                  }}
                  className="lg:hidden min-h-[34px] px-2.5 py-1 rounded-md font-mono text-[11px] bg-current/10 hover:bg-current/15 transition-colors whitespace-nowrap shrink-0"
                >
                  {mobileStageCompact ? 'Full View' : 'Compact'}
                </button>
              </div>
            </div>

            {/* Illuminated Strip Canvas Stage (Zero-Flicker Smooth Transitions) */}
            <div
              className={`relative flex items-center justify-center overflow-auto rounded-xl transition-all duration-200 ${
                mobileStageCompact
                  ? 'max-h-[245px] lg:max-h-none lg:min-h-[480px] py-2 lg:py-4'
                  : 'min-h-[360px] sm:min-h-[480px] py-4'
              }`}
            >
              {/* Subtle radial light-table glow behind the strip */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,235,214,0.07),transparent_75%)]"
              />

              {displayedStripUrl ? (
                <div
                  ref={previewContainerRef}
                  className={`relative inline-block select-none transition-transform duration-200 ease-out will-change-transform ${
                    isZoomedLoupe ? 'scale-[1.18] my-6' : 'scale-100'
                  } ${emulsionPulse ? 'opacity-90 scale-[0.99]' : 'opacity-100'}`}
                >
                  <img
                    src={displayedStripUrl}
                    alt="Rendered Photo Strip"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      setPreviewSize({ width: el.clientWidth, height: el.clientHeight });
                    }}
                    className={`${
                      mobileStageCompact
                        ? 'max-h-[225px] lg:max-h-[560px]'
                        : 'max-h-[420px] sm:max-h-[560px]'
                    } w-auto object-contain rounded-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.45)] select-none pointer-events-none transition-opacity duration-150`}
                  />

                  {/* Touch & Mouse Gesture Overlay for Stickers and Captions */}
                  {!isComparingOriginal && (
                    <TouchGestureOverlay
                      stickers={stickers}
                      selectedStickerId={selectedStickerId}
                      onSelectSticker={setSelectedStickerId}
                      onUpdateSticker={handleUpdateSticker}
                      onRemoveSticker={handleRemoveSticker}
                      onDuplicateSticker={handleDuplicateSticker}
                      onBringForward={handleBringStickerForward}
                      onSendBackward={handleSendStickerBackward}
                      captions={captions}
                      onUpdateCaption={handleUpdateCaption}
                      onRemoveCaption={handleRemoveCaption}
                      containerWidth={previewSize.width}
                      containerHeight={previewSize.height}
                    />
                  )}
                </div>
              ) : (
                <div className="py-20 text-xs font-mono opacity-60">
                  Developing strip preview...
                </div>
              )}
            </div>

            {/* Bottom Light-Table Metadata & Surface Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-current/10 text-[11px] font-mono">
              <div className="flex items-center gap-2 opacity-80">
                <span>{batchApply ? 'Batch Grading (All Frames)' : `Grading Frame 0${selectedFrameIndex + 1}A`}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeEffectsCount} Optical FX</span>
              </div>

              <div className="flex items-center gap-1" role="group" aria-label="Light table surface">
                {(
                  [
                    { id: 'darkroom', label: 'Darkroom' },
                    { id: 'gallery', label: 'Charcoal' },
                    { id: 'warm-paper', label: 'Daylight' }
                  ] as const
                ).map((surf) => (
                  <button
                    key={surf.id}
                    type="button"
                    onClick={() => {
                      playTactileClickSound();
                      setLightTableSurface(surf.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap shrink-0 ${
                      lightTableSurface === surf.id
                        ? 'bg-current/20 font-semibold'
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    {surf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LEFT ON DESKTOP / BOTTOM ON MOBILE: Darkroom Controls Workbench */}
        <div className="order-2 lg:order-1 lg:col-span-7 bg-[#EFECE3] p-4 sm:p-6 rounded-2xl border border-[#DED8CC] space-y-6">
          {/* 6-Tab Darkroom Workbench Navigation */}
          <div
            role="tablist"
            aria-label="Strip editor sections"
            className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1.5 bg-[#E2DDD3] rounded-xl text-xs font-medium"
          >
            {(
              [
                { id: 'preset', label: 'Stocks', icon: Film, shortcut: '1' },
                { id: 'effects', label: 'Effects', icon: Sun, shortcut: '2' },
                { id: 'layout', label: 'Layout', icon: Layout, shortcut: '3' },
                { id: 'adjust', label: 'Grading', icon: Sliders, shortcut: '4' },
                { id: 'text', label: 'Captions', icon: Type, shortcut: '5' },
                { id: 'stickers', label: 'Stickers', icon: Sticker, shortcut: '6' }
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    setActiveTab(tab.id);
                  }}
                  className={`min-h-[44px] px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#1C1917] text-[#F6F3EC] font-semibold shadow-xs'
                      : 'text-[#575249] hover:text-[#1C1917] hover:bg-[#EAE5DA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 35MM CONTACT STRIP & BATCH APPLY BAR (Shown for Film Stocks, Optical FX, and Color Grade) */}
          {(activeTab === 'preset' || activeTab === 'effects' || activeTab === 'adjust') && (
            <div className="bg-[#F6F3EC] p-3.5 sm:p-4 rounded-xl border border-[#DED8CC] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-serif font-bold text-[#1C1917] block">
                    35mm Frame Grading Scope
                  </span>
                  <span className="text-[11px] text-[#6B6458] block">
                    {batchApply
                      ? 'Applying film stock and optical effects across all frames simultaneously.'
                      : `Grading Frame 0${selectedFrameIndex + 1}A independently — other frames keep their settings.`}
                  </span>
                </div>

                {/* Segmented Batch vs Per-Frame Switch */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#DED8CC] min-h-[38px]">
                    <input
                      type="checkbox"
                      checked={batchApply}
                      onChange={(e) => handleToggleBatchApply(e.target.checked)}
                      aria-label="Batch Apply"
                      className="w-4 h-4 accent-[#6B2D38]"
                    />
                    <span className="text-xs font-mono font-semibold text-[#1C1917] whitespace-nowrap">
                      Batch Apply
                    </span>
                  </label>
                </div>
              </div>

              {/* Interactive Contact Sheet Thumbnails for Per-Frame Selection */}
              <div className="pt-2 border-t border-[#E6E0D4] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {Array.from({ length: frameCount }).map((_, idx) => {
                    const photoItem = photos[idx % Math.max(1, photos.length)];
                    const framePreset = photoItem?.frameOverride?.preset || preset;
                    const isFrameSelected = !batchApply && selectedFrameIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (batchApply) {
                            handleToggleBatchApply(false);
                          }
                          handleSelectFrameIndex(idx);
                        }}
                        className={`group flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border text-left transition-all min-h-[42px] shrink-0 ${
                          isFrameSelected
                            ? 'bg-[#1C1917] text-white border-[#1C1917]'
                            : batchApply
                            ? 'bg-white/80 text-[#575249] border-[#DED8CC] hover:border-[#1C1917]'
                            : 'bg-white text-[#575249] border-[#DED8CC] hover:border-[#1C1917]'
                        }`}
                      >
                        <div className="w-8 h-6 rounded-[3px] overflow-hidden bg-stone-800 shrink-0 border border-black/15">
                          {photoItem?.dataUrl && (
                            <img
                              src={photoItem.dataUrl}
                              alt={`Frame ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="leading-tight">
                          <div className="text-[10px] font-mono font-semibold tabular-nums">
                            Frame {idx + 1} ({PRESET_LABELS[framePreset]?.name.split(' ')[0] || framePreset})
                          </div>
                          <div
                            className={`text-[9px] font-mono ${
                              isFrameSelected ? 'text-amber-300' : 'text-[#8C8275]'
                            }`}
                          >
                            0{idx + 1}A · {PRESET_LABELS[framePreset]?.iso || 'ISO 400'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!batchApply && (
                  <button
                    type="button"
                    onClick={() => {
                      playTactileClickSound();
                      syncFilterToPhotoFrames(preset, adjustments, filmEffects, true);
                    }}
                    className="min-h-[36px] px-3 py-1.5 text-[11px] font-mono font-semibold text-[#6B2D38] bg-white hover:bg-[#EAE5DA] border border-[#6B2D38]/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Sync Current to All Frames
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: 35MM FILM STOCK PRESETS */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1917]">
                    35mm Analog Film Emulsions
                  </h3>
                  <p className="text-xs text-[#6B6458]">
                    Select a calibrated silver-halide or color negative film stock.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#787063] tabular-nums">
                  {filteredPresets.length} of 19 Stocks
                </span>
              </div>

              {/* Category Filter Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      playTactileClickSound();
                      setPresetCategory(cat);
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      presetCategory === cat
                        ? 'bg-[#6B2D38] text-white'
                        : 'bg-[#E2DDD3] text-[#575249] hover:text-[#1C1917]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Film Stock Grid with 3-Tone Emulsion Swatches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredPresets.map((key) => {
                  const info = PRESET_LABELS[key];
                  const isSelected = preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetSelect(key)}
                      className={`group p-3.5 rounded-xl text-left border transition-all duration-150 space-y-2 ${
                        isSelected
                          ? 'bg-white border-[#6B2D38] shadow-xs ring-1 ring-[#6B2D38]'
                          : 'bg-[#F6F3EC] border-[#DED8CC] hover:bg-white hover:border-[#B8B0A0]'
                      }`}
                    >
                      {/* Top Row: Emulsion Swatch Strip + Stock Metadata */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#787063]">
                          <span className="font-semibold text-[#6B2D38]">{info.stockCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>{info.iso}</span>
                          <span aria-hidden="true">·</span>
                          <span>{info.category}</span>
                        </div>

                        {/* 3-Tone Shadow/Midtone/Highlight Emulsion Swatch */}
                        <div
                          aria-hidden="true"
                          className="flex items-center h-3 w-12 rounded-[3px] overflow-hidden border border-black/15 shrink-0"
                        >
                          <span className="flex-1 h-full" style={{ backgroundColor: info.swatches[0] }} />
                          <span className="flex-1 h-full" style={{ backgroundColor: info.swatches[1] }} />
                          <span className="flex-1 h-full" style={{ backgroundColor: info.swatches[2] }} />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold font-serif text-[#1C1917] group-hover:text-[#6B2D38] transition-colors">
                          {info.name}
                        </div>
                        <p className="text-[11px] text-[#6B6458] leading-snug mt-0.5">
                          {info.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FILM EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1917]">
                    Optical Darkroom Artifacts
                  </h3>
                  <p className="text-xs text-[#6B6458]">
                    Toggle and dial in real pixel-rendered emulsion and lens artifacts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetEffectsToPresetDefaults}
                    className="min-h-[34px] px-2.5 py-1 text-[11px] font-mono font-medium text-[#1C1917] bg-[#E2DDD3] hover:bg-[#D6D0C2] rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
                    title="Reset effects to default values for current preset"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Preset Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableAllEffects}
                    className="min-h-[34px] px-2.5 py-1 text-[11px] font-mono font-medium text-[#575249] hover:text-[#1C1917] bg-[#E2DDD3] hover:bg-[#D6D0C2] rounded-md transition-colors whitespace-nowrap"
                  >
                    Off All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Film Grain */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Aperture className="w-4 h-4 text-[#6B2D38]" />
                      <span className="text-xs font-bold text-[#1C1917]">Silver Halide Grain</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.grain.enabled}
                        onChange={(e) => handleEffectToggle('grain', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.grain.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.grain.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.grain.intensity}
                      onChange={(e) => handleEffectIntensity('grain', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 2. Halation */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-bold text-[#1C1917]">CineStill Halation</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.halation.enabled}
                        onChange={(e) => handleEffectToggle('halation', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.halation.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.halation.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.halation.intensity}
                      onChange={(e) => handleEffectIntensity('halation', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 3. Light Leak */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-[#1C1917]">Light Leak Flare</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.lightLeak.enabled}
                        onChange={(e) => handleEffectToggle('lightLeak', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.lightLeak.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.lightLeak.enabled && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filmEffects.lightLeak.intensity}
                        onChange={(e) => handleEffectIntensity('lightLeak', parseInt(e.target.value, 10))}
                        className="w-full accent-[#6B2D38]"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#6B6458]">Seal Position</span>
                        <select
                          value={filmEffects.lightLeak.position || 'top-right'}
                          onChange={(e) => {
                            playTactileClickSound();
                            setFilmEffects((prev) => {
                              const next: FilmEffectsState = {
                                ...prev,
                                lightLeak: {
                                  ...prev.lightLeak,
                                  position: e.target.value as FilmEffectsState['lightLeak']['position']
                                }
                              };
                              syncFilterToPhotoFrames(preset, adjustments, next);
                              return next;
                            });
                          }}
                          className="px-2 py-1 text-xs bg-white border border-[#DED8CC] rounded font-mono"
                        >
                          <option value="top-right">Top-Right Corner</option>
                          <option value="top-left">Top-Left Corner</option>
                          <option value="bottom-right">Bottom-Right Corner</option>
                          <option value="left-edge">Left Hinge Seal</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Bloom */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-bold text-[#1C1917]">Highlight Bloom</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.bloom.enabled}
                        onChange={(e) => handleEffectToggle('bloom', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.bloom.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.bloom.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.bloom.intensity}
                      onChange={(e) => handleEffectIntensity('bloom', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 5. Vignette */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-stone-700" />
                      <span className="text-xs font-bold text-[#1C1917]">Lens Vignette Falloff</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.vignette.enabled}
                        onChange={(e) => handleEffectToggle('vignette', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.vignette.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.vignette.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.vignette.intensity}
                      onChange={(e) => handleEffectIntensity('vignette', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 6. Dust & Scratches */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-[#1C1917]">Dust &amp; Scratches</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.dustScratches.enabled}
                        onChange={(e) => handleEffectToggle('dustScratches', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.dustScratches.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.dustScratches.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.dustScratches.intensity}
                      onChange={(e) => handleEffectIntensity('dustScratches', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 7. Chromatic Aberration */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-700" />
                      <span className="text-xs font-bold text-[#1C1917]">Chromatic Fringing</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.chromaticAberration.enabled}
                        onChange={(e) => handleEffectToggle('chromaticAberration', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.chromaticAberration.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.chromaticAberration.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.chromaticAberration.intensity}
                      onChange={(e) => handleEffectIntensity('chromaticAberration', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 8. VHS Scanlines */}
                <div className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-[#1C1917]">CRT / VHS Scanlines</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.vhsScanlines.enabled}
                        onChange={(e) => handleEffectToggle('vhsScanlines', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458] tabular-nums w-9 text-right">
                        {filmEffects.vhsScanlines.intensity}%
                      </span>
                    </label>
                  </div>
                  {filmEffects.vhsScanlines.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.vhsScanlines.intensity}
                      onChange={(e) => handleEffectIntensity('vhsScanlines', parseInt(e.target.value, 10))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 9. Quartz LED Date Stamp */}
                <div className="sm:col-span-2 bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-bold text-[#1C1917]">1990s Quartz LED Date Stamp</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.dateStamp.enabled}
                        onChange={(e) => handleEffectToggle('dateStamp', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#6B6458]">
                        {filmEffects.dateStamp.enabled ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>
                  {filmEffects.dateStamp.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-mono text-[#6B6458] block mb-1">
                          Imprint Text
                        </label>
                        <input
                          type="text"
                          value={filmEffects.dateStamp.text}
                          onChange={(e) =>
                            setFilmEffects((prev) => {
                              const next: FilmEffectsState = {
                                ...prev,
                                dateStamp: { ...prev.dateStamp, text: e.target.value }
                              };
                              syncFilterToPhotoFrames(preset, adjustments, next);
                              return next;
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#DED8CC] rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#6B6458] block mb-1">
                          Phosphor LED Color
                        </label>
                        <input
                          type="color"
                          value={filmEffects.dateStamp.color}
                          onChange={(e) =>
                            setFilmEffects((prev) => {
                              const next: FilmEffectsState = {
                                ...prev,
                                dateStamp: { ...prev.dateStamp, color: e.target.value }
                              };
                              syncFilterToPhotoFrames(preset, adjustments, next);
                              return next;
                            })
                          }
                          className="w-full h-8 bg-white cursor-pointer rounded-md border border-[#DED8CC] p-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & PAPER */}
          {activeTab === 'layout' && (
            <LayoutAndPaperPanel
              layout={layout}
              style={style}
              printConfig={printConfig}
              onSelectLayout={(nextLayout) => {
                playTactileClickSound();
                setLayout(nextLayout);
              }}
              onUpdateStyle={(partial) => {
                playTactileClickSound();
                setStyle((prev) => ({ ...prev, ...partial }));
              }}
              onUpdatePrintConfig={(partial) => {
                playTactileClickSound();
                setPrintConfig((prev) => ({ ...prev, ...partial }));
              }}
              onTriggerHighResExport={handleExport}
              onTriggerPrintModal={() => {
                playPrintEjectSound();
                onOpenPrintModal(renderedDataUrl);
              }}
            />
          )}

          {/* TAB 4: COLOR GRADE SLIDERS */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1917]">
                    Enlarger Color Head &amp; Density Controls
                  </h3>
                  <p className="text-xs text-[#6B6458]">
                    Fine-tune exposure density, contrast grade, and dichromatic color balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    const base = DEFAULT_ADJUSTMENTS[preset] || DEFAULT_ADJUSTMENTS.original;
                    setAdjustments({ ...base });
                    syncFilterToPhotoFrames(preset, { ...base }, filmEffects);
                  }}
                  className="min-h-[34px] px-2.5 py-1 text-[11px] font-mono font-medium text-[#1C1917] bg-[#E2DDD3] hover:bg-[#D6D0C2] rounded-md transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Grade</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'intensity', label: 'Emulsion Strength', min: 0, max: 100, unit: '%' },
                  { key: 'brightness', label: 'Exposure Density', min: -50, max: 50, unit: '' },
                  { key: 'contrast', label: 'Contrast Grade', min: -50, max: 50, unit: '' },
                  { key: 'saturation', label: 'Chroma Saturation', min: -100, max: 100, unit: '' },
                  { key: 'warmth', label: 'Color Temperature (K)', min: -50, max: 50, unit: '' },
                  { key: 'tint', label: 'Magenta / Green Tint', min: -50, max: 50, unit: '' }
                ].map((item) => {
                  const val =
                    (adjustments[
                      item.key as 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'tint' | 'intensity'
                    ] as number) || 0;
                  return (
                    <div
                      key={item.key}
                      className="bg-[#F6F3EC] p-3.5 rounded-xl border border-[#DED8CC] space-y-2"
                    >
                      <div className="flex justify-between text-xs font-medium text-[#1C1917]">
                        <span>{item.label}</span>
                        <span className="font-mono text-[#6B2D38] tabular-nums">
                          {val > 0 && item.min < 0 ? `+${val}` : val}
                          {item.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={val}
                        onChange={(e) => {
                          playRotaryDetentSound();
                          const nextAdj = {
                            ...adjustments,
                            [item.key]: parseInt(e.target.value, 10)
                          };
                          setAdjustments(nextAdj);
                          syncFilterToPhotoFrames(preset, nextAdj, filmEffects);
                        }}
                        className="w-full accent-[#6B2D38]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: CAPTIONS & TYPOGRAPHY */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1917]">
                    Margin Notes &amp; Editorial Typography
                  </h3>
                  <p className="text-xs text-[#6B6458]">
                    Add custom captions or drag text directly on the live strip preview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCaption}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Caption</span>
                </button>
              </div>

              {captions.length === 0 ? (
                <div className="p-6 text-center bg-[#F6F3EC] rounded-xl border border-[#DED8CC] text-xs text-[#6B6458]">
                  No margin captions active. Click &ldquo;Add Caption&rdquo; to place an inscription on your strip.
                </div>
              ) : (
                <div className="space-y-3">
                  {captions.map((cap, idx) => (
                    <div
                      key={cap.id}
                      className="bg-[#F6F3EC] p-4 rounded-xl border border-[#DED8CC] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#1C1917]">
                          Inscription #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCaption(cap.id)}
                          aria-label={`Delete Inscription ${idx + 1}`}
                          className="p-1 text-[#787063] hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={cap.text}
                        onChange={(e) =>
                          setCaptions(
                            captions.map((c) => (c.id === cap.id ? { ...c, text: e.target.value } : c))
                          )
                        }
                        placeholder="Enter custom inscription..."
                        className="w-full px-3 py-2 text-xs bg-white border border-[#DED8CC] rounded-lg"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-mono text-[#6B6458] block mb-1">
                            Typeface
                          </label>
                          <select
                            value={cap.font}
                            onChange={(e) => {
                              playTactileClickSound();
                              setCaptions(
                                captions.map((c) =>
                                  c.id === cap.id
                                    ? { ...c, font: e.target.value as CustomCaption['font'] }
                                    : c
                                )
                              );
                            }}
                            className="w-full p-2 bg-white border border-[#DED8CC] rounded-lg text-xs"
                          >
                            <option value="garamond">Editorial Serif (Cormorant)</option>
                            <option value="courier">Darkroom Typewriter (Courier)</option>
                            <option value="handwriting">Grease Pencil Script (Caveat)</option>
                            <option value="sans">Architectural Sans (DM Sans)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-[#6B6458] block mb-1 tabular-nums">
                            Vertical Placement ({Math.round(cap.y * 100)}%)
                          </label>
                          <input
                            type="range"
                            min="0.08"
                            max="0.98"
                            step="0.01"
                            value={cap.y}
                            onChange={(e) => {
                              playRotaryDetentSound();
                              setCaptions(
                                captions.map((c) =>
                                  c.id === cap.id ? { ...c, y: parseFloat(e.target.value) } : c
                                )
                              );
                            }}
                            className="w-full accent-[#6B2D38] mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STICKERS */}
          {activeTab === 'stickers' && (
            <StickerStudioPanel
              stickers={stickers}
              selectedStickerId={selectedStickerId}
              onSelectSticker={setSelectedStickerId}
              onAddSticker={handleAddStickerFromAsset}
              onUpdateSticker={handleUpdateSticker}
              onDuplicateSticker={handleDuplicateSticker}
              onBringForward={handleBringStickerForward}
              onSendBackward={handleSendStickerBackward}
              onRemoveSticker={handleRemoveSticker}
              onClearStickers={handleClearStickers}
              canUndo={stickerHistory.index > 0}
              canRedo={stickerHistory.index < stickerHistory.stack.length - 1}
              onUndo={handleUndoSticker}
              onRedo={handleRedoSticker}
            />
          )}
        </div>
      </div>

      {/* Optical Enlarger & Super-Resolution Modal */}
      <ImageEnhancerModal
        isOpen={enhancerOpen}
        onClose={() => setEnhancerOpen(false)}
        photos={photos}
        onUpdatePhoto={onUpdatePhoto}
      />
    </div>
  );
};
