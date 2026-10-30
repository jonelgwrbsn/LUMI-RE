import React, { useState } from 'react';
import { Camera, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppStep } from '../types/photobooth';
import { playTactileClickSound } from '../utils/soundEffects';

import demoPhoto1 from '../assets/images/demo_sample_photo_1_1793281744154.jpg';
import demoPhoto2 from '../assets/images/demo_sample_photo_2_1793281744467.jpg';
import demoPhoto3 from '../assets/images/demo_sample_photo_3_1793281744222.jpg';

interface LandingPageProps {
  onStartBooth: () => void;
  onNavigate: (step: AppStep) => void;
}

type DemoPreset = 'portra' | 'monochrome' | 'vintage' | 'raw';

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBooth }) => {
  const [activeDemoPreset, setActiveDemoPreset] = useState<DemoPreset>('portra');

  const getFilterStyle = (p: DemoPreset) => {
    if (p === 'monochrome') return 'grayscale(100%) contrast(125%)';
    if (p === 'vintage') return 'sepia(45%) contrast(95%) brightness(105%)';
    if (p === 'portra') return 'contrast(108%) sepia(12%) saturate(110%)';
    return 'none';
  };

  return (
    <div className="space-y-20 py-8 md:py-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto px-6">
        <div className="lg:col-span-7 space-y-8">
          {/* Zero-Pill Unboxed Metadata Kicker */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-widest text-[#6B2D38] uppercase">
            <span>ANALOGUE DARKROOM STUDIO</span>
            <span aria-hidden="true" className="text-[#BDB5A5]">&middot;</span>
            <span>35MM EMULSION</span>
            <span aria-hidden="true" className="text-[#BDB5A5]">&middot;</span>
            <span>IN-BROWSER RENDERING</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-[1.08] text-balance">
            Tangible 35mm Photo Strips for Modern Moments.
          </h1>

          <p className="text-base sm:text-lg text-[#575249] max-w-2xl leading-relaxed">
            Step inside our digital darkroom. Capture real photographs with your device camera, curate custom strips, apply genuine analog film grain & tonal presets, add custom captions, and export lossless print-ready output or share via QR code.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={() => {
                playTactileClickSound();
                onStartBooth();
              }}
              className="px-8 py-4 text-sm font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-all shadow-md flex items-center justify-center gap-3 group"
            >
              <Camera className="w-5 h-5 group-hover:scale-105 transition-transform" />
              <span>Start Photo Booth Session</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#interactive-demo"
              onClick={() => playTactileClickSound()}
              className="px-6 py-4 text-sm font-medium text-[#1C1917] hover:bg-[#EAE5DA] bg-[#F0ECE1] border border-[#D9D1C2] rounded-md transition-colors text-center"
            >
              Try Interactive Demo
            </a>
          </div>

          {/* Technical Studio Spec Strip */}
          <div className="pt-4 border-t border-[#E2DDD3] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-[#8C8275]">
            <span>300 DPI RASTER OUTPUT</span>
            <span aria-hidden="true">&middot;</span>
            <span>OPTICAL ISO 400</span>
            <span aria-hidden="true">&middot;</span>
            <span>100% PRIVATE &amp; IN-BROWSER</span>
          </div>
        </div>

        {/* Interactive Darkroom Sample Strip Column */}
        <div id="interactive-demo" className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm space-y-4">
            {/* Filter Toggle Selector on Landing Page */}
            <div className="flex items-center justify-between bg-[#EFECE3] p-1.5 rounded-lg border border-[#E0D8C8] text-xs font-mono">
              <span className="text-[10px] text-[#8C8275] pl-2 uppercase tracking-wider font-bold">PRESET:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'portra', label: 'Portra 400' },
                  { id: 'monochrome', label: 'Tri-X Mono' },
                  { id: 'vintage', label: '70s Fade' },
                  { id: 'raw', label: 'Raw' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      playTactileClickSound();
                      setActiveDemoPreset(item.id as DemoPreset);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeDemoPreset === item.id
                        ? 'bg-[#1C1917] text-white font-bold'
                        : 'text-[#6B6458] hover:text-[#1C1917]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactile Photo Strip Frame */}
            <div className="bg-white p-5 shadow-2xl border border-[#E2DDD3] rounded-xs space-y-3 relative group">
              {/* Header Stamp */}
              <div className="text-center pb-2 border-b border-stone-200">
                <span className="font-serif text-sm font-bold tracking-widest text-[#1C1917]">LUMIÈRE STUDIO</span>
                <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">35MM FILM &middot; PARIS</span>
              </div>

              {/* Photo 1 */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden border border-stone-200">
                <img
                  src={demoPhoto1}
                  alt="Demo Photobooth Shot 1"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: getFilterStyle(activeDemoPreset) }}
                />
                <div className="absolute top-1 left-2 text-[9px] font-mono text-stone-300 font-bold">EXP 36A</div>
                <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-500 font-bold drop-shadow-xs">'26 10 29</div>
              </div>

              {/* Photo 2 */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden border border-stone-200">
                <img
                  src={demoPhoto2}
                  alt="Demo Photobooth Shot 2"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: getFilterStyle(activeDemoPreset) }}
                />
                <div className="absolute top-1 left-2 text-[9px] font-mono text-stone-300 font-bold">EXP 36B</div>
                <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-500 font-bold drop-shadow-xs">'26 10 29</div>
              </div>

              {/* Photo 3 */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden border border-stone-200">
                <img
                  src={demoPhoto3}
                  alt="Demo Photobooth Shot 3"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: getFilterStyle(activeDemoPreset) }}
                />
                <div className="absolute top-1 left-2 text-[9px] font-mono text-stone-300 font-bold">EXP 36C</div>
                <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-500 font-bold drop-shadow-xs">'26 10 29</div>
              </div>

              {/* Footer Stamp */}
              <div className="pt-2 text-center border-t border-stone-200 space-y-0.5">
                <p className="font-serif italic text-xs text-stone-700">"Good times in the darkroom"</p>
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">KODAK SAFETY FILM &middot; 400 ISO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Darkroom Process Grid (Clean Editorial Numbers) */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-[#E2DDD3]">
        <div className="max-w-xl mb-12 space-y-2">
          <div className="text-xs font-mono text-[#6B2D38] uppercase tracking-widest">
            DARKROOM PROCESS
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1C1917]">How the Photobooth Works</h2>
          <p className="text-sm text-[#575249]">
            Four seamless steps from camera capture to physical print or digital share.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3 border-t border-[#E2DDD3] pt-6">
            <span className="text-xs font-mono font-bold text-[#6B2D38] block">01. OPTICAL CAPTURE</span>
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">Live Camera Stream</h3>
            <p className="text-xs text-[#575249] leading-relaxed">
              Grant camera access, switch front/rear lenses, set 3s/5s/10s countdown timers, or trigger multi-burst sequences.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E2DDD3] pt-6">
            <span className="text-xs font-mono font-bold text-[#6B2D38] block">02. REEL CURATION</span>
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">Shot Curation &amp; Reorder</h3>
            <p className="text-xs text-[#575249] leading-relaxed">
              Review captured shots, retake specific frames, reorder reel items, or upload camera roll photographs.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E2DDD3] pt-6">
            <span className="text-xs font-mono font-bold text-[#6B2D38] block">03. TONAL &amp; AI STYLING</span>
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">Presets &amp; AI Super-Res</h3>
            <p className="text-xs text-[#575249] leading-relaxed">
              Apply Kodak Portra or Tri-X Mono filters, tune grain &amp; warmth, place vintage stickers, or run AI super-resolution.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E2DDD3] pt-6">
            <span className="text-xs font-mono font-bold text-[#6B2D38] block">04. PHYSICAL PRINT &amp; SHARE</span>
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">300 DPI Export &amp; QR Link</h3>
            <p className="text-xs text-[#575249] leading-relaxed">
              Export lossless 300 DPI images formatted for 2x6" strip printing, or generate a public QR code to share with friends.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Monograph Card */}
      <section id="privacy" className="max-w-5xl mx-auto px-6">
        <div className="bg-[#1C1917] text-white p-8 md:p-12 rounded-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>ZERO-TRACKING POLICY &middot; IN-BROWSER MEMORY</span>
          </div>

          <h2 className="text-3xl font-serif font-bold tracking-tight">Your Photographs Remain 100% Private</h2>

          <p className="text-sm text-stone-300 leading-relaxed max-w-3xl">
            Unlike commercial photo booths that harvest personal imagery, Lumière operates entirely inside your local browser memory runtime. Camera streams never leave your device. Only if you explicitly choose "Generate Share QR Code" will the rendered photo strip composition be saved to our secure share endpoint.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartBooth}
              className="px-6 py-3 text-xs font-semibold text-[#1C1917] bg-white hover:bg-amber-100 rounded-md transition-colors shadow-xs"
            >
              Enter Photobooth Studio
            </button>

            <span className="text-xs font-mono text-stone-400">
              No registration or account required
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
