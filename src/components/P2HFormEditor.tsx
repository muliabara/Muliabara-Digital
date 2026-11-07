import React, { useState, useMemo, useEffect } from 'react';
import { 
  P2HFormRecord, 
  VehicleUnit, 
  CheckStatus, 
  DriverStatus,
  UserProfile,
  AppSettings
} from '../types/p2h';
import { 
  DRIVER_CONDITIONS, 
  CRITICAL_INSPECTIONS, 
  NON_CRITICAL_INSPECTIONS 
} from '../data/checklistConfig';
import { SignaturePadModal } from './SignaturePadModal';
import { playTriggerSound, playSuccessChime } from '../utils/audio';
import { compressImage } from '../utils/imageCompressor';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Battery, 
  Gauge, 
  ShieldAlert, 
  FileCheck, 
  Truck, 
  PenLine, 
  Sparkles, 
  Save, 
  Check, 
  ShieldCheck, 
  Wrench, 
  Upload, 
  X,
  BatteryCharging
} from 'lucide-react';

interface P2HFormEditorProps {
  vehicles: VehicleUnit[];
  initialForm?: P2HFormRecord | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  settings?: AppSettings;
  onSave: (form: P2HFormRecord) => void;
  onCancel: () => void;
}

export const P2HFormEditor: React.FC<P2HFormEditorProps> = ({
  vehicles,
  initialForm,
  currentUser,
  allUsers,
  settings,
  onSave,
  onCancel
}) => {
  const safeUser = (currentUser && currentUser.name) ? currentUser : {
    id: 'user_admin',
    name: 'Admin Operations',
    nik: 'ADM-001',
    role: 'admin' as const,
    department: 'QHSE & Fleet Asset Management',
    idCardExpiry: '2027-12-31',
    simperExpiry: '2027-12-31',
    signatureDataUrl: undefined
  };

  // Base form state - Requirement 1: strictly bound to logged-in user profile
  const [operatorName, setOperatorName] = useState(
    initialForm?.operatorName || safeUser.name
  );
  const [operatorNik, setOperatorNik] = useState(
    initialForm?.operatorNik || safeUser.nik
  );
  const [date, setDate] = useState(initialForm?.date || new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'Shift 1 (Siang)' | 'Shift 2 (Malam)'>(initialForm?.shift || 'Shift 1 (Siang)');
  // Requirement 6: Lokasi Kerja & Job Site dikondisikan kosong agar diisi manual oleh Driver (Gambar 6)
  const [workLocation, setWorkLocation] = useState(initialForm?.workLocation || '');
  const [jobSite, setJobSite] = useState(initialForm?.jobSite || '');
  const [unitNumber, setUnitNumber] = useState(initialForm?.unitNumber || (vehicles[0]?.unitNumber || 'LV-EV-01'));
  const [skoExpiryDate, setSkoExpiryDate] = useState(initialForm?.skoExpiryDate || '2026-12-15');

  // Requirement 4: Telemetri odometer dimulai dari angka 0 untuk diisi manual oleh Driver (Gambar 4)
  const [startKm, setStartKm] = useState<number>(initialForm?.startKm ?? 0);
  const [endKm, setEndKm] = useState<number>(initialForm?.endKm ?? 0);
  const [startSoc, setStartSoc] = useState<number>(initialForm?.startSoc ?? 0);
  const [endSoc, setEndSoc] = useState<number>(initialForm?.endSoc ?? 0);
  const batteryCapacityKwh = 88.02; // CATL LFP JAC T9 EV pack

  // Driver Condition State (Section A) - Bound to logged-in user
  const [idCardExpiry, setIdCardExpiry] = useState(
    initialForm?.driverCondition?.idCardExpiry || safeUser.idCardExpiry || '2027-12-31'
  );
  const [simperExpiry, setSimperExpiry] = useState(
    initialForm?.driverCondition?.simperExpiry || safeUser.simperExpiry || '2027-12-31'
  );
  
  // Auto-sync form when user changes or on mount (Requirement 1)
  useEffect(() => {
    if (!initialForm && safeUser) {
      setOperatorName(safeUser.name);
      setOperatorNik(safeUser.nik);
      if (safeUser.idCardExpiry) setIdCardExpiry(safeUser.idCardExpiry);
      if (safeUser.simperExpiry) setSimperExpiry(safeUser.simperExpiry);
      if (safeUser.signatureDataUrl) setSignatureUrl(safeUser.signatureDataUrl);
    }
  }, [safeUser, initialForm]);

  const [driverItems, setDriverItems] = useState<Record<string, DriverStatus>>(() => {
    if (initialForm?.driverCondition?.items) return initialForm.driverCondition.items;
    const defaults: Record<string, DriverStatus> = {};
    DRIVER_CONDITIONS.forEach(item => {
      defaults[item.id] = 'ya';
    });
    return defaults;
  });

  const [driverNotes, setDriverNotes] = useState<Record<string, string>>(
    initialForm?.driverCondition?.notes || {}
  );

  // Inspections State (Sections B & C)
  const [inspections, setInspections] = useState<Record<string, { status: CheckStatus; notes?: string; photoUrl?: string; isClosed?: boolean }>>(() => {
    if (initialForm?.inspections) return initialForm.inspections;
    const defaults: Record<string, { status: CheckStatus; notes?: string; photoUrl?: string; isClosed?: boolean }> = {};
    [...CRITICAL_INSPECTIONS, ...NON_CRITICAL_INSPECTIONS].forEach(item => {
      defaults[item.id] = { status: 'normal', notes: '' };
    });
    return defaults;
  });

  // Requirement 7: Rekomendasi mekanik TIDAK terisi secara otomatis (default to pending/empty)
  const isMechanicUser = safeUser.role === 'mechanic';
  const [mechanicStatus, setMechanicStatus] = useState<'continue_operation' | 'stop_operation' | 'pending'>(
    initialForm?.mechanicRecommendation?.status || 'pending'
  );
  const [mechanicReason, setMechanicReason] = useState(
    initialForm?.mechanicRecommendation?.reason || ''
  );
  const [mechanicName, setMechanicName] = useState(
    initialForm?.mechanicRecommendation?.mechanicName || (isMechanicUser ? safeUser.name : '')
  );
  const [mechanicNik, setMechanicNik] = useState(
    initialForm?.mechanicRecommendation?.mechanicNik || (isMechanicUser ? safeUser.nik : '')
  );
  const [mechanicSignature, setMechanicSignature] = useState<string | undefined>(
    initialForm?.mechanicRecommendation?.signatureUrl || (isMechanicUser ? safeUser.signatureDataUrl : undefined)
  );

  // Persetujuan Foreman / Pengawas / Admin / Master Admin (Role Otorisasi)
  const isForemanOrAdmin = ['foreman', 'pengawas', 'admin', 'master admin'].includes((safeUser.role || '').toLowerCase().trim());
  const [foremanDecision, setForemanDecision] = useState<'pending' | 'approved' | 'rejected'>(
    initialForm?.foremanApproval?.status || (isForemanOrAdmin ? 'approved' : 'pending')
  );
  const [foremanNotes, setForemanNotes] = useState(
    initialForm?.foremanApproval?.notes || (isForemanOrAdmin ? 'Disetujui beroperasi untuk shift ini.' : '')
  );
  const [foremanName, setForemanName] = useState(
    initialForm?.foremanApproval?.foremanName || (isForemanOrAdmin ? currentUser.name : '')
  );
  const [foremanNik, setForemanNik] = useState(
    initialForm?.foremanApproval?.foremanNik || (isForemanOrAdmin ? currentUser.nik : '')
  );
  const [foremanSignature, setForemanSignature] = useState<string | undefined>(
    initialForm?.foremanApproval?.signatureUrl || (isForemanOrAdmin ? currentUser.signatureDataUrl : undefined)
  );

  // Operator commitment & signature (Auto-fills with user's saved signature if available)
  const [agreedCommitment, setAgreedCommitment] = useState(
    initialForm?.operatorSignature?.agreed ?? true
  );
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(
    initialForm?.operatorSignature?.signatureUrl || currentUser.signatureDataUrl
  );
  
  // Sign modal targeting
  const [signModalTarget, setSignModalTarget] = useState<'operator' | 'foreman' | 'mechanic' | null>(null);

  // Requirement 1: Driver Finding Notes & Photo Upload
  const [driverFindingNotes, setDriverFindingNotes] = useState<string>(initialForm?.driverFindingNotes || '');
  const [driverFindingPhotoUrl, setDriverFindingPhotoUrl] = useState<string | undefined>(initialForm?.driverFindingPhotoUrl);

  const handleUploadFindingPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.72 });
        setDriverFindingPhotoUrl(compressed);
      } catch (err) {
        console.warn('Gagal memproses foto temuan:', err);
      }
    }
  };

  // Sync unit change with default SKO (Keep KM & SOC manual per Requirement 4)
  const handleUnitChange = (selectedUnitNum: string) => {
    setUnitNumber(selectedUnitNum);
    const found = vehicles.find(v => v.unitNumber === selectedUnitNum);
    if (found) {
      setSkoExpiryDate(found.skoExpiry);
    }
  };

  const [chargingPercent, setChargingPercent] = useState<number>(initialForm?.charging?.percentCharged || 0);
  const [chargingKwh, setChargingKwh] = useState<number>(
    initialForm?.charging?.energyAddedKwh || Number((((initialForm?.charging?.percentCharged || 0) / 100) * 88.02).toFixed(2))
  );
  const [chargingLocation, setChargingLocation] = useState<string>(initialForm?.charging?.chargingLocation || '');
  // Editable Tarif Listrik PLN state (Default: settings.plnTariffPerKwh or 1699)
  const [plnTariff, setPlnTariff] = useState<number>(settings?.plnTariffPerKwh || 1699);

  // Handlers for flexible charging input (Input via % or Input via kWh)
  const handleChargingPercentChange = (val: number) => {
    const safePercent = Math.min(100, Math.max(0, val));
    setChargingPercent(safePercent);
    const calculatedKwh = Number(((batteryCapacityKwh * safePercent) / 100).toFixed(2));
    setChargingKwh(calculatedKwh);
  };

  const handleChargingKwhChange = (val: number) => {
    const safeKwh = Math.max(0, val);
    setChargingKwh(safeKwh);
    const calculatedPercent = Math.min(100, Number(((safeKwh / batteryCapacityKwh) * 100).toFixed(1)));
    setChargingPercent(calculatedPercent);
  };

  const chargingCalculations = useMemo(() => {
    const energyAddedKwh = chargingKwh;
    const effectivePercent = chargingPercent;
    const estimatedRangeKm = Number(((effectivePercent / 100) * 330).toFixed(1));
    const estimatedCostIdr = Math.round(energyAddedKwh * (plnTariff || 1699)); // Calculated dynamically from editable plnTariff
    return {
      energyAddedKwh,
      effectivePercent,
      estimatedRangeKm,
      estimatedCostIdr,
      plnTariff
    };
  }, [batteryCapacityKwh, chargingPercent, chargingKwh, plnTariff]);

  // Real-time Energy & Travel Calculations
  const calculations = useMemo(() => {
    const totalKm = Math.max(0, endKm - startKm);
    const capacity = batteryCapacityKwh || 88.02;
    const energyAdded = chargingCalculations.energyAddedKwh;
    
    let socUsed = 0;
    let kwhConsumed = 0;

    if (startSoc > endSoc) {
      socUsed = startSoc - endSoc;
      const socDropKwh = (socUsed / 100) * capacity;
      kwhConsumed = energyAdded > 0 ? Number((socDropKwh + energyAdded).toFixed(2)) : Number(socDropKwh.toFixed(2));
    } else if (startSoc < endSoc) {
      const socRisePercent = endSoc - startSoc;
      const socRiseKwh = (socRisePercent / 100) * capacity;
      if (energyAdded > socRiseKwh) {
        kwhConsumed = Number((energyAdded - socRiseKwh).toFixed(2));
      } else if (totalKm > 0) {
        kwhConsumed = Number((totalKm * 0.267).toFixed(2));
      } else {
        kwhConsumed = 0;
      }
      socUsed = socRisePercent;
    } else {
      if (energyAdded > 0) {
        kwhConsumed = Number(energyAdded.toFixed(2));
      } else if (totalKm > 0) {
        kwhConsumed = Number((totalKm * 0.267).toFixed(2));
      } else {
        kwhConsumed = 0;
      }
      socUsed = 0;
    }
    
    const kwhPerKm = totalKm > 0 ? Number((kwhConsumed / totalKm).toFixed(3)) : 0;
    const kmPerKwh = kwhConsumed > 0 ? Number((totalKm / kwhConsumed).toFixed(2)) : 0;
    
    const dieselLitersEq = Number((totalKm / 8).toFixed(1));
    const dieselCost = dieselLitersEq * 15200;
    const electricCost = kwhConsumed * 1699;
    const costSavings = Math.max(0, Math.round(dieselCost - electricCost));
    const co2Reduction = Number((dieselLitersEq * 2.68 - (kwhConsumed * 0.79)).toFixed(1));

    return {
      totalKm,
      batteryUsedPercent: socUsed,
      energyConsumedKwh: kwhConsumed,
      consumptionRateKwhPerKm: kwhPerKm,
      kmPerKwh,
      costSavingsIdr: costSavings,
      co2ReductionKg: Math.max(0, co2Reduction)
    };
  }, [startKm, endKm, startSoc, endSoc, batteryCapacityKwh, chargingCalculations]);

  // Abnormal findings (exclude items already repaired and closed)
  const criticalAbnormals = useMemo(() => {
    return CRITICAL_INSPECTIONS.filter(item => inspections[item.id]?.status === 'abnormal' && !inspections[item.id]?.isClosed);
  }, [inspections]);

  const nonCriticalAbnormals = useMemo(() => {
    return NON_CRITICAL_INSPECTIONS.filter(item => inspections[item.id]?.status === 'abnormal' && !inspections[item.id]?.isClosed);
  }, [inspections]);

  const driverUnfitItems = useMemo(() => {
    return DRIVER_CONDITIONS.filter(item => driverItems[item.id] === 'tidak');
  }, [driverItems]);

  // Quick helper to mark all as normal
  const markAllNormal = () => {
    const newInsp = { ...inspections };
    [...CRITICAL_INSPECTIONS, ...NON_CRITICAL_INSPECTIONS].forEach(item => {
      newInsp[item.id] = { status: 'normal', notes: newInsp[item.id]?.notes || '' };
    });
    setInspections(newInsp);

    const newDriver: Record<string, DriverStatus> = {};
    DRIVER_CONDITIONS.forEach(item => {
      newDriver[item.id] = 'ya';
    });
    setDriverItems(newDriver);
  };

  const handleInspectionChange = (id: string, status: CheckStatus) => {
    setInspections(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status
      }
    }));
  };

  const handleInspectionNoteChange = (id: string, notes: string) => {
    setInspections(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes
      }
    }));
  };

  const handleDriverItemChange = (id: string, status: DriverStatus) => {
    setDriverItems(prev => ({
      ...prev,
      [id]: status
    }));
  };

  // Direct file signature upload for Operator
  const handleUploadOperatorSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 200, quality: 0.75 });
        setSignatureUrl(compressed);
      } catch (err) {
        console.warn('Gagal memproses tanda tangan:', err);
      }
    }
  };

  const handleSaveForm = (targetStatus?: 'draft' | 'pending_approval' | 'approved') => {
    const hasAbnormalCrit = criticalAbnormals.length > 0 || driverUnfitItems.length > 0;
    const hasAbnormalNonCrit = nonCriticalAbnormals.length > 0;

    let finalOverallStatus: P2HFormRecord['overallStatus'] = 'approved';
    if (targetStatus === 'draft') {
      finalOverallStatus = 'draft';
    } else if (hasAbnormalCrit) {
      finalOverallStatus = 'needs_maintenance';
    } else if (hasAbnormalNonCrit) {
      finalOverallStatus = 'needs_maintenance';
    } else if (foremanDecision === 'rejected' || mechanicStatus === 'stop_operation') {
      finalOverallStatus = 'rejected';
    } else if (foremanDecision === 'pending') {
      finalOverallStatus = 'pending_approval';
    } else {
      finalOverallStatus = 'approved';
    }

    const isForemanApproved = foremanDecision === 'approved';
    const isMechanicFilled = mechanicStatus !== 'pending';

    const newRecord: P2HFormRecord = {
      id: initialForm?.id || `p2h-${Date.now()}`,
      docNumber: 'F-QHSE-OPS-MOB-09',
      createdAt: initialForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      operatorName,
      operatorNik,
      date,
      shift,
      workLocation,
      jobSite,
      equipmentType: 'Light Vehicle (EV)',
      unitModel: 'JAC T9 EV 4x4',
      unitNumber,
      skoExpiryDate,
      
      startKm,
      endKm,
      startSoc,
      endSoc,
      batteryCapacityKwh,

      totalKm: calculations.totalKm,
      batteryUsedPercent: calculations.batteryUsedPercent,
      energyConsumedKwh: calculations.energyConsumedKwh,
      consumptionRateKwhPerKm: calculations.consumptionRateKwhPerKm,
      costSavingsIdr: calculations.costSavingsIdr,
      co2ReductionKg: calculations.co2ReductionKg,

      charging: {
        percentCharged: chargingPercent,
        energyAddedKwh: chargingCalculations.energyAddedKwh,
        estimatedRangeKm: chargingCalculations.estimatedRangeKm,
        chargingLocation
      },

      driverCondition: {
        idCardExpiry,
        simperExpiry,
        items: driverItems,
        notes: driverNotes
      },

      inspections,
      overallStatus: finalOverallStatus,
      hasAbnormalCritical: hasAbnormalCrit,
      hasAbnormalNonCritical: hasAbnormalNonCrit,

      mechanicRecommendation: {
        status: mechanicStatus,
        reason: isMechanicFilled ? mechanicReason : '',
        mechanicName: isMechanicFilled ? (mechanicName || '-') : '',
        mechanicNik: isMechanicFilled ? (mechanicNik || '-') : '',
        signatureUrl: isMechanicFilled ? mechanicSignature : undefined,
        recommendedAt: isMechanicFilled ? (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA') : undefined
      },

      foremanApproval: {
        status: foremanDecision,
        notes: isForemanApproved ? foremanNotes : (foremanDecision === 'rejected' ? foremanNotes : ''),
        foremanName: isForemanApproved ? (foremanName || currentUser.name) : '',
        foremanNik: isForemanApproved ? (foremanNik || currentUser.nik) : '',
        signatureUrl: isForemanApproved ? (foremanSignature || currentUser.signatureDataUrl) : undefined,
        approvedAt: isForemanApproved ? (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA') : undefined
      },

      operatorSignature: {
        agreed: agreedCommitment,
        signatureUrl: signatureUrl,
        submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
      },

      driverFindingNotes,
      driverFindingPhotoUrl
    };

    playSuccessChime();
    onSave(newRecord);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* SECTION 1: INFORMASI UMUM & IDENTITAS UNIT */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              DOKUMEN F-QHSE-OPS-MOB-09
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
              <Truck className="w-4 h-4 text-sky-600 shrink-0" />
              1. Identitas Unit JAC T9 EV & Operator
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllNormal}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tandai Semua Normal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Operator</label>
            <input
              type="text"
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NIK Operator</label>
            <input
              type="text"
              value={operatorNik}
              onChange={e => setOperatorNik(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hari / Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Shift Kerja</label>
            <select
              value={shift}
              onChange={e => setShift(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-medium"
            >
              <option value="Shift 1 (Siang)">Shift 1 (Siang)</option>
              <option value="Shift 2 (Malam)">Shift 2 (Malam)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Unit / Lambung</label>
            <select
              value={unitNumber}
              onChange={e => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-bold"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.unitNumber}>
                  {v.unitNumber} - {v.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lokasi Kerja</label>
            <select
              value={workLocation}
              onChange={e => setWorkLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-medium"
            >
              <option value="">-- Pilih Lokasi Kerja --</option>
              <option value="Samarinda">Samarinda</option>
              <option value="Kotabangun">Kotabangun</option>
              <option value="Long Mahli">Long Mahli</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Job Site</label>
            <select
              value={jobSite}
              onChange={e => setJobSite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-medium"
            >
              <option value="">-- Pilih Job Site --</option>
              <option value="SMD">SMD</option>
              <option value="KBCT">KBCT</option>
              <option value="LMP">LMP</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Expired Date Stiker SKO</label>
            <input
              type="date"
              value={skoExpiryDate}
              onChange={e => setSkoExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: TELEMETRI KM & KONVERSI KWH (RESPONSIVE) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              2. Telemetri Odometer & Konversi Pemakaian Energi Baterai (kWh)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dimulai dari angka 0 untuk diisi manual oleh Driver · Kapasitas Baterai CATL LFP: 88.02 kWh
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 w-fit">
            Input Manual Odometer
          </span>
        </div>

        {/* REQUIREMENT 4: Telemetri Odometer Dimulai dari Angka 0 diisi manual oleh Driver (Gambar 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              KM Awal
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={startKm === 0 ? '' : startKm}
                onChange={e => setStartKm(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-sm sm:text-base font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Awal shift (isi manual)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              KM Akhir
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={endKm === 0 ? '' : endKm}
                onChange={e => setEndKm(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-sm sm:text-base font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Akhir shift (isi manual)</span>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
            <label className="block text-[11px] font-bold text-sky-950 mb-1 flex items-center justify-between">
              <span>SOC Awal (%)</span>
              <Battery className="w-3.5 h-3.5 text-sky-600" />
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={startSoc === 0 ? '' : startSoc}
              onChange={e => setStartSoc(e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder="0"
              className="w-full px-2.5 py-1.5 text-sm sm:text-base font-mono font-bold text-sky-900 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-[10px] text-sky-700 mt-1 block">Tingkat awal (0-100%)</span>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
            <label className="block text-[11px] font-bold text-sky-950 mb-1 flex items-center justify-between">
              <span>SOC Akhir (%)</span>
              <Battery className="w-3.5 h-3.5 text-sky-600" />
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={endSoc === 0 ? '' : endSoc}
              onChange={e => setEndSoc(e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder="0"
              className="w-full px-2.5 py-1.5 text-sm sm:text-base font-mono font-bold text-sky-900 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
            <span className={`text-[10px] mt-1 block font-medium ${endSoc > 0 && endSoc < 20 ? 'text-rose-600 font-bold' : 'text-sky-700'}`}>
              {endSoc > 0 && endSoc < 20 ? 'Wajib charge!' : 'Tingkat akhir (0-100%)'}
            </span>
          </div>
        </div>

        {/* REQUIREMENT 3: P2H Charging Berapa % Terisi Serta Konversinya & Fleksibel Input (% atau kWh) */}
        <div className="p-4 sm:p-5 rounded-xl bg-emerald-950 text-white space-y-3.5 border border-emerald-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-800/60">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-900/80 px-2.5 py-0.5 rounded border border-emerald-700/60">
                  P2H CHARGING STATION EV
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                  2 Cara Input Fleksibel (% / kWh)
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                Pengisian Daya (Charging) & Konversi Energi Baterai
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-300">
              Kapasitas: 88.02 kWh (CATL LFP)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Input Cara 1: % Persentase Terisi */}
            <div>
              <label className="block font-bold text-emerald-200 mb-1 flex items-center justify-between">
                <span>% Terisi (Charging %)</span>
                <span className="text-[9px] text-emerald-400 font-mono">Cara 1</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={chargingPercent === 0 ? '' : chargingPercent}
                  onChange={e => handleChargingPercentChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700 rounded-lg text-white font-mono font-bold focus:ring-2 focus:ring-emerald-400"
                />
                <span className="absolute right-3 top-2 text-emerald-300 font-bold">%</span>
              </div>
              <span className="text-[10px] text-emerald-300/90 mt-1 block">Input % → Otomatis hitung kWh</span>
            </div>

            {/* Input Cara 2: Energi Terisi (kWh) */}
            <div>
              <label className="block font-bold text-emerald-200 mb-1 flex items-center justify-between">
                <span>Energi Terisi (kWh)</span>
                <span className="text-[9px] text-emerald-400 font-mono">Cara 2</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="88.02"
                  step="0.01"
                  value={chargingKwh === 0 ? '' : chargingKwh}
                  onChange={e => handleChargingKwhChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700 rounded-lg text-white font-mono font-bold focus:ring-2 focus:ring-emerald-400"
                />
                <span className="absolute right-3 top-2 text-emerald-300 font-bold">kWh</span>
              </div>
              <span className="text-[10px] text-emerald-300/90 mt-1 block">Input kWh → Otomatis hitung %</span>
            </div>

            {/* Input Editable Tarif PLN (Rp / kWh) */}
            <div>
              <label className="block font-bold text-emerald-200 mb-1 flex items-center justify-between">
                <span>Tarif PLN (Rp/kWh)</span>
                <span className="text-[9px] text-amber-300 font-mono bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-700/60">Dapat Di-edit</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-emerald-300 font-bold text-xs">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={plnTariff}
                  onChange={e => setPlnTariff(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                  placeholder="1699"
                  className="w-full pl-8 pr-12 py-2 bg-emerald-900/60 border border-amber-600/80 rounded-lg text-amber-200 font-mono font-bold focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-2.5 top-2 text-emerald-300/80 font-mono text-[10px]">/kWh</span>
              </div>
              <span className="text-[10px] text-amber-300/90 mt-1 block">Bisa diubah sesuai tarif charger</span>
            </div>

            {/* Input Lokasi Charging */}
            <div>
              <label className="block font-bold text-emerald-200 mb-1">
                Lokasi Charging / SPKLU
              </label>
              <input
                type="text"
                value={chargingLocation}
                onChange={e => setChargingLocation(e.target.value)}
                placeholder="Contoh: SPKLU Pit A / Rumah / Workshop"
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[10px] text-emerald-300/90 mt-1 block">Lokasi stasiun pengisian</span>
            </div>
          </div>

          {/* Result Summary Banner */}
          <div className="p-3 bg-emerald-900/90 rounded-xl border border-emerald-700/80 font-mono flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-emerald-300 block font-sans">kWh Terisi:</span>
                <span className="font-bold text-white text-sm">{chargingCalculations.energyAddedKwh} kWh</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/80 hidden sm:block"></div>
              <div>
                <span className="text-[10px] text-emerald-300 block font-sans">Persentase SOC:</span>
                <span className="font-bold text-emerald-300 text-sm">+{chargingCalculations.effectivePercent}%</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/80 hidden sm:block"></div>
              <div>
                <span className="text-[10px] text-emerald-300 block font-sans">Tambahan Jarak:</span>
                <span className="font-bold text-emerald-300 text-sm">~{chargingCalculations.estimatedRangeKm} KM</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-700/80 sm:pl-4 w-full sm:w-auto flex justify-between sm:block">
              <span className="text-[10px] text-emerald-300 block font-sans">Est. Biaya PLN:</span>
              <span className="font-extrabold text-amber-300 text-sm block">
                Rp {chargingCalculations.estimatedCostIdr.toLocaleString('id-ID')}
              </span>
              <span className="text-[9px] text-emerald-400 block font-sans">
                (@ Rp {(chargingCalculations.plnTariff || 1699).toLocaleString('id-ID')} / kWh)
              </span>
            </div>
          </div>
        </div>

        {/* Live Calculation Strip */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Jarak (ΔKM)</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-white tabular-nums">
                {calculations.totalKm} KM
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {startSoc < endSoc ? '% Selisih SOC (+)' : '% Terpakai'}
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-amber-400 tabular-nums">
                {startSoc < endSoc ? `+${calculations.batteryUsedPercent}%` : `${calculations.batteryUsedPercent}%`}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Energi Listrik</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-sky-400 tabular-nums">
                {calculations.energyConsumedKwh} kWh
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Laju Efisiensi</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 tabular-nums">
                {calculations.consumptionRateKwhPerKm} kWh/km
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Hemat Biaya</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-300 tabular-nums">
                Rp {calculations.costSavingsIdr.toLocaleString('id-ID')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Reduksi CO₂</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-teal-300 tabular-nums">
                {calculations.co2ReductionKg} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BAGIAN A - KONDISI DRIVER (FIT TO WORK) (MOBILE-OPTIMIZED) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-rose-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                A. KONDISI DRIVER (FIT TO WORK)
              </h2>
              <p className="text-[10px] sm:text-[11px] text-rose-100 font-semibold">
                STOP BEKERJA JIKA TERDAPAT JAWABAN "TIDAK"
              </p>
            </div>
          </div>
          {driverUnfitItems.length > 0 && (
            <span className="text-[10px] sm:text-xs font-bold bg-white text-rose-700 px-2 py-0.5 rounded-full">
              {driverUnfitItems.length} TIDAK
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1.a Expired ID Card / SID:
              </label>
              <input
                type="date"
                value={idCardExpiry}
                onChange={e => setIdCardExpiry(e.target.value)}
                className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-200 rounded text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1.b Expired SIMPER Tambang:
              </label>
              <input
                type="date"
                value={simperExpiry}
                onChange={e => setSimperExpiry(e.target.value)}
                className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-200 rounded text-slate-900"
              />
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-4">Item Pemeriksaan Fit to Work</th>
                  <th className="py-2.5 px-3 w-32 text-center">Hasil</th>
                  <th className="py-2.5 px-4 w-60">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DRIVER_CONDITIONS.map(item => {
                  const isPassed = driverItems[item.id] === 'ya';
                  return (
                    <tr key={item.id} className={!isPassed ? 'bg-rose-50/50' : ''}>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        {item.subText && (
                          <p className="text-[11px] text-slate-500">{item.subText}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleDriverItemChange(item.id, 'ya')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              isPassed ? 'bg-emerald-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDriverItemChange(item.id, 'tidak')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              !isPassed ? 'bg-rose-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Tidak
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={driverNotes[item.id] || ''}
                          onChange={e => setDriverNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Catatan..."
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW (PROPORTIONAL FOR SMARTPHONES) */}
          <div className="sm:hidden space-y-3">
            {DRIVER_CONDITIONS.map(item => {
              const isPassed = driverItems[item.id] === 'ya';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs space-y-2.5 ${
                    !isPassed ? 'bg-rose-50 border-rose-300' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-500 mr-1.5">[{item.code}]</span>
                      <span className="font-bold text-slate-900">{item.label}</span>
                    </div>
                  </div>
                  {item.subText && (
                    <p className="text-[11px] text-slate-500 leading-tight">{item.subText}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDriverItemChange(item.id, 'ya')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        isPassed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Ya (Memenuhi)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDriverItemChange(item.id, 'tidak')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        !isPassed ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      Tidak
                    </button>
                  </div>

                  {!isPassed && (
                    <input
                      type="text"
                      value={driverNotes[item.id] || ''}
                      onChange={e => setDriverNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Jelaskan alasan tidak memenuhi..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded font-medium text-rose-900"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: BAGIAN B - PEMERIKSAAN KRITIS (23 ITEM) (MOBILE-OPTIMIZED) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-rose-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM (23 ITEM)
              </h2>
              <p className="text-[10px] sm:text-[11px] text-rose-100 font-semibold">
                STOP BEKERJA JIKA TERDAPAT JAWABAN "ABNORMAL"
              </p>
            </div>
          </div>
          {criticalAbnormals.length > 0 && (
            <span className="text-[10px] sm:text-xs font-bold bg-white text-rose-700 px-2 py-0.5 rounded-full">
              {criticalAbnormals.length} Abnormal
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-4">Item Pemeriksaan Kritis</th>
                  <th className="py-2.5 px-3 w-36 text-center">Hasil</th>
                  <th className="py-2.5 px-4 w-64">Keterangan / Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CRITICAL_INSPECTIONS.map(item => {
                  const status = inspections[item.id]?.status || 'normal';
                  const isNormal = status === 'normal';
                  return (
                    <tr key={item.id} className={!isNormal ? 'bg-rose-50/60' : 'hover:bg-slate-50/70'}>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        {item.subText && (
                          <p className="text-[11px] text-slate-500">{item.subText}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleInspectionChange(item.id, 'normal')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              isNormal ? 'bg-emerald-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Normal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInspectionChange(item.id, 'abnormal')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              !isNormal ? 'bg-rose-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Abnormal
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={inspections[item.id]?.notes || ''}
                          onChange={e => handleInspectionNoteChange(item.id, e.target.value)}
                          placeholder={!isNormal ? 'Alasan abnormal...' : 'Kondisi...'}
                          className={`w-full px-2.5 py-1 text-xs rounded border ${
                            !isNormal ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="sm:hidden space-y-3">
            {CRITICAL_INSPECTIONS.map(item => {
              const status = inspections[item.id]?.status || 'normal';
              const isNormal = status === 'normal';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    !isNormal ? 'bg-rose-50 border-rose-300' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-mono font-bold text-slate-500 mr-1.5">[{item.code}]</span>
                      <span className="font-bold text-slate-900">{item.label}</span>
                    </div>
                  </div>
                  {item.subText && (
                    <p className="text-[11px] text-slate-500 leading-tight">{item.subText}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(item.id, 'normal')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        isNormal ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(item.id, 'abnormal')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        !isNormal ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Abnormal
                    </button>
                  </div>

                  <input
                    type="text"
                    value={inspections[item.id]?.notes || ''}
                    onChange={e => handleInspectionNoteChange(item.id, e.target.value)}
                    placeholder={!isNormal ? 'Wajib isi alasan kerusakan...' : 'Keterangan kondisi...'}
                    className={`w-full px-2.5 py-1.5 text-xs rounded border ${
                      !isNormal ? 'bg-white border-rose-300 text-rose-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 5: BAGIAN C - PEMERIKSAAN ITEM NON KRITIS (4 ITEM) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-sky-700 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Wrench className="w-5 h-5 shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                C. PEMERIKSAAN ITEM NON KRITIS (4 ITEM)
              </h2>
              <p className="text-[10px] sm:text-[11px] text-sky-100 font-semibold">
                MENGIKUTI REKOMENDASI MEKANIK - WAJIB DIPERBAIKI DALAM 1x24 JAM
              </p>
            </div>
          </div>
          {nonCriticalAbnormals.length > 0 && (
            <span className="text-[10px] sm:text-xs font-bold bg-white text-sky-900 px-2 py-0.5 rounded-full">
              {nonCriticalAbnormals.length} Non-Kritis
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {/* DESKTOP TABLE */}
          <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-4">Item Pemeriksaan Non Kritis</th>
                  <th className="py-2.5 px-3 w-36 text-center">Hasil</th>
                  <th className="py-2.5 px-4 w-64">Keterangan / Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {NON_CRITICAL_INSPECTIONS.map(item => {
                  const status = inspections[item.id]?.status || 'normal';
                  const isNormal = status === 'normal';
                  return (
                    <tr key={item.id} className={!isNormal ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'}>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{item.label}</span>
                        {item.subText && (
                          <p className="text-[11px] text-slate-500">{item.subText}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleInspectionChange(item.id, 'normal')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              isNormal ? 'bg-emerald-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Normal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInspectionChange(item.id, 'abnormal')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              !isNormal ? 'bg-amber-600 text-white' : 'text-slate-600'
                            }`}
                          >
                            Abnormal
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={inspections[item.id]?.notes || ''}
                          onChange={e => handleInspectionNoteChange(item.id, e.target.value)}
                          placeholder={!isNormal ? 'Catatan perbaikan 1x24 jam...' : 'Kondisi...'}
                          className={`w-full px-2.5 py-1 text-xs rounded border ${
                            !isNormal ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden space-y-3">
            {NON_CRITICAL_INSPECTIONS.map(item => {
              const status = inspections[item.id]?.status || 'normal';
              const isNormal = status === 'normal';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    !isNormal ? 'bg-amber-50 border-amber-300' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold text-slate-500 mr-1.5">[{item.code}]</span>
                    <span className="font-bold text-slate-900">{item.label}</span>
                  </div>
                  {item.subText && (
                    <p className="text-[11px] text-slate-500 leading-tight">{item.subText}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(item.id, 'normal')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        isNormal ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(item.id, 'abnormal')}
                      className={`py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                        !isNormal ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Abnormal
                    </button>
                  </div>

                  <input
                    type="text"
                    value={inspections[item.id]?.notes || ''}
                    onChange={e => handleInspectionNoteChange(item.id, e.target.value)}
                    placeholder={!isNormal ? 'Catatan perbaikan 1x24 jam...' : 'Kondisi...'}
                    className={`w-full px-2.5 py-1.5 text-xs rounded border ${
                      !isNormal ? 'bg-white border-amber-300 text-amber-900 font-medium' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 6: REKOMENDASI MEKANIK & PERSETUJUAN FOREMAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Rekomendasi Mekanik (Requirement 7: Tidak terisi secara otomatis) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-sky-600" />
              Rekomendasi Mekanik (Opsional)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {mechanicStatus === 'pending' ? 'Belum Ada' : mechanicStatus === 'continue_operation' ? 'Laik Jalan' : 'Stop'}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Kelaikan Teknis:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMechanicStatus('pending');
                  setMechanicReason('');
                  setMechanicSignature(undefined);
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                  mechanicStatus === 'pending' 
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Kosong / Pending
              </button>
              <button
                type="button"
                onClick={() => {
                  setMechanicStatus('continue_operation');
                  if (!mechanicReason) setMechanicReason('Sistem EV normal & laik operasi.');
                  if (isMechanicUser && currentUser.signatureDataUrl) setMechanicSignature(currentUser.signatureDataUrl);
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                  mechanicStatus === 'continue_operation' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tetap Beroperasi
              </button>
              <button
                type="button"
                onClick={() => {
                  setMechanicStatus('stop_operation');
                  if (!mechanicReason) setMechanicReason('Unit perlu perbaikan sebelum beroperasi.');
                  if (isMechanicUser && currentUser.signatureDataUrl) setMechanicSignature(currentUser.signatureDataUrl);
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                  mechanicStatus === 'stop_operation' 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                STOP Operasi
              </button>
            </div>
          </div>

          {mechanicStatus !== 'pending' ? (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan / Catatan Perbaikan Mekanik:</label>
                <textarea
                  rows={2}
                  value={mechanicReason}
                  onChange={e => setMechanicReason(e.target.value)}
                  placeholder="Catatan inspeksi teknis..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={mechanicName}
                  onChange={e => setMechanicName(e.target.value)}
                  placeholder="Nama Mekanik"
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
                />
                <input
                  type="text"
                  value={mechanicNik}
                  onChange={e => setMechanicNik(e.target.value)}
                  placeholder="NIK Mekanik"
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 font-mono"
                />
              </div>

              {/* Mechanic Signature Box */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-10 bg-white border border-slate-200 rounded flex items-center justify-center p-0.5 overflow-hidden">
                    {mechanicSignature ? (
                      <img src={mechanicSignature} alt="TTD Mekanik" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum TTD</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">TTD Mekanik</span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {mechanicSignature ? 'Terpasang' : 'Belum Ada'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSignModalTarget('mechanic')}
                  className="px-2.5 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 font-semibold"
                >
                  Ubah TTD
                </button>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-100">
              Rekomendasi mekanik belum diisi. Bagian ini bersifat opsional dan hanya diisi jika unit menjalani inspeksi perbaikan oleh mekanik EV.
            </p>
          )}
        </div>

        {/* Persetujuan Foreman (Requirement 3: Muncul di lonceng & TTD muncul setelah diapprove) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Persetujuan Foreman / Atasan K3
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
              foremanDecision === 'approved' ? 'bg-emerald-100 text-emerald-800' :
              foremanDecision === 'rejected' ? 'bg-rose-100 text-rose-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {foremanDecision === 'approved' ? 'Disetujui' : foremanDecision === 'rejected' ? 'Ditolak' : 'Menunggu Approval'}
            </span>
          </div>

          {!isForemanOrAdmin ? (
            /* Tampilan untuk Operator / Driver: Hanya status informatif */
            <div className="space-y-3">
              {foremanDecision === 'approved' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Formulir Telah Disetujui Resmi (Approved)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Oleh: <strong>{foremanName || 'Foreman Lapangan'}</strong> (NIK: {foremanNik || '-'})
                  </p>
                  {foremanNotes && (
                    <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded border border-emerald-100">
                      "{foremanNotes}"
                    </p>
                  )}
                  {foremanSignature && (
                    <div className="w-24 h-12 bg-white border border-emerald-200 rounded p-1 flex items-center justify-center">
                      <img src={foremanSignature} alt="TTD Foreman" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Menunggu Persetujuan Atasan (Pending Approval)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Saat Anda menekan tombol <strong>Simpan & Ajukan Form P2H</strong> di bawah, sistem akan otomatis mengirimkan permintaan persetujuan ke <strong>Lonceng Pemberitahuan Atasan/Admin</strong>.
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    Tanda tangan digital atasan akan otomatis terpasang setelah diverifikasi dan disetujui.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Tampilan untuk Admin / Foreman: Bisa approve / tolak langsung */
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keputusan Persetujuan:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForemanDecision('pending');
                      setForemanSignature(undefined);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                      foremanDecision === 'pending' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForemanDecision('approved');
                      if (!foremanNotes) setForemanNotes('Disetujui beroperasi untuk shift ini.');
                      setForemanName(currentUser.name);
                      setForemanNik(currentUser.nik);
                      if (currentUser.signatureDataUrl) setForemanSignature(currentUser.signatureDataUrl);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                      foremanDecision === 'approved' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Disetujui
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForemanDecision('rejected');
                      if (!foremanNotes) setForemanNotes('Unit dihentikan untuk investigasi.');
                      setForemanName(currentUser.name);
                      setForemanNik(currentUser.nik);
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-colors ${
                      foremanDecision === 'rejected' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Ditolak / Stop
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Pengawas K3 / Foreman:</label>
                <textarea
                  rows={2}
                  value={foremanNotes}
                  onChange={e => setForemanNotes(e.target.value)}
                  placeholder="Catatan persetujuan..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={foremanName}
                  onChange={e => setForemanName(e.target.value)}
                  placeholder="Nama Foreman"
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
                />
                <input
                  type="text"
                  value={foremanNik}
                  onChange={e => setForemanNik(e.target.value)}
                  placeholder="NIK Foreman"
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 font-mono"
                />
              </div>

              {/* Foreman Signature Box */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-10 bg-white border border-slate-200 rounded flex items-center justify-center p-0.5 overflow-hidden">
                    {foremanSignature ? (
                      <img src={foremanSignature} alt="TTD Foreman" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum TTD</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">TTD Foreman</span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {foremanSignature ? 'Terpasang' : 'Akan Terpasang Saat Approve'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSignModalTarget('foreman')}
                  className="px-2.5 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 font-semibold"
                >
                  Ubah TTD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6.5: CATATAN TEMUAN DRIVER & UPLOAD FOTO TEMUAN (Requirement 1) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-600" />
          Catatan Temuan Driver & Upload Foto Hasil Temuan Lapangan
        </h3>
        <p className="text-xs text-slate-500">
          Tuliskan catatan khusus, keluhan operasional, atau temuan kerusakan di unit, serta unggah foto bukti temuan (opsional).
        </p>

        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1">Catatan Temuan / Kerusakan oleh Driver:</label>
            <textarea
              rows={3}
              value={driverFindingNotes}
              onChange={e => setDriverFindingNotes(e.target.value)}
              placeholder="Contoh: Ada bunyi mendecit pada suspensi depan kiri saat melewati jalan berlubang di Pit 3..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1">Upload Foto Hasil Temuan / Kerusakan:</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-32 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                {driverFindingPhotoUrl ? (
                  <img src={driverFindingPhotoUrl} alt="Foto Temuan" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic text-center">Belum ada foto</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Pilih & Upload Foto Temuan (PNG/JPG)
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleUploadFindingPhoto}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Foto ini akan otomatis masuk ke menu "Temuan Kerusakan" untuk dipantau oleh pengawas dan mekanik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7: PERNYATAAN & TANDA TANGAN OPERATOR (WITH DIRECT UPLOAD FEATURE) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          Komitmen & Tanda Tangan Operator P2H
        </h3>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedCommitment}
              onChange={e => setAgreedCommitment(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
            />
            <span className="text-xs text-slate-700 font-medium leading-relaxed">
              "Pengisian formulir P2H ini saya lakukan dengan benar dan saya berkomitmen melakukan pekerjaan dengan aman, sehat dan selamat sesuai standar operasional keselamatan pertambangan (Golden Rules & SOP EV Light Vehicle)."
            </span>
          </label>
        </div>

        {/* Operator Signature Box with Direct Upload / Draw */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-36 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-2xs shrink-0">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Tanda Tangan Operator"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-400 font-mono italic text-center">
                  Belum Ditandatangani
                </span>
              )}
            </div>

            <div className="text-xs">
              <p className="font-bold text-slate-900">Tanda Tangan Operator: {operatorName}</p>
              <p className="text-slate-500 font-mono text-[11px]">NIK: {operatorNik}</p>
              <span className="text-emerald-700 font-medium text-[11px] block mt-0.5">
                {signatureUrl ? 'Tanda tangan otomatis aktif' : 'Wajib tanda tangan'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload Gambar TTD
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleUploadOperatorSignature}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setSignModalTarget('operator')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Goreskan Baru
            </button>
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSaveForm('draft')}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Simpan Sebagai Draft
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 text-center"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!agreedCommitment}
              onClick={() => handleSaveForm('approved')}
              className="flex-2 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Ajukan Form P2H</span>
            </button>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal for all targets */}
      <SignaturePadModal
        isOpen={signModalTarget !== null}
        onClose={() => setSignModalTarget(null)}
        onSave={url => {
          if (signModalTarget === 'operator') setSignatureUrl(url);
          if (signModalTarget === 'foreman') setForemanSignature(url);
          if (signModalTarget === 'mechanic') setMechanicSignature(url);
          setSignModalTarget(null);
        }}
        title={
          signModalTarget === 'operator' ? 'Tanda Tangan Operator P2H' :
          signModalTarget === 'foreman' ? 'Tanda Tangan Foreman / Atasan' :
          'Tanda Tangan Mekanik EV'
        }
        signerName={
          signModalTarget === 'operator' ? operatorName :
          signModalTarget === 'foreman' ? foremanName :
          mechanicName
        }
        signerRole={
          signModalTarget === 'operator' ? 'Operator Light Vehicle EV' :
          signModalTarget === 'foreman' ? 'Foreman K3 Lapangan' :
          'Mekanik EV Maintenance'
        }
        initialSignatureUrl={
          signModalTarget === 'operator' ? signatureUrl :
          signModalTarget === 'foreman' ? foremanSignature :
          mechanicSignature
        }
      />
    </div>
  );
};
