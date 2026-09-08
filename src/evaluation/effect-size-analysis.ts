import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";
import {
    buildMatchedComparisons
} from "./matched-analysis";

export type EffectSizeResult = {
  system: BaselineSystem;

  sampleSize: number;

  meanControlDrainRate: number;

  meanInterventionDrainRate: number;

  meanDrainReduction: number;

  meanDrainReductionPercent: number;

  standardDeviationOfEffect: number;

  standardError: number;

  confidenceIntervalLower: number;

  confidenceIntervalUpper: number;

  cohensDz: number;

  interpretation: string;
};

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);

  const squaredDifferences = values.reduce(
    (sum, value) => sum + Math.pow(value - average, 2),
    0,
  );

  return Math.sqrt(squaredDifferences / (values.length - 1));
}

export function calculateMatchedEffectSize(
  records: ExperimentalRecord[],
  system: BaselineSystem,
): EffectSizeResult {
  const comparisons = buildMatchedComparisons(records, system);

  const effects = comparisons.map(
    (comparison) => comparison.batteryDrainReduction,
  );

  const sampleSize = effects.length;

  const meanDrainReduction = mean(effects);

  const standardDeviationOfEffect = sampleStandardDeviation(effects);

  const standardError =
    sampleSize > 0 ? standardDeviationOfEffect / Math.sqrt(sampleSize) : 0;

  const confidenceIntervalMargin = 1.96 * standardError;

  const confidenceIntervalLower = meanDrainReduction - confidenceIntervalMargin;

  const confidenceIntervalUpper = meanDrainReduction + confidenceIntervalMargin;

  const meanControlDrainRate = mean(
    comparisons.map((comparison) => comparison.controlDrainRate),
  );

  const meanInterventionDrainRate = mean(
    comparisons.map((comparison) => comparison.interventionDrainRate),
  );

  const meanDrainReductionPercent = mean(
    comparisons.map((comparison) => comparison.batteryDrainReductionPercent),
  );

  const cohensDz =
    standardDeviationOfEffect > 0
      ? meanDrainReduction / standardDeviationOfEffect
      : 0;

  let interpretation = "Insufficient matched trials for effect estimation.";

  if (sampleSize >= 2) {
    if (meanDrainReduction > 0) {
      interpretation = `Intervention reduced measured battery drain by an average of ${meanDrainReduction.toFixed(
        4,
      )} percentage points per minute compared with matched control trials.`;
    } else if (meanDrainReduction < 0) {
      interpretation = `Intervention produced higher measured battery drain by an average of ${Math.abs(
        meanDrainReduction,
      ).toFixed(
        4,
      )} percentage points per minute compared with matched control trials.`;
    } else {
      interpretation =
        "No average difference in measured battery drain was observed between intervention and matched control trials.";
    }
  }

  return {
    system,

    sampleSize,

    meanControlDrainRate,

    meanInterventionDrainRate,

    meanDrainReduction,

    meanDrainReductionPercent,

    standardDeviationOfEffect,

    standardError,

    confidenceIntervalLower,

    confidenceIntervalUpper,

    cohensDz,

    interpretation,
  };
}

export function calculateAllMatchedEffectSizes(
  records: ExperimentalRecord[],
): EffectSizeResult[] {
  const systems: BaselineSystem[] = [
    "battery_only",
    "rule_based",
    "behaviour_aware",
    "personalized",
  ];

  return systems.map((system) => calculateMatchedEffectSize(records, system));
}
