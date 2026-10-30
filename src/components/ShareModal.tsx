import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, X, Copy, Check, QrCode, AlertCircle, Trash2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedDataUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  renderedDataUrl
}) => {
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && renderedDataUrl && !shareId) {
      uploadAndGenerateQR();
    }
  }, [isOpen, renderedDataUrl]);

  const uploadAndGenerateQR = async () => {
    setIsUploading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: renderedDataUrl,
          title: 'Analogue Photo Strip'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create share link');
      }

      setShareId(data.id);
      setShareUrl(data.shareUrl);

      // Render QR code SVG/Canvas data URL
      const qrData = await QRCode.toDataURL(data.shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrData);
    } catch (err: unknown) {
      console.error('Error generating share QR:', err);
      const errObj = err as { message?: string };
      setErrorMsg(errObj.message || 'Could not connect to share endpoint.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteShare = async () => {
    if (!shareId) return;
    try {
      await fetch(`/api/share/${shareId}`, { method: 'DELETE' });
      setShareId(null);
      setShareUrl('');
      setQrCodeDataUrl('');
      onClose();
    } catch (err) {
      console.error('Delete share error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F6F3EC] border border-[#E2DDD3] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#6B2D38]" />
            <h3 className="text-lg font-serif font-bold text-[#1C1917]">Public Share & QR Code</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8C8275] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isUploading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#575249]">Generating secure share endpoint & QR code...</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Share Error</span>
            </div>
            <p>{errorMsg}</p>
            <button
              onClick={uploadAndGenerateQR}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 font-semibold rounded"
            >
              Retry Share
            </button>
          </div>
        )}

        {!isUploading && qrCodeDataUrl && (
          <div className="space-y-5 text-center">
            {/* Generated QR Code Image */}
            <div className="bg-white p-4 rounded-xl border border-[#E0D8C8] shadow-sm inline-block mx-auto">
              <img src={qrCodeDataUrl} alt="Share QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#575249]">
                Scan with any mobile camera to open and download this photo strip.
              </p>

              {/* Share URL Box */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E0D8C8]">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs font-mono text-[#1C1917] bg-transparent outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#6B2D38] rounded transition-colors flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Direct Open Link */}
            <div className="pt-2 border-t border-[#E2DDD3] flex items-center justify-between text-xs text-[#6B6458]">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 font-semibold text-[#1C1917]"
              >
                <span>Open Share Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleDeleteShare}
                className="text-red-700 hover:text-red-900 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Upload</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
