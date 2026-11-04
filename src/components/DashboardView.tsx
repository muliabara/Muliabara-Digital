import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit, AppSettings, UserProfile } from '../types/p2h';
import { 
  Zap, 
  Truck, 
  ClipboardList, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  BarChart3, 
  BatteryCharging, 
  Battery, 
  FileText, 
  Download, 
  Filter, 
  RefreshCcw, 
  Activity,
  User,
  CheckCircle2,
  ChevronRight,
  Info,
  ArrowRight,
  Clock,
  Plus,
  ExternalLink,
  Flame,
  Gauge,
  Check,
  X
} from 'lucide-react';
import { getGlassCardClass } from '../utils/glass';
import { getEffectiveRecordMetrics } from '../utils/telemetry';

interface DashboardViewProps {
  vehicles: VehicleUnit[];
  records: P2HFormRecord[];
  settings: AppSettings;
  currentUser?: UserProfile;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onNavigate: (nav: 'dashboard' | 'p2h' | 'log' | 'charging_log' | 'units' | 'account' | 'settings') => void;
  onCreateP2H: () => void;
  onApproveRecord?: (formId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vehicles,
  records,
  settings,
  currentUser,
  onUpdateSettings,
  onNavigate,
  onCreateP2H,
  onApproveRecord
}) => {
  const glassCard = getGlassCardClass(settings);
  const canApprove = ['master admin', 'admin', 'foreman', 'pengawas'].includes(
    (currentUser?.role || '').toLowerCase().trim()
  );

  // Filters & State
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    // If records exist for current month, use current month; else default to -1 (Semua Bulan)
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    const hasCurrentMonth = (records || []).some(r => {
      const cleanDate = (r.date || '').split('T')[0].trim();
      const parts = cleanDate.split('-');
      if (parts.length >= 2) {
        return parseInt(parts[0], 10) === curYear && (parseInt(parts[1], 10) - 1) === curMonth;
      }
      return false;
    });
    return hasCurrentMonth ? curMonth : -1;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Available vehicle list for dropdown
  const unitList = useMemo(() => {
    const list = (vehicles || []).map(v => v.unitNumber);
    return Array.from(new Set(list));
  }, [vehicles]);

  // Robust string-based date filtering immune to timezone shifts
  const filteredRecords = useMemo(() => {
    return (records || []).filter(r => {
      if (!r) return false;
      // Unit filter
      if (selectedUnit !== 'all' && r.unitNumber !== selectedUnit) return false;
      
      // Clean date string YYYY-MM-DD
      const cleanDate = (r.date || '').split('T')[0].trim();
      const parts = cleanDate.split('-');
      if (parts.length < 3) return true;

      const rYear = parseInt(parts[0], 10);
      const rMonth = parseInt(parts[1], 10) - 1; // 0-indexed

      if (selectedYear && !isNaN(rYear) && rYear !== selectedYear) {
        // match year if set
        return false;
      }

      if (selectedMonth !== -1 && !isNaN(rMonth) && rMonth !== selectedMonth) {
        return false;
      }

      return true;
    });
  }, [records, selectedUnit, selectedMonth, selectedYear]);

  // KPI Metrics calculated strictly from filtered records
  const totalKwh = filteredRecords.reduce((acc, r) => acc + (getEffectiveRecordMetrics(r).energyConsumedKwh || 0), 0);
  const totalKm = filteredRecords.reduce((acc, r) => acc + (r.totalKm || 0), 0);
  const totalCo2 = filteredRecords.reduce((acc, r) => acc + (r.co2ReductionKg || 0), 0);
  const totalSavings = filteredRecords.reduce((acc, r) => acc + (r.costSavingsIdr || 0), 0);
  const approvedCount = filteredRecords.filter(r => r.overallStatus === 'approved').length;
  const monthChargingTotal = filteredRecords.reduce((acc, r) => acc + (r.charging?.energyAddedKwh || 0), 0);

  // 1 Calendar Month (Days 1 to DaysInMonth) Dynamic Data Grid
  const daysInMonth = useMemo(() => {
    if (selectedMonth === -1) return 31;
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthName = useMemo(() => {
    if (selectedMonth === -1) return 'Semua Bulan';
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return names[selectedMonth] || 'Bulan Ini';
  }, [selectedMonth]);

  // Daily aggregated metrics array for the entire calendar month (1..daysInMonth)
  const monthlyData = useMemo(() => {
    const daysArr = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = selectedMonth === -1 ? '' : String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const targetDateStr = selectedMonth === -1 ? `-${dayStr}` : `${selectedYear}-${monthStr}-${dayStr}`;

      const dayRecords = filteredRecords.filter(r => {
        const cleanDate = (r.date || '').split('T')[0].trim();
        if (selectedMonth === -1) {
          return cleanDate.endsWith(`-${dayStr}`);
        }
        return cleanDate === targetDateStr;
      });

      const kwh = dayRecords.reduce((acc, r) => acc + (getEffectiveRecordMetrics(r).energyConsumedKwh || 0), 0);
      const km = dayRecords.reduce((acc, r) => acc + (r.totalKm || 0), 0);
      const chargingKwh = dayRecords.reduce((acc, r) => acc + (r.charging?.energyAddedKwh || 0), 0);
      const savings = dayRecords.reduce((acc, r) => acc + (r.costSavingsIdr || 0), 0);

      daysArr.push({
        dayNumber: day,
        dateStr: targetDateStr,
        kwh: Number(kwh.toFixed(1)),
        km: Number(km.toFixed(0)),
        chargingKwh: Number(chargingKwh.toFixed(1)),
        savings,
        count: dayRecords.length,
        records: dayRecords
      });
    }

    return daysArr;
  }, [daysInMonth, selectedMonth, selectedYear, filteredRecords]);

  // Max scale for chart rendering - guarantees headroom for 88.02 kWh CATL battery charges
  const maxKwhInMonth = useMemo(() => {
    const maxKwh = Math.max(...monthlyData.map(d => d.kwh), 10);
    const maxChg = Math.max(...monthlyData.map(d => d.chargingKwh), 10);
    const max = Math.max(maxKwh, maxChg, 88);
    return Math.ceil((max * 1.15) / 10) * 10;
  }, [monthlyData]);

  const maxKmInMonth = useMemo(() => {
    const max = Math.max(...monthlyData.map(d => d.km), 50);
    return Math.ceil(max * 1.25);
  }, [monthlyData]);

  // CSV Export
  const handleDownloadCsv = () => {
    const headers = ['Tanggal', 'Unit', 'Total Form P2H', 'Konsumsi Energi (kWh)', 'Jarak Tempuh (KM)', 'Pengisian Charging (kWh)'];
    const rows = monthlyData.map(d => [
      `"${d.dateStr}"`,
      `"${selectedUnit === 'all' ? 'Semua Unit' : selectedUnit}"`,
      d.count,
      d.kwh,
      d.km,
      d.chargingKwh
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grafik_P2H_JAC_T9_${selectedUnit}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recent charging sessions
  const recentCharging = useMemo(() => {
    return records
      .filter(r => r.charging && r.charging.energyAddedKwh > 0)
      .slice(0, 5);
  }, [records]);

  // Recent P2H records
  const recentRecords = useMemo(() => {
    return records.slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-6 w-full font-sans antialiased text-slate-700">

      {/* 1. SOFT UI 4-CARD STATISTICS ROW (Compact 2x2 on Mobile view) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        
        {/* Card 1: Konsumsi Energi Bulan Ini */}
        <div className={`relative flex flex-col min-w-0 break-words ${glassCard} p-3 sm:p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <p className="font-sans font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0 truncate">
                Konsumsi Energi
              </p>
              <h5 className="font-extrabold text-base sm:text-2xl text-slate-800 tracking-tight mb-0 truncate">
                {totalKwh.toFixed(1)} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">kWh</span>
              </h5>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 mb-0 truncate">
                <span className="font-black">+14.2%</span>
                <span className="text-slate-400 font-medium font-sans hidden sm:inline">efisiensi vs diesel</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tl from-blue-700 to-cyan-500 shadow-soft-2xl flex items-center justify-center text-white shrink-0">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Jarak Tempuh */}
        <div className={`relative flex flex-col min-w-0 break-words ${glassCard} p-3 sm:p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <p className="font-sans font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0 truncate">
                Jarak Tempuh
              </p>
              <h5 className="font-extrabold text-base sm:text-2xl text-slate-800 tracking-tight mb-0 truncate">
                {totalKm.toLocaleString('id-ID')} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">KM</span>
              </h5>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 mb-0 truncate">
                <span className="font-black">+{filteredRecords.length} Form</span>
                <span className="text-slate-400 font-medium font-sans hidden sm:inline">shift operasional</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 shadow-soft-2xl flex items-center justify-center text-white shrink-0">
              <Truck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Pengisian SPKLU */}
        <div className={`relative flex flex-col min-w-0 break-words ${glassCard} p-3 sm:p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <p className="font-sans font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0 truncate">
                Pengisian SPKLU
              </p>
              <h5 className="font-extrabold text-base sm:text-2xl text-slate-800 tracking-tight mb-0 truncate">
                {monthChargingTotal.toFixed(1)} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">kWh</span>
              </h5>
              <p className="text-[10px] sm:text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-0.5 mb-0 truncate">
                <span className="font-black">CCS2 Fast Chg</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tl from-amber-500 to-orange-400 shadow-soft-2xl flex items-center justify-center text-white shrink-0">
              <BatteryCharging className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Kesiapan Armada Fleet */}
        <div className={`relative flex flex-col min-w-0 break-words ${glassCard} p-3 sm:p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl`}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <p className="font-sans font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0 truncate">
                Kesiapan Fleet
              </p>
              <h5 className="font-extrabold text-base sm:text-2xl text-slate-800 tracking-tight mb-0 truncate">
                {vehicles.filter(v => v.status === 'ready' || v.status === 'operating').length} / {vehicles.length} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Unit</span>
              </h5>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 mb-0 truncate">
                <span className="font-black">100% Laik</span>
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tl from-emerald-600 to-teal-400 shadow-soft-2xl flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

      </div>

      {/* 2. SOFT UI CHART CARD (Sales Overview -> Grafik Konsumsi Energi & Charging EV) */}
      <div className={`relative flex flex-col min-w-0 break-words ${glassCard} p-5 sm:p-6`}>
        
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h6 className="font-extrabold text-base text-slate-800 tracking-tight mb-0.5">
              Tren Konsumsi Energi & Pengisian EV
            </h6>
            <p className="text-xs text-slate-400 mb-0">
              <span className="font-bold text-emerald-600">(+14.2% efisiensi)</span> dibanding unit diesel konvensional · Site Sun Mining Kutai
            </p>
          </div>

          {/* Filters & Export Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unit Dropdown */}
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-soft-xxs focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Unit Fleet EV</option>
              {unitList.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-soft-xxs focus:bg-white focus:outline-none"
            >
              <option value={-1}>Semua Bulan</option>
              {[
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ].map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-soft-xxs focus:bg-white focus:outline-none font-mono"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            {/* CSV Download Button */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl shadow-soft-xxs transition-colors cursor-pointer"
              title="Unduh Data CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Interactive SVG Smooth Area Chart with Soft UI Styling */}
        <div className="pt-6 pb-2">
          {(() => {
            const svgW = 1000;
            const svgH = 320;
            const padLeft = 45;
            const padRight = 45;
            const padTop = 25;
            const padBottom = 45;
            const graphW = svgW - padLeft - padRight;
            const graphH = svgH - padTop - padBottom;
            const stepX = graphW / (daysInMonth - 1 || 1);

            // Compute points for daily curves
            const kwhPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];
            const kmPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];
            const chgPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];

            monthlyData.forEach((d, idx) => {
              const x = padLeft + idx * stepX;
              const rawYKwh = padTop + graphH - (d.kwh / (maxKwhInMonth || 1)) * graphH;
              const rawYKm = padTop + graphH - (d.km / (maxKmInMonth || 1)) * graphH;
              const rawYChg = padTop + graphH - (d.chargingKwh / (maxKwhInMonth || 1)) * graphH;

              // Strict boundary clamping so lines stay beautifully inside chart bounds
              const yKwh = Math.max(padTop + 10, Math.min(padTop + graphH, rawYKwh));
              const yKm = Math.max(padTop + 10, Math.min(padTop + graphH, rawYKm));
              const yChg = Math.max(padTop + 10, Math.min(padTop + graphH, rawYChg));

              kwhPoints.push({ x, y: yKwh, day: d.dayNumber, val: d.kwh, records: d.records });
              kmPoints.push({ x, y: yKm, day: d.dayNumber, val: d.km, records: d.records });
              chgPoints.push({ x, y: yChg, day: d.dayNumber, val: d.chargingKwh, records: d.records });
            });

            // Smooth SVG Catmull-Rom path generator
            const buildSmoothPath = (pts: { x: number; y: number }[]) => {
              if (pts.length === 0) return '';
              let path = `M ${pts[0].x},${pts[0].y}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i];
                const p1 = pts[i + 1];
                const cpX = (p0.x + p1.x) / 2;
                path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
              }
              return path;
            };

            const kwhLinePath = buildSmoothPath(kwhPoints);
            const kmLinePath = buildSmoothPath(kmPoints);
            const chgLinePath = buildSmoothPath(chgPoints);

            const kwhAreaPath = `${kwhLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;
            const kmAreaPath = `${kmLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;
            const chgAreaPath = `${chgLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;

            return (
              <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-auto max-h-[300px] overflow-visible select-none">
                <defs>
                  {/* Soft UI Gradients */}
                  <linearGradient id="soft-kwh-area" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="soft-km-area" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="soft-chg-area" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = padTop + pct * graphH;
                  const kwhVal = Math.round((1 - pct) * maxKwhInMonth);
                  const kmVal = Math.round((1 - pct) * maxKmInMonth);
                  return (
                    <g key={i}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgW - padRight}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={pct === 1 ? '0' : '4,4'}
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y}
                        dominantBaseline="central"
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="600"
                        className="font-mono"
                      >
                        {kwhVal}
                      </text>
                      <text
                        x={svgW - padRight + 8}
                        y={y}
                        dominantBaseline="central"
                        textAnchor="start"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="600"
                        className="font-mono"
                      >
                        {kmVal}
                      </text>
                    </g>
                  );
                })}

                {/* Soft Area Fills */}
                <path d={kwhAreaPath} fill="url(#soft-kwh-area)" />
                <path d={kmAreaPath} fill="url(#soft-km-area)" />
                <path d={chgAreaPath} fill="url(#soft-chg-area)" />

                {/* Smooth Curve Lines */}
                <path d={kwhLinePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                <path d={kmLinePath} fill="none" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                <path d={chgLinePath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                {/* Data Points and Interaction Circles */}
                {monthlyData.map((d, idx) => {
                  const pt = kwhPoints[idx];
                  const kmPt = kmPoints[idx];
                  const chgPt = chgPoints[idx];
                  const isHovered = hoveredDay === d.dayNumber;

                  return (
                    <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredDay(d.dayNumber)} onMouseLeave={() => setHoveredDay(null)}>
                      {/* X Axis Date Tick */}
                      <text
                        x={pt.x}
                        y={padTop + graphH + 20}
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill={isHovered ? "#0f172a" : "#94a3b8"}
                        fontSize={isHovered ? "11" : "10"}
                        fontWeight={isHovered ? "800" : "600"}
                        className="font-mono transition-all"
                      >
                        {d.dayNumber}
                      </text>

                      {/* Hover Vertical Guide Line */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={padTop}
                          x2={pt.x}
                          y2={padTop + graphH}
                          stroke="#64748b"
                          strokeDasharray="3,3"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Circles on Points with Data */}
                      {pt.val > 0 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 3.5}
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          className="transition-all"
                        />
                      )}

                      {kmPt.val > 0 && (
                        <circle
                          cx={kmPt.x}
                          cy={kmPt.y}
                          r={isHovered ? 5 : 3}
                          fill="#ffffff"
                          stroke="#9333ea"
                          strokeWidth="2"
                          className="transition-all"
                        />
                      )}

                      {chgPt.val > 0 && (
                        <circle
                          cx={chgPt.x}
                          cy={chgPt.y}
                          r={isHovered ? 6 : 3.5}
                          fill="#ffffff"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          className="transition-all"
                        />
                      )}

                      {/* Floating Tooltip Badge on Active Points */}
                      {isHovered && (
                        <g transform={`translate(${pt.x}, ${Math.max(padTop + 14, Math.min(pt.y, kmPt.y, chgPt.val > 0 ? chgPt.y : pt.y) - 18)})`}>
                          <rect
                            x="-58"
                            y="-14"
                            width="116"
                            height="22"
                            rx="6"
                            fill="#0f172a"
                            stroke={chgPt.val > 0 ? "#f59e0b" : "#38bdf8"}
                            strokeWidth="1"
                            opacity="0.95"
                          />
                          <text
                            x="0"
                            y="-1"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="800"
                            className="font-mono select-none"
                          >
                            {pt.val}kWh · {kmPt.val}KM{chgPt.val > 0 ? ` · ⚡${chgPt.val}` : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-600 shadow-soft-xxs"></span>
              <span>Konsumsi Energi (kWh)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-purple-600 shadow-soft-xxs"></span>
              <span>Jarak Tempuh (KM)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-soft-xxs"></span>
              <span>EV Charging Terisi (kWh)</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Total Periode: {totalKwh.toFixed(1)} kWh · {totalKm} KM · {monthChargingTotal.toFixed(1)} kWh Chg
          </div>
        </div>

      </div>

      {/* 4. SOFT UI BOTTOM 2-COLUMN SECTION (Projects Table & Orders Overview Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Card (7 cols): Projects Table -> Formulir P2H Terkini & Status K3 */}
        <div className={`lg:col-span-7 relative flex flex-col min-w-0 break-words ${glassCard} p-5 sm:p-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h6 className="font-extrabold text-base text-slate-800 tracking-tight mb-0.5">
                Formulir P2H Terkini & Status Approval
              </h6>
              <p className="text-xs text-slate-400 mb-0">
                {records.length} total dokumen inspeksi tersimpan di database
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('log')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Lihat Semua →
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3">Unit Fleet</th>
                  <th className="py-3 px-3">Driver / Operator</th>
                  <th className="py-3 px-3 text-center">KM & SOC</th>
                  <th className="py-3 px-3 text-right">Konsumsi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.map(rec => {
                  const eff = getEffectiveRecordMetrics(rec);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono shadow-soft-xxs">
                            EV
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block font-mono text-xs">{rec.unitNumber}</span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-28">{rec.date} ({rec.shift})</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{rec.operatorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{rec.operatorNik}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-bold text-slate-700 block">+{eff.totalKm} KM</span>
                        <span className="text-[10px] text-slate-400">{rec.startSoc}% → {rec.endSoc}%</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-extrabold text-sky-600 block">{eff.energyConsumedKwh} kWh</span>
                        <span className="text-[10px] text-emerald-600 font-bold">{eff.consumptionRateKwhPerKm} kWh/km</span>
                      </td>

                    <td className="py-3 px-3 text-center">
                      {rec.overallStatus === 'approved' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Disetujui
                        </span>
                      ) : rec.overallStatus === 'rejected' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Ditolak
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Menunggu
                          </span>
                          {onApproveRecord && canApprove && (
                            <button
                              type="button"
                              onClick={() => onApproveRecord(rec.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Setujui (Approve) Formulir P2H"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card (5 cols): Orders Overview -> Log Pengisian SPKLU & Aktivitas Timeline */}
        <div className={`lg:col-span-5 relative flex flex-col min-w-0 break-words ${glassCard} p-5 sm:p-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h6 className="font-extrabold text-base text-slate-800 tracking-tight mb-0.5">
                Log Pengisian SPKLU & Aktivitas
              </h6>
              <p className="text-xs text-slate-400 mb-0">
                Riwayat charging CCS2 Fast Charger site tambang
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('charging_log')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Lihat →
            </button>
          </div>

          {/* Timeline List */}
          <div className="pt-4 space-y-4">
            {recentCharging.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada data sesi pengisian daya yang tercatat.
              </div>
            ) : (
              recentCharging.map((item, idx) => (
                <div key={item.id || idx} className="relative flex items-start gap-3">
                  {/* Timeline connector dot */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-soft-sm mt-0.5">
                    <BatteryCharging className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">
                        {item.unitNumber} (+{item.charging?.energyAddedKwh} kWh)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {item.charging?.chargingLocation || 'SPKLU Central Pit'} · Driver: {item.operatorName}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Terisi {item.charging?.percentCharged}% (+{item.charging?.estimatedRangeKm} KM Range)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
