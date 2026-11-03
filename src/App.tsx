import React, { useState, useEffect, useCallback } from 'react';
import { 
  P2HFormRecord, 
  VehicleUnit, 
  MaintenanceLog, 
  UserRole,
  UserProfile,
  NotificationItem,
  AppSettings
} from './types/p2h';
import { 
  INITIAL_VEHICLES, 
  INITIAL_P2H_RECORDS, 
  INITIAL_MAINTENANCE_LOGS 
} from './data/initialData';
import { P2HFormEditor } from './components/P2HFormEditor';
import { UnitManagerView } from './components/UnitManagerView';
import { P2HLogView } from './components/P2HLogView';
import { OfficialPdfPrintView } from './components/OfficialPdfPrintView';
import { AccountProfileView, INITIAL_ACCOUNTS } from './components/AccountProfileView';
import { SettingsView } from './components/SettingsView';
import { NotificationBell } from './components/NotificationBell';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ChargingLogView } from './components/ChargingLogView';
import { DamageFindingsView } from './components/DamageFindingsView';
import { realtimeSync, API_BASE_URL } from './services/realtimeSync';
import { 
  ClipboardList, 
  FileText, 
  Truck, 
  User, 
  Settings, 
  RotateCcw, 
  LogOut, 
  Shield, 
  ShieldAlert,
  Zap, 
  BatteryCharging, 
  Cog, 
  BarChart3, 
  Menu, 
  X, 
  ChevronDown, 
  RefreshCw 
} from 'lucide-react';
import { playTriggerSound, playSuccessChime } from './utils/audio';
import { getGlassCardClass, getGlassSidebarClass, getGlassNavbarClass, getBlurClass } from './utils/glass';
import { saveCompressed, getCompressed } from './utils/storage';


const STORAGE_KEYS = {
  VEHICLES: 'jac_t9_vehicles_v6',
  RECORDS: 'jac_t9_p2h_records_v6',
  LOGS: 'jac_t9_maint_logs_v6',
  USERS: 'jac_t9_users_v6',
  CURRENT_USER: 'jac_t9_curr_user_v6',
  ACTIVE_USER_ID: 'jac_t9_active_user_id_v6',
  SETTINGS: 'jac_t9_settings_v6',
  NOTIFICATIONS: 'jac_t9_notifs_v6',
  IS_LOGGED_IN: 'jac_t9_is_logged_in_v6'
};

