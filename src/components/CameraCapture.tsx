import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  SwitchCamera,
  Play,
  Upload,
  AlertCircle,
  Trash2,
  ArrowRight,
  Volume2,
  VolumeX,
  Grid,
  Crosshair,
  Smartphone,
  ShieldCheck,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { CapturedPhoto } from '../types/photobooth';
import { Tooltip } from './Tooltip';
import {
  COMPOSITION_GUIDE_MODES,
  CompositionGuideMode,
  cycleCompositionGuideMode,
  getCompositionGuideGeometry
} from '../utils/compositionGuide';
import {
  CameraSourceMode,
  STUDIO_POSES,
  getNextStudioPoseIndex,
  requestCameraStreamWithFallback,
  diagnoseCameraError
} from '../utils/cameraPermissions';
import {
  getSoundEnabled,
  setSoundEnabled as setGlobalSoundEnabled,
  subscribeSoundEnabled,
  playMechanicalShutterSound,
  playCountdownTickSound,
  playFlashChargeSound,
  playTactileClickSound
} from '../utils/soundEffects';

import demoPhoto1 from '../assets/images/demo_sample_photo_1_1793281744154.jpg';
import demoPhoto2 from '../assets/images/demo_sample_photo_2_1793281744467.jpg';
import demoPhoto3 from '../assets/images/demo_sample_photo_3_1793281744222.jpg';

const STUDIO_POSE_SOURCES = [demoPhoto1, demoPhoto2, demoPhoto3];

