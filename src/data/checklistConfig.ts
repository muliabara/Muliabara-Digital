export interface ChecklistItemDef {
  id: string;
  code: string;
  label: string;
  subText?: string;
  category: 'driver' | 'critical' | 'non_critical';
  section: string;
  subItems?: { id: string; label: string }[];
}

export const DRIVER_CONDITIONS: ChecklistItemDef[] = [
  {
    id: 'drv_1',
    code: '1',
    label: 'Membawa SID & SIMPER (valid)',
    subText: 'Wajib membawa kartu SID & SIMPER yang masih berlaku aktif',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_2',
    code: '2',
    label: 'Memahami Golden Rules #1 & #2',
    subText: 'Kepatuhan mutlak terhadap aturan keselamatan operasional tambang/site',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_3a',
    code: '3.a',
    label: 'Waktu tidur minimal 6 jam dalam 24 jam terakhir',
    subText: 'Istirahat cukup untuk mencegah micro-sleep saat mengemudi',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_3b',
    code: '3.b',
    label: 'Pikiran saya fokus pada pekerjaan di shift ini',
    subText: 'Siap mental, konsentrasi penuh dan waspada selama berkendara',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_3c',
    code: '3.c',
    label: 'Bebas dari pengaruh obat / Alkohol',
    subText: 'Tidak mengonsumsi alkohol atau obat yang menyebabkan kantuk (Fit to Work)',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_3d',
    code: '3.d',
    label: 'Bebas dari masalah pribadi yang mengganggu keselamatan kerja',
    subText: 'Kondisi emosi stabil dan tidak terdistraksi masalah berat',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_4',
    code: '4',
    label: 'Driver memahami risiko High Voltage (Tegangan Tinggi)',
    subText: 'Paham prosedur keselamatan EV, kabel oranye bertegangan tinggi 350V, dan area terlarang disentuh',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  },
  {
    id: 'drv_5',
    code: '5',
    label: 'Driver memahami risiko Silent Vehicle (Kendaraan Senyap)',
    subText: 'Menyadari bahwa kendaraan listrik tidak bersuara keras; wajib waspada pejalan kaki & gunakan klakson saat blind spot',
    category: 'driver',
    section: 'A. KONDISI DRIVER (FIT TO WORK)'
  }
];

