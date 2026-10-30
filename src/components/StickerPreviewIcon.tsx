import React from 'react';
import { StickerAssetDefinition } from '../utils/stickerLibrary';
import { resolveStickerFontStack } from '../utils/stickerRenderer';

interface StickerPreviewIconProps {
  asset: StickerAssetDefinition;
}

export const StickerPreviewIcon: React.FC<StickerPreviewIconProps> = ({ asset }) => {
  const color = asset.defaultColor || '#1C1917';
  const fontFam = resolveStickerFontStack(asset.defaultFontFamily);
  const id = asset.assetId;

  // 1. Fine-Line Graphics SVGs
  if (id === 'line-north-star') {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="32,6 35.5,24.5 49,15 39.5,28.5 58,32 39.5,35.5 49,49 35.5,39.5 32,58 28.5,39.5 15,49 24.5,35.5 6,32 24.5,28.5 15,15 28.5,24.5" />
        <circle cx="32" cy="32" r="2" fill={color} />
      </svg>
    );
  }

  if (id === 'line-monoline-heart') {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 52 C10 38 8 18 20 15 C27 14 32 21 32 25 C32 21 37 14 44 15 C56 18 54 38 32 52 Z" />
      </svg>
    );
  }

  if (id === 'line-botanical-sprig') {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 52 Q28 32 50 12" />
        <path d="M23 40 Q13 35 12 27 Q20 31 23 40 Z" />
        <path d="M28 34 Q39 29 40 21 Q32 25 28 34 Z" />
        <path d="M35 27 Q25 22 24 14 Q32 18 35 27 Z" />
        <path d="M40 21 Q50 16 51 9 Q43 13 40 21 Z" />
      </svg>
    );
  }

  if (id === 'line-sparkle-cluster') {
    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 14 Q28 32 46 32 Q28 32 28 50 Q28 32 10 32 Q28 32 28 14 Z" />
        <path d="M48 10 Q48 18 56 18 Q48 18 48 26 Q48 18 40 18 Q48 18 48 10 Z" />
        <path d="M16 12 Q16 17 21 17 Q16 17 16 22 Q16 17 11 17 Q16 17 16 12 Z" />
      </svg>
    );
  }

  if (id === 'line-editorial-arrow') {
    return (
      <svg viewBox="0 0 80 40" className="w-14 h-8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="20" x2="72" y2="20" />
        <polyline points="60,13 72,20 60,27" />
        <polyline points="15,14 9,20 15,26" />
        <polyline points="22,14 16,20 22,26" />
      </svg>
    );
  }

  if (id === 'line-fleuron-ornament') {
    return (
      <svg viewBox="0 0 96 40" className="w-16 h-8" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="20" x2="36" y2="20" />
        <line x1="60" y1="20" x2="90" y2="20" />
        <polygon points="48,11 57,20 48,29 39,20" />
        <circle cx="32" cy="20" r="2" fill={color} />
        <circle cx="64" cy="20" r="2" fill={color} />
      </svg>
    );
  }

  // 2. Film Frames SVGs
  if (id === 'frame-negative-strip' || id === 'frame-sprocket-bar') {
    return (
      <svg viewBox="0 0 110 42" className="w-20 h-9" fill="none" stroke={color} strokeWidth="1.4">
        <rect x="4" y="4" width="102" height="34" />
        {[12, 26, 40, 54, 68, 82, 94].map((x) => (
          <React.Fragment key={x}>
            <rect x={x} y="7" width="6" height="4" />
            <rect x={x} y="31" width="6" height="4" />
          </React.Fragment>
        ))}
        {asset.defaultText && (
          <text x="55" y="24" textAnchor="middle" fill={color} stroke="none" fontSize="8" fontFamily="monospace" fontWeight="700">
            {asset.defaultText}
          </text>
        )}
      </svg>
    );
  }

  if (id === 'frame-crop-corners' || id === 'frame-viewfinder-outline') {
    return (
      <svg viewBox="0 0 96 52" className="w-18 h-10" fill="none" stroke={color} strokeWidth="1.6">
        <polyline points="8,18 8,6 20,6" />
        <polyline points="76,6 88,6 88,18" />
        <polyline points="88,34 88,46 76,46" />
        <polyline points="20,46 8,46 8,34" />
        <line x1="43" y1="26" x2="53" y2="26" />
        <line x1="48" y1="21" x2="48" y2="31" />
      </svg>
    );
  }

  // 3. Paper Ephemera Previews
  if (asset.category === 'paper-ephemera') {
    return (
      <div
        className="px-2 py-1.5 border border-[#1C1917]/30 shadow-2xs flex flex-col items-center justify-center w-full"
        style={{
          backgroundColor: asset.defaultBackgroundColor || '#F7F3E9',
          color,
          fontFamily: fontFam
        }}
      >
        <span className="text-[8.5px] font-bold tracking-wide uppercase leading-tight text-center">
          {asset.defaultText || asset.label}
        </span>
        {asset.defaultSubtext && (
          <span className="text-[6.5px] font-mono opacity-75 tracking-wider uppercase text-center mt-0.5">
            {asset.defaultSubtext}
          </span>
        )}
      </div>
    );
  }

  // 4. Film Lab, Editorial Typography, Date & Location
  return (
    <div
      className={`px-2 py-1 flex flex-col items-center justify-center w-full ${
        asset.type === 'stamp' ? 'border border-current rounded-xs' : ''
      }`}
      style={{
        color,
        fontFamily: fontFam
      }}
    >
      <span
        className="text-[8.5px] font-semibold uppercase leading-tight text-center"
        style={{ letterSpacing: `${Math.min(1.4, asset.defaultLetterSpacing)}px` }}
      >
        {asset.defaultText || asset.label}
      </span>
      {asset.defaultSubtext && (
        <span className="text-[6.5px] font-mono opacity-75 tracking-wide uppercase text-center mt-0.5">
          {asset.defaultSubtext}
        </span>
      )}
    </div>
  );
};
