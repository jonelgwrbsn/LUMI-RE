import React, { useState } from 'react';
import { Printer, X, HelpCircle } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedDataUrl: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  renderedDataUrl
}) => {
  const [printSize, setPrintSize] = useState<'2x6' | '4x6' | '5x7' | 'a4'>('2x6');
  const [duplexStrip, setDuplexStrip] = useState<boolean>(true);
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Modal Container (Hidden during window.print) */}
      <div className="bg-[#F6F3EC] border border-[#E2DDD3] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 print:hidden">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#6B2D38]" />
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">Print-Ready Physical Output</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8C8275] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-serif font-bold text-[#1C1917] block mb-1.5">
              Target Print Format & Sheet Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintSize('2x6')}
                className={`p-3 text-xs font-semibold rounded-lg border text-left space-y-0.5 transition-colors ${
                  printSize === '2x6'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                <div className="font-bold">2 × 6 in Photo Strip</div>
                <div className="text-[10px] opacity-80 font-mono tabular-nums">600 × 1800 px @ 300 DPI</div>
              </button>

              <button
                type="button"
                onClick={() => setPrintSize('4x6')}
                className={`p-3 text-xs font-semibold rounded-lg border text-left space-y-0.5 transition-colors ${
                  printSize === '4x6'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                <div className="font-bold">4 × 6 in Photo Paper</div>
                <div className="text-[10px] opacity-80 font-mono tabular-nums">1200 × 1800 px @ 300 DPI</div>
              </button>

              <button
                type="button"
                onClick={() => setPrintSize('5x7')}
                className={`p-3 text-xs font-semibold rounded-lg border text-left space-y-0.5 transition-colors ${
                  printSize === '5x7'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                <div className="font-bold">5 × 7 in Gallery Print</div>
                <div className="text-[10px] opacity-80 font-mono tabular-nums">1500 × 2100 px @ 300 DPI</div>
              </button>

              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`p-3 text-xs font-semibold rounded-lg border text-left space-y-0.5 transition-colors ${
                  printSize === 'a4'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                <div className="font-bold">A4 Archival Sheet</div>
                <div className="text-[10px] opacity-80 font-mono tabular-nums">2480 × 3508 px @ 300 DPI</div>
              </button>
            </div>
          </div>

          {(printSize === '4x6' || printSize === 'a4') && (
            <label className="flex items-center justify-between text-xs text-[#1C1917] bg-white p-3 rounded-lg border border-[#E0D8C8] cursor-pointer">
              <span>Duplicate 2-Up Side-by-Side (Ideal for cutting strips)</span>
              <input
                type="checkbox"
                checked={duplexStrip}
                onChange={(e) => setDuplexStrip(e.target.checked)}
                className="w-4 h-4 accent-[#6B2D38]"
              />
            </label>
          )}

          <label className="flex items-center justify-between text-xs text-[#1C1917] bg-white p-3 rounded-lg border border-[#E0D8C8] cursor-pointer">
            <span>Include Trim & Safe Margin Guides</span>
            <input
              type="checkbox"
              checked={showCutGuides}
              onChange={(e) => setShowCutGuides(e.target.checked)}
              className="w-4 h-4 accent-[#6B2D38]"
            />
          </label>

          {/* Technical Specs Note */}
          <div className="p-3 bg-[#EFECE3] text-xs text-[#6B6458] rounded-lg border border-[#E0D8C8] space-y-1">
            <p className="font-semibold text-[#1C1917] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>DPI & Simulated Paper Notice</span>
            </p>
            <p className="leading-relaxed text-[11px]">
              Compositions render directly from high-resolution source frames. Simulated paper stock colors and textures appear in the print master, while physical gloss or matte sheen is determined by your printer paper stock.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DDD3]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[#575249]">
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Open Print Dialog</span>
          </button>
        </div>
      </div>

      {/* Printable Area (Visible only during window.print) */}
      <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:items-center print:justify-center print:p-6 z-50">
        {(printSize === '4x6' || printSize === 'a4') && duplexStrip ? (
          <div className="flex items-center gap-6">
            <img
              src={renderedDataUrl}
              alt="Print Strip Left"
              className={`max-h-[90vh] w-auto object-contain ${
                showCutGuides ? 'border border-dashed border-stone-400 p-1' : ''
              }`}
            />
            <img
              src={renderedDataUrl}
              alt="Print Strip Right"
              className={`max-h-[90vh] w-auto object-contain ${
                showCutGuides ? 'border border-dashed border-stone-400 p-1' : ''
              }`}
            />
          </div>
        ) : (
          <img
            src={renderedDataUrl}
            alt="Print Composition Single"
            className={`max-h-[92vh] max-w-[92vw] w-auto object-contain ${
              showCutGuides ? 'border border-dashed border-stone-400 p-1' : ''
            }`}
          />
        )}
      </div>
    </div>
  );
};