export const CRITICAL_INSPECTIONS: ChecklistItemDef[] = [
  {
    id: 'crit_1',
    code: '1',
    label: 'Tingkat Kecukupan Baterai Daya (SOC) State Of Charge',
    subText: 'SOC ≥ 20% WAJIB diisi daya mencegah mogok di area kerja, pengisian maksimal 99%',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_2',
    code: '2',
    label: 'Permukaan Baterai Daya / Underbody Protective Plate',
    subText: 'Pelat pelindung baterai bawah bebas dari benturan batu, goresan dalam, retak, atau kebocoran elektrolit',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_3',
    code: '3',
    label: 'Sistem Pendingin EV (Baterai, Motor Traksi, Inverter)',
    subText: 'Level coolant baterai dan radiator inverter di batas normal, tidak ada rembesan atau bocor selang',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_4',
    code: '4',
    label: 'Indikator Sistem Tegangan Tinggi (High Voltage System)',
    subText: 'Tidak ada warning light kebocoran isolasi atau error HV pada dashboard, lampu READY hijau normal',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_5',
    code: '5',
    label: 'Panel Kontrol / Digital Cluster Display',
    subText: 'Layar cluster digital jelas, indikator siap jalan (READY), SOC akurat, odometer dan speedometer normal',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_6',
    code: '6',
    label: 'Ban & Baut Roda (Tire & Wheel Assembly)',
    subText: 'Tekanan ban sesuai (35-40 PSI), kembangan tapak tidak aus tipis, baut roda terpasang kuat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_7',
    code: '7',
    label: 'Semua Rem (Foot Brake, Regenerative Brake, Parking Brake, Emergency)',
    subText: 'Pengereman mekanik pakem, deselerasi regenerative responsif, rem tangan elektrik (EPB) mengunci mantap',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_8',
    code: '8',
    label: 'Sistem Kemudi (Electric Power Steering - EPS)',
    subText: 'Putaran setir ringan merata, tidak bunyi geretak, tidak menarik ke satu sisi saat jalan lurus',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_9',
    code: '9',
    label: 'Sabuk Pengaman (Seatbelt 3-Point Driver & Penumpang)',
    subText: 'Sabuk menarik lancar, mengunci seketika saat ditarik hentak, buckle mengunci klik kuat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_10',
    code: '10',
    label: 'Kepala Tuas Pemindah Gigi / Drive Mode Selector (P, R, N, D)',
    subText: 'Perpindahan mode P, R, N, D presisi dan transisi lock tombol mulus tanpa hentakan kasar',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_11',
    code: '11',
    label: 'Klakson (Main Electric Horn)',
    subText: 'Suara nyaring jelas terdengar dari kejauhan untuk peringatan di area proyek/tambang',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_12',
    code: '12',
    label: 'Alarm Mundur (Acoustic Reverse Warning / AVAS)',
    subText: 'Buzzer mundur otomatis berbunyi intermittent saat transmisi diposisikan ke R',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_13_1',
    code: '13.1',
    label: 'Lampu Depan (Lampu Utama Jauh & Dekat, Lampu Kota / DRL)',
    subText: 'Menyala terang, mika lampu tidak pecah atau berembun berat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_13_2',
    code: '13.2',
    label: 'Lampu Sein Depan & Belakang serta Lampu Hazard',
    subText: 'Semua lampu kedip sein kiri, kanan, dan tombol darurat hazard berfungsi sinkron',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_13_3',
    code: '13.3',
    label: 'Lampu Rem (Brake Lamp) & Lampu Mundur (Reverse Light)',
    subText: 'Menyala merah terang saat pedal rem diinjak dan lampu putih menyala saat mundur',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_14',
    code: '14',
    label: 'Lampu Strobe / Rotary Amber (Mine Safety Beacon)',
    subText: 'Lampu putar/strobe oranye di atas kabin berkedip terang wajib untuk visibilitas tambang',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_15',
    code: '15',
    label: 'Buggy Whip (Tiang Bendera Safety dengan Lampu Puncak LED)',
    subText: 'Tiang tegak kokoh terpasang, bendera oranye utuh, LED ujung tiang menyala',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_16',
    code: '16',
    label: 'Kaca Spion (Kanan, Kiri, dan Spion Tengah Kabin)',
    subText: 'Kaca utuh, pandangan jelas ke samping dan belakang, pengatur sudut elektrik bekerja',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_17',
    code: '17',
    label: 'Radio Komunikasi Dua Arah (Rig / Two-Way Radio VHF/UHF)',
    subText: 'Dapat menerima dan memancar di channel koordinasi shift / pit tambang dengan jernih',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_18',
    code: '18',
    label: 'APAR (Alat Pemadam Api Ringan CO₂ atau Dry Chemical Powder)',
    subText: 'Jarum indikator tekanan di zona hijau, segel pengaman terpasang, tabung tidak berkarat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_19',
    code: '19',
    label: 'Port & Tutup Pengisian Daya (Charging Port CCS2 & Seal)',
    subText: 'Socket pin pengisian bersih dari air, lumpur, dan kotoran; penutup kedap terkunci rapat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_20',
    code: '20',
    label: 'Kabel & Konektor Pengisian Daya Portable EVSE',
    subText: 'Kabel charger tidak terkelupas atau terlipat parah, pin colokan bersih tanpa tanda hangus panas',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_21_1',
    code: '21.1',
    label: 'Periksa Baterai 12V: Kebersihan Fisik Baterai 12V',
    subText: 'Bebas dari penumpukan lumpur, debu pekat, atau tumpahan cairan di atas aki',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_21_2',
    code: '21.2',
    label: 'Periksa Baterai 12V: Kondisi & Kekencangan Terminal Kutub (+/-)',
    subText: 'Terminal klem terpasang kuat, tidak goyang dan mur pengikat kencang',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_21_3',
    code: '21.3',
    label: 'Periksa Baterai 12V: Kabel & Koneksi (Bebas Longgar & Korosi Jamur)',
    subText: 'Kutub aki bebas dari kerak sulfatasi putih/hijau dan pelindung karet kutub terpasang',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_22',
    code: '22',
    label: 'Safety / Traffic Cone (Tersedia Minimal 2 Buah)',
    subText: 'Tersedia cone oranye reflektif di bak belakang untuk pengamanan saat parkir atau darurat',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  },
  {
    id: 'crit_23',
    code: '23',
    label: 'Ganjal Ban / Wheel Chocks (Tersedia Minimal 2 Buah)',
    subText: 'Ganjal roda dari karet/poliuretana tahan beban tersedia dalam kondisi bagus untuk medan miring',
    category: 'critical',
    section: 'B. PEMERIKSAAN KRITIS – ELECTRIC & SAFETY SYSTEM'
  }
];

export const NON_CRITICAL_INSPECTIONS: ChecklistItemDef[] = [
  {
    id: 'non_1',
    code: '1',
    label: 'Wiper & Semprotan Air Pembersih Kaca (Washer Pump)',
    subText: 'Karet bilah wiper lentur tidak robek, sapuan bersih, air washer menyemprot lancar',
    category: 'non_critical',
    section: 'C. PEMERIKSAAN ITEM NON KRITIS'
  },
  {
    id: 'non_2',
    code: '2',
    label: 'Suspensi - Periksa Sambungan Pegas Daun & Peredam Kejut',
    subText: 'Per daun tidak patah, bushing tidak retak getas, peredam kejut tidak bocor oli hidrolik',
    category: 'non_critical',
    section: 'C. PEMERIKSAAN ITEM NON KRITIS'
  },
  {
    id: 'non_3',
    code: '3',
    label: 'Perlengkapan Kotak P3K (First Aid Kit)',
    subText: 'Kotak P3K terpasang di kabin, isi lengkap (kasa, plester, antiseptik) dan belum kedaluwarsa',
    category: 'non_critical',
    section: 'C. PEMERIKSAAN ITEM NON KRITIS'
  },
  {
    id: 'non_4',
    code: '4',
    label: 'Wheel Nut Indicator (Panah Indikator Mur Roda)',
    subText: 'Indikator segitiga terpasang di semua baut roda dengan orientasi saling berhadapan rapi',
    category: 'non_critical',
    section: 'C. PEMERIKSAAN ITEM NON KRITIS'
  }
];

