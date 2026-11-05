import * as XLSX from 'xlsx';
import { P2HFormRecord } from '../types/p2h';
import { getEffectiveRecordMetrics } from './telemetry';

/**
 * Export P2H inspection records to native Microsoft Excel (.xlsx) file
 */
export function exportP2HLogToExcel(records: P2HFormRecord[], filename?: string) {
  const data = records.map(r => {
    const eff = getEffectiveRecordMetrics(r);
    return {
      'ID Form': r.id,
      'No Dokumen': r.docNumber || 'F-QHSE-OPS-MOB-09',
      'Tanggal': r.date,
      'Shift': r.shift,
      'No Unit': r.unitNumber,
      'Model Unit': r.unitModel,
      'Lokasi Worksite': r.workLocation,
      'Job Site': r.jobSite,
      'Operator / Driver': r.operatorName,
      'NIK Operator': r.operatorNik,
      'KM Awal': r.startKm,
      'KM Akhir': r.endKm,
      'Total KM': eff.totalKm,
      'SOC Awal (%)': r.startSoc,
      'SOC Akhir (%)': r.endSoc,
      'Status Baterai': eff.socLabel,
      'Baterai Terpakai / Selisih (%)': eff.batteryUsedPercent,
      'Konsumsi Energi (kWh)': eff.energyConsumedKwh,
      'Efisiensi (kWh/km)': eff.consumptionRateKwhPerKm,
      'Charging Terisi (%)': r.charging?.percentCharged || 0,
      'Charging Terisi (kWh)': r.charging?.energyAddedKwh || 0,
      'Lokasi Charging': r.charging?.chargingLocation || '-',
      'Estimasi Hemat BBM (Rp)': r.costSavingsIdr || 0,
      'Reduksi CO2 (kg)': r.co2ReductionKg || 0,
      'Status P2H': r.overallStatus === 'approved' ? 'Disetujui' : r.overallStatus === 'pending_approval' ? 'Menunggu Foreman' : r.overallStatus === 'needs_maintenance' ? 'Perlu Mekanik' : r.overallStatus === 'rejected' ? 'Ditolak' : r.overallStatus,
      'Foreman Approver': r.foremanApproval?.foremanName || '-',
      'Foreman Status': r.foremanApproval?.status || 'pending',
      'Catatan Driver / Temuan': r.driverFindingNotes || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for clear professional Excel readability
  const colWidths = [
    { wch: 22 }, // ID Form
    { wch: 20 }, // No Dokumen
    { wch: 12 }, // Tanggal
    { wch: 16 }, // Shift
    { wch: 12 }, // No Unit
    { wch: 25 }, // Model Unit
    { wch: 26 }, // Lokasi Worksite
    { wch: 16 }, // Job Site
    { wch: 20 }, // Operator
    { wch: 14 }, // NIK Operator
    { wch: 10 }, // KM Awal
    { wch: 10 }, // KM Akhir
    { wch: 10 }, // Total KM
    { wch: 13 }, // SOC Awal
    { wch: 13 }, // SOC Akhir
    { wch: 16 }, // Status Baterai
    { wch: 22 }, // Baterai Terpakai
    { wch: 22 }, // Konsumsi Energi
    { wch: 18 }, // Efisiensi
    { wch: 18 }, // Charging %
    { wch: 20 }, // Charging kWh
    { wch: 26 }, // Lokasi Charging
    { wch: 22 }, // Hemat BBM
    { wch: 16 }, // Reduksi CO2
    { wch: 18 }, // Status P2H
    { wch: 20 }, // Foreman Approver
    { wch: 15 }, // Foreman Status
    { wch: 30 }  // Catatan Driver
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Log P2H EV');

  const todayStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `Log_Riwayat_P2H_JAC_T9_EV_${todayStr}.xlsx`;

  XLSX.writeFile(workbook, finalFilename);
}

/**
 * Export EV charging log sessions to native Microsoft Excel (.xlsx) file
 */
export function exportChargingLogToExcel(sessions: any[], filename?: string) {
  const data = sessions.map(s => ({
    'ID Form': s.id,
    'Tanggal Sesi': s.date,
    'Shift Operasional': s.shift,
    'No Unit Fleet': s.unitNumber,
    'Operator / Driver': s.operatorName,
    'NIK Operator': s.operatorNik,
    'Persentase Charging (%)': s.percentCharged,
    'Daya Terisi (kWh)': s.energyAddedKwh,
    'Estimasi Penambahan Jarak (KM)': s.estimatedRangeKm,
    'Estimasi Biaya PLN (Rp)': Math.round(s.energyAddedKwh * 2475),
    'Lokasi SPKLU / Charging Station': s.chargingLocation
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 22 }, // ID Form
    { wch: 14 }, // Tanggal
    { wch: 18 }, // Shift
    { wch: 14 }, // Unit
    { wch: 22 }, // Operator
    { wch: 14 }, // NIK
    { wch: 22 }, // Charging %
    { wch: 18 }, // Daya kWh
    { wch: 28 }, // Est Jarak
    { wch: 22 }, // Biaya PLN
    { wch: 30 }  // Lokasi SPKLU
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Log EV Charging');

  const todayStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `Log_EV_Charging_SPKLU_JAC_T9_${todayStr}.xlsx`;

  XLSX.writeFile(workbook, finalFilename);
}
