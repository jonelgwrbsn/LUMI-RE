import React, { useState, useEffect } from 'react';
import { AppStep, CapturedPhoto } from './types/photobooth';
import { TopBar } from './components/TopBar';
import { LandingPage } from './components/LandingPage';
import { CameraCapture } from './components/CameraCapture';
import { PhotoEditor } from './components/PhotoEditor';
import { ExportModal } from './components/ExportModal';
import { ShareModal } from './components/ShareModal';
import { PrintModal } from './components/PrintModal';
import { SharedPage } from './pages/SharedPage';
import { FilmAdvanceOverlay } from './components/FilmAdvanceOverlay';
import { playFilmAdvanceSound } from './utils/soundEffects';

import demoPhoto1 from './assets/images/demo_sample_photo_1_1793281744154.jpg';
import demoPhoto2 from './assets/images/demo_sample_photo_2_1793281744467.jpg';
import demoPhoto3 from './assets/images/demo_sample_photo_3_1793281744222.jpg';

const STUDIO_SAMPLE_PHOTOS: CapturedPhoto[] = [
  { id: 'sample_1', dataUrl: demoPhoto1, originalDataUrl: demoPhoto1, timestamp: Date.now() - 3000 },
  { id: 'sample_2', dataUrl: demoPhoto2, originalDataUrl: demoPhoto2, timestamp: Date.now() - 2000 },
  { id: 'sample_3', dataUrl: demoPhoto3, originalDataUrl: demoPhoto3, timestamp: Date.now() - 1000 },
  { id: 'sample_4', dataUrl: demoPhoto1, originalDataUrl: demoPhoto1, timestamp: Date.now() }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);

  // Film advance animation transition state
  const [isAdvancingFilm, setIsAdvancingFilm] = useState<boolean>(false);
  const [pendingStep, setPendingStep] = useState<AppStep | null>(null);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  const [activeDataUrl, setActiveDataUrl] = useState<string>('');
  const [activeCanvas, setActiveCanvas] = useState<HTMLCanvasElement | null>(null);

  // Check URL path on mount to support public share route /share/:id or ?autostart=1
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/share\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      setShareId(match[1]);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('step') === 'editor') {
      setCapturedPhotos(STUDIO_SAMPLE_PHOTOS);
      setCurrentStep('editor');
    }
  }, []);

  // Global Escape key handler to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (exportModalOpen) setExportModalOpen(false);
        if (shareModalOpen) setShareModalOpen(false);
        if (printModalOpen) setPrintModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exportModalOpen, shareModalOpen, printModalOpen]);

  const navigateWithFilmAdvance = (targetStep: AppStep) => {
    if (targetStep === 'editor' && capturedPhotos.length === 0) {
      setCapturedPhotos(STUDIO_SAMPLE_PHOTOS);
    }
    if (targetStep === 'editor' && currentStep !== 'editor') {
      playFilmAdvanceSound();
      setPendingStep('editor');
      setIsAdvancingFilm(true);
    } else {
      setCurrentStep(targetStep);
    }
  };

  const handleFilmAdvanceComplete = () => {
    if (pendingStep) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }

    setIsAdvancingFilm(false);
  };

  const handleResetSession = () => {
    setCapturedPhotos([]);
    setCurrentStep('landing');
  };

  const handleOpenExportModal = (dataUrl: string, canvas: HTMLCanvasElement) => {
    setActiveDataUrl(dataUrl);
    setActiveCanvas(canvas);
    setExportModalOpen(true);
  };

  const handleOpenShareModal = (dataUrl: string) => {
    setActiveDataUrl(dataUrl);
    setShareModalOpen(true);
  };

  const handleOpenPrintModal = (dataUrl: string) => {
    setActiveDataUrl(dataUrl);
    setPrintModalOpen(true);
  };

  const handleUpdatePhoto = (photoId: string, updatedPhoto: Partial<CapturedPhoto>) => {
    setCapturedPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...updatedPhoto } : p))
    );
  };

  // If URL points directly to /share/:id
  if (shareId) {
    return (
      <div className="min-h-screen bg-[#F6F3EC] text-[#1C1917] flex flex-col justify-between">
        <TopBar
          currentStep="landing"
          onNavigate={() => {
            window.history.pushState({}, '', '/');
            setShareId(null);
            setCurrentStep('landing');
          }}
          onResetSession={handleResetSession}
        />
        <main className="flex-1">
          <SharedPage
            shareId={shareId}
            onStartNewSession={() => {
              window.history.pushState({}, '', '/');
              setShareId(null);
              setCurrentStep('camera');
            }}
          />
        </main>
        <footer className="py-6 border-t border-[#E2DDD3] text-center text-xs font-mono text-[#8C8275]">
          LUMIÈRE 35MM PHOTOBOOTH STUDIO &middot; PARALLEL PIXEL RENDERER
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#1C1917] flex flex-col justify-between selection:bg-[#6B2D38] selection:text-white">
      {/* Film Advance Visual & Sound Transition Overlay */}
      <FilmAdvanceOverlay
        isActive={isAdvancingFilm}
        onComplete={handleFilmAdvanceComplete}
        photos={capturedPhotos}
      />

      <TopBar
        currentStep={currentStep}
        onNavigate={(step) => navigateWithFilmAdvance(step)}
        onResetSession={handleResetSession}
      />

      <main className="flex-1">
        {currentStep === 'landing' && (
          <LandingPage
            onStartBooth={() => setCurrentStep('camera')}
            onNavigate={(step) => navigateWithFilmAdvance(step)}
          />
        )}

        {currentStep === 'camera' && (
          <CameraCapture
            onPhotosCaptured={(photos) => setCapturedPhotos(photos)}
            existingPhotos={capturedPhotos}
            onNextStep={() => navigateWithFilmAdvance('editor')}
          />
        )}

        {currentStep === 'editor' && (
          <PhotoEditor
            photos={capturedPhotos}
            onOpenExportModal={handleOpenExportModal}
            onOpenShareModal={handleOpenShareModal}
            onOpenPrintModal={handleOpenPrintModal}
            onBackToCamera={() => setCurrentStep('camera')}
            onClearPhotos={() => setCapturedPhotos([])}
            onUpdatePhoto={handleUpdatePhoto}
          />
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        renderedDataUrl={activeDataUrl}
        canvas={activeCanvas}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        renderedDataUrl={activeDataUrl}
      />

      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        renderedDataUrl={activeDataUrl}
      />

      <footer className="py-6 border-t border-[#E2DDD3] text-center text-xs font-mono text-[#8C8275] bg-[#F6F3EC]">
        LUMIÈRE 35MM PHOTOBOOTH STUDIO &middot; PRIVACY FIRST &middot; IN-BROWSER ANALOG RENDERING
      </footer>
    </div>
  );
}

