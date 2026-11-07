import React, { useState } from 'react';
import { UserProfile, UserRole, RolePermissionMatrix, AppSettings } from '../types/p2h';
import { realtimeSync } from '../services/realtimeSync';
import { getGlassCardClass } from '../utils/glass';
import { 
  User, 
  Shield, 
  CreditCard, 
  Calendar, 
  Mail, 
  Phone, 
  Building, 
  Check, 
  Award, 
  Edit3, 
  Clock, 
  CheckCircle,
  Truck,
  Wrench,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Key,
  Upload,
  Lock,
  Eye,
  EyeOff,
  PenTool,
  X,
  QrCode,
  Download
} from 'lucide-react';
import { SignaturePadModal } from './SignaturePadModal';
import { LoginBarcodeCard } from './LoginBarcodeCard';

interface AccountProfileViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  settings?: AppSettings;
  onSwitchUser: (user: UserProfile) => void;
  onAddUser: (newUser: UserProfile) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

const DEFAULT_MATRIX: RolePermissionMatrix = {
  createP2H: { 'Master Admin': true, Pengawas: true, Driver: true },
  telemetryInput: { 'Master Admin': true, Pengawas: true, Driver: true },
  officialApproval: { 'Master Admin': true, Pengawas: true, Driver: false },
  fleetManagement: { 'Master Admin': true, Pengawas: true, Driver: false },
  accountManagement: { 'Master Admin': true, Pengawas: false, Driver: false },
  pdfExport: { 'Master Admin': true, Pengawas: true, Driver: true }
};