export const ALL_CHECKLIST_ITEMS = [
  ...DRIVER_CONDITIONS,
  ...CRITICAL_INSPECTIONS,
  ...NON_CRITICAL_INSPECTIONS
];

// Maintenance Tiers specifically tuned for JAC T9 EV (CATL LFP 88.02 kWh)
export const JAC_T9_MAINTENANCE_TIERS = [
  {
    tierId: 'pm_1',
    name: 'PM-1 (Servis Awal EV)',
    intervalKwh: 1500,
    intervalKmEquivalent: 10000,
    priority: 'routine' as const,
    description: 'Pemeriksaan rutin sistem tegangan tinggi awal, balance sel baterai & torsi sasis tambang',
    scope: [
      'Pengecekan fisik dan resistansi insulasi kabel oranye High Voltage (HV Cable)',
      'Kalibrasi dan pembacaan Delta Voltage sel baterai CATL 88.02 kWh via BMS Tool',
      'Pemeriksaan level dan sirkulasi fluida pendingin inverter & motor listrik traksi',
      'Pemeriksaan torsi baut roda (140 Nm) dan indikator baut roda (Wheel Nut Indicator)',
      'Inspeksi visual underbody protective skid plate pelindung baterai dari benturan batu',
      'Pembersihan filter debu intake baterai dan saringan pendingin kabin HEPA'
    ]
  },
  {
    tierId: 'pm_2',
    name: 'PM-2 (Servis Berkala Drivetrain & Rem)',
    intervalKwh: 3000,
    intervalKmEquivalent: 20000,
    priority: 'important' as const,
    description: 'Penggantian oli gardan/reducer, pemeliharaan sistem rem regeneratif & uji aki 12V',
    scope: [
      'Penggantian oli roda gigi reduksi (Electric Drivetrain Reducer Gear Oil GL-5)',
      'Pembersihan dan pelumasan kaliper rem cakram 4 roda (mencegah macet akibat lumpur)',
      'Pengujian fungsi deselerasi rem regeneratif dan kalibrasi sensor pedal rem',
      'Pengujian kapasitas beban dan internal resistance baterai auxiliary 12V DC',
      'Pemeriksaan dan pelumasan universal joint propeller shaft dan tierod kemudi',
      'Pemeriksaan segel tahan air konektor CCS2 dan uji isolasi ground safety'
    ]
  },
  {
    tierId: 'pm_3',
    name: 'PM-3 (Servis Menengah Fluida Pendingin)',
    intervalKwh: 6000,
    intervalKmEquivalent: 40000,
    priority: 'important' as const,
    description: 'Penggantian coolant sistem baterai, minyak rem DOT 4 LV & inspeksi suspensi berat',
    scope: [
      'Pengurasan dan penggantian total fluida pendingin baterai (Dielectric EV Coolant)',
      'Penggantian minyak rem sintetis DOT 4 Low Viscosity untuk respons rem regeneratif',
      'Pemeriksaan keausan bushing suspensi heavy-duty, ball joint, dan daun pegas belakang',
      'Uji ketahanan insulasi Megger Test 1000V DC seluruh kompartemen motor & inverter',
      'Inspeksi soket charging DC Fast Charging dan uji termal saat pengisian arus tinggi',
      'Pembaruan firmware modul kontrol kendaraan (VCU) dan kalibrasi sensor torsi 4x4'
    ]
  },
  {
    tierId: 'pm_major',
    name: 'PM-Major (Audit Menyeluruh Baterai & HV)',
    intervalKwh: 12000,
    intervalKmEquivalent: 80000,
    priority: 'critical' as const,
    description: 'Audit State of Health (SOH) baterai, overhaul kontaktor HV & rekondisi komponen site',
    scope: [
      'Audit menyeluruh State of Health (SOH) dan kapasitas sisa pack baterai traksi',
      'Pemeriksaan resistansi kontak kontaktor relay tegangan tinggi (Main HV Contactors)',
      'Overhaul dan penggantian seal pelindung debu/air kompartemen motor listrik ganda',
      'Servis dan penggantian oli kompresor AC elektrik tegangan tinggi',
      'Penggantian karet penopang motor mount dan peredam getaran inverter traksi',
      'Pengujian dinamometer traksi 4WD dan sertifikasi ulang kelaikan operasi unit tambang'
    ]
  }
];
