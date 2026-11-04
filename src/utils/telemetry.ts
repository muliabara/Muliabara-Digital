import { P2HFormRecord } from '../types/p2h';

export interface EffectiveMetrics {
  batteryUsedPercent: number;
  energyConsumedKwh: number;
  consumptionRateKwhPerKm: number;
  totalKm: number;
}

/**
 * Calculates effective telemetry metrics for a P2H form record based on exact rules:
 * 1. Jika Baterai (SOC) awal > Baterai (SOC) akhir maka: SOC awal - SOC akhir (konversi ke kWh).
 * 2. Jika Baterai (SOC) awal < Baterai (SOC) akhir maka: Jumlah energi (kWh) adalah SOC akhir dikurangi SOC awal (konversi ke kWh).
 */
export function getEffectiveRecordMetrics(record: P2HFormRecord): EffectiveMetrics {
  const totalKm = Math.max(0, (record.endKm || 0) - (record.startKm || 0));
  const capacity = record.batteryCapacityKwh || 88.02;
  
  const startSoc = record.startSoc || 0;
  const endSoc = record.endSoc || 0;

  let energyConsumedKwh = 0;
  let batteryUsedPercent = 0;

  if (startSoc < endSoc) {
    // Khusus jika SOC Baterai Awal < SOC Baterai Akhir:
    // Jumlah energi (kWh) adalah SOC akhir dikurangi SOC awal
    batteryUsedPercent = endSoc - startSoc;
    energyConsumedKwh = Number(((batteryUsedPercent / 100) * capacity).toFixed(2));
  } else if (startSoc > endSoc) {
    // Jika SOC Baterai Awal > SOC Baterai Akhir
    batteryUsedPercent = startSoc - endSoc;
    energyConsumedKwh = Number(((batteryUsedPercent / 100) * capacity).toFixed(2));
  } else {
    batteryUsedPercent = 0;
    energyConsumedKwh = 0;
  }

  const consumptionRateKwhPerKm = totalKm > 0 ? Number((energyConsumedKwh / totalKm).toFixed(3)) : 0;

  return {
    batteryUsedPercent,
    energyConsumedKwh,
    consumptionRateKwhPerKm,
    totalKm
  };
}
