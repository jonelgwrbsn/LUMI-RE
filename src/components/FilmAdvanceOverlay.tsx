import React, { useEffect, useState } from 'react';
import { Film, Volume2 } from 'lucide-react';
import { playFilmAdvanceSound, getSoundEnabled } from '../utils/soundEffects';

interface FilmAdvanceOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

export const FilmAdvanceOverlay: React.FC<FilmAdvanceOverlayProps> = ({
  isActive,
  onComplete
}) => {
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setSliding(false);
      return;
    }

    // Play synthesized 35mm mechanical sprocket ratchet, winder torque & lever return latch sound
    playFilmAdvanceSound();

    const rafId = requestAnimationFrame(() => {
      setSliding(true);
    });

    const timer = setTimeout(() => {
      onComplete();
    }, 680);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  const soundEnabled = getSoundEnabled();

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="film-advance-overlay"
      className="fixed inset-0 z-[100] bg-[#141210]/95 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden select-none pointer-events-auto transition-opacity duration-150"
    >
      {/* Animated 35mm Sprocket Strip Track */}
      <div className="w-full max-w-xl px-6 space-y-5 text-center">
        <div className="relative h-24 w-full border-y-2 border-[#3A352F] bg-[#1C1917] overflow-hidden flex flex-col justify-between py-2 shadow-2xl">
          {/* Top Sprocket Perforations */}
          <div
            className={`flex items-center gap-4 px-2 transition-transform duration-650 ease-out ${
              sliding ? '-translate-x-44' : 'translate-x-0'
            }`}
          >
            {Array.from({ length: 32 }).map((_, idx) => (
              <div
                key={`top-${idx}`}
                className="w-3.5 h-2.5 rounded-[2px] bg-[#F6F3EC]/85 shrink-0"
              />
            ))}
          </div>

          {/* Center Negative Frame Numbers */}
          <div
            className={`flex items-center justify-around gap-10 font-mono text-[11px] tracking-[0.25em] text-amber-400/90 uppercase whitespace-nowrap px-4 transition-transform duration-650 ease-out ${
              sliding ? '-translate-x-36' : 'translate-x-8'
            }`}
          >
            <span>KODAK 400TX &middot; 35A</span>
            <span>LUMIÈRE LAB &middot; 36</span>
            <span>KODAK 400TX &middot; 36A</span>
            <span>DEVELOPING REEL</span>
          </div>

          {/* Bottom Sprocket Perforations */}
          <div
            className={`flex items-center gap-4 px-2 transition-transform duration-650 ease-out ${
              sliding ? '-translate-x-44' : 'translate-x-0'
            }`}
          >
            {Array.from({ length: 32 }).map((_, idx) => (
              <div
                key={`bot-${idx}`}
                className="w-3.5 h-2.5 rounded-[2px] bg-[#F6F3EC]/85 shrink-0"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 text-[#F6F3EC]">
          <Film className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-[0.2em]">
            Advancing 35mm Film to Darkroom...
          </span>
          {soundEnabled && (
            <Volume2
              aria-hidden="true"
              className="w-3.5 h-3.5 text-amber-400/80 animate-pulse"
            />
          )}
        </div>
      </div>
    </div>
  );
};