const DEFAULT_SETTINGS: AppSettings = {
  primaryColor: '#0284c7',
  themePreset: 'blue',
  fontFamily: 'Plus Jakarta Sans',
  companyName: 'PT MULIABARA MINING',
  tagline: 'LIGHT VEHICLE EV FLEET',
  appTitle: 'JAC T9 EV',
  appIcon: 'lightning',
  soundEnabled: true,
  soundProfile: 'modern_chime',
  heroSubTitle: 'PT MULIABARA MINING · SISTEM K3 EV',
  heroDocNumber: 'F-QHSE-OPS-MOB-09',
  heroMainTitle: 'JAC T9 EV 4x4 Double Cabin · Smart Fleet Management',
  heroDescription: 'Sistem pemeriksaan harian terpadu unit Light Vehicle Electric Vehicle dengan verifikasi multi-peran (Master Admin, Pengawas, Driver). Memantau langsung kondisi skid plate pelindung baterai, sistem tegangan tinggi 350V, insulasi soket CCS2, dan efisiensi konsumsi kWh di site tambang Kutai.',
  loginBarcodeBadge: 'PT MULIABARA MINING · SISTEM K3 EV',
  loginBarcodeTitle: 'Scan Barcode untuk Masuk Halaman Login P2H',
  loginBarcodeSubtitle: 'Arahkan kamera smartphone ke kode QR ini untuk langsung membuka formulir login pemeriksaan harian JAC T9 EV di site tambang.',
  loginBarcodeFooter: 'JAC T9 EV 4x4 Double Cabin · Unit Fleet Operasional Tambang Kutai',
  loginBarcodeCustomUrl: ''
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export default function App() {
  // Login State - Default to TRUE so opening the applet directly displays the Dashboard Telemetri EV, or false if ?page=login requested
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('page') === 'login' || urlParams.get('login') === 'true') {
        return false;
      }
      const saved = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Vehicles State
  const [vehicles, setVehicles] = useState<VehicleUnit[]>(() => {
    const saved = getCompressed(STORAGE_KEYS.VEHICLES);
    return saved ? saved : INITIAL_VEHICLES;
  });

  // P2H Records State
  const [p2hRecords, setP2hRecords] = useState<P2HFormRecord[]>(() => {
    try {
      const saved = getCompressed(STORAGE_KEYS.RECORDS);
      const parsed = saved ? saved : INITIAL_P2H_RECORDS;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Map(parsed.map(r => [r.id, r])).values());
      }
    } catch {
      // fallback
    }
    return INITIAL_P2H_RECORDS;
  });

  // Maintenance Logs State
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = getCompressed(STORAGE_KEYS.LOGS);
    return saved ? saved : INITIAL_MAINTENANCE_LOGS;
  });

  // Fallback Admin Account
  const DEFAULT_ADMIN_USER: UserProfile = INITIAL_ACCOUNTS[0];

  // Users Accounts State with migration fallback
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const parsed = getCompressed(STORAGE_KEYS.USERS);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validUsers = parsed
          .filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id))
          .map(u => ({
            ...u,
            role: u.role || 'operator',
            username: u.username || (u.role === 'admin' || u.role === 'Master Admin' ? 'admin' : u.nik ? String(u.nik).toLowerCase().replace(/[^a-z0-9]/g, '') : `user_${u.id}`)
          }));
        if (validUsers.length > 0) return validUsers;
      }
    } catch {
      // fallback
    }
    return INITIAL_ACCOUNTS;
  });

  // Current Logged In User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
      const parsed = getCompressed(STORAGE_KEYS.CURRENT_USER);
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
        return {
          ...parsed,
          role: parsed.role || 'operator',
          username: parsed.username || (parsed.role === 'admin' || parsed.role === 'Master Admin' ? 'admin' : parsed.nik ? String(parsed.nik).toLowerCase().replace(/[^a-z0-9]/g, '') : 'admin')
        };
      }
      if (activeId) {
        const found = INITIAL_ACCOUNTS.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN_USER;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = getCompressed(STORAGE_KEYS.SETTINGS);
    return saved ? saved : DEFAULT_SETTINGS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = getCompressed(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? saved : INITIAL_NOTIFICATIONS;
  });

  const [activeNav, setActiveNav] = useState<'dashboard' | 'p2h' | 'log' | 'charging_log' | 'damage_findings' | 'units' | 'account' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NAV_LABELS: Record<string, string> = {
    dashboard: 'Dashboard Telemetri EV',
    p2h: 'Formulir P2H Baru',
    log: 'Log & Arsip P2H',
    charging_log: 'Log EV Charging SPKLU',
    damage_findings: 'Temuan Kerusakan & Catatan Driver',
    units: 'Daftar Unit Fleet EV',
    account: 'Profil & Hak Akses Akun',
    settings: 'Pengaturan Sistem'
  };

  // Editing state for P2H form
  const [editingForm, setEditingForm] = useState<P2HFormRecord | null>(null);

  // Official PDF Print Preview / Download Target
  const [printableForm, setPrintableForm] = useState<P2HFormRecord | null>(null);

  // Safe active user guarantee
  const activeUser: UserProfile = (currentUser && currentUser.id && currentUser.role) ? currentUser : DEFAULT_ADMIN_USER;
  const isAdmin = activeUser.role === 'Master Admin' || activeUser.role === 'admin';

  // Ensure currentUser is healed if cleared
  useEffect(() => {
    if (!currentUser || !currentUser.id || !currentUser.role) {
      setCurrentUser(DEFAULT_ADMIN_USER);
    }
  }, [currentUser, DEFAULT_ADMIN_USER]);

  // If non-admin is on settings, redirect to 'p2h'
  useEffect(() => {
    if (!isAdmin && activeNav === 'settings') {
      setActiveNav('p2h');
    }
  }, [isAdmin, activeNav]);

  // Global Realtime Cloud Sync State (Netlify <-> Google AI Studio <-> Mobile <-> PC)
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  // Subscribe to Realtime Updates & Connection Status
  useEffect(() => {
    // 1. Subscribe to realtime updates emitted by any device
    const unsubscribeData = realtimeSync.subscribe((payload) => {
      if (Array.isArray(payload.records)) setP2hRecords(payload.records);
      if (Array.isArray(payload.vehicles) && payload.vehicles.length > 0) setVehicles(payload.vehicles);
      if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
      if (Array.isArray(payload.users) && payload.users.length > 0) {
        const validUsers = payload.users.filter((u): u is UserProfile => Boolean(u && typeof u === 'object' && u.id));
        if (validUsers.length > 0) setAllUsers(validUsers);
      }
      if (payload.settings && typeof payload.settings === 'object' && payload.settings.primaryColor) setSettings(payload.settings);
    });

    // 2. Subscribe to sync connection status
    const unsubscribeStatus = realtimeSync.subscribeStatus((status, time) => {
      setSyncStatus(status);
      if (time) setLastSyncTime(time);
    });

    return () => {
      unsubscribeData();
      unsubscribeStatus();
    };
  }, []);

  // Sync state with LocalStorage for offline resilience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.VEHICLES, vehicles);
  }, [vehicles]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.RECORDS, p2hRecords);
  }, [p2hRecords]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.LOGS, maintenanceLogs);
  }, [maintenanceLogs]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.USERS, allUsers);
  }, [allUsers]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    saveCompressed(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  // Apply custom theme font to root body
  useEffect(() => {
    if (settings.fontFamily) {
      document.body.style.fontFamily = `'${settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    }
  }, [settings.fontFamily]);

  // Force trigger sync
  const handleForceSync = async () => {
    setIsManualSyncing(true);
    await realtimeSync.forceSyncNow({
      records: p2hRecords,
      vehicles: vehicles,
      users: allUsers,
      notifications: notifications,
      settings: settings
    });
    setTimeout(() => {
      setIsManualSyncing(false);
    }, 800);
  };

  // Handler: Login Success
  const handleLoginSuccess = (user: UserProfile) => {
    const safeUser = (user && user.id && user.role) ? user : DEFAULT_ADMIN_USER;
    setCurrentUser(safeUser);
    saveCompressed(STORAGE_KEYS.CURRENT_USER, safeUser);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, safeUser.id);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    setIsLoggedIn(true);
    playTriggerSound();
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
    setIsLoggedIn(false);
    playTriggerSound();
  };

  // Handler: Save or Update P2H Form
  const handleSaveP2H = (savedForm: P2HFormRecord) => {
    let updatedRecords: P2HFormRecord[] = [];
    setP2hRecords(prev => {
      const exists = prev.some(r => r.id === savedForm.id);
      if (exists) {
        updatedRecords = prev.map(r => (r.id === savedForm.id ? savedForm : r));
      } else {
        updatedRecords = [savedForm, ...prev];
      }
      return updatedRecords;
    });

    let updatedVehicles: VehicleUnit[] = [];
    setVehicles(prevVehicles => {
      updatedVehicles = prevVehicles.map(veh => {
        if (veh.unitNumber === savedForm.unitNumber) {
          return {
            ...veh,
            currentOdoKm: savedForm.endKm,
            currentSoc: savedForm.endSoc,
            cumulativeKwh: (veh.cumulativeKwh || 0) + (savedForm.energyConsumedKwh || 0),
            assignedDriver: savedForm.operatorName,
            location: savedForm.workLocation,
            status: savedForm.overallStatus === 'approved' ? 'operating' : veh.status
          };
        }
        return veh;
      });
      return updatedVehicles;
    });

    const isApproved = savedForm.overallStatus === 'approved' || savedForm.foremanApproval?.status === 'approved';

    let updatedNotifications: NotificationItem[] = [];
    setNotifications(prev => {
      // Remove any prior notification for this specific formId so notifications are never duplicated
      const otherNotifs = prev.filter(n => n.formId !== savedForm.id);

      const notifItem: NotificationItem = {
        id: `notif_${savedForm.id}`,
        title: isApproved 
          ? `✅ P2H Disetujui: ${savedForm.unitNumber}`
          : `🔔 Permintaan Approval P2H (${savedForm.unitNumber})`,
        message: isApproved 
          ? `Formulir P2H unit ${savedForm.unitNumber} (${savedForm.shift}) telah diverifikasi & disetujui resmi oleh ${savedForm.foremanApproval?.foremanName || activeUser.name}. Unit laik beroperasi.`
          : `Driver ${savedForm.operatorName} telah mengajukan P2H unit ${savedForm.unitNumber} (${savedForm.shift}). Menunggu persetujuan resmi Foreman/Pengawas/Admin.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
        type: isApproved ? 'p2h_approved' : 'p2h_submitted',
        read: isApproved ? true : false,
        formId: savedForm.id,
        unitNumber: savedForm.unitNumber,
        operatorName: savedForm.operatorName,
        targetRole: 'admin'
      };

      updatedNotifications = [notifItem, ...otherNotifs];
      return updatedNotifications;
    });

    // Realtime sync across devices immediately after transaction
    realtimeSync.pushUpdate({
      records: [savedForm],
      vehicles: updatedVehicles.length ? updatedVehicles : vehicles,
      notifications: updatedNotifications
    });

    setEditingForm(null);
    setActiveNav('log');
  };

  // Handler: Update Record Only (Without changing navigation view)
  const handleUpdateRecordOnly = (savedForm: P2HFormRecord) => {
    setP2hRecords(prev => prev.map(r => (r.id === savedForm.id ? savedForm : r)));
    realtimeSync.pushUpdate({
      records: [savedForm]
    });
  };

  // Handler: Quick Approve from Notification Bell
  const handleQuickApproveFromBell = (formId: string, notifId?: string) => {
    const roleLower = (activeUser.role || '').toLowerCase().trim();
    // Authorized roles: Foreman, Pengawas, Admin & Master Admin
    const canApprove = ['admin', 'master admin', 'foreman', 'pengawas'].includes(roleLower);
    if (!canApprove) {
      alert('Akses Ditolak: Hanya Foreman, Pengawas, Admin, atau Master Admin yang memiliki hak otorisasi untuk menyetujui (Approve) P2H.');
      return;
    }

    const approvingAdmin = activeUser;
    let updatedRecords: P2HFormRecord[] = [];

    setP2hRecords(prev => {
      updatedRecords = prev.map(r => {
        if (r.id === formId) {
          return {
            ...r,
            updatedAt: new Date().toISOString(),
            overallStatus: 'approved' as const,
            foremanApproval: {
              status: 'approved' as const,
              notes: r.foremanApproval?.notes || 'Disetujui resmi melalui Lonceng Pemberitahuan K3.',
              foremanName: approvingAdmin.name,
              foremanNik: approvingAdmin.nik,
              signatureUrl: approvingAdmin.signatureDataUrl || r.foremanApproval?.signatureUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M15,45 Q60,15 95,50 T160,25 T195,55" fill="none" stroke="%230f172a" stroke-width="3"/></svg>',
              approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
            }
          };
        }
        return r;
      });
      return updatedRecords;
    });

    let updatedNotifications: NotificationItem[] = [];
    setNotifications(prev => {
      updatedNotifications = prev.map(n => {
        // Mark ALL notifications referencing this formId (or the clicked notifId) as read & approved
        if (n.id === notifId || (n.formId && n.formId === formId)) {
          return {
            ...n,
            read: true,
            title: `✅ Disetujui: ${n.unitNumber || 'P2H'}`,
            message: `Formulir P2H telah disetujui resmi oleh ${approvingAdmin.name} (${approvingAdmin.role}). Unit diizinkan beroperasi.`,
            type: 'p2h_approved' as const
          };
        }
        return n;
      });
      return updatedNotifications;
    });

    realtimeSync.pushUpdate({
      records: updatedRecords,
      notifications: updatedNotifications
    });

    playSuccessChime();
  };

  // Handler: Delete P2H Form
  const handleDeleteP2H = (recordId: string) => {
    setP2hRecords(prev => prev.filter(r => r.id !== recordId));
    setNotifications(prev => prev.filter(n => n.formId !== recordId));

    realtimeSync.pushUpdate({
      action: 'delete_record',
      targetId: recordId
    });

    playTriggerSound();
  };

  // Handler: Delete All P2H Forms (Master Admin / Admin)
  const handleDeleteAllP2H = () => {
    setP2hRecords([]);
    setNotifications([]);
    saveCompressed(STORAGE_KEYS.RECORDS, []);
    saveCompressed(STORAGE_KEYS.NOTIFICATIONS, []);
    realtimeSync.pushUpdate({ action: 'delete_all_records' });
    playTriggerSound();
  };

  // Handler: Add New Vehicle
  const handleAddVehicle = (newVeh: VehicleUnit) => {
    setVehicles(prev => [...prev, newVeh]);
    realtimeSync.pushUpdate({ vehicles: [newVeh] });
    playTriggerSound();
  };

  const handleUpdateVehicle = (updatedVeh: VehicleUnit) => {
    setVehicles(prev => prev.map(v => (v.id === updatedVeh.id ? updatedVeh : v)));
    realtimeSync.pushUpdate({ vehicles: [updatedVeh] });
  };

  const handleDeleteVehicle = (unitId: string) => {
    let updated: VehicleUnit[] = [];
    setVehicles(prev => {
      updated = prev.filter(v => v.id !== unitId);
      saveCompressed(STORAGE_KEYS.VEHICLES, updated);
      return updated;
    });
    realtimeSync.pushUpdate({ action: 'delete_vehicle', targetId: unitId });
    playTriggerSound();
  };

  // Handlers for User Management
  const handleAddUser = (newUser: UserProfile) => {
    let updated: UserProfile[] = [];
    setAllUsers(prev => {
      const filtered = prev.filter(u => u.id !== newUser.id);
      updated = [newUser, ...filtered];
      saveCompressed(STORAGE_KEYS.USERS, updated);
      return updated;
    });
    realtimeSync.pushUpdate({ users: updated.length ? updated : [newUser, ...allUsers] });
    playTriggerSound();
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    let updated: UserProfile[] = [];
    setAllUsers(prev => {
      updated = prev.map(u => (u.id === updatedUser.id ? updatedUser : u));
      saveCompressed(STORAGE_KEYS.USERS, updated);
      return updated;
    });
    if (activeUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, updatedUser.id);
      saveCompressed(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }
    realtimeSync.pushUpdate({ users: updated });
    playTriggerSound();
  };

  const handleDeleteUser = (userId: string) => {
    let updated: UserProfile[] = [];
    setAllUsers(prev => {
      updated = prev.filter(u => u.id !== userId);
      saveCompressed(STORAGE_KEYS.USERS, updated);
      return updated;
    });
    realtimeSync.pushUpdate({ users: updated });
    playTriggerSound();
  };

  const handleSwitchUser = (user: UserProfile) => {
    const safeUser = (user && user.id && user.role) ? user : DEFAULT_ADMIN_USER;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, safeUser.id);
    setCurrentUser(safeUser);
    playTriggerSound();
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    realtimeSync.pushUpdate({ settings: newSettings });
  };

  // Reset Demo Data
  const handleResetDemoData = () => {
    if (confirm('Reset seluruh data aplikasi ke sampel awal?')) {
      setVehicles(INITIAL_VEHICLES);
      setP2hRecords(INITIAL_P2H_RECORDS);
      setMaintenanceLogs(INITIAL_MAINTENANCE_LOGS);
      setAllUsers(INITIAL_ACCOUNTS);
      setCurrentUser(INITIAL_ACCOUNTS[0]);
      setSettings(DEFAULT_SETTINGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.clear();
      setIsLoggedIn(true);
      setActiveNav('p2h');
      setEditingForm(null);

      realtimeSync.pushUpdate({
        vehicles: INITIAL_VEHICLES,
        records: INITIAL_P2H_RECORDS,
        users: INITIAL_ACCOUNTS,
        settings: DEFAULT_SETTINGS,
        notifications: INITIAL_NOTIFICATIONS
      });
    }
  };

  // 1. If not logged in, render the Simplified Main Login Page
  if (!isLoggedIn) {
    return (
      <LoginView
        users={allUsers}
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 2. If printable view is active, render print layout exclusively
  if (printableForm) {
    return (
      <OfficialPdfPrintView
        form={printableForm}
        settings={settings}
        onClose={() => setPrintableForm(null)}
      />
    );
  }

  const glassCardStyle = getGlassCardClass(settings);
  const glassSidebarStyle = getGlassSidebarClass(settings);
  const glassNavbarStyle = getGlassNavbarClass(settings);

  return (
    <div className="min-h-screen text-slate-800 font-sans antialiased relative selection:bg-blue-600 selection:text-white">
      {/* 0. DYNAMIC BACKGROUND LAYER (Solid, Gradient, or Blurred Custom Image) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {settings.backgroundMode === 'solid' ? (
          <div className="absolute inset-0 bg-[#0c181f]" />
        ) : settings.backgroundMode === 'image' && settings.backgroundImage ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-300"
            style={{
              backgroundImage: `url(${settings.backgroundImage})`,
              filter: (settings.backgroundBlurNumber && settings.backgroundBlurNumber > 0)
                ? `blur(${settings.backgroundBlurNumber}px)`
                : 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#06181b] via-[#092925] to-[#041217]" />
        )}
      </div>
      
      {/* 1. CREATIVE TIM SOFT UI SIDENAV (SIDEBAR NAVIGATION) */}
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 xl:hidden transition-opacity"
        />
      )}

      {/* Sidenav Container */}
      <aside className={`fixed inset-y-0 left-0 my-0 ml-0 xl:my-4 xl:ml-4 w-64 ${glassSidebarStyle} p-4 z-50 flex flex-col justify-between transition-transform duration-300 xl:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'
      }`}>
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Sidenav Brand Header */}
            <div className="flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-8 max-w-28 object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tl from-blue-700 to-cyan-500 shadow-soft-2xl flex items-center justify-center text-white font-black text-sm shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                )}
                <div className="leading-tight">
                  <span className="font-extrabold text-sm text-slate-800 tracking-tight block">
                    {settings.appTitle || 'JAC T9 EV'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono block">
                    {settings.companyName || 'PT MULIABARA'}
                  </span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 xl:hidden rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <hr className="h-px my-3 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent border-0" />

            {/* Sidenav Links */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-22rem)] py-1 pr-1">
              
              {/* Group 1: PAGES & OPERASIONAL */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-mono">
                  DASHBOARD & OPERASIONAL
                </span>
                <ul className="space-y-1">
                  {/* Dashboard */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('dashboard'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'dashboard'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'dashboard'
                          ? 'bg-gradient-to-tl from-blue-700 to-cyan-500 text-white'
                          : 'bg-white/70 shadow-soft-sm text-slate-700'
                      }`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span>Dashboard Telemetri</span>
                    </button>
                  </li>

                  {/* P2H Baru */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('p2h'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'p2h'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'p2h'
                          ? 'bg-gradient-to-tl from-slate-800 to-slate-900 text-white'
                          : 'bg-white/70 shadow-soft-sm text-slate-700'
                      }`}>
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <span>Formulir P2H Baru</span>
                    </button>
                  </li>

                  {/* Log P2H */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('log'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'log'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'log'
                            ? 'bg-gradient-to-tl from-emerald-600 to-teal-400 text-white'
                            : 'bg-white/70 shadow-soft-sm text-slate-700'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <span>Log & Arsip P2H</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white/70 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200/50">
                        {p2hRecords.length}
                      </span>
                    </button>
                  </li>

                  {/* Log Charging */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('charging_log'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'charging_log'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'charging_log'
                          ? 'bg-gradient-to-tl from-amber-500 to-orange-400 text-white'
                          : 'bg-white/70 shadow-soft-sm text-slate-700'
                      }`}>
                        <BatteryCharging className="w-4 h-4" />
                      </div>
                      <span>Log EV Charging</span>
                    </button>
                  </li>

                  {/* Temuan Kerusakan (Requirement 2) */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('damage_findings'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'damage_findings'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                        activeNav === 'damage_findings'
                          ? 'bg-gradient-to-tl from-amber-600 to-rose-500 text-white'
                          : 'bg-white/70 shadow-soft-sm text-slate-700'
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span>Temuan Kerusakan</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Group 2: ARMADA & MANAJEMEN */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-2 font-mono">
                  ARMADA & MANAJEMEN
                </span>
                <ul className="space-y-1">
                  {/* Daftar Unit */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('units'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'units'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'units'
                            ? 'bg-gradient-to-tl from-purple-700 to-pink-500 text-white'
                            : 'bg-white/70 shadow-soft-sm text-slate-700'
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <span>Daftar Unit Fleet</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white/70 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200/50">
                        {vehicles.length}
                      </span>
                    </button>
                  </li>

                  {/* Akun */}
                  <li>
                    <button
                      type="button"
                      onClick={() => { setActiveNav('account'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeNav === 'account'
                          ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                          : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'account'
                            ? 'bg-gradient-to-tl from-rose-500 to-pink-500 text-white'
                            : 'bg-white/70 shadow-soft-sm text-slate-700'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <span>Profil & Hak Akses</span>
                      </div>
                      {isAdmin && (
                        <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase font-mono shadow-xs">
                          Admin
                        </span>
                      )}
                    </button>
                  </li>

                  {/* Pengaturan (Admin) */}
                  {isAdmin && (
                    <li>
                      <button
                        type="button"
                        onClick={() => { setActiveNav('settings'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeNav === 'settings'
                            ? 'bg-white/95 shadow-soft-xl text-slate-900 border border-white/80'
                            : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-soft-2xl shrink-0 ${
                          activeNav === 'settings'
                            ? 'bg-gradient-to-tl from-slate-600 to-slate-800 text-white'
                            : 'bg-white/70 shadow-soft-sm text-slate-700'
                        }`}>
                          <Cog className="w-4 h-4" />
                        </div>
                        <span>Pengaturan Sistem</span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>

          {/* Sidenav Bottom Help Widget Card (Creative Tim style) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-tl from-slate-900 via-slate-800 to-slate-900 text-white shadow-soft-xl relative overflow-hidden mt-3">
            <div className="relative z-10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <span className="font-bold text-xs block text-white">CATL LFP 88.02 kWh</span>
                <span className="text-[10px] text-slate-300 block">JAC T9 EV 4x4 Double Cabin</span>
              </div>
              <button
                type="button"
                onClick={() => { setActiveNav('p2h'); setEditingForm(null); setIsMobileMenuOpen(false); }}
                className="w-full py-1.5 px-3 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-soft-sm text-center block"
              >
                + Buat P2H Baru
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT CANVAS (SHIFTED ON DESKTOP VIA xl:ml-72) */}
      <div className="xl:ml-72 min-h-screen p-4 xl:p-6 flex flex-col justify-between transition-all duration-300">
        
        {/* TOP FLOATING GLASSMORPHIC NAVBAR (Relative position so it scrolls up with main menu/content per request #7) */}
        <nav className={`relative z-30 mb-3 sm:mb-6 ${glassNavbarStyle} p-2.5 sm:p-4 flex items-center justify-between gap-1.5 sm:gap-3 shadow-soft-sm`}>
          
          {/* Left: Breadcrumbs & Page Title (Clean & single-line on mobile per request #4) */}
          <div className="min-w-0 flex-1">
            <nav aria-label="breadcrumb">
              <ol className="hidden sm:flex flex-wrap pt-0 mr-12 bg-transparent rounded-lg sm:mr-16 text-slate-400 text-xs">
                <li className="leading-normal">
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveNav('dashboard'); }} className="opacity-50 hover:opacity-100 text-slate-700">Pages</a>
                </li>
                <li className="text-xs pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-slate-400 before:content-['/']" aria-current="page">
                  {NAV_LABELS[activeNav] || activeNav}
                </li>
              </ol>
              <h6 className="mb-0 font-extrabold capitalize text-slate-800 text-xs sm:text-base tracking-tight truncate max-w-[120px] sm:max-w-none">
                {NAV_LABELS[activeNav] || activeNav}
              </h6>
            </nav>
          </div>

          {/* Right: Actions, Cloud Sync, Bell & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Realtime Status Indicator & Manual Sync Button */}
            <button
              type="button"
              onClick={handleForceSync}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono shadow-soft-xxs border cursor-pointer transition-all ${
                syncStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : syncStatus === 'syncing' || isManualSyncing
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title={`Status Cloud Sync: ${syncStatus === 'connected' ? 'Aktif (Real-Time)' : syncStatus} · Terakhir: ${lastSyncTime || 'Baru saja'}. Klik untuk sinkronisasi paksa.`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || syncStatus === 'syncing' ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} />
              <span className="font-bold hidden sm:inline">
                {isManualSyncing ? 'Syncing...' : syncStatus === 'connected' ? 'Cloud Sync' : 'Offline'}
              </span>
            </button>

            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              currentUser={activeUser}
              onMarkAsRead={id => {
                const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
                setNotifications(updated);
                realtimeSync.pushUpdate({ notifications: updated });
              }}
              onMarkAllAsRead={() => {
                const updated = notifications.map(n => ({ ...n, read: true }));
                setNotifications(updated);
                realtimeSync.pushUpdate({ notifications: updated });
              }}
              onQuickApprove={handleQuickApproveFromBell}
              onViewForm={formId => {
                const target = p2hRecords.find(r => r.id === formId);
                if (target) {
                  setPrintableForm(target);
                }
              }}
            />

            {/* User Profile Pill Badge */}
            <button
              onClick={() => setActiveNav('account')}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 bg-white border border-slate-200 shadow-soft-xxs rounded-xl transition-all text-xs text-left cursor-pointer hover:bg-slate-50"
              title={`Masuk sebagai: ${activeUser.name} (@${activeUser.username || activeUser.nik})`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tl from-blue-700 to-cyan-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-soft-sm shrink-0">
                {(activeUser.name || 'Admin').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden md:block">
                <span className="font-bold text-slate-800 block text-xs leading-tight truncate max-w-28">
                  {activeUser.name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block leading-tight uppercase font-bold">
                  {activeUser.role}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 rounded-xl transition-colors shadow-soft-xxs cursor-pointer bg-white"
              title="Keluar dari Aplikasi (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 rounded-xl xl:hidden cursor-pointer shadow-soft-xxs border border-slate-200 bg-white"
              title="Buka Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>

        {/* MOBILE STACKED GRID QUICK NAVIGATION (Request #2 & reference image 4 - stacked under header) */}
        <div className="xl:hidden grid grid-cols-3 gap-2 mb-4 p-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-soft-xs">
          <button
            type="button"
            onClick={() => { setActiveNav('dashboard'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'dashboard' ? 'bg-gradient-to-tl from-blue-700 to-cyan-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveNav('p2h'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'p2h'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'p2h' ? 'bg-gradient-to-tl from-slate-800 to-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">Form P2H</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveNav('log'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'log'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'log' ? 'bg-gradient-to-tl from-emerald-600 to-teal-400 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="truncate">Log P2H</span>
              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1 rounded-full">
                {p2hRecords.length}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setActiveNav('charging_log'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'charging_log'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'charging_log' ? 'bg-gradient-to-tl from-amber-500 to-orange-400 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <BatteryCharging className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">Charging</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveNav('units'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'units'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'units' ? 'bg-gradient-to-tl from-purple-700 to-pink-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <Truck className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">Armada</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveNav('account'); setEditingForm(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeNav === 'account'
                ? 'bg-white shadow-soft-md text-slate-900 border border-slate-200'
                : 'bg-white/70 text-slate-700 hover:bg-white/90 border border-white/50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
              activeNav === 'account' ? 'bg-gradient-to-tl from-rose-500 to-pink-500 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className="truncate w-full text-center">Profil</span>
          </button>
        </div>

        {/* MAIN BODY VIEW */}
        <main className="w-full flex-1 space-y-6">
          {/* 0. HALAMAN UTAMA DASHBOARD */}
          {activeNav === 'dashboard' && (
            <DashboardView
              vehicles={vehicles}
              records={p2hRecords}
              settings={settings}
              currentUser={activeUser}
              onUpdateSettings={handleUpdateSettings}
              onNavigate={nav => setActiveNav(nav)}
              onCreateP2H={() => {
                setEditingForm(null);
                setActiveNav('p2h');
              }}
            />
          )}

          {/* 1. HALAMAN P2H */}
          {activeNav === 'p2h' && (
            <P2HFormEditor
              vehicles={vehicles}
              initialForm={editingForm}
              currentUser={activeUser}
              allUsers={allUsers}
              onSave={handleSaveP2H}
              onCancel={() => {
                setEditingForm(null);
                setActiveNav('log');
              }}
            />
          )}

          {/* 2. HALAMAN LOG P2H */}
          {activeNav === 'log' && (
            <P2HLogView
              records={p2hRecords}
              vehicles={vehicles}
              settings={settings}
              currentUser={activeUser}
              onEditRecord={record => {
                setEditingForm(record);
                setActiveNav('p2h');
              }}
              onDeleteRecord={handleDeleteP2H}
              onDeleteAllRecords={handleDeleteAllP2H}
              onPrintRecord={record => setPrintableForm(record)}
              onDownloadPdfRecord={record => setPrintableForm(record)}
              onCreateNew={() => {
                setEditingForm(null);
                setActiveNav('p2h');
              }}
            />
          )}

          {/* 2.5 HALAMAN LOG EV CHARGING */}
          {activeNav === 'charging_log' && (
            <ChargingLogView
              records={p2hRecords}
              vehicles={vehicles}
              settings={settings}
            />
          )}

          {/* 2.6 HALAMAN TEMUAN KERUSAKAN & CATATAN DRIVER */}
          {activeNav === 'damage_findings' && (
            <DamageFindingsView
              records={p2hRecords}
              vehicles={vehicles}
              settings={settings}
              currentUser={activeUser}
              onUpdateRecord={handleUpdateRecordOnly}
              onEditRecord={record => {
                setEditingForm(record);
                setActiveNav('p2h');
              }}
              onPrintRecord={record => setPrintableForm(record)}
            />
          )}

          {/* 3. HALAMAN DAFTAR UNIT (CRUD) */}
          {activeNav === 'units' && (
            <UnitManagerView
              vehicles={vehicles}
              settings={settings}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {/* 4. HALAMAN MANAJEMEN AKUN */}
          {activeNav === 'account' && (
            <AccountProfileView
              currentUser={activeUser}
              allUsers={allUsers}
              settings={settings}
              onSwitchUser={handleSwitchUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {/* 5. HALAMAN PENGATURAN (KHUSUS ADMIN) */}
          {activeNav === 'settings' && (
            <SettingsView
              settings={settings}
              currentUser={activeUser}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>

        {/* SOFT UI FOOTER */}
        <footer className="mt-8 py-4 no-print text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/60">
          <p className="mb-0">
            © 2026, built with Creative Tim Soft UI style for <span className="font-bold text-slate-700">PT MULIABARA MINING</span> · JAC T9 EV Fleet
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>F-QHSE-OPS-MOB-09</span>
            <span>·</span>
            <span>CATL 88.02 kWh</span>
            <span>·</span>
            <span>Site Kutai</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
