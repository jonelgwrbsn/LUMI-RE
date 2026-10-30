import React, { useState } from 'react';
import { Download, X, Image as ImageIcon } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedDataUrl: string;
  canvas: HTMLCanvasElement | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  renderedDataUrl,
  canvas
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [filename, setFilename] = useState<string>('Lumiere_Photo_Strip_2026');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      let exportUrl = renderedDataUrl;

      if (canvas) {
        exportUrl =
          format === 'jpeg'
            ? canvas.toDataURL('image/jpeg', 0.95)
            : canvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      link.download = `${filename.trim() || 'Photo_Strip'}.${format}`;
      link.href = exportUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F6F3EC] border border-[#E2DDD3] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#6B2D38]" />
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1917]">
                Download High-Res Composition
              </h3>
              {canvas && (
                <p className="text-[11px] font-mono text-[#6B6458] tabular-nums">
                  Master Output: {canvas.width} × {canvas.height} px
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8C8275] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Frame */}
        <div className="bg-stone-900 p-3 rounded-lg flex items-center justify-center max-h-48 overflow-hidden">
          <img
            src={renderedDataUrl}
            alt="Export Preview"
            className="max-h-40 w-auto object-contain rounded"
          />
        </div>

        {/* Export Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-serif font-bold text-[#1C1917] block mb-1">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                  format === 'png'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                Lossless PNG
              </button>
              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                  format === 'jpeg'
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-[#575249] border-[#E0D8C8]'
                }`}
              >
                High Quality JPEG
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-serif font-bold text-[#1C1917] block mb-1">
              File Name
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E0D8C8] rounded-md font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DDD3]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#575249] hover:text-[#1C1917]"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Save to Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};
