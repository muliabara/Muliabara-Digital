import React, { useRef, useState } from 'react';
import { P2HFormRecord, AppSettings } from '../types/p2h';
import { 
  DRIVER_CONDITIONS, 
  CRITICAL_INSPECTIONS, 
  NON_CRITICAL_INSPECTIONS 
} from '../data/checklistConfig';
import { Printer, ArrowLeft, Download, Check, Loader2 } from 'lucide-react';

interface OfficialPdfPrintViewProps {
  form: P2HFormRecord;
  settings?: AppSettings;
  onClose: () => void;
}

export const OfficialPdfPrintView: React.FC<OfficialPdfPrintViewProps> = ({
  form,
  settings,
  onClose
}) => {
  const printDocRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printDocRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Dynamic import of html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: [4, 4, 4, 4] as [number, number, number, number],
        filename: `FORM_P2H_EV_LV_${form.unitNumber}_${form.date}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(printDocRef.current).save();
    } catch (err) {
      console.error('Gagal generate PDF via html2pdf, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const companyName = settings?.companyName || 'SUN MOBILITY';
  const tagline = settings?.tagline || 'LIGHT VEHICLE EV FLEET';

  const hasActiveAbnormalCrit = CRITICAL_INSPECTIONS.some(
    item => form.inspections[item.id]?.status === 'abnormal' && !form.inspections[item.id]?.isClosed
  );
  const hasActiveAbnormalNonCrit = NON_CRITICAL_INSPECTIONS.some(
    item => form.inspections[item.id]?.status === 'abnormal' && !form.inspections[item.id]?.isClosed
  );
  const hasActiveDriverFinding = Boolean(form.driverFindingNotes && !form.driverFindingIsClosed);
  const isAllRepairedAndClosed = !hasActiveAbnormalCrit && !hasActiveAbnormalNonCrit && !hasActiveDriverFinding;

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Top action bar - Hidden during print */}
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Aplikasi
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download File PDF (FORM P2H EV_LV)
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak (Print)
          </button>
        </div>
      </div>

      {/* Sheet Container: Exact 1:1 replica of F-QHSE-OPS-MOB-09 */}
      <div 
        ref={printDocRef}
        id="p2h-printable-document"
        className="max-w-[210mm] mx-auto bg-white p-4 md:p-8 border border-slate-300 shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none text-[10px] leading-tight"
      >
        
        {/* Document Header Box */}
        <div className="border-2 border-black grid grid-cols-12 mb-1">
          {/* Form Code */}
          <div className="col-span-3 border-r-2 border-black p-2 flex flex-col justify-center">
            <span className="font-bold text-xs">{form.docNumber}</span>
            <span className="text-[9px] text-slate-600 mt-0.5 font-mono">STANDAR K3 & FLEET EV</span>
          </div>

          {/* Form Title */}
          <div className="col-span-6 border-r-2 border-black p-2 text-center flex flex-col justify-center">
            <h1 className="font-extrabold text-sm uppercase tracking-wide">
              PELAKSANAAN PERAWATAN HARIAN ( P2H )
            </h1>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-800">
              LIGHT VEHICLE EV
            </p>
          </div>

          {/* Brand Logo Box */}
          <div className="col-span-3 p-2 text-center flex flex-col items-center justify-center bg-slate-50">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="max-h-8 max-w-full object-contain mb-0.5" />
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm tracking-widest text-slate-900">{companyName.split(' ')[0]}</span>
                <span className="font-semibold text-xs text-sky-700">{companyName.split(' ').slice(1).join(' ')}</span>
              </div>
            )}
            <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase">{tagline}</span>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="border-2 border-black border-t-0 grid grid-cols-12 mb-1">
          {/* Left Column */}
          <div className="col-span-6 border-r-2 border-black">
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-28 font-bold">Nama :</span>
              <span className="font-semibold">{form.operatorName}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-28 font-bold">Hari / Tanggal :</span>
              <span className="font-semibold">{form.date}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-28 font-bold">Shift :</span>
              <span className="font-semibold">{form.shift}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-28 font-bold">Lokasi Kerja :</span>
              <span className="font-semibold truncate">{form.workLocation}</span>
            </div>
            <div className="px-2 py-1 flex">
              <span className="w-28 font-bold">Job Site :</span>
              <span className="font-semibold truncate">{form.jobSite}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-6">
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-36 font-bold">Tipe Alat :</span>
              <span className="font-semibold">{form.equipmentType}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-36 font-bold">Model Unit :</span>
              <span className="font-semibold">{form.unitModel}</span>
            </div>
            <div className="border-b border-black px-2 py-1 flex">
              <span className="w-36 font-bold">No Unit / Lambung :</span>
              <span className="font-bold font-mono">{form.unitNumber}</span>
            </div>
            <div className="border-b border-black px-2 py-1 grid grid-cols-2">
              <div>
                <span className="font-bold">HM/KM Awal : </span>
                <span className="font-mono">{form.startKm}</span>
              </div>
              <div>
                <span className="font-bold">HM/KM Akhir : </span>
                <span className="font-mono">{form.endKm}</span>
              </div>
            </div>
            <div className="px-2 py-1 flex">
              <span className="w-36 font-bold">Expired Date Stiker SKO :</span>
              <span className="font-mono">{form.skoExpiryDate}</span>
            </div>
          </div>
        </div>

        {/* Energy Telemetry Resume Box */}
        <div className="border-2 border-black border-t-0 p-1.5 bg-slate-50 text-[9.5px] grid grid-cols-5 gap-2 mb-1">
          <div>
            <span className="font-bold block text-slate-600">Jarak Tempuh (ΔKM):</span>
            <span className="font-bold font-mono text-xs">{form.totalKm} KM</span>
          </div>
          <div>
            <span className="font-bold block text-slate-600">SOC Awal → Akhir:</span>
            <span className="font-mono font-bold text-xs">{form.startSoc}% → {form.endSoc}%</span>
          </div>
          <div>
            <span className="font-bold block text-slate-600">% Baterai Terpakai:</span>
            <span className="font-mono font-bold text-xs">{form.batteryUsedPercent}%</span>
          </div>
          <div>
            <span className="font-bold block text-slate-600">Konversi Energi:</span>
            <span className="font-mono font-bold text-xs text-sky-800">{form.energyConsumedKwh} kWh</span>
          </div>
          <div>
            <span className="font-bold block text-slate-600">Laju Efisiensi:</span>
            <span className="font-mono font-bold text-xs text-emerald-800">{form.consumptionRateKwhPerKm} kWh/km</span>
          </div>
        </div>

        {/* Keterangan Instruction Box */}
        <div className="border-2 border-black border-t-0 p-1 text-[8.5px] mb-1 bg-slate-50/50">
          <span className="font-bold">Keterangan:</span>
          <span className="ml-2">1. Beri tanda V pada kolom yang sesuai</span>
          <span className="ml-4">2. Kolom "Keterangan" memuat penjelasan item pernyataan / item periksa yang terkait</span>
        </div>

        {/* SECTION A: KONDISI DRIVER (FIT TO WORK) */}
        <div className="border-2 border-black mb-1">
          <div className="bg-slate-200 border-b border-black px-2 py-1 flex items-center justify-between font-bold">
            <span className="text-[10px]">A. KONDISI DRIVER (FIT TO WORK)</span>
            <span className="text-[9px] text-red-700 font-extrabold uppercase">
              STOP BEKERJA JIKA TERDAPAT JAWABAN "TIDAK"
            </span>
          </div>

          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="w-8 py-0.5 px-2 text-center border-r border-black">No</th>
                <th className="py-0.5 px-2 border-r border-black">Item Pemeriksaan</th>
                <th className="w-10 py-0.5 px-1 text-center border-r border-black">Ya</th>
                <th className="w-10 py-0.5 px-1 text-center border-r border-black">Tidak</th>
                <th className="w-48 py-0.5 px-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/40">
              {DRIVER_CONDITIONS.map(item => {
                const answer = form.driverCondition?.items[item.id] || 'ya';
                const isYes = answer === 'ya';
                return (
                  <tr key={item.id} className="leading-tight">
                    <td className="py-0.5 px-2 text-center font-mono font-bold border-r border-black">
                      {item.code}
                    </td>
                    <td className="py-0.5 px-2 border-r border-black">
                      <span className="font-bold">{item.label}</span>
                      {item.id === 'drv_1' && (
                        <div className="text-[8px] text-slate-700 font-mono mt-0.5">
                          a. Expired ID Card: {form.driverCondition?.idCardExpiry || '-'} · b. Expired SIMPER: {form.driverCondition?.simperExpiry || '-'}
                        </div>
                      )}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black">
                      {isYes ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black text-red-600">
                      {!isYes ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-2 truncate">
                      {form.driverCondition?.notes[item.id] || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION B: PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM */}
        <div className="border-2 border-black mb-1">
          <div className="bg-slate-200 border-b border-black px-2 py-1 flex items-center justify-between font-bold">
            <span className="text-[10px]">B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM</span>
            <span className="text-[9px] text-red-700 font-extrabold uppercase">
              STOP BEKERJA JIKA TERDAPAT JAWABAN "ABNORMAL"
            </span>
          </div>

          <table className="w-full text-left text-[8.5px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="w-8 py-0.5 px-2 text-center border-r border-black">No</th>
                <th className="py-0.5 px-2 border-r border-black">Item Pemeriksaan Kritis</th>
                <th className="w-12 py-0.5 px-1 text-center border-r border-black">Normal</th>
                <th className="w-14 py-0.5 px-1 text-center border-r border-black">Abnormal</th>
                <th className="w-48 py-0.5 px-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {CRITICAL_INSPECTIONS.map(item => {
                const insp = form.inspections[item.id];
                const isClosed = Boolean(insp?.isClosed);
                const status = insp?.status || 'normal';
                // Jika sudah dilakukan perbaikan dan Close, statusnya kembali ke normal dari abnormal
                const isNormal = status === 'normal' || isClosed;
                return (
                  <tr key={item.id} className="leading-tight">
                    <td className="py-0.5 px-2 text-center font-mono font-bold border-r border-black">
                      {item.code}
                    </td>
                    <td className="py-0.5 px-2 border-r border-black">
                      <span className="font-semibold">{item.label}</span>
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black">
                      {isNormal ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black text-red-600">
                      {!isNormal ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-2 truncate">
                      {insp?.notes 
                        ? (isClosed ? `${insp.notes} (Perbaikan Selesai / Closed)` : insp.notes)
                        : (isClosed ? '(Perbaikan Selesai / Closed)' : '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION C: PEMERIKSAAN ITEM NON KRITIS */}
        <div className="border-2 border-black mb-1">
          <div className="bg-slate-200 border-b border-black px-2 py-1 flex items-center justify-between font-bold">
            <span className="text-[10px]">C. PEMERIKSAAN ITEM NON KRITIS</span>
            <span className="text-[8px] text-slate-800 uppercase">
              MENGIKUTI REKOMENDASI DARI MEKANIK JIKA TERDAPAT JAWABAN "ABNORMAL" - (WAJIB DIPERBAIKI DALAM 1x24 JAM)
            </span>
          </div>

          <table className="w-full text-left text-[8.5px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold">
                <th className="w-8 py-0.5 px-2 text-center border-r border-black">No</th>
                <th className="py-0.5 px-2 border-r border-black">Item Pemeriksaan Non Kritis</th>
                <th className="w-12 py-0.5 px-1 text-center border-r border-black">Normal</th>
                <th className="w-14 py-0.5 px-1 text-center border-r border-black">Abnormal</th>
                <th className="w-48 py-0.5 px-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/30">
              {NON_CRITICAL_INSPECTIONS.map(item => {
                const insp = form.inspections[item.id];
                const isClosed = Boolean(insp?.isClosed);
                const status = insp?.status || 'normal';
                // Jika sudah dilakukan perbaikan dan Close, statusnya kembali ke normal dari abnormal
                const isNormal = status === 'normal' || isClosed;
                return (
                  <tr key={item.id} className="leading-tight">
                    <td className="py-0.5 px-2 text-center font-mono font-bold border-r border-black">
                      {item.code}
                    </td>
                    <td className="py-0.5 px-2 border-r border-black">
                      <span className="font-semibold">{item.label}</span>
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black">
                      {isNormal ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold border-r border-black text-amber-600">
                      {!isNormal ? 'V' : ''}
                    </td>
                    <td className="py-0.5 px-2 truncate">
                      {insp?.notes 
                        ? (isClosed ? `${insp.notes} (Perbaikan Selesai / Closed)` : insp.notes)
                        : (isClosed ? '(Perbaikan Selesai / Closed)' : '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Catatan Temuan Driver & Status Perbaikan */}
        {form.driverFindingNotes && (
          <div className="border-2 border-black border-b-0 p-1.5 mb-1 text-[8.5px] bg-slate-50">
            <span className="font-bold">Catatan Temuan Driver: </span>
            <span className="italic font-medium">"{form.driverFindingNotes}"</span>
            <span className={`ml-2 font-bold px-1.5 py-0.5 rounded text-[8px] ${
              form.driverFindingIsClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {form.driverFindingIsClosed ? '✓ PERBAIKAN SELESAI (CLOSED)' : 'PERLU TINDAK LANJUT (OPEN)'}
            </span>
          </div>
        )}

        {/* Mechanic Recommendation & Operator Commitment Statement */}
        <div className="border-2 border-black p-1.5 mb-1 text-[9px]">
          <div className="font-bold mb-1">
            Rekomendasi Mekanik (jika ditemukan kerusakan / Abnormal):
          </div>
          <div className="flex items-center gap-4 mb-1">
            <span className="font-bold">
              Status Operasi:
              {form.mechanicRecommendation.status === 'stop_operation' && !isAllRepairedAndClosed ? (
                <span className="ml-1 text-red-700 font-extrabold uppercase">[ STOP / DILARANG BEROPERASI ]</span>
              ) : isAllRepairedAndClosed ? (
                <span className="ml-1 text-emerald-800 font-extrabold uppercase">[ TETAP BEROPERASI / LAIK JALAN (PERBAIKAN SELESAI) ]</span>
              ) : (
                <span className="ml-1 text-emerald-800 font-extrabold uppercase">[ TETAP BEROPERASI ]</span>
              )}
            </span>
            <span className="text-slate-700">
              Alasan: {isAllRepairedAndClosed && form.mechanicRecommendation.status === 'stop_operation'
                ? 'Seluruh perbaikan telah selesai dilakukan. Unit dinyatakan normal dan laik operasi.'
                : (form.mechanicRecommendation.reason || 'Pemeriksaan normal. Unit laik jalan.')}
            </span>
          </div>

          <p className="italic text-[8.5px] text-slate-800 border-t border-black/40 pt-1 mt-1">
            "Pengisian formulir P2H ini saya lakukan dengan benar dan saya berkomitmen melakukan pekerjaan dengan aman, sehat dan selamat."
          </p>
        </div>

        {/* 3-Column Official Signatures Block: Operator, Foreman, Mekanik */}
        <div className="border-2 border-black grid grid-cols-3 text-center text-[9.5px]">
          {/* Operator Signature */}
          <div className="border-r border-black p-2 flex flex-col justify-between h-28">
            <span className="font-bold">Tanda Tangan Operator</span>
            <div className="flex items-center justify-center my-1">
              {form.operatorSignature?.signatureUrl ? (
                <img
                  src={form.operatorSignature.signatureUrl}
                  alt="TTD Operator"
                  referrerPolicy="no-referrer"
                  className="max-h-12 max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 italic text-[8.5px]">Belum ditandatangani</span>
              )}
            </div>
            <div className="text-left border-t border-black/40 pt-1">
              <div>Nama : <strong className="font-mono">{form.operatorName}</strong></div>
              <div>NIK : <span className="font-mono">{form.operatorNik}</span></div>
            </div>
          </div>

          {/* Foreman Signature */}
          <div className="border-r border-black p-2 flex flex-col justify-between h-28 bg-slate-50/30">
            <span className="font-bold">Diketahui & Disetujui (Foreman)</span>
            <div className="flex items-center justify-center my-1 flex-1">
              {form.foremanApproval.status === 'approved' && form.foremanApproval.signatureUrl ? (
                <img
                  src={form.foremanApproval.signatureUrl}
                  alt="TTD Foreman"
                  referrerPolicy="no-referrer"
                  className="max-h-12 max-w-full object-contain"
                />
              ) : (
                <div className="border border-dashed border-amber-300 bg-amber-50/50 rounded px-2 py-1 text-center">
                  <span className="text-amber-800 italic text-[8px] font-semibold block">
                    Menunggu Approval
                  </span>
                  <span className="text-slate-400 text-[7px] block">
                    (Belum Disetujui)
                  </span>
                </div>
              )}
            </div>
            <div className="text-left border-t border-black/40 pt-1">
              <div>Nama : <strong className="font-mono">{form.foremanApproval.status === 'approved' ? (form.foremanApproval.foremanName || '-') : '-'}</strong></div>
              <div>NIK : <span className="font-mono">{form.foremanApproval.status === 'approved' ? (form.foremanApproval.foremanNik || '-') : '-'}</span></div>
            </div>
          </div>

          {/* Mechanic Signature */}
          <div className="p-2 flex flex-col justify-between h-28">
            <span className="font-bold">Disetujui Teknis (Mekanik)</span>
            <div className="flex items-center justify-center my-1 flex-1">
              {form.mechanicRecommendation.signatureUrl && form.mechanicRecommendation.status !== 'pending' ? (
                <img
                  src={form.mechanicRecommendation.signatureUrl}
                  alt="TTD Mekanik"
                  referrerPolicy="no-referrer"
                  className="max-h-12 max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 italic text-[8px] text-center">
                  {form.mechanicRecommendation.status === 'stop_operation' ? 'Unit Dilarang Operasi' : 'Pemeriksaan Berkala Sesuai Jadwal'}
                </span>
              )}
            </div>
            <div className="text-left border-t border-black/40 pt-1">
              <div>Nama : <strong className="font-mono">{form.mechanicRecommendation.mechanicName || '-'}</strong></div>
              <div>NIK : <span className="font-mono">{form.mechanicRecommendation.mechanicNik || '-'}</span></div>
            </div>
          </div>
        </div>

        {/* Footer print stamp */}
        <div className="flex items-center justify-between text-[8px] text-slate-500 mt-2 font-mono">
          <span>Dicetak melalui Sistem JAC T9 EV P2H Digital & Telemetri Perawatan</span>
          <span>Dokumen K3 {form.docNumber} · Status: {isAllRepairedAndClosed ? 'APPROVED / LAIK OPERASI (PERBAIKAN SELESAI)' : form.overallStatus.toUpperCase()}</span>
          <span>ID: {form.id}</span>
        </div>
      </div>
    </div>
  );
};
