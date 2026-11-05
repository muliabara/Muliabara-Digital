import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit, AppSettings } from '../types/p2h';
import { BatteryCharging, Search, FileSpreadsheet, Calendar, Zap, ShieldCheck, FileText, ArrowRight, MapPin, User, Truck } from 'lucide-react';
import { getGlassCardClass } from '../utils/glass';
import { exportChargingLogToExcel } from '../utils/excelExport';

interface ChargingLogViewProps {
  records: P2HFormRecord[];
  vehicles: VehicleUnit[];
  settings?: AppSettings;
}

export const ChargingLogView: React.FC<ChargingLogViewProps> = ({
  records,
  vehicles,
  settings
}) => {
  const glassCard = getGlassCardClass(settings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract charging sessions from P2H records
  const chargingSessions = useMemo(() => {
    return records
      .filter(r => r.charging && r.charging.percentCharged > 0)
      .map(r => ({
        id: r.id,
        date: r.date,
        shift: r.shift,
        unitNumber: r.unitNumber,
        operatorName: r.operatorName,
        operatorNik: r.operatorNik,
        percentCharged: r.charging?.percentCharged || 0,
        energyAddedKwh: r.charging?.energyAddedKwh || 0,
        estimatedRangeKm: r.charging?.estimatedRangeKm || 0,
        chargingLocation: r.charging?.chargingLocation || 'SPKLU Utama'
      }));
  }, [records]);

  // Filtered charging logs
  const filteredSessions = useMemo(() => {
    return chargingSessions.filter(s => {
      const matchUnit = selectedUnit === 'all' || s.unitNumber === selectedUnit;
      
      const recordDate = (s.date || '').split('T')[0].trim();
      let matchDate = true;
      if (startDate && endDate) {
        matchDate = recordDate >= startDate && recordDate <= endDate;
      } else if (startDate) {
        // If user selects a specific start date only, match that exact day
        matchDate = recordDate === startDate;
      } else if (endDate) {
        matchDate = recordDate <= endDate;
      }

      const matchQuery = 
        !searchQuery ||
        s.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.operatorNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.chargingLocation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchUnit && matchDate && matchQuery;
    });
  }, [chargingSessions, selectedUnit, startDate, endDate, searchQuery]);

  const totalChargingKwh = filteredSessions.reduce((acc, s) => acc + s.energyAddedKwh, 0);
  const totalChargingCost = Math.round(totalChargingKwh * 2475);

  const handleExportExcel = () => {
    exportChargingLogToExcel(filteredSessions);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full overflow-x-hidden font-sans">
      {/* Banner */}
      <div className={`${glassCard} p-5 sm:p-8`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                STATION EV CHARGING LOG
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                PENGISIAN DAYA BATERAI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Log Riwayat Pengisian Daya (EV Charging Log)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekapitulasi seluruh sesi pengisian baterai CATL LFP JAC T9 EV, kWh terisi, estimasi jarak tambahan, dan lokasi SPKLU.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Unduh Log Charging (Excel .xlsx)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 text-xs">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60 space-y-1">
            <span className="text-emerald-800 font-bold block">Total Sesi Charging</span>
            <span className="text-2xl font-black font-mono text-emerald-900">{filteredSessions.length} Sesi</span>
            <span className="text-[10px] text-emerald-700 block">Tercatat dari formulir P2H EV</span>
          </div>

          <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200/60 space-y-1">
            <span className="text-sky-900 font-bold block">Total kWh Terisi</span>
            <span className="text-2xl font-black font-mono text-sky-700">{totalChargingKwh.toFixed(1)} kWh</span>
            <span className="text-[10px] text-sky-800 block">Akumulasi daya pengisian SPKLU</span>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1">
            <span className="text-amber-900 font-bold block">Estimasi Biaya PLN</span>
            <span className="text-2xl font-black font-mono text-amber-700">Rp {totalChargingCost.toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-amber-800 block">Tarif SPKLU EV Rp 2.475 / kWh</span>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari driver, unit, SPKLU..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
              />
            </div>

            <div>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
              >
                <option value="all">Semua Unit EV</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.unitNumber}>{v.unitNumber} - {v.model}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-full">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  title="Pilih tanggal mulai"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                />
              </div>
              <span className="text-slate-400 font-bold text-xs shrink-0">s/d</span>
              <div className="w-full">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  title="Pilih tanggal akhir (opsional untuk rentang)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {(startDate || endDate || searchQuery || selectedUnit !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUnit('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 6: MOBILE CARD LIST VIEW (NO HORIZONTAL SCROLL) */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800">
            Riwayat Sesi Charging ({filteredSessions.length})
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono font-bold">
            Tampilan Mobile Card
          </span>
        </div>

        {filteredSessions.length === 0 ? (
          <div className={`${glassCard} p-8 text-center text-slate-400 text-xs`}>
            Belum ada riwayat sesi charging yang tercatat pada formulir P2H.
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <div 
              key={`m-chg-${session.id}-${index}`}
              className={`${glassCard} p-4 space-y-3 font-sans`}
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-mono font-black text-sky-700 text-sm">{session.unitNumber}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {session.date} ({session.shift})
                  </span>
                </div>

                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                  +{session.percentCharged}% SOC
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Driver / Operator</span>
                  <span className="font-bold text-slate-900 block truncate">{session.operatorName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">NIK: {session.operatorNik}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Lokasi Stasiun SPKLU</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    {session.chargingLocation}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">kWh Terisi</span>
                  <span className="font-mono font-black text-sky-700 block text-xs">{session.energyAddedKwh} kWh</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Estimasi Tambahan Jarak</span>
                  <span className="font-mono font-black text-emerald-700 block text-xs">~{session.estimatedRangeKm} KM</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className={`hidden sm:block ${glassCard} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-white/80 bg-white/60 backdrop-blur-xs flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-600" />
            Daftar Sesi Pengisian Daya Aktif
          </h2>
          <span className="text-xs font-mono font-medium text-slate-500">
            {filteredSessions.length} Sesi Ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/70 backdrop-blur-xs text-slate-700 font-bold border-b border-white/80">
              <tr>
                <th className="py-3 px-4">Tanggal & Shift</th>
                <th className="py-3 px-4">No. Unit</th>
                <th className="py-3 px-4">Operator / Driver</th>
                <th className="py-3 px-4 text-center">% Terisi (SOC Added)</th>
                <th className="py-3 px-4 text-right font-mono">Energi (kWh)</th>
                <th className="py-3 px-4 text-right font-mono">Est. Jarak</th>
                <th className="py-3 px-4">Lokasi SPKLU / Charging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat sesi charging yang tercatat pada formulir P2H. Silakan isi form P2H dengan menyertakan % charging.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, index) => (
                  <tr key={`${session.id}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900 block">{session.date}</span>
                      <span className="text-[11px] text-slate-500">{session.shift}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      {session.unitNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{session.operatorName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">NIK: {session.operatorNik}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                        +{session.percentCharged}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-600">
                      {session.energyAddedKwh} kWh
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      ~{session.estimatedRangeKm} KM
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {session.chargingLocation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