interface CameraCaptureProps {
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
  existingPhotos: CapturedPhoto[];
  onNextStep: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotosCaptured,
  existingPhotos,
  onNextStep
}) => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>(existingPhotos);
  const photosRef = useRef<CapturedPhoto[]>(existingPhotos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraSource, setCameraSource] = useState<CameraSourceMode>('hardware');
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active'>('loading');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Permission Popup Modal state
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionAttemptCount, setPermissionAttemptCount] = useState<number>(0);
  const [errorTitle, setErrorTitle] = useState<string>('Enable Camera Access');
  const [errorMessage, setErrorMessage] = useState<string>(
    'Allow browser access to your camera to start shooting your 35mm strip.'
  );
  const [browserHint, setBrowserHint] = useState<string>('');

  // Studio Live Camera state (used when physical webcam is unavailable or restricted)
  const [studioPoseIndex, setStudioPoseIndex] = useState<number>(0);
  const studioPoseIndexRef = useRef<number>(0);
  useEffect(() => {
    studioPoseIndexRef.current = studioPoseIndex;
  }, [studioPoseIndex]);

  // Timer & Capture settings
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [autoBurstCount] = useState<number>(3);
  const [, setIsAutoBurst] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getSoundEnabled());

  useEffect(() => {
    return subscribeSoundEnabled((enabled) => {
      setSoundEnabledState(enabled);
    });
  }, []);

  const handleToggleCameraSound = () => {
    const next = !soundEnabled;
    setGlobalSoundEnabled(next);
    setSoundEnabledState(next);
    if (next) {
      playTactileClickSound();
    }
  };

  // Composition Guide Overlay state ('off' | 'grid' | 'center' | 'both')
  const [guideMode, setGuideMode] = useState<CompositionGuideMode>('grid');

  const guideGeometry = getCompositionGuideGeometry(guideMode, 4 / 3);
  const activeGuideMeta =
    COMPOSITION_GUIDE_MODES.find((m) => m.id === guideMode) || COMPOSITION_GUIDE_MODES[1];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseImagesRef = useRef<(HTMLImageElement | null)[]>([null, null, null]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Render high-resolution 35mm Studio Camera frame on-demand onto studioCanvasRef
  const renderStudioFrame = useCallback(() => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, w, h);

    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    const activeImg = poseImagesRef.current[studioPoseIndex];
    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      const imgAspect = activeImg.naturalWidth / activeImg.naturalHeight;
      const canvasAspect = w / h;
      let drawW = w;
      let drawH = h;

      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = drawH * imgAspect;
      } else {
        drawW = w;
        drawH = drawW / imgAspect;
      }

      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;
      ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);
    } else {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, '#3B2F2A');
      grad.addColorStop(1, '#141210');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Subtle warm analog vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(12,10,9,0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }, [facingMode, studioPoseIndex]);

  // Preload high-res studio subject frames for instant zero-latency canvas rendering & snapshot capture
  useEffect(() => {
    STUDIO_POSE_SOURCES.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        poseImagesRef.current[idx] = img;
        renderStudioFrame();
      };
      img.src = src;
    });
  }, [renderStudioFrame]);

  useEffect(() => {
    if (cameraSource === 'studio') {
      renderStudioFrame();
    }
  }, [cameraSource, facingMode, studioPoseIndex, renderStudioFrame]);

  // Play authentic 35mm mechanical shutter click + motorized film wind
  const playShutterSound = () => {
    if (!soundEnabled) return;
    playMechanicalShutterSound();
  };

  // Enumerate available video input devices
  const refreshVideoDevices = useCallback(async () => {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch {
      // Ignore enumeration errors
    }
  }, []);

  // Request Hardware Camera Stream (invoked on mount and on user click in the Permission Popup)
  const requestHardwareCamera = useCallback(
    async (fromUserGesture: boolean = false, customDeviceId?: string) => {
      setCameraState('loading');
      if (fromUserGesture) {
        setPermissionAttemptCount((c) => c + 1);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setCameraSource('studio');
        setCameraState('active');
        setErrorTitle('Browser Camera API Restricted');
        setErrorMessage(
          'Direct webcam streaming is restricted in this browser view. You can shoot with the Live Studio Camera or open your Phone Camera.'
        );
        setBrowserHint(
          'Use "Open Phone Camera" on mobile to take a photo with your device camera, or shoot right now with Live Studio Camera.'
        );
        setShowPermissionModal(true);
        return false;
      }

      try {
        const targetDevice = customDeviceId !== undefined ? customDeviceId : selectedDeviceId;
        const newStream = await requestCameraStreamWithFallback(
          (constraints) => navigator.mediaDevices.getUserMedia(constraints),
          facingMode,
          targetDevice || undefined
        );

        streamRef.current = newStream;
        setStream(newStream);
        setCameraSource('hardware');
        setCameraState('active');
        setShowPermissionModal(false);
        await refreshVideoDevices();

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play().catch(() => {});
        }
        return true;
      } catch (err: unknown) {
        const diagnosis = diagnoseCameraError(err);
        setErrorTitle(diagnosis.title);
        setErrorMessage(diagnosis.message);
        setBrowserHint(diagnosis.browserHint);
        // Activate the live studio viewfinder immediately so the camera is ALWAYS functional,
        // and display the Permission Popup so the user can retry hardware access or pick a source.
        setCameraSource('studio');
        setCameraState('active');
        setShowPermissionModal(true);
        await refreshVideoDevices();
        return false;
      }
    },
    [facingMode, selectedDeviceId, refreshVideoDevices]
  );

  // Ensure videoRef always receives the active hardware MediaStream and starts playback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream && cameraSource === 'hardware') {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch(() => {});
    }
  }, [stream, cameraSource, cameraState]);

  // Switch camera front / rear
  const toggleCameraFacing = () => {
    playTactileClickSound();
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
  };

  useEffect(() => {
    requestHardwareCamera(false);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [requestHardwareCamera]);

  // Capture a single high-resolution photograph from either the live hardware <video>
  // or the live 35mm Studio Camera <canvas>. Guaranteed NEVER to return null.
  const takeSingleSnapshot = useCallback((): CapturedPhoto => {
    const canvas = document.createElement('canvas');
    let capturedFromHardware = false;

    const video = videoRef.current;
    if (
      cameraSource === 'hardware' &&
      video &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedFromHardware = true;
      }
    }

    if (!capturedFromHardware) {
      canvas.width = 1280;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const studioCanvas = studioCanvasRef.current;
        const activeImg = poseImagesRef.current[studioPoseIndexRef.current];

        if (studioCanvas && studioCanvas.width > 0 && studioCanvas.height > 0) {
          ctx.drawImage(studioCanvas, 0, 0, canvas.width, canvas.height);
        } else if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(activeImg, 0, 0, canvas.width, canvas.height);
        } else {
          // Guaranteed fallback frame even before external assets finish loading
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, '#2C2523');
          grad.addColorStop(1, '#181413');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      // Advance studio pose for the next frame so multi-shot bursts have varied poses
      setStudioPoseIndex((prev) => getNextStudioPoseIndex(prev));
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Trigger flash visual effect and shutter sound
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 160);
    playShutterSound();

    return {
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height
    };
  }, [cameraSource, facingMode, soundEnabled]);

  // Start single photo capture sequence (always works in both hardware and studio camera modes)
  const triggerCaptureSequence = useCallback(() => {
    if (isCapturing) return;
    setShowPermissionModal(false);

    if (countdownSeconds <= 0) {
      const photo = takeSingleSnapshot();
      const updated = [...photosRef.current, photo];
      photosRef.current = updated;
      setPhotos(updated);
      onPhotosCaptured(updated);
      return;
    }

    setIsCapturing(true);
    let count = countdownSeconds;
    setCurrentCountdown(count);
    if (soundEnabled) playCountdownTickSound(count);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCurrentCountdown(count);
        if (soundEnabled) playCountdownTickSound(count);
      } else {
        clearInterval(timer);
        setCurrentCountdown(null);
        const photo = takeSingleSnapshot();
        const updated = [...photosRef.current, photo];
        photosRef.current = updated;
        setPhotos(updated);
        onPhotosCaptured(updated);
        setIsCapturing(false);
      }
    }, 1000);
  }, [isCapturing, countdownSeconds, soundEnabled, takeSingleSnapshot, onPhotosCaptured]);

  // Trigger Automatic Multi-Burst Sequence
  const triggerBurstSequence = useCallback(async () => {
    if (isCapturing) return;
    setShowPermissionModal(false);
    setIsCapturing(true);
    setIsAutoBurst(true);
    if (soundEnabled) playFlashChargeSound();

    const capturedBurst: CapturedPhoto[] = [...photosRef.current];

    for (let shot = 0; shot < autoBurstCount; shot++) {
      for (let c = countdownSeconds; c > 0; c--) {
        setCurrentCountdown(c);
        if (soundEnabled) playCountdownTickSound(c);
        await new Promise((res) => setTimeout(res, 1000));
      }

      setCurrentCountdown(null);
      const photo = takeSingleSnapshot();
      capturedBurst.push(photo);
      photosRef.current = [...capturedBurst];
      setPhotos([...capturedBurst]);
      onPhotosCaptured([...capturedBurst]);

      if (shot < autoBurstCount - 1) {
        await new Promise((res) => setTimeout(res, 1200));
      }
    }

    setIsCapturing(false);
    setIsAutoBurst(false);
  }, [isCapturing, autoBurstCount, countdownSeconds, soundEnabled, takeSingleSnapshot, onPhotosCaptured]);

  // Keyboard navigation for Camera capture & Composition Guide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        triggerCaptureSequence();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        triggerBurstSequence();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        toggleCameraFacing();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setGuideMode((prev) => cycleCompositionGuideMode(prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerCaptureSequence, triggerBurstSequence, facingMode]);

  // Handle local File Upload or Native Phone Camera Capture
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setShowPermissionModal(false);
    const fileArray = Array.from(files);
    const newPhotos: CapturedPhoto[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const photo: CapturedPhoto = {
            id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            dataUrl,
            timestamp: Date.now()
          };
          newPhotos.push(photo);

          if (newPhotos.length === fileArray.length) {
            const combined = [...photosRef.current, ...newPhotos];
            photosRef.current = combined;
            setPhotos(combined);
            onPhotosCaptured(combined);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    const filtered = photosRef.current.filter((p) => p.id !== id);
    photosRef.current = filtered;
    setPhotos(filtered);
    onPhotosCaptured(filtered);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
      {/* Step Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1C1917]">Photobooth Camera</h2>
          <p className="text-xs text-[#6B6458]">
            Pose and capture 3 or 4 photos for your strip. Use the 3×3 grid or center-line rangefinder guides to frame for strip cropping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleCameraSound}
            className="p-2 text-xs font-medium text-[#575249] bg-[#EFECE3] hover:bg-[#E2DDD3] rounded-md transition-colors"
            title={soundEnabled ? 'Mute Shutter Sound' : 'Enable Shutter Sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#1C1917]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#8C8275]" />
            )}
          </button>

          <button
            onClick={onNextStep}
            disabled={photos.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] disabled:bg-[#C9C3B6] rounded-md transition-all flex items-center gap-2 shadow-xs"
          >
            <span>Proceed to Editor ({photos.length} Shots)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport & Camera Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Camera Viewfinder Box */}
        <div className="lg:col-span-8 bg-[#18181B] rounded-2xl overflow-hidden shadow-xl border-4 border-[#27272A] relative min-h-[380px] flex flex-col justify-between">
          {/* Flash Effect Layer */}
          {flashActive && (
            <div className="absolute inset-0 bg-white z-50 animate-ping opacity-90 pointer-events-none" />
          )}

          {/* Countdown Overlay */}
          {currentCountdown !== null && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
              <span className="text-8xl font-serif font-bold animate-pulse">{currentCountdown}</span>
              <span className="text-xs font-mono tracking-widest uppercase text-amber-400">
                Get Ready to Pose!
              </span>
            </div>
          )}

          {/* Camera Controls Bar (Top Viewfinder Overlay) */}
          <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between text-white text-xs font-mono z-20 bg-stone-950/95 border-b border-white/10 gap-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="tracking-widest uppercase font-semibold text-stone-200">
                {cameraSource === 'hardware' ? 'REC 35MM LIVE' : 'REC 35MM STUDIO'}
              </span>
              <span className="hidden md:inline-block text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-400/25 px-2 py-0.5 rounded whitespace-nowrap">
                {activeGuideMeta.label}
              </span>
            </div>

            {/* Composition Guide Mode Selector */}
            <div
              role="group"
              aria-label="Composition Guide Overlay"
              className="flex items-center bg-stone-900 p-0.5 rounded-lg border border-white/15 overflow-x-auto max-w-full"
            >
              {COMPOSITION_GUIDE_MODES.map((modeOption) => {
                const isActive = guideMode === modeOption.id;
                return (
                  <Tooltip
                    key={modeOption.id}
                    position="bottom"
                    content={`${modeOption.label} [G]`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClickSound();
                        setGuideMode(modeOption.id);
                      }}
                      aria-pressed={isActive}
                      className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-400 text-black font-bold shadow-xs'
                          : 'text-stone-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {modeOption.id === 'grid' && <Grid className="w-3 h-3 shrink-0" />}
                      {modeOption.id === 'center' && <Crosshair className="w-3 h-3 shrink-0" />}
                      <span>{modeOption.shortLabel}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {cameraSource === 'studio' && (
                <button
                  type="button"
                  onClick={() => setShowPermissionModal(true)}
                  className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 rounded-md text-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Camera Permission</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleCameraFacing}
                disabled={isCapturing}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-md text-stone-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>{facingMode === 'user' ? 'Front' : 'Rear'}</span>
              </button>
            </div>
          </div>

          {/* Video Stream, Live Studio Viewfinder & Composition Guide Stage */}
          <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
            {/* Hardware Camera Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              data-testid="camera-live-video"
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              } ${
                cameraSource === 'hardware' && cameraState === 'active'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
            />

            {/* Interactive 35mm Live Studio Camera Canvas (active when hardware webcam is restricted/unavailable) */}
            <canvas
              ref={studioCanvasRef}
              width={1280}
              height={960}
              data-testid="camera-studio-canvas"
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                cameraSource === 'studio' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
            />

            {/* Studio Pose Switcher Pill Bar (top-left inside viewfinder when in Studio Camera mode) */}
            {cameraSource === 'studio' && !showPermissionModal && (
              <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-black/75 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/15">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1 pr-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Studio Feed:</span>
                </span>
                {STUDIO_POSES.map((pose, idx) => (
                  <button
                    key={pose.id}
                    type="button"
                    onClick={() => setStudioPoseIndex(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      studioPoseIndex === idx
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-stone-300 hover:text-white bg-white/10'
                    }`}
                  >
                    {pose.shortLabel}
                  </button>
                ))}
              </div>
            )}

            {/* Toggleable Composition Guide Overlay (3x3 Grid / Center-Line Axes / 1:1 Strip Crop Safe Zone) */}
            {guideMode !== 'off' && (
              <div
                data-testid="composition-guide-overlay"
                data-guide-mode={guideMode}
                aria-hidden="true"
                className="absolute inset-0 z-10 pointer-events-none select-none"
              >
                <svg
                  viewBox="0 0 1000 750"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Outer 4:3 Viewfinder Frame Corner Brackets */}
                  <g stroke="rgba(255, 251, 235, 0.8)" strokeWidth="2.5" fill="none">
                    <path d="M 24 56 L 24 24 L 56 24" />
                    <path d="M 944 24 L 976 24 L 976 56" />
                    <path d="M 24 694 L 24 726 L 56 726" />
                    <path d="M 944 726 L 976 726 L 976 694" />
                  </g>

                  {/* 1:1 Square Strip Crop Safe-Zone Vertical Boundaries (x = 12.5% and 87.5%) */}
                  {guideGeometry.showStripCropSafeZone && (
                    <g data-testid="guide-strip-crop-safe">
                      <rect x="0" y="0" width="125" height="750" fill="rgba(0, 0, 0, 0.28)" />
                      <rect x="875" y="0" width="125" height="750" fill="rgba(0, 0, 0, 0.28)" />

                      <line
                        x1="125"
                        y1="24"
                        x2="125"
                        y2="726"
                        stroke="rgba(251, 191, 36, 0.75)"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                      />
                      <line
                        x1="875"
                        y1="24"
                        x2="875"
                        y2="726"
                        stroke="rgba(251, 191, 36, 0.75)"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                      />

                      <path d="M 125 42 L 125 24 L 143 24" stroke="rgba(251, 191, 36, 0.95)" strokeWidth="2" fill="none" />
                      <path d="M 857 24 L 875 24 L 875 42" stroke="rgba(251, 191, 36, 0.95)" strokeWidth="2" fill="none" />
                      <path d="M 125 708 L 125 726 L 143 726" stroke="rgba(251, 191, 36, 0.95)" strokeWidth="2" fill="none" />
                      <path d="M 857 726 L 875 726 L 875 708" stroke="rgba(251, 191, 36, 0.95)" strokeWidth="2" fill="none" />
                    </g>
                  )}

                  {/* 3x3 Rule-of-Thirds Grid Lines + Power-Point Intersections */}
                  {guideGeometry.showRuleOfThirds && (
                    <g data-testid="guide-3x3-grid">
                      <line x1="333.3" y1="0" x2="333.3" y2="750" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />
                      <line x1="666.7" y1="0" x2="666.7" y2="750" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />
                      <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />
                      <line x1="0" y1="500" x2="1000" y2="500" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.25" />

                      {[
                        [333.3, 250],
                        [666.7, 250],
                        [333.3, 500],
                        [666.7, 500]
                      ].map(([cx, cy], idx) => (
                        <g key={idx} stroke="rgba(251, 191, 36, 0.95)" strokeWidth="1.75">
                          <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} />
                          <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* Center-Line Axes & Rangefinder Focus Reticle */}
                  {guideGeometry.showCenterLines && (
                    <g data-testid="guide-center-lines">
                      <line
                        x1="24"
                        y1="375"
                        x2="455"
                        y2="375"
                        stroke="rgba(251, 191, 36, 0.85)"
                        strokeWidth="1.5"
                        strokeDasharray="10 6"
                      />
                      <line
                        x1="545"
                        y1="375"
                        x2="976"
                        y2="375"
                        stroke="rgba(251, 191, 36, 0.85)"
                        strokeWidth="1.5"
                        strokeDasharray="10 6"
                      />

                      <line
                        x1="500"
                        y1="24"
                        x2="500"
                        y2="330"
                        stroke="rgba(251, 191, 36, 0.85)"
                        strokeWidth="1.5"
                        strokeDasharray="10 6"
                      />
                      <line
                        x1="500"
                        y1="420"
                        x2="500"
                        y2="726"
                        stroke="rgba(251, 191, 36, 0.85)"
                        strokeWidth="1.5"
                        strokeDasharray="10 6"
                      />

                      <circle
                        cx="500"
                        cy="375"
                        r="32"
                        stroke="rgba(255, 251, 235, 0.9)"
                        strokeWidth="1.75"
                        fill="none"
                      />
                      <rect
                        x="445"
                        y="335"
                        width="110"
                        height="80"
                        rx="4"
                        stroke="rgba(251, 191, 36, 0.75)"
                        strokeWidth="1.25"
                        fill="none"
                      />
                      <line x1="486" y1="375" x2="514" y2="375" stroke="rgba(251, 191, 36, 1)" strokeWidth="2" />
                      <line x1="500" y1="361" x2="500" y2="389" stroke="rgba(251, 191, 36, 1)" strokeWidth="2" />
                    </g>
                  )}
                </svg>

                {/* Bottom Viewfinder Crop Legend Pill */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[9px] sm:text-[10px] font-mono text-stone-200 tracking-wider uppercase whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs border border-stone-200 inline-block" />
                    4:3 Frame
                  </span>
                  <span className="text-stone-500">&bull;</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2 h-2 rounded-xs border border-dashed border-amber-400 inline-block" />
                    1:1 Strip Safe Zone
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Camera Permission Popup Dialog */}
            {showPermissionModal && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="camera-permission-modal-title"
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
              >
                <div className="w-full max-w-md bg-[#1C1917] border border-amber-400/40 rounded-2xl shadow-2xl p-5 sm:p-6 text-white space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3
                          id="camera-permission-modal-title"
                          className="text-base font-serif font-bold text-white"
                        >
                          {errorTitle}
                        </h3>
                        <p className="text-[11px] font-mono text-amber-300/90">
                          LUMIÈRE 35MM · Camera Permission Prompt
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPermissionModal(false)}
                      aria-label="Close Camera Permission Popup"
                      className="p-1 text-stone-400 hover:text-white rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-200 leading-relaxed">{errorMessage}</p>

                  {permissionAttemptCount > 0 && browserHint && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-start gap-2 text-[11px] text-amber-200 leading-snug">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{browserHint}</span>
                    </div>
                  )}

                  {availableDevices.length > 0 && (
                    <div className="space-y-1">
                      <label
                        htmlFor="camera-device-select"
                        className="block text-[10px] font-mono uppercase tracking-wider text-stone-400"
                      >
                        Select Camera Device
                      </label>
                      <select
                        id="camera-device-select"
                        value={selectedDeviceId}
                        onChange={(e) => {
                          setSelectedDeviceId(e.target.value);
                          requestHardwareCamera(true, e.target.value);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-md text-stone-200"
                      >
                        <option value="">Default ({facingMode === 'user' ? 'Front' : 'Rear'})</option>
                        {availableDevices.map((dev, idx) => (
                          <option key={dev.deviceId || idx} value={dev.deviceId}>
                            {dev.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => requestHardwareCamera(true)}
                      className="w-full py-2.5 px-4 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Allow Camera Access (Request Browser Popup)</span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="py-2.5 px-3 text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span>Open Phone Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPermissionModal(false)}
                        className="py-2.5 px-3 text-xs font-semibold text-amber-200 bg-stone-800/90 hover:bg-stone-700 border border-amber-400/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Use Live Studio Camera</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cameraState === 'loading' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center text-stone-300 space-y-2 z-20">
                <div className="w-8 h-8 border-2 border-stone-400 border-t-amber-400 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono">Connecting Camera Stream...</p>
              </div>
            )}
          </div>

          {/* Bottom Capture Controls Toolbar */}
          <div className="p-4 bg-black/95 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
            {/* Timer Selector */}
            <div className="flex items-center gap-1.5 text-xs text-stone-300">
              <span className="font-mono text-[11px] text-stone-400 mr-1">Timer:</span>
              {[
                { label: 'Instant', value: 0 },
                { label: '3s', value: 3 },
                { label: '5s', value: 5 },
                { label: '10s', value: 10 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    playTactileClickSound();
                    setCountdownSeconds(opt.value);
                  }}
                  disabled={isCapturing}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    countdownSeconds === opt.value
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Main Shutter Trigger Button & Auto 3-Burst */}
            <div className="flex items-center gap-3">
              <Tooltip content="Take Single Photo [Space]">
                <button
                  type="button"
                  onClick={triggerCaptureSequence}
                  disabled={isCapturing}
                  aria-label="Take Single Photo"
                  className="w-14 h-14 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform active:scale-95 group bg-red-600 hover:bg-red-500 disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-red-300 group-hover:scale-90 transition-transform" />
                </button>
              </Tooltip>

              <Tooltip content="Trigger Auto 3-Burst Sequence [B]">
                <button
                  type="button"
                  onClick={triggerBurstSequence}
                  disabled={isCapturing}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 text-black text-xs font-bold font-mono rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto 3-Burst</span>
                </button>
              </Tooltip>
            </div>

            {/* Phone Camera & Upload Photo Inputs */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture={facingMode === 'user' ? 'user' : 'environment'}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                disabled={isCapturing}
                className="px-2.5 py-1.5 text-xs text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-md transition-colors flex items-center gap-1.5 border border-stone-700"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Phone Cam</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCapturing}
                className="px-2.5 py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Captured Shot Reel & Management Column */}
        <div className="lg:col-span-4 bg-[#EFECE3] p-6 rounded-2xl border border-[#E0D8C8] space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1C1917]">Shot Reel</h3>
              <p className="text-[11px] text-[#6B6458]">
                {photos.length} captured photo{photos.length === 1 ? '' : 's'}
              </p>
            </div>

            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  photosRef.current = [];
                  setPhotos([]);
                  onPhotosCaptured([]);
                }}
                className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
              >
                Clear Reel
              </button>
            )}
          </div>

          {/* Photo Reel Grid */}
          {photos.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-[#D6CFC1] rounded-xl space-y-3">
              <Camera className="w-8 h-8 text-[#A39B8B] mx-auto" />
              <p className="text-xs text-[#6B6458] leading-relaxed">
                No shots captured yet. Click the red shutter button, use Auto 3-Burst, or upload photos to create your strip.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="bg-white p-2.5 rounded-lg border border-[#E0D8C8] shadow-xs flex items-center gap-3 group"
                >
                  <div className="w-16 h-12 bg-stone-200 rounded overflow-hidden shrink-0 border border-stone-300">
                    <img
                      src={photo.dataUrl}
                      alt={`Shot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#1C1917] block">
                      Frame #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <span className="text-[10px] text-[#8C8275] block truncate">
                      Captured{' '}
                      {new Date(photo.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove Shot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action to proceed to Editor */}
          {photos.length > 0 && (
            <button
              type="button"
              onClick={onNextStep}
              className="w-full py-3 text-xs font-bold uppercase font-mono tracking-wider text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Style Photo Strip &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


