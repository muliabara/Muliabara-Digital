import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit } from '../types/p2h';
import { 
  Zap, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Eye, 
  DollarSign, 
  Leaf,
  Layers
} from 'lucide-react';

interface DailyResumeViewProps {
  records: P2HFormRecord[];
  vehicles: VehicleUnit[];
  onViewRecord: (record: P2HFormRecord) => void;
  onPrintRecord: (record: P2HFormRecord) => void;
}

export const DailyResumeView: React.FC<DailyResumeViewProps> = ({
  records,
  vehicles,
  onViewRecord,
  onPrintRecord
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchUnit = selectedUnit === 'all' || r.unitNumber === selectedUnit;
      const matchDate = !selectedDate || r.date === selectedDate;
      const matchQuery = !searchQuery || 
        r.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.workLocation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUnit && matchDate && matchQuery;
    });
  }, [records, selectedUnit, selectedDate, searchQuery]);

  // Aggregate metrics
  const aggregateMetrics = useMemo(() => {
    let totalKm = 0;
    let totalKwh = 0;
    let totalSoc = 0;
    let totalSavingsIdr = 0;
    let totalCo2Kg = 0;

    filteredRecords.forEach(r => {
      totalKm += r.totalKm;
      totalKwh += r.energyConsumedKwh;
      totalSoc += r.batteryUsedPercent;
      totalSavingsIdr += r.costSavingsIdr;
      totalCo2Kg += r.co2ReductionKg;
    });

    const avgKwhPerKm = totalKm > 0 ? Number((totalKwh / totalKm).toFixed(3)) : 0;
    const avgKmPerKwh = totalKwh > 0 ? Number((totalKm / totalKwh).toFixed(2)) : 0;
    const avgSocUsed = filteredRecords.length > 0 ? Math.round(totalSoc / filteredRecords.length) : 0;

    return {
      count: filteredRecords.length,
      totalKm,
      totalKwh: Number(totalKwh.toFixed(2)),
      avgKwhPerKm,
      avgKmPerKwh,
      avgSocUsed,
      totalSavingsIdr,
      totalCo2Kg: Number(totalCo2Kg.toFixed(1))
    };
  }, [filteredRecords]);

  // CSV export handler
  const exportToCsv = () => {
    const headers = [
      'No Dokumen',
      'Tanggal',
      'Shift',
      'No Unit',
      'Model Unit',
      'Operator',
      'NIK Operator',
      'KM Awal',
      'KM Akhir',
      'Total KM',
      'SOC Awal (%)',
      'SOC Akhir (%)',
      'Baterai Terpakai (%)',
      'Konversi Energi (kWh)',
      'Konsumsi (kWh/km)',
      'Penghematan (IDR)',
      'Reduksi CO2 (kg)',
      'Status P2H',
      'Foreman Approval'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.docNumber}"`,
      `"${r.date}"`,
      `"${r.shift}"`,
      `"${r.unitNumber}"`,
      `"${r.unitModel}"`,
      `"${r.operatorName}"`,
      `"${r.operatorNik}"`,
      r.startKm,
      r.endKm,
      r.totalKm,
      r.startSoc,
      r.endSoc,
      r.batteryUsedPercent,
      r.energyConsumedKwh,
      r.consumptionRateKwhPerKm,
      r.costSavingsIdr,
      r.co2ReductionKg,
      `"${r.overallStatus}"`,
      `"${r.foremanApproval.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Resume_Harian_KM_KWH_JAC_T9_EV_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                TELEMETRI & AUDIT ENERGI
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                JAC T9 EV FLEET
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Resume Harian Pencatatan KM & Konversi Pemakaian Baterai (kWh)
            </h1>
            <p className="text-xs text-slate-500">
              Pelacakan odometer, penurunan State of Charge (SOC), konversi ke kilowatt-hour (kWh), serta efisiensi energi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Ekspor Laporan (CSV)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Filter Unit Kendaraan</label>
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              <option value="all">Semua Unit JAC T9 EV</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.unitNumber}>
                  {v.unitNumber} - {v.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Filter Tanggal Tertentu</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-2 py-2 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg"
                  title="Reset Tanggal"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Cari Operator / Lokasi</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama atau lokasi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Jarak Ditempuh
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {aggregateMetrics.totalKm.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-400 font-mono">KM</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari {aggregateMetrics.count} shift tercatat
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center justify-between">
            <span>Total Energi Terpakai</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-sky-600 tabular-nums">
              {aggregateMetrics.totalKwh.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-sky-500 font-mono">kWh</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Rata-rata {aggregateMetrics.avgSocUsed}% SOC / shift
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Efisiensi Armada
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 tabular-nums">
              {aggregateMetrics.avgKwhPerKm}
            </span>
            <span className="text-xs text-slate-500 font-mono">kWh/km</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Setara {aggregateMetrics.avgKmPerKwh} km / kWh
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center justify-between">
            <span>Estimasi Penghematan</span>
            <Leaf className="w-3.5 h-3.5 text-teal-600" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-teal-700 tabular-nums">
              Rp {(aggregateMetrics.totalSavingsIdr / 1000).toFixed(0)}k
            </span>
            <span className="text-xs text-slate-400 font-mono">IDR</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Reduksi -{aggregateMetrics.totalCo2Kg} kg CO₂
          </span>
        </div>
      </div>

      {/* Daily Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Buku Log Harian Operasional & Konversi Energi Listrik
            </h2>
            <p className="text-xs text-slate-500">
              Daftar form P2H lengkap dengan data odometer awal/akhir dan persentase baterai.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">
            {filteredRecords.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal & Shift</th>
                <th className="py-3 px-4">Unit & Lokasi</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-3 text-right font-mono">KM Awal</th>
                <th className="py-3 px-3 text-right font-mono">KM Akhir</th>
                <th className="py-3 px-3 text-right font-mono font-bold text-slate-900">Δ KM</th>
                <th className="py-3 px-3 text-center">SOC (%)</th>
                <th className="py-3 px-4 text-right font-mono font-bold text-sky-700">Konversi (kWh)</th>
                <th className="py-3 px-3 text-right font-mono">kWh/km</th>
                <th className="py-3 px-4 text-center">Status P2H</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data resume yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
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

                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {record.startKm.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {record.endKm.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        +{record.totalKm} km
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="font-mono text-xs">
                          <span className="text-slate-700">{record.startSoc}%</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="text-slate-900 font-bold">{record.endSoc}%</span>
                        </div>
                        <span className="text-[10px] text-amber-600 font-semibold block">
                          Terpakai {record.batteryUsedPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold font-mono text-sky-700 tabular-nums block">
                          {record.energyConsumedKwh} kWh
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (88.02 kWh pack)
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                        {record.consumptionRateKwhPerKm}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {record.overallStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Disetujui
                          </span>
                        )}
                        {record.overallStatus === 'pending_approval' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Review Foreman
                          </span>
                        )}
                        {record.overallStatus === 'needs_maintenance' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Perlu Mekanik
                          </span>
                        )}
                        {record.overallStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-md">
                            <AlertCircle className="w-3 h-3 text-rose-700" />
                            Ditolak / Stop
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onViewRecord(record)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                            title="Lihat Detail Form"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintRecord(record)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Pratinjau / Cetak PDF Resmi F-QHSE-OPS-MOB-09"
                          >
                            <FileText className="w-4 h-4" />
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
    </div>
  );
};
