import React, { useState, useEffect } from 'react';
import { AppSettings, UserProfile } from '../types/p2h';
import { 
  Palette, 
  Type, 
  Pencil,
  Edit3, 
  Image as ImageIcon, 
  Save, 
  RotateCcw, 
  Check, 
  Upload, 
  Building2, 
  Sparkles,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Truck,
  ShieldCheck,
  BatteryCharging,
  Cog,
  FileCheck
} from 'lucide-react';
import { playSound, playTriggerSound, SoundProfile } from '../utils/audio';
import { getGlassCardClass } from '../utils/glass';

interface SettingsViewProps {
  settings: AppSettings;
  currentUser?: UserProfile;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

// 12 Industrial EV Theme Colors (Requirement 8)
export const COLOR_PRESETS = [
  { id: 'blue', name: 'Electric Blue (Default)', hex: '#0284c7', desc: 'Standar EV Mobilitas Modern' },
  { id: 'orange', name: 'Mining Amber (Safety)', hex: '#ea580c', desc: 'Warna K3 Keselamatan Tambang' },
  { id: 'green', name: 'Emerald Safety (K3)', hex: '#16a34a', desc: 'Standar K3 Hijau Lingkungan' },
  { id: 'slate', name: 'Industrial Slate (Dark)', hex: '#334155', desc: 'Gaya Industri Berat Elegan' },
  { id: 'red', name: 'Crimson Hazard (Red)', hex: '#dc2626', desc: 'Kontras Tinggi & Perhatian Penuh' },
  { id: 'cyan', name: 'Cyber Cyan (Teal EV)', hex: '#06b6d4', desc: 'Nuansa Kendaraan Listrik Futuristik' },
  { id: 'purple', name: 'Midnight Violet (Tech)', hex: '#7c3aed', desc: 'Modern High-Tech Automotive' },
  { id: 'amber', name: 'Solar Gold (Mining Sun)', hex: '#d97706', desc: 'Emas Sinar Tambang Energi' },
  { id: 'dark', name: 'Carbon Titanium (Onyx)', hex: '#1e293b', desc: 'Serat Karbon Glossy Premium' },
  { id: 'forest', name: 'Eco Forest (Deep Green)', hex: '#15803d', desc: 'Zero Emission Mining Fleet' },
  { id: 'cobalt', name: 'Deep Cobalt (Royal)', hex: '#2563eb', desc: 'Armada Eksklusif Korporasi' },
  { id: 'rose', name: 'Rose Copper (Metallic)', hex: '#be185d', desc: 'Tembaga Metalik Anodized' }
];

export const FONT_PRESETS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Standar)', desc: 'Modern geometric sans, sangat jelas di layar mobile dan desktop.' },
  { id: 'DM Sans', name: 'DM Sans (Kompak)', desc: 'Desain bersih dan hemat ruang horizontal untuk form panjang.' },
  { id: 'Outfit', name: 'Outfit (Teknologi EV)', desc: 'Karakteristik display modern bernuansa kendaraan masa depan.' },
  { id: 'Manrope', name: 'Manrope (Industrial)', desc: 'Presisi tinggi untuk data teknis, telemetri, dan audit K3.' }
];

export const APP_ICONS = [
  { id: 'lightning', label: 'Petir EV Listrik', icon: Zap },
  { id: 'truck', label: 'Unit Light Vehicle', icon: Truck },
  { id: 'shield', label: 'Perisai K3 Tambang', icon: ShieldCheck },
  { id: 'battery', label: 'Baterai CATL 88kWh', icon: BatteryCharging },
  { id: 'gear', label: 'Fleet Maintenance', icon: Cog }
];

