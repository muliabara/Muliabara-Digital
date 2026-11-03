import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit, AppSettings, UserProfile } from '../types/p2h';
import { CRITICAL_INSPECTIONS, NON_CRITICAL_INSPECTIONS } from '../data/checklistConfig';
import { getGlassCardClass } from '../utils/glass';
import { 
  ShieldAlert, 
  Wrench, 
  AlertTriangle, 
  Truck, 
  Search, 
  Calendar, 
  FileText, 
  User, 
  Image as ImageIcon, 
  CheckCircle2,
  X,
  ExternalLink,
  Flame,
  CheckCircle,
  Check,
  Download
} from 'lucide-react';

interface DamageFindingsViewProps {
  records: P2HFormRecord[];
  vehicles: VehicleUnit[];
  settings: AppSettings;
  currentUser: UserProfile;
  onUpdateRecord: (record: P2HFormRecord) => void;
  onEditRecord: (record: P2HFormRecord) => void;
  onPrintRecord: (record: P2HFormRecord) => void;
}

export const DamageFindingsView: React.FC<DamageFindingsViewProps> = ({
  records,
  vehicles,
  settings,
  currentUser,
  onUpdateRecord,
  onEditRecord,
  onPrintRecord
}) => {
  const glassCard = getGlassCardClass(settings);

  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Extract all checklist item definitions for lookup
  const checklistDefMap = useMemo(() => {
    const map = new Map<string, string>();
    [...CRITICAL_INSPECTIONS, ...NON_CRITICAL_INSPECTIONS].forEach(item => {
      map.set(item.id, item.label);
    });
    return map;
  }, []);

  // Filter records that have either abnormal checklist items OR driver finding notes/photos
  const recordFindings = useMemo(() => {
    return records.filter(rec => {
      const hasAbnormal = rec.inspections && Object.values(rec.inspections).some(i => i && i.status === 'abnormal');
      const hasDriverNote = Boolean(rec.driverFindingNotes || rec.driverFindingPhotoUrl);
      return hasAbnormal || hasDriverNote;
    });
  }, [records]);

  // Filter based on selected unit, date range, and search term
  const filteredRecords = useMemo(() => {
    return recordFindings.filter(rec => {
      if (selectedUnit !== 'all' && rec.unitNumber !== selectedUnit) return false;

      const cleanDate = (rec.date || '').split('T')[0].trim();
      if (startDate && cleanDate < startDate) return false;
      if (endDate && cleanDate > endDate) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchText = `${rec.unitNumber} ${rec.operatorName} ${rec.driverFindingNotes || ''}`.toLowerCase();
        if (!matchText.includes(query)) {
          const hasMatchingInspection = Object.entries(rec.inspections || {}).some(([itemId, insp]) => {
            if (insp && insp.status === 'abnormal') {
              const label = checklistDefMap.get(itemId) || itemId;
              return label.toLowerCase().includes(query) || (insp.notes || '').toLowerCase().includes(query);
            }
            return false;
          });
          if (!hasMatchingInspection) return false;
        }
      }
      return true;
    });
  }, [recordFindings, selectedUnit, startDate, endDate, searchTerm, checklistDefMap]);

  const unitList = useMemo(() => {
    const list = vehicles.map(v => v.unitNumber);
    return Array.from(new Set(list));
  }, [vehicles]);

  const handleToggleInspectionClose = (rec: P2HFormRecord, itemId: string) => {
    const currentInsp = rec.inspections[itemId];
    if (!currentInsp) return;
    const nextIsClosed = !currentInsp.isClosed;
    const updatedInspections = {
      ...rec.inspections,
      [itemId]: {
        ...currentInsp,
        isClosed: nextIsClosed
      }
    };

    // Check if any abnormal inspections remain active/open
    const hasActiveCrit = CRITICAL_INSPECTIONS.some(
      item => updatedInspections[item.id]?.status === 'abnormal' && !updatedInspections[item.id]?.isClosed
    );
    const hasActiveNonCrit = NON_CRITICAL_INSPECTIONS.some(
      item => updatedInspections[item.id]?.status === 'abnormal' && !updatedInspections[item.id]?.isClosed
    );
    const hasActiveDriver = Boolean(rec.driverFindingNotes && !rec.driverFindingIsClosed);
    const hasAnyActive = hasActiveCrit || hasActiveNonCrit || hasActiveDriver;

    const updated: P2HFormRecord = {
      ...rec,
      inspections: updatedInspections,
      hasAbnormalCritical: hasActiveCrit,
      hasAbnormalNonCritical: hasActiveNonCrit,
      overallStatus: hasAnyActive ? 'needs_maintenance' : 'approved',
      updatedAt: new Date().toISOString()
    };
    onUpdateRecord(updated);
  };

  const handleToggleDriverFindingClose = (rec: P2HFormRecord) => {
    const nextDriverFindingClosed = !rec.driverFindingIsClosed;
    const hasActiveCrit = CRITICAL_INSPECTIONS.some(
      item => rec.inspections[item.id]?.status === 'abnormal' && !rec.inspections[item.id]?.isClosed
    );
    const hasActiveNonCrit = NON_CRITICAL_INSPECTIONS.some(
      item => rec.inspections[item.id]?.status === 'abnormal' && !rec.inspections[item.id]?.isClosed
    );
    const hasActiveDriver = Boolean(rec.driverFindingNotes && !nextDriverFindingClosed);
    const hasAnyActive = hasActiveCrit || hasActiveNonCrit || hasActiveDriver;

    const updated: P2HFormRecord = {
      ...rec,
      driverFindingIsClosed: nextDriverFindingClosed,
      hasAbnormalCritical: hasActiveCrit,
      hasAbnormalNonCritical: hasActiveNonCrit,
      overallStatus: hasAnyActive ? 'needs_maintenance' : 'approved',
      updatedAt: new Date().toISOString()
    };
    onUpdateRecord(updated);
  };

  const handleDownloadFindingsCsv = () => {
    const headers = ['Tanggal', 'Shift', 'Unit', 'Driver', 'Jenis Temuan', 'Item / Catatan Temuan', 'Status Perbaikan'];
    const rows: string[][] = [];

    filteredRecords.forEach(rec => {
      if (rec.driverFindingNotes || rec.driverFindingPhotoUrl) {
        rows.push([
          `"${rec.date}"`,
          `"${rec.shift}"`,
          `"${rec.unitNumber}"`,
          `"${rec.operatorName}"`,
          `"Catatan Driver"`,
          `"${(rec.driverFindingNotes || '').replace(/"/g, '""')}"`,
          `"${rec.driverFindingIsClosed ? 'Closed (Selesai)' : 'Abnormal (Open)'}"`
        ]);
      }
      if (rec.inspections) {
        Object.entries(rec.inspections).forEach(([itemId, insp]) => {
          if (insp && insp.status === 'abnormal') {
            const label = checklistDefMap.get(itemId) || itemId;
            rows.push([
              `"${rec.date}"`,
              `"${rec.shift}"`,
              `"${rec.unitNumber}"`,
              `"${rec.operatorName}"`,
              `"Checklist P2H Abnormal"`,
              `"${label}: ${(insp.notes || '').replace(/"/g, '""')}"`,
              `"${insp.isClosed ? 'Closed (Selesai)' : 'Abnormal (Open)'}"`
            ]);
          }
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Temuan_Kerusakan_${startDate || 'semua'}_sd_${endDate || 'semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans antialiased text-slate-700">
      
      {/* Top Header Banner */}
      <div className={`${glassCard} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                PENGELOLAAN KERUSAKAN & TEMUAN K3
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                F-QHSE-OPS-MOB-09
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Resume Temuan Kerusakan & Centang Close Per Item
            </h1>
            <p className="text-xs text-slate-500">
              Centang status <strong>Close</strong> per item checklist abnormal atau catatan driver yang sudah diperbaiki, serta unduh laporan berdasarkan rentang tanggal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadFindingsCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-tl from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Laporan Temuan (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter, Date Range & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Unit Fleet</label>
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Unit Fleet</option>
              {unitList.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dari Tanggal (Start)</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sampai Tanggal (End)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pencarian Kata Kunci</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari temuan / driver..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Record Findings List (Grouped 1 Unit / Tanggal) */}
      {filteredRecords.length === 0 ? (
        <div className={`${glassCard} p-12 text-center space-y-3`}>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Temuan Kerusakan / Abnormal</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Seluruh unit armada EV beroperasi normal tanpa catatan temuan kerusakan atau checklist abnormal pada rentang tanggal ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(rec => {
            const abnormalItems = Object.entries(rec.inspections || {}).filter(([_, insp]) => insp && insp.status === 'abnormal');

            return (
              <div 
                key={rec.id} 
                className={`${glassCard} p-6 space-y-4 hover:shadow-lg transition-all`}
              >
                
                {/* Card Header: Unit & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tl from-amber-600 to-rose-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 font-mono">
                      EV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 font-mono">
                          Unit: {rec.unitNumber}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                          {rec.date} ({rec.shift})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Driver: <strong className="text-slate-800">{rec.operatorName}</strong> ({rec.operatorNik}) · Lokasi: {rec.workLocation || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      rec.overallStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      rec.overallStatus === 'needs_maintenance' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {rec.overallStatus}
                    </span>
                  </div>
                </div>

                {/* Cases Container (Per Item Close) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* Column 1: Catatan & Foto Temuan Driver */}
                  {rec.driverFindingNotes || rec.driverFindingPhotoUrl ? (
                    <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                      rec.driverFindingIsClosed ? 'bg-emerald-50/50 border-emerald-300' : 'bg-purple-50/60 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-purple-600" />
                          Catatan Temuan Driver
                        </span>
                        
                        {/* Per-Item Close Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleDriverFindingClose(rec)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                            rec.driverFindingIsClosed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {rec.driverFindingIsClosed ? 'Closed (Selesai)' : '✓ Close Item'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-purple-100">
                        "{rec.driverFindingNotes || 'Tidak ada catatan teks.'}"
                      </p>

                      {rec.driverFindingPhotoUrl && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> Foto Temuan Driver:
                          </span>
                          <div 
                            onClick={() => setPreviewPhotoUrl(rec.driverFindingPhotoUrl || null)}
                            className="w-full h-28 bg-white rounded-lg border border-purple-200 overflow-hidden cursor-pointer relative group flex items-center justify-center p-1"
                          >
                            <img src={rec.driverFindingPhotoUrl} alt="Foto Temuan" className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ExternalLink className="w-4 h-4" /> Perbesar
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-400 italic">
                      Tidak ada catatan temuan teks dari driver pada sesi ini.
                    </div>
                  )}

                  {/* Column 2: Checklist Abnormal P2H (Per Item Close) */}
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Checklist Abnormal ({abnormalItems.length} Case)
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">
                        Inspeksi P2H
                      </span>
                    </div>

                    {abnormalItems.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500 italic">
                        Semua item checklist P2H bernilai normal.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {abnormalItems.map(([itemId, insp]) => {
                          const itemLabel = checklistDefMap.get(itemId) || itemId;
                          const isItemClosed = Boolean(insp.isClosed);

                          return (
                            <div 
                              key={itemId} 
                              className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                                isItemClosed ? 'bg-emerald-50/60 border-emerald-300 opacity-90' : 'bg-white border-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{itemLabel}</span>
                                
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isItemClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-600'
                                  }`}>
                                    {isItemClosed ? 'CLOSED' : 'ABNORMAL'}
                                  </span>

                                  {/* Per-Item Close Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleInspectionClose(rec, itemId)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                                      isItemClosed
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-300'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                    {isItemClosed ? 'Closed' : '✓ Close'}
                                  </button>
                                </div>
                              </div>

                              {insp.notes && (
                                <p className="text-[11px] text-slate-600 italic">
                                  Catatan: "{insp.notes}"
                                </p>
                              )}

                              {insp.photoUrl && (
                                <div 
                                  onClick={() => setPreviewPhotoUrl(insp.photoUrl || null)}
                                  className="w-full h-16 bg-slate-50 rounded border border-slate-200 overflow-hidden cursor-pointer relative group flex items-center justify-center mt-1"
                                >
                                  <img src={insp.photoUrl} alt="Foto Abnormal" className="max-h-full max-w-full object-contain" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onPrintRecord(rec)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cetak PDF P2H
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditRecord(rec)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Kelola / Edit Form
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                Pratinjau Foto Temuan Kerusakan
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden bg-slate-900 rounded-xl p-2">
              <img src={previewPhotoUrl} alt="Pratinjau Besar" className="max-h-[70vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
