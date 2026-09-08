import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";
import {
    calculateMean,
    calculateStandardDeviation,
} from "./statistical-analysis";

export type BatterySystemMetrics = {
  system: BaselineSystem;

  sampleCount: number;

  meanBatteryDelta: number;
  meanDrainRate: number;

  standardDeviationDrainRate: number;

  minimumDrainRate: number;
  maximumDrainRate: number;
};

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

export function calculateBatteryMetrics(
  system: BaselineSystem,
  records: ExperimentalRecord[],
): BatterySystemMetrics {
  const drainRates = records.map((record) => record.batteryDrainRate);

  const batteryDeltas = records.map((record) => record.batteryDelta);

  const standardDeviation = calculateStandardDeviation(drainRates);

  return {
    system,

    sampleCount: records.length,

    meanBatteryDelta: round(calculateMean(batteryDeltas)),

    meanDrainRate: round(calculateMean(drainRates)),

    standardDeviationDrainRate: round(standardDeviation),

    minimumDrainRate:
      drainRates.length > 0 ? round(Math.min(...drainRates)) : 0,

    maximumDrainRate:
      drainRates.length > 0 ? round(Math.max(...drainRates)) : 0,
  };
}
