export type UserRole = 'Master Admin' | 'Pengawas' | 'Driver' | 'admin' | 'operator' | 'foreman' | 'mechanic';

export type CheckStatus = 'normal' | 'abnormal';
export type DriverStatus = 'ya' | 'tidak';

export interface DriverConditionItem {
  id: string;
  code: string;
  label: string;
  subLabel?: string;
  category: 'license' | 'rules' | 'fit' | 'ev_awareness';
  requiresDetailDate?: 'idCard' | 'simper';
}

export interface P2HCheckItem {
  id: string;
  number: string;
  label: string;
  hint?: string;
  category: 'critical' | 'non_critical';
  isSubItem?: boolean;
  parentId?: string;
}

export interface P2HFormRecord {
  id: string;
  docNumber: string; // 'F-QHSE-OPS-MOB-09'
  createdAt: string;
  updatedAt: string;
  
  // Header details
  operatorName: string;
  operatorNik: string;
  date: string;
  shift: 'Shift 1 (Siang)' | 'Shift 2 (Malam)';
  workLocation: string;
  jobSite: string;
  equipmentType: string; // 'Light Vehicle (EV)'
  unitModel: string; // 'JAC T9 EV 4x4'
  unitNumber: string; // 'LV-EV-01'
  skoExpiryDate: string;
  
  // KM and Battery Telemetry
  startKm: number;
  endKm: number;
  startSoc: number; // State of Charge %
  endSoc: number; // State of Charge %
  batteryCapacityKwh: number; // 88.02 kWh standard JAC T9 EV
  
  // P2H EV Charging Section (% Terisi & Konversi)
  charging?: {
    percentCharged: number; // % terisi (0 - 100%)
    energyAddedKwh: number;
    estimatedRangeKm: number;
    chargingLocation: string;
  };

  // Computed Energy Metrics
  totalKm: number;
  batteryUsedPercent: number;
  energyConsumedKwh: number;
  consumptionRateKwhPerKm: number;
  costSavingsIdr: number;
  co2ReductionKg: number;

  // Form Section A: Kondisi Driver (Fit to Work)
  driverCondition: {
    idCardExpiry: string;
    simperExpiry: string;
    items: Record<string, DriverStatus>;
    notes: Record<string, string>;
  };

  // Form Section B & C: Item Pemeriksaan
  inspections: Record<string, {
    status: CheckStatus;
    notes?: string;
    photoUrl?: string;
    isClosed?: boolean;
  }>;

  // Status & Approvals
  overallStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'needs_maintenance';
  hasAbnormalCritical: boolean;
  hasAbnormalNonCritical: boolean;

  // Mechanic Section
  mechanicRecommendation: {
    status: 'continue_operation' | 'stop_operation' | 'pending';
    reason: string;
    mechanicName: string;
    mechanicNik: string;
    signatureUrl?: string;
    recommendedAt?: string;
  };

  // Foreman Approval Section
  foremanApproval: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    foremanName: string;
    foremanNik: string;
    signatureUrl?: string;
    approvedAt?: string;
  };

  // Operator Signature
  operatorSignature: {
    agreed: boolean;
    signatureUrl?: string;
    submittedAt?: string;
  };

  // Driver Finding Notes & Photo Upload (Requirement 1)
  driverFindingNotes?: string;
  driverFindingPhotoUrl?: string;
  driverFindingIsClosed?: boolean;

  // Repair Status Tracking (Close per repair)
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;
}

export interface VehicleUnit {
  id: string;
  unitNumber: string;
  model: string;
  plateNumber: string;
  vin: string;
  batteryCapacityKwh: number;
  currentOdoKm: number;
  currentSoc: number;
  cumulativeKwh: number;
  lastServiceKwh: number;
  nextServiceKwh: number;
  status: 'ready' | 'operating' | 'in_inspection' | 'maintenance_due' | 'breakdown';
  assignedDriver?: string;
  location: string;
  skoExpiry: string;
  photoUrl?: string;
}

export interface RolePermissionMatrix {
  createP2H: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
  telemetryInput: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
  officialApproval: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
  fleetManagement: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
  accountManagement: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
  pdfExport: { 'Master Admin': boolean; Pengawas: boolean; Driver: boolean };
}

export interface MaintenanceServiceItem {
  id: string;
  intervalKwh: number;
  intervalKmEquivalent: number;
  serviceTier: 'PM-1 (1.500 kWh)' | 'PM-2 (3.000 kWh)' | 'PM-3 (6.000 kWh)' | 'PM-Major (12.000 kWh)';
  title: string;
  description: string;
  components: string[];
}

export interface MaintenanceLog {
  id: string;
  unitNumber: string;
  serviceDate: string;
  serviceTier: string;
  kwhAtService: number;
  kmAtService: number;
  workOrderNumber: string;
  mechanicName: string;
  mechanicNik: string;
  notes: string;
  replacedParts: string[];
  batteryHealthSoH: number;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  nik: string;
  password?: string;
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  simperNumber: string;
  simperExpiry: string;
  idCardExpiry: string;
  signatureDataUrl?: string;
  avatarUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'p2h_submitted' | 'p2h_approved' | 'p2h_rejected' | 'maintenance_due';
  read: boolean;
  formId?: string;
  unitNumber?: string;
  operatorName?: string;
  targetRole?: 'admin' | 'foreman' | 'all';
}

export interface AppSettings {
  primaryColor: string; // Hex color code
  themePreset: string;
  fontFamily: 'Plus Jakarta Sans' | 'DM Sans' | 'Outfit' | 'Manrope';
  companyName: string;
  tagline: string;
  logoUrl?: string;
  appTitle: string;
  appIcon?: 'lightning' | 'truck' | 'shield' | 'battery' | 'gear' | 'custom';
  soundEnabled?: boolean;
  soundProfile?: 'modern_chime' | 'subtle_click' | 'electric_pulse' | 'safety_beep' | 'mute';
  soundVolume?: number;
  backgroundMode?: 'solid' | 'gradient' | 'image';
  backgroundImage?: string;
  blurLevel?: 'none' | 'low' | 'medium' | 'high' | 'ultra';
  glassIntensity?: 'low' | 'medium' | 'high' | 'ultra';
  backgroundBlurNumber?: number; // 0 to 30px blur for background image
  // Hero Card text customization (editable only by Master Admin)
  heroSubTitle?: string;
  heroDocNumber?: string;
  heroMainTitle?: string;
  heroDescription?: string;
  // Login Barcode customization (editable by Master Admin)
  loginBarcodeBadge?: string;
  loginBarcodeTitle?: string;
  loginBarcodeSubtitle?: string;
  loginBarcodeFooter?: string;
  loginBarcodeCustomUrl?: string;
}

