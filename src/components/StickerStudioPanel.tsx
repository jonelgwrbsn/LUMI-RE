import React, { useState } from 'react';
import {
  CustomSticker,
  StickerCategory,
  StickerFontFamily
} from '../types/photobooth';
import {
  STICKER_CATEGORIES,
  EDITORIAL_STICKER_LIBRARY,
  EDITORIAL_INK_PALETTE,
  StickerAssetDefinition,
  getStickerAssetById
} from '../utils/stickerLibrary';
import { StickerPreviewIcon } from './StickerPreviewIcon';
import {
  Undo2,
  Redo2,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  RotateCcw
} from 'lucide-react';

interface StickerStudioPanelProps {
  stickers: CustomSticker[];
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  onAddSticker: (asset: StickerAssetDefinition) => void;
  onUpdateSticker: (id: string, partial: Partial<CustomSticker>) => void;
  onDuplicateSticker: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onRemoveSticker: (id: string) => void;
  onClearStickers: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const StickerStudioPanel: React.FC<StickerStudioPanelProps> = ({
  stickers,
  selectedStickerId,
  onSelectSticker,
  onAddSticker,
  onUpdateSticker,
  onDuplicateSticker,
  onBringForward,
  onSendBackward,
  onRemoveSticker,
  onClearStickers,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const [activeCategory, setActiveCategory] = useState<StickerCategory | 'all'>('all');

  const filteredAssets =
    activeCategory === 'all'
      ? EDITORIAL_STICKER_LIBRARY
      : EDITORIAL_STICKER_LIBRARY.filter((item) => item.category === activeCategory);

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId) || null;
  const selectedAssetDef = selectedSticker ? getStickerAssetById(selectedSticker.assetId) : undefined;
  const supportsTextEditing =
    selectedSticker &&
    (selectedAssetDef?.editableText ||
      selectedSticker.type === 'typography' ||
      selectedSticker.type === 'stamp' ||
      selectedSticker.type === 'ephemera');

  return (
    <div className="space-y-5">
      {/* Header & Undo/Redo Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1C1917]">
            Editorial Marks, Frames &amp; Ephemera
          </h3>
          <p className="text-[11px] text-[#6B6458]">
            Curated vector stamps, fine-line graphics, archival tape, and typeset labels.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo Sticker Action"
            title="Undo (Ctrl+Z)"
            className="px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E0D8C8] rounded-md text-[#1C1917] hover:bg-[#F9F7F2] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo Sticker Action"
            title="Redo (Ctrl+Shift+Z)"
            className="px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E0D8C8] rounded-md text-[#1C1917] hover:bg-[#F9F7F2] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* 6 Curated Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Sticker Categories"
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-[#1C1917] text-[#F7F3E9] font-semibold'
              : 'bg-white text-[#575249] border border-[#E0D8C8] hover:border-[#BDB5A5]'
          }`}
        >
          All ({EDITORIAL_STICKER_LIBRARY.length})
        </button>
        {STICKER_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-[#6B2D38] text-white font-semibold'
                  : 'bg-white text-[#575249] border border-[#E0D8C8] hover:border-[#BDB5A5]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      {activeCategory !== 'all' && (
        <div className="text-[11px] font-mono text-[#6B6458] bg-[#F6F3EC] px-3 py-1.5 rounded border border-[#E2DDD3]">
          {STICKER_CATEGORIES.find((c) => c.id === activeCategory)?.description}
        </div>
      )}

      {/* Curated Sticker Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredAssets.map((asset) => (
          <button
            key={asset.assetId}
            type="button"
            onClick={() => onAddSticker(asset)}
            aria-label={`Add sticker ${asset.label}`}
            className="p-3 bg-white hover:bg-[#F9F7F2] border border-[#E0D8C8] hover:border-[#6B2D38] rounded-xl transition-all flex flex-col items-center justify-between gap-2 min-h-[88px] group shadow-2xs"
          >
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden py-1">
              <StickerPreviewIcon asset={asset} />
            </div>
            <div className="w-full flex items-center justify-between border-t border-[#F0ECE1] pt-1.5 text-[10px] font-mono text-[#6B6458] group-hover:text-[#1C1917]">
              <span className="truncate">{asset.label}</span>
              <span className="text-[9px] uppercase text-[#8C8275] shrink-0 ml-1">+ Add</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Sticker Inspector & Layer Controls */}
      {selectedSticker ? (
        <div className="bg-white p-4 rounded-xl border border-[#6B2D38]/40 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6B2D38]" />
              <span className="text-xs font-serif font-bold text-[#1C1917]">
                Editing: {selectedSticker.label || selectedSticker.symbol}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDuplicateSticker(selectedSticker.id)}
                className="px-2 py-1 text-[11px] font-mono bg-[#F6F3EC] hover:bg-[#EAE5DA] text-[#1C1917] rounded border border-[#E0D8C8] flex items-center gap-1"
                title="Duplicate Sticker"
              >
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => onBringForward(selectedSticker.id)}
                className="p-1.5 text-xs bg-[#F6F3EC] hover:bg-[#EAE5DA] text-[#1C1917] rounded border border-[#E0D8C8]"
                title="Bring Layer Forward"
                aria-label="Bring Layer Forward"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSendBackward(selectedSticker.id)}
                className="p-1.5 text-xs bg-[#F6F3EC] hover:bg-[#EAE5DA] text-[#1C1917] rounded border border-[#E0D8C8]"
                title="Send Layer Backward"
                aria-label="Send Layer Backward"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveSticker(selectedSticker.id)}
                className="p-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                title="Delete Selected Sticker"
                aria-label="Delete Selected Sticker"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editable Text & Typography Controls */}
          {supportsTextEditing && (
            <div className="space-y-3 bg-[#F9F7F2] p-3 rounded-lg border border-[#E2DDD3]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#6B6458] block mb-1">
                    Primary Label Text
                  </label>
                  <input
                    type="text"
                    value={selectedSticker.text ?? ''}
                    onChange={(e) =>
                      onUpdateSticker(selectedSticker.id, { text: e.target.value })
                    }
                    placeholder="Primary text..."
                    aria-label="Sticker Primary Text"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E0D8C8] rounded font-mono text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#6B6458] block mb-1">
                    Secondary Subtext / Spec
                  </label>
                  <input
                    type="text"
                    value={selectedSticker.subtext ?? ''}
                    onChange={(e) =>
                      onUpdateSticker(selectedSticker.id, { subtext: e.target.value })
                    }
                    placeholder="Optional subtext..."
                    aria-label="Sticker Secondary Subtext"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E0D8C8] rounded font-mono text-[#1C1917]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#6B6458] block mb-1">
                    Typography Face
                  </label>
                  <select
                    value={selectedSticker.fontFamily || 'garamond'}
                    onChange={(e) =>
                      onUpdateSticker(selectedSticker.id, {
                        fontFamily: e.target.value as StickerFontFamily
                      })
                    }
                    aria-label="Sticker Font Family"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E0D8C8] rounded text-[#1C1917]"
                  >
                    <option value="garamond">Editorial Serif (Cormorant)</option>
                    <option value="sans">Clean Studio Sans (Jakarta)</option>
                    <option value="courier">Archival Typewriter (Courier)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#6B6458] block mb-1">
                    Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded border border-[#E0D8C8]">
                    {(['left', 'center', 'right'] as const).map((alignVal) => (
                      <button
                        key={alignVal}
                        type="button"
                        onClick={() =>
                          onUpdateSticker(selectedSticker.id, { textAlign: alignVal })
                        }
                        aria-label={`Align ${alignVal}`}
                        className={`py-1 rounded flex items-center justify-center transition-colors ${
                          (selectedSticker.textAlign || 'center') === alignVal
                            ? 'bg-[#1C1917] text-white'
                            : 'text-[#6B6458] hover:text-[#1C1917]'
                        }`}
                      >
                        {alignVal === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {alignVal === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {alignVal === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6B6458]">
                    <span>Font Size</span>
                    <span>{selectedSticker.fontSize || 12}pt</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    step="1"
                    value={selectedSticker.fontSize || 12}
                    onChange={(e) =>
                      onUpdateSticker(selectedSticker.id, {
                        fontSize: parseInt(e.target.value, 10)
                      })
                    }
                    aria-label="Sticker Font Size"
                    className="w-full accent-[#6B2D38]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6B6458]">
                    <span>Letter Spacing</span>
                    <span>{selectedSticker.letterSpacing ?? 1.5}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.5"
                    value={selectedSticker.letterSpacing ?? 1.5}
                    onChange={(e) =>
                      onUpdateSticker(selectedSticker.id, {
                        letterSpacing: parseFloat(e.target.value)
                      })
                    }
                    aria-label="Sticker Letter Spacing"
                    className="w-full accent-[#6B2D38]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editorial Ink Color Palette */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-[#6B6458] block">
              Editorial Ink Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {EDITORIAL_INK_PALETTE.map((ink) => {
                const isCurrent =
                  (selectedSticker.color || '#1C1917').toLowerCase() === ink.hex.toLowerCase();
                return (
                  <button
                    key={ink.id}
                    type="button"
                    onClick={() => onUpdateSticker(selectedSticker.id, { color: ink.hex })}
                    title={ink.name}
                    aria-label={`Ink color ${ink.name}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all ${
                      isCurrent
                        ? 'border-[#6B2D38] bg-[#F6F3EC] font-bold text-[#1C1917] ring-1 ring-[#6B2D38]'
                        : 'border-[#E0D8C8] bg-white text-[#575249] hover:border-[#BDB5A5]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-stone-400 shrink-0"
                      style={{ backgroundColor: ink.hex }}
                    />
                    <span>{ink.name.split(' ')[1] || ink.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size, Opacity & Rotation Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-[#6B6458]">
                <span>Scale</span>
                <span>{selectedSticker.size}px</span>
              </div>
              <input
                type="range"
                min="28"
                max="130"
                value={selectedSticker.size}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, { size: parseInt(e.target.value, 10) })
                }
                aria-label="Sticker Scale"
                className="w-full accent-[#1C1917]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-[#6B6458]">
                <span>Opacity</span>
                <span>{Math.round((selectedSticker.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="1"
                step="0.05"
                value={selectedSticker.opacity ?? 1}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, { opacity: parseFloat(e.target.value) })
                }
                aria-label="Sticker Opacity"
                className="w-full accent-[#1C1917]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-[#6B6458]">
                <span>Rotation</span>
                <button
                  type="button"
                  onClick={() => onUpdateSticker(selectedSticker.id, { rotation: 0 })}
                  className="text-[#6B2D38] hover:underline flex items-center gap-0.5"
                  title="Reset Rotation to 0°"
                >
                  <span>{selectedSticker.rotation}°</span>
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={selectedSticker.rotation}
                onChange={(e) =>
                  onUpdateSticker(selectedSticker.id, { rotation: parseInt(e.target.value, 10) })
                }
                aria-label="Sticker Rotation"
                className="w-full accent-[#1C1917]"
              />
            </div>
          </div>
        </div>
      ) : (
        stickers.length > 0 && (
          <div className="text-xs font-mono text-[#6B6458] bg-white/80 p-3 rounded-lg border border-[#E0D8C8]">
            Select any active sticker below or click directly on the photo strip preview to customize typography, ink color, opacity, or layer order.
          </div>
        )
      )}

      {/* Active Stickers Layer Stack */}
      {stickers.length > 0 && (
        <div className="pt-2 border-t border-[#E0D8C8] space-y-2">
          <div className="flex justify-between items-center text-xs font-serif font-bold text-[#1C1917]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6B2D38]" />
              <span>Active Sticker Layers ({stickers.length})</span>
            </span>
            <button
              type="button"
              onClick={onClearStickers}
              className="text-red-700 hover:text-red-900 text-[11px] font-mono"
            >
              Remove All
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {stickers.map((stk, index) => {
              const isSelected = stk.id === selectedStickerId;
              return (
                <div
                  key={stk.id}
                  onClick={() => onSelectSticker(stk.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white border-[#6B2D38] ring-1 ring-[#6B2D38]'
                      : 'bg-white/70 border-[#E0D8C8] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-stone-300"
                      style={{ backgroundColor: stk.color || '#1C1917' }}
                    />
                    <span className="font-mono text-[10px] text-[#8C8275]">#{index + 1}</span>
                    <span className="font-medium text-[#1C1917] truncate">
                      {stk.text || stk.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onDuplicateSticker(stk.id)}
                      className="p-1 text-[#6B6458] hover:text-[#1C1917]"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSticker(stk.id)}
                      className="p-1 text-stone-400 hover:text-red-700"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
