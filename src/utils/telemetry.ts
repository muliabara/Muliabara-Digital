import { P2HFormRecord } from '../types/p2h';

export interface EffectiveMetrics {
  batteryUsedPercent: number;
  energyConsumedKwh: number;
  consumptionRateKwhPerKm: number;
  totalKm: number;
}

/**
 * Calculates effective telemetry metrics for a P2H form record based on exact rules:
 * 1. Jika Baterai (SOC) awal > Baterai (SOC) akhir maka: Baterai (SOC) awal dikurangi Baterai (SOC) akhir (dalam kWh).
 * 2. Jika Baterai (SOC) awal < Baterai (SOC) akhir maka: Baterai (SOC) akhir (dalam kWh) dikurangi jumlah kWh Charging terisi.
 */
export function getEffectiveRecordMetrics(record: P2HFormRecord): EffectiveMetrics {
  const totalKm = Math.max(0, (record.endKm || 0) - (record.startKm || 0));
  const capacity = record.batteryCapacityKwh || 88.02;
  const chargingPercent = record.charging?.percentCharged || 0;
  const chargingKwh = record.charging?.energyAddedKwh ?? Number(((chargingPercent / 100) * capacity).toFixed(2));
  
  const startSoc = record.startSoc || 0;
  const endSoc = record.endSoc || 0;

  let energyConsumedKwh = 0;
  let batteryUsedPercent = 0;

  if (startSoc > endSoc) {
    // 1. Jika SOC awal > SOC akhir: SOC awal - SOC akhir (konversi ke kWh)
    batteryUsedPercent = startSoc - endSoc;
    energyConsumedKwh = Number(((batteryUsedPercent / 100) * capacity).toFixed(2));
  } else if (startSoc < endSoc) {
    // 2. Jika SOC awal < SOC akhir: SOC akhir (kWh) dikurangi jumlah kWh Charging terisi
    const endSocKwh = (endSoc / 100) * capacity;
    energyConsumedKwh = Number(Math.max(0, endSocKwh - chargingKwh).toFixed(2));
    batteryUsedPercent = Number(((energyConsumedKwh / capacity) * 100).toFixed(1));
  } else {
    // Jika startSoc == endSoc
    if (chargingKwh > 0) {
      const endSocKwh = (endSoc / 100) * capacity;
      energyConsumedKwh = Number(Math.max(0, endSocKwh - chargingKwh).toFixed(2));
      batteryUsedPercent = Number(((energyConsumedKwh / capacity) * 100).toFixed(1));
    } else {
      energyConsumedKwh = 0;
      batteryUsedPercent = 0;
    }
  }

  const consumptionRateKwhPerKm = totalKm > 0 ? Number((energyConsumedKwh / totalKm).toFixed(3)) : 0;

  return {
    batteryUsedPercent,
    energyConsumedKwh,
    consumptionRateKwhPerKm,
    totalKm
  };
}
