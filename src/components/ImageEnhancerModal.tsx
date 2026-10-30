import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Check,
  RotateCcw,
  Sliders,
  AlertCircle,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Printer,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { CapturedPhoto } from '../types/photobooth';
import {
  calculateDimensionInfo,
  performStandardUpscale,
  ensureBase64DataUrl,
  ImageDimensionInfo
} from '../utils/imageUpscaler';

interface ImageEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: CapturedPhoto[];
  onUpdatePhoto: (photoId: string, updatedPhoto: Partial<CapturedPhoto>) => void;
}

export const ImageEnhancerModal: React.FC<ImageEnhancerModalProps> = ({
  isOpen,
  onClose,
  photos,
  onUpdatePhoto
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [mode, setMode] = useState<'original' | 'standard' | 'ai-enhance'>('ai-enhance');
  const [scaleFactor, setScaleFactor] = useState<2 | 4>(2);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoNotice, setInfoNotice] = useState<string>('');

  // Preview & Comparison slider state
  const [previewEnhancedUrl, setPreviewEnhancedUrl] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Dimension readouts
  const [origDimensions, setOrigDimensions] = useState<ImageDimensionInfo>({
    width: 1280,
    height: 960,
    megaPixels: '1.23',
    dpi4x6: 240,
    printSuitability: 'Good (150-299 DPI)'
  });

  const [outDimensions, setOutDimensions] = useState<ImageDimensionInfo>({
    width: 2560,
    height: 1920,
    megaPixels: '4.92',
    dpi4x6: 480,
    printSuitability: 'Excellent (300+ DPI)'
  });

  const currentPhoto = photos[selectedPhotoIndex] || photos[0];
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read natural image dimensions on selection
  useEffect(() => {
    if (!currentPhoto) return;
    const img = new Image();
    img.onload = () => {
      const orig = calculateDimensionInfo(img.width, img.height);
      const out = calculateDimensionInfo(img.width * scaleFactor, img.height * scaleFactor);
      setOrigDimensions(orig);
      setOutDimensions(out);
    };
    img.src = currentPhoto.originalDataUrl || currentPhoto.dataUrl;

    // Reset enhanced preview to current photo's enhanced version if already present
    if (currentPhoto.enhancedDataUrl) {
      setPreviewEnhancedUrl(currentPhoto.enhancedDataUrl);
    } else {
      setPreviewEnhancedUrl('');
    }
  }, [selectedPhotoIndex, currentPhoto, scaleFactor]);

  // Handle Before/After Slider Dragging
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Run Image Enhancement Pipeline
  const runEnhancement = async () => {
    if (!currentPhoto) return;
    setIsProcessing(true);
    setErrorMessage('');
    setInfoNotice('');
    setProgressPercent(15);
    setProgressStage('Analyzing photo edge geometry & color balance...');

    const rawSourceUrl = currentPhoto.originalDataUrl || currentPhoto.dataUrl;
    const sourceDataUrl = await ensureBase64DataUrl(rawSourceUrl);

    try {
      if (mode === 'original') {
        setPreviewEnhancedUrl(sourceDataUrl);
        setIsProcessing(false);
        return;
      }

      if (mode === 'standard') {
        setProgressPercent(50);
        setProgressStage('Applying high-precision Lanczos resampling & unsharp mask...');
        const resultUrl = await performStandardUpscale(sourceDataUrl, scaleFactor);
        setProgressPercent(100);
        setPreviewEnhancedUrl(resultUrl);
        setIsProcessing(false);
        return;
      }

      // AI ENHANCE MODE via Express Backend
      setProgressPercent(35);
      setProgressStage('Analyzing tonal range & optical sharpness via Gemini...');

      const progressTimer = setInterval(() => {
        setProgressPercent((prev) => Math.min(85, prev + 10));
      }, 400);

      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: sourceDataUrl,
          mode: 'ai-enhance',
          scaleFactor
        })
      });

      clearInterval(progressTimer);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI enhancement processing failed');
      }

      let finalUrl = data.enhancedDataUrl;

      // Apply high-definition pixel super-resolution using AI-calibrated optical parameters
      if (
        data.mode === 'ai-optical' ||
        data.mode === 'standard-fallback' ||
        finalUrl === sourceDataUrl
      ) {
        setProgressStage('Rendering AI-calibrated optical super-resolution...');
        finalUrl = await performStandardUpscale(
          sourceDataUrl,
          scaleFactor,
          data.enhancementParams
        );
      }

      if (data.notice) {
        setInfoNotice(data.notice);
      }

      setProgressPercent(100);
      setProgressStage('Enhancement complete!');
      setPreviewEnhancedUrl(finalUrl);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(
        errObj.message ||
          'AI processing encountered an error. Falling back to high-quality standard upscaling.'
      );
      const fallbackUrl = await performStandardUpscale(sourceDataUrl, scaleFactor);
      setPreviewEnhancedUrl(fallbackUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Enhanced Image to Photo Strip
  const handleApplyToStrip = () => {
    if (!currentPhoto || !previewEnhancedUrl) return;

    const origUrl = currentPhoto.originalDataUrl || currentPhoto.dataUrl;

    onUpdatePhoto(currentPhoto.id, {
      dataUrl: previewEnhancedUrl,
      originalDataUrl: origUrl,
      enhancedDataUrl: previewEnhancedUrl,
      isEnhanced: mode !== 'original',
      enhancementMode: mode,
      scaleFactor
    });

    onClose();
  };

  // Restore Original Photo
  const handleRestoreOriginal = () => {
    if (!currentPhoto) return;
    const origUrl = currentPhoto.originalDataUrl || currentPhoto.dataUrl;

    onUpdatePhoto(currentPhoto.id, {
      dataUrl: origUrl,
      isEnhanced: false,
      enhancementMode: 'original'
    });

    setPreviewEnhancedUrl(origUrl);
    setMode('original');
  };

  if (!isOpen) return null;

  const originalSourceUrl = currentPhoto?.originalDataUrl || currentPhoto?.dataUrl;
  const activeEnhancedUrl = previewEnhancedUrl || originalSourceUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F6F3EC] border border-[#E2DDD3] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1C1917] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">AI Image Enhancement & Super-Resolution</h3>
              <p className="text-xs text-[#6B6458]">Restore fine details, reduce noise, and upscale resolution for printing.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-[#8C8275] hover:text-[#1C1917] rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Frame Selection Bar (if multiple photos) */}
        {photos.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-serif font-bold text-[#1C1917] block">Select Shot Frame to Enhance</label>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`flex items-center gap-2 p-1.5 px-3 rounded-lg border text-xs transition-all ${
                    selectedPhotoIndex === idx
                      ? 'bg-white border-[#6B2D38] shadow-xs font-bold text-[#1C1917]'
                      : 'bg-[#EFECE3] border-[#E0D8C8] text-[#6B6458] hover:text-[#1C1917]'
                  }`}
                >
                  <div className="w-8 h-6 bg-stone-200 rounded overflow-hidden shrink-0 border border-stone-300">
                    <img src={p.dataUrl} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <span>Frame #{idx + 1}</span>
                  {p.isEnhanced && <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full font-mono">AI 2X</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Controls vs Interactive Before/After Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-[#EFECE3] p-5 rounded-xl border border-[#E0D8C8] space-y-5">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-serif font-bold text-[#1C1917] block">Processing Mode</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'ai-enhance',
                    title: 'AI Super-Resolution',
                    desc: 'Neural model detail restoration, noise reduction, and clarity enhancement.'
                  },
                  {
                    id: 'standard',
                    title: 'Standard High-Res Upscale',
                    desc: 'High-precision bicubic resampling with unsharp mask sharpening.'
                  },
                  {
                    id: 'original',
                    title: 'Original Source',
                    desc: 'Keep original unenhanced capture unchanged.'
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as typeof mode)}
                    className={`w-full p-3 rounded-lg text-left border transition-all space-y-0.5 ${
                      mode === item.id
                        ? 'bg-white border-[#6B2D38] shadow-xs ring-1 ring-[#6B2D38]'
                        : 'bg-[#F6F3EC] border-[#E0D8C8] hover:border-[#C9C2B4]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917] font-serif">{item.title}</span>
                      {mode === item.id && <span className="w-2 h-2 rounded-full bg-[#6B2D38]" />}
                    </div>
                    <p className="text-[11px] text-[#6B6458] leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Enlargement Scale Factor */}
            {mode !== 'original' && (
              <div className="space-y-2">
                <label className="text-xs font-serif font-bold text-[#1C1917] block">Enlargement Scale</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScaleFactor(2)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border text-center transition-colors ${
                      scaleFactor === 2
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-white text-[#575249] border-[#E0D8C8]'
                    }`}
                  >
                    2× Scale (Recommended)
                  </button>
                  <button
                    onClick={() => setScaleFactor(4)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border text-center transition-colors ${
                      scaleFactor === 4
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-white text-[#575249] border-[#E0D8C8]'
                    }`}
                  >
                    4× Scale (Max Print)
                  </button>
                </div>
              </div>
            )}

            {/* Resolution & Print Quality Readout Card */}
            <div className="bg-white p-3.5 rounded-lg border border-[#E0D8C8] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#E0D8C8] pb-2 font-mono text-[11px]">
                <span className="text-[#6B6458]">Original:</span>
                <span className="font-bold text-[#1C1917]">{origDimensions.width} × {origDimensions.height} px ({origDimensions.megaPixels} MP)</span>
              </div>

              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#6B6458]">Enhanced Output:</span>
                <span className="font-bold text-[#6B2D38]">{outDimensions.width} × {outDimensions.height} px ({outDimensions.megaPixels} MP)</span>
              </div>

              <div className="pt-2 border-t border-[#E0D8C8] flex items-center justify-between">
                <span className="text-[11px] text-[#6B6458] flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" />
                  <span>4×6" Print Suitability:</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {outDimensions.printSuitability}
                </span>
              </div>
            </div>

            {/* Run Enhancement Trigger Button */}
            <button
              onClick={runEnhancement}
              disabled={isProcessing}
              className="w-full py-3 text-xs font-bold font-mono uppercase tracking-wider text-white bg-[#1C1917] hover:bg-[#6B2D38] disabled:bg-[#C9C3B6] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing Enhancement...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Process Image Enhancement</span>
                </>
              )}
            </button>

            {/* Privacy Disclosure Note */}
            <div className="flex items-start gap-2 text-[11px] text-[#6B6458] bg-[#F6F3EC] p-3 rounded-lg border border-[#E0D8C8]">
              <ShieldCheck className="w-4 h-4 text-[#6B2D38] shrink-0 mt-0.5" />
              <p className="leading-tight">
                AI enhancement processes images on our secure server pipeline. Your original photograph remains 100% preserved and fully reversible.
              </p>
            </div>
          </div>

          {/* Interactive Before/After Comparison Preview Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#8C8275]">
              <span>BEFORE / AFTER COMPARISON SLIDER</span>
              <span>Drag slider to inspect details</span>
            </div>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="bg-white p-3 rounded-lg border border-[#E0D8C8] space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1C1917] font-bold">{progressStage}</span>
                  <span className="text-[#6B2D38] font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6B2D38] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message banner if any */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Optical Diagnostic / Quota Notice banner if any */}
            {infoNotice && !errorMessage && (
              <div className="p-3 bg-[#EFECE3] text-[#1C1917] text-xs rounded-lg border border-[#D8D0C5] flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-[#6B2D38] shrink-0" />
                <span>{infoNotice}</span>
              </div>
            )}

            {/* Interactive Split Comparison Viewport */}
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              className="relative w-full aspect-[4/3] bg-stone-900 rounded-xl overflow-hidden shadow-xl border-4 border-stone-800 select-none cursor-ew-resize"
            >
              {/* Right Layer: Enhanced Image (Background) */}
              <img
                src={activeEnhancedUrl}
                alt="Enhanced Photo Output"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Left Layer: Original Image (Clipped by Slider Position) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={originalSourceUrl}
                  alt="Original Photo Source"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
                />
              </div>

              {/* Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-30 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className="w-7 h-7 rounded-full bg-white text-black shadow-lg border border-stone-300 flex items-center justify-center text-xs font-bold">
                  ↔
                </div>
              </div>

              {/* Text Badges */}
              <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-mono tracking-widest px-2.5 py-1 rounded backdrop-blur-xs uppercase z-20">
                Original
              </div>

              <div className="absolute top-3 right-3 bg-[#6B2D38]/90 text-white text-[10px] font-mono tracking-widest px-2.5 py-1 rounded backdrop-blur-xs uppercase z-20">
                Enhanced ({mode === 'ai-enhance' ? 'AI' : 'Standard'} {scaleFactor}×)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2DDD3]">
          {currentPhoto?.isEnhanced && (
            <button
              onClick={handleRestoreOriginal}
              className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Original Unenhanced Photo</span>
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#575249] hover:text-[#1C1917]"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyToStrip}
              disabled={!previewEnhancedUrl || isProcessing}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] disabled:bg-[#C9C3B6] rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Apply Enhanced Photo to Strip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
