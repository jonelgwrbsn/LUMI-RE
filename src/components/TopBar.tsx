import React, { useState, useEffect } from 'react';
import { Camera, Sliders, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { AppStep } from '../types/photobooth';
import { Tooltip } from './Tooltip';
import {
  getSoundEnabled,
  setSoundEnabled,
  subscribeSoundEnabled,
  playTactileClickSound
} from '../utils/soundEffects';

interface TopBarProps {
  currentStep: AppStep;
  onNavigate: (step: AppStep) => void;
  onResetSession: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentStep,
  onNavigate,
  onResetSession
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => getSoundEnabled());

  useEffect(() => {
    return subscribeSoundEnabled((enabled) => {
      setSoundOn(enabled);
    });
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      playTactileClickSound();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2DDD3] bg-[#F6F3EC]/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            playTactileClickSound();
            onNavigate('landing');
          }}
          className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] hover:text-[#6B2D38] transition-colors whitespace-nowrap shrink-0 focus:outline-none"
        >
          LUMIÈRE 35MM
        </button>

        {/* Zone 2: Center Navigation Steps */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide">
          <button
            type="button"
            onClick={() => {
              playTactileClickSound();
              onNavigate('landing');
            }}
            className={`transition-colors py-1 whitespace-nowrap shrink-0 ${
              currentStep === 'landing'
                ? 'text-[#6B2D38] font-semibold border-b-2 border-[#6B2D38]'
                : 'text-[#6B6458] hover:text-[#1C1917]'
            }`}
          >
            01. Studio Overview
          </button>
          <button
            type="button"
            onClick={() => {
              playTactileClickSound();
              onNavigate('camera');
            }}
            className={`transition-colors py-1 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentStep === 'camera'
                ? 'text-[#6B2D38] font-semibold border-b-2 border-[#6B2D38]'
                : 'text-[#6B6458] hover:text-[#1C1917]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>02. Capture Booth</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playTactileClickSound();
              onNavigate('editor');
            }}
            className={`transition-colors py-1 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentStep === 'editor'
                ? 'text-[#6B2D38] font-semibold border-b-2 border-[#6B2D38]'
                : 'text-[#6B6458] hover:text-[#1C1917]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>03. Strip Editor</span>
          </button>
        </nav>

        {/* Zone 3: Quick Actions & Global Studio Sound Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip
            content={soundOn ? 'Mute Studio Audio' : 'Enable Studio Audio'}
            position="bottom"
          >
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={soundOn ? 'Mute Studio Audio' : 'Unmute Studio Audio'}
              className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-[#575249] bg-[#EFECE3] hover:bg-[#E2DDD3] border border-[#D9D1C2] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5 text-[#1C1917]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#8C8275]" />
              )}
              <span className="hidden sm:inline font-mono text-[11px] text-[#1C1917]">
                {soundOn ? 'Audio On' : 'Muted'}
              </span>
            </button>
          </Tooltip>

          <Tooltip content="Reset Current Booth Session" position="bottom">
            <button
              type="button"
              onClick={() => {
                playTactileClickSound();
                onResetSession();
              }}
              aria-label="Reset Session"
              className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-[#575249] hover:text-[#1C1917] bg-[#EFECE3] hover:bg-[#E2DDD3] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </Tooltip>

          {currentStep !== 'camera' ? (
            <button
              type="button"
              onClick={() => {
                playTactileClickSound();
                onNavigate('camera');
              }}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Take Photos</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playTactileClickSound();
                onNavigate('editor');
              }}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B2D38] hover:bg-[#52212A] rounded-md transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Customize Strip</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
