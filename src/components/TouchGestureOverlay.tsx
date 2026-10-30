import React, { useEffect, useRef, useState } from 'react';
import Hammer from 'hammerjs';
import { CustomSticker, CustomCaption } from '../types/photobooth';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Maximize2
} from 'lucide-react';
import { sortStickersByLayer } from '../utils/stickerLibrary';

interface TouchGestureOverlayProps {
  stickers: CustomSticker[];
  selectedStickerId?: string | null;
  onSelectSticker?: (id: string | null) => void;
  onUpdateSticker: (id: string, partial: Partial<CustomSticker>) => void;
  onRemoveSticker: (id: string) => void;
  onDuplicateSticker?: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
  captions: CustomCaption[];
  onUpdateCaption: (id: string, partial: Partial<CustomCaption>) => void;
  onRemoveCaption: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
}

export const TouchGestureOverlay: React.FC<TouchGestureOverlayProps> = ({
  stickers,
  selectedStickerId,
  onSelectSticker,
  onUpdateSticker,
  onRemoveSticker,
  onDuplicateSticker,
  onBringForward,
  onSendBackward,
  captions,
  onUpdateCaption,
  onRemoveCaption,
  containerWidth,
  containerHeight
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const activeId = selectedStickerId !== undefined ? selectedStickerId : internalSelectedId;

  const handleSelect = (id: string | null) => {
    setInternalSelectedId(id);
    if (onSelectSticker) {
      onSelectSticker(id);
    }
  };

  const orderedStickers = sortStickersByLayer(stickers);

  return (
    <div
      className="absolute inset-0 pointer-events-auto overflow-visible select-none touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleSelect(null);
        }
      }}
    >
      {/* Stickers Interactive Hit-Boxes & Selection Handles */}
      {orderedStickers.map((stk) => (
        <StickerGestureItem
          key={stk.id}
          sticker={stk}
          isSelected={activeId === stk.id}
          onSelect={() => handleSelect(stk.id)}
          onUpdate={(partial) => onUpdateSticker(stk.id, partial)}
          onRemove={() => {
            onRemoveSticker(stk.id);
            if (activeId === stk.id) handleSelect(null);
          }}
          onDuplicate={onDuplicateSticker ? () => onDuplicateSticker(stk.id) : undefined}
          onBringForward={onBringForward ? () => onBringForward(stk.id) : undefined}
          onSendBackward={onSendBackward ? () => onSendBackward(stk.id) : undefined}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}

      {/* Captions Interactive Hit-Boxes */}
      {captions.map((cap) => (
        <CaptionGestureItem
          key={cap.id}
          caption={cap}
          isSelected={activeId === cap.id}
          onSelect={() => handleSelect(cap.id)}
          onUpdate={(partial) => onUpdateCaption(cap.id, partial)}
          onRemove={() => {
            onRemoveCaption(cap.id);
            if (activeId === cap.id) handleSelect(null);
          }}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </div>
  );
};

interface StickerItemProps {
  sticker: CustomSticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (partial: Partial<CustomSticker>) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  containerWidth: number;
  containerHeight: number;
}

const StickerGestureItem: React.FC<StickerItemProps> = ({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onBringForward,
  onSendBackward,
  containerWidth,
  containerHeight
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const startPos = useRef<{ x: number; y: number; size: number; rotation: number }>({
    x: sticker.x,
    y: sticker.y,
    size: sticker.size,
    rotation: sticker.rotation
  });

  useEffect(() => {
    if (!itemRef.current) return;
    const element = itemRef.current;

    const mc = new Hammer.Manager(element);
    const pan = new Hammer.Pan({ threshold: 2 });
    const pinch = new Hammer.Pinch({ threshold: 0 });
    const rotate = new Hammer.Rotate({ threshold: 0 });

    pinch.recognizeWith(rotate);
    mc.add([pan, pinch, rotate]);

    mc.on('panstart pinchstart rotatestart', (ev) => {
      ev.srcEvent.stopPropagation();
      onSelect();
      startPos.current = {
        x: sticker.x,
        y: sticker.y,
        size: sticker.size,
        rotation: sticker.rotation
      };
    });

    mc.on('panmove', (e) => {
      if (containerWidth <= 0 || containerHeight <= 0) return;
      const deltaX = e.deltaX / containerWidth;
      const deltaY = e.deltaY / containerHeight;

      const newX = Math.max(0.05, Math.min(0.95, Number((startPos.current.x + deltaX).toFixed(3))));
      const newY = Math.max(0.04, Math.min(0.96, Number((startPos.current.y + deltaY).toFixed(3))));

      onUpdate({ x: newX, y: newY });
    });

    mc.on('pinchmove', (e) => {
      const newSize = Math.max(24, Math.min(140, Math.round(startPos.current.size * e.scale)));
      onUpdate({ size: newSize });
    });

    mc.on('rotatemove', (e) => {
      const newRot = Math.round(startPos.current.rotation + e.rotation);
      onUpdate({ rotation: newRot });
    });

    return () => {
      mc.destroy();
    };
  }, [containerWidth, containerHeight, sticker.x, sticker.y, sticker.size, sticker.rotation]);

  // Estimate bounding box size proportional to preview container
  const scaleRatio = containerWidth > 0 ? containerWidth / 600 : 0.45;
  const isWide = sticker.type !== 'svg' || sticker.assetId?.includes('arrow') || sticker.assetId?.includes('fleuron');
  const boxW = Math.max(40, Math.round((isWide ? sticker.size * 2.1 : sticker.size * 1.15) * scaleRatio));
  const boxH = Math.max(28, Math.round((isWide ? sticker.size * 0.85 : sticker.size * 1.15) * scaleRatio));

  const posX = sticker.x * 100;
  const posY = sticker.y * 100;

  // Corner resize pointer drag handler for desktop & mobile precision
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialSize = sticker.size;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const delta = (dx + dy) * 0.5;
      const nextSize = Math.max(24, Math.min(140, Math.round(initialSize + delta)));
      onUpdate({ size: nextSize });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={itemRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      data-testid={`sticker-handle-${sticker.assetId}`}
      aria-label={`Select sticker ${sticker.label || sticker.symbol}`}
      role="button"
      tabIndex={0}
      className={`absolute cursor-grab active:cursor-grabbing select-none touch-none transition-shadow ${
        isSelected
          ? 'ring-1.5 ring-[#6B2D38] bg-[#6B2D38]/5 rounded-xs z-20'
          : 'hover:ring-1 hover:ring-[#1C1917]/40 rounded-xs z-10'
      }`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`
      }}
    >
      {isSelected && (
        <>
          {/* Corner selection nodes */}
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#F7F3E9] border border-[#6B2D38] rounded-full pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F7F3E9] border border-[#6B2D38] rounded-full pointer-events-none" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#F7F3E9] border border-[#6B2D38] rounded-full pointer-events-none" />

          {/* Bottom-right interactive resize handle */}
          <button
            type="button"
            onPointerDown={handleResizePointerDown}
            title="Drag to resize sticker"
            aria-label="Resize sticker"
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#6B2D38] text-white rounded-full flex items-center justify-center shadow-md cursor-nwse-resize hover:scale-110 transition-transform"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>

          {/* Compact Floating Editorial Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ transform: ` translateX(-50%) rotate(${-sticker.rotation}deg)` }}
            className="absolute -top-9 left-1/2 flex items-center gap-0.5 bg-[#1C1917] text-[#F7F3E9] px-1.5 py-1 rounded shadow-lg border border-stone-700 whitespace-nowrap z-30"
          >
            {onDuplicate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1 hover:text-amber-300 transition-colors"
                title="Duplicate Sticker"
                aria-label="Duplicate Sticker"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            {onBringForward && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBringForward();
                }}
                className="p-1 hover:text-amber-300 transition-colors"
                title="Bring Forward"
                aria-label="Bring Sticker Forward"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            )}
            {onSendBackward && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendBackward();
                }}
                className="p-1 hover:text-amber-300 transition-colors"
                title="Send Backward"
                aria-label="Send Sticker Backward"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ rotation: ((sticker.rotation + 15 + 180) % 360) - 180 });
              }}
              className="p-1 hover:text-amber-300 transition-colors"
              title="Rotate +15°"
              aria-label="Rotate Sticker 15 degrees"
            >
              <RotateCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Delete Sticker"
              aria-label="Delete Sticker"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface CaptionItemProps {
  caption: CustomCaption;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (partial: Partial<CustomCaption>) => void;
  onRemove: () => void;
  containerWidth: number;
  containerHeight: number;
}

const CaptionGestureItem: React.FC<CaptionItemProps> = ({
  caption,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  containerWidth,
  containerHeight
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const startPos = useRef<{ x: number; y: number; size: number; rotation: number }>({
    x: caption.x,
    y: caption.y,
    size: caption.size,
    rotation: caption.rotation
  });

  useEffect(() => {
    if (!itemRef.current) return;
    const element = itemRef.current;

    const mc = new Hammer.Manager(element);
    const pan = new Hammer.Pan({ threshold: 2 });
    const pinch = new Hammer.Pinch({ threshold: 0 });
    const rotate = new Hammer.Rotate({ threshold: 0 });

    pinch.recognizeWith(rotate);
    mc.add([pan, pinch, rotate]);

    mc.on('panstart pinchstart rotatestart', (ev) => {
      ev.srcEvent.stopPropagation();
      onSelect();
      startPos.current = {
        x: caption.x,
        y: caption.y,
        size: caption.size,
        rotation: caption.rotation
      };
    });

    mc.on('panmove', (e) => {
      if (containerWidth <= 0 || containerHeight <= 0) return;
      const deltaX = e.deltaX / containerWidth;
      const deltaY = e.deltaY / containerHeight;

      const newX = Math.max(0.05, Math.min(0.95, Number((startPos.current.x + deltaX).toFixed(3))));
      const newY = Math.max(0.04, Math.min(0.96, Number((startPos.current.y + deltaY).toFixed(3))));

      onUpdate({ x: newX, y: newY });
    });

    mc.on('pinchmove', (e) => {
      const newSize = Math.max(12, Math.min(60, Math.round(startPos.current.size * e.scale)));
      onUpdate({ size: newSize });
    });

    mc.on('rotatemove', (e) => {
      const newRot = Math.round(startPos.current.rotation + e.rotation);
      onUpdate({ rotation: newRot });
    });

    return () => {
      mc.destroy();
    };
  }, [containerWidth, containerHeight, caption.x, caption.y, caption.size, caption.rotation]);

  const posX = caption.x * 100;
  const posY = caption.y * 100;

  return (
    <div
      ref={itemRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute cursor-grab active:cursor-grabbing transition-shadow select-none touch-none px-4 py-2 rounded-xs ${
        isSelected
          ? 'ring-1.5 ring-[#6B2D38] bg-[#6B2D38]/5 z-20'
          : 'hover:ring-1 hover:ring-[#1C1917]/30 z-10'
      }`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        minWidth: '90px',
        minHeight: '24px',
        transform: `translate(-50%, -50%) rotate(${caption.rotation}deg)`
      }}
    >
      {isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center shadow-md hover:bg-red-800"
          title="Remove Caption"
          aria-label="Remove Caption"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
