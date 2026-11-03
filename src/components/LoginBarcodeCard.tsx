import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { AppSettings, UserProfile } from '../types/p2h';
import { realtimeSync } from '../services/realtimeSync';
import { getGlassCardClass } from '../utils/glass';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Pencil, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  RotateCcw, 
  Camera, 
  CheckCircle2, 
  X,
  FileCheck,
  Building2,
  Info
} from 'lucide-react';

interface LoginBarcodeCardProps {
  settings?: AppSettings;
  currentUser?: UserProfile;
  isAdmin: boolean;
  onUpdateSettings?: (settings: AppSettings) => void;
}

const DEFAULT_BARCODE_TEXTS = {
  badge: 'PT MULIABARA MINING · SISTEM K3 EV',
  title: 'Scan Barcode untuk Masuk Halaman Login P2H',
  subtitle: 'Arahkan kamera smartphone ke kode QR ini untuk langsung membuka formulir login pemeriksaan harian JAC T9 EV di site tambang.',
  footer: 'JAC T9 EV 4x4 Double Cabin · Unit Fleet Operasional Tambang Kutai',
  customUrl: ''
};

export const LoginBarcodeCard: React.FC<LoginBarcodeCardProps> = ({
  settings,
  currentUser,
  isAdmin,
  onUpdateSettings
}) => {
  const glassCard = getGlassCardClass(settings);

  // Active texts from settings with fallback
  const badgeText = settings?.loginBarcodeBadge?.trim() || DEFAULT_BARCODE_TEXTS.badge;
  const titleText = settings?.loginBarcodeTitle?.trim() || DEFAULT_BARCODE_TEXTS.title;
  const subtitleText = settings?.loginBarcodeSubtitle?.trim() || DEFAULT_BARCODE_TEXTS.subtitle;
  const footerText = settings?.loginBarcodeFooter?.trim() || DEFAULT_BARCODE_TEXTS.footer;
  const customUrl = settings?.loginBarcodeCustomUrl?.trim() || '';

  // Calculate the target login URL
  const targetLoginUrl = React.useMemo(() => {
    if (customUrl) return customUrl;
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/?page=login`;
    }
    return 'https://ais-dev-mtpj5a5kmr5qtovgfvpp5l-809047699360.asia-northeast1.run.app/?page=login';
  }, [customUrl]);

  // QR Code Data URL state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBadge, setEditBadge] = useState(badgeText);
  const [editTitle, setEditTitle] = useState(titleText);
  const [editSubtitle, setEditSubtitle] = useState(subtitleText);
  const [editFooter, setEditFooter] = useState(footerText);
  const [editCustomUrl, setEditCustomUrl] = useState(customUrl);

  // Copy feedback state
  const [copied, setCopied] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Hidden Canvas for High-Resolution Card Export
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR Code data URL when targetLoginUrl changes
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingQr(true);

    QRCode.toDataURL(targetLoginUrl, {
      width: 480,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetLoginUrl]);

  // Open Edit Modal and sync inputs
  const handleOpenEdit = () => {
    if (!isAdmin) {
      alert('Hanya Master Admin yang berwenang mengubah keterangan teks barcode login.');
      return;
    }
    setEditBadge(badgeText);
    setEditTitle(titleText);
    setEditSubtitle(subtitleText);
    setEditFooter(footerText);
    setEditCustomUrl(customUrl);
    setIsEditModalOpen(true);
  };

  // Save changes to settings & Firestore
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings || !settings) {
      alert('Gagal menyimpan: Pengaturan tidak tersedia.');
      return;
    }

    const updatedSettings: AppSettings = {
      ...settings,
      loginBarcodeBadge: editBadge.trim() || DEFAULT_BARCODE_TEXTS.badge,
      loginBarcodeTitle: editTitle.trim() || DEFAULT_BARCODE_TEXTS.title,
      loginBarcodeSubtitle: editSubtitle.trim() || DEFAULT_BARCODE_TEXTS.subtitle,
      loginBarcodeFooter: editFooter.trim() || DEFAULT_BARCODE_TEXTS.footer,
      loginBarcodeCustomUrl: editCustomUrl.trim()
    };

    onUpdateSettings(updatedSettings);
    realtimeSync.pushUpdate({ settings: updatedSettings });

    setIsEditModalOpen(false);
    setSaveSuccessMsg('Keterangan Barcode berhasil diperbarui dan disinkronkan ke seluruh perangkat!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Reset to default texts
  const handleResetDefaults = () => {
    setEditBadge(DEFAULT_BARCODE_TEXTS.badge);
    setEditTitle(DEFAULT_BARCODE_TEXTS.title);
    setEditSubtitle(DEFAULT_BARCODE_TEXTS.subtitle);
    setEditFooter(DEFAULT_BARCODE_TEXTS.footer);
    setEditCustomUrl('');
  };

  // Copy Login URL to Clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = targetLoginUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Generate & Download High-Resolution Printable PNG Card
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    const width = 900;
    const height = 1260;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper to wrap text
    const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
      const words = text.split(' ');
      let line = '';
      let curY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          context.fillText(line.trim(), x, curY);
          line = words[n] + ' ';
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line.trim(), x, curY);
      return curY + lineHeight;
    };

    // 1. White Background with subtle rounded border frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle outer frame
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 2. Header Banner: Industrial Dark Slate with Cyan Accent Strip
    const headerGrad = ctx.createLinearGradient(0, 20, width, 200);
    headerGrad.addColorStop(0, '#0f172a');
    headerGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(20, 20, width - 40, 160);

    // Cyan accent bar under header
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(20, 176, width - 40, 6);

    // Company Badge in Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText.toUpperCase(), width / 2, 68);

    // System Title in Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('JAC T9 EV · SISTEM P2H DIGITAL', width / 2, 114);

    // Doc code pill
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('STANDAR OPERASIONAL PROSEDUR K3 & FLEET MANAGEMENT', width / 2, 150);

    // 3. Main Title (Editable)
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const titleY = 236;
    const nextY = wrapText(ctx, titleText, width / 2, titleY, width - 120, 38);

    // 4. Subtitle / Instruction (Editable)
    ctx.fillStyle = '#475569';
    ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
    wrapText(ctx, subtitleText, width / 2, nextY + 6, width - 140, 28);

    // 5. QR Code Box Container
    const qrBoxSize = 460;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 380;

    // QR Box background & shadow
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
    ctx.fill();
    ctx.stroke();

    // Corner Target Reticles (Viewfinder style)
    const reticleLen = 32;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + 16 + reticleLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + 16 + reticleLen, qrBoxY + 16);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - reticleLen, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + 16 + reticleLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16 - reticleLen);
    ctx.lineTo(qrBoxX + 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + 16 + reticleLen, qrBoxY + qrBoxSize - 16);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxSize - 16 - reticleLen, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16);
    ctx.lineTo(qrBoxX + qrBoxSize - 16, qrBoxY + qrBoxSize - 16 - reticleLen);
    ctx.stroke();

    // Draw QR Code Image into canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const qrInnerPadding = 30;
      ctx.drawImage(
        img,
        qrBoxX + qrInnerPadding,
        qrBoxY + qrInnerPadding,
        qrBoxSize - qrInnerPadding * 2,
        qrBoxSize - qrInnerPadding * 2
      );

      // Center EV badge over QR
      const centerBadgeSize = 64;
      const centerBadgeX = width / 2 - centerBadgeSize / 2;
      const centerBadgeY = qrBoxY + qrBoxSize / 2 - centerBadgeSize / 2;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(centerBadgeX, centerBadgeY, centerBadgeSize, centerBadgeSize, 12);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EV', width / 2, centerBadgeY + 38);

      // 6. Barcode Code 128 Strip Simulation below QR Box
      const stripY = qrBoxY + qrBoxSize + 28;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(140, stripY, width - 280, 72, 12);
      ctx.fill();
      ctx.stroke();

      // Stylized barcode bars
      ctx.fillStyle = '#0f172a';
      const barStartX = 180;
      const barEndX = width - 180;
      const barW = barEndX - barStartX;
      const barCount = 45;
      const step = barW / barCount;
      const pattern = [2, 4, 1, 3, 5, 2, 1, 4, 2, 3, 1, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 4, 1, 2, 5, 3, 1, 4, 2, 1, 3, 5, 2, 4, 1, 2, 3, 4, 1, 5, 2, 1, 4, 3];
      for (let i = 0; i < barCount; i++) {
        const thickness = pattern[i % pattern.length];
        ctx.fillRect(barStartX + i * step, stripY + 12, thickness, 30);
      }

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('* JAC-T9-P2H-LOGIN-PORTAL *', width / 2, stripY + 60);

      // 7. Direct URL Display Box
      const urlBoxY = stripY + 92;
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(90, urlBoxY, width - 180, 56, 12);
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Tautan Akses: ${targetLoginUrl}`, width / 2, urlBoxY + 34);

      // 8. 3-Step Simple Instructions
      const instY = urlBoxY + 76;
      ctx.fillStyle = '#64748b';
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('1. Buka Kamera Smartphone  ·  2. Arahkan ke QR Code  ·  3. Ketuk Link untuk Masuk Login', width / 2, instY);

      // 9. Footer Area with Safety & Fleet notice
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, height - 88, width - 40, 68);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(footerText, width / 2, height - 52);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('DOKUMEN RESMI QHSE · SISTEM INSPEKSI KESELAMATAN KENDARAAN LISTRIC TAMBANG', width / 2, height - 30);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `Barcode_Login_P2H_JAC_T9_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = qrDataUrl || '';
  };

  // Direct Print Card
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Barcode & QR Access Center Card */}
      <div className={`${glassCard} p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md`}>
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                PORTAL AKSES LAPANGAN
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                Mobile Driver & Briefing Board
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-sky-600" />
              Barcode Akses Masuk Halaman Login
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak dan tempelkan Barcode ini pada dashboard unit JAC T9 EV atau papan briefing pos tambang agar driver dapat langsung membuka halaman login melalui smartphone.
            </p>
          </div>

          {/* Action Buttons: Edit, Download, Print */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Edit teks keterangan di atas dan di bawah barcode"
              >
                <Pencil className="w-4 h-4 text-sky-600" />
                Edit Keterangan Teks
              </button>
            ) : (
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl"
                title="Hanya Master Admin yang dapat mengubah teks keterangan"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Edit Khusus Admin
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isGeneratingQr || !qrDataUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Unduh Kartu Barcode Format PNG Siap Cetak & Laminating"
            >
              <Download className="w-4 h-4" />
              Unduh Barcode (PNG)
            </button>

            <button
              type="button"
              onClick={handlePrintCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Cetak langsung ke printer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Cetak / Print
            </button>
          </div>
        </div>

        {/* Live Card Preview Box (What you see is what gets printed) */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-2">
          {/* Printable Badge Preview Container */}
          <div 
            id="login-barcode-card-printable" 
            className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden relative"
          >
            {/* Top Brand Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 text-center relative border-b-4 border-sky-500">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-400/40 text-[10px] font-mono font-bold text-sky-300 uppercase tracking-wider mb-1">
                <Building2 className="w-3 h-3 text-sky-400" />
                {badgeText}
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-white uppercase">
                JAC T9 EV · Smart Fleet Management
              </h3>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                DOKUMEN K3: F-QHSE-OPS-MOB-09 · FORMULIR DIGITAL P2H
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 text-sky-300 rounded-lg transition-colors cursor-pointer"
                  title="Klik untuk mengedit keterangan ini"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Editable Title & Subtitle Section */}
            <div className="p-6 text-center space-y-3 relative group">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="absolute top-3 right-3 p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  title="Edit Judul & Petunjuk Barcode"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {titleText}
              </h4>
              
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {subtitleText}
              </p>

              {/* QR Code Graphic Box */}
              <div className="pt-2 pb-1 flex justify-center">
                <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md inline-block">
                  {/* Targeting Reticles */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-sky-600 rounded-tl pointer-events-none" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-sky-600 rounded-tr pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-sky-600 rounded-bl pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-sky-600 rounded-br pointer-events-none" />

                  {isGeneratingQr ? (
                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-xs gap-2">
                      <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Membuat QR Code...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt="QR Code Akses Login P2H JAC T9 EV"
                        className="w-56 h-56 object-contain block mx-auto"
                      />
                      {/* Center EV Badge overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                          EV
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-rose-50 text-rose-600 text-xs">
                      Gagal membuat QR Code
                    </div>
                  )}
                </div>
              </div>

              {/* Code 128 Simulated Barcode Strip */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <div className="h-6 flex items-center justify-center gap-0.5 overflow-hidden px-4 opacity-80">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 h-full"
                      style={{
                        width: `${(i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1)}px`,
                        marginRight: `${(i % 4 === 0 ? 3 : 1)}px`
                      }}
                    />
                  ))}
                </div>
                <span className="block font-mono text-[10px] font-bold text-slate-500 tracking-wider">
                  CODE 128: P2H-JACT9-LOGIN-EV
                </span>
              </div>

              {/* Direct URL Box */}
              <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between gap-2 text-left">
                <div className="truncate min-w-0">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block font-mono">
                    Target URL Login:
                  </span>
                  <span className="text-xs font-mono text-slate-700 truncate block">
                    {targetLoginUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step By Step Instructions */}
              <div className="pt-2 border-t border-slate-100 text-left text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </div>
                  <span>Buka aplikasi Kamera pada ponsel (Android atau iPhone).</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </div>
                  <span>Arahkan kamera ke QR Code di atas hingga muncul pop-up tautan.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </div>
                  <span>Ketuk tautan untuk membuka aplikasi pemeriksaan P2H secara instan.</span>
                </div>
              </div>
            </div>

            {/* Footer Notice of Card */}
            <div className="bg-slate-900 text-slate-300 px-4 py-3 text-center text-[10px] border-t border-slate-800 space-y-0.5">
              <span className="block font-bold text-white uppercase tracking-wider">
                {footerText}
              </span>
              <span className="block text-slate-400 font-mono">
                PT MULIABARA MINING · K3 & FLEET SAFETY MANAGEMENT
              </span>
            </div>
          </div>

          {/* Right Information & Action Panel */}
          <div className="w-full lg:max-w-md space-y-4">
            <div className="p-5 bg-white/80 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-600" />
                Petunjuk Pemasangan & Penggunaan Lapangan
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 space-y-1">
                  <span className="font-bold text-sky-900 block flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-sky-700" />
                    Penempatan di Kendaraan JAC T9 EV:
                  </span>
                  <p className="text-sky-800 leading-relaxed">
                    Cetak kartu ukuran 10x15 cm atau A5, laminating anti-air & anti-debu tambang, kemudian rekatkan pada sudut kanan dashboard kaca depan atau konsol tengah kabin unit JAC T9 EV.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    Penempatan di Papan Briefing / Safety Post:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    Tempelkan pada papan pengumuman K3 di muster point sebelum driver memulai shift (Shift 1 Siang / Shift 2 Malam).
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Sinkronisasi Multi-Device Real-Time:
                  </span>
                  <p className="text-emerald-800 leading-relaxed">
                    Driver yang scan barcode ini akan langsung masuk ke halaman login. Setiap inspeksi P2H yang dikirim dari HP langsung sinkron dengan layar Master Admin & Pengawas di kantor site.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={isGeneratingQr || !qrDataUrl}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Unduh Kartu Barcode (PNG High-Res)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintCard}
                    className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak / Print
                  </button>

                  <a
                    href={targetLoginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka Halaman Login
                  </a>
                </div>
              </div>
            </div>

            {/* Editing Quick Info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Kustomisasi Teks Barcode</span>
                <p className="mt-0.5 text-slate-500">
                  {isAdmin 
                    ? 'Anda login sebagai Master Admin. Anda dapat mengubah judul, instruksi, dan badge di atas barcode kapan saja.'
                    : 'Pengubahan teks di atas barcode dibatasi khusus untuk Master Admin demi menjaga kepatuhan SOP K3.'}
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="mt-2 text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Buka Formulir Edit Teks
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL: Keterangan Barcode (Khusus Master Admin) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Edit Keterangan Teks Barcode Login
                  </h3>
                  <span className="text-[11px] text-sky-300 font-mono">
                    Khusus Hak Akses Master Admin
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Field 1: Label Badge Atas */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Label Badge Perusahaan / K3 (Atas Header)
                </label>
                <input
                  type="text"
                  value={editBadge}
                  onChange={e => setEditBadge(e.target.value)}
                  placeholder="PT MULIABARA MINING · SISTEM K3 EV"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Contoh: PT MULIABARA MINING · SISTEM K3 EV
                </span>
              </div>

              {/* Field 2: Judul Barcode */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. Judul Utama Barcode
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Scan Barcode untuk Masuk Halaman Login P2H"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-bold text-slate-900"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Judul besar yang dibaca pertama kali oleh operator / driver saat melihat kartu.
                </span>
              </div>

              {/* Field 3: Keterangan / Petunjuk Penggunaan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. Keterangan / Petunjuk Pemindaian Barcode
                </label>
                <textarea
                  value={editSubtitle}
                  onChange={e => setEditSubtitle(e.target.value)}
                  rows={3}
                  placeholder="Arahkan kamera smartphone ke kode QR ini untuk langsung membuka formulir login pemeriksaan harian JAC T9 EV di site tambang."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-700"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Penjelasan petunjuk mengarahkan kamera smartphone untuk memindai kode.
                </span>
              </div>

              {/* Field 4: Footer Unit Note */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  4. Keterangan Unit & Armada (Footer Kartu)
                </label>
                <input
                  type="text"
                  value={editFooter}
                  onChange={e => setEditFooter(e.target.value)}
                  placeholder="JAC T9 EV 4x4 Double Cabin · Unit Fleet Operasional Tambang Kutai"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
                />
              </div>

              {/* Field 5: Custom URL (Optional) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Tautan Target Login (Opsional / Otomatis)
                </label>
                <input
                  type="url"
                  value={editCustomUrl}
                  onChange={e => setEditCustomUrl(e.target.value)}
                  placeholder="Biarkan kosong untuk URL otomatis aplikasi (default)"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Kosongkan untuk otomatis menggunakan domain aktif (Google AI Studio atau Netlify).
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Default
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
