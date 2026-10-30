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
  getLayoutPreset
} from '../utils/layoutAndPaper';
import {
  playTactileClickSound,
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
  Sparkles,
  Layout,
  Type,
  Sticker,
  Download,
  Share2,
  Printer,
  Plus,
  Trash2,
  RefreshCw,
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
  CheckSquare
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

const PRESET_LABELS: Record<FilterPreset, { name: string; desc: string; category?: string }> = {
  'warm-film': { name: 'Warm Film (Kodak 400)', desc: 'Rich golden highlights, warm shadows, medium grain', category: 'Classic' },
  'soft-matte': { name: 'Soft Matte (Portra)', desc: 'Creamy soft contrast, desaturated pastel tones', category: 'Portrait' },
  'vintage-fade': { name: 'Vintage Fade (70s)', desc: 'Lifted black level, sepia glow, nostalgic feel', category: 'Vintage' },
  'classic-mono': { name: 'Classic Mono (Tri-X)', desc: 'Deep black & white contrast, crisp white tones', category: 'Monochrome' },
  'cool-film': { name: 'Cool Film (Fuji)', desc: 'Cool cyan highlights, emerald green darks', category: 'Classic' },
  disposable: { name: 'Disposable Cam', desc: 'Punchy flash brightness, saturated primary colors', category: 'Flash' },
  original: { name: 'Original Raw', desc: 'Unprocessed natural image capture', category: 'Raw' },

  // --- 12 New Expanded Film Presets ---
  'y2k-flash': { name: 'Y2K Flash', desc: 'Bright direct flash, specular highlight pop, cool blue tint', category: 'Flash' },
  'light-leak': { name: 'Light Leak', desc: 'Warm edge flare, golden leakage, analog seal imperfection', category: 'Effects' },
  'expired-film': { name: 'Expired Film', desc: 'Shifted magenta color cast, heavy grain, faded emulsion', category: 'Vintage' },
  'cinestill-glow': { name: 'CineStill Glow', desc: 'Tungsten balance with iconic red highlight halation', category: 'Cinematic' },
  'noir-400': { name: 'Noir 400', desc: 'High-contrast dramatic silver halide black & white', category: 'Monochrome' },
  'dream-bloom': { name: 'Dream Bloom', desc: 'Ethereal highlight diffusion glow and soft warmth', category: 'Portrait' },
  'party-disposable': { name: 'Party Disposable', desc: 'Saturated flash party look with orange LED date stamp', category: 'Flash' },
  'cinema-800t': { name: 'Cinema 800T', desc: 'Cool shadows, warm neon highlights, red halation', category: 'Cinematic' },
  '90s-snapshot': { name: '90s Snapshot', desc: 'Warm nostalgic 90s color shift with yellow date stamp', category: 'Vintage' },
  'pastel-romance': { name: 'Pastel Romance', desc: 'Soft pastel greens, pinkish highlights, romantic bloom', category: 'Portrait' },
  'classic-booth': { name: 'Classic Booth', desc: 'Analog darkroom photostrip tone with sepia undertone', category: 'Classic' },
  'vhs-memory': { name: 'VHS Memory', desc: 'Scanlines, chromatic aberration fringing, green play date', category: 'Effects' }
};

const PAPER_COLORS = [
  { name: 'Classic White', hex: '#FFFFFF', text: '#1C1917' },
  { name: 'Vintage Cream', hex: '#F7F3E9', text: '#292524' },
  { name: 'Pitch Black', hex: '#18181B', text: '#F4F4F5' },
  { name: 'Crimson Velvet', hex: '#4A1521', text: '#FCE7F3' },
  { name: 'Kraft Brown', hex: '#E0D8C3', text: '#27272A' }
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
  const [adjustments, setAdjustments] = useState<FilterAdjustments>({
    ...DEFAULT_ADJUSTMENTS['warm-film']
  });
  const [filmEffects, setFilmEffects] = useState<FilmEffectsState>({
    ...DEFAULT_ADJUSTMENTS['warm-film'].defaultEffects
  });

  // Batch Apply vs Individual Frame Mode
  const [batchApply, setBatchApply] = useState<boolean>(true);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

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
  }, [renderedDataUrl]);

  // Helper to commit sticker changes to Undo/Redo stack
  const commitStickers = (nextStickers: CustomSticker[]) => {
    setStickers(nextStickers);
    setStickerHistory((prev) => pushStickerHistory(prev, nextStickers));
  };

  const handleUndoSticker = () => {
    if (stickerHistory.index <= 0) return;
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
    const { stickers: next, duplicated } = duplicateSticker(stickers, id);
    if (duplicated) {
      commitStickers(next);
      setSelectedStickerId(duplicated.id);
    }
  };

  const handleBringStickerForward = (id: string) => {
    const next = bringStickerForward(stickers, id);
    commitStickers(next);
  };

  const handleSendStickerBackward = (id: string) => {
    const next = sendStickerBackward(stickers, id);
    commitStickers(next);
  };

  const handleRemoveSticker = (id: string) => {
    const next = stickers.filter((s) => s.id !== id);
    commitStickers(next);
    if (selectedStickerId === id) {
      setSelectedStickerId(next[next.length - 1]?.id || null);
    }
  };

  const handleClearStickers = () => {
    commitStickers([]);
    setSelectedStickerId(null);
  };

  const handleUpdateCaption = (id: string, partial: Partial<CustomCaption>) => {
    setCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  };

  const handleRemoveCaption = (id: string) => {
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
      // Immediately apply current selected preset and effects to all captured photos simultaneously
      syncFilterToPhotoFrames(preset, adjustments, filmEffects, true);
    } else {
      // Load the currently selected frame's override if it exists
      const targetPhoto = photos[selectedFrameIndex];
      if (targetPhoto?.frameOverride) {
        setPreset(targetPhoto.frameOverride.preset);
        setAdjustments({ ...targetPhoto.frameOverride.adjustments });
        setFilmEffects({ ...targetPhoto.frameOverride.filmEffects });
      } else {
        // Initialize all photos with current settings so switching frames is non-destructive
        syncFilterToPhotoFrames(preset, adjustments, filmEffects, true);
      }
    }
  };

  const handleSelectFrameIndex = (idx: number) => {
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

      if (e.key === '1') setActiveTab('preset');
      if (e.key === '2') setActiveTab('effects');
      if (e.key === '3') setActiveTab('layout');
      if (e.key === '4') setActiveTab('adjust');
      if (e.key === '5') setActiveTab('text');
      if (e.key === '6') setActiveTab('stickers');

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
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

  // Handle Preset Change
  const handlePresetSelect = (p: FilterPreset) => {
    playTactileClickSound();
    setPreset(p);
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
    const base = DEFAULT_ADJUSTMENTS[preset] || DEFAULT_ADJUSTMENTS.original;
    const nextEff = { ...base.defaultEffects };
    setFilmEffects(nextEff);
    syncFilterToPhotoFrames(preset, adjustments, nextEff);
  };

  const handleDisableAllEffects = () => {
    const nextEff = { ...DEFAULT_FILM_EFFECTS };
    setFilmEffects(nextEff);
    syncFilterToPhotoFrames(preset, adjustments, nextEff);
  };

  // Add caption line
  const addCaption = () => {
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1C1917]">Photo Strip Personalization</h2>
          <p className="text-xs text-[#6B6458]">
            Customize film presets, analog effects, paper stock, captions, stickers, and dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="AI Super-Resolution & Detail Restoration">
            <button
              onClick={() => setEnhancerOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6B2D38] hover:bg-[#802834] rounded-md transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Enhance</span>
            </button>
          </Tooltip>

          {photos.length > 0 && (
            <button
              onClick={() => {
                onClearPhotos();
                onBackToCamera();
              }}
              title="Clear all photos and reset selection"
              className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={onBackToCamera}
            className="px-3 py-1.5 text-xs font-medium text-[#575249] bg-[#EFECE3] hover:bg-[#E2DDD3] rounded-md transition-colors whitespace-nowrap"
          >
            &larr; Retake
          </button>

          <button
            onClick={() => {
              playPrintEjectSound();
              onOpenPrintModal(renderedDataUrl);
            }}
            disabled={!renderedDataUrl || isRendering}
            className="px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#EAE5DA] hover:bg-[#E0D8C8] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Layout</span>
          </button>

          <button
            onClick={() => {
              playPrintEjectSound();
              onOpenShareModal(renderedDataUrl);
            }}
            disabled={!renderedDataUrl || isRendering}
            className="px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#EAE5DA] hover:bg-[#E0D8C8] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share QR</span>
          </button>

          <button
            onClick={handleExport}
            disabled={!renderedDataUrl || isRendering}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Tabs & Sliders */}
        <div className="lg:col-span-7 bg-[#EFECE3] p-6 rounded-2xl border border-[#E0D8C8] space-y-6">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 p-1 bg-[#E2DDD3] rounded-lg text-xs font-medium overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('preset');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'preset' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>

            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('effects');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'effects' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Film Effects</span>
            </button>

            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('layout');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'layout' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Layout & Paper</span>
            </button>

            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('adjust');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'adjust' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tonal Sliders</span>
            </button>

            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('text');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'text' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Captions</span>
            </button>

            <button
              onClick={() => {
                playTactileClickSound();
                setActiveTab('stickers');
              }}
              className={`px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'stickers' ? 'bg-white text-[#1C1917] font-semibold shadow-xs' : 'text-[#6B6458] hover:text-[#1C1917]'
              }`}
            >
              <Sticker className="w-3.5 h-3.5" />
              <span>Stickers</span>
            </button>
          </div>

          {/* BATCH APPLY TOGGLE BAR (Shown for Presets, Film Effects, and Tonal Sliders) */}
          {(activeTab === 'preset' || activeTab === 'effects' || activeTab === 'adjust') && (
            <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#6B2D38]" />
                  <div>
                    <span className="text-xs font-serif font-bold text-[#1C1917] block">
                      Batch Apply to All Captured Photos
                    </span>
                    <span className="text-[11px] text-[#6B6458] block">
                      {batchApply
                        ? 'Selected presets, film effects, and tonal adjustments apply to all frames simultaneously.'
                        : `Customizing Frame #${selectedFrameIndex + 1} independently.`}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-[#F6F3EC] px-3 py-1.5 rounded-md border border-[#E0D8C8]">
                  <input
                    type="checkbox"
                    checked={batchApply}
                    onChange={(e) => handleToggleBatchApply(e.target.checked)}
                    aria-label="Batch Apply"
                    className="w-4 h-4 accent-[#6B2D38]"
                  />
                  <span className="text-xs font-mono font-semibold text-[#1C1917]">
                    Batch Apply
                  </span>
                </label>
              </div>

              {!batchApply && (
                <div className="pt-2 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#8C8275] mr-1">
                      Target Frame:
                    </span>
                    {Array.from({ length: Math.max(photos.length, getLayoutPreset(layout).frameCount) }).map((_, idx) => {
                      const framePreset = photos[idx]?.frameOverride?.preset || preset;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectFrameIndex(idx)}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                            selectedFrameIndex === idx
                              ? 'bg-[#6B2D38] text-white font-semibold'
                              : 'bg-[#F6F3EC] text-[#575249] border border-[#E0D8C8] hover:border-[#1C1917]'
                          }`}
                        >
                          Frame {idx + 1} ({PRESET_LABELS[framePreset]?.name.split(' ')[0] || framePreset})
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => syncFilterToPhotoFrames(preset, adjustments, filmEffects, true)}
                    className="px-2.5 py-1 text-[11px] font-mono font-semibold text-[#6B2D38] bg-[#F6F3EC] hover:bg-[#EAE5DA] border border-[#6B2D38]/30 rounded transition-colors"
                  >
                    Sync Current to All Frames
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#1C1917]">35mm Analog Film Presets</h3>
                <span className="text-xs font-mono text-[#8C8275]">19 Presets</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {(Object.keys(PRESET_LABELS) as FilterPreset[]).map((key) => {
                  const info = PRESET_LABELS[key];
                  const isSelected = preset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={`p-3.5 rounded-xl text-left border transition-all space-y-1 ${
                        isSelected
                          ? 'bg-white border-[#6B2D38] shadow-sm ring-1 ring-[#6B2D38]'
                          : 'bg-[#F6F3EC] border-[#E2DDD3] hover:border-[#C9C2B4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-serif text-[#1C1917]">{info.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#6B2D38]" />}
                      </div>
                      <p className="text-[11px] text-[#6B6458] leading-tight">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FILM EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1C1917]">Analog Film Effects Engine</h3>
                  <p className="text-[11px] text-[#6B6458]">Toggle and tune real pixel-rendered film optical artifacts.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetEffectsToPresetDefaults}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium text-[#1C1917] bg-[#E2DDD3] hover:bg-[#D6D0C2] rounded transition-colors flex items-center gap-1"
                    title="Reset effects to default values for current preset"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Preset Defaults</span>
                  </button>
                  <button
                    onClick={handleDisableAllEffects}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 rounded transition-colors"
                  >
                    Off All
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Film Grain */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Aperture className="w-4 h-4 text-[#6B2D38]" />
                      <span className="text-xs font-bold text-[#1C1917]">Film Grain</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.grain.enabled}
                        onChange={(e) => handleEffectToggle('grain', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.grain.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.grain.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.grain.intensity}
                      onChange={(e) => handleEffectIntensity('grain', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 2. Halation */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
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
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.halation.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.halation.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.halation.intensity}
                      onChange={(e) => handleEffectIntensity('halation', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 3. Light Leak */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-[#1C1917]">Light Leak Flare</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.lightLeak.enabled}
                        onChange={(e) => handleEffectToggle('lightLeak', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.lightLeak.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.lightLeak.enabled && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filmEffects.lightLeak.intensity}
                        onChange={(e) => handleEffectIntensity('lightLeak', parseInt(e.target.value))}
                        className="w-full accent-[#6B2D38]"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-[#8C8275]">Flare Position:</span>
                        <select
                          value={filmEffects.lightLeak.position || 'top-right'}
                          onChange={(e) =>
                            setFilmEffects((prev) => {
                              const next: FilmEffectsState = {
                                ...prev,
                                lightLeak: { ...prev.lightLeak, position: e.target.value as any }
                              };
                              syncFilterToPhotoFrames(preset, adjustments, next);
                              return next;
                            })
                          }
                          className="px-2 py-1 text-xs bg-[#F9F7F2] border border-[#E0D8C8] rounded font-mono"
                        >
                          <option value="top-right">Top-Right Corner</option>
                          <option value="top-left">Top-Left Corner</option>
                          <option value="bottom-right">Bottom-Right Corner</option>
                          <option value="left-edge">Left Side Leak</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Bloom */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-bold text-[#1C1917]">Highlight Bloom</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.bloom.enabled}
                        onChange={(e) => handleEffectToggle('bloom', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.bloom.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.bloom.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.bloom.intensity}
                      onChange={(e) => handleEffectIntensity('bloom', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 5. Vignette */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-stone-700" />
                      <span className="text-xs font-bold text-[#1C1917]">Vignette Lens Falloff</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.vignette.enabled}
                        onChange={(e) => handleEffectToggle('vignette', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.vignette.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.vignette.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.vignette.intensity}
                      onChange={(e) => handleEffectIntensity('vignette', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 6. Dust & Scratches */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-[#1C1917]">Dust & Hairline Scratches</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.dustScratches.enabled}
                        onChange={(e) => handleEffectToggle('dustScratches', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.dustScratches.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.dustScratches.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.dustScratches.intensity}
                      onChange={(e) => handleEffectIntensity('dustScratches', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 7. Chromatic Aberration */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-[#1C1917]">Chromatic Aberration</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.chromaticAberration.enabled}
                        onChange={(e) => handleEffectToggle('chromaticAberration', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.chromaticAberration.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.chromaticAberration.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.chromaticAberration.intensity}
                      onChange={(e) => handleEffectIntensity('chromaticAberration', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 8. VHS Scanlines */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-[#1C1917]">VHS Scanlines</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.vhsScanlines.enabled}
                        onChange={(e) => handleEffectToggle('vhsScanlines', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                      <span className="text-xs font-mono text-[#8C8275]">{filmEffects.vhsScanlines.intensity}%</span>
                    </label>
                  </div>
                  {filmEffects.vhsScanlines.enabled && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filmEffects.vhsScanlines.intensity}
                      onChange={(e) => handleEffectIntensity('vhsScanlines', parseInt(e.target.value))}
                      className="w-full accent-[#6B2D38]"
                    />
                  )}
                </div>

                {/* 9. Date Stamp */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-[#1C1917]">Frame Date Stamp</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filmEffects.dateStamp.enabled}
                        onChange={(e) => handleEffectToggle('dateStamp', e.target.checked)}
                        className="w-4 h-4 accent-[#6B2D38]"
                      />
                    </label>
                  </div>
                  {filmEffects.dateStamp.enabled && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-[#8C8275] block">Stamp Text</label>
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
                          className="w-full px-2 py-1 text-xs font-mono bg-[#F9F7F2] border border-[#E0D8C8] rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8C8275] block">LED Color</label>
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
                          className="w-full h-7 bg-transparent cursor-pointer rounded border border-[#E0D8C8]"
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

          {/* TAB 4: ADJUSTMENTS SLIDERS */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-[#1C1917]">Fine Pixel Color Controls</h3>

              {[
                { key: 'intensity', label: 'Preset Intensity', min: 0, max: 100 },
                { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
                { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                { key: 'warmth', label: 'Warmth / Temperature', min: -50, max: 50 },
                { key: 'tint', label: 'Tint (Green / Magenta)', min: -50, max: 50 }
              ].map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#1C1917]">
                    <span>{item.label}</span>
                    <span className="font-mono text-[#8C8275]">{(adjustments[item.key as 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'tint' | 'intensity'] as number) || 0}</span>
                  </div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={(adjustments[item.key as 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'tint' | 'intensity'] as number) || 0}
                    onChange={(e) => {
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
              ))}
            </div>
          )}

          {/* TAB 5: CAPTIONS */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-[#1C1917]">Custom Captions & Typography</h3>
                <button
                  onClick={addCaption}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1C1917] rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              {captions.map((cap, idx) => (
                <div key={cap.id} className="bg-white p-3.5 rounded-xl border border-[#E0D8C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#1C1917]">Caption #{idx + 1}</span>
                    <button
                      onClick={() => setCaptions(captions.filter((c) => c.id !== cap.id))}
                      className="text-stone-400 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                    placeholder="Enter custom message..."
                    className="w-full px-3 py-1.5 text-xs bg-[#F9F7F2] border border-[#E0D8C8] rounded-md"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-[#8C8275] block">Font Style</label>
                      <select
                        value={cap.font}
                        onChange={(e) =>
                          setCaptions(
                            captions.map((c) =>
                              c.id === cap.id ? { ...c, font: e.target.value as CustomCaption['font'] } : c
                            )
                          )
                        }
                        className="w-full p-1.5 bg-[#F9F7F2] border border-[#E0D8C8] rounded text-xs"
                      >
                        <option value="garamond">Serif (Cormorant)</option>
                        <option value="courier">Monospace (Courier)</option>
                        <option value="handwriting">Handwriting (Caveat)</option>
                        <option value="sans">Clean Sans</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8C8275] block">Vertical Position ({Math.round(cap.y * 100)}%)</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.98"
                        step="0.01"
                        value={cap.y}
                        onChange={(e) =>
                          setCaptions(
                            captions.map((c) => (c.id === cap.id ? { ...c, y: parseFloat(e.target.value) } : c))
                          )
                        }
                        className="w-full accent-[#1C1917]"
                      />
                    </div>
                  </div>
                </div>
              ))}
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

        {/* Right Preview Viewport */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 sticky top-24">
          <div className="text-xs font-mono text-[#8C8275] uppercase tracking-widest flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            <span>Live Composition Renderer</span>
          </div>

          <div
            className="relative bg-stone-900 p-4 rounded-xl shadow-2xl border-4 border-stone-800 flex items-center justify-center min-h-[480px] max-w-full overflow-hidden"
          >
            {isRendering && (
              <div className="absolute inset-0 bg-black/50 z-30 flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-mono text-stone-200">Rendering Master...</span>
              </div>
            )}

            {renderedDataUrl ? (
              <div
                ref={previewContainerRef}
                className="relative inline-block select-none"
              >
                <img
                  src={renderedDataUrl}
                  alt="Rendered Photo Strip"
                  draggable={false}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setPreviewSize({ width: el.clientWidth, height: el.clientHeight });
                  }}
                  className="max-h-[600px] w-auto object-contain rounded-sm shadow-md select-none pointer-events-none"
                />

                {/* Touch & Mouse Gesture Overlay for Stickers and Captions */}
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
              </div>
            ) : (
              <div className="text-stone-500 text-xs font-mono">Preparing preview...</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Image Enhancer Modal */}
      <ImageEnhancerModal
        isOpen={enhancerOpen}
        onClose={() => setEnhancerOpen(false)}
        photos={photos}
        onUpdatePhoto={onUpdatePhoto}
      />
    </div>
  );
};
