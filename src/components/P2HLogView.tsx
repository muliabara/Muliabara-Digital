import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit, AppSettings, UserProfile } from '../types/p2h';
import { 
  FileText, 
  Search, 
  Edit3, 
  Trash2, 
  Printer, 
  Eye, 
  Download, 
  Upload,
  FileSpreadsheet,
  Check,
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  X,
  FileDown,
  Truck,
  User,
  Zap,
  Calendar,
  AlertOctagon
} from 'lucide-react';
import { getGlassCardClass } from '../utils/glass';
import { getEffectiveRecordMetrics } from '../utils/telemetry';

interface P2HLogViewProps {
  records: P2HFormRecord[];
  vehicles: VehicleUnit[];
  settings?: AppSettings;
  currentUser?: UserProfile;
  onEditRecord: (record: P2HFormRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onDeleteAllRecords?: () => void;
  onPrintRecord: (record: P2HFormRecord) => void;
  onDownloadPdfRecord: (record: P2HFormRecord) => void;
  onCreateNew: () => void;
  onApproveRecord?: (formId: string) => void;
  onImportRecords?: (importedRecords: P2HFormRecord[]) => void;
}

export const P2HLogView: React.FC<P2HLogViewProps> = ({
  records,
  vehicles,
  settings,
  currentUser,
  onEditRecord,
  onDeleteRecord,
  onDeleteAllRecords,
  onPrintRecord,
  onDownloadPdfRecord,
  onCreateNew,
  onApproveRecord,
  onImportRecords
}) => {
  const glassCard = getGlassCardClass(settings);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Master Admin';
  const canApprove = ['master admin', 'admin', 'foreman', 'pengawas'].includes(
    (currentUser?.role || '').toLowerCase().trim()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [parsedImportRecords, setParsedImportRecords] = useState<P2HFormRecord[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Tanggal',
      'Shift',
      'No Unit',
      'Model Unit',
      'Operator',
      'NIK Operator',
      'KM Awal',
      'KM Akhir',
      'SOC Awal (%)',
      'SOC Akhir (%)',
      'Charging Terisi (%)',
      'Charging Terisi (kWh)',
      'Lokasi Worksite',
      'Status P2H'
    ];

    const sampleRow1 = [
      '2026-11-04',
      'Shift 1 (Siang)',
      'LV-EV-01',
      'JAC T9 EV 4x4 Double Cabin',
      'Budi Santoso',
      'OPR-8821',
      '12400',
      '12480',
      '100',
      '82',
      '80',
      '70.42',
      'Pit Utara - Mining Sector A',
      'approved'
    ];

    const sampleRow2 = [
      '2026-11-04',
      'Shift 2 (Malam)',
      'LV-EV-02',
      'JAC T9 EV 4x4 Double Cabin',
      'Ahmad Fauzi',
      'OPR-8822',
      '5120',
      '5200',
      '94',
      '78',
      '0',
      '0',
      'Central Workshop - Main Yard',
      'pending_approval'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Template_Import_Log_P2H_JAC_T9_EV.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCsvText = (text: string) => {
    setImportError(null);
    setParsedImportRecords([]);

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setImportError('File CSV tidak memiliki baris data (minimal 1 baris header dan 1 baris data).');
      return;
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map(s => s.replace(/^["']|["']$/g, ''));
    };

    const header = parseLine(lines[0]).map(h => h.toLowerCase());
    
    const findIdx = (keywords: string[], fallbackIdx: number) => {
      const idx = header.findIndex(h => keywords.some(k => h.includes(k)));
      return idx !== -1 ? idx : fallbackIdx;
    };

    const dateIdx = findIdx(['tanggal', 'date'], 0);
    const shiftIdx = findIdx(['shift'], 1);
    const unitIdx = findIdx(['no unit', 'unit', 'nomor unit'], 2);
    const modelIdx = findIdx(['model'], 3);
    const operatorIdx = findIdx(['operator', 'nama operator', 'driver'], 4);
    const nikIdx = findIdx(['nik'], 5);
    const startKmIdx = findIdx(['km awal', 'start km'], 6);
    const endKmIdx = findIdx(['km akhir', 'end km'], 7);
    const startSocIdx = findIdx(['soc awal', 'start soc'], 8);
    const endSocIdx = findIdx(['soc akhir', 'end soc'], 9);
    const chargingPercentIdx = findIdx(['charging terisi (%)', 'charging %', 'cas %'], 10);
    const chargingKwhIdx = findIdx(['charging terisi (kwh)', 'charging kwh', 'cas kwh'], 11);
    const locationIdx = findIdx(['lokasi', 'worksite', 'site'], 12);
    const statusIdx = findIdx(['status'], 13);

    const newRecords: P2HFormRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      if (row.length < 3) continue;

      const rowDate = row[dateIdx] || new Date().toISOString().split('T')[0];
      const rawShift = row[shiftIdx] || '';
      const shift = rawShift.toLowerCase().includes('malam') || rawShift.includes('2') 
        ? 'Shift 2 (Malam)' 
        : 'Shift 1 (Siang)';

      const unitNumber = row[unitIdx] || 'LV-EV-01';
      const unitModel = row[modelIdx] || 'JAC T9 EV 4x4 Double Cabin';
      const operatorName = row[operatorIdx] || 'Operator Tambang';
      const operatorNik = row[nikIdx] || `OPR-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const startKm = Math.max(0, parseInt(row[startKmIdx], 10) || 1000);
      const endKm = Math.max(startKm, parseInt(row[endKmIdx], 10) || (startKm + 45));
      const totalKm = endKm - startKm;

      const startSoc = Math.min(100, Math.max(0, parseInt(row[startSocIdx], 10) || 100));
      const endSoc = Math.min(startSoc, Math.max(0, parseInt(row[endSocIdx], 10) || 82));
      const batteryUsedPercent = Math.max(0, startSoc - endSoc);
      const energyConsumedKwh = Number(((batteryUsedPercent / 100) * 88.02).toFixed(2));
      const consumptionRateKwhPerKm = totalKm > 0 ? Number((energyConsumedKwh / totalKm).toFixed(2)) : 0;

      const percentCharged = Math.min(100, Math.max(0, parseInt(row[chargingPercentIdx], 10) || 0));
      const energyAddedKwh = parseFloat(row[chargingKwhIdx]) || Number(((percentCharged / 100) * 88.02).toFixed(2));

      const workLocation = row[locationIdx] || 'Pit Utama Tambang Kutai';
      const rawStatus = (row[statusIdx] || '').toLowerCase();

      let overallStatus: P2HFormRecord['overallStatus'] = 'approved';
      if (rawStatus.includes('pending') || rawStatus.includes('menunggu')) {
        overallStatus = 'pending_approval';
      } else if (rawStatus.includes('mekanik') || rawStatus.includes('maintenance')) {
        overallStatus = 'needs_maintenance';
      } else if (rawStatus.includes('ditolak') || rawStatus.includes('reject')) {
        overallStatus = 'rejected';
      }

      const recId = `p2h-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const record: P2HFormRecord = {
        id: recId,
        docNumber: 'F-QHSE-OPS-MOB-09',
        createdAt: nowIso,
        updatedAt: nowIso,
        date: rowDate,
        shift,
        unitNumber,
        unitModel,
        equipmentType: 'Light Vehicle (EV)',
        operatorName,
        operatorNik,
        workLocation,
        jobSite: 'Tambang Kutai',
        skoExpiryDate: '2027-12-31',
        startKm,
        endKm,
        totalKm,
        startSoc,
        endSoc,
        batteryCapacityKwh: 88.02,
        batteryUsedPercent,
        energyConsumedKwh,
        consumptionRateKwhPerKm,
        costSavingsIdr: Math.round(totalKm * 2300),
        co2ReductionKg: Number((totalKm * 0.175).toFixed(2)),
        charging: {
          percentCharged,
          energyAddedKwh,
          estimatedRangeKm: Math.round((percentCharged / 100) * 400),
          chargingLocation: 'SPKLU Site Tambang'
        },
        driverCondition: {
          idCardExpiry: '2028-12-31',
          simperExpiry: '2027-12-31',
          items: { item_1: 'ya', item_2: 'ya', item_3: 'ya' },
          notes: {}
        },
        inspections: {
          check_skid_plate: { status: 'normal' },
          check_battery_harness: { status: 'normal' },
          check_ccs2_socket: { status: 'normal' }
        },
        overallStatus,
        hasAbnormalCritical: false,
        hasAbnormalNonCritical: false,
        mechanicRecommendation: {
          status: 'continue_operation',
          reason: 'Hasil impor data massal.',
          mechanicName: 'Irwan Setiawan',
          mechanicNik: 'MECH-004'
        },
        foremanApproval: {
          status: overallStatus === 'approved' ? 'approved' : 'pending',
          notes: 'Impor Data Massal CSV',
          foremanName: currentUser?.name || 'Foreman Tambang',
          foremanNik: currentUser?.nik || 'SPV-101',
          approvedAt: overallStatus === 'approved' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : undefined
        },
        operatorSignature: {
          agreed: true,
          submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
        }
      };

      newRecords.push(record);
    }

    if (newRecords.length === 0) {
      setImportError('Tidak ada baris data valid yang dapat diproses dari file CSV ini.');
    } else {
      setParsedImportRecords(newRecords);
    }
  };

  const confirmImport = () => {
    if (parsedImportRecords.length > 0 && onImportRecords) {
      onImportRecords(parsedImportRecords);
      setImportSuccessMsg(`Berhasil mengimpor ${parsedImportRecords.length} data formulir P2H ke sistem!`);
      setTimeout(() => {
        setImportSuccessMsg(null);
        setShowUploadModal(false);
        setUploadFileName('');
        setParsedImportRecords([]);
      }, 1200);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchUnit = selectedUnit === 'all' || r.unitNumber === selectedUnit;
      const matchStatus = selectedStatus === 'all' || r.overallStatus === selectedStatus;
      
      const recordDate = (r.date || '').split('T')[0].trim();
      let matchDate = true;
      if (startDate && endDate) {
        matchDate = recordDate >= startDate && recordDate <= endDate;
      } else if (startDate) {
        matchDate = recordDate === startDate;
      } else if (endDate) {
        matchDate = recordDate <= endDate;
      }

      const matchQuery = 
        !searchQuery ||
        r.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.operatorNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.workLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.jobSite.toLowerCase().includes(searchQuery.toLowerCase());

      return matchUnit && matchStatus && matchDate && matchQuery;
    });
  }, [records, selectedUnit, selectedStatus, startDate, endDate, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalKm = 0;
    let totalKwh = 0;
    records.forEach(r => {
      const eff = getEffectiveRecordMetrics(r);
      totalKm += eff.totalKm;
      totalKwh += eff.energyConsumedKwh;
    });
    return {
      totalForms: records.length,
      approved: records.filter(r => r.overallStatus === 'approved').length,
      pending: records.filter(r => r.overallStatus === 'pending_approval' || r.overallStatus === 'needs_maintenance').length,
      totalKm,
      totalKwh: Number(totalKwh.toFixed(1))
    };
  }, [records]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID Form', 'No Dokumen', 'Tanggal', 'Shift', 'No Unit', 'Model Unit',
      'Operator', 'NIK Operator', 'KM Awal', 'KM Akhir', 'Total KM',
      'SOC Awal (%)', 'SOC Akhir (%)', 'Baterai Terpakai (%)', 'Konsumsi (kWh)',
      'Efisiensi (kWh/km)', 'Charging Terisi (%)', 'Charging Terisi (kWh)', 'Status P2H', 'Foreman Approver', 'Foreman Status'
    ];

    const rows = filteredRecords.map(r => {
      const eff = getEffectiveRecordMetrics(r);
      return [
        `"${r.id}"`, `"${r.docNumber}"`, `"${r.date}"`, `"${r.shift}"`,
        `"${r.unitNumber}"`, `"${r.unitModel}"`, `"${r.operatorName}"`, `"${r.operatorNik}"`,
        r.startKm, r.endKm, eff.totalKm, r.startSoc, r.endSoc, eff.batteryUsedPercent,
        eff.energyConsumedKwh, eff.consumptionRateKwhPerKm,
        r.charging?.percentCharged || 0, r.charging?.energyAddedKwh || 0,
        `"${r.overallStatus}"`,
        `"${r.foremanApproval.foremanName || '-'}"`, `"${r.foremanApproval.status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log_P2H_JAC_T9_EV_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteRecord(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full overflow-x-hidden font-sans">
      {/* Header & Stats Banner */}
      <div className={`${glassCard} p-5 sm:p-6 space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                DOKUMEN F-QHSE-OPS-MOB-09
              </span>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">
                LOG P2H DIGITAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Log Formulir Pemeriksaan Harian (P2H) JAC T9 EV
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat inspeksi pra-operasi lengkap dengan fitur edit data, hapus catatan, dan unduh file PDF resmi (*FORM P2H EV_LV*).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isAdmin && onDeleteAllRecords && (
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors cursor-pointer shadow-soft-xxs"
                title="Hapus seluruh log & arsip formulir P2H (Khusus Admin)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Log</span>
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer shadow-soft-xxs"
              title="Unggah / Impor data log P2H dari file CSV secara massal"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Data CSV</span>
            </button>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Form P2H Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/75 backdrop-blur-xs rounded-xl border border-white/80 shadow-soft-xxs">
            <span className="text-slate-400 block font-bold">Total Dokumen P2H</span>
            <span className="text-xl font-extrabold font-mono text-slate-900 tabular-nums">
              {stats.totalForms}
            </span>
            <span className="text-[10px] text-slate-400 block">Formulir Terdata</span>
          </div>

          <div className="p-3 bg-emerald-50/80 backdrop-blur-xs rounded-xl border border-emerald-200/60 shadow-soft-xxs">
            <span className="text-emerald-700 block font-bold">Telah Disetujui</span>
            <span className="text-xl font-extrabold font-mono text-emerald-800 tabular-nums">
              {stats.approved}
            </span>
            <span className="text-[10px] text-emerald-600 block">Approved Resmi</span>
          </div>

          <div className="p-3 bg-amber-50/80 backdrop-blur-xs rounded-xl border border-amber-200/60 shadow-soft-xxs">
            <span className="text-amber-700 block font-bold">Perlu Review / Mekanik</span>
            <span className="text-xl font-extrabold font-mono text-amber-800 tabular-nums">
              {stats.pending}
            </span>
            <span className="text-[10px] text-amber-600 block">Dalam Antrean</span>
          </div>

          <div className="p-3 bg-sky-50/80 backdrop-blur-xs rounded-xl border border-sky-200/60 shadow-soft-xxs">
            <span className="text-sky-700 block font-bold">Total Energi Terpantau</span>
            <span className="text-xl font-extrabold font-mono text-sky-800 tabular-nums">
              {stats.totalKwh} kWh
            </span>
            <span className="text-[10px] text-sky-600 block">{stats.totalKm} KM Ditempuh</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs pt-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari operator, NIK, unit, lokasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500/20 outline-none backdrop-blur-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div>
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500/20 outline-none backdrop-blur-xs"
            >
              <option value="all">Semua Unit Kendaraan</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.unitNumber}>
                  {v.unitNumber} - {v.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500/20 outline-none backdrop-blur-xs"
            >
              <option value="all">Semua Status P2H</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="pending_approval">Menunggu Review Foreman</option>
              <option value="needs_maintenance">Perlu Rekomendasi Mekanik</option>
              <option value="rejected">Ditolak / Stop Operasi</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 sm:col-span-1">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              title="Dari Tanggal"
              className="w-full px-2.5 py-2 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl text-slate-900 font-mono text-xs cursor-pointer focus:bg-white backdrop-blur-xs"
            />
            <span className="text-slate-400 font-bold text-xs shrink-0">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              title="Sampai Tanggal"
              className="w-full px-2.5 py-2 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl text-slate-900 font-mono text-xs cursor-pointer focus:bg-white backdrop-blur-xs"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-2 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 border border-white/80 shadow-soft-xxs rounded-xl cursor-pointer shrink-0"
                title="Reset Tanggal"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REQUIREMENT 6: MOBILE CARD LIST VIEW (NO HORIZONTAL SCROLL) */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800">
            Daftar Log P2H ({filteredRecords.length} Form)
          </span>
          <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-mono font-bold">
            Tampilan Mobile Card
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200 text-xs">
            Tidak ada catatan Log P2H yang sesuai dengan kriteria filter.
          </div>
        ) : (
          filteredRecords.map((record, index) => {
            const eff = getEffectiveRecordMetrics(record);
            return (
              <div 
                key={`m-${record.id}-${index}`}
                className={`${glassCard} p-4 space-y-3 font-sans`}
              >
                {/* Card Header: Unit & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-900 text-sm">{record.unitNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({record.shift})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {record.date}
                    </span>
                  </div>

                  <div>
                    {record.overallStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    )}
                    {record.overallStatus === 'pending_approval' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                        {onApproveRecord && canApprove && (
                          <button
                            type="button"
                            onClick={() => onApproveRecord(record.id)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                      </div>
                    )}
                    {record.overallStatus === 'needs_maintenance' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Mekanik
                      </span>
                    )}
                  </div>
                </div>

                {/* Driver & Location */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Driver / Operator</span>
                    <span className="font-bold text-slate-900 block truncate">{record.operatorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{record.operatorNik}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Lokasi Worksite</span>
                    <span className="font-medium text-slate-800 block truncate">{record.workLocation || '-'}</span>
                  </div>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Odometer</span>
                    <span className="font-mono font-bold text-slate-900 block text-[10px]">+{eff.totalKm} KM</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Baterai (SOC)</span>
                    <span className="font-mono font-bold text-amber-600 block text-[10px]">{record.startSoc}% → {record.endSoc}%</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Konsumsi</span>
                    <span className="font-mono font-bold text-sky-700 block text-[10px]">{eff.energyConsumedKwh} kWh</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Charging</span>
                    <span className="font-mono font-bold text-emerald-600 block text-[10px]">
                      {record.charging && record.charging.percentCharged > 0
                        ? `+${record.charging.percentCharged}% (${record.charging.energyAddedKwh} kWh)`
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Mobile Actions Toolbar */}
                <div className="flex items-center justify-between gap-1.5 pt-1 text-xs">
                  <button
                    onClick={() => onEditRecord(record)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDownloadPdfRecord(record)}
                    className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200 transition-colors flex items-center justify-center gap-1 text-[11px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => onPrintRecord(record)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteTargetId(record.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className={`hidden sm:block ${glassCard} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-white/80 bg-white/60 backdrop-blur-xs flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Log Riwayat Pemeriksaan Harian
            </h2>
            <p className="text-xs text-slate-500">
              Akses cepat: Edit data, unduh file PDF format FORM P2H EV_LV, atau hapus dokumen.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">
            {filteredRecords.length} Dokumen Ditemukan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/70 backdrop-blur-xs text-slate-700 font-bold border-b border-white/80">
              <tr>
                <th className="py-3 px-4">Tanggal & Shift</th>
                <th className="py-3 px-4">No. Unit & Model</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-3 text-right font-mono">HM/KM</th>
                <th className="py-3 px-3 text-center">Baterai (SOC)</th>
                <th className="py-3 px-4 text-right font-mono font-bold text-sky-700">Energi (kWh)</th>
                <th className="py-3 px-3 text-center font-mono font-bold text-amber-600">Charging Terisi</th>
                <th className="py-3 px-4 text-center">Status P2H</th>
                <th className="py-3 px-4 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada catatan Log P2H yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const eff = getEffectiveRecordMetrics(record);
                  return (
                    <tr key={`${record.id}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block font-mono">{record.date}</span>
                        <span className="text-[11px] text-slate-500">{record.shift}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block font-mono">{record.unitNumber}</span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-44">
                          {record.workLocation}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{record.operatorName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{record.operatorNik}</span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        <div>{record.startKm} → {record.endKm}</div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{eff.totalKm} KM
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="font-mono text-slate-800">
                          {record.startSoc}% → {record.endSoc}%
                        </div>
                        <span className={`text-[10px] font-semibold block ${eff.isNetGain ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                          {eff.socLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold font-mono text-sky-700 tabular-nums block">
                          {eff.energyConsumedKwh} kWh
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono">
                          {eff.consumptionRateKwhPerKm} kWh/km
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {record.charging && record.charging.percentCharged > 0 ? (
                          <div>
                            <span className="text-xs font-extrabold font-mono text-amber-600 tabular-nums block">
                              +{record.charging.percentCharged}%
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                              +{record.charging.energyAddedKwh} kWh
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono italic">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {record.overallStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Disetujui
                          </span>
                        )}
                        {record.overallStatus === 'pending_approval' && (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Review Foreman
                            </span>
                            {onApproveRecord && canApprove && (
                              <button
                                type="button"
                                onClick={() => onApproveRecord(record.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Approve P2H Sekarang"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}
                          </div>
                        )}
                        {record.overallStatus === 'needs_maintenance' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Perlu Mekanik
                          </span>
                        )}
                        {record.overallStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            Ditolak / Stop
                          </span>
                        )}
                        {record.overallStatus === 'draft' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onEditRecord(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-sky-700 rounded transition-colors font-semibold"
                            title="Edit Data P2H"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => onDownloadPdfRecord(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded transition-colors font-semibold border border-sky-200"
                            title="Download PDF File Format FORM P2H EV_LV"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Download PDF
                          </button>

                          <button
                            onClick={() => onPrintRecord(record)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Pratinjau / Cetak Print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(record.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Form P2H"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Konfirmasi Hapus Log P2H
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data form P2H untuk unit <strong className="text-slate-900 font-mono">{records.find(r => r.id === deleteTargetId)?.unitNumber}</strong> (Tanggal: {records.find(r => r.id === deleteTargetId)?.date})? Tindakan ini tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ALL LOGS MODAL */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Hapus Seluruh Log P2H?
                </h3>
                <span className="text-[11px] font-mono font-bold text-rose-600 block">
                  KHUSUS HAK AKSES ADMIN / MASTER ADMIN
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700 font-extrabold">{records.length} seluruh dokumen log P2H</strong> yang tersimpan? Seluruh riwayat pemeriksaan harian akan dikosongkan dan disinkronkan ke seluruh perangkat.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAllRecords) onDeleteAllRecords();
                  setShowDeleteAllModal(false);
                }}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD & IMPORT DATA CSV MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Upload & Impor Data Log P2H
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unggah file CSV untuk mengimpor banyak riwayat formulir P2H JAC T9 EV sekaligus.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedImportRecords([]);
                  setImportError(null);
                  setUploadFileName('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Toast */}
            {importSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* Template Download Banner */}
            <div className="p-4 bg-sky-50/80 border border-sky-200/80 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-sky-900">Format File CSV Yang Didukung:</span>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-sky-700 font-bold rounded-lg border border-sky-300 shadow-soft-xxs hover:bg-sky-50 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Unduh Contoh Template CSV</span>
                </button>
              </div>
              <p className="text-[11px] text-sky-700 leading-relaxed font-mono">
                Header kolom: Tanggal, Shift, No Unit, Model Unit, Operator, NIK Operator, KM Awal, KM Akhir, SOC Awal (%), SOC Akhir (%), Charging Terisi (%), Charging Terisi (kWh), Lokasi Worksite, Status P2H
              </p>
            </div>

            {/* File Dropzone / Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih File Data CSV (.csv)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-upload-input"
                />
                <label
                  htmlFor="csv-file-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploadFileName ? `File Terpilih: ${uploadFileName}` : 'Klik untuk Memilih File CSV dari Perangkat'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Format file harus berencoding UTF-8 dengan pemisah koma (,)
                  </span>
                </label>
              </div>
            </div>

            {/* Import Error Message */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedImportRecords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Preview Hasil Parsing ({parsedImportRecords.length} Data Siap Diimpor)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Format Valid
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto overflow-x-auto border border-slate-200 rounded-xl text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Operator</th>
                        <th className="py-2 px-3 text-right">KM</th>
                        <th className="py-2 px-3 text-center">SOC</th>
                        <th className="py-2 px-3 text-center">Charging</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {parsedImportRecords.slice(0, 5).map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">{rec.date}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{rec.unitNumber}</td>
                          <td className="py-2 px-3 font-sans text-slate-800">{rec.operatorName}</td>
                          <td className="py-2 px-3 text-right">{rec.startKm} → {rec.endKm}</td>
                          <td className="py-2 px-3 text-center">{rec.startSoc}% → {rec.endSoc}%</td>
                          <td className="py-2 px-3 text-center text-emerald-600 font-bold">
                            {rec.charging && rec.charging.percentCharged > 0 ? `+${rec.charging.percentCharged}%` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {rec.overallStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedImportRecords.length > 5 && (
                    <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50 italic">
                      + {parsedImportRecords.length - 5} data baris tambahan lainnya akan ikut diimpor.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setParsedImportRecords([]);
                  setImportError(null);
                  setUploadFileName('');
                }}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={parsedImportRecords.length === 0}
                onClick={confirmImport}
                className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Impor {parsedImportRecords.length} Data Log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
