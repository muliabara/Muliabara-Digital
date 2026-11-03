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

export const INITIAL_P2H_RECORDS: P2HFormRecord[] = [];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [];
