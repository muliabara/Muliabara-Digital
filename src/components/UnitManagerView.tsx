import React, { useState } from 'react';
import { VehicleUnit, AppSettings } from '../types/p2h';
import { 
  Truck, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Battery, 
  Gauge, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  X, 
  Check, 
  ShieldCheck, 
  Zap,
  User
} from 'lucide-react';
import { getGlassCardClass } from '../utils/glass';
import { compressImage } from '../utils/imageCompressor';

interface UnitManagerViewProps {
  vehicles: VehicleUnit[];
  settings?: AppSettings;
  onAddVehicle: (newUnit: VehicleUnit) => void;
  onUpdateVehicle: (updatedUnit: VehicleUnit) => void;
  onDeleteVehicle: (unitId: string) => void;
}

export const UnitManagerView: React.FC<UnitManagerViewProps> = ({
  vehicles,
  settings,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}) => {
  const glassCard = getGlassCardClass(settings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);

  // Form Fields
  const [unitNumber, setUnitNumber] = useState('');
  const [model, setModel] = useState('JAC T9 EV 4x4 Double Cabin');
  const [plateNumber, setPlateNumber] = useState('');
  const [vin, setVin] = useState('');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(88.02);
  const [currentOdoKm, setCurrentOdoKm] = useState(0);
  const [currentSoc, setCurrentSoc] = useState(90);
  const [cumulativeKwh, setCumulativeKwh] = useState(0);
  const [lastServiceKwh, setLastServiceKwh] = useState(0);
  const [nextServiceKwh, setNextServiceKwh] = useState(1500);
  const [status, setStatus] = useState<VehicleUnit['status']>('ready');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [location, setLocation] = useState('Pit Utara - Mining Sector A');
  const [skoExpiry, setSkoExpiry] = useState('2027-06-30');
  const [photoUrl, setPhotoUrl] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetVehId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.75 });
        if (targetVehId) {
          const veh = vehicles.find(v => v.id === targetVehId);
          if (veh) {
            onUpdateVehicle({ ...veh, photoUrl: compressed });
          }
        } else {
          setPhotoUrl(compressed);
        }
      } catch (err) {
        console.warn('Gagal memproses gambar unit:', err);
      }
    }
  };

  // Filtered units
  const filteredVehicles = vehicles.filter(v => {
    const matchQuery = 
      v.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentUnitId(null);
    const nextNum = `LV-EV-${String(vehicles.length + 1).padStart(2, '0')}`;
    setUnitNumber(nextNum);
    setModel('JAC T9 EV 4x4 Double Cabin');
    setPlateNumber(`KT ${8140 + vehicles.length + 1} JQ`);
    setVin(`LJ13A9B26P00${Math.floor(10000 + Math.random() * 90000)}`);
    setBatteryCapacityKwh(88.02);
    setCurrentOdoKm(0);
    setCurrentSoc(95);
    setCumulativeKwh(0);
    setLastServiceKwh(0);
    setNextServiceKwh(1500);
    setStatus('ready');
    setAssignedDriver('');
    setLocation('Central Workshop - Main Yard');
    setSkoExpiry('2027-12-31');
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (veh: VehicleUnit) => {
    setIsEditing(true);
    setCurrentUnitId(veh.id);
    setUnitNumber(veh.unitNumber);
    setModel(veh.model);
    setPlateNumber(veh.plateNumber);
    setVin(veh.vin);
    setBatteryCapacityKwh(veh.batteryCapacityKwh);
    setCurrentOdoKm(veh.currentOdoKm);
    setCurrentSoc(veh.currentSoc);
    setCumulativeKwh(veh.cumulativeKwh);
    setLastServiceKwh(veh.lastServiceKwh);
    setNextServiceKwh(veh.nextServiceKwh);
    setStatus(veh.status);
    setAssignedDriver(veh.assignedDriver || '');
    setLocation(veh.location);
    setSkoExpiry(veh.skoExpiry);
    setPhotoUrl(veh.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;

    if (isEditing && currentUnitId) {
      const updated: VehicleUnit = {
        id: currentUnitId,
        unitNumber,
        model,
        plateNumber,
        vin,
        batteryCapacityKwh: Number(batteryCapacityKwh),
        currentOdoKm: Number(currentOdoKm),
        currentSoc: Number(currentSoc),
        cumulativeKwh: Number(cumulativeKwh),
        lastServiceKwh: Number(lastServiceKwh),
        nextServiceKwh: Number(nextServiceKwh),
        status,
        assignedDriver,
        location,
        skoExpiry,
        photoUrl
      };
      onUpdateVehicle(updated);
    } else {
      const newUnit: VehicleUnit = {
        id: `veh_${Date.now()}`,
        unitNumber,
        model,
        plateNumber,
        vin,
        batteryCapacityKwh: Number(batteryCapacityKwh),
        currentOdoKm: Number(currentOdoKm),
        currentSoc: Number(currentSoc),
        cumulativeKwh: Number(cumulativeKwh),
        lastServiceKwh: Number(lastServiceKwh),
        nextServiceKwh: Number(nextServiceKwh),
        status,
        assignedDriver,
        location,
        skoExpiry,
        photoUrl
      };
      onAddVehicle(newUnit);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onDeleteVehicle(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className={`${glassCard} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                MANAJEMEN ARMADA EV
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                JAC T9 EV 4x4
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Daftar Unit Kendaraan Ringan (Light Vehicle)
            </h1>
            <p className="text-xs text-slate-500">
              Kelola nomor lambung unit, pelat nomor, kapasitas baterai, odometer, status operasional, dan surat kelaikan operasi (SKO).
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Tambah Unit Baru
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nomor unit, pelat, driver, lokasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              <option value="all">Semua Status Operasi</option>
              <option value="ready">Ready (Siap Operasi)</option>
              <option value="operating">Operating (Sedang Operasi)</option>
              <option value="maintenance_due">Maintenance Due (Jadwal Servis)</option>
              <option value="in_inspection">In Inspection (Pemeriksaan P2H)</option>
              <option value="breakdown">Breakdown (Perbaikan)</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-mono">
            Total Unit: <strong className="text-slate-900 ml-1 font-bold">{filteredVehicles.length}</strong>
          </div>
        </div>
      </div>

      {/* Unit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.map(veh => {
          const isOverdue = veh.cumulativeKwh >= veh.nextServiceKwh;
          const isNearDue = veh.nextServiceKwh - veh.cumulativeKwh <= 250 && !isOverdue;

          return (
            <div
              key={veh.id}
              className={`${glassCard} p-5 hover:shadow-2xl transition-all flex flex-col justify-between space-y-4`}
            >
              <div>
                {/* Card Top: Unit & Plate */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-black text-xs font-mono border border-sky-100">
                      EV
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-base text-slate-900">
                          {veh.unitNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          · {veh.plateNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-56">
                        {veh.model}
                      </p>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div>
                    {veh.status === 'ready' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        READY
                      </span>
                    )}
                    {veh.status === 'operating' && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        OPERATING
                      </span>
                    )}
                    {veh.status === 'maintenance_due' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        SERVIS DUE
                      </span>
                    )}
                    {veh.status === 'breakdown' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        BREAKDOWN
                      </span>
                    )}
                    {veh.status === 'in_inspection' && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        INSPECTION
                      </span>
                    )}
                  </div>
                </div>

                {/* Truck Photo Asset (Editable photo feature) */}
                <div className="my-3 rounded-xl overflow-hidden border border-slate-200 relative h-44 bg-slate-900 shadow-2xs group">
                  <img
                    src={veh.photoUrl || "/assets/images/jac_t9_ev_pickup_1793024478024.jpg"}
                    alt={veh.unitNumber}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-xs">
                    <Truck className="w-3.5 h-3.5 text-sky-400" />
                    <span>{veh.unitNumber} · CATL 88.02 kWh</span>
                  </div>

                  {/* Direct Ganti Foto Button */}
                  <label className="absolute top-2 right-2 bg-slate-900/85 hover:bg-sky-600 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 shadow-md cursor-pointer transition-colors flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-sky-300" />
                    <span>Ganti Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handlePhotoUpload(e, veh.id)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Specs & Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-between">
                      <span>Baterai (SOC)</span>
                      <Battery className="w-3.5 h-3.5 text-sky-600" />
                    </span>
                    <span className="text-base font-extrabold font-mono text-sky-700">
                      {veh.currentSoc}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      Pack: {veh.batteryCapacityKwh} kWh
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-between">
                      <span>Odometer (KM)</span>
                      <Gauge className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {veh.currentOdoKm.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      KM Akumulasi
                    </span>
                  </div>
                </div>

                {/* Energy & Maintenance Progress */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Throughput kWh:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {veh.cumulativeKwh.toLocaleString('id-ID')} / {veh.nextServiceKwh.toLocaleString('id-ID')} kWh
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverdue ? 'bg-rose-500' : isNearDue ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((veh.cumulativeKwh / veh.nextServiceKwh) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {isOverdue 
                        ? 'Overdue Servis!' 
                        : `Sisa ${veh.nextServiceKwh - veh.cumulativeKwh} kWh`}
                    </span>
                    <span>Target Servis Berikut</span>
                  </div>
                </div>

                {/* Operational Details */}
                <div className="space-y-1 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{veh.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Driver: <strong className="text-slate-800">{veh.assignedDriver || '-'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>SKO Exp: <span className="font-mono font-medium">{veh.skoExpiry}</span></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-36">
                  VIN: {veh.vin}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(veh)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-sky-700 rounded transition-colors font-medium"
                    title="Edit Data Unit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(veh.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors font-medium"
                    title="Hapus Unit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: TAMBAH / EDIT UNIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {isEditing ? `Edit Data Unit · ${unitNumber}` : 'Tambah Unit Light Vehicle (EV) Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Lambung / Unit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={e => setUnitNumber(e.target.value)}
                    placeholder="Contoh: LV-EV-05"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Model Unit
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Polisi / Plat
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value)}
                    placeholder="Contoh: KT 8150 JQ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Rangka (VIN)
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={e => setVin(e.target.value)}
                    placeholder="17 Digit VIN"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kapasitas Baterai (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={batteryCapacityKwh}
                    onChange={e => setBatteryCapacityKwh(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sky-700 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Standar JAC T9 EV: 88.02 kWh (CATL LFP)
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    SOC Baterai Saat Ini (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={currentSoc}
                    onChange={e => setCurrentSoc(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Odometer Saat Ini (KM)
                  </label>
                  <input
                    type="number"
                    value={currentOdoKm}
                    onChange={e => setCurrentOdoKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Akumulasi Throughput kWh
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cumulativeKwh}
                    onChange={e => setCumulativeKwh(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Servis Berikutnya (kWh)
                  </label>
                  <input
                    type="number"
                    value={nextServiceKwh}
                    onChange={e => setNextServiceKwh(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Operasional Unit
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="ready">Ready (Siap Operasi)</option>
                    <option value="operating">Operating (Sedang Operasi)</option>
                    <option value="maintenance_due">Maintenance Due (Jadwal Servis)</option>
                    <option value="in_inspection">In Inspection (Inspeksi P2H)</option>
                    <option value="breakdown">Breakdown (Dalam Perbaikan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Driver yang Ditugaskan
                  </label>
                  <input
                    type="text"
                    value={assignedDriver}
                    onChange={e => setAssignedDriver(e.target.value)}
                    placeholder="Nama Operator / Driver"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Penempatan / Pit
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Contoh: Pit Utara Area Hauling 01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Expired Date Stiker SKO (Surat Kelayakan Operasi)
                  </label>
                  <input
                    type="date"
                    value={skoExpiry}
                    onChange={e => setSkoExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                {/* Foto Kendaraan / Unit */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 mb-1">
                    Foto Kendaraan Armada EV (Unggah / Upload Foto)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-32 h-20 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative">
                      <img
                        src={photoUrl || "/assets/images/jac_t9_ev_pickup_1793024478024.jpg"}
                        alt="Preview Foto Unit"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                        <Truck className="w-3.5 h-3.5 text-sky-600" />
                        Pilih File Foto Kendaraan (JPG / PNG)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePhotoUpload(e)}
                          className="hidden"
                        />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-[11px] text-rose-600 font-semibold hover:underline block"
                        >
                          Hapus Foto Khusus (Gunakan Foto Bawaan)
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Foto ini akan ditampilkan pada kartu unit dan laporan inspeksi P2H.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Simpan Perubahan Unit' : 'Tambahkan Unit Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Konfirmasi Hapus Unit Kendaraan
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus unit <strong className="text-slate-900 font-mono">{vehicles.find(v => v.id === deleteConfirmId)?.unitNumber}</strong> dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Hapus Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
