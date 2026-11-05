import { P2HFormRecord } from '../types/p2h';

export interface EffectiveMetrics {
  batteryUsedPercent: number;
  socChangePercent: number;
  isNetGain: boolean;
  energyConsumedKwh: number;
  consumptionRateKwhPerKm: number;
  totalKm: number;
  socLabel: string;
}

const DEFAULT_EV_KWH_PER_KM = 0.267; // Baseline efficiency for JAC T9 EV (88.02 kWh / 330 km)

/**
 * Calculates effective telemetry metrics for a P2H form record:
 * 1. Jika Baterai (SOC) awal > Baterai (SOC) akhir (Discharging):
 *    - SOC Terpakai = SOC awal - SOC akhir
 *    - Energi Konsumsi (kWh) = SOC Terpakai (kWh) (+ Charging kWh jika ada)
 * 2. Jika Baterai (SOC) awal < Baterai (SOC) akhir (Recharged / Net Gain):
 *    - Label SOC = "Bertambah +X%"
 *    - Energi Konsumsi Driver (kWh): jika Cas kWh > SOC Rise kWh, hasilnya Charging kWh - SOC Rise kWh.
 *      Jika Cas kWh <= SOC Rise kWh (atau cas parsial) dan jarak tempuh > 0 (misal: +7 KM), energi mengemudi dihitung realistis dari KM tempuh (KM x 0.267 kWh/km).
 */
export function getEffectiveRecordMetrics(record: P2HFormRecord): EffectiveMetrics {
  const totalKm = Math.max(0, (record.endKm || 0) - (record.startKm || 0));
  const capacity = record.batteryCapacityKwh || 88.02;
  
  const startSoc = record.startSoc || 0;
  const endSoc = record.endSoc || 0;

  const chargingPercent = record.charging?.percentCharged || 0;
  const chargingKwh = record.charging?.energyAddedKwh ?? Number(((chargingPercent / 100) * capacity).toFixed(2));

  let energyConsumedKwh = 0;
  let batteryUsedPercent = 0;
  let isNetGain = false;
  let socLabel = '';

  if (startSoc > endSoc) {
    // 1. SOC Baterai Berkurang (Penggunaan Normal)
    batteryUsedPercent = startSoc - endSoc;
    isNetGain = false;
    socLabel = `Terpakai ${batteryUsedPercent}%`;
    const socDropKwh = (batteryUsedPercent / 100) * capacity;

    if (chargingKwh > 0) {
      energyConsumedKwh = Number((socDropKwh + chargingKwh).toFixed(2));
    } else {
      energyConsumedKwh = Number(socDropKwh.toFixed(2));
    }
  } else if (startSoc < endSoc) {
    // 2. SOC Baterai Bertambah (Ada Charging)
    const socRisePercent = endSoc - startSoc;
    const socRiseKwh = (socRisePercent / 100) * capacity;
    isNetGain = true;
    socLabel = `Bertambah +${socRisePercent}%`;

    if (chargingKwh > socRiseKwh) {
      // Total cas lebih besar dari kenaikan simpanan baterai -> selisihnya terpakai mengemudi
      energyConsumedKwh = Number((chargingKwh - socRiseKwh).toFixed(2));
    } else if (totalKm > 0) {
      // Jika cas tercatat <= kenaikan SOC dan kendaraan menempuh jarak (> 0 KM, contoh +7 KM),
      // hitung konsumsi mengemudi realistis agar energi tidak bernilai 0 kWh saat kendaraan bergerak
      energyConsumedKwh = Number((totalKm * DEFAULT_EV_KWH_PER_KM).toFixed(2));
    } else {
      energyConsumedKwh = 0;
    }
    batteryUsedPercent = socRisePercent;
  } else {
    // 3. startSoc == endSoc
    if (chargingKwh > 0) {
      energyConsumedKwh = Number(chargingKwh.toFixed(2));
      socLabel = `Stabil (${endSoc}%)`;
    } else if (totalKm > 0) {
      energyConsumedKwh = Number((totalKm * DEFAULT_EV_KWH_PER_KM).toFixed(2));
      socLabel = `Stabil (${endSoc}%)`;
    } else {
      energyConsumedKwh = 0;
      socLabel = `Stabil (${endSoc}%)`;
    }
  }

  const consumptionRateKwhPerKm = totalKm > 0 ? Number((energyConsumedKwh / totalKm).toFixed(3)) : 0;

  return {
    batteryUsedPercent,
    socChangePercent: endSoc - startSoc,
    isNetGain,
    energyConsumedKwh,
    consumptionRateKwhPerKm,
    totalKm,
    socLabel
  };
}
