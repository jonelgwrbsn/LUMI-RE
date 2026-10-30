import React, { useState, useEffect } from 'react';
import { Download, Printer, Camera, Share2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { SharedStripData } from '../types/photobooth';

interface SharedPageProps {
  shareId: string;
  onStartNewSession: () => void;
}

export const SharedPage: React.FC<SharedPageProps> = ({ shareId, onStartNewSession }) => {
  const [shareData, setShareData] = useState<SharedStripData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetch(`/api/share/${shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Shared photo strip not found or deleted');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.share) {
          setShareData(data.share);
        } else {
          setErrorMsg('Photo strip unavailable');
        }
      })
      .catch((err: unknown) => {
        const errObj = err as { message?: string };
        setErrorMsg(errObj.message || 'Failed to load photo strip');
      })
      .finally(() => setIsLoading(false));
  }, [shareId]);

  const handleDownload = () => {
    if (!shareData) return;
    const link = document.createElement('a');
    link.download = `Lumiere_Photo_Strip_${shareId}.png`;
    link.href = shareData.imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-[#575249]">Retrieving 35mm Photo Strip...</p>
      </div>
    );
  }

  if (errorMsg || !shareData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-[#E0D8C8] shadow-lg text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-xl font-serif font-bold text-[#1C1917]">Photo Strip Unavailable</h2>
        <p className="text-xs text-[#6B6458] leading-relaxed">
          {errorMsg || 'This shared photo strip may have expired or been deleted by its creator.'}
        </p>
        <button
          onClick={onStartNewSession}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-colors inline-flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Create Your Own Photo Strip</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div>
          <div className="text-xs font-mono text-[#6B2D38] uppercase tracking-widest">
            SHARED ANALOG PHOTO STRIP
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1C1917]">
            {shareData.title || 'Studio 35mm Memory'}
          </h1>
          <p className="text-xs text-[#8C8275]">
            Created {new Date(shareData.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-[#1C1917] bg-[#EAE5DA] hover:bg-[#E0D8C8] rounded-md transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Photo Strip Center Box */}
        <div className="md:col-span-7 flex justify-center">
          <div className="bg-stone-900 p-4 rounded-xl shadow-2xl border-4 border-stone-800">
            <img
              src={shareData.imageData}
              alt="Shared Photo Strip"
              className="max-h-[620px] w-auto object-contain rounded-xs shadow-md"
            />
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-5 bg-[#EFECE3] p-6 rounded-2xl border border-[#E0D8C8] space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-serif font-bold text-[#1C1917]">Lumière Photo Booth</h3>
            <p className="text-xs text-[#575249] leading-relaxed">
              This photo strip was taken and custom-styled using the Lumière 35mm Web Photobooth.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E0D8C8] space-y-3">
            <button
              onClick={onStartNewSession}
              className="w-full py-3 text-xs font-bold uppercase font-mono tracking-wider text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Create Your Own Photo Strip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Viewport Container */}
      <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:items-center print:justify-center print:p-8 z-50">
        <img src={shareData.imageData} alt="Shared Print Strip" className="h-[5.8in] w-auto border border-stone-200" />
      </div>
    </div>
  );
};
