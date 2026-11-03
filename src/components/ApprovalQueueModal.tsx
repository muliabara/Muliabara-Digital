import React, { useState } from 'react';
import { P2HFormRecord, UserRole } from '../types/p2h';
import { 
  CRITICAL_INSPECTIONS, 
  NON_CRITICAL_INSPECTIONS, 
  DRIVER_CONDITIONS 
} from '../data/checklistConfig';
import { SignaturePadModal } from './SignaturePadModal';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  PenLine, 
  Clock, 
  Truck, 
  Zap, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';

interface ApprovalQueueModalProps {
  form: P2HFormRecord | null;
  currentUserRole: UserRole;
  onClose: () => void;
  onApprove: (
    formId: string, 
    foremanData: {
      status: 'approved' | 'rejected';
      notes: string;
      foremanName: string;
      foremanNik: string;
      signatureUrl?: string;
    },
    mechanicData?: {
      status: 'continue_operation' | 'stop_operation';
      reason: string;
      mechanicName: string;
      mechanicNik: string;
      signatureUrl?: string;
    }
  ) => void;
}

export const ApprovalQueueModal: React.FC<ApprovalQueueModalProps> = ({
  form,
  currentUserRole,
  onClose,
  onApprove
}) => {
  if (!form) return null;

  // Foreman State
  const [foremanDecision, setForemanDecision] = useState<'approved' | 'rejected'>('approved');
  const [foremanNotes, setForemanNotes] = useState(form.foremanApproval.notes || 'Unit dinyatakan aman dan laik operasi untuk shift ini.');
  const [foremanName, setForemanName] = useState(form.foremanApproval.foremanName || 'Suryadi Pratama');
  const [foremanNik, setForemanNik] = useState(form.foremanApproval.foremanNik || 'FRM-2045');
  const [foremanSignature, setForemanSignature] = useState<string | undefined>(
    form.foremanApproval.signatureUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M15,45 Q60,15 95,50 T160,25 T195,55" fill="none" stroke="%230f172a" stroke-width="3"/></svg>'
  );

  // Mechanic State
  const [mechanicStatus, setMechanicStatus] = useState<'continue_operation' | 'stop_operation'>(
    form.mechanicRecommendation.status === 'stop_operation' ? 'stop_operation' : 'continue_operation'
  );
  const [mechanicReason, setMechanicReason] = useState(
    form.mechanicRecommendation.reason || (form.hasAbnormalCritical 
      ? 'Ditemukan kerusakan kritis. Unit wajib masuk workshop dan dilarang beroperasi.' 
      : 'Semua sistem kelistrikan tegangan tinggi dan keselamatan dalam kondisi normal.')
  );
  const [mechanicName, setMechanicName] = useState(form.mechanicRecommendation.mechanicName || 'Hendra Gunawan');
  const [mechanicNik, setMechanicNik] = useState(form.mechanicRecommendation.mechanicNik || 'MEK-4109');
  const [mechanicSignature, setMechanicSignature] = useState<string | undefined>(
    form.mechanicRecommendation.signatureUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20,60 C50,20 80,70 120,30 S170,50 190,40" fill="none" stroke="%2316a34a" stroke-width="3"/></svg>'
  );

  const [activeSignTarget, setActiveSignTarget] = useState<'foreman' | 'mechanic' | null>(null);

  // Identify abnormal items
  const abnormalCriticals = CRITICAL_INSPECTIONS.filter(i => form.inspections[i.id]?.status === 'abnormal');
  const abnormalNonCriticals = NON_CRITICAL_INSPECTIONS.filter(i => form.inspections[i.id]?.status === 'abnormal');
  const unfitDrivers = DRIVER_CONDITIONS.filter(i => form.driverCondition?.items[i.id] === 'tidak');

  const handleConfirm = () => {
    onApprove(
      form.id,
      {
        status: foremanDecision,
        notes: foremanNotes,
        foremanName,
        foremanNik,
        signatureUrl: foremanSignature
      },
      {
        status: mechanicStatus,
        reason: mechanicReason,
        mechanicName,
        mechanicNik,
        signatureUrl: mechanicSignature
      }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                {form.docNumber}
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                Panel Verifikasi & Approval Atasan / Mekanik
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Persetujuan P2H Light Vehicle EV · {form.unitNumber} ({form.unitModel})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Operator & NIK</span>
              <span className="font-bold text-slate-900 text-sm">{form.operatorName}</span>
              <span className="text-slate-500 block font-mono text-[11px]">{form.operatorNik}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tanggal & Shift</span>
              <span className="font-bold text-slate-900 text-sm">{form.date}</span>
              <span className="text-slate-500 block text-[11px]">{form.shift}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Jarak & Konsumsi Energi</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{form.totalKm} KM</span>
              <span className="text-sky-600 block font-mono font-bold text-[11px]">
                {form.energyConsumedKwh} kWh ({form.batteryUsedPercent}% SOC)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Lokasi / Site</span>
              <span className="font-bold text-slate-900 text-sm truncate block">{form.workLocation}</span>
              <span className="text-slate-500 block text-[11px] truncate">{form.jobSite}</span>
            </div>
          </div>

          {/* Inspection Findings Status Banner */}
          {abnormalCriticals.length > 0 || unfitDrivers.length > 0 ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">
                  Ditemukan Temuan Kritis ({abnormalCriticals.length + unfitDrivers.length} Item Bermasalah)
                </p>
                <p className="text-xs text-rose-700 mt-1">
                  Aturan Standar K3: Stop bekerja jika terdapat temuan abnormal pada sistem keselamatan & tegangan tinggi. Wajib rekomendasi tertulis mekanik.
                </p>
                <div className="mt-2 space-y-1">
                  {unfitDrivers.map(d => (
                    <div key={d.id} className="text-rose-800 font-medium">
                      • Driver Fit to Work: {d.label} (Hasil: TIDAK)
                    </div>
                  ))}
                  {abnormalCriticals.map(c => (
                    <div key={c.id} className="text-rose-800 font-medium">
                      • Item Kritis {c.code}: {c.label} (Catatan: {form.inspections[c.id]?.notes || 'Abnormal'})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : abnormalNonCriticals.length > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">
                  Ditemukan Temuan Non-Kritis ({abnormalNonCriticals.length} Item)
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Mengikuti rekomendasi mekanik. Unit dapat beroperasi bersyarat dengan perbaikan wajib dalam 1x24 jam.
                </p>
                <div className="mt-2 space-y-1">
                  {abnormalNonCriticals.map(nc => (
                    <div key={nc.id} className="text-amber-800 font-medium">
                      • Item Non-Kritis {nc.code}: {nc.label} (Catatan: {form.inspections[nc.id]?.notes || 'Perlu perbaikan'})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Semua Item Pemeriksaan P2H Normal (Laik Operasi)</p>
                <p className="text-xs text-emerald-700">
                  Tidak ditemukan kerusakan sistem kelistrikan EV atau kekurangan perlengkapan safety tambang.
                </p>
              </div>
            </div>
          )}

          {/* Section: Rekomendasi Mekanik */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Rekomendasi Mekanik (Maintenance & Technical Fleet)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Wajib jika ditemukan temuan abnormal / servis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Rekomendasi Mekanik:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMechanicStatus('continue_operation')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                      mechanicStatus === 'continue_operation'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tetap Beroperasi
                  </button>

                  <button
                    type="button"
                    onClick={() => setMechanicStatus('stop_operation')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                      mechanicStatus === 'stop_operation'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    STOP / Larang Beroperasi
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama & NIK Mekanik:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={mechanicName}
                    onChange={e => setMechanicName(e.target.value)}
                    placeholder="Nama Mekanik"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                  <input
                    type="text"
                    value={mechanicNik}
                    onChange={e => setMechanicNik(e.target.value)}
                    placeholder="NIK MEK-XXXX"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alasan & Catatan Teknis Mekanik:
              </label>
              <textarea
                rows={2}
                value={mechanicReason}
                onChange={e => setMechanicReason(e.target.value)}
                placeholder="Tuliskan catatan teknis hasil diagnosa..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Mechanic Signature */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-24 h-12 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                  {mechanicSignature ? (
                    <img src={mechanicSignature} alt="TTD Mekanik" className="max-h-10 max-w-full" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum TTD</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Tanda Tangan Mekanik</span>
                  <span className="text-[11px] text-slate-500 font-mono">Disetujui Teknis</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSignTarget('mechanic')}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1"
              >
                <PenLine className="w-3.5 h-3.5" />
                TTD Mekanik
              </button>
            </div>
          </div>

          {/* Section: Persetujuan Foreman / Supervisor */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Keputusan Persetujuan Foreman / Pengawas Operasional
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Wajib diisi sebelum unit mulai beroperasi di shift
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keputusan Foreman:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForemanDecision('approved')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                      foremanDecision === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Setujui (Approved)
                  </button>

                  <button
                    type="button"
                    onClick={() => setForemanDecision('rejected')}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                      foremanDecision === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tolak / Stop Unit
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama & NIK Foreman:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={foremanName}
                    onChange={e => setForemanName(e.target.value)}
                    placeholder="Nama Foreman"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                  <input
                    type="text"
                    value={foremanNik}
                    onChange={e => setForemanNik(e.target.value)}
                    placeholder="NIK FRM-XXXX"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Pengawasan Foreman:
              </label>
              <textarea
                rows={2}
                value={foremanNotes}
                onChange={e => setForemanNotes(e.target.value)}
                placeholder="Instruksi khusus keselamatan atau jalur kerja..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Foreman Signature */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-24 h-12 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                  {foremanSignature ? (
                    <img src={foremanSignature} alt="TTD Foreman" className="max-h-10 max-w-full" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum TTD</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Tanda Tangan Foreman</span>
                  <span className="text-[11px] text-slate-500 font-mono">Diketahui & Disetujui</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSignTarget('foreman')}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1"
              >
                <PenLine className="w-3.5 h-3.5" />
                TTD Foreman
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors ${
              foremanDecision === 'approved' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {foremanDecision === 'approved' 
              ? 'Konfirmasi & Terbitkan Approval P2H' 
              : 'Konfirmasi Penolakan P2H (Stop Unit)'}
          </button>
        </div>
      </div>

      {/* Signature Pad Modal for Foreman or Mechanic */}
      <SignaturePadModal
        isOpen={activeSignTarget !== null}
        onClose={() => setActiveSignTarget(null)}
        onSave={url => {
          if (activeSignTarget === 'foreman') setForemanSignature(url);
          if (activeSignTarget === 'mechanic') setMechanicSignature(url);
        }}
        title={activeSignTarget === 'foreman' ? 'Tanda Tangan Digital Foreman' : 'Tanda Tangan Digital Mekanik'}
        signerName={activeSignTarget === 'foreman' ? foremanName : mechanicName}
        signerRole={activeSignTarget === 'foreman' ? 'Foreman / Pengawas K3' : 'Mekanik / Maintenance EV'}
      />
    </div>
  );
};