export const SOUND_PRESETS = [
  { id: 'modern_chime', name: 'Modern Chime (Rekomendasi)', desc: 'Dua nada melodik futuristik yang elegan' },
  { id: 'subtle_click', name: 'Subtle Click', desc: 'Klik taktil mekanikal cepat dan lembut' },
  { id: 'electric_pulse', name: 'Electric Pulse', desc: 'Sapuan frekuensi tinggi akselerasi motor EV' },
  { id: 'safety_beep', name: 'Mining Safety Beep', desc: 'Dua beep khas sistem keselamatan operasional' },
  { id: 'mute', name: 'Senyap (Tanpa Suara)', desc: 'Interaksi tanpa suara' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin' || currentUser.role === 'Master Admin';

  // State with LocalStorage Fallback for Icon & Sound Persistence (Requirement 7 & 9)
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#0284c7');
  const [themePreset, setThemePreset] = useState(settings.themePreset || 'blue');
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'Plus Jakarta Sans');
  const [companyName, setCompanyName] = useState(settings.companyName || 'SUN MOBILITY');
  const [tagline, setTagline] = useState(settings.tagline || 'LIGHT VEHICLE EV FLEET');
  const [appTitle, setAppTitle] = useState(settings.appTitle || 'JAC T9 EV');
  
  // Requirement 7: Fix icon persistence
  const [appIcon, setAppIcon] = useState<'lightning' | 'truck' | 'shield' | 'battery' | 'gear' | 'custom'>(() => {
    const saved = localStorage.getItem('jac_app_icon');
    return (saved as any) || settings.appIcon || 'lightning';
  });
  
  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    const saved = localStorage.getItem('jac_app_logo_url');
    return saved || settings.logoUrl;
  });

  // Requirement 9: Interaction Sound State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jac_sound_enabled');
    return saved !== null ? saved === 'true' : (settings.soundEnabled ?? true);
  });

  const [soundProfile, setSoundProfile] = useState<SoundProfile>(() => {
    const saved = localStorage.getItem('jac_sound_profile');
    return (saved as SoundProfile) || settings.soundProfile || 'modern_chime';
  });

  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient' | 'image'>(settings.backgroundMode || 'gradient');
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(settings.backgroundImage);
  const [blurLevel, setBlurLevel] = useState<'none' | 'low' | 'medium' | 'high' | 'ultra'>(settings.blurLevel || 'medium');
  const [glassIntensity, setGlassIntensity] = useState<'low' | 'medium' | 'high' | 'ultra'>(settings.glassIntensity || 'medium');
  const [backgroundBlurNumber, setBackgroundBlurNumber] = useState<number>(settings.backgroundBlurNumber ?? 8);

  // Hero text customization (strictly Master Admin)
  const isMasterAdmin = !currentUser || currentUser.role === 'Master Admin' || currentUser.role === 'admin';
  const [heroSubTitle, setHeroSubTitle] = useState<string>(settings.heroSubTitle || 'PT MULIABARA MINING · SISTEM K3 EV');
  const [heroDocNumber, setHeroDocNumber] = useState<string>(settings.heroDocNumber || 'F-QHSE-OPS-MOB-09');
  const [heroMainTitle, setHeroMainTitle] = useState<string>(settings.heroMainTitle || 'JAC T9 EV 4x4 Double Cabin · Smart Fleet Management');
  const [heroDescription, setHeroDescription] = useState<string>(settings.heroDescription || 'Sistem pemeriksaan harian terpadu unit Light Vehicle Electric Vehicle dengan verifikasi multi-peran (Master Admin, Pengawas, Driver). Memantau langsung kondisi skid plate pelindung baterai, sistem tegangan tinggi 350V, insulasi soket CCS2, dan efisiensi konsumsi kWh di site tambang Kutai.');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const glassCard = getGlassCardClass({ ...settings, glassIntensity, blurLevel });

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm my-8">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Akses Terbatas: Khusus Administrator
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Hanya akun dengan peran Administrator (Admin) yang memiliki kewenangan untuk mengatur konfigurasi tema, warna, logo perusahaan, dan pengaturan sistem aplikasi.
        </p>
      </div>
    );
  }

  const handleColorPresetChange = (preset: typeof COLOR_PRESETS[0]) => {
    setThemePreset(preset.id);
    setPrimaryColor(preset.hex);
    playTriggerSound();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoUrl(result);
        setAppIcon('custom');
        localStorage.setItem('jac_app_logo_url', result);
        localStorage.setItem('jac_app_icon', 'custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconSelect = (iconId: 'lightning' | 'truck' | 'shield' | 'battery' | 'gear' | 'custom') => {
    setAppIcon(iconId);
    localStorage.setItem('jac_app_icon', iconId);
    playTriggerSound();
  };

  const handleTestSound = (profileToTest: SoundProfile) => {
    playSound(profileToTest, 0.6);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Persistent Storage Guarantee (Requirement 7 & 9)
    localStorage.setItem('jac_app_icon', appIcon);
    if (logoUrl) {
      localStorage.setItem('jac_app_logo_url', logoUrl);
    } else {
      localStorage.removeItem('jac_app_logo_url');
    }
    localStorage.setItem('jac_sound_enabled', String(soundEnabled));
    localStorage.setItem('jac_sound_profile', soundProfile);

    const updated: AppSettings = {
      primaryColor,
      themePreset,
      fontFamily,
      companyName,
      tagline,
      logoUrl,
      appTitle,
      appIcon,
      soundEnabled,
      soundProfile,
      backgroundMode,
      backgroundImage,
      blurLevel,
      glassIntensity,
      backgroundBlurNumber,
      heroSubTitle,
      heroDocNumber,
      heroMainTitle,
      heroDescription
    };

    onUpdateSettings(updated);
    playTriggerSound();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    const defaults: AppSettings = {
      primaryColor: '#0284c7',
      themePreset: 'blue',
      fontFamily: 'Plus Jakarta Sans',
      companyName: 'SUN MOBILITY',
      tagline: 'LIGHT VEHICLE EV FLEET',
      logoUrl: undefined,
      appTitle: 'JAC T9 EV',
      appIcon: 'lightning',
      soundEnabled: true,
      soundProfile: 'modern_chime',
      backgroundMode: 'gradient',
      backgroundImage: undefined,
      blurLevel: 'medium',
      glassIntensity: 'medium',
      backgroundBlurNumber: 8,
      heroSubTitle: 'PT MULIABARA MINING · SISTEM K3 EV',
      heroDocNumber: 'F-QHSE-OPS-MOB-09',
      heroMainTitle: 'JAC T9 EV 4x4 Double Cabin · Smart Fleet Management',
      heroDescription: 'Sistem pemeriksaan harian terpadu unit Light Vehicle Electric Vehicle dengan verifikasi multi-peran (Master Admin, Pengawas, Driver). Memantau langsung kondisi skid plate pelindung baterai, sistem tegangan tinggi 350V, insulasi soket CCS2, dan efisiensi konsumsi kWh di site tambang Kutai.'
    };

    setPrimaryColor(defaults.primaryColor);
    setThemePreset(defaults.themePreset);
    setFontFamily(defaults.fontFamily);
    setCompanyName(defaults.companyName);
    setTagline(defaults.tagline);
    setAppTitle(defaults.appTitle);
    setLogoUrl(undefined);
    setAppIcon('lightning');
    setSoundEnabled(true);
    setSoundProfile('modern_chime');
    setBackgroundMode('gradient');
    setBackgroundImage(undefined);
    setBlurLevel('medium');
    setGlassIntensity('medium');
    setBackgroundBlurNumber(8);
    setHeroSubTitle(defaults.heroSubTitle!);
    setHeroDocNumber(defaults.heroDocNumber!);
    setHeroMainTitle(defaults.heroMainTitle!);
    setHeroDescription(defaults.heroDescription!);

    localStorage.removeItem('jac_app_logo_url');
    localStorage.setItem('jac_app_icon', 'lightning');
    localStorage.setItem('jac_sound_enabled', 'true');
    localStorage.setItem('jac_sound_profile', 'modern_chime');

    onUpdateSettings(defaults);
    playTriggerSound();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className={`${glassCard} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                KUSTOMISASI SISTEM & AUDIO
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase">
                TEMA, ICON & SUARA INTERAKSI
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              Pengaturan Tampilan, Icon & Suara Pemberitahuan
            </h1>
            <p className="text-xs text-slate-500">
              Pilihan warna tema glossy, ikon aplikasi permanen, tipografi, dan audio umpan balik interaksi pengguna.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengaturan tema, icon, dan suara pemberitahuan berhasil disimpan permanen!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: WARNA TEMA (12 Pilihan Warna - Requirement 8) */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Pilihan Warna Tema Glossy Header (12 Pilihan Warna)
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Aktif: {primaryColor}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COLOR_PRESETS.map(preset => {
              const isSelected = primaryColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleColorPresetChange(preset)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/25 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs shadow-xs"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </span>
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {preset.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block">
                      {preset.hex} · {preset.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">Warna Kustom Hex Bebas:</span>
            <input
              type="color"
              value={primaryColor}
              onChange={e => {
                setPrimaryColor(e.target.value);
                setThemePreset('custom');
              }}
              className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => {
                setPrimaryColor(e.target.value);
                setThemePreset('custom');
              }}
              className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded font-bold uppercase"
            />
          </div>
        </div>

        {/* SECTION 2: SUARA PEMBERITAHUAN INTERAKSI (Requirement 9) */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Suara Pemberitahuan Interaksi & Tombol
              </h2>
            </div>
            
            {/* Toggle Enable/Disable Sound */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <span>Efek Audio:</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={e => {
                  setSoundEnabled(e.target.checked);
                  if (e.target.checked) playSound(soundProfile);
                }}
                className="w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
              <span className={`text-[11px] px-2 py-0.5 rounded ${soundEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                {soundEnabled ? 'Aktif' : 'Mute'}
              </span>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Pemberitahuan suara akan diputar saat Driver simpan & ajukan formulir, tombol navigasi diklik, atau saat Pengawas/Admin memberikan persetujuan (Approve).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOUND_PRESETS.map(sound => {
              const isSelected = soundProfile === sound.id;
              return (
                <div
                  key={sound.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20' 
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={() => {
                      setSoundProfile(sound.id as SoundProfile);
                      handleTestSound(sound.id as SoundProfile);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {sound.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 rounded">
                          DIPILIH
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sound.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestSound(sound.id as SoundProfile)}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                    title="Dengarkan Contoh Suara Ini"
                  >
                    <Play className="w-3 h-3 fill-amber-900" />
                    <span>Tes</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: PENGATURAN ICON & LOGO PERUSAHAAN (Requirement 7) */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">
                3. Icon Aplikasi Permanen & Logo Perusahaan
              </h2>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Tersimpan Permanen
            </span>
          </div>

          {/* Preset App Icons */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-2">
              Pilihan Icon Aplikasi (Ditampilkan di Header & Menu Utama):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {APP_ICONS.map(item => {
                const IconComponent = item.icon;
                const isSelected = appIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleIconSelect(item.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 text-sky-700 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <IconComponent className="w-4 h-4 text-sky-600" />
                    </div>
                    <span className="text-[11px] font-bold block leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Logo Upload */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block font-bold text-slate-700 text-xs mb-1">
              Atau Gunakan Logo Kustom Perusahaan (PNG/JPG/SVG):
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload Logo Baru
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl(undefined);
                    setAppIcon('lightning');
                    localStorage.removeItem('jac_app_logo_url');
                    localStorage.setItem('jac_app_icon', 'lightning');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Hapus Logo (Kembali ke Icon Standar)
                </button>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              <div 
                className="w-14 h-12 rounded-lg flex items-center justify-center shadow-sm text-white overflow-hidden p-1 border border-white/20"
                style={{ backgroundColor: primaryColor }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-white flex items-center justify-center font-bold text-xs">
                    {appIcon === 'truck' && <Truck className="w-5 h-5" />}
                    {appIcon === 'shield' && <ShieldCheck className="w-5 h-5" />}
                    {appIcon === 'battery' && <BatteryCharging className="w-5 h-5" />}
                    {appIcon === 'gear' && <Cog className="w-5 h-5" />}
                    {(!appIcon || appIcon === 'lightning') && <Zap className="w-5 h-5" />}
                  </div>
                )}
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 block text-sm">{appTitle}</span>
                <span className="text-slate-500 block font-medium">{companyName} · {tagline}</span>
                <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">
                  ✓ Icon dan logo ini tersimpan permanen di perangkat & server
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields: Perusahaan & Judul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="SUN MOBILITY"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sub-Judul / Divisi</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="LIGHT VEHICLE EV FLEET"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Judul Navigasi Utama</label>
              <input
                type="text"
                value={appTitle}
                onChange={e => setAppTitle(e.target.value)}
                placeholder="JAC T9 EV"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: TIPOGRAFI / FONT */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Type className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              4. Pilihan Tipografi & Jenis Huruf (Font Family)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FONT_PRESETS.map(font => {
              const isSelected = fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    setFontFamily(font.id as any);
                    playTriggerSound();
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  style={{ fontFamily: font.id }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">
                      {font.name}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {font.desc}
                  </p>
                  <div className="mt-3 text-xs font-medium text-slate-700 bg-white/80 p-2 rounded border border-slate-100 font-mono">
                    JAC T9 EV · 12,480 KM · 88.02 kWh · K3 Mining Fleet
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: GLASS GLOSSY & BACKGROUND CUSTOMIZATION */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              5. Tampilan Glass Glossy, Background & Efek Blur
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Background Mode */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Mode Background Utama:</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'solid', label: 'Solid Color', desc: 'Warna solid bersih' },
                  { id: 'gradient', label: 'Gradien Mewah', desc: 'Gradien dinamis elegan' },
                  { id: 'image', label: 'Upload Gambar Kustom', desc: 'Gambar latar belakang sendiri' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setBackgroundMode(mode.id as any);
                      playTriggerSound();
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      backgroundMode === mode.id
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 text-sky-800 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold">{mode.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Upload (if mode === 'image') */}
            {backgroundMode === 'image' && (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
                <label className="block font-bold text-slate-700">Upload Gambar Latar Belakang (Background Image):</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    Pilih Berkas Gambar
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setBackgroundImage(reader.result as string);
                            playTriggerSound();
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {backgroundImage && (
                    <button
                      type="button"
                      onClick={() => setBackgroundImage(undefined)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>
                {backgroundImage && (
                  <div className="w-full h-28 rounded-lg overflow-hidden border border-slate-200 relative">
                    <img 
                      src={backgroundImage} 
                      alt="Background preview" 
                      className="w-full h-full object-cover" 
                      style={{ filter: `blur(${backgroundBlurNumber}px)` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Background Image Blur & Solid Control */}
            {backgroundMode === 'image' && (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Tingkat Blur Background (0px - 30px):</label>
                  <span className="font-mono font-bold text-sky-700 text-xs">{backgroundBlurNumber}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={backgroundBlurNumber}
                  onChange={e => setBackgroundBlurNumber(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Geser ke kanan untuk membuat background ter-blur hingga lembut/solid, atau ke kiri untuk tajam.
                </span>
              </div>
            )}

            {/* Blur Level */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Tingkat Efek Blur (Backdrop Blur):</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'none', label: 'Tanpa Blur' },
                  { id: 'low', label: 'Rendah (Sm)' },
                  { id: 'medium', label: 'Sedang (Md)' },
                  { id: 'high', label: 'Tinggi (Lg)' },
                  { id: 'ultra', label: 'Maksimal (Xl)' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBlurLevel(b.id as any);
                      playTriggerSound();
                    }}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer text-xs ${
                      blurLevel === b.id
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 text-sky-800 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Glass Intensity */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Intensitas Transparansi Glass (Dari Rendah ke Tinggi):</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'low', label: 'Rendah (Solid Glossy)' },
                  { id: 'medium', label: 'Sedang (Balanced Glass)' },
                  { id: 'high', label: 'Tinggi (Translucent)' },
                  { id: 'ultra', label: 'Ultra (Crystal Clear)' }
                ].map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGlassIntensity(g.id as any);
                      playTriggerSound();
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-center transition-all cursor-pointer text-xs ${
                      glassIntensity === g.id
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 text-sky-800 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block font-bold">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: INFORMASI HERO CARD DASHBOARD (Khusus Master Admin) */}
        <div className={`${glassCard} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">
                6. Teks Informasi Hero Dashboard (Kustomisasi Kartu Utama)
              </h2>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Khusus Master Admin
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Kustomisasi seluruh teks header, nomor dokumen SOP, model armada, dan ringkasan sistem pada kartu Hero Dashboard. Perubahan ini juga dapat diubah langsung dari tombol pensil pada kartu Dashboard.
          </p>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sub-Judul / Identitas Perusahaan & K3:
                </label>
                <input
                  type="text"
                  value={heroSubTitle}
                  onChange={e => setHeroSubTitle(e.target.value)}
                  disabled={!isMasterAdmin}
                  placeholder="PT MULIABARA MINING · SISTEM K3 EV"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Dokumen / Form SOP:
                </label>
                <input
                  type="text"
                  value={heroDocNumber}
                  onChange={e => setHeroDocNumber(e.target.value)}
                  disabled={!isMasterAdmin}
                  placeholder="F-QHSE-OPS-MOB-09"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Judul Utama Hero (Model Kendaraan / Fleet Title):
              </label>
              <input
                type="text"
                value={heroMainTitle}
                onChange={e => setHeroMainTitle(e.target.value)}
                disabled={!isMasterAdmin}
                placeholder="JAC T9 EV 4x4 Double Cabin · Smart Fleet Management"
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Deskripsi / Keterangan Sistem K3 EV:
              </label>
              <textarea
                rows={3}
                value={heroDescription}
                onChange={e => setHeroDescription(e.target.value)}
                disabled={!isMasterAdmin}
                placeholder="Sistem pemeriksaan harian terpadu unit Light Vehicle Electric Vehicle..."
                className="w-full text-xs text-slate-700 leading-relaxed px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Submit & Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99]"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" />
            Simpan Seluruh Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
