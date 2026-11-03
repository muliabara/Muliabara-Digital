import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, Upload, Image as ImageIcon } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title: string;
  signerName: string;
  signerRole: string;
  initialSignatureUrl?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  signerName,
  signerRole,
  initialSignatureUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'draw' | 'upload' | 'preset'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialSignatureUrl || null);

  useEffect(() => {
    if (isOpen) {
      if (initialSignatureUrl && !initialSignatureUrl.startsWith('data:image/svg+xml;utf8,<svg')) {
        setUploadedImage(initialSignatureUrl);
        setMode('upload');
      } else {
        setUploadedImage(null);
        setMode('draw');
      }
      setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          setHasDrawn(false);
        }
      }, 50);
    }
  }, [isOpen, initialSignatureUrl]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (mode === 'upload' && uploadedImage) {
      onSave(uploadedImage);
      onClose();
      return;
    }

    if (mode === 'preset') {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120">
          <rect width="100%" height="100%" fill="none" />
          <path d="M 20 80 Q 70 20 120 70 T 220 50 T 280 85" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
          <text x="150" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">${signerName}</text>
          <text x="150" y="118" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${signerRole} - VERIFIED</text>
        </svg>
      `;
      const encoded = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      onSave(encoded);
      onClose();
      return;
    }

    if (canvasRef.current && hasDrawn) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penandatangan: <strong className="text-slate-800">{signerName}</strong> ({signerRole})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Mode Switcher */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-1 mb-4 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Goreskan
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Gambar TTD
            </button>
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'preset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Format Otomatis
            </button>
          </div>

          {/* Mode 1: Draw Canvas */}
          {mode === 'draw' && (
            <div>
              <div className="relative border border-slate-300 rounded-lg bg-white overflow-hidden touch-none">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  className="w-full h-44 bg-white cursor-crosshair block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] text-slate-400 font-mono">
                  Area Gores Tanda Tangan Resmi
                </div>
              </div>

              <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500">
                <span>Gunakan mouse, stylus, atau sentuhan jari di layar.</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Hapus Goresan
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Upload Signature Image */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition-all text-center">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-sky-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  Pilih file gambar tanda tangan (PNG / JPG / SVG)
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Disarankan background transparan atau kertas putih bersih
                </span>
              </label>

              {uploadedImage && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden p-1">
                      <img
                        src={uploadedImage}
                        alt="Preview TTD"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Gambar TTD Terpilih</span>
                      <span className="text-emerald-600 font-medium text-[11px]">Siap digunakan</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Automatic Digital Stamp */}
          {mode === 'preset' && (
            <div className="w-full h-44 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/40 flex flex-col items-center justify-center p-4">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider mb-1">
                Tanda Tangan Digital Terverifikasi Sistem
              </span>
              <p className="text-2xl font-serif italic text-sky-900 tracking-wide mt-2">
                {signerName || 'Tanda Tangan'}
              </p>
              <span className="text-xs text-slate-500 mt-2 font-mono">
                {signerRole} · Dokumen K3 F-QHSE-OPS-MOB-09
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mode === 'draw' ? !hasDrawn : mode === 'upload' ? !uploadedImage : false}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            Terapkan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};
