import React, { useState } from 'react';
import { VehicleUnit, MaintenanceLog } from '../types/p2h';
import { JAC_T9_MAINTENANCE_TIERS } from '../data/checklistConfig';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  BatteryCharging, 
  PlusCircle, 
  History, 
  Check, 
  ChevronRight, 
  Cpu, 
  ShieldCheck,
  X
} from 'lucide-react';

interface MaintenanceReminderViewProps {
  vehicles: VehicleUnit[];
  maintenanceLogs: MaintenanceLog[];
  onCompleteService: (newLog: MaintenanceLog, updatedNextKwh: number) => void;
}

export const MaintenanceReminderView: React.FC<MaintenanceReminderViewProps> = ({
  vehicles,
  maintenanceLogs,
  onCompleteService
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(vehicles[0]?.id || '');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reminders' | 'tiers' | 'history'>('reminders');

  // Form state for completing service
  const [serviceUnitNumber, setServiceUnitNumber] = useState(vehicles[0]?.unitNumber || 'LV-EV-01');
  const [serviceTier, setServiceTier] = useState<string>('PM-2 (3.000 kWh)');
  const [workOrderNumber, setWorkOrderNumber] = useState(`WO-EV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [mechanicName, setMechanicName] = useState('Hendra Gunawan');
  const [mechanicNik, setMechanicNik] = useState('MEK-4109');
  const [serviceNotes, setServiceNotes] = useState('Inspeksi berkala kWh selesai dilakukan sesuai standar SOP kelistrikan EV.');
  const [replacedParts, setReplacedParts] = useState('Oli Gardan Reducer Drivetrain (GL-5), Filter Kabin HEPA');
  const [batteryHealthSoH, setBatteryHealthSoH] = useState<number>(98.6);

  const selectedVehicle = vehicles.find(v => v.id === selectedUnitId) || vehicles[0];

  // Open modal with preselected unit
  const openLogServiceForUnit = (veh: VehicleUnit) => {
    setServiceUnitNumber(veh.unitNumber);
    // Find next appropriate tier based on nextServiceKwh
    const matchedTier = JAC_T9_MAINTENANCE_TIERS.find(t => t.intervalKwh === veh.nextServiceKwh);
    if (matchedTier) {
      setServiceTier(matchedTier.name);
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = () => {
    const targetVeh = vehicles.find(v => v.unitNumber === serviceUnitNumber) || selectedVehicle;
    
    // Determine next interval kWh
    let nextTarget = targetVeh.nextServiceKwh + 1500;
    if (targetVeh.nextServiceKwh === 1500) nextTarget = 3000;
    else if (targetVeh.nextServiceKwh === 3000) nextTarget = 6000;
    else if (targetVeh.nextServiceKwh === 6000) nextTarget = 12000;
    else if (targetVeh.nextServiceKwh >= 12000) nextTarget = targetVeh.nextServiceKwh + 3000;

    const newLog: MaintenanceLog = {
      id: `mlog-${Date.now()}`,
      unitNumber: serviceUnitNumber,
      serviceDate: new Date().toISOString().split('T')[0],
      serviceTier,
      kwhAtService: targetVeh.cumulativeKwh,
      kmAtService: targetVeh.currentOdoKm,
      workOrderNumber,
      mechanicName,
      mechanicNik,
      notes: serviceNotes,
      replacedParts: replacedParts.split(',').map(s => s.trim()).filter(Boolean),
      batteryHealthSoH
    };

    onCompleteService(newLog, nextTarget);
    setIsServiceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                PREVENTIVE MAINTENANCE (PM)
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                SISTEM PENGINGAT SERVIS KWH
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Pengingat Perawatan Berkala Berbasis Pemakaian Energi (kWh)
            </h1>
            <p className="text-xs text-slate-500">
              Jadwal servis preventif dihitung dari total throughput kilowatt-hour (kWh) baterai traksi JAC T9 EV dan motor penggerak.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Catat Servis Selesai & Reset Interval
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Status Servis Armada Aktif ({vehicles.length} Unit)
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'tiers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Standar Tier Servis JAC T9 EV
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Servis Selesai ({maintenanceLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: STATUS SERVIS ARMADA */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map(veh => {
              const currentKwh = veh.cumulativeKwh;
              const nextKwh = veh.nextServiceKwh;
              const lastKwh = veh.lastServiceKwh;
              const kwhSinceLast = currentKwh - lastKwh;
              const totalIntervalKwh = nextKwh - lastKwh;
              
              const progressPercent = Math.min(
                100,
                Math.round((kwhSinceLast / (totalIntervalKwh || 1)) * 100)
              );

              const remainingKwh = nextKwh - currentKwh;
              const isOverdue = remainingKwh <= 0;
              const isNearDue = remainingKwh > 0 && remainingKwh <= 250;

              return (
                <div
                  key={veh.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    isOverdue 
                      ? 'border-rose-300 ring-1 ring-rose-300/50' 
                      : isNearDue 
                      ? 'border-amber-300 ring-1 ring-amber-300/50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-slate-900 text-base">
                          {veh.unitNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {veh.plateNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {veh.model} · {veh.location}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          OVERDUE ({Math.abs(remainingKwh)} kWh)
                        </span>
                      ) : isNearDue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          SEGERA SERVIS (Sisa {remainingKwh} kWh)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          KONDISI AMAN (Sisa {remainingKwh} kWh)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Numbers */}
                  <div className="grid grid-cols-3 gap-3 my-4 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Pemakaian Saat Ini</span>
                      <span className="text-base font-extrabold font-mono text-slate-900 tabular-nums">
                        {currentKwh.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">kWh</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Target Servis Berikut</span>
                      <span className="text-base font-extrabold font-mono text-sky-600 tabular-nums">
                        {nextKwh.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-sky-500 ml-1 font-mono">kWh</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Odometer Total</span>
                      <span className="text-base font-extrabold font-mono text-slate-700 tabular-nums">
                        {veh.currentOdoKm.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">KM</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold">
                        Siklus Interval: {lastKwh} kWh → {nextKwh} kWh
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {progressPercent}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOverdue 
                            ? 'bg-rose-500' 
                            : isNearDue 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Servis Terakhir: {lastKwh} kWh</span>
                      <span>
                        {isOverdue 
                          ? `Melebihi target sebesar ${Math.abs(remainingKwh)} kWh!`
                          : `Tersisa ${remainingKwh} kWh (~${Math.round(remainingKwh * 4.2)} KM tempuh)`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      Driver: <strong className="text-slate-700">{veh.assignedDriver || '-'}</strong>
                    </span>

                    <button
                      onClick={() => openLogServiceForUnit(veh)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-sky-700 hover:text-white bg-sky-50 hover:bg-sky-600 border border-sky-200 hover:border-transparent rounded-lg transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Catat Servis Unit Ini
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STANDAR TIER SERVIS JAC T9 EV */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {JAC_T9_MAINTENANCE_TIERS.map(tier => {
            return (
              <div key={tier.tierId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                      Interval {tier.intervalKwh.toLocaleString('id-ID')} kWh
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Setara akumulasi ±{tier.intervalKmEquivalent.toLocaleString('id-ID')} KM pemakaian tambang
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                    tier.priority === 'critical' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : tier.priority === 'important'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tier.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {tier.description}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Lingkup Pekerjaan & Komponen yang Diperiksa:
                  </span>
                  <ul className="space-y-1.5">
                    {tier.scope.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: RIWAYAT SERVIS SELESAI */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-sm font-bold text-slate-900">
              Riwayat Pelaksanaan Servis Berkala Armada JAC T9 EV
            </h2>
            <p className="text-xs text-slate-500">
              Catatan historis pekerjaan maintenance, penggantian suku cadang, dan audit kesehatan baterai (SoH).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal & No. WO</th>
                  <th className="py-3 px-4">No. Unit</th>
                  <th className="py-3 px-4">Tier Servis</th>
                  <th className="py-3 px-3 text-right font-mono">kWh Saat Servis</th>
                  <th className="py-3 px-3 text-right font-mono">KM Saat Servis</th>
                  <th className="py-3 px-3 text-center">BMS SoH</th>
                  <th className="py-3 px-4">Mekanik</th>
                  <th className="py-3 px-4">Suku Cadang Diganti</th>
                  <th className="py-3 px-4">Catatan Servis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block font-mono">{log.serviceDate}</span>
                      <span className="text-[11px] text-sky-600 font-mono">{log.workOrderNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {log.unitNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900">{log.serviceTier}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-sky-700 tabular-nums">
                      {log.kwhAtService.toLocaleString('id-ID')} kWh
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {log.kmAtService.toLocaleString('id-ID')} km
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {log.batteryHealthSoH}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block">{log.mechanicName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.mechanicNik}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {log.replacedParts.map((p, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      {log.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CATAT SERVIS SELESAI */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Catat Servis Berkala & Reset Interval kWh
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui interval pemeliharaan preventif JAC T9 EV ke target tier berikutnya.
                </p>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Unit</label>
                  <select
                    value={serviceUnitNumber}
                    onChange={e => setServiceUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.unitNumber}>
                        {v.unitNumber} ({v.cumulativeKwh} kWh)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tier Servis Diselesaikan</label>
                  <select
                    value={serviceTier}
                    onChange={e => setServiceTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  >
                    {JAC_T9_MAINTENANCE_TIERS.map(t => (
                      <option key={t.tierId} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Work Order (WO)</label>
                  <input
                    type="text"
                    value={workOrderNumber}
                    onChange={e => setWorkOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kesehatan Baterai (SoH %)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="70"
                    max="100"
                    value={batteryHealthSoH}
                    onChange={e => setBatteryHealthSoH(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Mekanik Penanggung Jawab</label>
                  <input
                    type="text"
                    value={mechanicName}
                    onChange={e => setMechanicName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK Mekanik</label>
                  <input
                    type="text"
                    value={mechanicNik}
                    onChange={e => setMechanicNik(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Suku Cadang / Part yang Diganti (pisahkan dengan koma):
                </label>
                <input
                  type="text"
                  value={replacedParts}
                  onChange={e => setReplacedParts(e.target.value)}
                  placeholder="Oli reducer, filter kabin HEPA, washer pump..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Hasil Servis:</label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={e => setServiceNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
              >
                <Check className="w-4 h-4" />
                Simpan & Reset Target Servis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
