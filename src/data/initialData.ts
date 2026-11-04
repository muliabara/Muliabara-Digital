import { P2HFormRecord, VehicleUnit, MaintenanceLog } from '../types/p2h';

export const INITIAL_VEHICLES: VehicleUnit[] = [
  {
    id: 'veh_1',
    unitNumber: 'LV-EV-01',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8142 JQ',
    vin: 'LJ13A9B26P0019283',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 12480,
    currentSoc: 82,
    cumulativeKwh: 2860,
    lastServiceKwh: 1500,
    nextServiceKwh: 3000,
    status: 'operating',
    assignedDriver: 'Budi Santoso',
    location: 'Pit Utara - Mining Sector A',
    skoExpiry: '2026-12-15',
    photoUrl: '/assets/images/jac_t9_ev_pickup_1793024478024.jpg'
  },
  {
    id: 'veh_2',
    unitNumber: 'LV-EV-02',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8143 JQ',
    vin: 'LJ13A9B26P0019284',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 5120,
    currentSoc: 94,
    cumulativeKwh: 1180,
    lastServiceKwh: 0,
    nextServiceKwh: 1500,
    status: 'ready',
    assignedDriver: 'Ahmad Fauzi',
    location: 'Central Workshop - Main Yard',
    skoExpiry: '2027-02-28',
    photoUrl: '/assets/images/jac_t9_ev_truck_1792914872311.jpg'
  },
  {
    id: 'veh_3',
    unitNumber: 'LV-EV-03',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8145 JQ',
    vin: 'LJ13A9B26P0019287',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 26800,
    currentSoc: 76,
    cumulativeKwh: 6150,
    lastServiceKwh: 3000,
    nextServiceKwh: 6000,
    status: 'maintenance_due',
    assignedDriver: 'Rudi Hermawan',
    location: 'ROM Pad Hauling Road KM 12',
    skoExpiry: '2026-11-20',
    photoUrl: '/assets/images/jac_t9_ev_pickup_1793024478024.jpg'
  },
  {
    id: 'veh_4',
    unitNumber: 'LV-EV-04',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8148 JQ',
    vin: 'LJ13A9B26P0019290',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 8950,
    currentSoc: 88,
    cumulativeKwh: 2040,
    lastServiceKwh: 1500,
    nextServiceKwh: 3000,
    status: 'ready',
    assignedDriver: 'Dedi Kurniawan',
    location: 'Port Terminal Jetty 2',
    skoExpiry: '2027-01-10',
    photoUrl: '/assets/images/jac_t9_ev_truck_1792914872311.jpg'
  }
];

export const INITIAL_P2H_RECORDS: P2HFormRecord[] = [
  {
    id: 'p2h_rec_001',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-11-04T07:00:00.000Z',
    updatedAt: '2026-11-04T07:15:00.000Z',
    operatorName: 'Budi Santoso',
    operatorNik: 'OPR-8821',
    date: '2026-11-04',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Pit Utara - Mining Sector A',
    jobSite: 'Tambang Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4 Double Cabin',
    unitNumber: 'LV-EV-01',
    skoExpiryDate: '2026-12-15',
    startKm: 12400,
    endKm: 12480,
    startSoc: 100,
    endSoc: 82,
    batteryCapacityKwh: 88.02,
    charging: {
      percentCharged: 80,
      energyAddedKwh: 70.42,
      estimatedRangeKm: 320,
      chargingLocation: 'SPKLU Main Workshop Yard'
    },
    totalKm: 80,
    batteryUsedPercent: 18,
    energyConsumedKwh: 15.84,
    consumptionRateKwhPerKm: 0.2,
    costSavingsIdr: 185000,
    co2ReductionKg: 14.2,
    driverCondition: {
      idCardExpiry: '2027-05-10',
      simperExpiry: '2026-12-15',
      items: {
        item_1: 'ya',
        item_2: 'ya',
        item_3: 'ya',
        item_4: 'ya'
      },
      notes: {}
    },
    inspections: {
      check_skid_plate: { status: 'normal' },
      check_battery_harness: { status: 'normal' },
      check_ccs2_socket: { status: 'normal' },
      check_brake_system: { status: 'normal' },
      check_tires: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Semua komponen HV dan pelindung baterai dalam kondisi aman.',
      mechanicName: 'Irwan Setiawan',
      mechanicNik: 'MECH-004'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Pemeriksaan lengkap dan disetujui untuk operasi shift 1.',
      foremanName: 'Ahmad Fauzi',
      foremanNik: 'SPV-102',
      approvedAt: '2026-11-04T07:15:00.000Z'
    },
    operatorSignature: {
      agreed: true,
      submittedAt: '2026-11-04T07:15:00.000Z'
    }
  },
  {
    id: 'p2h_rec_002',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-11-03T19:00:00.000Z',
    updatedAt: '2026-11-03T19:20:00.000Z',
    operatorName: 'Rudi Hermawan',
    operatorNik: 'OPR-9042',
    date: '2026-11-03',
    shift: 'Shift 2 (Malam)',
    workLocation: 'ROM Pad Hauling Road KM 12',
    jobSite: 'Tambang Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4 Double Cabin',
    unitNumber: 'LV-EV-03',
    skoExpiryDate: '2026-11-20',
    startKm: 26710,
    endKm: 26800,
    startSoc: 95,
    endSoc: 76,
    batteryCapacityKwh: 88.02,
    charging: {
      percentCharged: 50,
      energyAddedKwh: 44.01,
      estimatedRangeKm: 200,
      chargingLocation: 'SPKLU Hauling KM 12'
    },
    totalKm: 90,
    batteryUsedPercent: 19,
    energyConsumedKwh: 16.72,
    consumptionRateKwhPerKm: 0.19,
    costSavingsIdr: 205000,
    co2ReductionKg: 15.8,
    driverCondition: {
      idCardExpiry: '2027-08-20',
      simperExpiry: '2026-11-20',
      items: {
        item_1: 'ya',
        item_2: 'ya',
        item_3: 'ya'
      },
      notes: {}
    },
    inspections: {
      check_skid_plate: { status: 'normal' },
      check_battery_harness: { status: 'normal' },
      check_ccs2_socket: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Unit layak operasi.',
      mechanicName: 'Irwan Setiawan',
      mechanicNik: 'MECH-004'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui untuk shift malam.',
      foremanName: 'Ahmad Fauzi',
      foremanNik: 'SPV-102',
      approvedAt: '2026-11-03T19:20:00.000Z'
    },
    operatorSignature: {
      agreed: true,
      submittedAt: '2026-11-03T19:20:00.000Z'
    }
  }
];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [];
