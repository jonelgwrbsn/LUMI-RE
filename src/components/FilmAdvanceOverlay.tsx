import React, { useEffect, useState } from 'react';
import { CapturedPhoto } from '../types/photobooth';
import { playFilmAdvanceSound, playTactileClickSound, getSoundEnabled } from '../utils/soundEffects';

interface FilmAdvanceOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  photos?: CapturedPhoto[];
}

const FRAME_NUMBERS = ['33A', '34A', '35A', '36A'];

export const FilmAdvanceOverlay: React.FC<FilmAdvanceOverlayProps> = ({
  isActive,
  onComplete,
  photos = []
}) => {
  const [phase, setPhase] = useState<'enter' | 'advance' | 'develop'>('enter');
  const [activeFrameIdx, setActiveFrameIdx] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setPhase('enter');
      setActiveFrameIdx(0);
      return;
    }

    // Play synthesized 35mm mechanical sprocket ratchet, winder torque & lever return latch sound
    playFilmAdvanceSound();

    const rafId = requestAnimationFrame(() => {
      setPhase('advance');
    });

    const step1 = setTimeout(() => setActiveFrameIdx(1), 170);
    const step2 = setTimeout(() => setActiveFrameIdx(2), 340);
    const step3 = setTimeout(() => {
      setActiveFrameIdx(3);
      setPhase('develop');
    }, 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 880);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  const soundEnabled = getSoundEnabled();
  const displayFrames = Array.from({ length: 4 }).map((_, idx) => {
    const source = photos[idx % Math.max(1, photos.length)];
    return {
      index: idx,
      frameCode: FRAME_NUMBERS[idx] || `${33 + idx}A`,
      dataUrl: source?.dataUrl || ''
    };
  });

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="film-advance-overlay"
      onClick={() => {
        playTactileClickSound();
        onComplete();
      }}
      className="fixed inset-0 z-[100] bg-[#12100E]/96 backdrop-blur-md flex flex-col items-center justify-center px-4 sm:px-8 overflow-hidden select-none cursor-pointer"
    >
      {/* Subtle tungsten darkroom safelight radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(180,83,9,0.12),transparent_70%)]"
      />

      <div className="relative w-full max-w-3xl space-y-6">
        {/* Top Darkroom Negative Carrier Header */}
        <div className="flex items-center justify-between border-b border-[#2E2924] pb-3 text-xs font-mono text-[#A89F91]">
          <div className="flex items-center gap-3">
            <span className="text-[#F6F3EC] font-semibold tracking-wider">
              35MM NEGATIVE CARRIER
            </span>
            <span aria-hidden="true" className="text-[#575249]">·</span>
            <span className="text-amber-400/90 tabular-nums">
              FRAME {FRAME_NUMBERS[activeFrameIdx]} / 36A
            </span>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <span className="hidden sm:inline text-[#8C8275]">
              {soundEnabled ? 'MECHANICAL TRANSPORT AUDIO ACTIVE' : 'SILENT TRANSPORT'}
            </span>
            <span className="text-[#D6CFC2] underline underline-offset-4">
              Tap to Skip
            </span>
          </div>
        </div>

        {/* Illuminated Light-Table & 35mm Celluloid Film Strip */}
        <div className="relative rounded-xl border border-[#38322C] bg-[#181512] p-3 sm:p-5 shadow-2xl overflow-hidden">
          {/* Warm Backlit Diffuser Slit */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 inset-y-4 rounded-lg bg-[#F6F3EC]/[0.03] border border-[#F6F3EC]/[0.06]"
          />

          {/* Physical 35mm Celluloid Strip Track */}
          <div className="relative w-full overflow-hidden rounded-lg bg-[#0D0B0A] border-y-2 border-[#2E2924] py-2.5 shadow-inner">
            {/* Top Sprocket Perforations & Rebate Markings */}
            <div
              className="flex items-center justify-between gap-2.5 px-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform:
                  phase === 'enter'
                    ? 'translate3d(28px, 0, 0)'
                    : 'translate3d(-48px, 0, 0)'
              }}
            >
              {Array.from({ length: 28 }).map((_, idx) => (
                <div
                  key={`top-perf-${idx}`}
                  className="w-3.5 h-2.5 sm:w-4 sm:h-2.5 rounded-[1.5px] bg-[#EAE3D5]/85 shrink-0 shadow-xs"
                />
              ))}
            </div>

            {/* Top Edge Film Stock Code */}
            <div
              className="flex items-center justify-around font-mono text-[9px] sm:text-[10px] tracking-[0.24em] text-amber-500/80 uppercase py-1.5 whitespace-nowrap transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform:
                  phase === 'enter'
                    ? 'translate3d(36px, 0, 0)'
                    : 'translate3d(-36px, 0, 0)'
              }}
            >
              <span>LUMIÈRE 400TX</span>
              <span>SAFETY FILM 5063</span>
              <span>EASTMAN KODAK</span>
              <span>DARKROOM MASTER</span>
            </div>

            {/* Captured Exposure Frames inside the 35mm Strip */}
            <div
              className="grid grid-cols-4 gap-2 sm:gap-3.5 px-3 sm:px-5 py-1 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform:
                  phase === 'enter'
                    ? 'translate3d(42px, 0, 0)'
                    : 'translate3d(0px, 0, 0)'
              }}
            >
              {displayFrames.map((frame, idx) => {
                const isRevealed = idx <= activeFrameIdx;
                return (
                  <div
                    key={frame.frameCode}
                    className={`relative aspect-[4/3] rounded-[3px] overflow-hidden border transition-opacity duration-300 ${
                      isRevealed
                        ? 'border-amber-500/50 opacity-100'
                        : 'border-[#2E2924] opacity-55'
                    } bg-[#1C1917]`}
                  >
                    {frame.dataUrl ? (
                      <img
                        src={frame.dataUrl}
                        alt={`Exposure ${frame.frameCode}`}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          phase === 'develop'
                            ? 'scale-100 contrast-105'
                            : 'scale-105 sepia-[0.25] contrast-125'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#26221E] to-[#161311] font-mono text-[10px] text-[#8C8275]">
                        {frame.frameCode}
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1.5 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-400 tabular-nums">
                      {frame.frameCode}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Edge Frame Index Numbers */}
            <div
              className="flex items-center justify-around font-mono text-[9px] sm:text-[10px] tracking-[0.22em] text-amber-500/80 uppercase py-1.5 whitespace-nowrap tabular-nums transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform:
                  phase === 'enter'
                    ? 'translate3d(36px, 0, 0)'
                    : 'translate3d(-36px, 0, 0)'
              }}
            >
              <span>&rarr; 33A</span>
              <span>&rarr; 34A</span>
              <span>&rarr; 35A</span>
              <span>&rarr; 36A</span>
            </div>

            {/* Bottom Sprocket Perforations */}
            <div
              className="flex items-center justify-between gap-2.5 px-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transform:
                  phase === 'enter'
                    ? 'translate3d(28px, 0, 0)'
                    : 'translate3d(-48px, 0, 0)'
              }}
            >
              {Array.from({ length: 28 }).map((_, idx) => (
                <div
                  key={`bot-perf-${idx}`}
                  className="w-3.5 h-2.5 sm:w-4 sm:h-2.5 rounded-[1.5px] bg-[#EAE3D5]/85 shrink-0 shadow-xs"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Progress & Status Line */}
        <div className="space-y-2.5">
          <div className="w-full h-1 bg-[#26221E] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-transform duration-700 ease-out origin-left will-change-transform"
              style={{
                transform: `scaleX(${phase === 'enter' ? 0.15 : phase === 'advance' ? 0.72 : 1})`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#D6CFC2]">
            <span>Advancing exposed negative into darkroom carrier</span>
            <span className="text-amber-400 tabular-nums">
              {Math.min(100, Math.round(((activeFrameIdx + 1) / 4) * 100))}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