export const INITIAL_ACCOUNTS: UserProfile[] = [
  {
    id: 'user_admin',
    name: 'Admin Operations',
    username: 'admin',
    nik: 'ADM-001',
    password: 'password123',
    role: 'Master Admin',
    department: 'QHSE & Fleet Asset Management',
    phone: '+62 811-0000-1001',
    email: 'admin@muliabaramining.com',
    simperNumber: 'SMPR-2025-EV-001',
    simperExpiry: '2029-12-31',
    idCardExpiry: '2029-12-31',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,40 Q60,10 110,60 T180,30" fill="none" stroke="%237c3aed" stroke-width="3"/></svg>'
  },
  {
    id: 'user_pengawas',
    name: 'Pengawas Lapangan',
    username: 'supervisor',
    nik: 'SPV-001',
    password: 'password123',
    role: 'Pengawas',
    department: 'Divisi Keselamatan & Pengawasan Lapangan (K3)',
    phone: '+62 811-0000-1002',
    email: 'pengawas@muliabaramining.com',
    simperNumber: 'SMPR-2025-EV-002',
    simperExpiry: '2028-12-31',
    idCardExpiry: '2028-12-31',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M15,45 Q60,15 95,50 T160,25 T195,55" fill="none" stroke="%230f172a" stroke-width="3"/></svg>'
  },
  {
    id: 'user_driver',
    name: 'Driver Operator',
    username: 'driver',
    nik: 'DRV-001',
    password: 'password123',
    role: 'Driver',
    department: 'Mining Operations & Hauling',
    phone: '+62 812-0000-1003',
    email: 'driver@muliabaramining.com',
    simperNumber: 'SMPR-2025-EV-003',
    simperExpiry: '2027-12-31',
    idCardExpiry: '2027-12-31',
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,50 Q40,10 80,40 T150,30 T190,60" fill="none" stroke="%230284c7" stroke-width="3"/></svg>'
  }
];

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  currentUser,
  allUsers,
  settings,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateSettings
}) => {
  const glassCard = getGlassCardClass(settings);
  const safeUser: UserProfile = (currentUser && currentUser.id && currentUser.role) ? currentUser : INITIAL_ACCOUNTS[0];
  const isAdmin = safeUser.role === 'admin' || safeUser.role === 'Master Admin';
  // Tabs: 'profile' | 'manage' | 'barcode'
  const [activeTab, setActiveTab] = useState<'profile' | 'manage' | 'barcode'>('profile');

  // Permission Matrix State
  const [permissions, setPermissions] = useState<RolePermissionMatrix>(() => {
    try {
      const saved = localStorage.getItem('jac_t9_permissions_v5');
      return saved ? JSON.parse(saved) : DEFAULT_MATRIX;
    } catch {
      return DEFAULT_MATRIX;
    }
  });

  const togglePermission = (featureKey: keyof RolePermissionMatrix, role: 'Master Admin' | 'Pengawas' | 'Driver') => {
    if (!isAdmin) {
      alert('Hanya Master Admin yang berwenang mengubah matriks hak akses.');
      return;
    }
    setPermissions(prev => {
      const updated = {
        ...prev,
        [featureKey]: {
          ...prev[featureKey],
          [role]: !prev[featureKey]?.[role]
        }
      };
      localStorage.setItem('jac_t9_permissions_v5', JSON.stringify(updated));
      realtimeSync.pushUpdate({ permissions: updated } as any);
      return updated;
    });
  };

  // Modal State for Add / Edit Account
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('operator');
  const [formDepartment, setFormDepartment] = useState('Mining Operations & Hauling');
  const [formPhone, setFormPhone] = useState('+62 812-0000-0000');
  const [formEmail, setFormEmail] = useState('');
  const [formSimperNumber, setFormSimperNumber] = useState('');
  const [formSimperExpiry, setFormSimperExpiry] = useState('2027-12-31');
  const [formIdCardExpiry, setFormIdCardExpiry] = useState('2027-12-31');
  const [formSignature, setFormSignature] = useState<string | undefined>(undefined);

  // Delete Confirm Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Signature Pad Modal
  const [isSignPadOpen, setIsSignPadOpen] = useState(false);

  // Success Alert & Form Error
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    if (!isAdmin) {
      alert('Hanya akun Admin yang berwenang menambah akun baru.');
      return;
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setEditingUserId(null);
    setFormError(null);
    setFormName(`Operator ${randNum}`);
    setFormUsername(`user_${randNum}`);
    setFormNik(`OP-${randNum}`);
    setFormPassword('password123');
    setFormRole('operator');
    setFormDepartment('Mining Operations & Hauling');
    setFormPhone('+62 812-');
    setFormEmail('');
    setFormSimperNumber(`SMPR-2024-EV-${Math.floor(100 + Math.random() * 900)}`);
    setFormSimperExpiry('2027-12-31');
    setFormIdCardExpiry('2027-12-31');
    setFormSignature(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    // Restrict editing strictly to Admin / Master Admin (User Request #2)
    if (!isAdmin) {
      alert('Edit profil & akun hanya dapat dilakukan oleh Admin.');
      return;
    }
    setEditingUserId(user.id);
    setFormError(null);
    setFormName(user.name);
    setFormUsername(user.username || user.nik.toLowerCase().replace(/[^a-z0-9]/g, ''));
    setFormNik(user.nik);
    setFormPassword(user.password || 'password123');
    setFormRole(user.role);
    setFormDepartment(user.department);
    setFormPhone(user.phone);
    setFormEmail(user.email);
    setFormSimperNumber(user.simperNumber);
    setFormSimperExpiry(user.simperExpiry);
    setFormIdCardExpiry(user.idCardExpiry);
    setFormSignature(user.signatureDataUrl);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const rawNik = formNik.trim();
    const nikToUse = (!rawNik || rawNik === '-') ? `OP-${Math.floor(1000 + Math.random() * 9000)}` : rawNik;
    const nameToUse = formName.trim() || `Pengguna ${nikToUse}`;

    // Security check: non-admins cannot edit/add
    if (!isAdmin && editingUserId && editingUserId !== currentUser.id) {
      setFormError('Hanya akun Admin yang berwenang mengedit pengguna lain.');
      return;
    }
    if (!isAdmin && !editingUserId) {
      setFormError('Hanya akun Admin yang berwenang menambahkan pengguna baru.');
      return;
    }

    const baseUsername = (formUsername.trim() || nikToUse.replace(/[^a-zA-Z0-9_-]/g, '')).toLowerCase();

    // Auto-resolve username uniqueness so it never blocks saving
    let cleanUsername = baseUsername;
    let counter = 1;
    while (allUsers.some(u => u && u.id !== editingUserId && u.username && u.username.toLowerCase() === cleanUsername)) {
      counter++;
      cleanUsername = `${baseUsername}_${counter}`;
    }

    // Auto-resolve NIK uniqueness
    let finalNik = nikToUse;
    let nikCounter = 1;
    while (allUsers.some(u => u && u.id !== editingUserId && u.nik && u.nik.toLowerCase() === finalNik.toLowerCase())) {
      nikCounter++;
      finalNik = `${nikToUse}-${nikCounter}`;
    }

    if (editingUserId) {
      const updated: UserProfile = {
        id: editingUserId,
        name: nameToUse,
        username: cleanUsername,
        nik: finalNik,
        password: formPassword || 'password123',
        role: formRole,
        department: formDepartment.trim() || 'Mining Operations & Hauling',
        phone: formPhone.trim() || '+62 812-',
        email: formEmail.trim() || `${cleanUsername}@muliabara.com`,
        simperNumber: formSimperNumber.trim(),
        simperExpiry: formSimperExpiry || '2027-12-31',
        idCardExpiry: formIdCardExpiry || '2027-12-31',
        signatureDataUrl: formSignature
      };
      onUpdateUser(updated);
      setAlertMsg(`Akun ${updated.name} (${updated.role}) berhasil diperbarui!`);
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: nameToUse,
        username: cleanUsername,
        nik: finalNik,
        password: formPassword || 'password123',
        role: formRole,
        department: formDepartment.trim() || 'Mining Operations & Hauling',
        phone: formPhone.trim() || '+62 812-',
        email: formEmail.trim() || `${cleanUsername}@muliabara.com`,
        simperNumber: formSimperNumber.trim(),
        simperExpiry: formSimperExpiry || '2027-12-31',
        idCardExpiry: formIdCardExpiry || '2027-12-31',
        signatureDataUrl: formSignature
      };
      onAddUser(newUser);
      setAlertMsg(`Akun baru ${newUser.name} (${newUser.role}) berhasil didaftarkan!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleDeleteAccount = (id: string) => {
    if (!isAdmin) {
      alert('Hanya akun Admin yang berwenang menghapus akun.');
      return;
    }
    onDeleteUser(id);
    setDeleteConfirmId(null);
    setAlertMsg('Akun berhasil dihapus dari sistem.');
    setTimeout(() => setAlertMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className={`${glassCard} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                OTORISASI & MANAJEMEN AKSES
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                SECURITY & K3 EV
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Manajemen Akun, Password & Hak Akses Pengguna
            </h1>
            <p className="text-xs text-slate-500">
              Kelola kredensial login username/password dan peran hak akses (*Operator, Foreman, Mekanik, Admin*).
              {!isAdmin && (
                <span className="text-amber-700 font-medium ml-1">
                  (Khusus Akun Admin berwenang mengelola seluruh akun).
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('barcode')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Buka & Unduh Barcode Login Driver"
            >
              <QrCode className="w-4 h-4 text-sky-600" />
              Barcode Login Driver
            </button>

            {isAdmin ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Tambah Akun Baru
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Admin Only Access
              </div>
            )}
          </div>
        </div>

        {alertMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profil Akun Saya ({currentUser.name})
          </button>

          {isAdmin ? (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'manage' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Kelola Semua Akun ({allUsers.length})
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 px-2 py-1 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <Lock className="w-3 h-3 text-slate-400" />
              Kelola Akun (Hanya Admin)
            </span>
          )}

          {/* TAB 3: Barcode Akses Login Driver */}
          <button
            onClick={() => setActiveTab('barcode')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'barcode' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-700 hover:text-sky-900 bg-sky-50 border border-sky-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Barcode Akses Login Driver</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'barcode' ? 'bg-white text-sky-700' : 'bg-sky-200 text-sky-900'}`}>
              Unduh & Edit
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIL AKUN AKTIF */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Kiri: Identitas & Tanda Tangan Tersimpan */}
          <div className={`${glassCard} p-6 flex flex-col justify-between space-y-6`}>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md border-4 border-white">
                {(safeUser.name || 'User').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {safeUser.name}
                </h2>
                <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  NIK: {safeUser.nik}
                </span>
              </div>

              <div>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  safeUser.role === 'operator' ? 'bg-sky-100 text-sky-800' :
                  safeUser.role === 'foreman' ? 'bg-emerald-100 text-emerald-800' :
                  safeUser.role === 'mechanic' ? 'bg-amber-100 text-amber-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {safeUser.role === 'operator' ? 'Operator Light Vehicle' :
                   safeUser.role === 'foreman' ? 'Foreman / Pengawas K3' :
                   safeUser.role === 'mechanic' ? 'Mekanik / Teknisi EV' :
                   'Administrator / QHSE Manager'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {safeUser.department}
              </p>
            </div>

            {/* Saved Signature Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-sky-600" />
                  Tanda Tangan Digital Tersimpan
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Otomatis Muncul di P2H</span>
              </div>

              <div className="w-full h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                {safeUser.signatureDataUrl ? (
                  <img
                    src={safeUser.signatureDataUrl}
                    alt="Tanda Tangan Tersimpan"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Belum ada tanda tangan tersimpan
                  </span>
                )}
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => openEditModal(safeUser)}
                  className="w-full py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors text-center cursor-pointer"
                >
                  Upload / Ubah Tanda Tangan Ini
                </button>
              ) : (
                <div className="w-full py-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 text-center flex items-center justify-center gap-1 cursor-not-allowed">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Edit TTD (Khusus Admin)
                </div>
              )}
            </div>

            {/* SIMPER Status Widget */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>SIMPER Tambang</span>
                <span className="text-emerald-700 text-[10px] font-bold">TERDAFTAR VALID</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Nomor:</span>
                <span className="font-mono font-bold text-slate-800">{safeUser.simperNumber || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Berlaku Hingga:</span>
                <span className="font-mono">{safeUser.simperExpiry || '-'}</span>
              </div>
            </div>
          </div>

          {/* Card Kanan: Rincian & Akses Cepat Ganti Akun */}
          <div className={`lg:col-span-2 ${glassCard} p-6 space-y-6`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Rincian Akun & Hak Akses Fitur
              </h2>
              {isAdmin ? (
                <button
                  onClick={() => openEditModal(safeUser)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Akun Saya
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed" title="Edit profil & akun hanya dapat dilakukan oleh Admin">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Edit Akun (Khusus Admin)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Alamat Email Kerja
                </span>
                <span className="font-semibold text-slate-900 block">{safeUser.email}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Nomor Kontak
                </span>
                <span className="font-semibold text-slate-900 block font-mono">{safeUser.phone}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Status Kata Sandi (Password)
                </span>
                <span className="font-semibold text-slate-900 block font-mono">
                  •••••••• (Tersimpan Aman)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Otorisasi Hak Akses
                </span>
                <span className="font-semibold text-sky-700 block">
                  {safeUser.role === 'foreman' ? 'Persetujuan / Approval Atasan P2H' :
                   safeUser.role === 'mechanic' ? 'Verifikasi Teknis & Servis Berkala kWh' :
                   safeUser.role === 'operator' ? 'Pembuatan Formulir P2H & Input Telemetri' :
                   'Hak Akses Penuh Sistem (Administrator)'}
                </span>
              </div>
            </div>

            {/* Switch User List - Restricted to Master Admin */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 mb-2">
                Masuk Cepat Sebagai Pengguna Lain:
              </h3>
              {isAdmin ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allUsers.map(user => {
                    const isActive = user.id === safeUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => onSwitchUser(user)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{user.name}</span>
                            {isActive && <span className="text-[9px] bg-sky-600 text-white font-bold px-1.5 rounded">AKTIF</span>}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{user.nik}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Fitur beralih akun pengguna dibatasi dan dikelola secara khusus oleh Master Admin.</span>
                </div>
              )}
            </div>

            {/* Quick Link Banner Card to Barcode Akses Login Driver */}
            <div className="pt-4 border-t border-slate-100">
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50/60 rounded-xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Barcode Akses Masuk Halaman Login Driver
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Scan langsung via kamera HP driver untuk login, atau unduh & cetak kartu barcode untuk dashboard kabin unit JAC T9 EV.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('barcode')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Buka & Unduh Barcode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR SEMUA AKUN & MANAJEMEN AKSES */}
      {activeTab === 'manage' && (
        <div className={`${glassCard} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Kredensial Pengguna & Hak Akses
              </h2>
              <p className="text-xs text-slate-500">
                Kelola hak akses operator, foreman, mekanik, serta lakukan edit password dan hapus akun.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {allUsers.length} Akun Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap & Akun</th>
                  <th className="py-3 px-4">Username Login</th>
                  <th className="py-3 px-4">Hak Akses (Peran)</th>
                  <th className="py-3 px-4">Departemen</th>
                  <th className="py-3 px-4">Kontak & Email</th>
                  <th className="py-3 px-4 text-center">Tanda Tangan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{user.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">NIK: {user.nik}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 text-[11px]">
                          @{user.username || user.nik.toLowerCase().replace(/[^a-z0-9]/g, '')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          user.role === 'operator' ? 'bg-sky-100 text-sky-800' :
                          user.role === 'foreman' ? 'bg-emerald-100 text-emerald-800' :
                          user.role === 'mechanic' ? 'bg-amber-100 text-amber-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {user.department}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block text-slate-800 font-mono text-[11px]">{user.phone}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{user.email}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {user.signatureDataUrl ? (
                          <div className="w-16 h-8 bg-slate-50 border border-slate-200 rounded mx-auto flex items-center justify-center p-0.5 overflow-hidden">
                            <img src={user.signatureDataUrl} alt="TTD" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum Ada</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                            SEDANG AKTIF
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSwitchUser(user)}
                            className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                          >
                            Beralih
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                            title="Edit Akun & Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={allUsers.length <= 1}
                            onClick={() => setDeleteConfirmId(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* REQUIREMENT 4: Interactive Matriks Hak Akses & Checklist Peran */}
          <div className="p-6 bg-white border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Matriks Hak Akses & Checklist Peran (Master Admin, Pengawas, Driver)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang / batalkan centang opsi di bawah ini untuk mengatur izin akses modul secara langsung (Khusus Admin).
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 shrink-0">
                {isAdmin ? 'Mode Edit Admin' : 'Mode Read-Only'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fitur & Otorisasi Operasional P2H</th>
                    <th className="py-3 px-4 text-center w-32">Master Admin</th>
                    <th className="py-3 px-4 text-center w-32">Pengawas</th>
                    <th className="py-3 px-4 text-center w-32">Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {[
                    { key: 'createP2H' as const, label: 'Pengisian Formulir P2H & Checklist EV' },
                    { key: 'telemetryInput' as const, label: 'Input Telemetri Odometer & Charging % & Konversi' },
                    { key: 'officialApproval' as const, label: 'Persetujuan Resmi (Approval P2H & Tanda Tangan)' },
                    { key: 'fleetManagement' as const, label: 'Manajemen Unit Fleet & Status Kendaraan (CRUD)' },
                    { key: 'accountManagement' as const, label: 'Manajemen Akun, Password & Kredensial Pengguna' },
                    { key: 'pdfExport' as const, label: 'Export & Cetak PDF Resmi F-QHSE-OPS-MOB-09' }
                  ].map(item => (
                    <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.label}</td>
                      
                      {(['Master Admin', 'Pengawas', 'Driver'] as const).map(role => {
                        const isChecked = Boolean(permissions?.[item.key]?.[role]);
                        return (
                          <td key={role} className="py-3 px-4 text-center">
                            <label className={`inline-flex items-center justify-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                            } ${!isAdmin ? 'pointer-events-none opacity-80' : ''}`}>
                              <input
                                type="checkbox"
                                disabled={!isAdmin}
                                checked={isChecked}
                                onChange={() => togglePermission(item.key, role)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                              />
                              <span className="text-[11px] font-bold font-mono">
                                {isChecked ? 'IZIN' : 'BLOK'}
                              </span>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs flex items-center justify-between gap-2">
                <span className="font-semibold">
                  ✓ Matriks izin akses otomatis tersimpan & tersinkronisasi ke seluruh perangkat.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('jac_t9_permissions_v5', JSON.stringify(permissions));
                    alert('Matriks hak akses berhasil diperbarui!');
                  }}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  Simpan Matriks
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BARCODE AKSES LOGIN LAPANGAN */}
      {activeTab === 'barcode' && (
        <LoginBarcodeCard
          settings={settings}
          currentUser={safeUser}
          isAdmin={isAdmin}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {/* MODAL: TAMBAH / EDIT AKUN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUserId ? `Edit Akun Pengguna · ${formName}` : 'Daftarkan Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 mb-2">
                  <span>⚠️ {formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Nama Karyawan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-mono text-slate-400 font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="admin / driver / mekanik"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Induk Karyawan (NIK) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNik}
                    onChange={e => setFormNik(e.target.value)}
                    placeholder="OP-XXXX / FRM-XXXX / MEK-XXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Sandi (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hak Akses (Role Otorisasi) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Master Admin">Master Admin (Akses Penuh & Hak Pengaturan)</option>
                    <option value="admin">Admin (Administrator System)</option>
                    <option value="Pengawas">Pengawas (Atasan K3 - Review & Approve P2H)</option>
                    <option value="foreman">Foreman (Supervisor Lapangan)</option>
                    <option value="Driver">Driver (Driver EV - Buat P2H & TTD)</option>
                    <option value="operator">Operator (Operator Light Vehicle)</option>
                    <option value="mechanic">Mekanik (Teknisi / Mekanik EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departemen / Divisi</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="email@perusahaan.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor SIMPER Tambang</label>
                  <input
                    type="text"
                    value={formSimperNumber}
                    onChange={e => setFormSimperNumber(e.target.value)}
                    placeholder="SMPR-XXXX-EV-XXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expired SIMPER</label>
                  <input
                    type="date"
                    value={formSimperExpiry}
                    onChange={e => setFormSimperExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expired ID Card / SID</label>
                  <input
                    type="date"
                    value={formIdCardExpiry}
                    onChange={e => setFormIdCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                {/* TANDA TANGAN DIGITAL OTOMATIS */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-slate-800">
                      Tanda Tangan Digital Pengguna (Otomatis Muncul di P2H & Approval)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSignPadOpen(true)}
                      className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Gores Tangan Baru
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-40 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-2xs shrink-0">
                      {formSignature ? (
                        <img
                          src={formSignature}
                          alt="Tanda Tangan"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-400 italic text-[11px] text-center">
                          Belum ada file TTD
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Gambar Tanda Tangan (PNG / JPG / SVG)
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Saat akun ini membuat formulir P2H atau atasan menyetujui, tanda tangan ini akan langsung dibubuhkan secara instan.
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
                  <Save className="w-4 h-4" />
                  {editingUserId ? 'Simpan Perubahan Akun' : 'Daftarkan Akun'}
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
                Konfirmasi Hapus Akun
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong className="text-slate-900 font-bold">{allUsers.find(u => u.id === deleteConfirmId)?.name}</strong> (NIK: {allUsers.find(u => u.id === deleteConfirmId)?.nik})? Tindakan ini akan mencabut akses login pengguna.
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
                onClick={() => handleDeleteAccount(deleteConfirmId)}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal for in-modal drawing */}
      <SignaturePadModal
        isOpen={isSignPadOpen}
        onClose={() => setIsSignPadOpen(false)}
        onSave={url => setFormSignature(url)}
        title="Goreskan Tanda Tangan Akun"
        signerName={formName || currentUser.name}
        signerRole={formRole}
      />
    </div>
  );
};
